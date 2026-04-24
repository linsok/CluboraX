from django.urls import path
from .views import (
    ChatView,
    ChatHistoryView,
    AnalyzeEventView,
    AnalyzeClubView,
    SuggestView,
    ComplianceCheckView,
    AIAdviceListView,
    AIAdviceDetailView,
    AIAdviceFeedbackView,
)

urlpatterns = [
    path('chat/', ChatView.as_view(), name='ai-chat'),
    path('history/', ChatHistoryView.as_view(), name='ai-chat-history'),
    path('analyze-event/', AnalyzeEventView.as_view(), name='ai-analyze-event'),
    path('analyze-club/', AnalyzeClubView.as_view(), name='ai-analyze-club'),
    path('suggest/', SuggestView.as_view(), name='ai-suggest'),
    path('check-compliance/', ComplianceCheckView.as_view(), name='ai-check-compliance'),
    path('advices/', AIAdviceListView.as_view(), name='ai-advice-list'),
    path('advices/<uuid:pk>/', AIAdviceDetailView.as_view(), name='ai-advice-detail'),
    path('advices/<uuid:pk>/feedback/', AIAdviceFeedbackView.as_view(), name='ai-advice-feedback'),
]
