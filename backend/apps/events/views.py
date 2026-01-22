from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, EventRegistration, EventApproval, EventFeedback, EventMedia
from .serializers import (
    EventSerializer, EventCreateSerializer, EventUpdateSerializer,
    EventRegistrationSerializer, EventRegistrationCreateSerializer,
    EventApprovalSerializer, EventFeedbackSerializer, EventMediaSerializer,
    EventListSerializer, EventCheckInSerializer, EventStatsSerializer
)
from apps.core.permissions import (
    IsOwnerOrReadOnly, IsOrganizerOrReadOnly, IsEventOrganizer,
    CanApproveEvents, IsRegisteredForEvent
)
from apps.core.utils import send_notification, log_user_action
import logging

logger = logging.getLogger(__name__)


class EventListCreateView(generics.ListCreateAPIView):
    """
    Event list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'event_type', 'status', 'is_paid', 'club']
    search_fields = ['title', 'description', 'venue', 'category']
    ordering_fields = ['start_datetime', 'created_at', 'title']
    ordering = ['-start_datetime']
    
    def get_queryset(self):
        """
        Get events based on user role and filters.
        """
        user = self.request.user
        queryset = Event.objects.all()
        
        # Filter by status based on user role
        if user.role == 'student':
            # Students can only see approved events
            queryset = queryset.filter(status='approved')
        elif user.role == 'organizer':
            # Organizers can see their own events and approved events
            queryset = queryset.filter(
                Q(created_by=user) | Q(status='approved')
            )
        elif user.role in ['approver', 'admin']:
            # Approvers and admins can see all events
            pass
        
        # Additional filters
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(start_datetime__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(start_datetime__lte=date_to)
        
        my_events = self.request.query_params.get('my_events')
        if my_events == 'true':
            queryset = queryset.filter(created_by=user)
        
        registered = self.request.query_params.get('registered')
        if registered == 'true':
            queryset = queryset.filter(registrations__user=user)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return EventCreateSerializer
        return EventListSerializer
    
    def perform_create(self, serializer):
        """
        Create event with current user.
        """
        serializer.save(created_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request, 
            'create', 
            'Event', 
            serializer.instance.id, 
            new_values=serializer.data
        )


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Event detail view.
    """
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """
        Get events based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return Event.objects.filter(status='approved')
        elif user.role == 'organizer':
            return Event.objects.filter(
                Q(created_by=user) | Q(status='approved')
            )
        else:
            return Event.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return EventUpdateSerializer
        return EventSerializer
    
    def perform_update(self, serializer):
        """
        Update event and log action.
        """
        old_values = Event.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'Event',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )
    
    def perform_destroy(self, instance):
        """
        Delete event and log action.
        """
        event_id = str(instance.id)
        instance.delete()
        
        # Log user action
        log_user_action(
            self.request,
            'delete',
            'Event',
            event_id
        )


class EventRegistrationListCreateView(generics.ListCreateAPIView):
    """
    Event registration list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get registrations based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return EventRegistration.objects.filter(user=user)
        elif user.role == 'organizer':
            return EventRegistration.objects.filter(event__created_by=user)
        else:
            return EventRegistration.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return EventRegistrationCreateSerializer
        return EventRegistrationSerializer
    
    def perform_create(self, serializer):
        """
        Create event registration.
        """
        registration = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'EventRegistration',
            registration.id,
            new_values=serializer.data
        )


class EventRegistrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Event registration detail view.
    """
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsRegisteredForEvent]
    
    def get_queryset(self):
        """
        Get registrations based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return EventRegistration.objects.filter(user=user)
        elif user.role == 'organizer':
            return EventRegistration.objects.filter(event__created_by=user)
        else:
            return EventRegistration.objects.all()


