from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django.db import connection
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from .models import (
    SystemOverview, AdminActivity, SystemReport, SystemSetting,
    SystemAlert, SystemBackup, SystemMaintenance
)
from .serializers import (
    SystemOverviewSerializer, AdminActivitySerializer, SystemReportSerializer,
    SystemReportCreateSerializer, SystemSettingSerializer,
    SystemSettingCreateUpdateSerializer, SystemAlertSerializer,
    SystemAlertActionSerializer, SystemBackupSerializer,
    SystemBackupCreateSerializer, SystemMaintenanceSerializer,
    SystemMaintenanceCreateSerializer, DashboardStatsSerializer,
    SystemHealthSerializer, QuickActionSerializer
)
from apps.core.permissions import IsAdminUser
from apps.core.utils import send_notification, log_user_action
from apps.users.models import User
from apps.events.models import Event
from apps.clubs.models import Club
import logging
import psutil
import os

logger = logging.getLogger(__name__)


class DashboardStatsView(APIView):
    """
    Dashboard statistics view for admin panel.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get comprehensive dashboard statistics.
        """
        try:
            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            
            # Event statistics
            total_events = Event.objects.count()
            upcoming_events = Event.objects.filter(
                start_datetime__gt=timezone.now(),
                status='approved'
            ).count()
            
            # Club statistics
            total_clubs = Club.objects.count()
            active_clubs = Club.objects.filter(status='approved').count()
            
            # Registration statistics
            from apps.events.models import EventRegistration
            total_registrations = EventRegistration.objects.count()
            
            # Approval statistics
            pending_event_approvals = Event.objects.filter(status='pending_approval').count()
            pending_club_approvals = Club.objects.filter(status='pending').count()
            pending_approvals = pending_event_approvals + pending_club_approvals
            
            # System health
            system_health = self.get_system_health()
            
            # Recent activities
            recent_activities = AdminActivity.objects.select_related('admin').order_by('-created_at')[:10]
            recent_activities_data = AdminActivitySerializer(recent_activities, many=True).data
            
            # Active alerts
            active_alerts = SystemAlert.objects.filter(
                status='active'
            ).order_by('-created_at')[:5]
            alerts_data = SystemAlertSerializer(active_alerts, many=True).data
            
            stats = {
                'total_users': total_users,
                'active_users': active_users,
                'total_events': total_events,
                'upcoming_events': upcoming_events,
                'total_clubs': total_clubs,
                'active_clubs': active_clubs,
                'total_registrations': total_registrations,
                'pending_approvals': pending_approvals,
                'system_health': system_health,
                'recent_activities': recent_activities_data,
                'alerts': alerts_data
            }
            
            serializer = DashboardStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Dashboard stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load dashboard statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_system_health(self):
        """
        Get system health information.
        """
        try:
            health_data = {
                'status': 'healthy',
                'database_status': 'healthy',
                'cache_status': 'healthy',
                'storage_status': 'healthy',
                'uptime': 'N/A',
                'memory_usage': {},
                'disk_usage': {},
                'active_connections': 0,
                'error_rate': 0.0,
                'last_check': timezone.now().isoformat()
            }
            
            # Check database connection
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                health_data['database_status'] = 'healthy'
            except Exception:
                health_data['database_status'] = 'unhealthy'
                health_data['status'] = 'degraded'
            
            # Check cache connection
            try:
                cache.set('health_check', 'ok', 10)
                cache_result = cache.get('health_check')
                if cache_result == 'ok':
                    health_data['cache_status'] = 'healthy'
                else:
                    health_data['cache_status'] = 'unhealthy'
                    health_data['status'] = 'degraded'
            except Exception:
                health_data['cache_status'] = 'unhealthy'
                health_data['status'] = 'degraded'
            
            # Get memory usage
            try:
                memory = psutil.virtual_memory()
                health_data['memory_usage'] = {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used
                }
                
                if memory.percent > 90:
                    health_data['status'] = 'critical'
                elif memory.percent > 80:
                    health_data['status'] = 'warning'
            except Exception:
                pass
            
            # Get disk usage
            try:
                disk = psutil.disk_usage('/')
                health_data['disk_usage'] = {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100
                }
                
                if (disk.used / disk.total) * 100 > 90:
                    health_data['status'] = 'critical'
                elif (disk.used / disk.total) * 100 > 80:
                    health_data['status'] = 'warning'
            except Exception:
                pass
            
            return health_data
            
        except Exception as e:
            logger.error(f"System health check error: {e}")
            return {
                'status': 'unknown',
                'error': str(e)
            }


class AdminActivityListView(generics.ListAPIView):
    """
    Admin activity list view.
    """
    serializer_class = AdminActivitySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action_type', 'admin']
    search_fields = ['description', 'target_object_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get admin activities with filtering.
        """
        queryset = AdminActivity.objects.all()
        
        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset


class SystemReportListCreateView(generics.ListCreateAPIView):
    """
    System report list and create view.
    """
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get system reports based on user role.
        """
        user = self.request.user
        return SystemReport.objects.filter(generated_by=user)
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return SystemReportCreateSerializer
        return SystemReportSerializer
    
    def perform_create(self, serializer):
        """
        Create system report and start generation.
        """
        report = serializer.save(generated_by=self.request.user)
        
        # Start report generation in background
        from .tasks import generate_system_report
        generate_system_report.delay(str(report.id))
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'SystemReport',
            report.id,
            new_values=serializer.data
        )


