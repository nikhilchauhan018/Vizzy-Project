"""
Per-user Concurrency Guard.

Limits simultaneous GenerationJobs per user (default max 2) across
all stateless app server instances and workers using Upstash Redis (rediss:// TLS).
"""

import logging
import os
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


class ConcurrencyGuard:
    MAX_CONCURRENT_JOBS = 2

    @classmethod
    def acquire(cls, user_id: str, job_id: str, timeout_seconds: int = 1800) -> bool:
        """
        Attempts to acquire a concurrency slot for user's job.

        Returns True if slot acquired, False if user already has MAX_CONCURRENT_JOBS running.
        """
        try:
            client = get_redis_client()
            key = f"user_active_jobs:{user_id}"
            
            # Use Redis set to track active job IDs
            active_jobs = client.smembers(key)
            if len(active_jobs) >= cls.MAX_CONCURRENT_JOBS:
                logger.warning(f"User {user_id} reached concurrency limit of {cls.MAX_CONCURRENT_JOBS} active jobs.")
                return False

            client.sadd(key, job_id)
            client.expire(key, timeout_seconds)
            return True
        except Exception as exc:
            logger.warning(f"Redis concurrency guard acquire failed for user {user_id}: {exc}. Allowing job.")
            return True

    @classmethod
    def release(cls, user_id: str, job_id: str) -> None:
        """Releases the concurrency slot for a user's job upon completion or failure."""
        try:
            client = get_redis_client()
            key = f"user_active_jobs:{user_id}"
            client.srem(key, job_id)
        except Exception as exc:
            logger.warning(f"Redis concurrency guard release failed for user {user_id}, job {job_id}: {exc}")
