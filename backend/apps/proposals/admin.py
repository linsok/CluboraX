from django.contrib import admin
from .models import EventProposal, ClubProposal


@admin.register(EventProposal)
class EventProposalAdmin(admin.ModelAdmin):
    list_display = ('title', 'submitted_by', 'status', 'proposed_date', 'submitted_date')
    list_filter = ('status', 'proposed_date', 'submitted_date')
    search_fields = ('title', 'description', 'venue')
    readonly_fields = ('submitted_date', 'reviewed_date')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'submitted_by', 'status')
        }),
        ('Event Details', {
            'fields': ('proposed_date', 'venue', 'expected_participants')
        }),
        ('Budget', {
            'fields': ('budget_items', 'total_budget')
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_date', 'review_comments')
        }),
        ('Timestamps', {
            'fields': ('submitted_date',)
        }),
    )


@admin.register(ClubProposal)
class ClubProposalAdmin(admin.ModelAdmin):
    list_display = ('name', 'submitted_by', 'status', 'submitted_date')
    list_filter = ('status', 'club_type', 'submitted_date')
    search_fields = ('name', 'mission', 'description')
    readonly_fields = ('submitted_date', 'reviewed_date')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'club_type', 'submitted_by', 'status')
        }),
        ('Club Details', {
            'fields': ('mission', 'description', 'objectives', 'activities')
        }),
        ('Leadership', {
            'fields': ('president_name', 'president_email', 'advisor_name', 'advisor_email')
        }),
        ('Membership', {
            'fields': ('expected_members', 'requirements')
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_date', 'review_comments')
        }),
        ('Timestamps', {
            'fields': ('submitted_date',)
        }),
    )
