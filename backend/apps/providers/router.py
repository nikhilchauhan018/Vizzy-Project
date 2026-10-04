"""
Provider Router Service.
Coordinates capability-aware failover across registered AI provider adapters.
Guarantees Puter is prioritized as PRIMARY provider.
"""

import logging
from typing import List, Dict, Any, Optional
from apps.providers.adapters.base import BaseProviderAdapter
from apps.providers.capabilities import ProviderCapability, UnsupportedCapabilityError
from apps.providers.rate_budget import RateBudget
from apps.providers.exceptions import (
    ProviderError,
    ProviderUnavailableError,
    ProviderCircuitOpenError,
    ProviderRateLimitError,
)

logger = logging.getLogger(__name__)


class ProviderRouter:
    """
    Manages routing, health inspection, rate budgets, and failovers across provider adapters.
    """

    def __init__(self, task_name: str):
        self.task_name = task_name
        self.adapters: List[BaseProviderAdapter] = []

    def register_provider(self, adapter: BaseProviderAdapter, as_primary: bool = False):
        """
        Registers an adapter in the router.
        If as_primary is True, inserts at the head of the chain (index 0).
        """
        if as_primary:
            self.adapters.insert(0, adapter)
        else:
            self.adapters.append(adapter)

    def get_primary_provider(self) -> Optional[BaseProviderAdapter]:
        """Returns the primary (highest priority) provider."""
        return self.adapters[0] if self.adapters else None

    def get_healthy_providers(self, required_capability: Optional[ProviderCapability] = None) -> List[BaseProviderAdapter]:
        """Filters registered providers that are healthy and support the required capability."""
        available = []
        for adapter in self.adapters:
            if required_capability and not adapter.supports(required_capability):
                continue
            if adapter.is_healthy():
                available.append(adapter)
        return available

    def execute_text(
        self,
        prompt: str,
        user_auth_token: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Routes a text/LLM request through the chain, prioritizing Puter as primary.
        Fails over cleanly to next provider on non-fatal errors.
        """
        if not self.adapters:
            raise ProviderUnavailableError("No providers registered in router.", provider_name="router")

        errors: List[str] = []

        for adapter in self.adapters:
            if not adapter.supports(ProviderCapability.TEXT_GENERATION):
                continue

            if not adapter.is_healthy():
                logger.warning(f"Skipping {adapter.name} due to open circuit breaker.")
                errors.append(f"{adapter.name}: circuit breaker open")
                continue

            # Check rate budget
            if not RateBudget.check_and_consume(adapter.name):
                logger.warning(f"Rate budget exhausted for {adapter.name}. Triggering failover.")
                errors.append(f"{adapter.name}: rate budget exceeded")
                continue

            try:
                logger.info(f"Dispatching text generation to primary/active provider: {adapter.name}")
                result = adapter.generate_text(prompt, user_auth_token=user_auth_token, **kwargs)
                return result
            except ProviderError as pe:
                logger.warning(f"Provider {adapter.name} failed with {pe.__class__.__name__}: {pe.message}")
                errors.append(f"{adapter.name}: {pe.message}")
                # Continue failover loop to next registered provider
            except Exception as e:
                logger.error(f"Unexpected error in provider {adapter.name}: {str(e)}")
                adapter.circuit_breaker.record_failure()
                errors.append(f"{adapter.name}: unexpected failure")

        raise ProviderUnavailableError(
            message=f"All providers in chain failed: {'; '.join(errors)}",
            provider_name="router",
            details={'attempted_errors': errors},
        )

    def execute_image(
        self,
        prompt: str,
        user_auth_token: Optional[str] = None,
        aspect_ratio: str = '16:9',
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Routes an image synthesis request through the chain, prioritizing Puter as primary.
        """
        if not self.adapters:
            raise ProviderUnavailableError("No providers registered in router.", provider_name="router")

        errors: List[str] = []

        for adapter in self.adapters:
            if not adapter.supports(ProviderCapability.IMAGE_GENERATION):
                continue

            if kwargs.get('reference_image_url') and not adapter.supports(ProviderCapability.REFERENCE_IMAGE):
                continue

            if not adapter.is_healthy():
                logger.warning(f"Skipping {adapter.name} due to open circuit breaker.")
                errors.append(f"{adapter.name}: circuit breaker open")
                continue

            # Check rate budget
            if not RateBudget.check_and_consume(adapter.name):
                logger.warning(f"Rate budget exhausted for {adapter.name}. Triggering failover.")
                errors.append(f"{adapter.name}: rate budget exceeded")
                continue

            try:
                logger.info(f"Dispatching image synthesis to primary/active provider: {adapter.name}")
                result = adapter.generate_image(
                    prompt,
                    user_auth_token=user_auth_token,
                    aspect_ratio=aspect_ratio,
                    **kwargs,
                )
                return result
            except ProviderError as pe:
                logger.warning(f"Provider {adapter.name} failed with {pe.__class__.__name__}: {pe.message}")
                errors.append(f"{adapter.name}: {pe.message}")
            except Exception as e:
                logger.error(f"Unexpected error in provider {adapter.name}: {str(e)}")
                adapter.circuit_breaker.record_failure()
                errors.append(f"{adapter.name}: unexpected failure")

        raise ProviderUnavailableError(
            message=f"All image providers in chain failed: {'; '.join(errors)}",
            provider_name="router",
            details={'attempted_errors': errors},
        )
