from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel
from apps.core.utils import validate_image_file
import uuid

User = get_user_model()


class Club(TimeStampedModel):
    """
    Club model for managing student clubs.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=100)
    mission_statement = models.TextField()
    logo = models.ImageField(upload_to='club_logos/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    founded_date = models.DateField(null=True, blank=True)
    advisor_name = models.CharField(max_length=100, blank=True, null=True)
    advisor_email = models.EmailField(blank=True, null=True)
    meeting_schedule = models.CharField(max_length=200, blank=True, null=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_clubs'
    )
    tags = models.JSONField(default=list, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    requirements = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'clubs'
        verbose_name = 'Club'
        verbose_name_plural = 'Clubs'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def member_count(self):
        return self.memberships.filter(status='approved').count()
    
    @property
    def pending_memberships(self):
        return self.memberships.filter(status='pending').count()
    
    @property
    def leader_count(self):
        return self.memberships.filter(role='leader', status='approved').count()
    
    @property
    def is_active(self):
        return self.status in ['approved', 'active']
    
    @property
    def can_join(self):
        return self.is_active and self.status == 'approved'
    
    def add_member(self, user, role='member'):
        """
        Add a member to the club.
        """
        from .models import ClubMembership
        
        membership, created = ClubMembership.objects.get_or_create(
            club=self,
            user=user,
            defaults={'role': role}
        )
        
        if not created:
            membership.status = 'pending'
            membership.save()
        
        return membership
    
    def remove_member(self, user):
        """
        Remove a member from the club.
        """
        from .models import ClubMembership
        
        try:
            membership = ClubMembership.objects.get(club=self, user=user)
            membership.delete()
            return True
        except ClubMembership.DoesNotExist:
            return False
    
    def is_member(self, user):
        """
        Check if user is a member of the club.
        """
        return self.memberships.filter(user=user, status='approved').exists()
    
    def is_leader(self, user):
        """
        Check if user is a leader of the club.
        """
        return self.memberships.filter(
            user=user, 
            role='leader', 
            status='approved'
        ).exists()
    
    def get_membership(self, user):
        """
        Get user's membership in the club.
        """
        try:
            return self.memberships.get(user=user)
        except ClubMembership.DoesNotExist:
            return None


class ClubMembership(TimeStampedModel):
    """
    Club membership model.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('leader', 'Leader'),
        ('advisor', 'Advisor'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='memberships'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='club_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'club_memberships'
        verbose_name = 'Club Membership'
        verbose_name_plural = 'Club Memberships'
        unique_together = ['club', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.club.name} ({self.get_role_display()})"
    
    def approve(self, approver_user=None):
        """
        Approve the membership.
        """
        self.status = 'approved'
        self.save()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.user,
            'Club Membership Approved',
            f'Your membership in "{self.club.name}" has been approved',
            'club_update'
        )
        
        # Log the approval
        from apps.core.models import AuditLog
        AuditLog.objects.create(
            user=approver_user,
            action='approve',
            table_name='ClubMembership',
            record_id=str(self.id),
            new_values={'status': 'approved'}
        )
    
    def reject(self, approver_user=None, reason=''):
        """
        Reject the membership.
        """
        self.status = 'rejected'
        self.notes = reason
        self.save()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.user,
            'Club Membership Rejected',
            f'Your membership in "{self.club.name}" has been rejected: {reason}',
            'club_update'
        )
        
        # Log the rejection
        from apps.core.models import AuditLog
        AuditLog.objects.create(
            user=approver_user,
            action='reject',
            table_name='ClubMembership',
            record_id=str(self.id),
            new_values={'status': 'rejected', 'notes': reason}
        )


