from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Q
from .models import Club, ClubMembership, ClubAnnouncement, ClubActivity
from apps.core.utils import send_notification
from apps.users.models import User
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_club_activity_reminders():
    """
    Send reminders for upcoming club activities.
    """
    try:
        now = timezone.now()
        reminder_time = now + timezone.timedelta(hours=24)
        
        # Get activities starting in 24 hours
        upcoming_activities = ClubActivity.objects.filter(
            date__gte=now,
            date__lte=reminder_time,
            is_public=True
        )
        
        reminders_sent = 0
        
        for activity in upcoming_activities:
            # Get club members
            members = activity.club.memberships.filter(status='approved')
            
            for member in members:
                send_notification(
                    member.user,
                    'Club Activity Reminder',
                    f'Reminder: "{activity.title}" is tomorrow at {activity.date.strftime("%I:%M %p")} at {activity.location or "TBA"}',
                    'reminder'
                )
                reminders_sent += 1
        
        logger.info(f"Sent {reminders_sent} club activity reminders")
        return f"Sent {reminders_sent} reminders"
        
    except Exception as e:
        logger.error(f"Club activity reminder task error: {e}")
        return f"Error: {str(e)}"


@shared_task
def cleanup_expired_announcements():
    """
    Clean up expired club announcements.
    """
    try:
        now = timezone.now()
        
        # Get expired announcements
        expired_announcements = ClubAnnouncement.objects.filter(
            expires_at__lt=now,
            is_active=True
        )
        
        cleaned_count = 0
        
        for announcement in expired_announcements:
            announcement.is_active = False
            announcement.save()
            cleaned_count += 1
        
        logger.info(f"Deactivated {cleaned_count} expired announcements")
        return f"Deactivated {cleaned_count} announcements"
        
    except Exception as e:
        logger.error(f"Announcement cleanup error: {e}")
        return f"Error: {str(e)}"


@shared_task
def generate_club_reports():
    """
    Generate weekly club reports for organizers and admins.
    """
    try:
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())
        
        # Get club statistics for the week
        weekly_stats = {
            'week_start': week_start.isoformat(),
            'new_memberships': ClubMembership.objects.filter(
                created_at__gte=week_start
            ).count(),
            'new_clubs': Club.objects.filter(
                created_at__gte=week_start
            ).count(),
            'active_clubs': Club.objects.filter(status='approved').count(),
            'total_members': ClubMembership.objects.filter(status='approved').count()
        }
        
        # Send reports to club organizers
        organizers = User.objects.filter(role='organizer', is_active=True)
        
        for organizer in organizers:
            organizer_clubs = Club.objects.filter(created_by=organizer)
            organizer_stats = weekly_stats.copy()
            organizer_stats['my_clubs'] = organizer_clubs.count()
            organizer_stats['my_new_members'] = ClubMembership.objects.filter(
                club__in=organizer_clubs,
                created_at__gte=week_start
            ).count()
            
            send_notification(
                organizer,
                'Weekly Club Report',
                f'Your clubs have {organizer_stats["my_new_members"]} new members this week',
                'system'
            )
        
        # Send report to admins
        admins = User.objects.filter(role='admin', is_active=True)
        
        for admin in admins:
            send_notification(
                admin,
                'Weekly Campus Clubs Report',
                f'Total {weekly_stats["new_memberships"]} new club memberships this week',
                'system'
            )
        
        logger.info(f"Generated weekly club report for week starting {week_start}")
        return f"Report generated for week {week_start}"
        
    except Exception as e:
        logger.error(f"Club report generation error: {e}")
        return f"Error: {str(e)}"


@shared_task
def update_club_statistics():
    """
    Update club statistics and analytics.
    """
    try:
        from apps.core.models import SystemSetting
        
        # Calculate various statistics
        total_clubs = Club.objects.count()
        approved_clubs = Club.objects.filter(status='approved').count()
        total_memberships = ClubMembership.objects.count()
        active_memberships = ClubMembership.objects.filter(status='approved').count()
        
        # Update system settings with statistics
        SystemSetting.set_value('total_clubs', str(total_clubs), 'Total number of clubs')
        SystemSetting.set_value('approved_clubs', str(approved_clubs), 'Number of approved clubs')
        SystemSetting.set_value('total_memberships', str(total_memberships), 'Total club memberships')
        SystemSetting.set_value('active_memberships', str(active_memberships), 'Active club memberships')
        
        # Calculate average club size
        if approved_clubs > 0:
            avg_club_size = active_memberships / approved_clubs
            SystemSetting.set_value('avg_club_size', f"{avg_club_size:.2f}", 'Average club size')
        
        # Calculate participation rate
        from apps.users.models import User
        active_students = User.objects.filter(role='student', is_active=True).count()
        if active_students > 0:
            participation_rate = (active_memberships / active_students) * 100
            SystemSetting.set_value('club_participation_rate', f"{participation_rate:.2f}", 'Student club participation rate')
        
        logger.info("Updated club statistics")
        return "Club statistics updated successfully"
        
    except Exception as e:
        logger.error(f"Club statistics update error: {e}")
        return f"Error: {str(e)}"


@shared_task
def send_membership_renewal_reminders():
    """
    Send reminders for inactive club members.
    """
    try:
        # Get members who haven't been active for 3 months
        three_months_ago = timezone.now() - timezone.timedelta(days=90)
        
        inactive_members = ClubMembership.objects.filter(
            status='approved',
            updated_at__lt=three_months_ago
        ).select_related('user', 'club')
        
        reminders_sent = 0
        
        for membership in inactive_members:
            send_notification(
                membership.user,
                'Club Membership Reminder',
                f'Your membership in "{membership.club.name}" has been inactive. Consider participating in club activities!',
                'reminder'
            )
            reminders_sent += 1
        
        logger.info(f"Sent {reminders_sent} membership renewal reminders")
        return f"Sent {reminders_sent} reminders"
        
    except Exception as e:
        logger.error(f"Membership renewal reminder error: {e}")
        return f"Error: {str(e)}"


@shared_task
def auto_approve_small_clubs():
    """
    Auto-approve clubs that meet minimum requirements (admin configurable).
    """
    try:
        from apps.core.models import SystemSetting
        
        # Get minimum member requirement
        min_members = int(SystemSetting.get_value('min_club_members', '10'))
        
        # Get clubs with sufficient members
        clubs_to_approve = Club.objects.filter(
            status='pending'
        ).annotate(
            member_count=Count('memberships', filter=Q(memberships__status='approved'))
        ).filter(member_count__gte=min_members)
        
        approved_count = 0
        
        for club in clubs_to_approve:
            # Check if all required approvals are pending
            pending_approvals = club.approvals.filter(status='pending')
            
            # Auto-approve student affairs and dean approvals
            for approval in pending_approvals:
                if approval.approver_type in ['student_affairs', 'dean']:
                    approval.approve(None, "Auto-approved: Minimum member requirement met")
            
            approved_count += 1
        
        logger.info(f"Auto-approved {approved_count} clubs with sufficient members")
        return f"Auto-approved {approved_count} clubs"
        
    except Exception as e:
        logger.error(f"Auto-approval error: {e}")
        return f"Error: {str(e)}"
