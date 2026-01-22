from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import User, UserProfile, UserActivity
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create user profile when user is created.
    """
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save user profile when user is saved.
    """
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Handle user login signal.
    """
    try:
        # Create user activity record
        UserActivity.objects.create(
            user=user,
            activity_type='login',
            description='User logged in',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        logger.info(f"User {user.email} logged in from {get_client_ip(request)}")
        
    except Exception as e:
        logger.error(f"Login signal error: {e}")


@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """
    Handle user logout signal.
    """
    try:
        if user:
            # Create user activity record
            UserActivity.objects.create(
                user=user,
                activity_type='logout',
                description='User logged out',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            logger.info(f"User {user.email} logged out")
            
    except Exception as e:
        logger.error(f"Logout signal error: {e}")


def get_client_ip(request):
    """
    Get client IP address from request.
    """
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
