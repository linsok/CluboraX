from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel
from apps.core.utils import generate_qr_code, is_qr_code_expired
import uuid

User = get_user_model()


class Event(TimeStampedModel):
    """
    Event model for managing campus events.
    """
    EVENT_TYPES = [
        ('academic', 'Academic'),
        ('social', 'Social'),
        ('sports', 'Sports'),
        ('cultural', 'Cultural'),
        ('workshop', 'Workshop'),
        ('competition', 'Competition'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    venue = models.CharField(max_length=200)
    max_participants = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1)]
    )
    is_paid = models.BooleanField(default=False)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    registration_deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_events'
    )
    club = models.ForeignKey(
        'clubs.Club', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='events'
    )
    poster_image = models.ImageField(upload_to='event_posters/', null=True, blank=True)
    requirements = models.TextField(blank=True, null=True)
    agenda = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-start_datetime']
    
    def __str__(self):
        return self.title
    
    @property
    def is_upcoming(self):
        return self.start_datetime > timezone.now()
    
    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime
    
    @property
    def is_past(self):
        return self.end_datetime < timezone.now()
    
    @property
    def registration_open(self):
        if not self.registration_deadline:
            return self.is_upcoming and self.status == 'approved'
        return (
            timezone.now() <= self.registration_deadline and 
            self.is_upcoming and 
            self.status == 'approved'
        )
    
    @property
    def current_participants(self):
        return self.registrations.filter(status='confirmed').count()
    
    @property
    def available_slots(self):
        if not self.max_participants:
            return None
        return max(0, self.max_participants - self.current_participants)
    
    @property
    def is_full(self):
        if not self.max_participants:
            return False
        return self.current_participants >= self.max_participants
    
    def can_register(self, user):
        """
        Check if user can register for this event.
        """
        # Check if event is approved and registration is open
        if not self.registration_open:
            return False, "Registration is not open for this event."
        
        # Check if event is full
        if self.is_full:
            return False, "Event is fully booked."
        
        # Check if user is already registered
        if self.registrations.filter(user=user).exists():
            return False, "Already registered for this event."
        
        # Check if user is banned or restricted
        if not user.is_active:
            return False, "Account is not active."
        
        return True, "Registration allowed."
    
    def check_schedule_conflicts(self, user):
        """
        Check for schedule conflicts with user's existing registrations.
        """
        conflicting_events = Event.objects.filter(
            registrations__user=user,
            registrations__status='confirmed',
            status='approved'
        ).filter(
            models.Q(
                start_datetime__lte=self.start_datetime,
                end_datetime__gte=self.start_datetime
            ) | models.Q(
                start_datetime__lte=self.end_datetime,
                end_datetime__gte=self.end_datetime
            ) | models.Q(
                start_datetime__gte=self.start_datetime,
                end_datetime__lte=self.end_datetime
            )
        )
        
        return conflicting_events.exists()


class EventRegistration(TimeStampedModel):
    """
    Event registration model.
    """
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='registrations'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='event_registrations'
    )
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    qr_code = models.CharField(max_length=255, unique=True, null=True, blank=True)
    qr_code_image = models.ImageField(
        upload_to='qr_codes/', 
        null=True, 
        blank=True
    )
    payment_status = models.CharField(
        max_length=20, 
        choices=PAYMENT_STATUS_CHOICES, 
        null=True, 
        blank=True
    )
    payment_receipt = models.ImageField(
        upload_to='payment_receipts/', 
        null=True, 
        blank=True
    )
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'event_registrations'
        verbose_name = 'Event Registration'
        verbose_name_plural = 'Event Registrations'
        unique_together = ['event', 'user']
        ordering = ['-registration_date']
    
    def __str__(self):
        return f"{self.user.email} - {self.event.title}"
    
    def generate_qr_code(self):
        """
        Generate QR code for this registration.
        """
        qr_data = f"event:{self.event.id}:user:{self.user.id}:reg:{self.id}"
        
        # Generate QR code image
        qr_image = generate_qr_code(qr_data)
        
        # Save QR code image
        self.qr_code_image.save(f"qr_{self.id}.png", qr_image, save=False)
        self.qr_code = qr_data
        self.save(update_fields=['qr_code', 'qr_code_image'])
        
        return self.qr_code
    
    @property
    def is_qr_expired(self):
        """
        Check if QR code has expired.
        """
        if not self.event.end_datetime:
            return False
        return is_qr_code_expired(self.event.end_datetime)
    
    def check_in(self, scanner_user=None):
        """
        Check in the user for the event.
        """
        if self.checked_in:
            return False, "Already checked in."
        
        if self.is_qr_expired:
            return False, "QR code has expired."
        
        self.checked_in = True
        self.checked_in_at = timezone.now()
        self.save(update_fields=['checked_in', 'checked_in_at'])
        
        # Log the check-in
        from apps.core.models import AuditLog
        AuditLog.objects.create(
            user=scanner_user,
            action='check_in',
            table_name='EventRegistration',
            record_id=str(self.id),
            new_values={'checked_in': True, 'checked_in_at': self.checked_in_at}
        )
        
        return True, "Check-in successful."


