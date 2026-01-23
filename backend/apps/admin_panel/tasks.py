from celery import shared_task
from django.utils import timezone
from django.core.management import call_command
from django.db import connection
from django.db.models import Count
from .models import SystemReport, SystemBackup, SystemMaintenance
from apps.users.models import User
from apps.events.models import Event
from apps.clubs.models import Club
import logging
import os
import subprocess

logger = logging.getLogger(__name__)


@shared_task
def generate_system_report(report_id):
    """
    Generate system report.
    """
    try:
        report = SystemReport.objects.get(id=report_id)
        
        # Update status to generating
        report.status = 'generating'
        report.started_at = timezone.now()
        report.save()
        
        # Generate report based on type
        if report.report_type == 'daily':
            report_data = generate_daily_report(report.parameters)
        elif report.report_type == 'weekly':
            report_data = generate_weekly_report(report.parameters)
        elif report.report_type == 'monthly':
            report_data = generate_monthly_report(report.parameters)
        elif report.report_type == 'custom':
            report_data = generate_custom_report(report.parameters)
        else:
            raise ValueError(f"Unknown report type: {report.report_type}")
        
        # Save report to file
        file_path = save_report_to_file(report, report_data)
        
        # Update report status
        report.status = 'completed'
        report.file_path = file_path
        report.completed_at = timezone.now()
        report.save()
        
        logger.info(f"Generated system report: {report.title}")
        return f"Report generated: {report.title}"
        
    except SystemReport.DoesNotExist:
        logger.error(f"System report {report_id} not found")
        return "Report not found"
    except Exception as e:
        logger.error(f"System report generation error: {e}")
        
        # Update status to failed
        try:
            report = SystemReport.objects.get(id=report_id)
            report.status = 'failed'
            report.save()
        except SystemReport.DoesNotExist:
            pass
        
        return f"Error: {str(e)}"


def generate_daily_report(parameters):
    """
    Generate daily report data.
    """
    from apps.users.models import User
    from apps.events.models import Event, EventRegistration
    from apps.clubs.models import Club, ClubMembership
    from datetime import date, timedelta
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    data = {
        'date': yesterday.isoformat(),
        'users': {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'new': User.objects.filter(date_joined__date=yesterday).count(),
            'by_role': dict(
                User.objects.values('role')
                .annotate(count=Count('id'))
                .values_list('role', 'count')
            )
        },
        'events': {
            'total': Event.objects.count(),
            'upcoming': Event.objects.filter(start_datetime__date__gte=today).count(),
            'yesterday': Event.objects.filter(start_datetime__date=yesterday).count(),
            'registrations': {
                'total': EventRegistration.objects.count(),
                'new': EventRegistration.objects.filter(registration_date__date=yesterday).count()
            }
        },
        'clubs': {
            'total': Club.objects.count(),
            'active': Club.objects.filter(status='approved').count(),
            'new': Club.objects.filter(created_at__date=yesterday).count(),
            'memberships': {
                'total': ClubMembership.objects.count(),
                'new': ClubMembership.objects.filter(joined_at__date=yesterday).count()
            }
        }
    }
    
    return data


def generate_weekly_report(parameters):
    """
    Generate weekly report data.
    """
    from apps.users.models import User
    from apps.events.models import Event, EventRegistration
    from apps.clubs.models import Club, ClubMembership
    from datetime import date, timedelta
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    data = {
        'week_start': week_start.isoformat(),
        'week_end': week_end.isoformat(),
        'users': {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'new': User.objects.filter(date_joined__date__gte=week_start, date_joined__date__lte=week_end).count(),
            'growth_rate': calculate_growth_rate(User, 'date_joined', 7)
        },
        'events': {
            'total': Event.objects.count(),
            'this_week': Event.objects.filter(start_datetime__date__gte=week_start, start_datetime__date__lte=week_end).count(),
            'registrations': {
                'total': EventRegistration.objects.count(),
                'this_week': EventRegistration.objects.filter(registration_date__date__gte=week_start, registration_date__date__lte=week_end).count()
            }
        },
        'clubs': {
            'total': Club.objects.count(),
            'active': Club.objects.filter(status='approved').count(),
            'new': Club.objects.filter(created_at__date__gte=week_start, created_at__date__lte=week_end).count(),
            'memberships': {
                'total': ClubMembership.objects.count(),
                'this_week': ClubMembership.objects.filter(joined_at__date__gte=week_start, joined_at__date__lte=week_end).count()
            }
        }
    }
    
    return data


