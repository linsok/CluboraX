from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import AdminActivity, SystemAlert
from apps.core.utils import get_client_ip
import logging

logger = logging.getLogger(__name__)


@receiver(user_logged_in)
def admin_login_handler(sender, request, user, **kwargs):
    """
    Handle admin login signal.
    """
    if user.role in ['admin', 'approver']:
        try:
            AdminActivity.objects.create(
                admin=user,
                action_type='login',
                description=f'Admin {user.full_name} logged in',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            logger.info(f"Admin {user.email} logged in from {get_client_ip(request)}")
            
        except Exception as e:
            logger.error(f"Admin login signal error: {e}")


@receiver(user_logged_out)
def admin_logout_handler(sender, request, user, **kwargs):
    """
    Handle admin logout signal.
    """
    if user and user.role in ['admin', 'approver']:
        try:
            AdminActivity.objects.create(
                admin=user,
                action_type='logout',
                description=f'Admin {user.full_name} logged out',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            logger.info(f"Admin {user.email} logged out")
            
        except Exception as e:
            logger.error(f"Admin logout signal error: {e}")


@receiver(post_save, sender=SystemAlert)
def system_alert_post_save(sender, instance, created, **kwargs):
    """
    Handle system alert post-save signals.
    """
    if created:
        # Send notification to admins
        from apps.users.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        
        for admin in admins:
            from apps.core.utils import send_notification
            send_notification(
                admin,
                f'System Alert: {instance.title}',
                instance.message,
                'system'
            )
        
        logger.warning(f"System alert created: {instance.title}")


def log_admin_activity(user, action_type, description, target_user=None, target_object_type=None, target_object_id=None, request=None):
    """
    Log admin activity.
    """
    try:
        if user.role in ['admin', 'approver']:
            AdminActivity.objects.create(
                admin=user,
                action_type=action_type,
                description=description,
                target_user=target_user,
                target_object_type=target_object_type,
                target_object_id=str(target_object_id) if target_object_id else None,
                ip_address=get_client_ip(request) if request else None,
                user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
            )
    except Exception as e:
        logger.error(f"Admin activity logging error: {e}")


def create_system_alert(title, message, alert_type='info', source=None, metadata=None):
    """
    Create system alert.
    """
    try:
        alert = SystemAlert.objects.create(
            title=title,
            message=message,
            alert_type=alert_type,
            source=source,
            metadata=metadata or {}
        )
        
        logger.warning(f"System alert created: {title}")
        return alert
        
    except Exception as e:
        logger.error(f"System alert creation error: {e}")
        return None


def check_system_health():
    """
    Check system health and create alerts if needed.
    """
    try:
        from django.core.cache import cache
        from django.db import connection
        import psutil
        
        alerts = []
        
        # Check database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            alerts.append(create_system_alert(
                "Database Connection Failed",
                f"Database connection error: {str(e)}",
                "critical",
                "database"
            ))
        
        # Check cache connection
        try:
            cache.set('health_check', 'ok', 10)
            cache_result = cache.get('health_check')
            if cache_result != 'ok':
                alerts.append(create_system_alert(
                    "Cache Connection Failed",
                    "Cache connection test failed",
                    "warning",
                    "cache"
                ))
        except Exception as e:
            alerts.append(create_system_alert(
                "Cache Connection Failed",
                f"Cache connection error: {str(e)}",
                "warning",
                "cache"
            ))
        
        # Check memory usage
        try:
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                alerts.append(create_system_alert(
                    "High Memory Usage",
                    f"Memory usage is {memory.percent:.1f}%",
                    "critical",
                    "system",
                    {"memory_percent": memory.percent}
                ))
            elif memory.percent > 80:
                alerts.append(create_system_alert(
                    "High Memory Usage",
                    f"Memory usage is {memory.percent:.1f}%",
                    "warning",
                    "system",
                    {"memory_percent": memory.percent}
                ))
        except Exception:
            pass
        
        # Check disk usage
        try:
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            if disk_percent > 90:
                alerts.append(create_system_alert(
                    "Low Disk Space",
                    f"Disk usage is {disk_percent:.1f}%",
                    "critical",
                    "storage",
                    {"disk_percent": disk_percent}
                ))
            elif disk_percent > 80:
                alerts.append(create_system_alert(
                    "Low Disk Space",
                    f"Disk usage is {disk_percent:.1f}%",
                    "warning",
                    "storage",
                    {"disk_percent": disk_percent}
                ))
        except Exception:
            pass
        
        return alerts
        
    except Exception as e:
        logger.error(f"System health check error: {e}")
        return []
