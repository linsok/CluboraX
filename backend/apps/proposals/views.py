from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import EventProposal, ClubProposal
from .serializers import EventProposalSerializer, ClubProposalSerializer


class EventProposalViewSet(viewsets.ModelViewSet):
    queryset = EventProposal.objects.all()
    serializer_class = EventProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter proposals based on user role"""
        user = self.request.user
        if hasattr(user, 'is_staff') and user.is_staff:
            # Admins can see all proposals
            return EventProposal.objects.all()
        # Regular users see only their own proposals
        return EventProposal.objects.filter(submitted_by=user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a proposal (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can approve proposals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = self.get_object()
        proposal.status = 'approved'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        return Response({'message': 'Proposal approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a proposal (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can reject proposals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = self.get_object()
        proposal.status = 'rejected'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        return Response({'message': 'Proposal rejected'})


class ClubProposalViewSet(viewsets.ModelViewSet):
    queryset = ClubProposal.objects.all()
    serializer_class = ClubProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter proposals based on user role"""
        user = self.request.user
        if hasattr(user, 'is_staff') and user.is_staff:
            # Admins can see all proposals
            return ClubProposal.objects.all()
        # Regular users see only their own proposals
        return ClubProposal.objects.filter(submitted_by=user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a proposal (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can approve proposals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = self.get_object()
        proposal.status = 'approved'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        return Response({'message': 'Proposal approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a proposal (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admins can reject proposals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = self.get_object()
        proposal.status = 'rejected'
        proposal.reviewed_by = request.user
        proposal.reviewed_date = timezone.now()
        proposal.review_comments = request.data.get('comments', '')
        proposal.save()
        
        return Response({'message': 'Proposal rejected'})