class ClubApproval(TimeStampedModel):
    """
    Club approval workflow model.
    """
    APPROVER_TYPES = [
        ('student_affairs', 'Student Affairs'),
        ('dean', 'Dean'),
        ('admin', 'Administrator'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='approvals'
    )
    approver_type = models.CharField(max_length=20, choices=APPROVER_TYPES)
    approver = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='club_approvals'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    comments = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'club_approvals'
        verbose_name = 'Club Approval'
        verbose_name_plural = 'Club Approvals'
        unique_together = ['club', 'approver_type']
        ordering = ['approver_type']
    
    def __str__(self):
        return f"{self.club.name} - {self.get_approver_type_display()}"
    
    def approve(self, approver_user, comments=''):
        """
        Approve the club.
        """
        self.status = 'approved'
        self.approver = approver_user
        self.comments = comments
        self.reviewed_at = timezone.now()
        self.save()
        
        # Check if all approvals are complete
        self.check_club_approval_status()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.club.created_by,
            'Club Approved',
            f'Your club "{self.club.name}" has been approved by {self.get_approver_type_display()}',
            'club_update'
        )
    
    def reject(self, approver_user, comments=''):
        """
        Reject the club.
        """
        self.status = 'rejected'
        self.approver = approver_user
        self.comments = comments
        self.reviewed_at = timezone.now()
        self.save()
        
        # Update club status
        self.club.status = 'rejected'
        self.club.save()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.club.created_by,
            'Club Rejected',
            f'Your club "{self.club.name}" has been rejected by {self.get_approver_type_display()}: {comments}',
            'club_update'
        )
    
    def check_club_approval_status(self):
        """
        Check if all required approvals are complete.
        """
        all_approvals = self.club.approvals.all()
        pending_approvals = all_approvals.filter(status='pending')
        
        if not pending_approvals.exists():
            # All approvals complete, check if any were rejected
            if all_approvals.filter(status='rejected').exists():
                self.club.status = 'rejected'
            else:
                self.club.status = 'approved'
            
            self.club.save()
            
            # Send final notification
            from apps.core.utils import send_notification
            status_message = 'approved' if self.club.status == 'approved' else 'rejected'
            send_notification(
                self.club.created_by,
                f'Club {status_message.title()}',
                f'Your club "{self.club.name}" has been {status_message} and is now {"active" if self.club.status == "approved" else "rejected"}.',
                'club_update'
            )


class ClubActivity(TimeStampedModel):
    """
    Club activity model for tracking club events and activities.
    """
    ACTIVITY_TYPES = [
        ('meeting', 'Meeting'),
        ('event', 'Event'),
        ('announcement', 'Announcement'),
        ('election', 'Election'),
        ('training', 'Training'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='activities'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    date = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_club_activities'
    )
    attachments = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'club_activities'
        verbose_name = 'Club Activity'
        verbose_name_plural = 'Club Activities'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.club.name} - {self.title}"


class ClubAnnouncement(TimeStampedModel):
    """
    Club announcement model.
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='announcements'
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_club_announcements'
    )
    
    class Meta:
        db_table = 'club_announcements'
        verbose_name = 'Club Announcement'
        verbose_name_plural = 'Club Announcements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.club.name} - {self.title}"
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at


class ClubResource(TimeStampedModel):
    """
    Club resource model for documents and files.
    """
    RESOURCE_TYPES = [
        ('document', 'Document'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('link', 'Link'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='resources'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    file = models.FileField(upload_to='club_resources/', null=True, blank=True)
    url = models.URLField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='uploaded_club_resources'
    )
    
    class Meta:
        db_table = 'club_resources'
        verbose_name = 'Club Resource'
        verbose_name_plural = 'Club Resources'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.club.name} - {self.title}"


class ClubFeedback(TimeStampedModel):
    """
    Club feedback model.
    """
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        Club, 
        on_delete=models.CASCADE, 
        related_name='feedbacks'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='club_feedbacks'
    )
    rating = models.IntegerField(choices=RATING_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    comments = models.TextField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)
    would_recommend = models.BooleanField(null=True, blank=True)
    
    class Meta:
        db_table = 'club_feedbacks'
        verbose_name = 'Club Feedback'
        verbose_name_plural = 'Club Feedbacks'
        unique_together = ['club', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.club.name} ({self.rating} stars)"
