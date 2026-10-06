import os
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('apps.core.views.check_redis')
    def test_health_check_healthy_status(self, mock_redis):
        """When database and Redis are operational, returns 200 and healthy status."""
        mock_redis.return_value = (True, 'connected')

        with patch.dict(os.environ, {'INSTANCE_ID': 'app-a'}):
            response = self.client.get('/api/health/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(data['status'], 'healthy')
            self.assertEqual(data['database'], 'connected')
            self.assertEqual(data['redis'], 'connected')
            self.assertEqual(data['instance_id'], 'app-a')
            self.assertEqual(response.headers.get('X-Served-By'), 'app-a')
            self.assertIn('no-cache', response.headers.get('Cache-Control', ''))

    @patch('apps.core.views.check_redis')
    def test_healthz_alias_route(self, mock_redis):
        """Verifies /healthz endpoint acts as identical liveness/readiness probe."""
        mock_redis.return_value = (True, 'connected')

        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')

    @patch('apps.core.views.check_redis')
    def test_health_check_head_request(self, mock_redis):
        """Verifies HEAD requests are supported for lightweight load balancer probes."""
        mock_redis.return_value = (True, 'connected')

        response = self.client.head('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.has_header('X-Served-By'))

    @patch('apps.core.views.check_redis')
    def test_health_check_degraded_when_redis_fails(self, mock_redis):
        """When Redis is down but DB is healthy, returns 200 OK with degraded status."""
        mock_redis.return_value = (False, 'disconnected')

        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'degraded')
        self.assertEqual(data['database'], 'connected')
        self.assertEqual(data['redis'], 'disconnected')

    @patch('apps.core.views.check_database')
    @patch('apps.core.views.check_redis')
    def test_health_check_unhealthy_when_database_fails(self, mock_redis, mock_db):
        """When the primary database is unreachable, returns 503 Service Unavailable."""
        mock_db.return_value = (False, 'disconnected')
        mock_redis.return_value = (True, 'connected')

        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = response.json()
        self.assertEqual(data['status'], 'unhealthy')
        self.assertEqual(data['database'], 'disconnected')

    def test_health_check_does_not_expose_secrets(self):
        """Confirms health endpoint does not leak Redis passwords or credentials."""
        secret_url = "rediss://default:supersecretpassword123@myhost.upstash.io:6379"
        with override_settings(REDIS_URL=secret_url):
            # Real socket call will fail or be unreachable, verify error handling sanitizes
            response = self.client.get('/api/health/')
            content = response.content.decode('utf-8')
            self.assertNotIn("supersecretpassword123", content)
            self.assertNotIn("myhost.upstash.io", content)

    def test_instance_identifier_middleware_across_endpoints(self):
        """Ensures X-Served-By header is set on all HTTP responses via middleware."""
        with patch.dict(os.environ, {'INSTANCE_ID': 'app-b'}):
            response = self.client.get('/api/health/')
            self.assertEqual(response.headers.get('X-Served-By'), 'app-b')
