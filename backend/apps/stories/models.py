import uuid
from django.db import models
from django.conf import settings

class Project(models.Model):
    STATUS_CHOICES = [
        ('SETUP', 'Setup'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETE', 'Complete'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    title = models.CharField(max_length=255)
    story_notes = models.TextField(blank=True, default='')
    historically_grounded = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SETUP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class StyleBible(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='style_bible')
    art_style = models.TextField()
    palette = models.JSONField(default=list)
    lighting_default = models.TextField()
    aspect_ratio = models.CharField(max_length=10, default='16:9')
    render_medium = models.TextField(default='Digital Graphic Novel')
    locked_style_prompt_prefix = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Character(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, blank=True, default='')
    age = models.CharField(max_length=50, blank=True, default='')
    appearance = models.TextField()
    uniform = models.TextField()
    hair = models.TextField()
    reference_image_url = models.CharField(max_length=1024, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Environment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='environments')
    name = models.CharField(max_length=255)
    description = models.TextField()
    weather = models.CharField(max_length=255, blank=True, default='')
    time_of_day = models.CharField(max_length=255, blank=True, default='')
    reference_image_url = models.CharField(max_length=1024, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
