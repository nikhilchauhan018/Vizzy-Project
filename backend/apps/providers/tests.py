"""
Tests for AI Providers, Puter Adapter, ProviderRouter, and AI Gateway.
Uses mocks to guarantee no real Puter API calls or credit consumption occurs.
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.providers.adapters.puter import PuterAdapter
from apps.providers.capabilities import ProviderCapability, UnsupportedCapabilityError
from apps.providers.circuit_breaker import CircuitState
from apps.providers.exceptions import (
    ProviderConfigurationError,
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ProviderUnavailableError,
)
from apps.providers.router import ProviderRouter
from apps.providers.instances import (
    get_llm_router,
    get_image_router,
    reset_routers_for_testing,
)

User = get_user_model()


class ProviderArchitectureTests(TestCase):
    def setUp(self):
        reset_routers_for_testing()
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@vizzy.local',
            password='securepassword123',
        )
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        reset_routers_for_testing()

    # 1. Puter adapter registration & defaults
    def test_puter_adapter_registration(self):
        adapter = PuterAdapter(api_key='mock-test-key')
        self.assertEqual(adapter.name, 'puter')
        self.assertTrue(adapter.supports(ProviderCapability.TEXT_GENERATION))
        self.assertTrue(adapter.supports(ProviderCapability.IMAGE_GENERATION))
        self.assertTrue(adapter.supports(ProviderCapability.ASPECT_RATIO))
        # Ensure unverified capabilities are explicitly NOT claimed
        self.assertFalse(adapter.supports(ProviderCapability.REFERENCE_IMAGE))
        self.assertFalse(adapter.supports(ProviderCapability.IMAGE_TO_IMAGE))

    # 2. ProviderRouter selects Puter as PRIMARY
    def test_provider_router_selects_puter_as_primary(self):
        llm_router = get_llm_router()
        image_router = get_image_router()
        self.assertIsNotNone(llm_router.get_primary_provider())
        self.assertEqual(llm_router.get_primary_provider().name, 'puter')
        self.assertIsNotNone(image_router.get_primary_provider())
        self.assertEqual(image_router.get_primary_provider().name, 'puter')

    # 3. Provider interface contract & safe metadata
    def test_provider_interface_contract(self):
        adapter = PuterAdapter(api_key='secret-token-xyz')
        meta = adapter.get_metadata()
        self.assertEqual(meta['name'], 'puter')
        self.assertTrue(meta['is_healthy'])
        self.assertEqual(meta['circuit_state'], 'closed')
        # Crucial: verify secrets are never leaked in metadata
        self.assertNotIn('secret-token-xyz', str(meta))
        self.assertNotIn('api_key', meta)

    # 4. Missing credentials/configuration handling
    def test_missing_credentials_configuration_handling(self):
        adapter = PuterAdapter(api_key='')
        with self.assertRaises(ProviderConfigurationError):
            adapter.generate_text(prompt='Hello Vizzy', user_auth_token=None)

    # 5. Unsupported capability handling
    def test_unsupported_capability_handling(self):
        adapter = PuterAdapter(api_key='mock-key')
        with self.assertRaises(UnsupportedCapabilityError):
            adapter.generate_image(
                prompt='A warrior in storm',
                reference_image_url='https://example.com/face.jpg',
            )

    # 6. Provider failure handling & circuit breaker tripping
    @patch('requests.post')
    def test_provider_failure_and_circuit_breaker(self, mock_post):
        adapter = PuterAdapter(api_key='mock-key')
        mock_resp = MagicMock()
        mock_resp.status_code = 503
        mock_resp.ok = False
        mock_resp.text = 'Service Temporarily Unavailable'
        mock_post.return_value = mock_resp

        # 3 failures to trip circuit
        for _ in range(3):
            with self.assertRaises(ProviderUnavailableError):
                adapter.generate_text(prompt='Test failure')

        self.assertEqual(adapter.circuit_breaker.state, CircuitState.OPEN)
        self.assertFalse(adapter.is_healthy())

    # 7. Router failover mechanism
    @patch('requests.post')
    def test_router_failover_to_secondary_provider(self, mock_post):
        router = ProviderRouter(task_name='text')
        primary_puter = PuterAdapter(api_key='mock-key')

        # Create a mock backup adapter
        backup_adapter = PuterAdapter(api_key='backup-key')
        backup_adapter.name = 'mock_backup'

        router.register_provider(backup_adapter)
        router.register_provider(primary_puter, as_primary=True)

        # Primary fails with 500, backup succeeds
        def side_effect(url, **kwargs):
            if 'Bearer mock-key' in kwargs.get('headers', {}).get('Authorization', ''):
                resp = MagicMock()
                resp.status_code = 500
                resp.ok = False
                resp.text = 'Primary down'
                return resp
            resp = MagicMock()
            resp.status_code = 200
            resp.ok = True
            resp.json.return_value = {'text': 'Success from backup provider'}
            return resp

        mock_post.side_effect = side_effect

        with patch('apps.providers.rate_budget.RateBudget.check_and_consume', return_value=True):
            result = router.execute_text(prompt='Test failover')
            self.assertEqual(result['provider'], 'mock_backup')
            self.assertEqual(result['text'], 'Success from backup provider')

    # 8. Unauthenticated AI gateway request rejected
    def test_ai_gateway_unauthenticated_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.post('/api/ai/generate/', {'prompt': 'test', 'task_type': 'text'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # 9. AI gateway invalid payload rejected
    def test_ai_gateway_invalid_payload_rejected(self):
        res1 = self.client.post('/api/ai/generate/', {'prompt': '', 'task_type': 'text'})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        res2 = self.client.post('/api/ai/generate/', {'prompt': 'hello', 'task_type': 'invalid_type'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    # 10. AI gateway authenticated text generation (mocked)
    @patch('apps.providers.router.ProviderRouter.execute_text')
    def test_ai_gateway_authenticated_text_success(self, mock_exec_text):
        mock_exec_text.return_value = {
            'provider': 'puter',
            'model': 'claude-3-5-sonnet',
            'text': 'Vizzy Scene Outline Ready',
        }

        payload = {
            'task_type': 'text',
            'prompt': 'Break down page 1 into 3 panels',
            'parameters': {'model': 'claude-3-5-sonnet'},
        }
        res = self.client.post('/api/ai/generate/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertEqual(res.data['result']['text'], 'Vizzy Scene Outline Ready')

    # 11. AI gateway authenticated image synthesis (mocked)
    @patch('apps.providers.router.ProviderRouter.execute_image')
    def test_ai_gateway_authenticated_image_success(self, mock_exec_image):
        mock_exec_image.return_value = {
            'provider': 'puter',
            'model': 'flux-schnell',
            'image_url': 'https://mock.storage/scene.png',
            'aspect_ratio': '16:9',
        }

        payload = {
            'task_type': 'image',
            'prompt': 'A neon samurai alley in rain',
            'parameters': {'aspect_ratio': '16:9'},
        }
        res = self.client.post('/api/ai/generate/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')
        self.assertEqual(res.data['result']['image_url'], 'https://mock.storage/scene.png')

    # 12. No provider secret exposed in API response
    def test_no_provider_secret_exposed_in_api(self):
        res = self.client.get('/api/ai/providers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['primary_llm'], 'puter')
        self.assertEqual(res.data['primary_image'], 'puter')
        serialized_output = str(res.data)
        self.assertNotIn('api_key', serialized_output)
        self.assertNotIn('token', serialized_output)
        self.assertNotIn('secret', serialized_output)
