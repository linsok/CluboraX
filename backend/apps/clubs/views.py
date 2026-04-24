from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Club, ClubMembership, ClubApproval, ClubActivity, 
    ClubAnnouncement, ClubResource, ClubFeedback
)
from .serializers import (
    ClubSerializer, ClubCreateSerializer, ClubUpdateSerializer,
    ClubMembershipSerializer, ClubMembershipCreateSerializer,
    ClubApprovalSerializer, ClubActivitySerializer, ClubAnnouncementSerializer,
    ClubResourceSerializer, ClubFeedbackSerializer, ClubListSerializer,
    ClubMembershipActionSerializer, ClubStatsSerializer
)
from apps.core.permissions import (
    IsOwnerOrReadOnly, IsOrganizerOrReadOnly, IsClubMember,
    CanApproveClubs
)
from apps.core.utils import send_notification, log_user_action
import logging

logger = logging.getLogger(__name__)


class ClubListCreateView(generics.ListCreateAPIView):
    """
    Club list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['name', 'description', 'category', 'mission_statement']
    ordering_fields = ['name', 'created_at', 'member_count']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Get clubs based on user role and filters.
        Only show clubs that are not 'inactive' or 'finished'.
        """
        user = self.request.user
        queryset = Club.objects.exclude(status__in=['inactive', 'finished'])

        # Filter by status based on user role
        if user.is_staff or user.is_superuser or (hasattr(user, 'role') and user.role in ['approver', 'admin']):
            pass
        elif hasattr(user, 'role') and user.role == 'organizer':
            queryset = queryset.filter(
                Q(created_by=user) | Q(status__in=['approved', 'active', 'published'])
            )
        elif hasattr(user, 'role') and user.role == 'student':
            queryset = queryset.filter(status__in=['approved', 'active', 'published'])
        else:
            queryset = queryset.filter(status__in=['approved', 'active', 'published'])

        # Additional filters
        my_clubs = self.request.query_params.get('my_clubs')
        if my_clubs == 'true':
            queryset = queryset.filter(created_by=user)

        member_of = self.request.query_params.get('member_of')
        if member_of == 'true':
            queryset = queryset.filter(memberships__user=user, memberships__status='approved')

        can_join = self.request.query_params.get('can_join')
        if can_join == 'true':
            queryset = queryset.filter(status__in=['approved', 'active', 'published'])

        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return ClubCreateSerializer
        return ClubListSerializer
    
    def perform_create(self, serializer):
        """
        Create club with current user and auto-assign as leader.
        """
        club = serializer.save(created_by=self.request.user)
        
        # Automatically create leader membership for the club creator
        ClubMembership.objects.get_or_create(
            club=club,
            user=self.request.user,
            defaults={'role': 'leader', 'status': 'approved'}
        )
        
        # Log user action
        log_user_action(
            self.request, 
            'create', 
            'Club', 
            club.id, 
            new_values=serializer.data
        )


class ClubDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Club detail view.
    """
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """
        Get clubs based on user role.
        """
        user = self.request.user
        
        # Check if user is admin/staff first (includes admin panel access)
        if user.is_staff or user.is_superuser or (hasattr(user, 'role') and user.role in ['approver', 'admin']):
            return Club.objects.all()
        elif hasattr(user, 'role') and user.role == 'organizer':
            return Club.objects.filter(
                Q(created_by=user) | Q(status__in=['approved', 'active', 'published'])
            )
        elif hasattr(user, 'role') and user.role == 'student':
            return Club.objects.filter(status__in=['approved', 'active', 'published'])
        else:
            return Club.objects.filter(status__in=['approved', 'active', 'published'])
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return ClubUpdateSerializer
        return ClubSerializer
    
    def perform_update(self, serializer):
        """
        Update club and log action.
        """
        old_values = Club.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'Club',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )
    
    def perform_destroy(self, instance):
        """
        Delete club and log action.
        """
        club_id = str(instance.id)
        instance.delete()
        
        # Log user action
        log_user_action(
            self.request,
            'delete',
            'Club',
            club_id
        )


class ClubMembershipListCreateView(generics.ListCreateAPIView):
    """
    Club membership list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get memberships based on user role and permissions.
        Allow access to:
        - Own memberships (all users)
        - All memberships in clubs they created (organizers)
        - All memberships in clubs where they are leaders (students with leader role)
        - Everything (admins)
        """
        user = self.request.user
        
        if user.role in ['admin', 'approver']:
            return ClubMembership.objects.all()
        
        # Get clubs where user is creator or leader
        from django.db.models import Q
        created_clubs = Club.objects.filter(created_by=user)
        leader_clubs = Club.objects.filter(
            memberships__user=user,
            memberships__role='leader',
            memberships__status='approved'
        )
        
        # Return memberships for: own membership + clubs they manage
        return ClubMembership.objects.filter(
            Q(user=user) |  # Own memberships
            Q(club__in=created_clubs) |  # Clubs they created
            Q(club__in=leader_clubs)  # Clubs where they are leaders
        ).distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return ClubMembershipCreateSerializer
        return ClubMembershipSerializer
    
    def perform_create(self, serializer):
        """
        Create club membership.
        """
        membership = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'ClubMembership',
            membership.id,
            new_values=serializer.data
        )


class ClubMembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Club membership detail view.
    """
    serializer_class = ClubMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get memberships based on user role and permissions.
        Allow access to:
        - Own memberships (all users)
        - All memberships in clubs they created (organizers)
        - All memberships in clubs where they are leaders (students with leader role)
        - Everything (admins)
        """
        user = self.request.user
        
        if user.role in ['admin', 'approver']:
            return ClubMembership.objects.all()
        
        # Get clubs where user is creator or leader
        from django.db.models import Q
        created_clubs = Club.objects.filter(created_by=user)
        leader_clubs = Club.objects.filter(
            memberships__user=user,
            memberships__role='leader',
            memberships__status='approved'
        )
        
        # Return memberships for: own membership + clubs they manage
        return ClubMembership.objects.filter(
            Q(user=user) |  # Own memberships
            Q(club__in=created_clubs) |  # Clubs they created
            Q(club__in=leader_clubs)  # Clubs where they are leaders
        ).distinct()
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete membership - allow club creators, leaders, or the member themselves.
        """
        membership = self.get_object()
        user = request.user
        
        # Allow if: admin, club creator, club leader, or the member themselves
        is_admin = user.role in ['admin', 'approver']
        is_club_creator = str(membership.club.created_by.id) == str(user.id)
        is_club_leader = membership.club.is_leader(user)
        is_self = str(membership.user.id) == str(user.id)
        
        if not (is_admin or is_club_creator or is_club_leader or is_self):
            return Response({
                'error': True,
                'message': 'Permission denied. Only club creators, leaders, or the member can remove membership.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Update membership - allow club creators and leaders to manage any membership.
        """
        membership = self.get_object()
        user = request.user
        
        # Allow if: admin, club creator, club leader, or the member themselves
        is_admin = user.role in ['admin', 'approver']
        is_club_creator = str(membership.club.created_by.id) == str(user.id)
        is_club_leader = membership.club.is_leader(user)
        is_self = str(membership.user.id) == str(user.id)
        
        if not (is_admin or is_club_creator or is_club_leader or is_self):
            return Response({
                'error': True,
                'message': 'Permission denied.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)


class ClubMembershipActionView(APIView):
    """
    Club membership action view (approve/reject).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, membership_id):
        """
        Approve or reject club membership.
        """
        try:
            membership = ClubMembership.objects.get(id=membership_id)
            
            # Check permissions - allow admin, approver, club creator, or club leaders
            user = request.user
            is_club_creator = str(membership.club.created_by.id) == str(user.id)
            is_club_leader = membership.club.is_leader(user)
            is_admin_or_approver = user.role in ['admin', 'approver']
            
            logger.info(f"Member action permission check: user={user.email}, user_id={user.id}, role={user.role}, "
                       f"club_creator_id={membership.club.created_by.id}, is_creator={is_club_creator}, "
                       f"is_leader={is_club_leader}, is_admin={is_admin_or_approver}, club={membership.club.name}")
            
            if not (is_admin_or_approver or is_club_creator or is_club_leader):
                return Response({
                    'error': True,
                    'message': f'Permission denied. Only club creators, leaders, or admins can manage members. (is_admin={is_admin_or_approver}, is_creator={is_club_creator}, is_leader={is_club_leader})'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = ClubMembershipActionSerializer(data=request.data)
            if serializer.is_valid():
                action = serializer.validated_data['action']
                reason = serializer.validated_data.get('reason', '')
                
                if action == 'approve':
                    membership.approve(request.user)
                    message = 'Membership approved successfully'
                elif action == 'reject':
                    membership.reject(request.user, reason)
                    message = 'Membership rejected successfully'
                else:
                    return Response({
                        'error': True,
                        'message': 'Invalid action'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Log user action
                log_user_action(
                    request,
                    action,
                    'ClubMembership',
                    membership.id,
                    new_values={'status': membership.status, 'reason': reason}
                )
                
                return Response({
                    'success': True,
                    'message': message,
                    'data': ClubMembershipSerializer(membership).data
                })
            
            return Response({
                'error': True,
                'message': 'Action failed',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except ClubMembership.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Membership not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Club membership action error: {e}")
            return Response({
                'error': True,
                'message': 'Action failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClubApprovalListView(generics.ListAPIView):
    """
    Club approval list view.
    """
    serializer_class = ClubApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, CanApproveClubs]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'approver_type']
    
    def get_queryset(self):
        """
        Get pending approvals for current user.
        """
        user = self.request.user
        
        # Get approvals that match user's role
        if user.role == 'admin':
            return ClubApproval.objects.all()
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
            return ClubApproval.objects.filter(status='pending')
        
        return ClubApproval.objects.none()


class ClubApprovalActionView(APIView):
    """
    Club approval action view.
    """
    permission_classes = [permissions.IsAuthenticated, CanApproveClubs]
    
    def post(self, request, approval_id):
        """
        Approve or reject club.
        """
        try:
            approval = ClubApproval.objects.get(id=approval_id)
            
            action = request.data.get('action')
            comments = request.data.get('comments', '')
            
            if action == 'approve':
                approval.approve(request.user, comments)
                message = 'Club approved successfully'
            elif action == 'reject':
                approval.reject(request.user, comments)
                message = 'Club rejected successfully'
            else:
                return Response({
                    'error': True,
                    'message': 'Invalid action'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Log user action
            log_user_action(
                request,
                action,
                'ClubApproval',
                approval.id,
                new_values={'status': approval.status, 'comments': comments}
            )
            
            return Response({
                'success': True,
                'message': message,
                'data': ClubApprovalSerializer(approval).data
            })
            
        except ClubApproval.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Approval not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Club approval error: {e}")
            return Response({
                'error': True,
                'message': 'Approval action failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClubActivityListCreateView(generics.ListCreateAPIView):
    """
    Club activity list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['club', 'activity_type', 'is_public']
    
    def get_queryset(self):
        """
        Get activities based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            # Students can see public activities and activities for clubs they're members of
            user_clubs = ClubMembership.objects.filter(
                user=user, 
                status='approved'
            ).values_list('club_id', flat=True)
            return ClubActivity.objects.filter(
                Q(is_public=True) | Q(club_id__in=user_clubs)
            )
        elif user.role == 'organizer':
            # Organizers can see activities for their clubs
            return ClubActivity.objects.filter(club__created_by=user)
        else:
            return ClubActivity.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        return ClubActivitySerializer
    
    def perform_create(self, serializer):
        """
        Create club activity.
        """
        activity = serializer.save(created_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'ClubActivity',
            activity.id,
            new_values=serializer.data
        )


class ClubAnnouncementListCreateView(generics.ListCreateAPIView):
    """
    Club announcement list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['club', 'priority', 'is_active']
    
    def get_queryset(self):
        """
        Get announcements based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            # Students can see announcements for clubs they're members of
            user_clubs = ClubMembership.objects.filter(
                user=user, 
                status='approved'
            ).values_list('club_id', flat=True)
            return ClubAnnouncement.objects.filter(
                club_id__in=user_clubs,
                is_active=True
            )
        elif user.role == 'organizer':
            # Organizers can see announcements for their clubs
            return ClubAnnouncement.objects.filter(club__created_by=user)
        else:
            return ClubAnnouncement.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        return ClubAnnouncementSerializer
    
    def perform_create(self, serializer):
        """
        Create club announcement.
        """
        announcement = serializer.save(created_by=self.request.user)
        
        # Send notifications to club members
        club = announcement.club
        members = club.memberships.filter(status='approved')
        
        for member in members:
            send_notification(
                member.user,
                f'Club Announcement: {announcement.title}',
                announcement.content,
                'club_update'
            )
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'ClubAnnouncement',
            announcement.id,
            new_values=serializer.data
        )


class ClubResourceListCreateView(generics.ListCreateAPIView):
    """
    Club resource list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['club', 'resource_type', 'is_public']
    
    def get_queryset(self):
        """
        Get resources based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            # Students can see public resources and resources for clubs they're members of
            user_clubs = ClubMembership.objects.filter(
                user=user, 
                status='approved'
            ).values_list('club_id', flat=True)
            return ClubResource.objects.filter(
                Q(is_public=True) | Q(club_id__in=user_clubs)
            )
        elif user.role == 'organizer':
            # Organizers can see resources for their clubs
            return ClubResource.objects.filter(club__created_by=user)
        else:
            return ClubResource.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        return ClubResourceSerializer
    
    def perform_create(self, serializer):
        """
        Create club resource.
        """
        resource = serializer.save(uploaded_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'ClubResource',
            resource.id,
            new_values=serializer.data
        )


class ClubFeedbackListCreateView(generics.ListCreateAPIView):
    """
    Club feedback list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get feedback based on user role.
        """
        user = self.request.user
        club_id = self.request.query_params.get('club_id')
        
        queryset = ClubFeedback.objects.all()
        
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        
        if user.role == 'student':
            # Students can see their own feedback and public feedback for clubs they're members of
            attended_clubs = ClubMembership.objects.filter(
                user=user, status='approved'
            ).values_list('club_id', flat=True)
            queryset = queryset.filter(
                Q(user=user) | Q(club_id__in=attended_clubs)
            )
        elif user.role == 'organizer':
            # Organizers can see feedback for their clubs
            queryset = queryset.filter(club__created_by=user)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer.
        """
        return ClubFeedbackSerializer
    
    def perform_create(self, serializer):
        """
        Create club feedback.
        """
        feedback = serializer.save(user=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'ClubFeedback',
            feedback.id,
            new_values=serializer.data
        )


class ClubStatsView(APIView):
    """
    Club statistics view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get club statistics.
        """
        try:
            user = request.user
            
            # Safely get user role
            user_role = getattr(user, 'role', 'student')
            
            # Base queryset
            if user_role == 'student':
                clubs = Club.objects.filter(status='approved')
            elif user_role == 'organizer':
                clubs = Club.objects.filter(created_by=user)
            else:
                clubs = Club.objects.all()
            
            # Calculate statistics
            stats = {
                'total_clubs': clubs.count(),
                'active_clubs': clubs.filter(status='approved').count(),
                'pending_clubs': clubs.filter(status='pending').count(),
            }
            
            # Membership statistics
            if user_role == 'student':
                stats['my_memberships'] = ClubMembership.objects.filter(
                    user=user
                ).count()
                stats['total_memberships'] = ClubMembership.objects.filter(
                    club__in=clubs
                ).count()
            elif user_role == 'organizer':
                stats['my_memberships'] = 0  # Organizers don't have memberships
                stats['total_memberships'] = ClubMembership.objects.filter(
                    club__in=clubs
                ).count()
            else:
                stats['my_memberships'] = 0  # Admins don't have memberships
                stats['total_memberships'] = ClubMembership.objects.count()
            
            # Clubs by category
            clubs_by_category = clubs.values('category').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['clubs_by_category'] = list(clubs_by_category)
            
            # Membership growth (last 6 months)
            from datetime import timedelta
            six_months_ago = timezone.now() - timedelta(days=180)
            membership_growth = ClubMembership.objects.filter(
                created_at__gte=six_months_ago
            ).extra(
                select={'month': 'DATE_FORMAT(created_at, "%%Y-%%m")'}
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            stats['membership_growth'] = list(membership_growth)
            
            serializer = ClubStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Club stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
