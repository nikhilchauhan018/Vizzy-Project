import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager


class CustomUserManager(UserManager):
    def create_user(self, username=None, email=None, password=None, **extra_fields):
        # Support email provided as username or keyword argument
        if not email and username and '@' in str(username):
            email = username
        if not email:
            email = extra_fields.pop('email', None)
        if not email:
            raise ValueError('The Email field must be set')
        email = email.strip().lower()
        if not username:
            username = email
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if not email and username and '@' in str(username):
            email = username
        if not email:
            email = extra_fields.pop('email', None)
        if not email:
            raise ValueError('The Email field must be set for superusers')
        email = email.strip().lower()
        if not username:
            username = email
        return self.create_user(username=username, email=email, password=password, **extra_fields)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if not self.username and self.email:
            self.username = self.email
        elif not self.username:
            self.username = str(self.id)
        super().save(*args, **kwargs)

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
