from rest_framework import serializers
from django.utils import timezone
from .models import (
    SystemOverview, AdminActivity, SystemReport, SystemSetting,
    SystemAlert, SystemBackup, SystemMaintenance
)
from apps.users.serializers import UserProfileSerializer
import logging

logger = logging.getLogger(__name__)


class SystemOverviewSerializer(serializers.ModelSerializer):
    """
    System overview serializer.
    """
    class Meta:
        model = SystemOverview
        fields = ['id', 'data', 'last_updated']
        read_only_fields = ['id', 'last_updated']


class AdminActivitySerializer(serializers.ModelSerializer):
    """
    Admin activity serializer.
    """
    admin = UserProfileSerializer(read_only=True)
    target_user = UserProfileSerializer(read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = AdminActivity
        fields = [
            'id', 'admin', 'action_type', 'action_type_display',
            'description', 'target_user', 'target_object_type',
            'target_object_id', 'ip_address', 'user_agent',
            'created_at'
        ]
        read_only_fields = ['id', 'admin', 'created_at']


class SystemReportSerializer(serializers.ModelSerializer):
    """
    System report serializer.
    """
    generated_by = UserProfileSerializer(read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.ReadOnlyField()
    download_url = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemReport
        fields = [
            'id', 'report_type', 'report_type_display', 'title',
            'description', 'status', 'status_display', 'parameters',
            'file_path', 'file_size', 'generated_by', 'generated_at',
            'expires_at', 'is_expired', 'download_url', 'created_at'
        ]
        read_only_fields = [
            'id', 'file_path', 'file_size', 'generated_by',
            'generated_at', 'created_at'
        ]


class SystemReportCreateSerializer(serializers.ModelSerializer):
    """
    System report creation serializer.
    """
    class Meta:
        model = SystemReport
        fields = [
            'report_type', 'title', 'description', 'parameters',
            'expires_at'
        ]
    
    def validate_expires_at(self, value):
        """
        Validate expiry date is in future.
        """
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value


class SystemSettingSerializer(serializers.ModelSerializer):
    """
    System setting serializer.
    """
    updated_by = UserProfileSerializer(read_only=True)
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemSetting
        fields = [
            'id', 'key', 'value', 'setting_type', 'description',
            'is_public', 'category', 'updated_by', 'typed_value',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_by', 'updated_at']
    
    def get_typed_value(self, obj):
        """
        Get typed value.
        """
        return obj.get_typed_value()


class SystemSettingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    System setting create/update serializer.
    """
    class Meta:
        model = SystemSetting
        fields = [
            'key', 'value', 'setting_type', 'description',
            'is_public', 'category'
        ]
    
    def validate_key(self, value):
        """
        Validate key format.
        """
        if not value.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError(
                "Key must contain only alphanumeric characters, underscores, and hyphens."
            )
        return value.lower()
    
    def validate_value(self, value):
        """
        Validate value based on setting type.
        """
        setting_type = self.initial_data.get('setting_type', 'string')
        
        if setting_type == 'integer':
            try:
                int(value)
            except ValueError:
                raise serializers.ValidationError("Value must be an integer.")
        elif setting_type == 'float':
            try:
                float(value)
            except ValueError:
                raise serializers.ValidationError("Value must be a number.")
        elif setting_type == 'boolean':
            if value.lower() not in ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']:
                raise serializers.ValidationError("Value must be a boolean.")
        elif setting_type == 'json':
            import json
            try:
                json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Value must be valid JSON.")
        
        return value


class SystemAlertSerializer(serializers.ModelSerializer):
    """
    System alert serializer.
    """
    acknowledged_by = UserProfileSerializer(read_only=True)
    resolved_by = UserProfileSerializer(read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemAlert
        fields = [
            'id', 'title', 'message', 'alert_type', 'alert_type_display',
            'status', 'status_display', 'source', 'metadata',
            'acknowledged_by', 'acknowledged_at', 'resolved_by',
            'resolved_at', 'expires_at', 'is_expired', 'created_at'
        ]
        read_only_fields = [
            'id', 'acknowledged_by', 'acknowledged_at', 'resolved_by',
            'resolved_at', 'created_at'
        ]


class SystemAlertActionSerializer(serializers.Serializer):
    """
    System alert action serializer.
    """
    action = serializers.ChoiceField(choices=['acknowledge', 'resolve'])
    notes = serializers.CharField(required=False, allow_blank=True)


class SystemBackupSerializer(serializers.ModelSerializer):
    """
    System backup serializer.
    """
    initiated_by = UserProfileSerializer(read_only=True)
    backup_type_display = serializers.CharField(source='get_backup_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration = serializers.ReadOnlyField()
    download_url = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemBackup
        fields = [
            'id', 'backup_type', 'backup_type_display', 'status',
            'status_display', 'file_path', 'file_size', 'compression_ratio',
            'started_at', 'completed_at', 'duration', 'initiated_by',
            'error_message', 'metadata', 'download_url', 'created_at'
        ]
        read_only_fields = [
            'id', 'file_path', 'file_size', 'compression_ratio',
            'started_at', 'completed_at', 'initiated_by',
            'error_message', 'created_at'
        ]


class SystemBackupCreateSerializer(serializers.ModelSerializer):
    """
    System backup creation serializer.
    """
    class Meta:
        model = SystemBackup
        fields = ['backup_type']


class SystemMaintenanceSerializer(serializers.ModelSerializer):
    """
    System maintenance serializer.
    """
    initiated_by = UserProfileSerializer(read_only=True)
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemMaintenance
        fields = [
            'id', 'title', 'description', 'maintenance_type',
            'maintenance_type_display', 'status', 'status_display',
            'scheduled_start', 'scheduled_end', 'actual_start',
            'actual_end', 'duration', 'affected_services',
            'notification_sent', 'initiated_by', 'is_active', 'created_at'
        ]
        read_only_fields = [
            'id', 'actual_start', 'actual_end', 'notification_sent',
            'initiated_by', 'created_at'
        ]
    
    def validate_scheduled_end(self, value):
        """
        Validate scheduled end is after start.
        """
        scheduled_start = self.initial_data.get('scheduled_start')
        if scheduled_start and value <= scheduled_start:
            raise serializers.ValidationError("Scheduled end must be after scheduled start.")
        return value


class SystemMaintenanceCreateSerializer(serializers.ModelSerializer):
    """
    System maintenance creation serializer.
    """
    class Meta:
        model = SystemMaintenance
        fields = [
            'title', 'description', 'maintenance_type',
            'scheduled_start', 'scheduled_end', 'affected_services'
        ]
    
    def validate_scheduled_end(self, value):
        """
        Validate scheduled end is after start.
        """
        scheduled_start = self.initial_data.get('scheduled_start')
        if scheduled_start and value <= scheduled_start:
            raise serializers.ValidationError("Scheduled end must be after scheduled start.")
        return value


class DashboardStatsSerializer(serializers.Serializer):
    """
    Dashboard statistics serializer.
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_events = serializers.IntegerField()
    upcoming_events = serializers.IntegerField()
    total_clubs = serializers.IntegerField()
    active_clubs = serializers.IntegerField()
    total_registrations = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    system_health = serializers.JSONField()
    recent_activities = serializers.JSONField()
    alerts = serializers.JSONField()


class SystemHealthSerializer(serializers.Serializer):
    """
    System health serializer.
    """
    status = serializers.CharField()
    database_status = serializers.CharField()
    cache_status = serializers.CharField()
    storage_status = serializers.CharField()
    uptime = serializers.DurationField()
    memory_usage = serializers.JSONField()
    disk_usage = serializers.JSONField()
    active_connections = serializers.IntegerField()
    error_rate = serializers.FloatField()
    last_check = serializers.DateTimeField()


class QuickActionSerializer(serializers.Serializer):
    """
    Quick action serializer for admin dashboard.
    """
    action = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()
    url = serializers.CharField()
    permission = serializers.CharField()
    badge_count = serializers.IntegerField(required=False, allow_null=True)
