from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, BulkNotification, NotificationPreference
from .utils import send_email_notification, send_push_notification, cleanup_old_notifications
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_bulk_notification_task(bulk_notification_id):
    """
    Send bulk notification task.
    """
    try:
        bulk_notification = BulkNotification.objects.get(id=bulk_notification_id)
        
        # Check if already sent
        if bulk_notification.status in ['completed', 'sending']:
            logger.info(f"Bulk notification {bulk_notification_id} already processed")
            return "Already processed"
        
        # Update status to sending
        bulk_notification.status = 'sending'
        bulk_notification.save()
        
        # Get target users
        target_users = bulk_notification.get_target_users()
        
        notifications_created = 0
        notifications_failed = 0
        
        for target_user in target_users:
            try:
                # Check user preferences
                try:
                    preferences = target_user.notification_preferences
                    if not preferences.should_send_notification(bulk_notification.type):
                        continue
                except NotificationPreference.DoesNotExist:
                    # Create default preferences if not exist
                    preferences = NotificationPreference.objects.create(user=target_user)
                
                notification = Notification.objects.create(
                    user=target_user,
                    title=bulk_notification.title,
                    message=bulk_notification.message,
                    type=bulk_notification.type,
                    priority=bulk_notification.priority,
                    action_url=bulk_notification.metadata.get('action_url'),
                    action_text=bulk_notification.metadata.get('action_text'),
                    metadata=bulk_notification.metadata
                )
                notifications_created += 1
                
            except Exception as e:
                logger.error(f"Failed to create notification for user {target_user.email}: {e}")
                notifications_failed += 1
        
        # Update bulk notification status
        bulk_notification.status = 'completed'
        bulk_notification.sent_at = timezone.now()
        bulk_notification.total_sent = notifications_created
        bulk_notification.total_failed = notifications_failed
        bulk_notification.save()
        
        logger.info(f"Bulk notification {bulk_notification_id} sent to {notifications_created} users")
        return f"Sent to {notifications_created} users"
        
    except BulkNotification.DoesNotExist:
        logger.error(f"Bulk notification {bulk_notification_id} not found")
        return "Not found"
    except Exception as e:
        logger.error(f"Bulk notification task error: {e}")
        
        # Update status to failed
        try:
            bulk_notification = BulkNotification.objects.get(id=bulk_notification_id)
            bulk_notification.status = 'failed'
            bulk_notification.save()
        except BulkNotification.DoesNotExist:
            pass
        
        return f"Error: {str(e)}"


@shared_task
def send_scheduled_notifications():
    """
    Send scheduled bulk notifications.
    """
    try:
        now = timezone.now()
        
        # Get scheduled notifications that are ready to send
        scheduled_notifications = BulkNotification.objects.filter(
            status='scheduled',
            scheduled_at__lte=now
        )
        
        sent_count = 0
        
        for bulk_notification in scheduled_notifications:
            # Send the notification
            send_bulk_notification_task.delay(str(bulk_notification.id))
            sent_count += 1
        
        logger.info(f"Scheduled {sent_count} bulk notifications for sending")
        return f"Scheduled {sent_count} notifications"
        
    except Exception as e:
        logger.error(f"Scheduled notifications task error: {e}")
        return f"Error: {str(e)}"


@shared_task
def cleanup_expired_notifications():
    """
    Clean up expired notifications.
    """
    try:
        now = timezone.now()
        
        # Get expired notifications
        expired_notifications = Notification.objects.filter(
            expires_at__lt=now
        )
        
        count = expired_notifications.count()
        expired_notifications.delete()
        
        logger.info(f"Cleaned up {count} expired notifications")
        return f"Cleaned up {count} notifications"
        
    except Exception as e:
        logger.error(f"Cleanup expired notifications error: {e}")
        return f"Error: {str(e)}"


@shared_task
def cleanup_old_notifications():
    """
    Clean up old read notifications (older than 30 days).
    """
    try:
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        )
        
        count = old_notifications.count()
        old_notifications.delete()
        
        logger.info(f"Cleaned up {count} old notifications")
        return f"Cleaned up {count} notifications"
        
    except Exception as e:
        logger.error(f"Cleanup old notifications error: {e}")
        return f"Error: {str(e)}"


