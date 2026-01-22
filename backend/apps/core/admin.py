from django.contrib import admin
from .models import AuditLog, SystemSetting


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for AuditLog model.
    """
    list_display = ['user', 'action', 'table_name', 'record_id', 'timestamp', 'ip_address']
    list_filter = ['action', 'table_name', 'timestamp']
    search_fields = ['user__email', 'table_name', 'record_id']
    readonly_fields = ['user', 'action', 'table_name', 'record_id', 'old_values', 'new_values', 'ip_address', 'user_agent', 'timestamp']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    """
    Admin interface for SystemSetting model.
    """
    list_display = ['key', 'value', 'description', 'is_public', 'updated_at']
    list_filter = ['is_public', 'updated_at']
    search_fields = ['key', 'description']
    readonly_fields = ['updated_at']
    ordering = ['key']
