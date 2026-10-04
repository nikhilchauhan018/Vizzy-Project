import uuid
from typing import Optional, Dict, Any
from django.db import models
from django.conf import settings


class GenerationJob(models.Model):
    class JobStatus(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        RUNNING = 'RUNNING', 'Running'
        FAILED_RETRYABLE = 'FAILED_RETRYABLE', 'Failed Retryable'
        FAILED_FINAL = 'FAILED_FINAL', 'Failed Final'
        DONE = 'DONE', 'Done'
        # Legacy/intermediate aliases for backward compatibility
        PENDING = 'PENDING', 'Pending'
        EXTRACTING = 'EXTRACTING', 'Extracting'
        COMPILING = 'COMPILING', 'Compiling'
        GENERATING = 'GENERATING', 'Generating'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    TERMINAL_STATES = {JobStatus.DONE, JobStatus.FAILED_FINAL, JobStatus.COMPLETED}

    ALLOWED_TRANSITIONS = {
        JobStatus.QUEUED: {JobStatus.RUNNING, JobStatus.FAILED_RETRYABLE, JobStatus.FAILED_FINAL},
        JobStatus.PENDING: {JobStatus.RUNNING, JobStatus.FAILED_RETRYABLE, JobStatus.FAILED_FINAL, JobStatus.QUEUED},
        JobStatus.RUNNING: {JobStatus.DONE, JobStatus.FAILED_RETRYABLE, JobStatus.FAILED_FINAL, JobStatus.COMPLETED},
        JobStatus.FAILED_RETRYABLE: {JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.FAILED_FINAL},
        JobStatus.FAILED: {JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.FAILED_FINAL},
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panel_version = models.ForeignKey(
        'pages.PanelVersion',
        on_delete=models.CASCADE,
        related_name='generation_jobs',
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generation_jobs',
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=30,
        choices=JobStatus.choices,
        default=JobStatus.QUEUED,
    )
    current_step = models.CharField(max_length=50, blank=True, default='')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Job {self.id} ({self.status})"

    def transition_to(self, new_status: str, current_step: str = '', error_message: str = '') -> None:
        """
        Transitions the job to a new deterministic state, validating transition validity.
        """
        if self.status in self.TERMINAL_STATES and new_status != self.status:
            raise ValueError(f"Invalid transition: Cannot transition from terminal state {self.status} to {new_status}")

        allowed = self.ALLOWED_TRANSITIONS.get(self.status, set())
        if new_status not in allowed and new_status != self.status:
            # Check if transitioning between legacy and canonical equivalents
            canonical_status = JobStatus.QUEUED if self.status == JobStatus.PENDING else self.status
            canonical_allowed = self.ALLOWED_TRANSITIONS.get(canonical_status, set())
            if new_status not in canonical_allowed:
                raise ValueError(f"Invalid state transition: Cannot transition from {self.status} to {new_status}")

        self.status = new_status
        if current_step:
            self.current_step = current_step
        if error_message:
            self.error_message = error_message
        self.save(update_fields=['status', 'current_step', 'error_message', 'updated_at'])

    def record_checkpoint(self, step_name: str, payload: Dict[str, Any]) -> 'JobCheckpoint':
        """Records or updates a checkpoint payload for a pipeline step."""
        checkpoint, _ = JobCheckpoint.objects.update_or_create(
            job=self,
            step_name=step_name,
            defaults={'payload': payload},
        )
        self.current_step = step_name
        self.save(update_fields=['current_step', 'updated_at'])
        return checkpoint

    def get_checkpoint(self, step_name: str) -> Optional[Dict[str, Any]]:
        """Returns the payload dictionary of a completed step if recorded."""
        cp = self.checkpoints.filter(step_name=step_name).first()
        return cp.payload if cp else None

    def has_checkpoint(self, step_name: str) -> bool:
        """Returns True if the specified checkpoint was recorded."""
        return self.checkpoints.filter(step_name=step_name).exists()


class JobCheckpoint(models.Model):
    class CheckpointStep(models.TextChoices):
        EXTRACT_SCENE = 'EXTRACT_SCENE', 'Extract Scene'
        COMPILE_PROMPT = 'COMPILE_PROMPT', 'Compile Prompt'
        GENERATE_IMAGE = 'GENERATE_IMAGE', 'Generate Image'
        NOTIFY = 'NOTIFY', 'Notify'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(GenerationJob, on_delete=models.CASCADE, related_name='checkpoints')
    step_name = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Checkpoint {self.step_name} on {self.job_id}"
