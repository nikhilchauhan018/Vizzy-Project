"""
Singleton Provider Router Instances.
Centralizes circuit breaker state and rate limiting across the entire application lifecycle.
"""

from typing import Optional
from apps.providers.router import ProviderRouter
from apps.providers.adapters.puter import PuterAdapter

_llm_router: Optional[ProviderRouter] = None
_image_router: Optional[ProviderRouter] = None


def get_llm_router() -> ProviderRouter:
    """
    Returns the singleton LLM router with Puter registered as PRIMARY.
    """
    global _llm_router
    if _llm_router is None:
        router = ProviderRouter(task_name='llm')
        # Puter registered as primary provider
        puter_adapter = PuterAdapter()
        router.register_provider(puter_adapter, as_primary=True)
        _llm_router = router
    return _llm_router


def get_image_router() -> ProviderRouter:
    """
    Returns the singleton Image router with Puter registered as PRIMARY.
    """
    global _image_router
    if _image_router is None:
        router = ProviderRouter(task_name='image')
        # Puter registered as primary provider
        puter_adapter = PuterAdapter()
        router.register_provider(puter_adapter, as_primary=True)
        _image_router = router
    return _image_router


def reset_routers_for_testing():
    """Testing hook to re-initialize singletons between unit test runs."""
    global _llm_router, _image_router
    _llm_router = None
    _image_router = None
