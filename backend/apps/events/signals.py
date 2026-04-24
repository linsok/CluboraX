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
    Notify organizer on approval and all students on new events.
    """
    if created:
        # Send notification to relevant users
        if instance.status == 'approved':
            send_notification(
                instance.created_by,
                'Event Published 🎉',
                f'Your event "{instance.title}" has been published! Students can now register.',
                'event_update',
                priority='medium'
            )
    
    elif not created:
        # Handle event updates and status changes
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                if instance.status == 'approved':
                    send_notification(
                        instance.created_by,
                        'Event Approved ✅',
                        f'Your event "{instance.title}" has been approved and is now published!',
                        'event_update',
                        priority='medium'
                    )
                
                elif instance.status == 'rejected':
                    send_notification(
                        instance.created_by,
                        'Event Rejected ❌',
                        f'Your event "{instance.title}" has been rejected. Please review and try again.',
                        'event_update',
                        priority='high'
                    )
                    
                    logger.warning(f"Event '{instance.title}' rejected by admin.")
                
                elif instance.status == 'cancelled':
                    send_notification(
                        instance.created_by,
                        'Event Cancelled 🚫',
                        f'Your event "{instance.title}" has been cancelled.',
                        'event_update',
                        priority='high'
                    )
                    
                    # Notify all registered participants
                    registrations = EventRegistration.objects.filter(event=instance, status='confirmed')
                    for registration in registrations:
                        send_notification(
                            registration.user,
                            'Event Cancelled 🚫',
                            f'The event "{instance.title}" has been cancelled.',
                            'event_update',
                            priority='high'
                        )
                    
                    logger.info(f"Event '{instance.title}' cancelled. Notified {registrations.count()} registered users.")


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
    Notify both registrant and event organizer.
    """
    if created:
        event = instance.event
        user = instance.user
        
        # Send confirmation to registered user
        send_notification(
            user,
            'Event Registration Confirmed ✅',
            f'You have successfully registered for "{event.title}"! Looking forward to seeing you there.',
            'event_update',
            priority='medium'
        )
        
        # Notify event organizer about new registration
        send_notification(
            event.created_by,
            'New Registration 👤',
            f'{user.full_name} has registered for "{event.title}"',
            'event_update',
            priority='medium'
        )
        
        # Check if event is full
        if event.is_full:
            send_notification(
                event.created_by,
                'Event Fully Booked 🎫',
                f'Your event "{event.title}" has reached maximum capacity!',
                'event_update',
                priority='high'
            )
            
            # Notify users on waitlist if any
            waitlist = EventRegistration.objects.filter(event=event, status='waitlist')
            for waitlist_entry in waitlist:
                send_notification(
                    waitlist_entry.user,
                    'Event Full - You\'re on Waitlist ⏳',
                    f'"{event.title}" is now full. You\'re on the waitlist.',
                    'event_update',
                    priority='medium'
                )
        
        logger.info(f"User {user.email} registered for event {event.title}")
    
    elif not created:
        # Handle registration status changes
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                event = instance.event
                user = instance.user
                
                if instance.status == 'confirmed':
                    send_notification(
                        user,
                        'Registration Confirmed ✅',
                        f'Your registration for "{event.title}" has been confirmed!',
                        'event_update',
                        priority='medium'
                    )
                
                elif instance.status == 'cancelled':
                    send_notification(
                        user,
                        'Registration Cancelled ❌',
                        f'Your registration for "{event.title}" has been cancelled.',
                        'event_update',
                        priority='high'
                    )
                    
                    # Notify organizer
                    send_notification(
                        event.created_by,
                        'Registration Cancelled 🔔',
                        f'{user.full_name} cancelled their registration for "{event.title}"',
                        'event_update',
                        priority='low'
                    )
                
                logger.info(f"Registration status changed: {user.email} - {event.title} - {instance.status}")


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
