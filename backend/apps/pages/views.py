import uuid
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets, views
from rest_framework.response import Response

from apps.pages.models import Page, Panel, PanelVersion, Candidate
from apps.pages.serializers import (
    PageSerializer,
    PanelSerializer,
    PanelVersionSerializer,
    CandidateSerializer,
)


class PageViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Pages owned by the authenticated user.
    """
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk') or self.request.query_params.get('project_id')
        qs = Page.objects.filter(project__owner=self.request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.prefetch_related('panels__versions__candidates')

    def perform_create(self, serializer):
        serializer.save()


class CandidateSelectView(views.APIView):
    """
    Selects a generated candidate for a panel.
    Updates the active image_url of the panel_version, preserves version history,
    and updates the page status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, candidate_id, *args, **kwargs):
        candidate = get_object_or_404(
            Candidate.objects.select_related('panel_version__panel__page__project'),
            id=candidate_id,
        )

        project = candidate.panel_version.panel.page.project
        if project.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to select candidates for this project.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        panel_version = candidate.panel_version
        panel = panel_version.panel
        page = panel.page

        # Set candidate image on the version
        panel_version.image_url = candidate.image_url
        panel_version.save(update_fields=['image_url'])

        # Update page status to APPROVED
        page.status = Page.PageStatus.APPROVED
        page.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'candidate': CandidateSerializer(candidate).data,
                'panel_version': PanelVersionSerializer(panel_version).data,
                'page_id': str(page.id),
                'page_status': page.status,
                'selected_image_url': candidate.image_url,
            },
            status=status.HTTP_200_OK,
        )


class PanelCandidateSelectView(views.APIView):
    """
    Panel-scoped candidate selection endpoint:
    POST /api/pages/panels/<panel_id>/candidates/<candidate_id>/select/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, panel_id, candidate_id, *args, **kwargs):
        panel = get_object_or_404(
            Panel.objects.select_related('page__project'),
            id=panel_id,
        )

        if panel.page.project.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to select candidates for this project.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        candidate = get_object_or_404(
            Candidate.objects.select_related('panel_version'),
            id=candidate_id,
            panel_version__panel=panel,
        )

        panel_version = candidate.panel_version
        panel_version.image_url = candidate.image_url
        panel_version.save(update_fields=['image_url'])

        page = panel.page
        page.status = Page.PageStatus.APPROVED
        page.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'candidate': CandidateSerializer(candidate).data,
                'panel_version': PanelVersionSerializer(panel_version).data,
                'page_id': str(page.id),
                'page_status': page.status,
                'selected_image_url': candidate.image_url,
            },
            status=status.HTTP_200_OK,
        )
