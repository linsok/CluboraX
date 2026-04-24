from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Club, ClubMembership, ClubApproval
from apps.core.utils import send_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Club)
def club_post_save(sender, instance, created, **kwargs):
    """
    Handle club post-save signals.
    Notify organizer on approval and all students on new clubs.
    """
    if created:
        # Send notification to relevant users
        if instance.status == 'approved':
            send_notification(
                instance.created_by,
                'Club Published 🎉',
                f'Your club "{instance.name}" has been published! Students can now join.',
                'club_update',
                priority='medium'
            )
    
    elif not created:
        # Handle club updates and status changes
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                if instance.status == 'approved':
                    send_notification(
                        instance.created_by,
                        'Club Approved ✅',
                        f'Your club "{instance.name}" has been approved and is now published!',
                        'club_update',
                        priority='medium'
                    )
                
                elif instance.status == 'rejected':
                    send_notification(
                        instance.created_by,
                        'Club Rejected ❌',
                        f'Your club "{instance.name}" has been rejected. Please review and try again.',
                        'club_update',
                        priority='high'
                    )
                    
                    logger.warning(f"Club '{instance.name}' rejected by admin.")
                
                elif instance.status == 'dissolved':
                    send_notification(
                        instance.created_by,
                        'Club Dissolved 🚫',
                        f'Your club "{instance.name}" has been dissolved.',
                        'club_update',
                        priority='high'
                    )
                    
                    # Notify all club members
                    memberships = ClubMembership.objects.filter(club=instance, status='approved')
                    for membership in memberships:
                        send_notification(
                            membership.user,
                            'Club Dissolved 🚫',
                            f'The club "{instance.name}" has been dissolved.',
                            'club_update',
                            priority='high'
                        )
                    
                    logger.info(f"Club '{instance.name}' dissolved. Notified {memberships.count()} members.")


@receiver(pre_save, sender=Club)
def club_pre_save(sender, instance, **kwargs):
    """
    Store old status before saving.
    """
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            pass


@receiver(pre_save, sender=ClubMembership)
def membership_pre_save(sender, instance, **kwargs):
    """
    Store old status before saving membership.
    """
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=ClubMembership)
def membership_post_save(sender, instance, created, **kwargs):
    """
    Handle club membership post-save signals.
    Notify user, club leaders, and other members when someone joins.
    DISABLED: Membership notifications disabled per admin request
    """
    if created:
        # Membership created - notifications disabled
        logger.info(f"Membership created: {instance.user.email} joined {instance.club.name}")
    
    else:
        # Handle membership status updates - notifications disabled
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                logger.info(f"Membership status changed: {instance.user.email} - {instance.club.name} - {instance.status}")


@receiver(pre_save, sender=ClubMembership)
def membership_pre_save(sender, instance, **kwargs):
    """
    Store old status before saving.
    """
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=ClubApproval)
def approval_post_save(sender, instance, created, **kwargs):
    """
    Handle club approval post-save signals.
    """
    if not created and instance.status in ['approved', 'rejected']:
        # Check if all approvals are complete
        instance.check_club_approval_status()
