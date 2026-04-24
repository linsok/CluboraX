from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone

from .models import Payment, PaymentRefund, PaymentTransaction
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentRefundSerializer,
    PaymentTransactionSerializer,
    FeeSubmissionSerializer,
)
from apps.core.permissions import IsAdminOrReadOnly
from apps.core.views import StandardResultsSetPagination
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

class PaymentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/payments/          — list current user's payments (admin sees all)
    POST /api/payments/          — create a new payment record
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related('user', 'event', 'club')
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            qs = qs.filter(user=user)

        # Optional filters
        payment_type = self.request.query_params.get('payment_type')
        status_filter = self.request.query_params.get('status')
        if payment_type:
            qs = qs.filter(payment_type=payment_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(user=request.user)
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/payments/<id>/   — retrieve payment
    PATCH  /api/payments/<id>/   — update payment status (admin only)
    DELETE /api/payments/<id>/   — delete (admin only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related('user', 'event', 'club')
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            qs = qs.filter(user=user)
        return qs

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'

        allowed_fields = {'status', 'transaction_id', 'paid_at'} if is_admin else set()
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'
        if not is_admin:
            return Response(
                {'detail': 'Only admins can delete payments.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Fee Submissions  (payments of type event_fee / club_membership)
# ---------------------------------------------------------------------------

class FeeSubmissionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/payments/fee-submissions/   — list fee submissions
    POST /api/payments/fee-submissions/   — submit a new fee proof
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FeeSubmissionSerializer
    pagination_class = StandardResultsSetPagination
    ordering = ['-created_at']

    FEE_TYPES = ['event_fee', 'club_membership']

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'
        qs = Payment.objects.filter(
            payment_type__in=self.FEE_TYPES
        ).select_related('user', 'event', 'club')

        if not is_admin:
            qs = qs.filter(user=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        data = self.request.data
        payment_type = data.get('payment_type', 'event_fee')
        if payment_type not in self.FEE_TYPES:
            payment_type = 'event_fee'
        serializer.save(user=self.request.user, payment_type=payment_type)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeeSubmissionDetailView(APIView):
    """
    GET   /api/payments/fee-submissions/<id>/             — retrieve
    PATCH /api/payments/fee-submissions/<id>/             — confirm or reject (admin)
    """
    permission_classes = [IsAuthenticated]

    FEE_TYPES = ['event_fee', 'club_membership']

    def _get_object(self, pk, user):
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'
        try:
            qs = Payment.objects.filter(payment_type__in=self.FEE_TYPES)
            if not is_admin:
                qs = qs.filter(user=user)
            return qs.get(pk=pk)
        except Payment.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk, request.user)
        if obj is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FeeSubmissionSerializer(obj).data)

    def patch(self, request, pk):
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'
        if not is_admin:
            return Response(
                {'detail': 'Only admins can review fee submissions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            obj = Payment.objects.filter(payment_type__in=self.FEE_TYPES).get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'confirm':
            obj.status = 'completed'
            obj.paid_at = timezone.now()
            obj.save(update_fields=['status', 'paid_at', 'updated_at'])
            return Response({'detail': 'Payment confirmed.', 'status': obj.status})
        elif action == 'reject':
            obj.status = 'failed'
            obj.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Payment rejected.', 'status': obj.status})
        else:
            # Allow general field updates
            allowed = {'status', 'transaction_id', 'paid_at'}
            data = {k: v for k, v in request.data.items() if k in allowed}
            serializer = FeeSubmissionSerializer(obj, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


# ---------------------------------------------------------------------------
# Payment Statistics
# ---------------------------------------------------------------------------

class PaymentStatsView(APIView):
    """
    GET /api/payments/stats/   — payment statistics (admin) or personal stats
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'

        base_qs = Payment.objects.all() if is_admin else Payment.objects.filter(user=user)

        total_payments = base_qs.count()
        total_revenue = base_qs.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0

        pending_count = base_qs.filter(status='pending').count()
        processing_count = base_qs.filter(status='processing').count()
        completed_count = base_qs.filter(status='completed').count()
        failed_count = base_qs.filter(status='failed').count()
        refunded_count = base_qs.filter(status='refunded').count()

        fee_qs = base_qs.filter(payment_type__in=['event_fee', 'club_membership'])
        pending_fees = fee_qs.filter(status__in=['pending', 'processing']).count()
        confirmed_fees = fee_qs.filter(status='completed').count()

        by_method = list(
            base_qs.values('payment_method').annotate(count=Count('id'), total=Sum('amount'))
        )
        by_type = list(
            base_qs.values('payment_type').annotate(count=Count('id'), total=Sum('amount'))
        )

        return Response({
            'total_payments': total_payments,
            'total_revenue': float(total_revenue),
            'pending_count': pending_count,
            'processing_count': processing_count,
            'completed_count': completed_count,
            'failed_count': failed_count,
            'refunded_count': refunded_count,
            'pending_fees': pending_fees,
            'confirmed_fees': confirmed_fees,
            'by_payment_method': by_method,
            'by_payment_type': by_type,
        })


# ---------------------------------------------------------------------------
# Refunds
# ---------------------------------------------------------------------------

class PaymentRefundView(APIView):
    """
    POST /api/payments/<id>/refund/   — request or process a refund
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'

        if not is_admin and payment.user != user:
            return Response(
                {'detail': 'You do not have permission to refund this payment.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if payment.status != 'completed':
            return Response(
                {'detail': 'Only completed payments can be refunded.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = request.data.get('amount', payment.amount)
        reason = request.data.get('reason', 'user_request')
        description = request.data.get('description', '')

        refund = PaymentRefund.objects.create(
            payment=payment,
            amount=amount,
            reason=reason,
            description=description,
            processed_by=user,
            processed_at=timezone.now(),
        )

        payment.status = 'refunded'
        payment.save(update_fields=['status', 'updated_at'])

        return Response(
            PaymentRefundSerializer(refund).data,
            status=status.HTTP_201_CREATED,
        )
