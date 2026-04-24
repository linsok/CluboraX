import re
import logging
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AIAdvice, AIInteraction
from .serializers import (
    AIAdviceSerializer,
    ChatMessageSerializer,
    FeedbackSerializer,
)
from .services import AIAdvisorService
from apps.core.views import StandardResultsSetPagination

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple rule-based chat — used when no LLM backend is configured
# ---------------------------------------------------------------------------

CHAT_RESPONSES = {
    'event': [
        "For successful events, ensure you have a clear objective, sufficient budget, and proper venue arrangements.",
        "Consider your target audience when planning event activities and scheduling.",
        "Make sure to promote your event at least 2 weeks in advance through multiple channels.",
        "Document all event requirements including equipment, volunteers, and logistics.",
        "Always have a contingency plan for unexpected situations during the event.",
    ],
    'club': [
        "A strong club needs clear goals, active membership, and regular activities.",
        "Define your club's mission statement and values to attract like-minded members.",
        "Plan at least one major event per semester to maintain member engagement.",
        "Create a structured leadership hierarchy with clear roles and responsibilities.",
        "Budget planning is critical — track all income and expenditure carefully.",
    ],
    'budget': [
        "Start with a detailed budget breakdown to avoid overspending.",
        "Always include a contingency buffer of 10-15% for unexpected costs.",
        "Look for sponsorship opportunities to supplement your budget.",
        "Track all expenses in real-time and compare against your budget monthly.",
        "Prioritize essential expenses before allocating funds to optional items.",
    ],
    'policy': [
        "Review campus policies regularly to ensure your activities remain compliant.",
        "All club activities must be approved by the student affairs office.",
        "Ensure all events comply with venue capacity and safety regulations.",
        "Financial transactions must follow university procurement guidelines.",
        "Maintain accurate records of all club activities for audit purposes.",
    ],
    'general': [
        "I'm here to help with event planning, club management, budget advice, and policy guidance.",
        "You can ask me about best practices for organizing events or managing clubs.",
        "Need help with a specific aspect of your club or event? I can provide targeted advice.",
        "I can analyze proposals and suggest improvements to help ensure success.",
        "Feel free to ask about policies, budgets, member recruitment, or event logistics.",
    ],
}

MODE_ADVICE_TYPE_MAP = {
    'event': 'event_proposal',
    'club': 'club_proposal',
    'budget': 'budget_optimization',
    'policy': 'policy_compliance',
    'general': 'content_improvement',
}


def _rule_based_response(message: str, mode: str) -> str:
    """Return a simple rule-based response for a chat message."""
    message_lower = message.lower()
    if any(w in message_lower for w in ['event', 'organize', 'schedule', 'venue', 'activity']):
        bucket = 'event'
    elif any(w in message_lower for w in ['club', 'member', 'recruitment', 'leader']):
        bucket = 'club'
    elif any(w in message_lower for w in ['budget', 'cost', 'fund', 'spend', 'expense', 'money']):
        bucket = 'budget'
    elif any(w in message_lower for w in ['policy', 'rule', 'regulation', 'compliance', 'guideline']):
        bucket = 'policy'
    else:
        bucket = mode if mode in CHAT_RESPONSES else 'general'

    responses = CHAT_RESPONSES[bucket]
    # Rotate through responses based on message length to add variety
    index = len(message) % len(responses)
    return responses[index]


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class ChatView(APIView):
    """
    POST /api/ai-advisor/chat/
    Send a message and receive an AI response.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        mode = serializer.validated_data.get('mode', 'general')
        session_id = serializer.validated_data.get('session_id', '')

        # Try the full AI service first; fall back to rule-based
        ai_service = AIAdvisorService()
        advice_type = MODE_ADVICE_TYPE_MAP.get(mode, 'content_improvement')
        ai_response = None

        try:
            advice = ai_service.improve_content(
                user=request.user,
                content=message,
                content_type=mode,
                context={'session_id': session_id, 'mode': mode},
            )
            # Build response text from suggestions
            if advice.suggestions:
                if isinstance(advice.suggestions, list):
                    parts = []
                    for s in advice.suggestions:
                        if isinstance(s, dict):
                            text = s.get('suggestion') or s.get('message') or str(s)
                        else:
                            text = str(s)
                        parts.append(text)
                    ai_response = '\n\n'.join(parts) if parts else None
                elif isinstance(advice.suggestions, str):
                    ai_response = advice.suggestions
        except Exception as e:
            logger.warning(f"AI service unavailable, using rule-based response: {e}")

        # Fall back to rule-based if service returned nothing
        if not ai_response:
            ai_response = _rule_based_response(message, mode)
            # Store a lightweight record anyway
            try:
                AIAdvice.objects.create(
                    user=request.user,
                    advice_type=advice_type,
                    title=f"Chat: {message[:100]}",
                    content=message,
                    context={'session_id': session_id, 'mode': mode},
                    suggestions=[{'suggestion': ai_response}],
                    status='completed',
                    confidence_score=0.7,
                )
            except Exception:
                pass  # Non-critical — logging only

        return Response({
            'message': ai_response,
            'mode': mode,
            'session_id': session_id,
        })


class ChatHistoryView(APIView):
    """
    GET    /api/ai-advisor/history/   — retrieve chat history
    DELETE /api/ai-advisor/history/   — clear chat history
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        session_id = request.query_params.get('session_id', '')
        qs = AIAdvice.objects.filter(user=request.user).order_by('-created_at')
        if session_id:
            qs = qs.filter(context__session_id=session_id)

        limit = int(request.query_params.get('limit', 20))
        advices = qs[:limit]
        data = []
        for a in advices:
            suggestions = a.suggestions
            if isinstance(suggestions, list) and suggestions:
                first = suggestions[0]
                response_text = first.get('suggestion', '') if isinstance(first, dict) else str(first)
            else:
                response_text = str(suggestions) if suggestions else ''

            data.append({
                'id': str(a.id),
                'user_message': a.content,
                'ai_response': response_text,
                'mode': a.context.get('mode', 'general') if isinstance(a.context, dict) else 'general',
                'created_at': a.created_at,
            })

        return Response({'results': data, 'count': len(data)})

    def delete(self, request):
        session_id = request.query_params.get('session_id', '')
        qs = AIAdvice.objects.filter(user=request.user)
        if session_id:
            qs = qs.filter(context__session_id=session_id)
        deleted, _ = qs.delete()
        return Response({'deleted': deleted})


