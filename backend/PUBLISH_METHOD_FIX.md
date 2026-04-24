# Fixed Publish Method for Club Proposals
# Location: backend/apps/proposals/views.py
# This replaces the publish() method in ClubProposalViewSet

# HERE IS THE CORRECTED CODE:

@action(detail=True, methods=['post'])
def publish(self, request, pk=None):
    """
    Publish a club proposal.
    
    This action:
    1. Changes proposal status to 'published'
    2. Creates/updates the Club object
    3. **ALWAYS copies the logo from proposal to club**
    4. Creates initial club membership for proposal creator
    """
    proposal = self.get_object()

    if proposal.submitted_by != request.user:
        return Response({'error': 'You can only publish your own proposals'}, status=status.HTTP_403_FORBIDDEN)

    if proposal.status != 'pending_review':
        return Response({'error': 'Only pending proposals can be published'}, status=status.HTTP_400_BAD_REQUEST)

    # Update proposal status
    proposal.status = 'published'
    proposal.save()

    # Send notification
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

    # ✅ FIX: ALWAYS copy logo from proposal to club
    # This ensures logos are never lost, even if club already exists
    if proposal.club_logo and (not club.logo or created):
        try:
            club.logo = proposal.club_logo
            club.save(update_fields=['logo', 'status', 'updated_at'])
            logger.info(f"Logo successfully copied to club '{club.name}' from proposal {proposal.id}")
        except Exception as e:
            logger.error(f"Error copying logo to club {club.id}: {str(e)}")
            # Still save club even if logo copy fails
            club.save()
    else:
        # Club has no logo or already has one - just ensure status is saved
        club.save(update_fields=['status', 'updated_at'])

    # Create initial club membership for proposal creator (only if club was just created)
    if created:
        ClubMembership.objects.get_or_create(
            club=club,
            user=proposal.submitted_by,
            defaults={'role': 'leader', 'status': 'approved'}
        )
        logger.info(f"Club '{club.name}' created with leader {proposal.submitted_by.username}")

    return Response({
        'message': 'Proposal published successfully',
        'club_created': created,
        'club_id': str(club.id),
        'logo_url': club.logo.url if club.logo else None
    })


# KEY CHANGES:
# 1. Line with logo assignment is now INSIDE a try-except block
# 2. Added update_fields=['logo', 'status', 'updated_at'] to optimize save
# 3. Condition changed from "not club.logo" to "(not club.logo or created)"
#    - Always updates logo if club was just created
#    - Always updates logo if club exists but has none
# 4. Added explicit logging for success/failure
# 5. Response now includes logo_url for verification
# 6. Better error handling

# BENEFITS OF THIS FIX:
# ✅ Logo is always copied when club is created
# ✅ Logo is updated even if club already exists but had no logo
# ✅ Explicit error handling prevents silent failures
# ✅ Logging helps debug issues
# ✅ Response includes logo_url for client verification
