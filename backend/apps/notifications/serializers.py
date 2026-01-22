from rest_framework import serializers
from django.utils import timezone
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    NotificationDeliveryLog, BulkNotification
)
from apps.users.serializers import UserProfileSerializer
import logging

logger = logging.getLogger(__name__)


class NotificationSerializer(serializers.ModelSerializer):
    """
    Notification serializer.
    """
    user = UserProfileSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'type', 'type_display',
            'priority', 'priority_display', 'is_read', 'read_at',
            'action_url', 'action_text', 'metadata', 'expires_at',
            'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'read_at', 'created_at', 'updated_at'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Notification creation serializer.
    """
    class Meta:
        model = Notification
        fields = [
            'user', 'title', 'message', 'type', 'priority',
            'action_url', 'action_text', 'metadata', 'expires_at'
        ]
    
    def validate_expires_at(self, value):
        """
        Validate expiry date is in future.
        """
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """
    Notification template serializer.
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'type', 'type_display', 'title_template',
            'message_template', 'priority', 'priority_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def render(self, context):
        """
        Render template with context.
        """
        return self.instance.render(context)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Notification preference serializer.
    """
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_notifications', 'push_notifications',
            'in_app_notifications', 'event_updates', 'club_updates',
            'payment_notifications', 'approval_notifications',
            'reminder_notifications', 'system_notifications',
            'security_notifications', 'quiet_hours_enabled',
            'quiet_hours_start', 'quiet_hours_end'
        ]
    
    def validate(self, attrs):
        """
        Validate quiet hours configuration.
        """
        quiet_hours_enabled = attrs.get('quiet_hours_enabled')
        quiet_hours_start = attrs.get('quiet_hours_start')
        quiet_hours_end = attrs.get('quiet_hours_end')
        
        if quiet_hours_enabled:
            if not quiet_hours_start or not quiet_hours_end:
                raise serializers.ValidationError(
                    "Both start and end times are required when quiet hours are enabled."
                )
        
        return attrs


class NotificationDeliveryLogSerializer(serializers.ModelSerializer):
    """
    Notification delivery log serializer.
    """
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    delivery_type_display = serializers.CharField(source='get_delivery_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = NotificationDeliveryLog
        fields = [
            'id', 'notification', 'notification_title', 'delivery_type',
            'delivery_type_display', 'status', 'status_display',
            'sent_at', 'delivered_at', 'error_message', 'external_id',
            'created_at'
        ]
        read_only_fields = [
            'id', 'notification', 'sent_at', 'delivered_at', 'created_at'
        ]


class BulkNotificationSerializer(serializers.ModelSerializer):
    """
    Bulk notification serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    delivery_rate = serializers.ReadOnlyField()
    target_users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkNotification
        fields = [
            'id', 'title', 'message', 'type', 'type_display',
            'priority', 'priority_display', 'status', 'status_display',
            'target_users', 'target_roles', 'target_clubs', 'send_to_all',
            'scheduled_at', 'sent_at', 'total_sent', 'total_delivered',
            'total_failed', 'delivery_rate', 'target_users_count',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_sent', 'total_delivered', 'total_failed',
            'sent_at', 'created_by', 'created_at', 'updated_at'
        ]
    
    def get_target_users_count(self, obj):
        """
        Get count of target users.
        """
        return obj.get_target_users().count()
    
    def validate_scheduled_at(self, value):
        """
        Validate scheduled date is in future.
        """
        if value and value <= timezone.now():
            raise serializers.ValidationError("Scheduled date must be in the future.")
        return value
    
    def validate(self, attrs):
        """
        Validate bulk notification configuration.
        """
        send_to_all = attrs.get('send_to_all', False)
        target_users = attrs.get('target_users')
        target_roles = attrs.get('target_roles', [])
        target_clubs = attrs.get('target_clubs', [])
        
        if not send_to_all and not target_users and not target_roles and not target_clubs:
            raise serializers.ValidationError(
                "Must specify target users, roles, clubs, or send to all."
            )
        
        return attrs


class BulkNotificationCreateSerializer(BulkNotificationSerializer):
    """
    Bulk notification creation serializer.
    """
    class Meta(BulkNotificationSerializer.Meta):
        read_only_fields = BulkNotificationSerializer.Meta.read_only_fields + ['status']


class NotificationStatsSerializer(serializers.Serializer):
    """
    Notification statistics serializer.
    """
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    notifications_by_type = serializers.JSONField()
    notifications_by_priority = serializers.JSONField()
    delivery_stats = serializers.JSONField()


class NotificationSearchSerializer(serializers.Serializer):
    """
    Notification search serializer.
    """
    query = serializers.CharField(required=False, allow_blank=True)
    type = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.CharField(required=False, allow_blank=True)
    is_read = serializers.BooleanField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    sort_by = serializers.CharField(required=False, default='created_at')
    sort_order = serializers.ChoiceField(choices=['asc', 'desc'], default='desc')
    page = serializers.IntegerField(required=False, default=1)
    page_size = serializers.IntegerField(required=False, default=20)
