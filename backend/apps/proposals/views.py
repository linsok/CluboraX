from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from .models import EventProposal, ClubProposal
from .serializers import EventProposalSerializer, ClubProposalSerializer
from apps.clubs.models import Club, ClubMembership
from apps.core.utils import send_notification
import logging

logger = logging.getLogger(__name__)


class EventProposalViewSet(viewsets.ModelViewSet):
    queryset = EventProposal.objects.all()
    serializer_class = EventProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        # Check if user is admin or super_admin via role field
        if hasattr(user, 'role') and user.role in ['admin', 'super_admin']:
            return EventProposal.objects.all()
        # Fallback to is_staff check for compatibility
        if hasattr(user, 'is_staff') and user.is_staff:
            return EventProposal.objects.all()
        return EventProposal.objects.filter(submitted_by=user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can approve proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'approved'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        send_notification(
            proposal.submitted_by,
            'Event Proposal Approved ✅',
            f'Your event proposal "{proposal.title or proposal.eventTitle}" has been approved!',
            'approval',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Event proposal approved to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can reject proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'rejected'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        comments = request.data.get('comments', '')
        send_notification(
            proposal.submitted_by,
            'Event Proposal Rejected ❌',
            f'Your event proposal "{proposal.title or proposal.eventTitle}" has been rejected.' + (f'\nFeedback: {comments}' if comments else ''),
            'approval',
            priority='high'
        )
        
        logger.info(f"Notification sent: Event proposal rejected to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal rejected'})

    @action(detail=True, methods=['post'])
    def return_for_revision(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can return proposals for revision'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'returned_for_revision'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        comments = request.data.get('comments', '')
        send_notification(
            proposal.submitted_by,
            'Event Proposal Needs Revision 📝',
            f'Your event proposal "{proposal.title or proposal.eventTitle}" needs revision.' + (f'\nFeedback: {comments}' if comments else ''),
            'reminder',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Event proposal returned for revision to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal returned for revision'})

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an approved proposal to make it publicly visible."""
        if not request.user.is_staff:
            return Response({'error': 'Only admins can publish proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        if proposal.status != 'approved':
            return Response({'error': 'Only approved proposals can be published'}, status=status.HTTP_400_BAD_REQUEST)
        proposal.status = 'published'
        proposal.save()
        
        # Send notification to proposal submitter
        send_notification(
            proposal.submitted_by,
            'Event Proposal Published 🎉',
            f'Your event "{proposal.title or proposal.eventTitle}" has been published and is now live!',
            'approval',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Event proposal published to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal published successfully'})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def resubmit(self, request, pk=None):
        """Allow a student to revise and resubmit a rejected or returned event proposal."""
        proposal = self.get_object()

        if proposal.submitted_by != request.user:
            return Response({'error': 'You can only resubmit your own proposals'}, status=status.HTTP_403_FORBIDDEN)

        if proposal.status not in ['rejected', 'returned_for_revision']:
            return Response({'error': 'Only rejected proposals can be resubmitted'}, status=status.HTTP_400_BAD_REQUEST)

        # Update editable fields from request data
        updatable_fields = [
            'title', 'eventTitle', 'description', 'proposed_date',
            'organizerName', 'organizerEmail', 'organizerPhone',
            'venue', 'specificLocation', 'province',
            'capacity', 'expected_participants',
            'eventDate', 'startDate', 'endDate', 'eventDurationDays',
            'ticketPrice', 'catering', 'sponsor',
            'total_budget', 'budget', 'budget_items',
            'payment_method', 'requirements',
        ]
        for field in updatable_fields:
            if field in request.data:
                setattr(proposal, field, request.data[field])

        # Handle file attachments (multiple files supported)
        if 'attachments' in request.FILES:
            # For now, take the first file as the main attachment
            # TODO: Implement proper multiple file storage if needed
            files = request.FILES.getlist('attachments')
            if files:
                proposal.attachment = files[0]
        elif 'attachment' in request.FILES:
            # Fallback for single file upload
            proposal.attachment = request.FILES['attachment']

        # Store student's revision notes
        if 'revision_notes' in request.data:
            proposal.revision_notes = request.data['revision_notes']

        # Set status to 'returned_for_revision' so admin can review the revised proposal
        proposal.status = 'returned_for_revision'
        proposal.reviewed_by = None
        proposal.reviewed_date = None
        proposal.review_comments = None
        proposal.resubmission_count = (proposal.resubmission_count or 0) + 1
        proposal.save()

        serializer = self.get_serializer(proposal)
        return Response({'message': 'Proposal revised and resubmitted for admin review', 'proposal': serializer.data})


class ClubProposalViewSet(viewsets.ModelViewSet):
    queryset = ClubProposal.objects.all()
    serializer_class = ClubProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        # Check if user is admin or super_admin via role field
        if hasattr(user, 'role') and user.role in ['admin', 'super_admin']:
            return ClubProposal.objects.all()
        # Fallback to is_staff check for compatibility
        if hasattr(user, 'is_staff') and user.is_staff:
            return ClubProposal.objects.all()
        return ClubProposal.objects.filter(submitted_by=user)
    
    def perform_update(self, serializer):
        """When a proposal is published, auto-create the actual Club object."""
        instance = serializer.save()
        if instance.status == 'published':
            # Use objectives as primary description (more meaningful than raw form description).
            # get_club_type_display() converts 'sports' → 'Sports', 'arts' → 'Arts & Culture', etc.
            description = instance.objectives or instance.mission or instance.description or ''
            club, created = Club.objects.get_or_create(
                name=instance.name,
                defaults={
                    'description': description,
                    'category': instance.get_club_type_display(),
                    'mission_statement': instance.mission or instance.objectives or '',
                    'status': 'published',
                    'advisor_name': instance.advisor_name or '',
                    'advisor_email': instance.advisor_email or None,
                    'requirements': instance.requirements or '',
                    'created_by': instance.submitted_by,
                }
            )
            
            # Always ensure club status is set to published (in case it existed with a different status)
            if club.status != 'published':
                club.status = 'published'
                club.save()
            
            if created:
                ClubMembership.objects.get_or_create(
                    club=club,
                    user=instance.submitted_by,
                    defaults={'role': 'leader', 'status': 'approved'}
                )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can approve proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'approved'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        send_notification(
            proposal.submitted_by,
            'Club Proposal Approved ✅',
            f'Your club proposal "{proposal.name}" has been approved!',
            'approval',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Club proposal approved to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can reject proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'rejected'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        comments = request.data.get('comments', '')
        send_notification(
            proposal.submitted_by,
            'Club Proposal Rejected ❌',
            f'Your club proposal "{proposal.name}" has been rejected.' + (f'\nFeedback: {comments}' if comments else ''),
            'approval',
            priority='high'
        )
        
        logger.info(f"Notification sent: Club proposal rejected to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal rejected'})

    @action(detail=True, methods=['post'])
    def return_for_revision(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can return proposals for revision'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        proposal.status = 'returned_for_revision'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        # Send notification to proposal submitter
        comments = request.data.get('comments', '')
        send_notification(
            proposal.submitted_by,
            'Club Proposal Needs Revision 📝',
            f'Your club proposal "{proposal.name}" needs revision.' + (f'\nFeedback: {comments}' if comments else ''),
            'reminder',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Club proposal returned for revision to {proposal.submitted_by.email}")
        
        return Response({'message': 'Proposal returned for revision'})

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish an approved club proposal and create the actual Club object."""
        if not request.user.is_staff:
            return Response({'error': 'Only admins can publish proposals'}, status=status.HTTP_403_FORBIDDEN)
        proposal = self.get_object()
        if proposal.status != 'approved':
            return Response({'error': 'Only approved proposals can be published'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set status to published
        proposal.status = 'published'
        proposal.save()
        
        # Send notification to proposal submitter
        send_notification(
            proposal.submitted_by,
            'Club Proposal Published 🎉',
            f'Your club "{proposal.name}" has been published and is now live!',
            'approval',
            priority='medium'
        )
        
        logger.info(f"Notification sent: Club proposal published to {proposal.submitted_by.email}")
        
        # Create the actual Club object
        description = proposal.objectives or proposal.mission or proposal.description or ''
        club, created = Club.objects.get_or_create(
            name=proposal.name,
            defaults={
                'description': description,
                'category': proposal.get_club_type_display(),
                'mission_statement': proposal.mission or proposal.objectives or '',
                'status': 'published',
                'advisor_name': proposal.advisor_name or '',
                'advisor_email': proposal.advisor_email or None,
                'requirements': proposal.requirements or '',
                'created_by': proposal.submitted_by,
            }
        )
        
        # Always ensure club status is set to published (in case it existed with a different status)
        if club.status != 'published':
            club.status = 'published'
        
        # Always update/set logo from proposal if it exists
        logger.info(f"Publishing club: {proposal.name}")
        logger.info(f"Proposal has logo: {bool(proposal.club_logo)}")
        if proposal.club_logo:
            logger.info(f"Logo file path: {proposal.club_logo.name}")
            club.logo = proposal.club_logo
            logger.info(f"Club logo set to: {club.logo.name if club.logo else 'None'}")
        
        # Save club with any updates (status or logo)
        club.save()
        logger.info(f"Club saved. Logo after save: {club.logo.name if club.logo else 'None'}")
        
        if created:
            ClubMembership.objects.get_or_create(
                club=club,
                user=proposal.submitted_by,
                defaults={'role': 'leader', 'status': 'approved'}
            )
        
        return Response({'message': 'Proposal published successfully', 'club_created': created})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def resubmit(self, request, pk=None):
        """Allow a student to revise and resubmit a rejected or returned club proposal."""
        proposal = self.get_object()

        if proposal.submitted_by != request.user:
            return Response({'error': 'You can only resubmit your own proposals'}, status=status.HTTP_403_FORBIDDEN)

        if proposal.status not in ['rejected', 'returned_for_revision']:
            return Response({'error': 'Only rejected proposals can be resubmitted'}, status=status.HTTP_400_BAD_REQUEST)

        # Update editable fields from request data
        updatable_fields = [
            'name', 'club_type', 'description', 'mission', 'objectives', 'activities',
            'president_name', 'president_email', 'president_phone', 'president_gender',
            'advisor_name', 'advisor_email', 'advisor_phone',
            'expected_members', 'requirements',
            'start_date', 'end_date',
        ]
        for field in updatable_fields:
            if field in request.data:
                setattr(proposal, field, request.data[field])

        # Handle file attachments (multiple files supported)
        if 'attachments' in request.FILES:
            # For now, take the first file as the main attachment
            # TODO: Implement proper multiple file storage if needed
            files = request.FILES.getlist('attachments')
            if files:
                proposal.attachment = files[0]
        elif 'attachment' in request.FILES:
            # Fallback for single file upload
            proposal.attachment = request.FILES['attachment']

        # Store student's revision notes
        if 'revision_notes' in request.data:
            proposal.revision_notes = request.data['revision_notes']

        # Set status to 'returned_for_revision' so admin can review the revised proposal
        proposal.status = 'returned_for_revision'
        proposal.reviewed_by = None
        proposal.reviewed_date = None
        proposal.review_comments = None
        proposal.resubmission_count = (proposal.resubmission_count or 0) + 1
        proposal.save()

        serializer = self.get_serializer(proposal)
        return Response({'message': 'Proposal revised and resubmitted for admin review', 'proposal': serializer.data})