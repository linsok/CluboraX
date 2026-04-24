from rest_framework import serializers
from .models import AIAdvice, AIInteraction, AIKnowledgeBase
from django.contrib.auth import get_user_model

User = get_user_model()


class AIAdviceSerializer(serializers.ModelSerializer):
    advice_type_display = serializers.CharField(source='get_advice_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_display = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = AIAdvice
        fields = [
            'id', 'user_display', 'advice_type', 'advice_type_display',
            'status', 'status_display',
            'title', 'content', 'context',
            'analysis_result', 'suggestions', 'confidence_score',
            'user_feedback', 'is_helpful', 'applied',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user_display', 'analysis_result', 'suggestions',
            'confidence_score', 'status', 'created_at', 'updated_at',
        ]


class AIAdviceCreateSerializer(serializers.Serializer):
    """Generic create serializer — used as a base for chat / analyze endpoints."""
    advice_type = serializers.ChoiceField(choices=[
        'event_proposal', 'club_proposal', 'content_improvement',
        'policy_compliance', 'budget_optimization',
    ])
    title = serializers.CharField(max_length=200)
    content = serializers.CharField()
    context = serializers.DictField(required=False, default=dict)


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
    mode = serializers.ChoiceField(
        choices=['general', 'event', 'club', 'budget', 'policy'],
        default='general',
    )
    session_id = serializers.CharField(required=False, allow_blank=True)


class ChatHistoryClearSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=False, allow_blank=True)


class FeedbackSerializer(serializers.Serializer):
    is_helpful = serializers.BooleanField()
    comment = serializers.CharField(required=False, allow_blank=True)


class AIKnowledgeBaseSerializer(serializers.ModelSerializer):
    knowledge_type_display = serializers.CharField(source='get_knowledge_type_display', read_only=True)

    class Meta:
        model = AIKnowledgeBase
        fields = [
            'id', 'title', 'knowledge_type', 'knowledge_type_display',
            'content', 'category', 'tags', 'priority',
            'relevance_score', 'accuracy_score',
        ]
