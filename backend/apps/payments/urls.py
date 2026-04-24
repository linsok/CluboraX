from django.urls import path
from .views import (
    PaymentListCreateView,
    PaymentDetailView,
    FeeSubmissionListCreateView,
    FeeSubmissionDetailView,
    PaymentStatsView,
    PaymentRefundView,
)

urlpatterns = [
    path('', PaymentListCreateView.as_view(), name='payment-list-create'),
    path('<uuid:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('fee-submissions/', FeeSubmissionListCreateView.as_view(), name='fee-submission-list-create'),
    path('fee-submissions/<uuid:pk>/', FeeSubmissionDetailView.as_view(), name='fee-submission-detail'),
    path('stats/', PaymentStatsView.as_view(), name='payment-stats'),
    path('<uuid:pk>/refund/', PaymentRefundView.as_view(), name='payment-refund'),
]
