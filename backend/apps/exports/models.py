import uuid
from django.db import models

class Export(models.Model):
    class ExportType(models.TextChoices):
        PDF = 'PDF', 'PDF'
        SLIDESHOW = 'SLIDESHOW', 'Slideshow'
        VIDEO = 'VIDEO', 'Video'

    class ExportStatus(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        RENDERING = 'RENDERING', 'Rendering'
        DONE = 'DONE', 'Done'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('stories.Project', on_delete=models.CASCADE, related_name='exports')
    export_type = models.CharField(max_length=20, choices=ExportType.choices, default=ExportType.VIDEO)
    status = models.CharField(max_length=20, choices=ExportStatus.choices, default=ExportStatus.QUEUED)
    output_url = models.URLField(max_length=1024, null=True, blank=True)
    transition_style = models.CharField(max_length=100, blank=True, default='crossfade')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Export {self.id} ({self.export_type}) - {self.status}"
