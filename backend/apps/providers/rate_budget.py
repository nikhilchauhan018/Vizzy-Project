"""
Redis Rate Budget Service for AI Providers.

Tracks and enforces rate budgets in Upstash Redis (rediss:// TLS supported)
prior to initiating provider calls.
"""

import logging
import os
import time
from typing import Optional

import redis
from django.conf import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """Returns a singleton Redis client connected via REDIS_URL (supports rediss:// TLS)."""
    global _redis_client
    if _redis_client is None:
        redis_url = getattr(settings, 'REDIS_URL', '') or os.environ.get('REDIS_URL', 'rediss://default:password@xxxxx.upstash.io:6379')
        # redis.from_url natively instantiates SSLConnection for rediss:// URLs
        _redis_client = redis.from_url(redis_url, decode_responses=True)
    return _redis_client


class RateBudget:
    """
    Manages rate limits per provider key / model using Redis sliding window / token bucket.
    """

    @classmethod
    def check_and_consume(cls, provider_name: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
        """
        Check if request is within budget and increment usage counter.

        Args:
            provider_name: Identifier for provider (e.g. 'gemini', 'pollinations')
            max_requests: Max permitted requests in window
            window_seconds: Time window in seconds

        Returns:
            True if call is permitted, False if budget exceeded.
        """
        try:
            client = get_redis_client()
            key = f"rate_budget:{provider_name}"
            current_count = client.incr(key)
            if current_count == 1:
                client.expire(key, window_seconds)
            if current_count > max_requests:
                logger.warning(f"Rate budget exceeded for {provider_name}: {current_count}/{max_requests}")
                return False
            return True
        except Exception as exc:
            # If Redis is temporarily unreachable or misconfigured, log warning and allow through to avoid blocking jobs
            logger.warning(f"Redis rate budget check failed for {provider_name}: {exc}. Allowing call.")
            return True
