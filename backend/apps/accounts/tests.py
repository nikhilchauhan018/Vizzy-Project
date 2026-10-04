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

    # 1. Signup with email succeeds
    def test_signup_with_email_succeeds(self):
        payload = {
            'email': 'new_artist@vizzy.studio',
            'full_name': 'New Artist',
            'password': 'CreateArt2026!',
        }
        response = self.client.post(reverse('account-signup'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'new_artist@vizzy.studio')
        self.assertEqual(response.data['user']['full_name'], 'New Artist')
        self.assertNotIn('username', response.data['user'])

        # Verify password is not plaintext
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
        response = self.client.post(reverse('account-signup'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # 3. Signup does not require username
    def test_signup_does_not_require_username(self):
        payload = {
            'email': 'no_username@vizzy.studio',
            'full_name': 'Direct Signup',
            'password': 'Password12345!',
        }
        self.assertNotIn('username', payload)
        response = self.client.post(reverse('account-signup'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'no_username@vizzy.studio')

    # 4. Login with email succeeds
    def test_login_with_email_succeeds(self):
        payload = {
            'email': 'tester@vizzy.studio',
            'password': 'SecurePassword123!',
        }
        response = self.client.post(reverse('account-login'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'tester@vizzy.studio')
        self.assertEqual(response.data['user']['full_name'], 'Auth Tester')

        # Test case-insensitivity on login email
        case_payload = {
            'email': 'TESTER@VIZZY.STUDIO',
            'password': 'SecurePassword123!',
        }
        case_response = self.client.post(reverse('account-login'), case_payload, format='json')
        self.assertEqual(case_response.status_code, status.HTTP_200_OK)

    # 5. Login with incorrect password fails
    def test_login_with_incorrect_password_fails(self):
        payload = {
            'email': 'tester@vizzy.studio',
            'password': 'WrongPassword!',
        }
        response = self.client.post(reverse('account-login'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    # 6. Login with username must NOT be supported
    def test_login_with_username_must_not_be_supported(self):
        payload = {
            'username': 'auth_tester',
            'password': 'SecurePassword123!',
        }
        response = self.client.post(reverse('account-login'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Should complain about email or missing required email field
        self.assertTrue('email' in response.data or 'detail' in response.data)

    # 7. Current user returns email/full_name
    def test_current_user_returns_email_full_name(self):
        token, _ = Token.objects.get_or_create(user=self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        response = self.client.get(reverse('account-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'tester@vizzy.studio')
        self.assertEqual(response.data['full_name'], 'Auth Tester')
        self.assertNotIn('username', response.data)

    # 8. Logout works
    def test_logout_works(self):
        token, _ = Token.objects.get_or_create(user=self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')
        logout_response = self.client.post(reverse('account-logout'))
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Token should now be deleted from database
        self.assertFalse(Token.objects.filter(key=token.key).exists())

        # Old token is rejected
        me_response = self.client.get(reverse('account-me'))
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 9. Unauthenticated protected requests remain rejected
    def test_unauthenticated_protected_requests_remain_rejected(self):
        response_me = self.client.get(reverse('account-me'))
        self.assertEqual(response_me.status_code, status.HTTP_401_UNAUTHORIZED)

        response_projects = self.client.get(reverse('project-list'))
        self.assertEqual(response_projects.status_code, status.HTTP_401_UNAUTHORIZED)

    # 10. Existing Stories ownership tests remain passing / Cross-user isolation
    def test_cross_user_isolation(self):
        project = Project.objects.create(
            owner=self.existing_user,
            title="User A Secret Project",
            story_notes="Restricted"
        )
        user_b = User.objects.create_user(
            email='user_b@vizzy.studio',
            password='UserBPassword123!',
            first_name='User',
            last_name='B',
        )
        token_b, _ = Token.objects.get_or_create(user=user_b)

        # User B cannot retrieve User A's project
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b.key}')
        response = self.client.get(reverse('project-detail', kwargs={'pk': project.id}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # User B's project list does NOT contain User A's project
        list_response = self.client.get(reverse('project-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        project_ids = [p['id'] for p in list_response.data]
        self.assertNotIn(str(project.id), project_ids)