class SystemReportDetailView(generics.RetrieveDestroyAPIView):
    """
    System report detail view.
    """
    serializer_class = SystemReportSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get reports for current user.
        """
        return SystemReport.objects.filter(generated_by=self.request.user)


class SystemSettingListCreateView(generics.ListCreateAPIView):
    """
    System setting list and create view.
    """
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'setting_type', 'is_public']
    search_fields = ['key', 'description']
    
    def get_queryset(self):
        """
        Get system settings based on visibility.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return SystemSetting.objects.all()
        else:
            return SystemSetting.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return SystemSettingCreateUpdateSerializer
        return SystemSettingSerializer
    
    def perform_create(self, serializer):
        """
        Create system setting.
        """
        setting = serializer.save(updated_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'SystemSetting',
            setting.id,
            new_values=serializer.data
        )


class SystemSettingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    System setting detail view.
    """
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get settings based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return SystemSetting.objects.all()
        else:
            return SystemSetting.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        """
        Get appropriate serializer for update.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return SystemSettingCreateUpdateSerializer
        return SystemSettingSerializer
    
    def perform_update(self, serializer):
        """
        Update system setting.
        """
        old_values = SystemSetting.objects.get(pk=self.get_object().pk).__dict__
        serializer.save(updated_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'SystemSetting',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class SystemAlertListView(generics.ListAPIView):
    """
    System alert list view.
    """
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['alert_type', 'status']
    
    def get_queryset(self):
        """
        Get system alerts.
        """
        return SystemAlert.objects.all().order_by('-created_at')


class SystemAlertActionView(APIView):
    """
    System alert action view (acknowledge/resolve).
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, alert_id):
        """
        Acknowledge or resolve system alert.
        """
        try:
            alert = SystemAlert.objects.get(id=alert_id)
            
            serializer = SystemAlertActionSerializer(data=request.data)
            if serializer.is_valid():
                action = serializer.validated_data['action']
                notes = serializer.validated_data.get('notes', '')
                
                if action == 'acknowledge':
                    alert.acknowledge(request.user)
                    message = 'Alert acknowledged successfully'
                elif action == 'resolve':
                    alert.resolve(request.user)
                    message = 'Alert resolved successfully'
                else:
                    return Response({
                        'error': True,
                        'message': 'Invalid action'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Log user action
                log_user_action(
                    request,
                    action,
                    'SystemAlert',
                    alert.id,
                    new_values={'status': alert.status}
                )
                
                return Response({
                    'success': True,
                    'message': message,
                    'data': SystemAlertSerializer(alert).data
                })
            
            return Response({
                'error': True,
                'message': 'Invalid data',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except SystemAlert.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Alert not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Alert action error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to process alert action'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemBackupListCreateView(generics.ListCreateAPIView):
    """
    System backup list and create view.
    """
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get system backups.
        """
        return SystemBackup.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return SystemBackupCreateSerializer
        return SystemBackupSerializer
    
    def perform_create(self, serializer):
        """
        Create system backup and start process.
        """
        backup = serializer.save(initiated_by=self.request.user)
        
        # Start backup process in background
        from .tasks import create_system_backup
        create_system_backup.delay(str(backup.id))
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'SystemBackup',
            backup.id,
            new_values=serializer.data
        )


class SystemMaintenanceListCreateView(generics.ListCreateAPIView):
    """
    System maintenance list and create view.
    """
    serializer_class = SystemMaintenanceSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['maintenance_type', 'status']
    
    def get_queryset(self):
        """
        Get system maintenance records.
        """
        return SystemMaintenance.objects.all().order_by('-scheduled_start')
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return SystemMaintenanceCreateSerializer
        return SystemMaintenanceSerializer
    
    def perform_create(self, serializer):
        """
        Create system maintenance.
        """
        maintenance = serializer.save(initiated_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'SystemMaintenance',
            maintenance.id,
            new_values=serializer.data
        )


class QuickActionsView(APIView):
    """
    Quick actions view for admin dashboard.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get available quick actions.
        """
        try:
            user = request.user
            
            actions = [
                {
                    'action': 'create_user',
                    'title': 'Create User',
                    'description': 'Create a new user account',
                    'icon': 'user-plus',
                    'url': '/admin/users/create/',
                    'permission': 'admin'
                },
                {
                    'action': 'create_event',
                    'title': 'Create Event',
                    'description': 'Create a new event',
                    'icon': 'calendar-plus',
                    'url': '/admin/events/create/',
                    'permission': 'organizer'
                },
                {
                    'action': 'create_club',
                    'title': 'Create Club',
                    'description': 'Create a new club',
                    'icon': 'users',
                    'url': '/admin/clubs/create/',
                    'permission': 'organizer'
                },
                {
                    'action': 'view_reports',
                    'title': 'View Reports',
                    'description': 'View system reports',
                    'icon': 'chart-bar',
                    'url': '/admin/reports/',
                    'permission': 'admin'
                },
                {
                    'action': 'system_backup',
                    'title': 'System Backup',
                    'description': 'Create system backup',
                    'icon': 'download',
                    'url': '/admin/backup/',
                    'permission': 'admin'
                },
                {
                    'action': 'system_settings',
                    'title': 'System Settings',
                    'description': 'Configure system settings',
                    'icon': 'cog',
                    'url': '/admin/settings/',
                    'permission': 'admin'
                }
            ]
            
            # Add badge counts
            pending_approvals = Event.objects.filter(status='pending_approval').count() + \
                               Club.objects.filter(status='pending').count()
            
            for action in actions:
                if action['action'] == 'view_reports':
                    action['badge_count'] = pending_approvals
            
            # Filter actions based on user permissions
            if user.role == 'admin':
                filtered_actions = actions
            elif user.role == 'organizer':
                filtered_actions = [a for a in actions if a['permission'] in ['organizer', 'admin']]
            else:
                filtered_actions = []
            
            serializer = QuickActionSerializer(filtered_actions, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Quick actions error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load quick actions'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
