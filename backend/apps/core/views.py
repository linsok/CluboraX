from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Count, Q
from .models import SystemSetting, AuditLog
from .serializers import (
    SystemSettingSerializer, 
    AuditLogSerializer,
    ErrorResponseSerializer,
    SuccessResponseSerializer,
    StatisticsSerializer,
    ChartDataSerializer
)
from .permissions import IsAdminOrReadOnly
import logging

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the current user.
    """
    try:
        user = request.user
        
        # Get user-specific statistics based on role
        stats = {}
        
        if user.role == 'student':
            from apps.events.models import Event, EventRegistration
            from apps.clubs.models import Club, ClubMembership
            
            stats = {
                'registered_events': EventRegistration.objects.filter(user=user).count(),
                'upcoming_events': Event.objects.filter(
                    registrations__user=user,
                    start_datetime__gt=timezone.now()
                ).count(),
                'joined_clubs': ClubMembership.objects.filter(
                    user=user, 
                    status='approved'
                ).count(),
                'pending_memberships': ClubMembership.objects.filter(
                    user=user, 
                    status='pending'
                ).count()
            }
            
        elif user.role == 'organizer':
            from apps.events.models import Event
            from apps.clubs.models import Club
            
            stats = {
                'my_events': Event.objects.filter(created_by=user).count(),
                'active_events': Event.objects.filter(
                    created_by=user,
                    status='approved'
                ).count(),
                'my_clubs': Club.objects.filter(created_by=user).count(),
                'total_registrations': EventRegistration.objects.filter(
                    event__created_by=user
                ).count()
            }
            
        elif user.role == 'approver':
            from apps.events.models import Event, EventApproval
            from apps.clubs.models import Club, ClubApproval
            
            stats = {
                'pending_events': EventApproval.objects.filter(
                    approver=user,
                    status='pending'
                ).count(),
                'pending_clubs': ClubApproval.objects.filter(
                    approver=user,
                    status='pending'
                ).count(),
                'approved_events': EventApproval.objects.filter(
                    approver=user,
                    status='approved'
                ).count(),
                'approved_clubs': ClubApproval.objects.filter(
                    approver=user,
                    status='approved'
                ).count()
            }
            
        elif user.role == 'admin':
            from apps.users.models import User
            from apps.events.models import Event
            from apps.clubs.models import Club
            
            stats = {
                'total_users': User.objects.count(),
                'total_events': Event.objects.count(),
                'total_clubs': Club.objects.count(),
                'active_users': User.objects.filter(is_active=True).count()
            }
        
        return Response({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return Response({
            'error': True,
            'message': 'Failed to load dashboard statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_settings(request):
    """
    Get or update system settings.
    """
    if request.method == 'GET':
        settings = SystemSetting.objects.all()
        serializer = SystemSettingSerializer(settings, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    elif request.method == 'POST':
        # Update settings
        for key, value in request.data.items():
            SystemSetting.set_value(key, str(value))
        
        return Response({
            'success': True,
            'message': 'Settings updated successfully'
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_logs(request):
    """
    Get audit logs with filtering and pagination.
    """
    try:
        queryset = AuditLog.objects.all().order_by('-timestamp')
        
        # Apply filters
        table_name = request.GET.get('table_name')
        if table_name:
            queryset = queryset.filter(table_name=table_name)
        
        action = request.GET.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        user_id = request.GET.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        date_from = request.GET.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        
        date_to = request.GET.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Paginate
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AuditLogSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Audit logs error: {e}")
        return Response({
            'error': True,
            'message': 'Failed to load audit logs'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search(request):
    """
    Global search functionality.
    """
    try:
        query = request.GET.get('q', '').strip()
        
        if not query:
            return Response({
                'error': True,
                'message': 'Search query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        results = {}
        
        # Search events
        from apps.events.models import Event
        events = Event.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(venue__icontains=query)
        )[:10]
        
        results['events'] = [{
            'id': str(event.id),
            'title': event.title,
            'type': 'event',
            'url': f'/events/{event.id}'
        } for event in events]
        
        # Search clubs
        from apps.clubs.models import Club
        clubs = Club.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__icontains=query)
        )[:10]
        
        results['clubs'] = [{
            'id': str(club.id),
            'title': club.name,
            'type': 'club',
            'url': f'/clubs/{club.id}'
        } for club in clubs]
        
        # Search users (admin only)
        if request.user.role == 'admin':
            from apps.users.models import User
            users = User.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            )[:10]
            
            results['users'] = [{
                'id': str(user.id),
                'title': f"{user.first_name} {user.last_name}",
                'type': 'user',
                'url': f'/users/{user.id}'
            } for user in users]
        
        return Response({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return Response({
            'error': True,
            'message': 'Search failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    """
    Get user notifications.
    """
    try:
        from apps.notifications.models import Notification
        
        notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        # Mark as read if requested
        if request.GET.get('mark_as_read'):
            notifications.update(is_read=True)
        
        # Get unread count
        unread_count = notifications.filter(is_read=False).count()
        
        # Paginate
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(notifications, request)
        
        if page is not None:
            from .serializers import NotificationSerializer
            serializer = NotificationSerializer(page, many=True)
            response_data = paginator.get_paginated_response(serializer.data)
            response_data.data['unread_count'] = unread_count
            return response_data
        
        from .serializers import NotificationSerializer
        serializer = NotificationSerializer(notifications, many=True)
        
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'unread_count': unread_count
            }
        })
        
    except Exception as e:
        logger.error(f"Notifications error: {e}")
        return Response({
            'error': True,
            'message': 'Failed to load notifications'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    Handle file uploads.
    """
    try:
        from .serializers import FileUploadSerializer
        from .utils import generate_unique_filename
        from django.core.files.storage import default_storage
        
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            
            # Generate unique filename
            filename = generate_unique_filename(file.name)
            
            # Save file
            path = default_storage.save(filename, file)
            file_url = default_storage.url(path)
            
            return Response({
                'success': True,
                'data': {
                    'file_url': file_url,
                    'filename': filename,
                    'size': file.size
                }
            })
        
        return Response({
            'error': True,
            'message': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        return Response({
            'error': True,
            'message': 'File upload failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """
    Health check endpoint.
    """
    try:
        # Check database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Check Redis connection
        from django.core.cache import cache
        cache.set('health_check', 'ok', 10)
        cache_result = cache.get('health_check')
        
        return Response({
            'success': True,
            'data': {
                'status': 'healthy',
                'database': 'connected',
                'cache': 'connected' if cache_result == 'ok' else 'disconnected',
                'timestamp': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return Response({
            'error': True,
            'message': 'System unhealthy'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
