from django.db import models
from django.conf import settings


class EventProposal(models.Model):
    STATUS_CHOICES = (
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('returned_for_revision', 'Returned for Revision'),
    )
    
    # Basic Info
    title = models.CharField(max_length=255, blank=True, null=True)
    eventTitle = models.CharField(max_length=255, blank=True, null=True)  # Frontend compatibility
    description = models.TextField(blank=True, null=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_proposals')
    
    # Organizer Details
    organizerName = models.CharField(max_length=255, blank=True, null=True)
    organizerEmail = models.EmailField(blank=True, null=True)
    organizerPhone = models.CharField(max_length=20, blank=True, null=True)
    
    # Location Details
    province = models.CharField(max_length=100, blank=True, null=True)
    specificLocation = models.CharField(max_length=255, blank=True, null=True)
    venue = models.CharField(max_length=255, blank=True, null=True)
    
    # Event Type
    event_type = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., Academic, Sports, Social")
    
    # Event Details
    proposed_date = models.DateField(null=True, blank=True)
    eventDate = models.DateField(blank=True, null=True)  # Single day event
    startDate = models.DateField(blank=True, null=True)  # Multi-day event start
    endDate = models.DateField(blank=True, null=True)  # Multi-day event end
    eventDurationDays = models.IntegerField(default=1)
    event_time = models.TimeField(blank=True, null=True, help_text="Event start time")
    expected_participants = models.IntegerField(null=True, blank=True)
    capacity = models.IntegerField(blank=True, null=True)  # Frontend compatibility
    
    # Pricing & Requirements
    ticketPrice = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    catering = models.CharField(max_length=10, blank=True, null=True)  # Yes/No
    sponsor = models.CharField(max_length=10, blank=True, null=True)  # Yes/No
    special_requirements = models.TextField(blank=True, null=True, help_text="Any special requirements for attendees")
    
    # Agenda
    agenda_description = models.TextField(blank=True, null=True, help_text="Describe the agenda, schedule and activities")
    agenda_pdf = models.FileField(upload_to='event_agendas/', blank=True, null=True, help_text="PDF files only, max 10MB")
    
    # Media
    event_poster = models.ImageField(upload_to='event_posters/', blank=True, null=True, help_text="1200x800px recommended")
    
    # Budget
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    budget_items = models.JSONField(default=list, blank=True)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    
    # Status & Review
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_event_proposals')
    review_comments = models.TextField(blank=True, null=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)

    # Revision / Resubmission
    attachment = models.FileField(upload_to='proposal_attachments/', null=True, blank=True)
    revision_notes = models.TextField(blank=True, null=True)
    resubmission_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_date']
    
    def save(self, *args, **kwargs):
        # Ensure title is set from eventTitle if not provided
        if not self.title and self.eventTitle:
            self.title = self.eventTitle
        elif self.eventTitle and not self.title:
            self.title = self.eventTitle
            
        # Set expected_participants from capacity if not provided
        if not self.expected_participants and self.capacity:
            self.expected_participants = self.capacity
        elif self.capacity and not self.expected_participants:
            self.expected_participants = self.capacity
            
        # Set total_budget from budget if not provided
        if self.budget and not self.total_budget:
            self.total_budget = self.budget
            
        # Set proposed_date based on event duration
        if self.eventDurationDays == 1 and self.eventDate:
            self.proposed_date = self.eventDate
        elif self.startDate:
            self.proposed_date = self.startDate
            
        super().save(*args, **kwargs)
        
    def __str__(self):
        display_title = self.title or self.eventTitle or 'Untitled Event'
        return f"{display_title} - {self.status}"


class ClubProposal(models.Model):
    STATUS_CHOICES = (
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('returned_for_revision', 'Returned for Revision'),
    )

    CLUB_TYPE_CHOICES = (
        ('academic', 'Academic'),
        ('sports', 'Sports'),
        ('arts', 'Arts & Culture'),
        ('social', 'Social Service'),
        ('technical', 'Technical'),
        ('other', 'Other'),
    )
    
    # Basic Info
    name = models.CharField(max_length=255)
    club_type = models.CharField(max_length=50, choices=CLUB_TYPE_CHOICES)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_proposals')
    
    # Club Details
    mission = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    objectives = models.TextField(blank=True, default='')
    activities = models.TextField(blank=True, default='')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Leadership
    president_name = models.CharField(max_length=255)
    president_email = models.EmailField(blank=True, default='')
    president_phone = models.CharField(max_length=20, blank=True, null=True)
    president_gender = models.CharField(max_length=20, blank=True, null=True)
    advisor_name = models.CharField(max_length=255, blank=True)
    advisor_email = models.EmailField(blank=True)
    advisor_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Membership
    expected_members = models.IntegerField()
    requirements = models.TextField(blank=True)
    
    # Meeting Details
    meeting_time = models.CharField(max_length=255, blank=True, null=True, help_text="e.g., Every Wednesday at 6:00 PM")
    meeting_location = models.CharField(max_length=255, blank=True, null=True, help_text="e.g., Tech Building, Room 301")
    
    # Social Media
    instagram = models.CharField(max_length=100, blank=True, null=True, help_text="@clubname")
    linkedin = models.CharField(max_length=100, blank=True, null=True, help_text="Club LinkedIn")
    github = models.CharField(max_length=100, blank=True, null=True, help_text="club-username")
    
    # Media
    club_logo = models.ImageField(upload_to='club_logos/', blank=True, null=True, help_text="500x500px recommended")
    
    # Members
    member_emails = models.JSONField(default=list, blank=True, help_text="List of member email addresses")
    
    # Status & Review
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_club_proposals')
    review_comments = models.TextField(blank=True, null=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)

    # Revision / Resubmission
    attachment = models.FileField(upload_to='proposal_attachments/', null=True, blank=True)
    revision_notes = models.TextField(blank=True, null=True)
    resubmission_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_date']
        
    def __str__(self):
        return f"{self.name} - {self.status}"