def generate_monthly_report(parameters):
    """
    Generate monthly report data.
    """
    from apps.users.models import User
    from apps.events.models import Event, EventRegistration
    from apps.clubs.models import Club, ClubMembership
    from datetime import date, timedelta
    
    today = date.today()
    month_start = today.replace(day=1)
    
    data = {
        'month': month_start.strftime('%B %Y'),
        'users': {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'new': User.objects.filter(date_joined__date__gte=month_start).count(),
            'growth_rate': calculate_growth_rate(User, 'date_joined', 30)
        },
        'events': {
            'total': Event.objects.count(),
            'this_month': Event.objects.filter(start_datetime__date__gte=month_start).count(),
            'registrations': {
                'total': EventRegistration.objects.count(),
                'this_month': EventRegistration.objects.filter(registration_date__date__gte=month_start).count()
            }
        },
        'clubs': {
            'total': Club.objects.count(),
            'active': Club.objects.filter(status='approved').count(),
            'new': Club.objects.filter(created_at__date__gte=month_start).count(),
            'memberships': {
                'total': ClubMembership.objects.count(),
                'this_month': ClubMembership.objects.filter(joined_at__date__gte=month_start).count()
            }
        }
    }
    
    return data


def generate_custom_report(parameters):
    """
    Generate custom report based on parameters.
    """
    # This would be implemented based on custom parameters
    # For now, return a basic structure
    return {
        'custom': True,
        'parameters': parameters,
        'data': 'Custom report data would go here'
    }


