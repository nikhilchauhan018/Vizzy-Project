"""
Focused tests for GenerationJob lifecycle, Celery pipeline, checkpoints,
candidate persistence, deterministic prompt compiler, idempotency, and API endpoints.
All tests use mocks for external provider calls — no real credits or network calls.
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.jobs.models import GenerationJob, JobCheckpoint
from apps.jobs.tasks import run_generation_pipeline
from apps.pages.models import Page, Panel, PanelVersion, Candidate
from apps.pages.services.prompt_compiler import compile_prompt
from apps.providers.exceptions import (
    ProviderRateLimitError,
    ProviderUnavailableError,
    ProviderConfigurationError,
)
from apps.providers.capabilities import UnsupportedCapabilityError
from apps.providers.instances import reset_routers_for_testing
from apps.stories.models import Project, StyleBible, Character, Environment

User = get_user_model()


class GenerationJobLifecycleTests(TestCase):
    def setUp(self):
        reset_routers_for_testing()
        self.user = User.objects.create_user(
            email='creator@vizzy.local',
            password='securepassword123',
        )
        self.other_user = User.objects.create_user(
            email='other@vizzy.local',
            password='securepassword123',
        )

        self.project = Project.objects.create(
            owner=self.user,
            title='Cyberpunk Odyssey',
        )
        self.style_bible = StyleBible.objects.create(
            project=self.project,
            art_style='Neo-noir Cyberpunk',
            render_medium='Digital inks',
            palette=['#ff0055', '#00ffff'],
            lighting_default='Volumetric neon glare',
            aspect_ratio='16:9',
        )
        self.character = Character.objects.create(
            project=self.project,
            name='Kaelen',
            role='Protagonist',
            appearance='Cybernetic left arm, dark trenchcoat',
        )
        self.environment = Environment.objects.create(
            project=self.project,
            name='Lower District Alley',
            weather='Acid rain',
            time_of_day='Midnight',
        )

        self.page = Page.objects.create(
            project=self.project,
            page_number='01',
            order=1,
        )
        self.panel = Panel.objects.create(
            page=self.page,
            panel_index=0,
            scene_json={
                'character_ids': [str(self.character.id)],
                'environment_id': str(self.environment.id),
                'action': 'Standing under neon sign',
                'camera': 'Low angle shot',
            },
        )
        self.panel_version = PanelVersion.objects.create(
            panel=self.panel,
            version_number=1,
            prompt_used='',
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        reset_routers_for_testing()

    # 1. GenerationJob creation and QUEUED initial state
    def test_generation_job_creation_and_queued_state(self):
        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
        )
        self.assertEqual(job.status, GenerationJob.JobStatus.QUEUED)
        self.assertEqual(job.current_step, '')
        self.assertFalse(job.has_checkpoint(JobCheckpoint.CheckpointStep.EXTRACT_SCENE))

    # 2. State transition validation and terminal lock
    def test_state_transitions_and_terminal_lock(self):
        job = GenerationJob.objects.create(panel_version=self.panel_version, user=self.user)
        job.transition_to(GenerationJob.JobStatus.RUNNING, current_step='IN_PROGRESS')
        self.assertEqual(job.status, GenerationJob.JobStatus.RUNNING)

        job.transition_to(GenerationJob.JobStatus.DONE, current_step='COMPLETED')
        self.assertEqual(job.status, GenerationJob.JobStatus.DONE)

        # Transitioning away from terminal DONE state must raise ValueError
        with self.assertRaises(ValueError):
            job.transition_to(GenerationJob.JobStatus.RUNNING)

    # 3. Deterministic Prompt Compiler
    def test_deterministic_prompt_compiler(self):
        compiled = compile_prompt(
            style_bible=self.style_bible,
            characters=[self.character],
            environments=[self.environment],
            scene_params=self.panel.scene_json,
        )
        self.assertIn('Neo-noir Cyberpunk', compiled)
        self.assertIn('Kaelen', compiled)
        self.assertIn('Lower District Alley', compiled)
        self.assertIn('Acid rain', compiled)
        self.assertIn('Avoid rendering baked speech bubble text', compiled)

    # 4. Pipeline successful execution: checkpoints, candidate count, DONE state
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_run_generation_pipeline_success(self, mock_exec_image):
        mock_exec_image.return_value = {
            'provider': 'puter',
            'model': 'flux-schnell',
            'image_url': 'https://mock.storage/candidate_1.png',
            'seed': 42,
        }

        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.QUEUED,
        )

        with patch('apps.jobs.services.concurrency_guard.ConcurrencyGuard.release') as mock_release:
            result = run_generation_pipeline(str(job.id), num_candidates=3)
            self.assertEqual(result['status'], 'DONE')
            self.assertEqual(result['candidates_count'], 3)
            mock_release.assert_called_once()

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.JobStatus.DONE)
        self.assertEqual(job.current_step, 'COMPLETED')

        # Checkpoints verified
        self.assertTrue(job.has_checkpoint(JobCheckpoint.CheckpointStep.EXTRACT_SCENE))
        self.assertTrue(job.has_checkpoint(JobCheckpoint.CheckpointStep.COMPILE_PROMPT))
        self.assertTrue(job.has_checkpoint(JobCheckpoint.CheckpointStep.GENERATE_IMAGE))
        self.assertTrue(job.has_checkpoint(JobCheckpoint.CheckpointStep.NOTIFY))

        # Candidates persisted
        self.assertEqual(self.panel_version.candidates.count(), 3)
        self.panel_version.refresh_from_db()
        self.assertEqual(self.panel_version.image_url, 'https://mock.storage/candidate_1.png')

    # 5. Checkpoint resume behavior (does not re-execute completed steps)
    @patch('apps.pages.services.prompt_compiler.compile_prompt')
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_checkpoint_resume_behavior(self, mock_exec_image, mock_compile):
        mock_exec_image.return_value = {'image_url': 'https://mock.storage/resumed.png'}

        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.QUEUED,
        )
        # Pre-record COMPILE_PROMPT checkpoint
        job.record_checkpoint(
            JobCheckpoint.CheckpointStep.COMPILE_PROMPT,
            {'compiled_prompt': 'Pre-compiled prompt from earlier step'},
        )

        run_generation_pipeline(str(job.id), num_candidates=1)

        # compile_prompt should NOT have been called because checkpoint existed
        mock_compile.assert_not_called()
        self.panel_version.refresh_from_db()
        self.assertEqual(self.panel_version.candidates.count(), 1)

    # 6. Idempotency: Running on already DONE job returns immediately
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_idempotency_terminal_job_skipped(self, mock_exec_image):
        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.DONE,
        )
        res = run_generation_pipeline(str(job.id))
        self.assertEqual(res['status'], 'DONE')
        mock_exec_image.assert_not_called()

    # 7. Retryable failure handling
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_pipeline_retryable_failure(self, mock_exec_image):
        mock_exec_image.side_effect = ProviderRateLimitError('Rate budget exceeded', provider_name='puter')

        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.QUEUED,
        )

        with patch.object(run_generation_pipeline, 'retry', side_effect=Exception('TaskRetryTriggered')):
            with self.assertRaises(Exception):
                run_generation_pipeline(str(job.id))

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.JobStatus.FAILED_RETRYABLE)
        self.assertIn('Rate budget exceeded', job.error_message)

    # 8. Permanent failure handling (FAILED_FINAL)
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_pipeline_final_failure(self, mock_exec_image):
        mock_exec_image.side_effect = UnsupportedCapabilityError('Capability not supported')

        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.QUEUED,
        )

        res = run_generation_pipeline(str(job.id))
        self.assertEqual(res['status'], 'FAILED_FINAL')

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.JobStatus.FAILED_FINAL)
        self.assertIn('Capability not supported', job.error_message)

    # 9. API: Unauthenticated generation rejected
    def test_api_unauthenticated_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.post('/api/jobs/generate/', {'panel_id': str(self.panel.id)})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # 10. API: Non-owner forbidden
    def test_api_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.other_user)
        res = self.client.post('/api/jobs/generate/', {'panel_id': str(self.panel.id)})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # 11. API: Successful job generation enqueues and returns HTTP 202
    @patch('apps.jobs.tasks.run_generation_pipeline.delay')
    def test_api_generation_success_http_202(self, mock_delay):
        res = self.client.post('/api/jobs/generate/', {
            'panel_id': str(self.panel.id),
            'prompt_override': 'Dramatic rain lighting',
            'num_candidates': 3,
        })
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn('job_id', res.data)
        self.assertEqual(res.data['status'], 'QUEUED')
        mock_delay.assert_called_once()

    # 12. API: Concurrency guard rejection (HTTP 429)
    @patch('apps.jobs.services.concurrency_guard.ConcurrencyGuard.acquire', return_value=False)
    def test_api_concurrency_guard_rejection(self, mock_acquire):
        res = self.client.post('/api/jobs/generate/', {'panel_id': str(self.panel.id)})
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.data.get('code'), 'concurrency_limit_exceeded')

    # 13. API: Job detail and active jobs tracking
    def test_api_job_detail_and_active_endpoints(self):
        job = GenerationJob.objects.create(
            panel_version=self.panel_version,
            user=self.user,
            status=GenerationJob.JobStatus.QUEUED,
        )
        res_detail = self.client.get(f'/api/jobs/{job.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['id'], str(job.id))
        self.assertEqual(res_detail.data['status'], 'QUEUED')

        res_active = self.client.get('/api/jobs/active/')
        self.assertEqual(res_active.status_code, status.HTTP_200_OK)
        self.assertTrue(any(j['id'] == str(job.id) for j in res_active.data))
