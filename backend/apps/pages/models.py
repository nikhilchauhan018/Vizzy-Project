import uuid
from django.db import models

class Page(models.Model):
    class LayoutMode(models.TextChoices):
        SINGLE_PANEL = 'single_panel', 'Single Panel'
        MULTI_PANEL = 'multi_panel', 'Multi Panel'
        STORYBOARD = 'storyboard', 'Storyboard'

    class PageStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        GENERATING = 'GENERATING', 'Generating'
        OPTIONS_READY = 'OPTIONS_READY', 'Options Ready'
        REFINING = 'REFINING', 'Refining'
        APPROVED = 'APPROVED', 'Approved'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('stories.Project', on_delete=models.CASCADE, related_name='pages')
    order = models.IntegerField(default=1)
    page_number = models.CharField(max_length=20, default='01')
    title = models.CharField(max_length=255, blank=True, default='')
    layout_mode = models.CharField(max_length=30, choices=LayoutMode.choices, default=LayoutMode.SINGLE_PANEL)
    status = models.CharField(max_length=30, choices=PageStatus.choices, default=PageStatus.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Page {self.page_number} ({self.project.title})"

class Panel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='panels')
    panel_index = models.IntegerField(default=0)
    scene_json = models.JSONField(default=dict)
    compiled_prompt = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['panel_index']

    def __str__(self):
        return f"Panel {self.panel_index} on {self.page}"

class PanelVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panel = models.ForeignKey(Panel, on_delete=models.CASCADE, related_name='versions')
    parent_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_versions')
    version_number = models.IntegerField(default=1)
    prompt_used = models.TextField()
    image_url = models.CharField(max_length=1024, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['version_number']

    def __str__(self):
        return f"v{self.version_number} for {self.panel}"

class Candidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panel_version = models.ForeignKey(PanelVersion, on_delete=models.CASCADE, related_name='candidates')
    option_index = models.IntegerField(default=0)
    image_url = models.CharField(max_length=1024)
    seed = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['option_index']

    def __str__(self):
        return f"Option {self.option_index} for {self.panel_version}"
