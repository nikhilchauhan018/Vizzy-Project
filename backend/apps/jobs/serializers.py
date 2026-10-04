from rest_framework import serializers
from apps.jobs.models import GenerationJob, JobCheckpoint
from apps.pages.models import Panel, PanelVersion, Candidate


class JobCheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCheckpoint
        fields = ['id', 'step_name', 'payload', 'created_at']


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'option_index', 'image_url', 'seed', 'created_at']


class GenerationJobSerializer(serializers.ModelSerializer):
    checkpoints = JobCheckpointSerializer(many=True, read_only=True)
    candidates = serializers.SerializerMethodField()

    class Meta:
        model = GenerationJob
        fields = [
            'id',
            'panel_version',
            'status',
            'current_step',
            'error_message',
            'created_at',
            'updated_at',
            'checkpoints',
            'candidates',
        ]

    def get_candidates(self, obj):
        if obj.panel_version:
            return CandidateSerializer(obj.panel_version.candidates.all(), many=True).data
        return []


class GenerationJobCreateSerializer(serializers.Serializer):
    panel_id = serializers.UUIDField(required=False)
    panel_version_id = serializers.UUIDField(required=False)
    prompt_override = serializers.CharField(required=False, allow_blank=True, default='')
    num_candidates = serializers.IntegerField(required=False, default=3, min_value=1, max_value=6)

    def validate(self, attrs):
        if not attrs.get('panel_id') and not attrs.get('panel_version_id'):
            raise serializers.ValidationError("Either panel_id or panel_version_id is required.")
        return attrs
