from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Gallery, MediaFile, MediaLike, MediaComment, MediaTag,
    MediaCollection, MediaReport
)


@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    """
    Gallery admin interface.
    """
    list_display = ['title', 'gallery_type', 'is_public', 'is_featured', 'created_by', 'media_count']
    list_filter = ['gallery_type', 'is_public', 'is_featured', 'created_at']
    search_fields = ['title', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Basic Info'), {
            'fields': ('title', 'description', 'gallery_type', 'cover_image')
        }),
        (_('Settings'), {
            'fields': ('is_public', 'is_featured')
        }),
        (_('Relations'), {
            'fields': ('event', 'club')
        }),
        (_('Metadata'), {
            'fields': ('tags', 'location', 'date_taken')
        }),
        (_('Created By'), {
            'fields': ('created_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    def media_count(self, obj):
        return obj.media_count
    media_count.short_description = 'Media Files'


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    """
    Media file admin interface.
    """
    list_display = ['title', 'media_type', 'gallery', 'status', 'likes_count', 'comments_count', 'uploaded_by']
    list_filter = ['media_type', 'status', 'is_approved', 'created_at']
    search_fields = ['title', 'description', 'original_filename', 'uploaded_by__email']
    readonly_fields = ['id', 'original_filename', 'file_size', 'width', 'height', 'duration', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Media Info'), {
            'fields': ('gallery', 'title', 'description', 'media_type', 'file')
        }),
        (_('Thumbnail'), {
            'fields': ('thumbnail',)
        }),
        (_('File Metadata'), {
            'fields': ('original_filename', 'file_size', 'width', 'height', 'duration')
        }),
        (_('Moderation'), {
            'fields': ('status', 'is_approved', 'moderation_notes', 'moderated_by', 'moderated_at')
        }),
        (_('Engagement'), {
            'fields': ('likes_count', 'comments_count', 'views_count')
        }),
        (_('Location'), {
            'fields': ('gps_latitude', 'gps_longitude', 'location_name')
        }),
        (_('AI Analysis'), {
            'fields': ('ai_tags', 'ai_description', 'ai_confidence')
        }),
        (_('Uploaded By'), {
            'fields': ('uploaded_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(MediaLike)
class MediaLikeAdmin(admin.ModelAdmin):
    """
    Media like admin interface.
    """
    list_display = ['media_file', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['media_file__title', 'user__email']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        return False


@admin.register(MediaComment)
class MediaCommentAdmin(admin.ModelAdmin):
    """
    Media comment admin interface.
    """
    list_display = ['media_file', 'user', 'comment_preview', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['media_file__title', 'user__email', 'comment']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'


@admin.register(MediaTag)
class MediaTagAdmin(admin.ModelAdmin):
    """
    Media tag admin interface.
    """
    list_display = ['media_file', 'tagged_user', 'tagged_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['media_file__title', 'tagged_user__email', 'tagged_by__email']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        return False


@admin.register(MediaCollection)
class MediaCollectionAdmin(admin.ModelAdmin):
    """
    Media collection admin interface.
    """
    list_display = ['name', 'created_by', 'is_public', 'media_count']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Collection Info'), {
            'fields': ('name', 'description', 'is_public')
        }),
        (_('Media Files'), {
            'fields': ('media_files',)
        }),
        (_('Created By'), {
            'fields': ('created_by',)
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    def media_count(self, obj):
        return obj.media_count
    media_count.short_description = 'Media Files'


@admin.register(MediaReport)
class MediaReportAdmin(admin.ModelAdmin):
    """
    Media report admin interface.
    """
    list_display = ['media_file', 'reported_by', 'reason', 'status', 'created_at']
    list_filter = ['reason', 'status', 'created_at']
    search_fields = ['media_file__title', 'reported_by__email', 'description']
    readonly_fields = ['id', 'reported_by', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Report Info'), {
            'fields': ('media_file', 'reported_by', 'reason', 'description')
        }),
        (_('Status'), {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'resolution_notes')
        }),
        (_('Timestamps'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
