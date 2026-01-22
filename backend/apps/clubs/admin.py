from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Club, ClubMembership, ClubApproval, ClubActivity, 
    ClubAnnouncement, ClubResource, ClubFeedback
)


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    """
    Club admin interface.
    """
    list_display = ['name', 'category', 'status', 'created_by', 'member_count', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['name', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']
    
    fieldsets = (
        (_('Basic Info'), {
            'fields': ('name', 'description', 'category', 'mission_statement')
        }),
        (_('Details'), {
            'fields': ('logo', 'founded_date', 'advisor_name', 'advisor_email', 'meeting_schedule')
        }),
        (_('Organization'), {
            'fields': ('created_by', 'status', 'tags', 'social_links', 'requirements')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    def member_count(self, obj):
        return obj.memberships.filter(status='approved').count()
    member_count.short_description = 'Members'


@admin.register(ClubMembership)
class ClubMembershipAdmin(admin.ModelAdmin):
    """
    Club membership admin interface.
    """
    list_display = ['user', 'club', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status', 'joined_at']
    search_fields = ['user__email', 'club__name']
    readonly_fields = ['id', 'joined_at']
    ordering = ['-joined_at']
    
    fieldsets = (
        (_('Membership Info'), {
            'fields': ('club', 'user', 'role', 'status', 'joined_at')
        }),
        (_('Notes'), {
            'fields': ('notes',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(ClubApproval)
class ClubApprovalAdmin(admin.ModelAdmin):
    """
    Club approval admin interface.
    """
    list_display = ['club', 'approver_type', 'status', 'approver', 'reviewed_at']
    list_filter = ['approver_type', 'status', 'reviewed_at']
    search_fields = ['club__name', 'approver__email', 'comments']
    readonly_fields = ['id', 'created_at', 'reviewed_at']
    ordering = ['club', 'approver_type']
    
    def has_add_permission(self, request):
        return False


@admin.register(ClubActivity)
class ClubActivityAdmin(admin.ModelAdmin):
    """
    Club activity admin interface.
    """
    list_display = ['club', 'title', 'activity_type', 'date', 'is_public', 'created_by']
    list_filter = ['activity_type', 'is_public', 'date']
    search_fields = ['club__name', 'title', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at']
    ordering = ['-date']
    
    fieldsets = (
        (_('Activity Info'), {
            'fields': ('club', 'title', 'description', 'activity_type')
        }),
        (_('Schedule'), {
            'fields': ('date', 'location', 'is_public')
        }),
        (_('Details'), {
            'fields': ('attachments',)
        }),
        (_('Created By'), {
            'fields': ('created_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(ClubAnnouncement)
class ClubAnnouncementAdmin(admin.ModelAdmin):
    """
    Club announcement admin interface.
    """
    list_display = ['club', 'title', 'priority', 'is_active', 'expires_at', 'created_by']
    list_filter = ['priority', 'is_active', 'created_at']
    search_fields = ['club__name', 'title', 'content', 'created_by__email']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Announcement Info'), {
            'fields': ('club', 'title', 'content', 'priority')
        }),
        (_('Settings'), {
            'fields': ('is_active', 'expires_at')
        }),
        (_('Created By'), {
            'fields': ('created_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(ClubResource)
class ClubResourceAdmin(admin.ModelAdmin):
    """
    Club resource admin interface.
    """
    list_display = ['club', 'title', 'resource_type', 'is_public', 'uploaded_by', 'created_at']
    list_filter = ['resource_type', 'is_public', 'created_at']
    search_fields = ['club__name', 'title', 'description', 'uploaded_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Resource Info'), {
            'fields': ('club', 'title', 'description', 'resource_type')
        }),
        (_('Files'), {
            'fields': ('file', 'url')
        }),
        (_('Settings'), {
            'fields': ('is_public',)
        }),
        (_('Upload Info'), {
            'fields': ('uploaded_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(ClubFeedback)
class ClubFeedbackAdmin(admin.ModelAdmin):
    """
    Club feedback admin interface.
    """
    list_display = ['club', 'user', 'rating', 'would_recommend', 'created_at']
    list_filter = ['rating', 'would_recommend', 'created_at']
    search_fields = ['club__name', 'user__email', 'comments']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Feedback Info'), {
            'fields': ('club', 'user', 'rating', 'would_recommend')
        }),
        (_('Comments'), {
            'fields': ('comments', 'suggestions')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
