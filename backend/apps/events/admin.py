from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Event, EventRegistration, EventApproval, EventFeedback, EventMedia


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    Event admin interface.
    """
    list_display = ['title', 'event_type', 'start_datetime', 'venue', 'status', 'created_by', 'current_participants']
    list_filter = ['event_type', 'status', 'is_paid', 'category', 'created_at']
    search_fields = ['title', 'description', 'venue', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-start_datetime']
    
    fieldsets = (
        (_('Basic Info'), {
            'fields': ('title', 'description', 'category', 'event_type')
        }),
        (_('Schedule'), {
            'fields': ('start_datetime', 'end_datetime', 'venue')
        }),
        (_('Registration'), {
            'fields': ('max_participants', 'is_paid', 'price', 'registration_deadline')
        }),
        (_('Details'), {
            'fields': ('requirements', 'agenda', 'tags', 'poster_image')
        }),
        (_('Organization'), {
            'fields': ('created_by', 'club', 'status')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    def current_participants(self, obj):
        return obj.registrations.filter(status='confirmed').count()
    current_participants.short_description = 'Current Participants'


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    """
    Event registration admin interface.
    """
    list_display = ['user', 'event', 'status', 'registration_date', 'checked_in', 'payment_status']
    list_filter = ['status', 'payment_status', 'checked_in', 'registration_date']
    search_fields = ['user__email', 'event__title']
    readonly_fields = ['id', 'registration_date', 'qr_code', 'checked_in_at']
    ordering = ['-registration_date']
    
    fieldsets = (
        (_('Registration Info'), {
            'fields': ('event', 'user', 'status', 'registration_date')
        }),
        (_('QR Code'), {
            'fields': ('qr_code', 'qr_code_image')
        }),
        (_('Payment'), {
            'fields': ('payment_status', 'payment_receipt')
        }),
        (_('Check-in'), {
            'fields': ('checked_in', 'checked_in_at')
        }),
        (_('Notes'), {
            'fields': ('notes',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(EventApproval)
class EventApprovalAdmin(admin.ModelAdmin):
    """
    Event approval admin interface.
    """
    list_display = ['event', 'approver_type', 'status', 'approver', 'reviewed_at']
    list_filter = ['approver_type', 'status', 'reviewed_at']
    search_fields = ['event__title', 'approver__email', 'comments']
    readonly_fields = ['id', 'created_at', 'reviewed_at']
    ordering = ['event', 'approver_type']
    
    def has_add_permission(self, request):
        return False


@admin.register(EventFeedback)
class EventFeedbackAdmin(admin.ModelAdmin):
    """
    Event feedback admin interface.
    """
    list_display = ['event', 'user', 'rating', 'would_recommend', 'created_at']
    list_filter = ['rating', 'would_recommend', 'created_at']
    search_fields = ['event__title', 'user__email', 'comments']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Feedback Info'), {
            'fields': ('event', 'user', 'rating', 'would_recommend')
        }),
        (_('Comments'), {
            'fields': ('comments', 'suggestions')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(EventMedia)
class EventMediaAdmin(admin.ModelAdmin):
    """
    Event media admin interface.
    """
    list_display = ['event', 'title', 'media_type', 'is_approved', 'uploaded_by', 'created_at']
    list_filter = ['media_type', 'is_approved', 'created_at']
    search_fields = ['event__title', 'title', 'uploaded_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Media Info'), {
            'fields': ('event', 'title', 'description', 'media_type')
        }),
        (_('File'), {
            'fields': ('file',)
        }),
        (_('Approval'), {
            'fields': ('is_approved',)
        }),
        (_('Upload Info'), {
            'fields': ('uploaded_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
