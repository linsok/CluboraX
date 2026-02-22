from django.db import models
from django.conf import settings


class EventProposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    # Basic Info
    title = models.CharField(max_length=255)
    description = models.TextField()
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_proposals')
    
    # Event Details
    proposed_date = models.DateField()
    venue = models.CharField(max_length=255)
    expected_participants = models.IntegerField()
    
    # Budget
    budget_items = models.JSONField(default=list, blank=True)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status & Review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_event_proposals')
    review_comments = models.TextField(blank=True, null=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_date']
        
    def __str__(self):
        return f"{self.title} - {self.status}"


class ClubProposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
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
    mission = models.TextField()
    description = models.TextField()
    objectives = models.TextField()
    activities = models.TextField()
    
    # Leadership
    president_name = models.CharField(max_length=255)
    president_email = models.EmailField()
    advisor_name = models.CharField(max_length=255, blank=True)
    advisor_email = models.EmailField(blank=True)
    
    # Membership
    expected_members = models.IntegerField()
    requirements = models.TextField(blank=True)
    
    # Status & Review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_club_proposals')
    review_comments = models.TextField(blank=True, null=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_date']
        
    def __str__(self):
        return f"{self.name} - {self.status}"
