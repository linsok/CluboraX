from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Event, EventRegistration, EventApproval
from apps.core.utils import send_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Event)
def event_post_save(sender, instance, created, **kwargs):
    """
    Handle event post-save signals.
    """
    if created:
        # Send notification to relevant users
        if instance.status == 'approved':
            send_notification(
                instance.created_by,
                'Event Published',
                f'Your event "{instance.title}" has been published',
                'event_update'
            )
            
            # Notify students about new event
            from apps.users.models import User
            students = User.objects.filter(role='student', is_active=True)
            for student in students:
                send_notification(
                    student,
                    'New Event',
                    f'New event "{instance.title}" is now available',
                    'event_update'
                )
    
    elif not created:
        # Handle event updates
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                if instance.status == 'approved':
                    send_notification(
                        instance.created_by,
                        'Event Approved',
                        f'Your event "{instance.title}" has been approved',
                        'event_update'
                    )
                elif instance.status == 'rejected':
                    send_notification(
                        instance.created_by,
                        'Event Rejected',
                        f'Your event "{instance.title}" has been rejected',
                        'event_update'
                    )


@receiver(pre_save, sender=Event)
def event_pre_save(sender, instance, **kwargs):
    """
    Store old status before saving.
    """
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=EventRegistration)
def registration_post_save(sender, instance, created, **kwargs):
    """
    Handle event registration post-save signals.
    """
    if created:
        # Send confirmation to user
        send_notification(
            instance.user,
            'Registration Confirmed',
            f'You have registered for "{instance.event.title}"',
            'event_update'
        )
        
        # Notify event organizer
        send_notification(
            instance.event.created_by,
            'New Registration',
            f'{instance.user.full_name} registered for "{instance.event.title}"',
            'event_update'
        )
        
        # Check if event is full
        if instance.event.is_full:
            send_notification(
                instance.event.created_by,
                'Event Full',
                f'Your event "{instance.event.title}" is now fully booked',
                'event_update'
            )


@receiver(post_save, sender=EventApproval)
def approval_post_save(sender, instance, created, **kwargs):
    """
    Handle event approval post-save signals.
    """
    if not created and instance.status in ['approved', 'rejected']:
        # Check if all approvals are complete
        instance.check_event_approval_status()


# Schedule reminders for upcoming events
def schedule_event_reminders():
    """
    Schedule reminders for upcoming events.
    """
    from django.core.management import call_once
    from celery import shared_task
    
    @shared_task
    def send_event_reminders():
        """
        Send reminders for upcoming events.
        """
        now = timezone.now()
        reminder_time = now + timezone.timedelta(hours=24)
        
        # Get events starting in 24 hours
        upcoming_events = Event.objects.filter(
            start_datetime__gte=now,
            start_datetime__lte=reminder_time,
            status='approved'
        )
        
        for event in upcoming_events:
            # Get registered users
            registrations = event.registrations.filter(status='confirmed')
            
            for registration in registrations:
                send_notification(
                    registration.user,
                    'Event Reminder',
                    f'Reminder: "{event.title}" starts tomorrow at {event.start_datetime.strftime("%I:%M %p")}',
                    'reminder'
                )
    
    return send_event_reminders
