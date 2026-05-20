from rest_framework import serializers
from .models import Payment, PaymentRefund, PaymentTransaction
from django.contrib.auth import get_user_model

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'student_id']


class PaymentSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'payment_type', 'payment_type_display',
            'amount', 'currency', 'payment_method', 'payment_method_display',
            'status', 'status_display',
            'transaction_id', 'qr_code',
            'event', 'club',
            'paid_at', 'expires_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'payment_type', 'amount', 'currency',
            'payment_method', 'event', 'club',
        ]


class PaymentRefundSerializer(serializers.ModelSerializer):
    processed_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'payment', 'amount', 'reason', 'description',
            'processed_by', 'processed_at', 'created_at',
        ]
        read_only_fields = ['id', 'processed_by', 'processed_at', 'created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'payment', 'transaction_type', 'amount',
            'description', 'gateway_response', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FeeSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for the fee submission view — uses Payment model filtered to
    event_fee/club_membership types with pending/processing status.
    """
    user = UserMinimalSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    # Extra fields for the payments section
    event_title = serializers.SerializerMethodField()
    organizer_name = serializers.SerializerMethodField()
    organizer_email = serializers.SerializerMethodField()
    ticket_price = serializers.SerializerMethodField()
    expected_revenue = serializers.SerializerMethodField()
    platform_fee_rate = serializers.SerializerMethodField()
    platform_fee = serializers.SerializerMethodField()
    net_payout = serializers.SerializerMethodField()
    proof_url = serializers.SerializerMethodField()
    rejection_reason = serializers.SerializerMethodField()
    is_proposal = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'payment_type', 'payment_type_display',
            'amount', 'currency', 'payment_method', 'payment_method_display',
            'status', 'status_display',
            'transaction_id', 'qr_code',
            'event', 'club',
            'paid_at', 'created_at', 'updated_at',
            'event_title', 'organizer_name', 'organizer_email',
            'ticket_price', 'expected_revenue', 'platform_fee_rate',
            'platform_fee', 'net_payout', 'proof_url', 'rejection_reason',
            'is_proposal',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_event_title(self, obj):
        if obj.event:
            return obj.event.title
        elif obj.club:
            return obj.club.name
        return 'Unknown Event'

    def get_organizer_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_organizer_email(self, obj):
        return obj.user.email

    def get_ticket_price(self, obj):
        if obj.event:
            return float(obj.event.price or 0)
        return 0.0

    def get_expected_revenue(self, obj):
        if obj.event:
            price = float(obj.event.price or 0)
            participants = obj.event.max_participants or 0
            return price * participants
        return float(obj.amount)

    def get_platform_fee_rate(self, obj):
        return 0.03

    def get_platform_fee(self, obj):
        return float(obj.amount)

    def get_net_payout(self, obj):
        rev = self.get_expected_revenue(obj)
        fee = self.get_platform_fee(obj)
        return max(0.0, rev - fee)

    def get_proof_url(self, obj):
        if obj.qr_code:
            return obj.qr_code
        return None

    def get_rejection_reason(self, obj):
        return ""

    def get_is_proposal(self, obj):
        return False
