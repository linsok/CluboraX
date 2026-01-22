from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Event, EventRegistration
from apps.core.utils import send_notification
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_event_reminders():
    """
    Send reminders for upcoming events (24 hours before).
    """
    try:
        now = timezone.now()
        reminder_time = now + timezone.timedelta(hours=24)
        
        # Get events starting in 24 hours
        upcoming_events = Event.objects.filter(
            start_datetime__gte=now,
            start_datetime__lte=reminder_time,
            status='approved'
        )
        
        reminders_sent = 0
        
        for event in upcoming_events:
            # Get registered users
            registrations = event.registrations.filter(status='confirmed')
            
            for registration in registrations:
                send_notification(
                    registration.user,
                    'Event Reminder',
                    f'Reminder: "{event.title}" starts tomorrow at {event.start_datetime.strftime("%I:%M %p")} at {event.venue}',
                    'reminder'
                )
                reminders_sent += 1
        
        logger.info(f"Sent {reminders_sent} event reminders")
        return f"Sent {reminders_sent} reminders"
        
    except Exception as e:
        logger.error(f"Event reminder task error: {e}")
        return f"Error: {str(e)}"


@shared_task
def send_event_cancellation_notifications(event_id):
    """
    Send notifications when event is cancelled.
    """
    try:
        event = Event.objects.get(id=event_id)
        
        # Get all registered users
        registrations = event.registrations.filter(status='confirmed')
        
        notifications_sent = 0
        
        for registration in registrations:
            send_notification(
                registration.user,
                'Event Cancelled',
                f'The event "{event.title}" has been cancelled. We apologize for the inconvenience.',
                'event_update'
            )
            notifications_sent += 1
        
        logger.info(f"Sent {notifications_sent} cancellation notifications for event {event.title}")
        return f"Sent {notifications_sent} notifications"
        
    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        return "Event not found"
    except Exception as e:
        logger.error(f"Cancellation notification task error: {e}")
        return f"Error: {str(e)}"


@shared_task
def generate_event_reports():
    """
    Generate daily event reports for organizers and admins.
    """
    try:
        today = timezone.now().date()
        
        # Get events happening today
        today_events = Event.objects.filter(
            start_datetime__date=today,
            status='approved'
        )
        
        # Generate report data
        report_data = {
            'date': today.isoformat(),
            'total_events': today_events.count(),
            'events': []
        }
        
        for event in today_events:
            event_data = {
                'title': event.title,
                'start_time': event.start_datetime.strftime("%I:%M %p"),
                'venue': event.venue,
                'registered_participants': event.registrations.filter(status='confirmed').count(),
                'max_participants': event.max_participants
            }
            report_data['events'].append(event_data)
        
        # Send reports to organizers
        organizers = set()
        for event in today_events:
            organizers.add(event.created_by)
        
        for organizer in organizers:
            send_notification(
                organizer,
                'Daily Event Report',
                f'You have {today_events.filter(created_by=organizer).count()} events scheduled for today',
                'system'
            )
        
        # Send report to admins
        from apps.users.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        
        for admin in admins:
            send_notification(
                admin,
                'Daily Campus Events Report',
                f'Total {report_data["total_events"]} events scheduled for today',
                'system'
            )
        
        logger.info(f"Generated daily event report for {today}")
        return f"Report generated for {today}"
        
    except Exception as e:
        logger.error(f"Event report generation error: {e}")
        return f"Error: {str(e)}"


@shared_task
def cleanup_expired_qr_codes():
    """
    Clean up expired QR codes and old registration data.
    """
    try:
        # Get events that ended more than 7 days ago
        cutoff_date = timezone.now() - timezone.timedelta(days=7)
        old_events = Event.objects.filter(
            end_datetime__lt=cutoff_date
        )
        
        cleaned_registrations = 0
        
        for event in old_events:
            # Remove QR codes for old events
            registrations = event.registrations.all()
            for registration in registrations:
                if registration.qr_code_image:
                    registration.qr_code_image.delete(save=False)
                    registration.qr_code = None
                    registration.save(update_fields=['qr_code', 'qr_code_image'])
                    cleaned_registrations += 1
        
        logger.info(f"Cleaned up QR codes for {cleaned_registrations} old registrations")
        return f"Cleaned up {cleaned_registrations} QR codes"
        
    except Exception as e:
        logger.error(f"QR code cleanup error: {e}")
        return f"Error: {str(e)}"


@shared_task
def update_event_statistics():
    """
    Update event statistics and analytics.
    """
    try:
        from apps.core.models import SystemSetting
        
        # Calculate various statistics
        total_events = Event.objects.count()
        approved_events = Event.objects.filter(status='approved').count()
        total_registrations = EventRegistration.objects.count()
        
        # Update system settings with statistics
        SystemSetting.set_value('total_events', str(total_events), 'Total number of events')
        SystemSetting.set_value('approved_events', str(approved_events), 'Number of approved events')
        SystemSetting.set_value('total_registrations', str(total_registrations), 'Total event registrations')
        
        # Calculate participation rate
        from apps.users.models import User
        active_students = User.objects.filter(role='student', is_active=True).count()
        if active_students > 0:
            participation_rate = (total_registrations / active_students) * 100
            SystemSetting.set_value('participation_rate', f"{participation_rate:.2f}", 'Student participation rate')
        
        logger.info("Updated event statistics")
        return "Statistics updated successfully"
        
    except Exception as e:
        logger.error(f"Statistics update error: {e}")
        return f"Error: {str(e)}"


@shared_task
def send_payment_reminders():
    """
    Send reminders for pending payments.
    """
    try:
        # Get registrations with pending payments
        pending_registrations = EventRegistration.objects.filter(
            status='pending_payment',
            payment_status='pending'
        )
        
        reminders_sent = 0
        
        for registration in pending_registrations:
            # Check if registration is older than 24 hours
            if registration.created_at < timezone.now() - timezone.timedelta(hours=24):
                send_notification(
                    registration.user,
                    'Payment Reminder',
                    f'Please complete payment for "{registration.event.title}" to confirm your registration',
                    'payment'
                )
                reminders_sent += 1
        
        logger.info(f"Sent {reminders_sent} payment reminders")
        return f"Sent {reminders_sent} payment reminders"
        
    except Exception as e:
        logger.error(f"Payment reminder task error: {e}")
        return f"Error: {str(e)}"
