import os
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import redis


def check_database() -> tuple[bool, str]:
    """Verifies relational database connectivity (Neon / PostgreSQL / SQLite)."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            if row and row[0] == 1:
                return True, "connected"
        return False, "disconnected"
    except Exception:
        return False, "disconnected"


def check_redis(timeout: float = 1.5) -> tuple[bool, str]:
    """Verifies Redis connectivity (Upstash / Redis) without exposing secrets."""
    redis_url = getattr(settings, 'REDIS_URL', '') or os.environ.get('REDIS_URL', '')
    if not redis_url:
        return True, "not_configured"
    try:
        client = redis.from_url(
            redis_url,
            socket_connect_timeout=timeout,
            socket_timeout=timeout,
            decode_responses=True,
        )
        if client.ping():
            return True, "connected"
        return False, "disconnected"
    except Exception:
        return False, "disconnected"


class HealthCheckView(APIView):
    """
    Public unauthenticated health and readiness check endpoint.
    Reports database and Redis status alongside the current instance ID.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        db_ok, db_status = check_database()
        redis_ok, redis_status = check_redis()
        instance_id = os.environ.get('INSTANCE_ID', 'vizzy-app')

        if not db_ok:
            overall_status = "unhealthy"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        elif not redis_ok and redis_status != "not_configured":
            overall_status = "degraded"
            http_status = status.HTTP_200_OK
        else:
            overall_status = "healthy"
            http_status = status.HTTP_200_OK

        payload = {
            "status": overall_status,
            "instance_id": instance_id,
            "database": db_status,
            "redis": redis_status,
            "timestamp": timezone.now().isoformat(),
        }

        response = Response(payload, status=http_status)
        response['X-Served-By'] = instance_id
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    def head(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)
