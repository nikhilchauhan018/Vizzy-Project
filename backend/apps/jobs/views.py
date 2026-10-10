import uuid
from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.billing.services.credit_ledger import CreditLedger, InsufficientCreditsError
from apps.jobs.models import GenerationJob
from apps.jobs.serializers import (
    GenerationJobSerializer,
    GenerationJobCreateSerializer,
)
from apps.jobs.services.concurrency_guard import ConcurrencyGuard
from apps.jobs.tasks import run_generation_pipeline
from apps.pages.models import Panel, PanelVersion


class JobGenerateView(views.APIView):
    """
    Provider-agnostic endpoint to enqueue an asynchronous GenerationJob.
    Validates ownership, enforces per-user concurrency limit, deducts credits, and dispatches Celery task.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = GenerationJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        panel_id = validated.get('panel_id')
        panel_version_id = validated.get('panel_version_id')
        instruction = validated.get('instruction', '')
        prompt_override = validated.get('prompt_override', '')
        num_candidates = validated.get('num_candidates', 3)

        # 1. Resolve Panel & PanelVersion and validate ownership
        panel_version = None
        if panel_version_id:
            panel_version = get_object_or_404(
                PanelVersion.objects.select_related('panel__page__project'),
                id=panel_version_id,
            )
            panel = panel_version.panel
        else:
            panel = get_object_or_404(
                Panel.objects.select_related('page__project'),
                id=panel_id,
            )
            # Create a new version for this panel if none specified
            latest_version = panel.versions.order_by('-version_number').first()
            next_ver_num = (latest_version.version_number + 1) if latest_version else 1
            panel_version = PanelVersion.objects.create(
                panel=panel,
                parent_version=latest_version,
                version_number=next_ver_num,
                prompt_used=prompt_override or panel.compiled_prompt or '',
            )

        # Ensure ownership of the project
        if panel.page.project.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to generate for this project.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        job_uuid = uuid.uuid4()

        # 2. Concurrency Guard Check (Max 2 simultaneous jobs per user)
        acquired = ConcurrencyGuard.acquire(str(request.user.id), str(job_uuid))
        if not acquired:
            return Response(
                {
                    'detail': 'Maximum concurrent generation jobs reached (limit: 2). Please wait for active jobs to complete.',
                    'code': 'concurrency_limit_exceeded',
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # 3. Credit Ledger Check & Deduction
        try:
            CreditLedger.deduct(
                request.user,
                amount=10,
                description=f"Generation job {job_uuid} for panel {panel.id}",
            )
        except InsufficientCreditsError as ice:
            ConcurrencyGuard.release(str(request.user.id), str(job_uuid))
            return Response(
                {
                    'detail': str(ice),
                    'code': 'insufficient_credits',
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # 4. Create GenerationJob in QUEUED state
        job = GenerationJob.objects.create(
            id=job_uuid,
            panel_version=panel_version,
            user=request.user,
            status=GenerationJob.JobStatus.QUEUED,
            current_step='ENQUEUED',
        )

        user_auth_token = request.headers.get('X-Puter-Auth-Token') or None

        # 5. Asynchronously enqueue the Celery pipeline
        try:
            run_generation_pipeline.delay(
                str(job.id),
                instruction=instruction,
                prompt_override=prompt_override,
                num_candidates=num_candidates,
                user_auth_token=user_auth_token,
            )
        except Exception:
            # Fallback if Celery broker/backend is operating synchronously in development/test
            try:
                run_generation_pipeline.apply(
                    args=[str(job.id)],
                    kwargs={
                        'instruction': instruction,
                        'prompt_override': prompt_override,
                        'num_candidates': num_candidates,
                        'user_auth_token': user_auth_token,
                    },
                )
            except Exception:
                # Direct invocation if Celery result backend is offline in development
                run_generation_pipeline(
                    str(job.id),
                    instruction=instruction,
                    prompt_override=prompt_override,
                    num_candidates=num_candidates,
                    user_auth_token=user_auth_token,
                )

        # 6. Return HTTP 202 Accepted
        return Response(
            {
                'job_id': str(job.id),
                'status': GenerationJob.JobStatus.QUEUED,
                'panel_version_id': str(panel_version.id),
                'created_at': job.created_at.isoformat(),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class JobDetailView(views.APIView):
    """
    Retrieves status, checkpoints, and candidates for a GenerationJob.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id, *args, **kwargs):
        job = get_object_or_404(
            GenerationJob.objects.select_related('panel_version__panel__page__project').prefetch_related('checkpoints'),
            id=job_id,
        )

        if job.user != request.user and job.panel_version.panel.page.project.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to view this job.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GenerationJobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActiveJobsView(views.APIView):
    """
    Returns active (QUEUED or RUNNING) jobs for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        active_jobs = GenerationJob.objects.filter(
            user=request.user,
            status__in=[GenerationJob.JobStatus.QUEUED, GenerationJob.JobStatus.RUNNING],
        ).order_by('-created_at')
        serializer = GenerationJobSerializer(active_jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
