"""
Celery generation pipeline task with checkpoints, idempotency,
concurrency guard, and deterministic prompt compilation.
"""

import logging
from typing import Optional
from celery import shared_task
from django.db import transaction

from apps.jobs.models import GenerationJob, JobCheckpoint
from apps.jobs.services.concurrency_guard import ConcurrencyGuard
from apps.pages.models import Candidate
from apps.pages.services.prompt_compiler import compile_prompt
from apps.providers.exceptions import (
    ProviderRateLimitError,
    ProviderUnavailableError,
    ProviderConfigurationError,
)
from apps.providers.capabilities import UnsupportedCapabilityError
from apps.providers.instances import get_image_router

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def run_generation_pipeline(
    self,
    job_id: str,
    prompt_override: str = '',
    num_candidates: int = 3,
    user_auth_token: Optional[str] = None,
) -> dict:
    """
    Executes the asynchronous GenerationJob pipeline through deterministic checkpoints:
    EXTRACT_SCENE -> COMPILE_PROMPT -> GENERATE_IMAGE -> NOTIFY -> DONE
    """
    try:
        job = GenerationJob.objects.select_related(
            'panel_version__panel__page__project__style_bible',
            'user',
        ).get(id=job_id)
    except GenerationJob.DoesNotExist:
        logger.error(f"GenerationJob {job_id} not found.")
        return {'status': 'error', 'message': 'Job not found'}

    # 1. Idempotency Check: Do not repeat already completed or final failed jobs
    if job.status in GenerationJob.TERMINAL_STATES:
        logger.info(f"GenerationJob {job_id} is already in terminal state {job.status}. Skipping execution.")
        return {'status': job.status, 'job_id': str(job.id)}

    user_id = str(job.user_id) if job.user_id else None

    try:
        # 2. Transition to RUNNING
        if job.status != GenerationJob.JobStatus.RUNNING:
            job.transition_to(GenerationJob.JobStatus.RUNNING, current_step='INITIALIZING')

        panel_version = job.panel_version
        if not panel_version:
            raise ValueError(f"GenerationJob {job_id} is missing an associated panel_version.")

        panel = panel_version.panel
        page = panel.page
        project = page.project

        # --- STEP 1: EXTRACT_SCENE CHECKPOINT ---
        if job.has_checkpoint(JobCheckpoint.CheckpointStep.EXTRACT_SCENE):
            scene_data = job.get_checkpoint(JobCheckpoint.CheckpointStep.EXTRACT_SCENE).get('scene_json', {})
        else:
            scene_data = panel.scene_json or {}
            job.record_checkpoint(JobCheckpoint.CheckpointStep.EXTRACT_SCENE, {'scene_json': scene_data})

        # --- STEP 2: COMPILE_PROMPT CHECKPOINT ---
        if job.has_checkpoint(JobCheckpoint.CheckpointStep.COMPILE_PROMPT):
            compiled_prompt = job.get_checkpoint(JobCheckpoint.CheckpointStep.COMPILE_PROMPT).get('compiled_prompt', '')
        else:
            style_bible = getattr(project, 'style_bible', None)
            characters = list(project.characters.all())
            environments = list(project.environments.all())

            # Only the deterministic prompt compiler merges the bibles and scene
            compiled_prompt = compile_prompt(
                style_bible=style_bible,
                characters=characters,
                environments=environments,
                scene_params=scene_data,
            )
            if prompt_override and prompt_override.strip():
                compiled_prompt = f"{prompt_override.strip()}\n\n{compiled_prompt}" if compiled_prompt else prompt_override.strip()

            with transaction.atomic():
                panel_version.prompt_used = compiled_prompt
                panel_version.save(update_fields=['prompt_used'])
                panel.compiled_prompt = compiled_prompt
                panel.save(update_fields=['compiled_prompt'])

            job.record_checkpoint(JobCheckpoint.CheckpointStep.COMPILE_PROMPT, {'compiled_prompt': compiled_prompt})

        # --- STEP 3: GENERATE_IMAGE CHECKPOINT ---
        if job.has_checkpoint(JobCheckpoint.CheckpointStep.GENERATE_IMAGE):
            candidate_payloads = job.get_checkpoint(JobCheckpoint.CheckpointStep.GENERATE_IMAGE).get('candidates', [])
        else:
            style_bible = getattr(project, 'style_bible', None)
            aspect_ratio = getattr(style_bible, 'aspect_ratio', '16:9') if style_bible else '16:9'
            image_router = get_image_router()

            candidate_payloads = []
            existing_candidates = list(panel_version.candidates.all())
            existing_count = len(existing_candidates)

            for cand in existing_candidates:
                candidate_payloads.append({
                    'id': str(cand.id),
                    'option_index': cand.option_index,
                    'image_url': cand.image_url,
                })

            # Generate remaining candidates up to num_candidates (default 3)
            for i in range(existing_count, num_candidates):
                gen_result = image_router.execute_image(
                    prompt=compiled_prompt,
                    aspect_ratio=aspect_ratio,
                    user_auth_token=user_auth_token,
                )
                image_url = gen_result.get('image_url', '')
                seed = gen_result.get('seed')

                candidate_obj = Candidate.objects.create(
                    panel_version=panel_version,
                    option_index=i,
                    image_url=image_url,
                    seed=seed,
                )
                candidate_payloads.append({
                    'id': str(candidate_obj.id),
                    'option_index': i,
                    'image_url': image_url,
                    'provider': gen_result.get('provider', 'puter'),
                })

                if i == 0 and not panel_version.image_url:
                    panel_version.image_url = image_url
                    panel_version.save(update_fields=['image_url'])

            job.record_checkpoint(JobCheckpoint.CheckpointStep.GENERATE_IMAGE, {'candidates': candidate_payloads})

        # --- STEP 4: NOTIFY CHECKPOINT ---
        if not job.has_checkpoint(JobCheckpoint.CheckpointStep.NOTIFY):
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"project_{project.id}",
                        {
                            'type': 'job_status_update',
                            'job_id': str(job.id),
                            'status': GenerationJob.JobStatus.DONE,
                            'candidates_count': len(candidate_payloads),
                        },
                    )
            except Exception as notify_err:
                logger.info(f"Realtime notification layer offline/skipped: {notify_err}")

            job.record_checkpoint(JobCheckpoint.CheckpointStep.NOTIFY, {'notified': True})

        # --- COMPLETION ---
        job.transition_to(GenerationJob.JobStatus.DONE, current_step='COMPLETED')
        if user_id:
            ConcurrencyGuard.release(user_id, str(job.id))

        return {
            'status': 'DONE',
            'job_id': str(job.id),
            'candidates_count': len(candidate_payloads),
        }

    except (ProviderRateLimitError, ProviderUnavailableError, ConnectionError, TimeoutError) as exc:
        logger.warning(f"Retryable failure on job {job_id}: {exc}")
        job.transition_to(
            GenerationJob.JobStatus.FAILED_RETRYABLE,
            current_step='FAILED_RETRYABLE',
            error_message=str(exc),
        )
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)
        else:
            job.transition_to(
                GenerationJob.JobStatus.FAILED_FINAL,
                current_step='MAX_RETRIES_EXCEEDED',
                error_message=f"Exceeded max retries: {exc}",
            )
            if user_id:
                ConcurrencyGuard.release(user_id, str(job.id))
            return {'status': 'FAILED_FINAL', 'error': str(exc)}

    except (ProviderConfigurationError, UnsupportedCapabilityError, ValueError, Exception) as exc:
        logger.error(f"Permanent failure on job {job_id}: {exc}", exc_info=True)
        job.transition_to(
            GenerationJob.JobStatus.FAILED_FINAL,
            current_step='FAILED_FINAL',
            error_message=str(exc),
        )
        if user_id:
            ConcurrencyGuard.release(user_id, str(job.id))
        return {'status': 'FAILED_FINAL', 'error': str(exc)}
