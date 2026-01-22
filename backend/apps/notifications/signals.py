from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Notification, NotificationPreference, NotificationDeliveryLog
from .utils import send_email_notification, send_push_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Notification)
def notification_post_save(sender, instance, created, **kwargs):
    """
    Handle notification post-save signals.
    """
    if created:
        # Get user preferences
        try:
            preferences = instance.user.notification_preferences
        except NotificationPreference.DoesNotExist:
            # Create default preferences
            preferences = NotificationPreference.objects.create(user=instance.user)
        
        # Check if user wants to receive this type of notification
        if not preferences.should_send_notification(instance.type):
            return
        
        # Send email notification
        if preferences.email_notifications:
            try:
                send_email_notification(instance)
                NotificationDeliveryLog.objects.create(
                    notification=instance,
                    delivery_type='email',
                    status='sent',
                    sent_at=timezone.now()
                )
            except Exception as e:
                logger.error(f"Email notification error: {e}")
                NotificationDeliveryLog.objects.create(
                    notification=instance,
                    delivery_type='email',
                    status='failed',
                    error_message=str(e)
                )
        
        # Send push notification
        if preferences.push_notifications:
            try:
                send_push_notification(instance)
                NotificationDeliveryLog.objects.create(
                    notification=instance,
                    delivery_type='push',
                    status='sent',
                    sent_at=timezone.now()
                )
            except Exception as e:
                logger.error(f"Push notification error: {e}")
                NotificationDeliveryLog.objects.create(
                    notification=instance,
                    delivery_type='push',
                    status='failed',
                    error_message=str(e)
                )
        
        # In-app notifications are always delivered (they're the record itself)
        NotificationDeliveryLog.objects.create(
            notification=instance,
            delivery_type='in_app',
            status='delivered',
            delivered_at=timezone.now()
        )


@receiver(post_save, sender=NotificationPreference)
def notification_preference_post_save(sender, instance, created, **kwargs):
    """
    Handle notification preference post-save signals.
    """
    if created:
        logger.info(f"Created notification preferences for user {instance.user.email}")


@receiver(pre_save, sender=Notification)
def notification_pre_save(sender, instance, **kwargs):
    """
    Handle notification pre-save signals.
    """
    # Auto-set expiry for certain notification types
    if not instance.expires_at and instance.type in ['reminder', 'event_update']:
        # Set expiry to 7 days from creation for reminders and event updates
        instance.expires_at = timezone.now() + timezone.timedelta(days=7)
