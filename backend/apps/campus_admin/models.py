from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid

class User(AbstractUser):
    """Extended User model with additional fields"""
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending'),
    ]
    
    class Meta:
        app_label = 'campus_admin'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    student_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    major = models.CharField(max_length=100, blank=True, null=True)
    year = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

class AdminPermission(models.Model):
    """Custom admin permissions"""
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_permissions'
        verbose_name = 'Admin Permission'
        verbose_name_plural = 'Admin Permissions'
    
    def __str__(self):
        return self.name

class UserSession(models.Model):
    """Track user sessions for admin monitoring"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"{self.user.email} - {self.session_key[:8]}..."

class UserActivity(models.Model):
    """Track user activities for admin monitoring"""
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('profile_update', 'Profile Update'),
        ('password_change', 'Password Change'),
        ('course_enroll', 'Course Enroll'),
        ('event_register', 'Event Register'),
        ('club_join', 'Club Join'),
        ('proposal_submit', 'Proposal Submit'),
        ('proposal_approve', 'Proposal Approve'),
        ('proposal_reject', 'Proposal Reject'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_user_activities'
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.action}"

class Proposal(models.Model):
    """Model for user proposals (clubs, events, etc.)"""
    TYPE_CHOICES = [
        ('club', 'Club Proposal'),
        ('event', 'Event Proposal'),
        ('project', 'Project Proposal'),
        ('funding', 'Funding Request'),
        ('complaint', 'Complaint'),
        ('suggestion', 'Suggestion'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('implemented', 'Implemented'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_proposals')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_proposals')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_proposals'
        verbose_name = 'Proposal'
        verbose_name_plural = 'Proposals'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_type_display()}"

class ProposalComment(models.Model):
    """Comments on proposals"""
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='proposal_comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal admin comments
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_proposal_comments'
        verbose_name = 'Proposal Comment'
        verbose_name_plural = 'Proposal Comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.proposal.title}"

class SystemLog(models.Model):
    """System-wide logging for admin monitoring"""
    LEVEL_CHOICES = [
        ('debug', 'Debug'),
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    message = models.TextField()
    module = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_system_logs'
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.level.upper()} - {self.module}"

class AdminSettings(models.Model):
    """Global admin settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_settings'
        verbose_name = 'Admin Setting'
        verbose_name_plural = 'Admin Settings'
    
    def __str__(self):
        return f"{self.key} = {self.value[:50]}..."

class Announcement(models.Model):
    """System announcements for users"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    type = models.CharField(max_length=20, default='info')
    is_active = models.BooleanField(default=True)
    target_roles = models.JSONField(default=list)  # Which roles can see this
    target_users = models.ManyToManyField(User, blank=True, related_name='targeted_announcements')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'campus_admin'
        db_table = 'admin_announcements'
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class Backup(models.Model):
    """Database backup records"""
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    backup_type = models.CharField(max_length=20)  # full, incremental, etc.
    status = models.CharField(max_length=20)  # success, failed, in_progress
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'admin_backups'
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.filename} - {self.status}"
