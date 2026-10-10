"""
Tests for Pages app, Prompt Compiler, and Candidate Selection API.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.pages.models import Page, Panel, PanelVersion, Candidate
from apps.pages.services.prompt_compiler import compile_prompt
from apps.stories.models import Project, StyleBible, Character, Environment

User = get_user_model()


class PromptCompilerUnitTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='author@vizzy.local', password='pwd')
        self.project = Project.objects.create(owner=self.user, title='Compiler Test Project')
        self.style_bible = StyleBible.objects.create(
            project=self.project,
            art_style='Dark Fantasy Graphic Novel',
            render_medium='Traditional Ink Wash',
            palette=['#0a0a0a', '#8b0000', '#d4af37'],
            lighting_default='Eerie moonlight with high contrast',
            aspect_ratio='16:9',
            locked_style_prompt_prefix='Award winning dark fantasy graphic novel illustration',
        )
        self.char = Character.objects.create(
            project=self.project,
            name='Morrigan',
            role='Sorceress',
            age='Young Adult',
            appearance='Silver hair, raven feather mantle',
            uniform='Obsidian armor',
        )
        self.env = Environment.objects.create(
            project=self.project,
            name='Forgotten Ruins',
            weather='Driving sleet',
            time_of_day='Dusk',
        )

    def test_deterministic_prompt_compilation(self):
        scene_params = {
            'camera': 'Low angle dynamic shot',
            'action': 'Morrigan raises her staff channeling arcane fire',
            'mood': 'Ominous',
            'character_ids': [str(self.char.id)],
            'environment_id': str(self.env.id),
        }
        prompt = compile_prompt(
            style_bible=self.style_bible,
            characters=[self.char],
            environments=[self.env],
            scene_params=scene_params,
        )

        # Verify all components merged
        self.assertIn('Award winning dark fantasy graphic novel illustration', prompt)
        self.assertIn('Art Style: Dark Fantasy Graphic Novel', prompt)
        self.assertIn('Render Medium: Traditional Ink Wash', prompt)
        self.assertIn('Color Palette: #0a0a0a, #8b0000, #d4af37', prompt)
        self.assertIn('Low angle dynamic shot', prompt)
        self.assertIn('Forgotten Ruins', prompt)
        self.assertIn('Driving sleet', prompt)
        self.assertIn('Morrigan (Sorceress, Young Adult)', prompt)
        self.assertIn('Silver hair, raven feather mantle', prompt)
        self.assertIn('Morrigan raises her staff channeling arcane fire', prompt)

    def test_dialogue_is_strictly_excluded_from_prompt(self):
        """Dialogue or speech text is handled in composition layer, never in prompt compiler."""
        scene_params = {
            'action': 'Characters speaking',
            'dialogue': 'I will not surrender!',
        }
        prompt = compile_prompt(
            style_bible=self.style_bible,
            scene_params=scene_params,
        )
        self.assertNotIn('I will not surrender!', prompt)


class CandidateSelectionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='creator@vizzy.local', password='pwd')
        self.other_user = User.objects.create_user(email='intruder@vizzy.local', password='pwd')

        self.project = Project.objects.create(owner=self.user, title='Selection Project')
        self.page = Page.objects.create(project=self.project, page_number='01', order=1)
        self.panel = Panel.objects.create(page=self.page, panel_index=0)
        self.panel_version = PanelVersion.objects.create(panel=self.panel, version_number=1, prompt_used='test prompt')

        self.candidate1 = Candidate.objects.create(
            panel_version=self.panel_version,
            option_index=0,
            image_url='https://res.cloudinary.com/vizzy/option-1.jpg',
            seed=101,
        )
        self.candidate2 = Candidate.objects.create(
            panel_version=self.panel_version,
            option_index=1,
            image_url='https://res.cloudinary.com/vizzy/option-2.jpg',
            seed=102,
        )

        self.client.force_authenticate(user=self.user)

    def test_select_candidate_updates_version_and_approves_page(self):
        url = f'/api/pages/candidates/{self.candidate2.id}/select/'
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.panel_version.refresh_from_db()
        self.page.refresh_from_db()

        self.assertEqual(self.panel_version.image_url, self.candidate2.image_url)
        self.assertEqual(self.page.status, Page.PageStatus.APPROVED)

    def test_panel_scoped_candidate_selection(self):
        url = f'/api/pages/panels/{self.panel.id}/candidates/{self.candidate1.id}/select/'
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.panel_version.refresh_from_db()
        self.assertEqual(self.panel_version.image_url, self.candidate1.image_url)

    def test_other_user_cannot_select_candidates(self):
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/pages/candidates/{self.candidate1.id}/select/'
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
