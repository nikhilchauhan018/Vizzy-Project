from django.urls import path
from .views import (
    ProjectViewSet,
    StyleBibleViewSet,
    CharacterViewSet,
    EnvironmentViewSet,
    ChatMessageViewSet,
)

# Project endpoints
project_list = ProjectViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
project_detail = ProjectViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

# StyleBible endpoints (1:1 with Project)
style_bible_detail = StyleBibleViewSet.as_view({
    'get': 'retrieve',
    'post': 'create',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

# Character endpoints (nested under Project)
character_list = CharacterViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
character_detail = CharacterViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

# Environment endpoints (nested under Project)
environment_list = EnvironmentViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
environment_detail = EnvironmentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

# Chat Messages endpoints (nested under Project)
chat_message_list = ChatMessageViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

urlpatterns = [
    # Projects
    path('projects/', project_list, name='project-list'),
    path('projects/<uuid:pk>/', project_detail, name='project-detail'),

    # StyleBible
    path('projects/<uuid:project_pk>/style-bible/', style_bible_detail, name='project-style-bible'),

    # Characters
    path('projects/<uuid:project_pk>/characters/', character_list, name='project-character-list'),
    path('projects/<uuid:project_pk>/characters/<uuid:pk>/', character_detail, name='project-character-detail'),

    # Environments
    path('projects/<uuid:project_pk>/environments/', environment_list, name='project-environment-list'),
    path('projects/<uuid:project_pk>/environments/<uuid:pk>/', environment_detail, name='project-environment-detail'),

    # Chat Messages
    path('projects/<uuid:project_pk>/messages/', chat_message_list, name='project-message-list'),
]
