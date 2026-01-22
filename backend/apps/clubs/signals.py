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
    """
    if created:
        # Send notification to relevant users
        if instance.status == 'approved':
            send_notification(
                instance.created_by,
                'Club Approved',
                f'Your club "{instance.name}" has been approved',
                'club_update'
            )
            
            # Notify students about new club
            from apps.users.models import User
            students = User.objects.filter(role='student', is_active=True)
            for student in students:
                send_notification(
                    student,
                    'New Club',
                    f'New club "{instance.name}" is now available for membership',
                    'club_update'
                )
    
    elif not created:
        # Handle club updates
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                if instance.status == 'approved':
                    send_notification(
                        instance.created_by,
                        'Club Approved',
                        f'Your club "{instance.name}" has been approved',
                        'club_update'
                    )
                elif instance.status == 'rejected':
                    send_notification(
                        instance.created_by,
                        'Club Rejected',
                        f'Your club "{instance.name}" has been rejected',
                        'club_update'
                    )


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


@receiver(post_save, sender=ClubMembership)
def membership_post_save(sender, instance, created, **kwargs):
    """
    Handle club membership post-save signals.
    """
    if created:
        # Send notification to user
        if instance.status == 'approved':
            send_notification(
                instance.user,
                'Membership Approved',
                f'Your membership in "{instance.club.name}" has been approved',
                'club_update'
            )
            
            # Notify club leaders
            leaders = instance.club.memberships.filter(role='leader', status='approved')
            for leader in leaders:
                send_notification(
                    leader.user,
                    'New Member',
                    f'{instance.user.full_name} has joined "{instance.club.name}"',
                    'club_update'
                )
        
        elif instance.status == 'pending':
            # Send notification to club leaders about new request
            leaders = instance.club.memberships.filter(role='leader', status='approved')
            for leader in leaders:
                send_notification(
                    leader.user,
                    'New Membership Request',
                    f'{instance.user.full_name} has requested to join "{instance.club.name}"',
                    'club_update'
                )
    
    else:
        # Handle membership status changes
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                if instance.status == 'approved':
                    send_notification(
                        instance.user,
                        'Membership Approved',
                        f'Your membership in "{instance.club.name}" has been approved',
                        'club_update'
                    )
                    
                    # Notify club leaders
                    leaders = instance.club.memberships.filter(role='leader', status='approved')
                    for leader in leaders:
                        send_notification(
                            leader.user,
                            'New Member Approved',
                            f'{instance.user.full_name} has been approved for "{instance.club.name}"',
                            'club_update'
                        )
                
                elif instance.status == 'rejected':
                    send_notification(
                        instance.user,
                        'Membership Rejected',
                        f'Your membership in "{instance.club.name}" has been rejected',
                        'club_update'
                    )


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
