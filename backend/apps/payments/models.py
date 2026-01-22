from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from apps.core.models import TimeStampedModel
import uuid

User = get_user_model()


class Payment(TimeStampedModel):
    """
    Payment model for processing event fees and club dues.
    """
    PAYMENT_TYPES = [
        ('event_fee', 'Event Fee'),
        ('club_membership', 'Club Membership'),
        ('donation', 'Donation'),
        ('refund', 'Refund'),
    ]
    
    PAYMENT_STATUSES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHODS = [
        ('khqr', 'KHQR Bakong'),
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[
        MinValueValidator(Decimal('0.01')),
        MaxValueValidator(Decimal('99999.99'))
    ])
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUSES, default='pending')
    
    # KHQR specific fields
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    qr_code = models.CharField(max_length=255, blank=True, null=True)
    khqr_response = models.JSONField(default=dict, blank=True, null=True)
    
    # Related objects
    event = models.ForeignKey(
        'events.Event', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='event_payments'
    )
    club = models.ForeignKey(
        'clubs.Club', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='club_payments'
    )
    
    # Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['payment_type', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_payment_type_display()} - ${self.amount}"
    
    @property
    def is_paid(self):
        return self.status == 'completed'
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_refunded(self):
        return self.status == 'refunded'


class PaymentRefund(TimeStampedModel):
    """
    Payment refund model.
    """
    REFUND_REASONS = [
        ('event_cancelled', 'Event Cancelled'),
        ('duplicate_payment', 'Duplicate Payment'),
        ('user_request', 'User Request'),
        ('technical_error', 'Technical Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=30, choices=REFUND_REASONS)
    description = models.TextField(blank=True, null=True)
    processed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='processed_refunds'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_refunds'
        verbose_name = 'Payment Refund'
        verbose_name_plural = 'Payment Refunds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund for {self.payment.id} - ${self.amount}"


class PaymentTransaction(TimeStampedModel):
    """
    Payment transaction log for tracking all payment activities.
    """
    TRANSACTION_TYPES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('fee', 'Fee'),
        ('penalty', 'Penalty'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_transactions'
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'transaction_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - ${self.amount}"