class EventCheckInView(APIView):
    """
    Event check-in view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Check in user for event using QR code.
        """
        try:
            serializer = EventCheckInSerializer(data=request.data)
            if serializer.is_valid():
                registration = serializer.validated_data['qr_code']
                
                # Check in the user
                success, message = registration.check_in(request.user)
                
                if success:
                    # Send notification
                    send_notification(
                        registration.user,
                        'Event Check-in',
                        f'You have been checked in for "{registration.event.title}"',
                        'event_update'
                    )
                    
                    return Response({
                        'success': True,
                        'message': message,
                        'data': {
                            'user': registration.user.full_name,
                            'event': registration.event.title,
                            'checked_in_at': registration.checked_in_at
                        }
                    })
                else:
                    return Response({
                        'error': True,
                        'message': message
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'error': True,
                'message': 'Check-in failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Event check-in error: {e}")
            return Response({
                'error': True,
                'message': 'Check-in failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventApprovalListView(generics.ListAPIView):
    """
    Event approval list view.
    """
    serializer_class = EventApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, CanApproveEvents]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'approver_type']
    
    def get_queryset(self):
        """
        Get pending approvals for current user.
        """
        user = self.request.user
        
        # Get approvals that match user's role
        if user.role == 'admin':
            return EventApproval.objects.all()
        elif user.role == 'approver':
            # Map user role to approver types
            approver_mapping = {
                'student_affairs': ['student_affairs'],
                'dean': ['dean'],
                'finance': ['finance'],
                'venue_manager': ['venue_manager']
            }
            
            # This would need to be implemented based on user's specific approver type
            # For now, return all pending approvals
            return EventApproval.objects.filter(status='pending')
        
        return EventApproval.objects.none()


class EventApprovalActionView(APIView):
    """
    Event approval action view.
    """
    permission_classes = [permissions.IsAuthenticated, CanApproveEvents]
    
    def post(self, request, approval_id):
        """
        Approve or reject event.
        """
        try:
            approval = EventApproval.objects.get(id=approval_id)
            
            action = request.data.get('action')
            comments = request.data.get('comments', '')
            
            if action == 'approve':
                approval.approve(request.user, comments)
                message = 'Event approved successfully'
            elif action == 'reject':
                approval.reject(request.user, comments)
                message = 'Event rejected successfully'
            else:
                return Response({
                    'error': True,
                    'message': 'Invalid action'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Log user action
            log_user_action(
                request,
                action,
                'EventApproval',
                approval.id,
                new_values={'status': approval.status, 'comments': comments}
            )
            
            return Response({
                'success': True,
                'message': message,
                'data': EventApprovalSerializer(approval).data
            })
            
        except EventApproval.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Approval not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Event approval error: {e}")
            return Response({
                'error': True,
                'message': 'Approval action failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventFeedbackListCreateView(generics.ListCreateAPIView):
    """
    Event feedback list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get feedback based on user role.
        """
        user = self.request.user
        event_id = self.request.query_params.get('event_id')
        
        queryset = EventFeedback.objects.all()
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if user.role == 'student':
            # Students can see their own feedback and public feedback for events they attended
            attended_events = EventRegistration.objects.filter(
                user=user, checked_in=True
            ).values_list('event_id', flat=True)
            queryset = queryset.filter(
                Q(user=user) | Q(event_id__in=attended_events)
            )
        elif user.role == 'organizer':
            # Organizers can see feedback for their events
            queryset = queryset.filter(event__created_by=user)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        if self.request.method == 'POST':
            return EventFeedbackSerializer
        return EventFeedbackSerializer
    
    def perform_create(self, serializer):
        """
        Create event feedback.
        """
        feedback = serializer.save(user=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'EventFeedback',
            feedback.id,
            new_values=serializer.data
        )


class EventMediaListCreateView(generics.ListCreateAPIView):
    """
    Event media list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event', 'media_type', 'is_approved']
    
    def get_queryset(self):
        """
        Get media based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            # Students can see approved media
            return EventMedia.objects.filter(is_approved=True)
        elif user.role == 'organizer':
            # Organizers can see media for their events
            return EventMedia.objects.filter(event__created_by=user)
        else:
            # Approvers and admins can see all media
            return EventMedia.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        return EventMediaSerializer
    
    def perform_create(self, serializer):
        """
        Create event media.
        """
        media = serializer.save(uploaded_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'EventMedia',
            media.id,
            new_values=serializer.data
        )


class EventStatsView(APIView):
    """
    Event statistics view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get event statistics.
        """
        try:
            user = request.user
            now = timezone.now()
            
            # Base queryset
            if user.role == 'student':
                events = Event.objects.filter(status='approved')
            elif user.role == 'organizer':
                events = Event.objects.filter(created_by=user)
            else:
                events = Event.objects.all()
            
            # Calculate statistics
            stats = {
                'total_events': events.count(),
                'upcoming_events': events.filter(start_datetime__gt=now).count(),
                'ongoing_events': events.filter(
                    start_datetime__lte=now,
                    end_datetime__gte=now
                ).count(),
                'past_events': events.filter(end_datetime__lt=now).count(),
            }
            
            # Registration statistics
            if user.role == 'student':
                stats['my_registrations'] = EventRegistration.objects.filter(
                    user=user
                ).count()
                stats['total_registrations'] = EventRegistration.objects.filter(
                    event__in=events
                ).count()
            elif user.role == 'organizer':
                stats['total_registrations'] = EventRegistration.objects.filter(
                    event__in=events
                ).count()
            else:
                stats['total_registrations'] = EventRegistration.objects.count()
            
            # Events by category
            events_by_category = events.values('category').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['events_by_category'] = list(events_by_category)
            
            # Events by type
            events_by_type = events.values('event_type').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['events_by_type'] = list(events_by_type)
            
            serializer = EventStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Event stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventCalendarView(APIView):
    """
    Event calendar view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get events for calendar view.
        """
        try:
            user = request.user
            year = request.query_params.get('year')
            month = request.query_params.get('month')
            
            # Base queryset
            if user.role == 'student':
                events = Event.objects.filter(status='approved')
            elif user.role == 'organizer':
                events = Event.objects.filter(
                    Q(created_by=user) | Q(status='approved')
                )
            else:
                events = Event.objects.all()
            
            # Filter by year/month
            if year and month:
                events = events.filter(
                    start_datetime__year=year,
                    start_datetime__month=month
                )
            
            # Format for calendar
            calendar_events = []
            for event in events:
                calendar_events.append({
                    'id': str(event.id),
                    'title': event.title,
                    'start': event.start_datetime.isoformat(),
                    'end': event.end_datetime.isoformat(),
                    'category': event.category,
                    'event_type': event.event_type,
                    'venue': event.venue,
                    'is_paid': event.is_paid,
                    'price': float(event.price) if event.price else 0,
                    'status': event.status,
                    'color': self.get_event_color(event.event_type)
                })
            
            return Response({
                'success': True,
                'data': calendar_events
            })
            
        except Exception as e:
            logger.error(f"Event calendar error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load calendar events'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_event_color(self, event_type):
        """
        Get color for event type.
        """
        colors = {
            'academic': '#3B82F6',
            'social': '#10B981',
            'sports': '#F59E0B',
            'cultural': '#8B5CF6',
            'workshop': '#EF4444',
            'competition': '#06B6D4'
        }
        return colors.get(event_type, '#6B7280')
