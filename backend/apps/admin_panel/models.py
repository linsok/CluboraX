from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import TimeStampedModel
import uuid

User = get_user_model()


class SystemOverview(TimeStampedModel):
    """
    System overview model for caching dashboard data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_overview'
        verbose_name = 'System Overview'
        verbose_name_plural = 'System Overviews'
    
    def __str__(self):
        return f"System Overview - {self.last_updated}"


class AdminActivity(TimeStampedModel):
    """
    Admin activity tracking model.
    """
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('user_action', 'User Action'),
        ('event_action', 'Event Action'),
        ('club_action', 'Club Action'),
        ('system_action', 'System Action'),
        ('moderation', 'Moderation'),
        ('report', 'Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='admin_activities'
    )
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    target_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='targeted_activities'
    )
    target_object_type = models.CharField(max_length=50, blank=True, null=True)
    target_object_id = models.CharField(max_length=50, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'admin_activities'
        verbose_name = 'Admin Activity'
        verbose_name_plural = 'Admin Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'action_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.admin.full_name} - {self.get_action_type_display()}"


class SystemReport(TimeStampedModel):
    """
    System report model for generated reports.
    """
    REPORT_TYPES = [
        ('daily', 'Daily Report'),
        ('weekly', 'Weekly Report'),
        ('monthly', 'Monthly Report'),
        ('custom', 'Custom Report'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    parameters = models.JSONField(default=dict, blank=True)
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    generated_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='generated_reports'
    )
    generated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'system_reports'
        verbose_name = 'System Report'
        verbose_name_plural = 'System Reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    @property
    def download_url(self):
        if self.file_path and self.status == 'completed':
            return f"/admin/reports/{self.id}/download/"
        return None


class SystemSetting(TimeStampedModel):
    """
    System setting model for admin configuration.
    """
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=10, choices=SETTING_TYPES, default='string')
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    category = models.CharField(max_length=50, default='general')
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='updated_settings'
    )
    
    class Meta:
        db_table = 'admin_system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_typed_value(self):
        """
        Get value converted to appropriate type.
        """
        if self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'float':
            return float(self.value)
        elif self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value
    
    def set_typed_value(self, value):
        """
        Set value from typed value.
        """
        if self.setting_type == 'json':
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)


class SystemAlert(TimeStampedModel):
    """
    System alert model for admin notifications.
    """
    ALERT_TYPES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    source = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    acknowledged_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'system_alerts'
        verbose_name = 'System Alert'
        verbose_name_plural = 'System Alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'alert_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_alert_type_display()})"
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    def acknowledge(self, admin_user):
        """
        Acknowledge the alert.
        """
        self.status = 'acknowledged'
        self.acknowledged_by = admin_user
        self.acknowledged_at = timezone.now()
        self.save()
    
    def resolve(self, admin_user):
        """
        Resolve the alert.
        """
        self.status = 'resolved'
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.save()


class SystemBackup(TimeStampedModel):
    """
    System backup model.
    """
    BACKUP_TYPES = [
        ('full', 'Full Backup'),
        ('incremental', 'Incremental Backup'),
        ('database', 'Database Only'),
        ('media', 'Media Only'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    compression_ratio = models.FloatField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    initiated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='initiated_backups'
    )
    error_message = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'system_backups'
        verbose_name = 'System Backup'
        verbose_name_plural = 'System Backups'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_backup_type_display()} - {self.get_status_display()}"
    
    @property
    def duration(self):
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None
    
    @property
    def download_url(self):
        if self.file_path and self.status == 'completed':
            return f"/admin/backups/{self.id}/download/"
        return None


class SystemMaintenance(TimeStampedModel):
    """
    System maintenance model.
    """
    MAINTENANCE_TYPES = [
        ('scheduled', 'Scheduled Maintenance'),
        ('emergency', 'Emergency Maintenance'),
        ('update', 'System Update'),
        ('backup', 'Backup Maintenance'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    affected_services = models.JSONField(default=list, blank=True)
    notification_sent = models.BooleanField(default=False)
    initiated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='initiated_maintenance'
    )
    
    class Meta:
        db_table = 'system_maintenance'
        verbose_name = 'System Maintenance'
        verbose_name_plural = 'System Maintenance'
        ordering = ['-scheduled_start']
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        now = timezone.now()
        return self.status == 'in_progress' or (
            self.status == 'scheduled' and 
            self.scheduled_start <= now <= self.scheduled_end
        )
    
    @property
    def duration(self):
        if self.actual_start and self.actual_end:
            return self.actual_end - self.actual_start
        elif self.scheduled_start and self.scheduled_end:
            return self.scheduled_end - self.scheduled_start
        return None
