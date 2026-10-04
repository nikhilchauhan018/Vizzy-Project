import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.stories.models import Project, StyleBible, Character, Environment

User = get_user_model()


class StoryEngineAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123',
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123',
        )
        self.client.force_authenticate(user=self.user1)

        # Pre-seed a project for user1
        self.project1 = Project.objects.create(
            owner=self.user1,
            title='Project 1',
            story_notes='Notes for Project 1',
            historically_grounded=True,
            status='SETUP',
        )

        # Pre-seed a project for user2
        self.project2 = Project.objects.create(
            owner=self.user2,
            title='Project 2',
            story_notes='Notes for Project 2',
            historically_grounded=False,
            status='IN_PROGRESS',
        )

    # 1. Authenticated user can create a project
    def test_create_project(self):
        url = '/api/stories/projects/'
        data = {
            'title': 'New Story',
            'story_notes': 'A tale of adventure',
            'historically_grounded': False,
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'New Story')
        self.assertEqual(str(res.data['owner']), str(self.user1.id))

    # 2. User can list only their own projects
    def test_list_only_own_projects(self):
        url = '/api/stories/projects/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should only contain project1, not project2
        ids = [str(item['id']) for item in res.data]
        self.assertIn(str(self.project1.id), ids)
        self.assertNotIn(str(self.project2.id), ids)
        self.assertEqual(len(res.data), 1)

    # 3. User can retrieve their own project
    def test_retrieve_own_project(self):
        url = f'/api/stories/projects/{self.project1.id}/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], 'Project 1')

    # 4. User cannot retrieve another user's project
    def test_cannot_retrieve_other_user_project(self):
        url = f'/api/stories/projects/{self.project2.id}/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 5. User can update their own project
    def test_update_own_project(self):
        url = f'/api/stories/projects/{self.project1.id}/'
        res = self.client.patch(url, {'title': 'Updated Title'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.project1.refresh_from_db()
        self.assertEqual(self.project1.title, 'Updated Title')

    # 6. User cannot update another user's project
    def test_cannot_update_other_user_project(self):
        url = f'/api/stories/projects/{self.project2.id}/'
        res = self.client.patch(url, {'title': 'Hacked Title'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.project2.refresh_from_db()
        self.assertEqual(self.project2.title, 'Project 2')

    # 7. User can create, update, list, delete their own characters
    def test_character_crud_own_project(self):
        url = f'/api/stories/projects/{self.project1.id}/characters/'
        data = {
            'name': 'Captain Miller',
            'role': 'Squad Leader',
            'age': '38',
            'appearance': 'Weathered, focused gaze',
            'uniform': 'Ranger field jacket',
            'hair': 'Cropped dark hair',
        }
        # Create
        create_res = self.client.post(url, data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        char_id = create_res.data['id']

        # List
        list_res = self.client.get(url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Retrieve
        detail_url = f'/api/stories/projects/{self.project1.id}/characters/{char_id}/'
        get_res = self.client.get(detail_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['name'], 'Captain Miller')

        # Update
        patch_res = self.client.patch(detail_url, {'role': 'Captain'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['role'], 'Captain')

        # Delete
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Character.objects.filter(id=char_id).count(), 0)

    # 8. User cannot access another user's characters
    def test_cannot_access_other_user_characters(self):
        other_char = Character.objects.create(
            project=self.project2,
            name='Enemy Sniper',
            appearance='Concealed',
            uniform='Camouflage',
            hair='Unknown',
        )
        url = f'/api/stories/projects/{self.project2.id}/characters/'
        # Cannot list
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        # Cannot create inside other's project
        self.assertEqual(
            self.client.post(url, {'name': 'Intruder', 'appearance': 'x', 'uniform': 'x', 'hair': 'x'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        # Cannot retrieve
        detail_url = f'/api/stories/projects/{self.project2.id}/characters/{other_char.id}/'
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)

    # 9. User can create, update, list, delete their own environments
    def test_environment_crud_own_project(self):
        url = f'/api/stories/projects/{self.project1.id}/environments/'
        data = {
            'name': 'Omaha Beach Dog White',
            'description': 'Tidal shingle covered in obstacles',
            'weather': 'Cold rain and ocean spray',
            'time_of_day': '06:30 Morning Twilight',
        }
        # Create
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        env_id = res.data['id']

        # List
        list_res = self.client.get(url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Update
        detail_url = f'/api/stories/projects/{self.project1.id}/environments/{env_id}/'
        patch_res = self.client.patch(detail_url, {'weather': 'Overcast haze'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['weather'], 'Overcast haze')

        # Delete
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Environment.objects.filter(id=env_id).count(), 0)

    # 10. User cannot access another user's environments
    def test_cannot_access_other_user_environments(self):
        other_env = Environment.objects.create(
            project=self.project2,
            name='Secret Bunker',
            description='Reinforced concrete',
        )
        url = f'/api/stories/projects/{self.project2.id}/environments/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        detail_url = f'/api/stories/projects/{self.project2.id}/environments/{other_env.id}/'
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)

    # 11. User can create, update, retrieve the StyleBible for their project
    def test_style_bible_crud_own_project(self):
        url = f'/api/stories/projects/{self.project1.id}/style-bible/'
        data = {
            'art_style': 'Cinematic graphic novel with ink shadows',
            'palette': ['#1C242C', '#39464E', '#B45309'],
            'lighting_default': 'High contrast chiaroscuro',
            'aspect_ratio': '16:9',
            'render_medium': 'Ink on digital watercolor',
            'locked_style_prompt_prefix': 'Graphic novel illustration',
        }
        # Create
        create_res = self.client.post(url, data, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['art_style'], 'Cinematic graphic novel with ink shadows')

        # Retrieve
        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['aspect_ratio'], '16:9')

        # Update
        patch_res = self.client.patch(url, {'art_style': 'Updated Art Style'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['art_style'], 'Updated Art Style')

        # Cannot create second StyleBible (1:1 constraint)
        dup_res = self.client.post(url, data, format='json')
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

    # 12. Invalid data returns proper validation errors
    def test_invalid_data_validation(self):
        url = f'/api/stories/projects/{self.project1.id}/style-bible/'
        data = {
            'art_style': 'Some style',
            'palette': 'NOT_A_LIST',  # Invalid palette type
            'lighting_default': 'Dim',
            'locked_style_prompt_prefix': 'Prefix',
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('palette', res.data)

    # 13. Unauthenticated requests are rejected
    def test_unauthenticated_requests_rejected(self):
        unauth_client = APIClient()
        url = '/api/stories/projects/'
        res = unauth_client.get(url)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