class EventApproval(TimeStampedModel):
    """
    Event approval workflow model.
    """
    APPROVER_TYPES = [
        ('student_affairs', 'Student Affairs'),
        ('dean', 'Dean'),
        ('finance', 'Finance'),
        ('venue_manager', 'Venue Manager'),
        ('admin', 'Administrator'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='approvals'
    )
    approver_type = models.CharField(max_length=20, choices=APPROVER_TYPES)
    approver = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='event_approvals'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    comments = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'event_approvals'
        verbose_name = 'Event Approval'
        verbose_name_plural = 'Event Approvals'
        unique_together = ['event', 'approver_type']
        ordering = ['approver_type']
    
    def __str__(self):
        return f"{self.event.title} - {self.get_approver_type_display()}"
    
    def approve(self, approver_user, comments=''):
        """
        Approve the event.
        """
        self.status = 'approved'
        self.approver = approver_user
        self.comments = comments
        self.reviewed_at = timezone.now()
        self.save()
        
        # Check if all approvals are complete
        self.check_event_approval_status()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.event.created_by,
            'Event Approved',
            f'Your event "{self.event.title}" has been approved by {self.get_approver_type_display()}',
            'event_update'
        )
    
    def reject(self, approver_user, comments=''):
        """
        Reject the event.
        """
        self.status = 'rejected'
        self.approver = approver_user
        self.comments = comments
        self.reviewed_at = timezone.now()
        self.save()
        
        # Update event status
        self.event.status = 'rejected'
        self.event.save()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            self.event.created_by,
            'Event Rejected',
            f'Your event "{self.event.title}" has been rejected by {self.get_approver_type_display()}: {comments}',
            'event_update'
        )
    
    def check_event_approval_status(self):
        """
        Check if all required approvals are complete.
        """
        all_approvals = self.event.approvals.all()
        pending_approvals = all_approvals.filter(status='pending')
        
        if not pending_approvals.exists():
            # All approvals complete, check if any were rejected
            if all_approvals.filter(status='rejected').exists():
                self.event.status = 'rejected'
            else:
                self.event.status = 'approved'
            
            self.event.save()
            
            # Send final notification
            from apps.core.utils import send_notification
            status_message = 'approved' if self.event.status == 'approved' else 'rejected'
            send_notification(
                self.event.created_by,
                f'Event {status_message.title()}',
                f'Your event "{self.event.title}" has been {status_message} and is now {"published" if self.event.status == "approved" else "rejected"}.',
                'event_update'
            )


class EventFeedback(TimeStampedModel):
    """
    Event feedback model.
    """
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='feedbacks'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='event_feedbacks'
    )
    rating = models.IntegerField(choices=RATING_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    comments = models.TextField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)
    would_recommend = models.BooleanField(null=True, blank=True)
    
    class Meta:
        db_table = 'event_feedbacks'
        verbose_name = 'Event Feedback'
        verbose_name_plural = 'Event Feedbacks'
        unique_together = ['event', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.event.title} ({self.rating} stars)"


class EventMedia(TimeStampedModel):
    """
    Event media model for photos and videos.
    """
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('document', 'Document'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='media_files'
    )
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file = models.FileField(upload_to='event_media/')
    is_approved = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='uploaded_event_media'
    )
    
    class Meta:
        db_table = 'event_media'
        verbose_name = 'Event Media'
        verbose_name_plural = 'Event Media'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event.title} - {self.title or self.file.name}"
