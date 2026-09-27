import uuid
from django.db import models
from django.conf import settings

class GenerationJob(models.Model):
    class JobStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        EXTRACTING = 'EXTRACTING', 'Extracting'
        COMPILING = 'COMPILING', 'Compiling'
        GENERATING = 'GENERATING', 'Generating'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        FAILED_FINAL = 'FAILED_FINAL', 'Failed Final'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panel_version = models.ForeignKey('pages.PanelVersion', on_delete=models.CASCADE, related_name='generation_jobs', null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generation_jobs', null=True, blank=True)
    status = models.CharField(max_length=30, choices=JobStatus.choices, default=JobStatus.PENDING)
    current_step = models.CharField(max_length=50, blank=True, default='')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Job {self.id} ({self.status})"

class JobCheckpoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(GenerationJob, on_delete=models.CASCADE, related_name='checkpoints')
    step_name = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Checkpoint {self.step_name} on {self.job_id}"
