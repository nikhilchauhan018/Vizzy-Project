"""
AI Gateway API Views.
Exposes a provider-agnostic endpoint to the frontend and internal clients.
All dispatch decisions, rate budgeting, and circuit breaker logic remain backend-controlled.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.providers.instances import get_llm_router, get_image_router
from apps.providers.exceptions import (
    ProviderError,
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ProviderUnavailableError,
    ProviderConfigurationError,
)


class AIGatewayView(APIView):
    """
    Provider-agnostic AI Gateway endpoint.
    Routes generation tasks through the internal ProviderRouter hierarchy.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        task_type = request.data.get('task_type')
        prompt = request.data.get('prompt')
        parameters = request.data.get('parameters') or {}

        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            return Response(
                {'error': 'A non-empty prompt is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if task_type not in ('text', 'image'):
            return Response(
                {'error': "task_type must be either 'text' or 'image'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # User-scoped Puter token from request header (supporting user-pays model)
        user_auth_token = request.headers.get('X-Puter-Auth-Token') or parameters.get('user_auth_token')

        try:
            if task_type == 'text':
                router = get_llm_router()
                result = router.execute_text(
                    prompt=prompt.strip(),
                    user_auth_token=user_auth_token,
                    model=parameters.get('model'),
                    system_prompt=parameters.get('system_prompt'),
                )
            else:
                router = get_image_router()
                result = router.execute_image(
                    prompt=prompt.strip(),
                    user_auth_token=user_auth_token,
                    model=parameters.get('model'),
                    aspect_ratio=parameters.get('aspect_ratio', '16:9'),
                    reference_image_url=parameters.get('reference_image_url'),
                )

            return Response({
                'status': 'success',
                'task_type': task_type,
                'result': result,
            }, status=status.HTTP_200_OK)

        except ProviderAuthenticationError as pae:
            return Response(
                {'error': pae.message, 'provider': pae.provider_name},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except ProviderRateLimitError as prle:
            return Response(
                {'error': prle.message, 'provider': prle.provider_name},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except ProviderConfigurationError as pce:
            return Response(
                {'error': pce.message, 'provider': pce.provider_name},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ProviderUnavailableError as pue:
            return Response(
                {'error': pue.message, 'provider': pue.provider_name, 'details': pue.details},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ProviderError as pe:
            return Response(
                {'error': pe.message, 'provider': pe.provider_name},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AIProvidersMetadataView(APIView):
    """
    Safe provider metadata view.
    Reports registered providers, health, and verified capabilities without exposing secrets.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        llm_router = get_llm_router()
        image_router = get_image_router()

        return Response({
            'llm_providers': [adapter.get_metadata() for adapter in llm_router.adapters],
            'image_providers': [adapter.get_metadata() for adapter in image_router.adapters],
            'primary_llm': llm_router.get_primary_provider().name if llm_router.get_primary_provider() else None,
            'primary_image': image_router.get_primary_provider().name if image_router.get_primary_provider() else None,
        })