class AnalyzeEventView(APIView):
    """
    POST /api/ai-advisor/analyze-event/
    Analyze an event proposal.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        context = request.data.get('context', {})

        if not title or not description:
            return Response(
                {'detail': 'title and description are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = AIAdvisorService()
            advice = service.analyze_event_proposal(
                user=request.user,
                title=title,
                description=description,
                context=context,
            )
            return Response(AIAdviceSerializer(advice).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"analyze_event_proposal failed: {e}")
            return Response(
                {'detail': 'Analysis failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AnalyzeClubView(APIView):
    """
    POST /api/ai-advisor/analyze-club/
    Analyze a club proposal.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        context = request.data.get('context', {})

        if not title or not description:
            return Response(
                {'detail': 'title and description are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = AIAdvisorService()
            advice = service.analyze_club_proposal(
                user=request.user,
                title=title,
                description=description,
                context=context,
            )
            return Response(AIAdviceSerializer(advice).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"analyze_club_proposal failed: {e}")
            return Response(
                {'detail': 'Analysis failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SuggestView(APIView):
    """
    POST /api/ai-advisor/suggest/
    Get generic content improvement suggestions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content = request.data.get('content', '')
        content_type = request.data.get('content_type', 'general')
        context = request.data.get('context', {})

        if not content:
            return Response(
                {'detail': 'content is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = AIAdvisorService()
            advice = service.improve_content(
                user=request.user,
                content=content,
                content_type=content_type,
                context=context,
            )
            return Response(AIAdviceSerializer(advice).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"improve_content failed: {e}")
            return Response(
                {'detail': 'Suggestion generation failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ComplianceCheckView(APIView):
    """
    POST /api/ai-advisor/check-compliance/
    Check policy compliance for given content.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content = request.data.get('content', '')
        content_type = request.data.get('content_type', 'event')
        context = request.data.get('context', {})

        if not content:
            return Response(
                {'detail': 'content is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = AIAdvisorService()
            # Use improve_content with policy content_type as proxy for compliance check
            advice = service.improve_content(
                user=request.user,
                content=content,
                content_type='policy',
                context={**context, 'original_content_type': content_type, 'check_type': 'compliance'},
            )
            return Response(AIAdviceSerializer(advice).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"check_compliance failed: {e}")
            return Response(
                {'detail': 'Compliance check failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AIAdviceListView(generics.ListAPIView):
    """
    GET /api/ai-advisor/advices/   — list user's AI advice records
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIAdviceSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = AIAdvice.objects.filter(user=self.request.user).order_by('-created_at')
        advice_type = self.request.query_params.get('advice_type')
        if advice_type:
            qs = qs.filter(advice_type=advice_type)
        return qs


class AIAdviceDetailView(APIView):
    """
    GET   /api/ai-advisor/advices/<id>/            — retrieve
    PATCH /api/ai-advisor/advices/<id>/feedback/   — submit feedback
    """
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk, user):
        try:
            return AIAdvice.objects.get(pk=pk, user=user)
        except AIAdvice.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk, request.user)
        if obj is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AIAdviceSerializer(obj).data)


class AIAdviceFeedbackView(APIView):
    """
    POST /api/ai-advisor/advices/<id>/feedback/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            advice = AIAdvice.objects.get(pk=pk, user=request.user)
        except AIAdvice.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        advice.is_helpful = serializer.validated_data['is_helpful']
        advice.user_feedback = serializer.validated_data.get('comment', '')
        advice.save(update_fields=['is_helpful', 'user_feedback'])

        return Response({'detail': 'Feedback recorded.', 'is_helpful': advice.is_helpful})
