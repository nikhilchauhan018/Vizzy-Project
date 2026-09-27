import uuid
from django.db import models

class TextElement(models.Model):
    class ElementType(models.TextChoices):
        SPEECH_BUBBLE = 'SPEECH_BUBBLE', 'Speech Bubble'
        CAPTION = 'CAPTION', 'Caption'
        THOUGHT_BUBBLE = 'THOUGHT_BUBBLE', 'Thought Bubble'
        SFX = 'SFX', 'Sound Effect'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panel = models.ForeignKey('pages.Panel', on_delete=models.CASCADE, related_name='text_elements')
    element_type = models.CharField(max_length=30, choices=ElementType.choices, default=ElementType.SPEECH_BUBBLE)
    text = models.TextField(blank=True, default='')
    x_percent = models.FloatField(default=10.0)
    y_percent = models.FloatField(default=10.0)
    width_percent = models.FloatField(default=30.0)
    height_percent = models.FloatField(default=20.0)
    tail_x_percent = models.FloatField(null=True, blank=True)
    tail_y_percent = models.FloatField(null=True, blank=True)
    font_size = models.IntegerField(default=16)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.element_type} on {self.panel}"
