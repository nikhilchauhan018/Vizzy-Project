import uuid
from rest_framework import serializers
from apps.pages.models import Page, Panel, PanelVersion, Candidate


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'panel_version', 'option_index', 'image_url', 'seed', 'created_at']
        read_only_fields = ['id', 'created_at']


class PanelVersionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)

    class Meta:
        model = PanelVersion
        fields = [
            'id',
            'panel',
            'parent_version',
            'version_number',
            'prompt_used',
            'image_url',
            'created_at',
            'candidates',
        ]
        read_only_fields = ['id', 'created_at', 'candidates']


class PanelSerializer(serializers.ModelSerializer):
    versions = PanelVersionSerializer(many=True, read_only=True)
    current_version = serializers.SerializerMethodField()

    class Meta:
        model = Panel
        fields = [
            'id',
            'page',
            'panel_index',
            'scene_json',
            'compiled_prompt',
            'created_at',
            'updated_at',
            'versions',
            'current_version',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_version(self, obj):
        latest = obj.versions.order_by('-version_number').first()
        if latest:
            return PanelVersionSerializer(latest).data
        return None


class PageSerializer(serializers.ModelSerializer):
    panels = PanelSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = [
            'id',
            'project',
            'order',
            'page_number',
            'title',
            'layout_mode',
            'status',
            'created_at',
            'updated_at',
            'panels',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
