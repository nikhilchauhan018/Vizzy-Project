"""
Base Provider Adapter.
Standardized interface that every AI provider adapter must conform to.
"""

from abc import ABC, abstractmethod
from typing import Set, Dict, Any, Optional
from apps.providers.capabilities import ProviderCapability, CapabilityChecker, UnsupportedCapabilityError
from apps.providers.circuit_breaker import CircuitBreaker


class BaseProviderAdapter(ABC):
    """
    Abstract Base Class for all AI Provider Adapters.
    Encapsulates provider-specific networking, auth, headers, payload mapping, and health.
    """

    def __init__(self, name: str, capabilities: Set[ProviderCapability], failure_threshold: int = 3):
        self.name = name
        self.capabilities = capabilities
        self.circuit_breaker = CircuitBreaker(failure_threshold=failure_threshold)

    def supports(self, capability: ProviderCapability) -> bool:
        """Query if this adapter supports a given capability."""
        return CapabilityChecker.supports(self.capabilities, capability)

    def is_healthy(self) -> bool:
        """Query if this adapter can accept new requests based on circuit state."""
        return self.circuit_breaker.can_execute()

    def get_metadata(self) -> Dict[str, Any]:
        """Returns safe provider metadata without exposing internal secrets or credentials."""
        return {
            'name': self.name,
            'is_healthy': self.is_healthy(),
            'circuit_state': self.circuit_breaker.state.value,
            'capabilities': [c.value for c in self.capabilities],
        }

    @abstractmethod
    def generate_text(self, prompt: str, user_auth_token: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute text generation via this provider.
        Returns standardized dict: {"text": str, "model": str, "usage": dict}
        """
        pass

    @abstractmethod
    def generate_image(self, prompt: str, user_auth_token: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute image generation via this provider.
        Returns standardized dict: {"image_url": str, "model": str, "aspect_ratio": str}
        """
        pass
