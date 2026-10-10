from django.urls import path
from apps.pages.views import (
    PageViewSet,
    CandidateSelectView,
    PanelCandidateSelectView,
)

page_list = PageViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
page_detail = PageViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('pages/', page_list, name='page-list'),
    path('pages/<uuid:pk>/', page_detail, name='page-detail'),
    path('candidates/<uuid:candidate_id>/select/', CandidateSelectView.as_view(), name='candidate-select'),
    path('panels/<uuid:panel_id>/candidates/<uuid:candidate_id>/select/', PanelCandidateSelectView.as_view(), name='panel-candidate-select'),
]
