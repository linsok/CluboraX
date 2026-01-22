from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import TimeStampedModel
import uuid

User = get_user_model()


class Notification(TimeStampedModel):
    """
    Notification model for in-app notifications.
    """
    TYPE_CHOICES = [
        ('event_update', 'Event Update'),
        ('club_update', 'Club Update'),
        ('payment', 'Payment'),
        ('approval', 'Approval'),
        ('reminder', 'Reminder'),
        ('system', 'System'),
        ('security', 'Security'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.URLField(blank=True, null=True)
    action_text = models.CharField(max_length=50, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    @property
    def is_expired(self):
        """
        Check if notification has expired.
        """
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    def mark_as_read(self):
        """
        Mark notification as read.
        """
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """
        Mark notification as unread.
        """
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])


class NotificationTemplate(TimeStampedModel):
    """
    Notification template model for reusable notification templates.
    """
    TYPE_CHOICES = [
        ('event_update', 'Event Update'),
        ('club_update', 'Club Update'),
        ('payment', 'Payment'),
        ('approval', 'Approval'),
        ('reminder', 'Reminder'),
        ('system', 'System'),
        ('security', 'Security'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    priority = models.CharField(max_length=10, choices=Notification.PRIORITY_CHOICES, default='medium')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def render(self, context):
        """
        Render template with context.
        """
        try:
            title = self.title_template.format(**context)
            message = self.message_template.format(**context)
            return title, message
        except KeyError as e:
            logger.error(f"Template rendering error: missing key {e}")
            return self.title_template, self.message_template


class NotificationPreference(TimeStampedModel):
    """
    User notification preferences model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences'
    )
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    
    # Type-specific preferences
    event_updates = models.BooleanField(default=True)
    club_updates = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    approval_notifications = models.BooleanField(default=True)
    reminder_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    security_notifications = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"{self.user.email} Preferences"
    
    def should_send_notification(self, notification_type):
        """
        Check if notification should be sent based on user preferences.
        """
        # Check quiet hours
        if self.quiet_hours_enabled and self.quiet_hours_start and self.quiet_hours_end:
            now = timezone.now().time()
            start = self.quiet_hours_start
            end = self.quiet_hours_end
            
            if start <= end:
                # Same day range (e.g., 22:00 to 06:00)
                if start <= now <= end:
                    return False
            else:
                # Cross midnight range (e.g., 22:00 to 06:00)
                if now >= start or now <= end:
                    return False
        
        # Check type-specific preferences
        type_mapping = {
            'event_update': self.event_updates,
            'club_update': self.club_updates,
            'payment': self.payment_notifications,
            'approval': self.approval_notifications,
            'reminder': self.reminder_notifications,
            'system': self.system_notifications,
            'security': self.security_notifications,
        }
        
        return type_mapping.get(notification_type, True)


class NotificationDeliveryLog(TimeStampedModel):
    """
    Notification delivery log model.
    """
    DELIVERY_TYPES = [
        ('email', 'Email'),
        ('push', 'Push'),
        ('in_app', 'In-App'),
        ('sms', 'SMS'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        Notification, 
        on_delete=models.CASCADE, 
        related_name='delivery_logs'
    )
    delivery_type = models.CharField(max_length=10, choices=DELIVERY_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    external_id = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'notification_delivery_logs'
        verbose_name = 'Notification Delivery Log'
        verbose_name_plural = 'Notification Delivery Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification.title} - {self.get_delivery_type_display()}"


class BulkNotification(TimeStampedModel):
    """
    Bulk notification model for sending notifications to multiple users.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=Notification.TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=Notification.PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Targeting
    target_users = models.ManyToManyField(
        User, 
        related_name='bulk_notifications',
        blank=True
    )
    target_roles = models.JSONField(default=list, blank=True)
    target_clubs = models.JSONField(default=list, blank=True)
    send_to_all = models.BooleanField(default=False)
    
    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_sent = models.PositiveIntegerField(default=0)
    total_delivered = models.PositiveIntegerField(default=0)
    total_failed = models.PositiveIntegerField(default=0)
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_bulk_notifications'
    )
    
    class Meta:
        db_table = 'bulk_notifications'
        verbose_name = 'Bulk Notification'
        verbose_name_plural = 'Bulk Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def delivery_rate(self):
        """
        Calculate delivery rate.
        """
        if self.total_sent == 0:
            return 0
        return (self.total_delivered / self.total_sent) * 100
    
    def get_target_users(self):
        """
        Get all target users for this bulk notification.
        """
        from apps.users.models import User
        
        if self.send_to_all:
            return User.objects.filter(is_active=True)
        
        users = User.objects.filter(is_active=True)
        
        # Filter by specific users
        if self.target_users.exists():
            users = users.filter(id__in=self.target_users.values_list('id', flat=True))
        
        # Filter by roles
        if self.target_roles:
            users = users.filter(role__in=self.target_roles)
        
        # Filter by club memberships
        if self.target_clubs:
            from apps.clubs.models import ClubMembership
            club_members = ClubMembership.objects.filter(
                club_id__in=self.target_clubs,
                status='approved'
            ).values_list('user_id', flat=True)
            users = users.filter(id__in=club_members)
        
        return users.distinct()
