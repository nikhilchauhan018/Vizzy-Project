from rest_framework import serializers
from .models import Project, StyleBible, Character, Environment


class StyleBibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StyleBible
        fields = [
            'id',
            'project',
            'art_style',
            'palette',
            'lighting_default',
            'aspect_ratio',
            'render_medium',
            'locked_style_prompt_prefix',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']

    def validate_palette(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Palette must be a list of color strings.")
        return value


class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = [
            'id',
            'project',
            'name',
            'role',
            'age',
            'appearance',
            'uniform',
            'hair',
            'reference_image_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']


class EnvironmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Environment
        fields = [
            'id',
            'project',
            'name',
            'description',
            'weather',
            'time_of_day',
            'reference_image_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    style_bible = StyleBibleSerializer(read_only=True)
    characters = CharacterSerializer(many=True, read_only=True)
    environments = EnvironmentSerializer(many=True, read_only=True)
    characters_count = serializers.IntegerField(source='characters.count', read_only=True)
    environments_count = serializers.IntegerField(source='environments.count', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'owner',
            'title',
            'story_notes',
            'historically_grounded',
            'status',
            'style_bible',
            'characters',
            'environments',
            'characters_count',
            'environments_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
