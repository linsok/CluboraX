from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.forms.models import model_to_dict
from django.utils import timezone
from django.db import models
import logging

logger = logging.getLogger(__name__)


def model_to_serializable_dict(instance):
    """
    Convert model instance to a dictionary that can be JSON serialized.
    Handles FileField, ImageField, ForeignKey, and other relational fields.
    """
    data = {}
    for field in instance._meta.fields:
        field_name = field.name
        field_value = getattr(instance, field_name)
        
        # Handle File fields (ImageField, FileField)
        if isinstance(field, (models.FileField, models.ImageField)):
            if field_value:
                data[field_name] = str(field_value)  # Convert to path string
            else:
                data[field_name] = None
        # Handle ForeignKey and OneToOneField - store the ID
        elif isinstance(field, (models.ForeignKey, models.OneToOneField)):
            if field_value:
                data[field_name] = str(field_value.pk)  # Store primary key as string
            else:
                data[field_name] = None
        # Handle other field types
        else:
            try:
                # Try to use the field value directly
                if field_value is None or isinstance(field_value, (str, int, float, bool)):
                    data[field_name] = field_value
                else:
                    # Convert to string for complex types
                    data[field_name] = str(field_value)
            except Exception:
                data[field_name] = str(field_value) if field_value is not None else None
    
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
            instance._old_values = model_to_serializable_dict(old_instance)
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
        from django.forms.models import model_to_dict
        from django.db import connection
        
        # Skip if table doesn't exist yet (during migrations)
        if 'core_auditlog' not in connection.introspection.table_names():
            return
        
        User = get_user_model()
        
        # Get current user (this is tricky in signals)
        current_user = getattr(instance, '_current_user', None)
        
        if created:
            action = 'create'
            old_values = None
            new_values = model_to_serializable_dict(instance)
        else:
            action = 'update'
            old_values = getattr(instance, '_old_values', None)
            new_values = model_to_serializable_dict(instance)
        
        # Create audit log
        import json
        from django.core.serializers.json import DjangoJSONEncoder
        
        AuditLog.objects.create(
            user=current_user,
            action=action,
            table_name=sender.__name__,
            record_id=str(instance.pk),
            old_values=json.dumps(old_values, cls=DjangoJSONEncoder) if old_values else None,
            new_values=json.dumps(new_values, cls=DjangoJSONEncoder),
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
        from django.forms.models import model_to_dict
        from django.db import connection
        
        # Skip if table doesn't exist yet (during migrations)
        if 'core_auditlog' not in connection.introspection.table_names():
            return
        
        # Get current user (this is tricky in signals)
        current_user = getattr(instance, '_current_user', None)
        
        AuditLog.objects.create(
            user=current_user,
            action='delete',
            table_name=sender.__name__,
            record_id=str(instance.pk),
            old_values=model_to_serializable_dict(instance),
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
