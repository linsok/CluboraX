from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django.db import connection
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from datetime import datetime, time
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
from apps.users.serializers import UserListSerializer
from apps.events.models import Event
from apps.clubs.models import Club
import logging
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
import os

logger = logging.getLogger(__name__)


class AdminLoginView(APIView):
    """
    Admin login endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Login admin user and return JWT token.
        """
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            
            if not email or not password:
                return Response({
                    'error': True,
                    'message': 'Email and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user
            from django.contrib.auth import authenticate
            user = authenticate(request, username=email, password=password)
            
            if not user:
                return Response({
                    'error': True,
                    'message': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user is admin
            if not user.is_staff and user.role != 'admin':
                return Response({
                    'error': True,
                    'message': 'Admin access required'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate JWT token
            from apps.users.authentication import generate_jwt_token
            token = generate_jwt_token(user)
            
            # Log user action
            log_user_action(request, 'admin_login', 'User', user.id)
            
            return Response({
                'success': True,
                'message': 'Admin login successful',
                'data': {
                    'access_token': token,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_staff': user.is_staff
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"Admin login error: {e}")
            return Response({
                'error': True,
                'message': 'Login failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLogoutView(APIView):
    """
    Admin logout endpoint.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        Logout admin user.
        """
        try:
            # Log user action
            log_user_action(request, 'admin_logout', 'User', request.user.id)
            
            return Response({
                'success': True,
                'message': 'Admin logout successful'
            })
            
        except Exception as e:
            logger.error(f"Admin logout error: {e}")
            return Response({
                'error': True,
                'message': 'Logout failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserListView(generics.ListAPIView):
    """
    Admin user list view for user management.
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['date_joined', 'last_login', 'email']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """
        Get all users for admin management.
        """
        return User.objects.all().order_by('-date_joined')


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin user detail view for user management.
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get user by ID for admin management.
        """
        return User.objects.all()
    
    def update(self, request, *args, **kwargs):
        """
        Update user status or other fields.
        """
        try:
            instance = self.get_object()
            
            # Handle is_active field specifically
            if 'is_active' in request.data:
                instance.is_active = request.data['is_active']
                instance.save()
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'User',
                    instance.id,
                    new_values={'is_active': instance.is_active}
                )
                
                serializer = self.get_serializer(instance)
                return Response({
                    'success': True,
                    'message': 'User updated successfully',
                    'data': serializer.data
                })
            
            # For other updates, use the serializer
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            
            if serializer.is_valid():
                user = serializer.save()
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'User',
                    user.id,
                    new_values=serializer.data
                )
                
                return Response({
                    'success': True,
                    'message': 'User updated successfully',
                    'data': serializer.data
                })
            
            return Response({
                'error': True,
                'message': 'User update failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"User update error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to update user'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRequestListView(APIView):
    """
    Admin request list view for request management.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get all requests for admin management including proposals.
        Supports filtering by search, type, status, priority, and role.
        """
        try:
            # Clear any Django ORM caches to get fresh data
            from django.db import connection
            connection.close()  # Close and reopen to flush cache
            connection.ensure_connection()
            
            # Get query parameters
            search = request.GET.get('search', '').lower()
            type_filter = request.GET.get('type', '')
            status_filter = request.GET.get('status', '')
            priority_filter = request.GET.get('priority', '')
            role_filter = request.GET.get('role', '')
            
            # Fetch proposals (the actual submissions)
            from apps.proposals.models import EventProposal, ClubProposal
            from apps.events.models import Event
            from apps.clubs.models import Club
            
            # Start with empty list
            requests = []
            
            # Add Event Proposals (primary source for event submissions)
            # Use select_related and fresh queries to avoid caching
            event_proposals = EventProposal.objects.select_related('submitted_by').all().order_by('-submitted_date')
            
            # Apply role filter
            if role_filter:
                event_proposals = event_proposals.filter(submitted_by__role=role_filter)
            
            # Apply type filter
            if type_filter and type_filter not in ['club', 'club_proposal']:
                if hasattr(EventProposal, 'type'):
                    event_proposals = event_proposals.filter(type=type_filter)
            elif type_filter == 'club_proposal':
                event_proposals = event_proposals.none()  # Skip event proposals if filtering for club
            
            # Apply status filter
            if status_filter:
                event_proposals = event_proposals.filter(status=status_filter)
            
            for proposal in event_proposals:
                # Apply search filter
                if search:
                    search_fields = [
                        proposal.title or '',
                        proposal.eventTitle or '',
                        proposal.description or '',
                        proposal.submitted_by.email if proposal.submitted_by else '',
                        proposal.submitted_by.first_name if proposal.submitted_by else '',
                        proposal.submitted_by.last_name if proposal.submitted_by else '',
                    ]
                    if not any(search in field.lower() for field in search_fields):
                        continue
                
                requests.append({
                    'id': str(proposal.id),
                    'type': 'event_proposal',
                    'title': proposal.title or proposal.eventTitle or 'Untitled Event',
                    'description': proposal.description or '',
                    'status': proposal.status,
                    'submitted_by': proposal.submitted_by.get_full_name() if proposal.submitted_by else proposal.submitted_by.email if proposal.submitted_by else 'Unknown',
                    'submitted_by_role': proposal.submitted_by.role if proposal.submitted_by else 'unknown',
                    'submitted_by_id': str(proposal.submitted_by.id) if proposal.submitted_by else None,
                    'submittedBy': proposal.submitted_by.email if proposal.submitted_by else 'Unknown',
                    'submittedDate': proposal.submitted_date.strftime('%Y-%m-%d'),
                    'submitted_at': proposal.submitted_date.isoformat(),
                    'priority': 'medium',
                    'details': {
                        'date': proposal.eventDate.strftime('%Y-%m-%d') if proposal.eventDate else (
                            proposal.startDate.strftime('%Y-%m-%d') if proposal.startDate else None
                        ),
                        'startDate': proposal.startDate.strftime('%Y-%m-%d') if proposal.startDate else None,
                        'endDate': proposal.endDate.strftime('%Y-%m-%d') if proposal.endDate else None,
                        'duration': proposal.eventDurationDays,
                        'location': f"{proposal.province}, {proposal.specificLocation}" if proposal.province else proposal.venue,
                        'venue': proposal.venue,
                        'expectedAttendees': proposal.capacity or proposal.expected_participants,
                        'budget': str(proposal.budget) if proposal.budget else '0',
                        'organizer': proposal.organizerName,
                        'organizerEmail': proposal.organizerEmail,
                        'organizerPhone': proposal.organizerPhone,
                        'ticketPrice': str(proposal.ticketPrice) if proposal.ticketPrice else '0',
                        'catering': proposal.catering,
                        'sponsor': proposal.sponsor
                    }
                })
            
            # Add Club Proposals
            club_proposals = ClubProposal.objects.select_related('submitted_by').all().order_by('-submitted_date')
            
            # Apply role filter
            if role_filter:
                club_proposals = club_proposals.filter(submitted_by__role=role_filter)
            
            # Apply type filter
            if type_filter and type_filter not in ['event', 'event_proposal']:
                if hasattr(ClubProposal, 'type'):
                    club_proposals = club_proposals.filter(type=type_filter)
            elif type_filter == 'event_proposal':
                club_proposals = club_proposals.none()  # Skip club proposals if filtering for events
            
            # Apply status filter
            if status_filter:
                club_proposals = club_proposals.filter(status=status_filter)
            
            for proposal in club_proposals:
                # Apply search filter
                if search:
                    search_fields = [
                        proposal.name or '',
                        proposal.description or '',
                        proposal.mission or '',
                        proposal.submitted_by.email if proposal.submitted_by else '',
                        proposal.submitted_by.first_name if proposal.submitted_by else '',
                        proposal.submitted_by.last_name if proposal.submitted_by else '',
                    ]
                    if not any(search in field.lower() for field in search_fields):
                        continue
                
                requests.append({
                    'id': str(proposal.id),
                    'type': 'club_proposal',
                    'title': proposal.name,
                    'description': proposal.description or proposal.mission,
                    'status': proposal.status,
                    'submitted_by': proposal.submitted_by.get_full_name() if proposal.submitted_by else proposal.submitted_by.email if proposal.submitted_by else 'Unknown',
                    'submitted_by_role': proposal.submitted_by.role if proposal.submitted_by else 'unknown',
                    'submitted_by_id': str(proposal.submitted_by.id) if proposal.submitted_by else None,
                    'submittedBy': proposal.submitted_by.email if proposal.submitted_by else 'Unknown',
                    'submittedDate': proposal.submitted_date.strftime('%Y-%m-%d'),
                    'submitted_at': proposal.submitted_date.isoformat(),
                    'priority': 'high',
                    'details': {
                        'clubType': proposal.club_type,
                        'mission': proposal.mission,
                        'objectives': proposal.objectives,
                        'activities': proposal.activities,
                        'presidentName': proposal.president_name,
                        'presidentEmail': proposal.president_email,
                        'advisorName': proposal.advisor_name,
                        'expectedMembers': proposal.expected_members,
                        'requirements': proposal.requirements
                    }
                })
            
            # NOTE: We do NOT include published Clubs and Events in the proposals list.
            # They create duplicates and cause issues when trying to fetch proposal details.
            # Only show actual ClubProposal and EventProposal objects - these are the pending submissions.
            
            # Sort by submission date (most recent first)
            requests.sort(key=lambda x: x['submitted_at'], reverse=True)
            
            # Debug logging for club proposals
            club_reqs = [r for r in requests if r['type'] == 'club_proposal']
            if club_reqs:
                logger.info(f"🔵 [LIST] Returning {len(club_reqs)} club proposals")
                for req in club_reqs[:3]:  # Log first 3
                    logger.info(f"🔵 [LIST] Club proposal: id={req['id']} title={req['title']} status={req['status']}")
            
            return Response(requests)
            
        except Exception as e:
            logger.error(f"Admin requests error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({
                'error': True,
                'message': f'Failed to load requests: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRequestDetailView(generics.RetrieveUpdateAPIView):
    """
    Admin request detail view for request management.
    """
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Get request by ID for admin management.
        Needs to return a queryset for the base class to work properly.
        """
        from apps.proposals.models import EventProposal, ClubProposal
        from django.db.models import Q
        # Return a combined queryset of proposals
        # Note: This is used for permission verification, actual lookup happens in get_object()
        return EventProposal.objects.all().union(ClubProposal.objects.all())
    
    def get_object(self):
        """
        Custom get_object to find proposals by ID from either model.
        """
        from apps.proposals.models import EventProposal, ClubProposal
        from rest_framework.exceptions import NotFound
        
        request_id = self.kwargs.get('pk')
        
        # Try EventProposal first
        try:
            return EventProposal.objects.get(id=request_id)
        except EventProposal.DoesNotExist:
            pass
        
        # Try ClubProposal
        try:
            return ClubProposal.objects.get(id=request_id)
        except ClubProposal.DoesNotExist:
            pass
        
        # Not found in either model
        raise NotFound(f"Request with id {request_id} not found")
    
    def update(self, request, *args, **kwargs):
        """
        Update request status for proposals, events, and clubs.
        """
        try:
            request_id = kwargs.get('pk')
            new_status = request.data.get('status')
            
            if not new_status:
                return Response({
                    'error': True,
                    'message': 'Status is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Try to update event proposal first (most common case)
            from apps.proposals.models import EventProposal, ClubProposal
            try:
                logger.info(f"🟢 [EVENT] Attempting to find EventProposal with id={request_id}")
                event_proposal = EventProposal.objects.get(id=request_id)
                logger.info(f"🟢 [EVENT] Found EventProposal: {event_proposal.title} (status: {event_proposal.status})")
                event_proposal.status = new_status
                event_proposal.reviewed_by = request.user
                event_proposal.reviewed_date = timezone.now()
                if request.data.get('comments'):
                    event_proposal.review_comments = request.data.get('comments')
                event_proposal.save()
                
                # Force database flush to ensure commit
                from django.db import connection
                connection.ensure_connection()
                
                logger.info(f"🟢 [EVENT] Successfully saved EventProposal with new status: {new_status}")
                
                # Verify immediately that the update persisted
                refreshed = EventProposal.objects.get(id=request_id)
                logger.info(f"🟢 [EVENT] Verification: Status in DB is now: {refreshed.status}")
                
                # If status is 'published', create an Event from the proposal
                if new_status == 'published':
                    from apps.events.models import Event
                    from datetime import datetime, time
                    
                    # Determine event dates
                    if event_proposal.eventDurationDays > 1 and event_proposal.startDate and event_proposal.endDate:
                        start_date = event_proposal.startDate
                        end_date = event_proposal.endDate
                    elif event_proposal.eventDate:
                        start_date = event_proposal.eventDate
                        end_date = event_proposal.eventDate
                    elif event_proposal.proposed_date:
                        start_date = event_proposal.proposed_date
                        end_date = event_proposal.proposed_date
                    else:
                        # Default to today if no date provided
                        start_date = timezone.now().date()
                        end_date = start_date
                    
                    # Convert dates to datetimes (start at 9 AM, end at 5 PM by default)
                    start_datetime = timezone.make_aware(datetime.combine(start_date, time(9, 0)))
                    end_datetime = timezone.make_aware(datetime.combine(end_date, time(17, 0)))
                    
                    # Get the event title
                    event_title = event_proposal.title or event_proposal.eventTitle or 'Untitled Event'
                    
                    # Check if event already exists with same title and date (to avoid duplicates)
                    existing_event = Event.objects.filter(
                        title__iexact=event_title,
                        start_datetime__date=start_date
                    ).first()
                    
                    if not existing_event:
                        # Create Event from EventProposal
                        Event.objects.create(
                            title=event_title,
                            description=event_proposal.description or '',
                            category='General',
                            event_type='social',  # Default type, can be customized
                            start_datetime=start_datetime,
                            end_datetime=end_datetime,
                            venue=', '.join(filter(None, [
                                event_proposal.venue,
                                event_proposal.specificLocation,
                                event_proposal.province
                            ])) or 'TBD',
                            max_participants=event_proposal.expected_participants or event_proposal.capacity,
                            is_paid=bool(event_proposal.ticketPrice and event_proposal.ticketPrice > 0),
                            price=event_proposal.ticketPrice if event_proposal.ticketPrice else 0,
                            status='published',
                            created_by=event_proposal.submitted_by,
                            requirements=f"Catering: {event_proposal.catering or 'No'}\nSponsor: {event_proposal.sponsor or 'No'}" if event_proposal.catering or event_proposal.sponsor else None,
                        )
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'EventProposal',
                    event_proposal.id,
                    new_values={'status': new_status}
                )
                
                return Response({
                    'success': True,
                    'message': 'Event proposal status updated successfully' + (' and event published' if new_status == 'published' else ''),
                    'data': {'status': new_status}
                })
            except EventProposal.DoesNotExist:
                pass
            
            # Try to update club proposal
            try:
                logger.info(f"🔶 [CLUB] Attempting to find ClubProposal with id={request_id}")
                club_proposal = ClubProposal.objects.get(id=request_id)
                logger.info(f"🔶 [CLUB] Found ClubProposal: {club_proposal.name} (status: {club_proposal.status})")
                
                club_proposal.status = new_status
                club_proposal.reviewed_by = request.user
                club_proposal.reviewed_date = timezone.now()
                if request.data.get('comments'):
                    club_proposal.review_comments = request.data.get('comments')
                club_proposal.save()
                
                # Force database flush to ensure commit
                from django.db import connection
                connection.ensure_connection()
                
                logger.info(f"🔶 [CLUB] Successfully saved ClubProposal with new status: {new_status}")
                
                # Verify immediately that the update persisted
                refreshed = ClubProposal.objects.get(id=request_id)
                logger.info(f"🔶 [CLUB] Verification: Status in DB is now: {refreshed.status}")

                
                # If status is 'published', create a Club from the proposal
                if new_status == 'published':
                    from apps.clubs.models import Club
                    
                    logger.info(f"🔶 [CLUB] Status is 'published', attempting to create Club...")
                    # Check if club already exists for this proposal (to avoid duplicates)
                    existing_club = Club.objects.filter(name__iexact=club_proposal.name).first()
                    if not existing_club:
                        logger.info(f"🔶 [CLUB] Creating new Club from proposal: {club_proposal.name}")
                        # Create Club from ClubProposal
                        Club.objects.create(
                            name=club_proposal.name,
                            description=club_proposal.description or '',
                            category=club_proposal.club_type,
                            mission_statement=club_proposal.mission or '',
                            status='published',
                            advisor_name=club_proposal.advisor_name or '',
                            advisor_email=club_proposal.advisor_email or '',
                            created_by=club_proposal.submitted_by,
                            requirements=club_proposal.requirements or '',
                        )
                        logger.info(f"🔶 [CLUB] Club created successfully")
                    else:
                        logger.info(f"🔶 [CLUB] Club already exists, skipping creation")
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'ClubProposal',
                    club_proposal.id,
                    new_values={'status': new_status}
                )
                
                logger.info(f"🔶 [CLUB] Returning success response for ClubProposal update")
                return Response({
                    'success': True,
                    'message': 'Club proposal status updated successfully' + (' and club published' if new_status == 'published' else ''),
                    'data': {'status': new_status}
                })
            except ClubProposal.DoesNotExist:
                logger.warning(f"🔶 [CLUB] ClubProposal not found with id={request_id}")
                pass
            except Exception as e:
                logger.error(f"🔶 [CLUB] ERROR updating ClubProposal: {type(e).__name__}: {str(e)}")
                import traceback
                logger.error(f"🔶 [CLUB] Traceback: {traceback.format_exc()}")
                pass
            
            # Try to update event (for published events)
            from apps.events.models import Event
            try:
                event = Event.objects.get(id=request_id)
                event.status = new_status
                event.save()
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'Event',
                    event.id,
                    new_values={'status': new_status}
                )
                
                return Response({
                    'success': True,
                    'message': 'Event status updated successfully',
                    'data': {'status': new_status}
                })
            except Event.DoesNotExist:
                pass
            
            # Try to update club (for published clubs)
            from apps.clubs.models import Club
            try:
                club = Club.objects.get(id=request_id)
                club.status = new_status
                club.save()
                
                # Log user action
                log_user_action(
                    request,
                    'update',
                    'Club',
                    club.id,
                    new_values={'status': new_status}
                )
                
                return Response({
                    'success': True,
                    'message': 'Club status updated successfully',
                    'data': {'status': new_status}
                })
            except Club.DoesNotExist:
                pass
            
            return Response({
                'error': True,
                'message': 'Request not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Request update error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return Response({
                'error': True,
                'message': f'Failed to update request: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            if PSUTIL_AVAILABLE:
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
            if PSUTIL_AVAILABLE:
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