@shared_task
def send_daily_digest():
    """
    Send daily notification digest to users.
    """
    try:
        from apps.users.models import User
        
        yesterday = timezone.now() - timezone.timedelta(days=1)
        start_of_yesterday = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_yesterday = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get users who want daily digests
        users_with_digest = User.objects.filter(
            notification_preferences__system_notifications=True,
            is_active=True
        )
        
        digest_sent = 0
        
        for user in users_with_digest:
            # Get user's notifications from yesterday
            user_notifications = Notification.objects.filter(
                user=user,
                created_at__gte=start_of_yesterday,
                created_at__lte=end_of_yesterday
            )
            
            if user_notifications.exists():
                # Create digest content
                notifications_by_type = {}
                for notification in user_notifications:
                    notification_type = notification.get_type_display()
                    if notification_type not in notifications_by_type:
                        notifications_by_type[notification_type] = []
                    notifications_by_type[notification_type].append(notification)
                
                # Create digest message
                digest_message = f"Daily Notification Summary - {yesterday.strftime('%B %d, %Y')}\n\n"
                
                for notification_type, notifications in notifications_by_type.items():
                    digest_message += f"{notification_type} ({len(notifications)}):\n"
                    for notification in notifications[:5]:  # Limit to 5 per type
                        digest_message += f"• {notification.title}\n"
                    if len(notifications) > 5:
                        digest_message += f"• ... and {len(notifications) - 5} more\n"
                    digest_message += "\n"
                
                # Send digest email
                try:
                    send_mail(
                        subject=f"[Campus Management] Daily Digest - {yesterday.strftime('%B %d, %Y')}",
                        message=digest_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False
                    )
                    digest_sent += 1
                    
                except Exception as e:
                    logger.error(f"Failed to send daily digest to {user.email}: {e}")
        
        logger.info(f"Sent daily digest to {digest_sent} users")
        return f"Sent digest to {digest_sent} users"
        
    except Exception as e:
        logger.error(f"Daily digest task error: {e}")
        return f"Error: {str(e)}"


@shared_task
def update_notification_statistics():
    """
    Update notification statistics.
    """
    try:
        from apps.core.models import SystemSetting
        
        # Calculate various statistics
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        
        # Update system settings
        SystemSetting.set_value('total_notifications', str(total_notifications), 'Total notifications')
        SystemSetting.set_value('unread_notifications', str(unread_notifications), 'Unread notifications')
        
        # Calculate delivery rates
        from .models import NotificationDeliveryLog
        total_delivered = NotificationDeliveryLog.objects.filter(status='delivered').count()
        total_sent = NotificationDeliveryLog.objects.filter(status__in=['sent', 'delivered']).count()
        
        if total_sent > 0:
            delivery_rate = (total_delivered / total_sent) * 100
            SystemSetting.set_value('notification_delivery_rate', f"{delivery_rate:.2f}", 'Notification delivery rate')
        
        logger.info("Updated notification statistics")
        return "Statistics updated successfully"
        
    except Exception as e:
        logger.error(f"Notification statistics update error: {e}")
        return f"Error: {str(e)}"


@shared_task
def retry_failed_notifications():
    """
    Retry failed notifications.
    """
    try:
        from .models import NotificationDeliveryLog
        
        # Get failed notifications from last hour
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        failed_logs = NotificationDeliveryLog.objects.filter(
            status='failed',
            created_at__gte=one_hour_ago
        )
        
        retry_count = 0
        
        for log in failed_logs:
            notification = log.notification
            
            try:
                # Retry based on delivery type
                if log.delivery_type == 'email':
                    send_email_notification(notification)
                elif log.delivery_type == 'push':
                    send_push_notification(notification)
                
                # Update log
                log.status = 'sent'
                log.sent_at = timezone.now()
                log.error_message = None
                log.save()
                
                retry_count += 1
                
            except Exception as e:
                logger.error(f"Retry failed for notification {notification.id}: {e}")
                log.error_message = f"Retry failed: {str(e)}"
                log.save()
        
        logger.info(f"Retried {retry_count} failed notifications")
        return f"Retried {retry_count} notifications"
        
    except Exception as e:
        logger.error(f"Retry failed notifications error: {e}")
        return f"Error: {str(e)}"
