from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    User, AdminPermission, UserSession, UserActivity, 
    Proposal, ProposalComment, SystemLog, AdminSettings, 
    Announcement, Backup
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'first_name', 'last_name', 'role', 'status', 
        'is_verified', 'is_active', 'created_at', 'last_login'
    ]
    list_filter = [
        'role', 'status', 'is_verified', 'is_active', 
        'created_at', 'last_login'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'student_id']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone', 'avatar', 'bio')
        }),
        ('Academic info', {
            'fields': ('role', 'student_id', 'major', 'year')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'status', 'groups', 'user_permissions')
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login', 'date_joined')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(is_superuser=False)

@admin.register(AdminPermission)
class AdminPermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'description', 'created_at']
    search_fields = ['name', 'codename', 'description']
    ordering = ['name']

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_key_short', 'ip_address', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active', 'created_at', 'last_activity']
    search_fields = ['user__email', 'ip_address']
    ordering = ['-last_activity']
    
    def session_key_short(self, obj):
        return obj.session_key[:8] + '...'
    session_key_short.short_description = 'Session Key'

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'description_short', 'ip_address', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'description']
    ordering = ['-created_at']
    
    def description_short(self, obj):
        if obj.description and len(obj.description) > 50:
            return obj.description[:50] + '...'
        return obj.description
    description_short.short_description = 'Description'

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'type', 'status', 'priority', 'submitted_by', 
        'submitted_at', 'deadline', 'budget_display'
    ]
    list_filter = [
        'type', 'status', 'priority', 'submitted_at', 'deadline'
    ]
    search_fields = ['title', 'description', 'submitted_by__email']
    ordering = ['-submitted_at']
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'type', 'priority')
        }),
        ('Status', {
            'fields': ('status', 'reviewed_by', 'reviewed_at')
        }),
        ('Details', {
            'fields': ('budget', 'deadline', 'is_public')
        }),
        ('Metadata', {
            'fields': ('submitted_by', 'submitted_at', 'tags', 'attachments')
        }),
    )
    
    readonly_fields = ['submitted_at']
    
    def budget_display(self, obj):
        if obj.budget:
            return f"${obj.budget:,.2f}"
        return "N/A"
    budget_display.short_description = 'Budget'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(status__in=['pending', 'under_review'])

class ProposalCommentInline(admin.TabularInline):
    model = ProposalComment
    extra = 1
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ProposalComment)
class ProposalCommentAdmin(admin.ModelAdmin):
    list_display = ['proposal', 'author', 'content_short', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['proposal__title', 'author__email', 'content']
    ordering = ['-created_at']
    
    def content_short(self, obj):
        if len(obj.content) > 100:
            return obj.content[:100] + '...'
        return obj.content
    content_short.short_description = 'Content'

@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ['level', 'module', 'message_short', 'user', 'ip_address', 'created_at']
    list_filter = ['level', 'module', 'created_at']
    search_fields = ['message', 'module', 'user__email']
    ordering = ['-created_at']
    
    def message_short(self, obj):
        if len(obj.message) > 100:
            return obj.message[:100] + '...'
        return obj.message
    message_short.short_description = 'Message'
    
    def has_add_permission(self, request):
        return False  # Logs are created automatically

@admin.register(AdminSettings)
class AdminSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value_short', 'description', 'is_public', 'updated_at']
    search_fields = ['key', 'description']
    ordering = ['key']
    
    def value_short(self, obj):
        if len(obj.value) > 100:
            return obj.value[:100] + '...'
        return obj.value
    value_short.short_description = 'Value'

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'is_active', 'created_by', 'starts_at', 'ends_at']
    list_filter = ['type', 'is_active', 'starts_at', 'ends_at']
    search_fields = ['title', 'content']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {
            'fields': ('title', 'content', 'type', 'is_active')
        }),
        ('Targeting', {
            'fields': ('target_roles', 'target_users')
        }),
        ('Schedule', {
            'fields': ('starts_at', 'ends_at')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Backup)
class BackupAdmin(admin.ModelAdmin):
    list_display = ['filename', 'backup_type', 'status', 'file_size_display', 'created_by', 'created_at']
    list_filter = ['backup_type', 'status', 'created_at']
    search_fields = ['filename', 'created_by__email']
    ordering = ['-created_at']
    
    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        else:
            return f"{obj.file_size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = 'File Size'
    
    def has_add_permission(self, request):
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
