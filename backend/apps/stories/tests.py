import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.stories.models import Project, StyleBible, Character, Environment, ChatMessage

User = get_user_model()


class StoryEngineAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='password123',
        )
        self.user2 = User.objects.create_user(
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

    # 14. User can delete their own project and cascade related items
    def test_delete_own_project(self):
        StyleBible.objects.create(
            project=self.project1,
            art_style='Noir',
            palette=['#000000', '#FFFFFF'],
            lighting_default='Low key',
            locked_style_prompt_prefix='Noir style',
        )
        Character.objects.create(
            project=self.project1,
            name='Detective John',
            appearance='Trench coat',
            uniform='Suit',
            hair='Slicked',
        )
        url = f'/api/stories/projects/{self.project1.id}/'
        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=self.project1.id).exists())
        self.assertFalse(StyleBible.objects.filter(project_id=self.project1.id).exists())
        self.assertFalse(Character.objects.filter(project_id=self.project1.id).exists())

    # 15. User cannot delete another user's project
    def test_cannot_delete_other_user_project(self):
        url = f'/api/stories/projects/{self.project2.id}/'
        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Project.objects.filter(id=self.project2.id).exists())

    # 16. User can delete StyleBible for their project
    def test_style_bible_delete_own_project(self):
        sb = StyleBible.objects.create(
            project=self.project1,
            art_style='Anime',
            palette=['#FF0000'],
            lighting_default='Bright',
            locked_style_prompt_prefix='Anime style',
        )
        url = f'/api/stories/projects/{self.project1.id}/style-bible/'
        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StyleBible.objects.filter(id=sb.id).exists())

    # 17. User cannot access or modify another user's StyleBible
    def test_cannot_access_or_modify_other_user_style_bible(self):
        StyleBible.objects.create(
            project=self.project2,
            art_style='Secret Style',
            palette=['#000000'],
            lighting_default='Dark',
            locked_style_prompt_prefix='Secret',
        )
        url = f'/api/stories/projects/{self.project2.id}/style-bible/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(url, {'art_style': 'Hacked'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)

    # 18. User cannot modify or delete another user's character
    def test_cannot_modify_or_delete_other_user_character(self):
        other_char = Character.objects.create(
            project=self.project2,
            name='Other Char',
            appearance='Normal',
            uniform='Civilian',
            hair='Brown',
        )
        url = f'/api/stories/projects/{self.project2.id}/characters/{other_char.id}/'
        self.assertEqual(
            self.client.patch(url, {'name': 'Hacked'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)

    # 19. User cannot modify or delete another user's environment
    def test_cannot_modify_or_delete_other_user_environment(self):
        other_env = Environment.objects.create(
            project=self.project2,
            name='Other Env',
            description='Restricted zone',
        )
        url = f'/api/stories/projects/{self.project2.id}/environments/{other_env.id}/'
        self.assertEqual(
            self.client.patch(url, {'name': 'Hacked'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)

    # 20. Project can be created with genre and defaults
    def test_project_create_with_genre(self):
        url = '/api/stories/projects/'
        data = {
            'title': 'Sci-Fi Odyssey',
            'genre': 'Cyberpunk',
            'story_notes': 'Neon rain',
            'historically_grounded': False,
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['genre'], 'Cyberpunk')

    # 21. Authenticated user can create own message
    def test_create_chat_message(self):
        url = f'/api/stories/projects/{self.project1.id}/messages/'
        data = {
            'sender': 'user',
            'content': 'Generate panel 1 with high contrast',
            'page_id': 'p-1',
            'message_type': 'text',
            'payload': {'action': 'generate'},
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['sender'], 'user')
        self.assertEqual(res.data['content'], 'Generate panel 1 with high contrast')
        self.assertEqual(res.data['page_id'], 'p-1')
        self.assertEqual(res.data['payload'], {'action': 'generate'})
        self.assertEqual(str(res.data['project']), str(self.project1.id))
        self.assertTrue('id' in res.data)
        self.assertTrue('created_at' in res.data)

    # 22. Authenticated user can list own messages in chronological order
    def test_list_messages_chronological_order(self):
        msg1 = ChatMessage.objects.create(
            project=self.project1,
            sender='user',
            content='First message',
            page_id='p-1',
        )
        msg2 = ChatMessage.objects.create(
            project=self.project1,
            sender='vizzy',
            content='Second message',
            page_id='p-1',
        )
        url = f'/api/stories/projects/{self.project1.id}/messages/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(res.data[0]['id'], str(msg1.id))
        self.assertEqual(res.data[1]['id'], str(msg2.id))

    # 23. Unauthenticated chat request rejected
    def test_unauthenticated_chat_rejected(self):
        self.client.force_authenticate(user=None)
        url = f'/api/stories/projects/{self.project1.id}/messages/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            self.client.post(url, {'content': 'Hello'}, format='json').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # 24. Cross-user message list rejected (404)
    def test_cross_user_message_list_rejected(self):
        ChatMessage.objects.create(
            project=self.project2,
            sender='user',
            content='User 2 secret prompt',
        )
        url = f'/api/stories/projects/{self.project2.id}/messages/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 25. Cross-user message creation rejected (404)
    def test_cross_user_message_creation_rejected(self):
        url = f'/api/stories/projects/{self.project2.id}/messages/'
        data = {
            'sender': 'user',
            'content': 'Attempt injection into project 2',
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 26. Invalid message data rejected (empty content, invalid sender)
    def test_invalid_message_data_rejected(self):
        url = f'/api/stories/projects/{self.project1.id}/messages/'
        # Empty content
        res1 = self.client.post(url, {'sender': 'user', 'content': '   '}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        # Invalid sender choice
        res2 = self.client.post(url, {'sender': 'invalid_actor', 'content': 'Test'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    # 27. Client cannot spoof project ownership or created_at
    def test_client_cannot_override_project_or_created_at(self):
        url = f'/api/stories/projects/{self.project1.id}/messages/'
        data = {
            'project': str(self.project2.id),
            'sender': 'user',
            'content': 'Testing read-only fields',
            'created_at': '2020-01-01T00:00:00Z',
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(res.data['project']), str(self.project1.id))
        self.assertNotEqual(res.data['created_at'], '2020-01-01T00:00:00Z')

    # 28. Message page_id filtering works
    def test_message_page_id_filtering(self):
        ChatMessage.objects.create(
            project=self.project1,
            sender='user',
            content='Page 1 prompt',
            page_id='p-1',
        )
        ChatMessage.objects.create(
            project=self.project1,
            sender='user',
            content='Page 2 prompt',
            page_id='p-2',
        )
        url = f'/api/stories/projects/{self.project1.id}/messages/?page_id=p-1'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['content'], 'Page 1 prompt')


class SceneExtractorUnitTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test_scene@vizzy.local', password='pwd')
        self.project = Project.objects.create(owner=self.user, title='Scene Test Project')
        self.char1 = Character.objects.create(project=self.project, name='Rook', role='Pilot')
        self.char2 = Character.objects.create(project=self.project, name='Vesper', role='Infiltrator')
        self.env1 = Environment.objects.create(project=self.project, name='Docks', weather='Foggy')

    def test_clean_json_response_with_markdown_fences(self):
        from apps.stories.services.scene_extractor import clean_json_response
        raw_markdown = """```json
        {
            "camera": "Low angle",
            "action": "Rook leaps over crates",
            "mood": "Urgent",
            "lighting_override": "Neon streetlamp",
            "character_ids": [],
            "environment_id": null,
            "extra_details": "Rain puddles"
        }
        ```"""
        parsed = clean_json_response(raw_markdown)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed['camera'], 'Low angle')
        self.assertEqual(parsed['action'], 'Rook leaps over crates')

    def test_validate_and_normalize_scene_json(self):
        from apps.stories.services.scene_extractor import validate_and_normalize_scene_json
        raw = {
            'camera': 'Wide shot',
            'action': 'Characters regroup',
            'character_ids': [str(self.char1.id), 'invalid-id-xyz'],
            'environment_id': str(self.env1.id),
        }
        normalized = validate_and_normalize_scene_json(
            raw,
            valid_character_ids=[str(self.char1.id), str(self.char2.id)],
            valid_environment_ids=[str(self.env1.id)],
        )
        self.assertEqual(normalized['camera'], 'Wide shot')
        self.assertEqual(normalized['character_ids'], [str(self.char1.id)])
        self.assertEqual(normalized['environment_id'], str(self.env1.id))

    def test_rule_based_fallback_extraction(self):
        from apps.stories.services.scene_extractor import extract_scene_json
        scene = extract_scene_json(
            instruction="Close up of Rook in the Docks",
            project=self.project,
        )
        self.assertEqual(scene['camera'], 'Close-up')
        self.assertIn(str(self.char1.id), scene['character_ids'])
        self.assertEqual(scene['environment_id'], str(self.env1.id))


