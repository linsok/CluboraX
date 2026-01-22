from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    NotificationDeliveryLog, BulkNotification
)
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer,
    NotificationTemplateSerializer, NotificationPreferenceSerializer,
    NotificationDeliveryLogSerializer, BulkNotificationSerializer,
    BulkNotificationCreateSerializer, NotificationStatsSerializer,
    NotificationSearchSerializer
)
from apps.core.permissions import IsOwnerOrAdmin
from apps.core.utils import send_notification, log_user_action
import logging

logger = logging.getLogger(__name__)


class NotificationListCreateView(generics.ListCreateAPIView):
    """
    Notification list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get notifications for current user.
        """
        user = self.request.user
        
        # Base queryset - user's notifications
        queryset = Notification.objects.filter(user=user)
        
        # Filter out expired notifications
        queryset = queryset.exclude(
            expires_at__lt=timezone.now()
        )
        
        # Additional filters
        unread_only = self.request.query_params.get('unread_only')
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)
        
        return queryset
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """
        Create notification.
        """
        # Only admins can create notifications for other users
        user = self.request.user
        if user.role != 'admin':
            serializer.validated_data['user'] = user
        
        notification = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'Notification',
            notification.id,
            new_values=serializer.data
        )


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Notification detail view.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """
        Get notifications for current user (or all for admin).
        """
        user = self.request.user
        
        if user.role == 'admin':
            return Notification.objects.all()
        else:
            return Notification.objects.filter(user=user)
    
    def perform_update(self, serializer):
        """
        Update notification and log action.
        """
        old_values = Notification.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'Notification',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class NotificationMarkReadView(APIView):
    """
    Mark notification as read view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        """
        Mark notification as read.
        """
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            
            notification.mark_as_read()
            
            return Response({
                'success': True,
                'message': 'Notification marked as read',
                'data': {
                    'is_read': notification.is_read,
                    'read_at': notification.read_at
                }
            })
            
        except Notification.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Mark notification read error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to mark notification as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationMarkAllReadView(APIView):
    """
    Mark all notifications as read view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Mark all notifications as read for user.
        """
        try:
            user = request.user
            
            # Get unread notifications
            unread_notifications = Notification.objects.filter(
                user=user,
                is_read=False
            )
            
            # Mark as read
            count = unread_notifications.count()
            unread_notifications.update(
                is_read=True,
                read_at=timezone.now()
            )
            
            return Response({
                'success': True,
                'message': f'Marked {count} notifications as read',
                'data': {
                    'marked_count': count
                }
            })
            
        except Exception as e:
            logger.error(f"Mark all notifications read error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to mark notifications as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationStatsView(APIView):
    """
    Notification statistics view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get notification statistics for user.
        """
        try:
            user = request.user
            
            # Base queryset
            if user.role == 'admin':
                notifications = Notification.objects.all()
            else:
                notifications = Notification.objects.filter(user=user)
            
            # Calculate statistics
            stats = {
                'total_notifications': notifications.count(),
                'unread_notifications': notifications.filter(is_read=False).count(),
                'read_notifications': notifications.filter(is_read=True).count(),
            }
            
            # Notifications by type
            notifications_by_type = notifications.values('type').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['notifications_by_type'] = list(notifications_by_type)
            
            # Notifications by priority
            notifications_by_priority = notifications.values('priority').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['notifications_by_priority'] = list(notifications_by_priority)
            
            # Delivery statistics (admin only)
            if user.role == 'admin':
                delivery_stats = NotificationDeliveryLog.objects.values(
                    'delivery_type', 'status'
                ).annotate(
                    count=Count('id')
                ).order_by('delivery_type', 'status')
                stats['delivery_stats'] = list(delivery_stats)
            else:
                stats['delivery_stats'] = []
            
            serializer = NotificationStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Notification stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationTemplateListCreateView(generics.ListCreateAPIView):
    """
    Notification template list and create view.
    """
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']
    
    def get_queryset(self):
        """
        Get templates based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationTemplate.objects.all()
        else:
            return NotificationTemplate.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        """
        Create notification template.
        """
        template = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'NotificationTemplate',
            template.id,
            new_values=serializer.data
        )


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Notification template detail view.
    """
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get templates based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationTemplate.objects.all()
        else:
            return NotificationTemplate.objects.filter(is_active=True)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Notification preference view.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """
        Get or create user notification preferences.
        """
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def perform_update(self, serializer):
        """
        Update notification preferences.
        """
        old_values = self.get_object().__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'NotificationPreference',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class BulkNotificationListCreateView(generics.ListCreateAPIView):
    """
    Bulk notification list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get bulk notifications based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return BulkNotification.objects.all()
        elif user.role == 'organizer':
            return BulkNotification.objects.filter(created_by=user)
        else:
            return BulkNotification.objects.none()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return BulkNotificationCreateSerializer
        return BulkNotificationSerializer
    
    def perform_create(self, serializer):
        """
        Create bulk notification.
        """
        bulk_notification = serializer.save(created_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'BulkNotification',
            bulk_notification.id,
            new_values=serializer.data
        )


class BulkNotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Bulk notification detail view.
    """
    serializer_class = BulkNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get bulk notifications based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return BulkNotification.objects.all()
        elif user.role == 'organizer':
            return BulkNotification.objects.filter(created_by=user)
        else:
            return BulkNotification.objects.none()


class BulkNotificationSendView(APIView):
    """
    Send bulk notification view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        """
        Send bulk notification.
        """
        try:
            bulk_notification = BulkNotification.objects.get(id=notification_id)
            
            # Check permissions
            user = request.user
            if not (
                user.role == 'admin' or
                bulk_notification.created_by == user
            ):
                return Response({
                    'error': True,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if already sent
            if bulk_notification.status in ['completed', 'sending']:
                return Response({
                    'error': True,
                    'message': 'Notification already sent'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get target users
            target_users = bulk_notification.get_target_users()
            
            # Create individual notifications
            notifications_created = 0
            for target_user in target_users:
                # Check user preferences
                try:
                    preferences = target_user.notification_preferences
                    if not preferences.should_send_notification(bulk_notification.type):
                        continue
                except NotificationPreference.DoesNotExist:
                    # Create default preferences if not exist
                    preferences = NotificationPreference.objects.create(user=target_user)
                
                notification = Notification.objects.create(
                    user=target_user,
                    title=bulk_notification.title,
                    message=bulk_notification.message,
                    type=bulk_notification.type,
                    priority=bulk_notification.priority,
                    action_url=bulk_notification.metadata.get('action_url'),
                    action_text=bulk_notification.metadata.get('action_text'),
                    metadata=bulk_notification.metadata
                )
                notifications_created += 1
            
            # Update bulk notification status
            bulk_notification.status = 'completed'
            bulk_notification.sent_at = timezone.now()
            bulk_notification.total_sent = notifications_created
            bulk_notification.save()
            
            # Log user action
            log_user_action(
                request,
                'send',
                'BulkNotification',
                bulk_notification.id,
                new_values={
                    'status': 'completed',
                    'total_sent': notifications_created
                }
            )
            
            return Response({
                'success': True,
                'message': f'Bulk notification sent to {notifications_created} users',
                'data': {
                    'total_sent': notifications_created,
                    'sent_at': bulk_notification.sent_at
                }
            })
            
        except BulkNotification.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Bulk notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Bulk notification send error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to send bulk notification'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationDeliveryLogListView(generics.ListAPIView):
    """
    Notification delivery log list view.
    """
    serializer_class = NotificationDeliveryLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['delivery_type', 'status']
    
    def get_queryset(self):
        """
        Get delivery logs based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationDeliveryLog.objects.all()
        else:
            # Users can see delivery logs for their own notifications
            return NotificationDeliveryLog.objects.filter(
                notification__user=user
            )
