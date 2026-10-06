from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.stories.models import Project

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'tester@vizzy.studio',
            'full_name': 'Auth Tester',
            'password': 'SecurePassword123!',
        }
        self.existing_user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name='Auth',
            last_name='Tester',
        )

    # 1. Successful signup
    def test_signup_with_email_succeeds(self):
        payload = {
            'email': 'new_artist@vizzy.studio',
            'full_name': 'New Artist',
            'password': 'CreateArt2026!',
        }
        response = self.client.post('/api/auth/signup/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'new_artist@vizzy.studio')
        self.assertEqual(response.data['user']['full_name'], 'New Artist')
        self.assertNotIn('username', response.data['user'])

        # Verify password is not stored plaintext
        created = User.objects.get(email='new_artist@vizzy.studio')
        self.assertNotEqual(created.password, 'CreateArt2026!')
        self.assertTrue(created.check_password('CreateArt2026!'))

    # 2. Duplicate email is rejected case-insensitively
    def test_duplicate_email_rejected_case_insensitively(self):
        payload = {
            'email': 'TESTER@VIZZY.STUDIO',  # Existing is tester@vizzy.studio
            'full_name': 'Duplicate User',
            'password': 'AnotherPassword123!',
        }
        response = self.client.post('/api/auth/signup/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # 3. Successful login
    def test_login_with_email_succeeds(self):
        payload = {
            'email': 'tester@vizzy.studio',
            'password': 'SecurePassword123!',
        }
        response = self.client.post('/api/auth/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'tester@vizzy.studio')
        self.assertEqual(response.data['user']['full_name'], 'Auth Tester')

    # 4. Wrong password returns authentication error
    def test_login_with_incorrect_password_fails(self):
        payload = {
            'email': 'tester@vizzy.studio',
            'password': 'WrongPassword!',
        }
        response = self.client.post('/api/auth/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    # 5. Unknown email returns authentication error
    def test_login_with_unknown_email_fails(self):
        payload = {
            'email': 'nonexistent@vizzy.studio',
            'password': 'Password123!',
        }
        response = self.client.post('/api/auth/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    # 6. Case-insensitive email login
    def test_case_insensitive_email_login(self):
        case_payload = {
            'email': 'TeStEr@ViZzY.sTuDiO',
            'password': 'SecurePassword123!',
        }
        case_response = self.client.post('/api/auth/login/', case_payload, format='json')
        self.assertEqual(case_response.status_code, status.HTTP_200_OK)
        self.assertEqual(case_response.data['user']['email'], 'tester@vizzy.studio')

    # 7. /me authenticated returns current user
    def test_me_authenticated_returns_user(self):
        token, _ = Token.objects.get_or_create(user=self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'tester@vizzy.studio')
        self.assertEqual(response.data['full_name'], 'Auth Tester')
        self.assertNotIn('username', response.data)

    # 8. /me unauthenticated returns 401
    def test_me_unauthenticated_returns_401(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 9. Protected API with valid authentication
    def test_protected_api_with_valid_auth(self):
        project = Project.objects.create(
            owner=self.existing_user,
            title="My Graphic Novel",
            story_notes="Notes"
        )
        token, _ = Token.objects.get_or_create(user=self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        response = self.client.get('/api/stories/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(project.id))

    # 10. Protected API without authentication returns 401
    def test_protected_api_without_auth(self):
        response = self.client.get('/api/stories/projects/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 11. Logout clears token and invalidates future requests
    def test_logout_invalidates_token(self):
        token, _ = Token.objects.get_or_create(user=self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        logout_response = self.client.post('/api/auth/logout/')
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Token should now be deleted from database
        self.assertFalse(Token.objects.filter(key=token.key).exists())

        # Old token is rejected
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 12. Session restore / authenticated request with Token header or Bearer keyword
    def test_session_restore_and_dual_auth_headers(self):
        token, _ = Token.objects.get_or_create(user=self.existing_user)

        # 12a. Authorization: Bearer <key>
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        res_bearer = self.client.get('/api/auth/me/')
        self.assertEqual(res_bearer.status_code, status.HTTP_200_OK)
        self.assertEqual(res_bearer.data['id'], str(self.existing_user.id))

        # 12b. Authorization: Token <key>
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        res_token = self.client.get('/api/auth/me/')
        self.assertEqual(res_token.status_code, status.HTTP_200_OK)
        self.assertEqual(res_token.data['id'], str(self.existing_user.id))

    # 13. Backwards compatibility: /api/accounts/ routes work identically
    def test_accounts_route_backward_compatibility(self):
        payload = {
            'email': 'tester@vizzy.studio',
            'password': 'SecurePassword123!',
        }
        res = self.client.post('/api/accounts/login/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
