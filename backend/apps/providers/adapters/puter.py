"""
Puter AI Provider Adapter.
Implements the primary AI provider integration according to docs/PUTER_AI_GATEWAY_DIRECTION.md.
Preserves user-pays identity and user-scoped resource model without exposing credentials.
"""

import os
import logging
from typing import Dict, Any, Optional
import requests
from django.conf import settings

from apps.providers.adapters.base import BaseProviderAdapter
from apps.providers.capabilities import ProviderCapability, CapabilityChecker
from apps.providers.exceptions import (
    ProviderConfigurationError,
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

PUTER_BASE_URL = getattr(settings, 'PUTER_BASE_URL', '') or os.environ.get('PUTER_BASE_URL', 'https://api.puter.com')
DEFAULT_TEXT_MODEL = getattr(settings, 'PUTER_DEFAULT_TEXT_MODEL', 'claude-3-5-sonnet')
DEFAULT_IMAGE_MODEL = getattr(settings, 'PUTER_DEFAULT_IMAGE_MODEL', 'flux-schnell')


class PuterAdapter(BaseProviderAdapter):
    """
    Dedicated Puter Provider Adapter.
    Hides endpoint details, request formatting, and header handling.
    """

    def __init__(self, api_key: Optional[str] = None):
        # Explicit capabilities verified for Puter foundation
        capabilities = {
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.IMAGE_GENERATION,
            ProviderCapability.ASPECT_RATIO,
        }
        super().__init__(name='puter', capabilities=capabilities)
        self.system_api_key = api_key or getattr(settings, 'PUTER_API_KEY', '') or os.environ.get('PUTER_API_KEY', '')

    def _resolve_auth_token(self, user_auth_token: Optional[str] = None) -> str:
        """
        Resolves auth token prioritizing user-scoped Puter token (user-pays model),
        falling back to backend-configured token if provided.
        """
        token = user_auth_token or self.system_api_key
        if not token:
            raise ProviderConfigurationError(
                message="Puter authentication token is missing. User Puter identity or server configuration required.",
                provider_name=self.name,
                status_code=401,
            )
        return token

    def generate_text(
        self,
        prompt: str,
        user_auth_token: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Routes text/chat completion request to Puter AI driver.
        """
        CapabilityChecker.validate_capability(self.capabilities, ProviderCapability.TEXT_GENERATION)

        token = self._resolve_auth_token(user_auth_token)
        chosen_model = model or DEFAULT_TEXT_MODEL

        url = f"{PUTER_BASE_URL.rstrip('/')}/drivers/call"
        headers = {
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json',
        }

        messages = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': prompt})

        payload = {
            'interface': 'puter-chat-completion',
            'driver': 'ai-chat',
            'method': 'complete',
            'args': {
                'model': chosen_model,
                'messages': messages,
                'stream': False,
            },
            'auth_token': token,
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=kwargs.get('timeout', 30))
            if res.status_code == 401:
                self.circuit_breaker.record_failure()
                raise ProviderAuthenticationError(
                    message="Puter authentication rejected.",
                    provider_name=self.name,
                    status_code=401,
                )
            if res.status_code == 429:
                self.circuit_breaker.record_failure()
                raise ProviderRateLimitError(
                    message="Puter rate limit or user quota exhausted.",
                    provider_name=self.name,
                    status_code=429,
                )
            if res.status_code >= 500:
                self.circuit_breaker.record_failure()
                raise ProviderUnavailableError(
                    message=f"Puter server error: {res.status_code}",
                    provider_name=self.name,
                    status_code=res.status_code,
                )
            if not res.ok:
                self.circuit_breaker.record_failure()
                raise ProviderUnavailableError(
                    message=f"Puter returned error: {res.text}",
                    provider_name=self.name,
                    status_code=res.status_code,
                )

            data = res.json()
            self.circuit_breaker.record_success()

            # Standardized return
            text_content = data.get('message', {}).get('content') or data.get('text') or ''
            return {
                'provider': self.name,
                'model': chosen_model,
                'text': text_content,
                'raw': data,
            }
        except (ProviderAuthenticationError, ProviderRateLimitError, ProviderUnavailableError):
            raise
        except Exception as exc:
            self.circuit_breaker.record_failure()
            raise ProviderUnavailableError(
                message=f"Failed to communicate with Puter: {str(exc)}",
                provider_name=self.name,
                status_code=503,
            )

    def generate_image(
        self,
        prompt: str,
        user_auth_token: Optional[str] = None,
        model: Optional[str] = None,
        aspect_ratio: str = '16:9',
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Routes text-to-image synthesis request to Puter AI driver.
        """
        CapabilityChecker.validate_capability(self.capabilities, ProviderCapability.IMAGE_GENERATION)

        if kwargs.get('reference_image_url'):
            CapabilityChecker.validate_capability(self.capabilities, ProviderCapability.REFERENCE_IMAGE)

        token = self._resolve_auth_token(user_auth_token)
        chosen_model = model or DEFAULT_IMAGE_MODEL

        url = f"{PUTER_BASE_URL.rstrip('/')}/drivers/call"
        headers = {
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json',
        }

        payload = {
            'interface': 'puter-image-generation',
            'driver': 'ai-image',
            'method': 'generate',
            'args': {
                'model': chosen_model,
                'prompt': prompt,
                'aspect_ratio': aspect_ratio,
            },
            'auth_token': token,
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=kwargs.get('timeout', 45))
            if res.status_code == 401:
                self.circuit_breaker.record_failure()
                raise ProviderAuthenticationError(
                    message="Puter authentication rejected.",
                    provider_name=self.name,
                    status_code=401,
                )
            if res.status_code == 429:
                self.circuit_breaker.record_failure()
                raise ProviderRateLimitError(
                    message="Puter image rate limit or quota exceeded.",
                    provider_name=self.name,
                    status_code=429,
                )
            if res.status_code >= 500:
                self.circuit_breaker.record_failure()
                raise ProviderUnavailableError(
                    message=f"Puter server error: {res.status_code}",
                    provider_name=self.name,
                    status_code=res.status_code,
                )
            if not res.ok:
                self.circuit_breaker.record_failure()
                raise ProviderUnavailableError(
                    message=f"Puter returned error: {res.text}",
                    provider_name=self.name,
                    status_code=res.status_code,
                )

            self.circuit_breaker.record_success()

            # Handle binary image stream
            content_type = res.headers.get('content-type', '').split(';')[0].strip()
            if content_type.startswith('image/'):
                import base64
                b64_data = base64.b64encode(res.content).decode('utf-8')
                image_url = f"data:{content_type};base64,{b64_data}"
                return {
                    'provider': self.name,
                    'model': chosen_model,
                    'image_url': image_url,
                    'aspect_ratio': aspect_ratio,
                    'raw': {'content_type': content_type, 'size': len(res.content)},
                }

            data = res.json()
            result = data.get('result') or data
            image_url = ''
            if isinstance(result, dict):
                image_url = result.get('image_url') or result.get('url') or result.get('asset_url') or result.get('src') or ''
            elif isinstance(result, str) and (result.startswith('http') or result.startswith('data:image')):
                image_url = result

            return {
                'provider': self.name,
                'model': chosen_model,
                'image_url': image_url,
                'aspect_ratio': aspect_ratio,
                'raw': data,
            }
        except (ProviderAuthenticationError, ProviderRateLimitError, ProviderUnavailableError):
            raise
        except Exception as exc:
            self.circuit_breaker.record_failure()
            raise ProviderUnavailableError(
                message=f"Failed to synthesize image via Puter: {str(exc)}",
                provider_name=self.name,
                status_code=503,
            )
