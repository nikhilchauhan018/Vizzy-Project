"""
URLs for AI Providers and Gateway.
"""

from django.urls import path
from apps.providers.views import AIGatewayView, AIProvidersMetadataView

urlpatterns = [
    path('generate/', AIGatewayView.as_view(), name='ai-gateway-generate'),
    path('providers/', AIProvidersMetadataView.as_view(), name='ai-gateway-providers'),
]