def calculate_growth_rate(model, date_field, days):
    """
    Calculate growth rate for a model.
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    recent_count = model.objects.filter(**{f'{date_field}__gte': cutoff_date}).count()
    
    if recent_count == 0:
        return 0.0
    
    # Simple growth rate calculation
    return float(recent_count)


def save_report_to_file(report, data):
    """
    Save report data to file.
    """
    import json
    from django.conf import settings
    from django.core.files import File
    from io import StringIO
    
    # Create JSON string
    json_data = json.dumps(data, indent=2, default=str)
    
    # Create file
    file_name = f"report_{report.id}_{report.title.replace(' ', '_')}.json"
    file_path = f"reports/{file_name}"
    
    # Save to Django file storage
    with open(file_path, 'w') as f:
        f.write(json_data)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Update report file info
    report.file_size = file_size
    
    return file_path


@shared_task
def create_system_backup(backup_id):
    """
    Create system backup.
    """
    try:
        backup = SystemBackup.objects.get(id=backup_id)
        
        # Update status to running
        backup.status = 'running'
        backup.started_at = timezone.now()
        backup.save()
        
        # Create backup based on type
        if backup.backup_type == 'full':
            file_path = create_full_backup()
        elif backup.backup_type == 'database':
            file_path = create_database_backup()
        elif backup.backup_type == 'media':
            file_path = create_media_backup()
        else:
            raise ValueError(f"Unknown backup type: {backup.backup_type}")
        
        # Get file size
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        # Update backup status
        backup.status = 'completed'
        backup.file_path = file_path
        backup.file_size = file_size
        backup.completed_at = timezone.now()
        backup.save()
        
        logger.info(f"Created system backup: {backup.backup_type}")
        return f"Backup created: {backup.backup_type}"
        
    except SystemBackup.DoesNotExist:
        logger.error(f"System backup {backup_id} not found")
        return "Backup not found"
    except Exception as e:
        logger.error(f"System backup creation error: {e}")
        
        # Update status to failed
        try:
            backup = SystemBackup.objects.get(id=backup_id)
            backup.status = 'failed'
            backup.error_message = str(e)
            backup.save()
        except SystemBackup.DoesNotExist:
            pass
        
        return f"Error: {str(e)}"


def create_full_backup():
    """
    Create full system backup.
    """
    from django.conf import settings
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = f"backups/full_{timestamp}"
    
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)
    
    # Database backup
    db_file = os.path.join(backup_dir, 'database.sql')
    create_database_backup_file(db_file)
    
    # Media backup
    media_dir = os.path.join(backup_dir, 'media')
    create_media_backup_directory(media_dir)
    
    # Create archive
    archive_file = f"{backup_dir}.tar.gz"
    subprocess.run(['tar', '-czf', archive_file, backup_dir], check=True)
    
    # Clean up temporary directory
    subprocess.run(['rm', '-rf', backup_dir], check=True)
    
    return archive_file


def create_database_backup():
    """
    Create database backup.
    """
    from django.conf import settings
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f"backups/database_{timestamp}.sql"
    
    return create_database_backup_file(backup_file)


def create_database_backup_file(backup_file):
    """
    Create database backup file.
    """
    from django.conf import settings
    
    # Create backup directory
    os.makedirs(os.path.dirname(backup_file), exist_ok=True)
    
    # Use mysqldump for MySQL
    db_config = settings.DATABASES['default']
    
    command = [
        'mysqldump',
        f'--host={db_config["HOST"]}',
        f'--user={db_config["USER"]}',
        f'--password={db_config["PASSWORD"]}',
        db_config['NAME']
    ]
    
    with open(backup_file, 'w') as f:
        subprocess.run(command, stdout=f, check=True)
    
    return backup_file


def create_media_backup():
    """
    Create media backup.
    """
    from django.conf import settings
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = f"backups/media_{timestamp}"
    
    return create_media_backup_directory(backup_dir)


def create_media_backup_directory(backup_dir):
    """
    Create media backup directory.
    """
    from django.conf import settings
    
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)
    
    # Copy media directory
    if os.path.exists(settings.MEDIA_ROOT):
        subprocess.run(['cp', '-r', settings.MEDIA_ROOT, backup_dir], check=True)
    
    return backup_dir


@shared_task
def schedule_maintenance_notification():
    """
    Send notification for scheduled maintenance.
    """
    try:
        upcoming_maintenance = SystemMaintenance.objects.filter(
            status='scheduled',
            scheduled_start__lte=timezone.now() + timezone.timedelta(hours=1)
        )
        
        for maintenance in upcoming_maintenance:
            if not maintenance.notification_sent:
                # Send notification to admins
                from apps.users.models import User
                from apps.core.utils import send_notification
                
                admins = User.objects.filter(role='admin', is_active=True)
                
                for admin in admins:
                    send_notification(
                        admin,
                        'Scheduled Maintenance',
                        f'Maintenance "{maintenance.title}" starts at {maintenance.scheduled_start}',
                        'system'
                    )
                
                # Mark notification as sent
                maintenance.notification_sent = True
                maintenance.save()
        
        logger.info(f"Sent maintenance notifications for {upcoming_maintenance.count()} maintenance events")
        return f"Notifications sent for {upcoming_maintenance.count()} events"
        
    except Exception as e:
        logger.error(f"Maintenance notification error: {e}")
        return f"Error: {str(e)}"


@shared_task
def update_system_overview():
    """
    Update cached system overview data.
    """
    try:
        from .models import SystemOverview
        
        # Collect system overview data
        data = {
            'timestamp': timezone.now().isoformat(),
            'users': {
                'total': User.objects.count(),
                'active': User.objects.filter(is_active=True).count(),
                'by_role': dict(
                    User.objects.values('role')
                    .annotate(count=Count('id'))
                    .values_list('role', 'count')
                )
            },
            'events': {
                'total': Event.objects.count(),
                'upcoming': Event.objects.filter(
                    start_datetime__gt=timezone.now(),
                    status='approved'
                ).count(),
                'by_status': dict(
                    Event.objects.values('status')
                    .annotate(count=Count('id'))
                    .values_list('status', 'count')
                )
            },
            'clubs': {
                'total': Club.objects.count(),
                'active': Club.objects.filter(status='approved').count(),
                'by_status': dict(
                    Club.objects.values('status')
                    .annotate(count=Count('id'))
                    .values_list('status', 'count')
                )
            }
        }
        
        # Update or create overview
        overview, created = SystemOverview.objects.update_or_create(
            id=SystemOverview.objects.first().id if SystemOverview.objects.exists() else None,
            defaults={'data': data}
        )
        
        logger.info("Updated system overview data")
        return "System overview updated"
        
    except Exception as e:
        logger.error(f"System overview update error: {e}")
        return f"Error: {str(e)}"
