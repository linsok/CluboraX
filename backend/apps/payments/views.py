from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone
from django.core.exceptions import ValidationError

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

def serialize_proposal_as_fee(proposal):
    # Calculate fees
    ticket_price = float(proposal.ticketPrice or 0)
    capacity = int(proposal.capacity or proposal.expected_participants or 0)
    expected_revenue = ticket_price * capacity
    platform_fee = expected_revenue * 0.03
    net_payout = expected_revenue - platform_fee
    
    # Map status
    if proposal.payment_status == 'pending':
        status_val = 'pending_confirmation'
    elif proposal.payment_status == 'verified':
        status_val = 'confirmed'
    elif proposal.payment_status == 'rejected':
        status_val = 'rejected'
    else:
        status_val = 'pending_confirmation'
        
    return {
        'id': f"proposal_{proposal.id}",
        'user': {
            'id': proposal.submitted_by.id,
            'full_name': proposal.submitted_by.get_full_name() or proposal.submitted_by.email,
            'email': proposal.submitted_by.email,
            'student_id': getattr(proposal.submitted_by, 'student_id', '')
        } if proposal.submitted_by else None,
        'payment_type': 'event_fee',
        'payment_type_display': 'Event Fee',
        'amount': str(platform_fee),
        'currency': 'USD',
        'payment_method': proposal.payment_method or 'KHQR',
        'payment_method_display': proposal.payment_method or 'KHQR Bakong',
        'status': status_val,
        'status_display': status_val.replace('_', ' ').title(),
        'transaction_id': '',
        'qr_code': None,
        'event': None,
        'club': None,
        'paid_at': proposal.reviewed_date.isoformat() if proposal.reviewed_date else None,
        'created_at': proposal.submitted_date.isoformat(),
        'updated_at': proposal.updated_at.isoformat(),
        
        # Extra fields for the payments section
        'event_title': proposal.title or proposal.eventTitle or 'Untitled Event',
        'organizer_name': proposal.organizerName or (proposal.submitted_by.get_full_name() if proposal.submitted_by else 'Unknown'),
        'organizer_email': proposal.organizerEmail or (proposal.submitted_by.email if proposal.submitted_by else ''),
        'ticket_price': ticket_price,
        'expected_revenue': expected_revenue,
        'platform_fee_rate': 0.03,
        'platform_fee': platform_fee,
        'net_payout': net_payout,
        'proof_url': proposal.platform_fee_receipt.url if proposal.platform_fee_receipt else None,
        'rejection_reason': proposal.review_comments or '',
        'is_proposal': True
    }


class FeeSubmissionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/payments/fee-submissions/   — list fee submissions (including EventProposals)
    POST /api/payments/fee-submissions/   — submit a new fee proof
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FeeSubmissionSerializer
    pagination_class = StandardResultsSetPagination

    FEE_TYPES = ['event_fee', 'club_membership']

    def get_queryset(self):
        return Payment.objects.filter(payment_type__in=self.FEE_TYPES)

    def list(self, request, *args, **kwargs):
        user = self.request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'

        # Query Payments
        payments_qs = Payment.objects.filter(
            payment_type__in=self.FEE_TYPES
        ).select_related('user', 'event', 'club')

        if not is_admin:
            payments_qs = payments_qs.filter(user=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == 'pending_confirmation':
                payments_qs = payments_qs.filter(status__in=['pending', 'processing'])
            elif status_filter == 'confirmed':
                payments_qs = payments_qs.filter(status='completed')
            elif status_filter == 'rejected':
                payments_qs = payments_qs.filter(status='failed')
            else:
                payments_qs = payments_qs.filter(status=status_filter)

        serialized_payments = FeeSubmissionSerializer(payments_qs, many=True).data

        # Query EventProposals
        from apps.proposals.models import EventProposal
        proposals_qs = EventProposal.objects.select_related('submitted_by').exclude(
            platform_fee_receipt__isnull=True
        ).exclude(
            platform_fee_receipt=''
        )

        if not is_admin:
            proposals_qs = proposals_qs.filter(submitted_by=user)

        if status_filter:
            if status_filter == 'pending_confirmation':
                proposals_qs = proposals_qs.filter(payment_status='pending')
            elif status_filter == 'confirmed':
                proposals_qs = proposals_qs.filter(payment_status='verified')
            elif status_filter == 'rejected':
                proposals_qs = proposals_qs.filter(payment_status='rejected')
            else:
                proposals_qs = proposals_qs.none()

        serialized_proposals = [serialize_proposal_as_fee(p) for p in proposals_qs]

        # Combine
        combined_list = list(serialized_payments) + serialized_proposals

        # Sort
        combined_list.sort(key=lambda x: x.get('created_at') or '', reverse=True)

        # Paginate
        page = self.paginate_queryset(combined_list)
        if page is not None:
            return self.get_paginated_response(page)
        return Response(combined_list)

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

    def get(self, request, pk):
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'

        if str(pk).startswith('proposal_'):
            proposal_id = str(pk).replace('proposal_', '')
            from apps.proposals.models import EventProposal
            try:
                proposal = EventProposal.objects.get(id=proposal_id)
                if not is_admin and proposal.submitted_by != user:
                    return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
                return Response(serialize_proposal_as_fee(proposal))
            except EventProposal.DoesNotExist:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            qs = Payment.objects.filter(payment_type__in=self.FEE_TYPES)
            if not is_admin:
                qs = qs.filter(user=user)
            obj = qs.get(pk=pk)
            return Response(FeeSubmissionSerializer(obj).data)
        except (Payment.DoesNotExist, ValueError, ValidationError):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', None) == 'admin'
        if not is_admin:
            return Response(
                {'detail': 'Only admins can review fee submissions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if str(pk).startswith('proposal_'):
            proposal_id = str(pk).replace('proposal_', '')
            from apps.proposals.models import EventProposal
            try:
                proposal = EventProposal.objects.get(id=proposal_id)
                action = request.data.get('action')
                note = request.data.get('note') or request.data.get('comments', '')

                if action == 'confirm':
                    proposal.payment_status = 'verified'
                    if proposal.status in ['pending_payment', 'pending_review']:
                        proposal.status = 'pending_review'
                    if note:
                        proposal.review_comments = note
                    proposal.save()

                    # Notify the owner
                    from apps.core.utils import send_notification
                    send_notification(
                        proposal.submitted_by,
                        '✅ Payment Confirmed',
                        f'Your platform fee payment for event "{proposal.title or proposal.eventTitle}" has been confirmed.',
                        'payment_update'
                    )
                    return Response({'detail': 'Payment confirmed.', 'status': 'completed'})

                elif action == 'reject':
                    proposal.payment_status = 'rejected'
                    if proposal.status in ['pending_payment', 'pending_review']:
                        proposal.status = 'returned_for_revision'
                    if note:
                        proposal.review_comments = note
                    proposal.save()

                    # Notify the owner
                    from apps.core.utils import send_notification
                    send_notification(
                        proposal.submitted_by,
                        '❌ Payment Rejected',
                        f'Your platform fee payment for event "{proposal.title or proposal.eventTitle}" was rejected. Please upload a valid receipt.',
                        'payment_update'
                    )
                    return Response({'detail': 'Payment rejected.', 'status': 'failed'})
                else:
                    return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

            except EventProposal.DoesNotExist:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            obj = Payment.objects.filter(payment_type__in=self.FEE_TYPES).get(pk=pk)
        except (Payment.DoesNotExist, ValueError, ValidationError):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.core.utils import send_notification

        action = request.data.get('action')
        if action == 'confirm':
            obj.status = 'completed'
            obj.paid_at = timezone.now()
            obj.save(update_fields=['status', 'paid_at', 'updated_at'])

            # Notify the payment owner
            event_name = obj.event.title if obj.event else 'your event'
            send_notification(
                obj.user,
                '✅ Payment Confirmed',
                f'Your payment for "{event_name}" has been confirmed by an admin.',
                'payment_update'
            )
            return Response({'detail': 'Payment confirmed.', 'status': obj.status})

        elif action == 'reject':
            obj.status = 'failed'
            obj.save(update_fields=['status', 'updated_at'])

            # Notify the payment owner
            event_name = obj.event.title if obj.event else 'your event'
            send_notification(
                obj.user,
                '❌ Payment Rejected',
                f'Your payment for "{event_name}" was rejected by an admin. Please re-submit with a valid receipt.',
                'payment_update'
            )
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
