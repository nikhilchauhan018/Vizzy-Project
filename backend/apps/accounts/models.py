import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        if name:
            return name
        if self.email:
            return self.email.split('@')[0]
        return "Artist"

    def __str__(self):
        return self.email or str(self.id)
