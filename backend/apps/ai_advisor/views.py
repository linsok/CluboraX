import re
import logging
from typing import Any, Dict, Optional
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
from .rag_service import RAGChatService
from apps.core.views import StandardResultsSetPagination

logger = logging.getLogger(__name__)

MODE_ADVICE_TYPE_MAP = {
    'event': 'event_proposal',
    'club': 'club_proposal',
    'budget': 'budget_optimization',
    'policy': 'policy_compliance',
    'general': 'content_improvement',
    'content': 'content_improvement',
}


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
        extra_context = serializer.validated_data.get('context') or {}

        advice_type = MODE_ADVICE_TYPE_MAP.get(mode, 'content_improvement')
        ai_response: Optional[str] = None
        rag_meta: Dict[str, Any] = {}

        # 1) Prefer RAG chatbot (Chroma + embeddings + optional Ollama)
        rag = RAGChatService()
        if rag.available:
            rag_result = rag.answer(message)
            ai_response = rag_result.answer
            rag_meta = {
                'rag_kind': rag_result.kind,
                'rag_distance': rag_result.distance,
            }
        else:
            # Match the original terminal chatbot behavior: no rule-based answers.
            # If the RAG engine is warming up (model download/load), tell the user.
            initializing = bool(getattr(RAGChatService, '_initializing', False))
            rag_meta = {'rag_kind': 'warming_up' if initializing else 'unavailable'}
            ai_response = (
                'AI chatbot is warming up. Please try again in a moment.'
                if initializing
                else 'AI chatbot is not available on this server.'
            )

        # 3) Persist chat record
        try:
            AIAdvice.objects.create(
                user=request.user,
                advice_type=advice_type,
                title=f"Chat: {message[:100]}",
                content=message,
                context={
                    'session_id': session_id,
                    'mode': mode,
                    **(extra_context if isinstance(extra_context, dict) else {}),
                    **rag_meta,
                },
                suggestions=[{'suggestion': ai_response}],
                status='completed',
                confidence_score=0.85 if rag_meta.get('rag_kind') in ('retrieved', 'generated') else 0.0,
            )
        except Exception as e:
            logger.debug(f"Failed to persist chat record: {e}")

        return Response({
            'message': ai_response,
            'mode': mode,
            'session_id': session_id,
            'meta': rag_meta,
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
        # Accept both the new payload shape (content/content_type)
        # and an older/incorrect frontend payload (title/description/type).
        content = request.data.get('content', '')
        content_type = request.data.get('content_type', '')
        context = request.data.get('context', {})

        if not content:
            title = request.data.get('title', '')
            description = request.data.get('description', '')
            if title or description:
                content = f"{title}\n\n{description}".strip()

        if not content_type:
            content_type = request.data.get('type', 'event')

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


class AIAdvisorStatsView(APIView):
    """GET /api/ai-advisor/stats/ — simple per-user stats for the AI Advisor UI."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Keep it intentionally small + fast.
        user_advices = AIAdvice.objects.filter(user=request.user)
        last_50 = user_advices.order_by('-created_at')[:50]

        by_type: Dict[str, int] = {}
        for a in last_50:
            by_type[a.advice_type] = by_type.get(a.advice_type, 0) + 1

        return Response({
            'total_advices': user_advices.count(),
            'recent_advices_by_type': by_type,
        })


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
