from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Project, StyleBible, Character, Environment
from .serializers import (
    ProjectSerializer,
    StyleBibleSerializer,
    CharacterSerializer,
    EnvironmentSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for Project model.
    Strictly scoped to projects owned by the authenticated user.
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class StyleBibleViewSet(viewsets.GenericViewSet):
    """
    Manage the StyleBible for a specific project.
    Strictly scoped to the project owner.
    """
    serializer_class = StyleBibleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self):
        project_id = self.kwargs.get('project_pk')
        return get_object_or_404(Project, pk=project_id, owner=self.request.user)

    def retrieve(self, request, project_pk=None):
        project = self._get_project()
        if not hasattr(project, 'style_bible') or project.style_bible is None:
            return Response(
                {"detail": "StyleBible not found for this project."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(project.style_bible)
        return Response(serializer.data)

    def create(self, request, project_pk=None):
        project = self._get_project()
        if hasattr(project, 'style_bible') and project.style_bible is not None:
            return Response(
                {"detail": "StyleBible already exists for this project. Use PUT/PATCH to update."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, project_pk=None, partial=False):
        project = self._get_project()
        if not hasattr(project, 'style_bible') or project.style_bible is None:
            # Idempotent upsert: create if not exists
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(
            project.style_bible,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, project_pk=None):
        return self.update(request, project_pk=project_pk, partial=True)

    def destroy(self, request, project_pk=None):
        project = self._get_project()
        if hasattr(project, 'style_bible') and project.style_bible is not None:
            project.style_bible.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"detail": "StyleBible not found for this project."},
            status=status.HTTP_404_NOT_FOUND,
        )


class CharacterViewSet(viewsets.ModelViewSet):
    """
    CRUD for Character model within a Project.
    Strictly scoped to the project owner.
    """
    serializer_class = CharacterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self):
        project_id = self.kwargs.get('project_pk')
        return get_object_or_404(Project, pk=project_id, owner=self.request.user)

    def get_queryset(self):
        project = self._get_project()
        return Character.objects.filter(project=project).order_by('created_at')

    def perform_create(self, serializer):
        project = self._get_project()
        serializer.save(project=project)


class EnvironmentViewSet(viewsets.ModelViewSet):
    """
    CRUD for Environment model within a Project.
    Strictly scoped to the project owner.
    """
    serializer_class = EnvironmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self):
        project_id = self.kwargs.get('project_pk')
        return get_object_or_404(Project, pk=project_id, owner=self.request.user)

    def get_queryset(self):
        project = self._get_project()
        return Environment.objects.filter(project=project).order_by('created_at')

    def perform_create(self, serializer):
        project = self._get_project()
        serializer.save(project=project)
