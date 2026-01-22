from django.core.mail import send_mail
from django.conf import settings
from django.template import Context, Template
from django.db import models
from .models import Notification
import logging

logger = logging.getLogger(__name__)


def send_email_notification(notification):
    """
    Send email notification.
    """
    try:
        subject = f"[Campus Management] {notification.title}"
        
        # Create email template
        template_content = """
        <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">{{ notification.title }}</h2>
                    <p style="color: #666; line-height: 1.6;">{{ notification.message }}</p>
                    
                    {% if notification.action_url %}
                    <div style="margin-top: 30px;">
                        <a href="{{ notification.action_url }}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            {{ notification.action_text|default:"View Details" }}
                        </a>
                    </div>
                    {% endif %}
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0;">
                            This notification was sent from the Campus Event and Cloud Management System.
                        </p>
                        <p style="color: #6c757d; font-size: 14px; margin: 5px 0 0 0;">
                            If you don't want to receive these emails, please update your 
                            <a href="#" style="color: #007bff;">notification preferences</a>.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Render template
        template = Template(template_content)
        context_data = Context({'notification': notification})
        html_message = template.render(context_data)
        
        # Send email
        send_mail(
            subject=subject,
            message=notification.message,  # Plain text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        logger.info(f"Email notification sent to {notification.user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        raise


def send_push_notification(notification):
    """
    Send push notification (placeholder for implementation).
    """
    try:
        # This would integrate with a push notification service
        # like Firebase Cloud Messaging, OneSignal, etc.
        
        # For now, we'll just log it
        logger.info(f"Push notification sent to {notification.user.email}: {notification.title}")
        
        # Example implementation with Firebase:
        # from firebase_admin import messaging
        # 
        # # Get user's FCM token (would need to be stored in user profile)
        # fcm_token = notification.user.profile.fcm_token
        # 
        # if fcm_token:
        #     message = messaging.Message(
        #         notification=messaging.Notification(
        #             title=notification.title,
        #             body=notification.message,
        #         ),
        #         data={
        #             'notification_id': str(notification.id),
        #             'action_url': notification.action_url or '',
        #         },
        #         token=fcm_token,
        #     )
        #     
        #     response = messaging.send(message)
        #     logger.info(f"Push notification sent: {response}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        raise


def send_sms_notification(notification):
    """
    Send SMS notification (placeholder for implementation).
    """
    try:
        # This would integrate with an SMS service
        # like Twilio, AWS SNS, etc.
        
        # Example implementation with Twilio:
        # from twilio.rest import Client
        # 
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # 
        # message = client.messages.create(
        #     body=notification.title,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=notification.user.phone
        # )
        # 
        # logger.info(f"SMS notification sent to {notification.user.phone}: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SMS notification: {e}")
        raise


def create_notification_from_template(template_name, user, context, **kwargs):
    """
    Create notification from template.
    """
    try:
        from .models import NotificationTemplate
        
        template = NotificationTemplate.objects.get(name=template_name, is_active=True)
        
        title, message = template.render(context)
        
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=template.type,
            priority=template.priority,
            **kwargs
        )
        
        return notification
        
    except NotificationTemplate.DoesNotExist:
        logger.error(f"Notification template '{template_name}' not found")
        raise
    except Exception as e:
        logger.error(f"Failed to create notification from template: {e}")
        raise


def send_bulk_notification(title, message, notification_type, target_users, **kwargs):
    """
    Send bulk notification to multiple users.
    """
    try:
        from .models import BulkNotification
        
        bulk_notification = BulkNotification.objects.create(
            title=title,
            message=message,
            type=notification_type,
            target_users=target_users,
            **kwargs
        )
        
        # Send immediately (could also be scheduled)
        from .tasks import send_bulk_notification_task
        send_bulk_notification_task.delay(str(bulk_notification.id))
        
        return bulk_notification
        
    except Exception as e:
        logger.error(f"Failed to create bulk notification: {e}")
        raise


def cleanup_old_notifications():
    """
    Clean up old notifications (older than 30 days).
    """
    try:
        from django.utils import timezone
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        )
        
        count = old_notifications.count()
        old_notifications.delete()
        
        logger.info(f"Cleaned up {count} old notifications")
        return count
        
    except Exception as e:
        logger.error(f"Failed to cleanup old notifications: {e}")
        raise


def get_notification_summary(user):
    """
    Get notification summary for user.
    """
    try:
        notifications = Notification.objects.filter(user=user)
        
        summary = {
            'total': notifications.count(),
            'unread': notifications.filter(is_read=False).count(),
            'by_type': dict(
                notifications.values('type')
                .annotate(count=models.Count('id'))
                .values_list('type', 'count')
            ),
            'by_priority': dict(
                notifications.values('priority')
                .annotate(count=models.Count('id'))
                .values_list('priority', 'count')
            ),
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get notification summary: {e}")
        raise
