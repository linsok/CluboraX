from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    NotificationDeliveryLog, BulkNotification
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Notification admin interface.
    """
    list_display = ['user', 'title', 'type', 'priority', 'is_read', 'created_at']
    list_filter = ['type', 'priority', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['id', 'read_at', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Notification Info'), {
            'fields': ('user', 'title', 'message', 'type', 'priority')
        }),
        (_('Status'), {
            'fields': ('is_read', 'read_at')
        }),
        (_('Action'), {
            'fields': ('action_url', 'action_text')
        }),
        (_('Metadata'), {
            'fields': ('metadata', 'expires_at')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """
    Notification template admin interface.
    """
    list_display = ['name', 'type', 'priority', 'is_active', 'created_at']
    list_filter = ['type', 'priority', 'is_active', 'created_at']
    search_fields = ['name', 'title_template', 'message_template']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']
    
    fieldsets = (
        (_('Template Info'), {
            'fields': ('name', 'type', 'priority', 'is_active')
        }),
        (_('Templates'), {
            'fields': ('title_template', 'message_template')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """
    Notification preference admin interface.
    """
    list_display = ['user', 'email_notifications', 'push_notifications', 'quiet_hours_enabled']
    list_filter = ['email_notifications', 'push_notifications', 'quiet_hours_enabled']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['user__email']
    
    fieldsets = (
        (_('User'), {
            'fields': ('user',)
        }),
        (_('General Preferences'), {
            'fields': ('email_notifications', 'push_notifications', 'in_app_notifications')
        }),
        (_('Type Preferences'), {
            'fields': (
                'event_updates', 'club_updates', 'payment_notifications',
                'approval_notifications', 'reminder_notifications',
                'system_notifications', 'security_notifications'
            )
        }),
        (_('Quiet Hours'), {
            'fields': ('quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(NotificationDeliveryLog)
class NotificationDeliveryLogAdmin(admin.ModelAdmin):
    """
    Notification delivery log admin interface.
    """
    list_display = ['notification', 'delivery_type', 'status', 'sent_at', 'delivered_at']
    list_filter = ['delivery_type', 'status', 'sent_at', 'delivered_at']
    search_fields = ['notification__title', 'error_message', 'external_id']
    readonly_fields = ['id', 'sent_at', 'delivered_at', 'created_at']
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(BulkNotification)
class BulkNotificationAdmin(admin.ModelAdmin):
    """
    Bulk notification admin interface.
    """
    list_display = ['title', 'type', 'status', 'created_by', 'total_sent', 'scheduled_at']
    list_filter = ['type', 'status', 'created_at', 'scheduled_at']
    search_fields = ['title', 'message', 'created_by__email']
    readonly_fields = ['id', 'sent_at', 'total_sent', 'total_delivered', 'total_failed', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Notification Info'), {
            'fields': ('title', 'message', 'type', 'priority', 'status')
        }),
        (_('Targeting'), {
            'fields': ('target_users', 'target_roles', 'target_clubs', 'send_to_all')
        }),
        (_('Scheduling'), {
            'fields': ('scheduled_at', 'sent_at')
        }),
        (_('Statistics'), {
            'fields': ('total_sent', 'total_delivered', 'total_failed')
        }),
        (_('Created By'), {
            'fields': ('created_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
