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

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'payment_type', 'payment_type_display',
            'amount', 'currency', 'payment_method', 'payment_method_display',
            'status', 'status_display',
            'transaction_id', 'qr_code',
            'event', 'club',
            'paid_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
