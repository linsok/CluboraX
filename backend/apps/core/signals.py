from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.forms.models import model_to_dict
from django.utils import timezone
import logging
import uuid

logger = logging.getLogger(__name__)

# Helper function to convert UUIDs and datetime objects to strings for JSON serialization
def convert_uuids_to_strings(data):
    """Recursively convert UUIDs and datetime objects to strings for JSON serialization."""
    if data is None:
        return None
    if isinstance(data, dict):
        return {key: convert_uuids_to_strings(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_uuids_to_strings(item) for item in data]
    elif isinstance(data, uuid.UUID):
        return str(data)
    elif hasattr(data, 'isoformat'):  # Handle datetime objects
        return data.isoformat()
    else:
        return data


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Handle user login signal.
    """
    logger.info(f"User {user.email} logged in from {get_client_ip(request)}")
    
    # Update last login
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])


@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """
    Handle user logout signal.
    """
    if user:
        logger.info(f"User {user.email} logged out")


@receiver(pre_save)
def pre_save_handler(sender, instance, **kwargs):
    """
    Handle pre-save signal for audit logging.
    """
    # Skip for certain models to avoid infinite loops
    if sender.__name__ in ['AuditLog', 'Session']:
        return
    
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            # Store old values for audit logging
            instance._old_values = model_to_dict(old_instance)
        except sender.DoesNotExist:
            instance._old_values = None


@receiver(post_save)
def post_save_handler(sender, instance, created, **kwargs):
    """
    Handle post-save signal for audit logging.
    """
    # Skip for certain models to avoid infinite loops
    if sender.__name__ in ['AuditLog', 'Session']:
        return
    
    try:
        from apps.core.models import AuditLog
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Get current user (this is tricky in signals)
        current_user = getattr(instance, '_current_user', None)
        
        if created:
            action = 'create'
            old_values = None
            new_values = convert_uuids_to_strings(model_to_dict(instance))
        else:
            action = 'update'
            old_values = convert_uuids_to_strings(getattr(instance, '_old_values', None))
            new_values = convert_uuids_to_strings(model_to_dict(instance))
        
        # Create audit log
        AuditLog.objects.create(
            user=current_user,
            action=action,
            table_name=sender.__name__,
            record_id=str(instance.pk),
            old_values=old_values,
            new_values=new_values,
            ip_address=getattr(instance, '_ip_address', None),
            user_agent=getattr(instance, '_user_agent', None)
        )
    except Exception as e:
        logger.error(f"Audit logging error: {e}")


@receiver(post_delete)
def post_delete_handler(sender, instance, **kwargs):
    """
    Handle post-delete signal for audit logging.
    """
    # Skip for certain models to avoid infinite loops
    if sender.__name__ in ['AuditLog', 'Session']:
        return
    
    try:
        from apps.core.models import AuditLog
        
        # Get current user (this is tricky in signals)
        current_user = getattr(instance, '_current_user', None)
        
        AuditLog.objects.create(
            user=current_user,
            action='delete',
            table_name=sender.__name__,
            record_id=str(instance.pk),
            old_values=convert_uuids_to_strings(model_to_dict(instance)),
            new_values=None,
            ip_address=getattr(instance, '_ip_address', None),
            user_agent=getattr(instance, '_user_agent', None)
        )
    except Exception as e:
        logger.error(f"Audit logging error: {e}")


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
