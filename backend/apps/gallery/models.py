from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import TimeStampedModel
from apps.core.utils import validate_image_file
import uuid

User = get_user_model()


class Gallery(TimeStampedModel):
    """
    Gallery model for organizing media.
    """
    GALLERY_TYPES = [
        ('event', 'Event'),
        ('club', 'Club'),
        ('general', 'General'),
        ('achievement', 'Achievement'),
        ('campus', 'Campus Life'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    gallery_type = models.CharField(max_length=20, choices=GALLERY_TYPES)
    cover_image = models.ImageField(upload_to='gallery_covers/', null=True, blank=True)
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_galleries'
    )
    
    # Relations
    event = models.ForeignKey(
        'events.Event', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='galleries'
    )
    club = models.ForeignKey(
        'clubs.Club', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='galleries'
    )
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    date_taken = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'galleries'
        verbose_name = 'Gallery'
        verbose_name_plural = 'Galleries'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def media_count(self):
        return self.media_files.filter(is_approved=True).count()
    
    @property
    def total_likes(self):
        return self.media_files.aggregate(
            total=models.Sum('likes_count')
        )['total'] or 0
    
    @property
    def total_comments(self):
        return self.media_files.aggregate(
            total=models.Sum('comments_count')
        )['total'] or 0


class Album(TimeStampedModel):
    """
    Album model for organizing media files within a gallery.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gallery = models.ForeignKey(
        Gallery,
        on_delete=models.CASCADE,
        related_name='albums'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='album_covers/', null=True, blank=True)
    is_public = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_albums'
    )
    
    class Meta:
        db_table = 'albums'
        verbose_name = 'Album'
        verbose_name_plural = 'Albums'
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.gallery.title} - {self.name}"
    
    @property
    def media_count(self):
        return self.media_files.filter(is_approved=True).count()
    
    @property
    def cover_image_url(self):
        if self.cover_image:
            return self.cover_image.url
        # Use first approved image as cover if no cover set
        first_media = self.media_files.filter(
            is_approved=True,
            media_type='image'
        ).first()
        return first_media.file_url if first_media else None


class MediaFile(TimeStampedModel):
    """
    Media file model for photos and videos.
    """
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('document', 'Document'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gallery = models.ForeignKey(
        Gallery, 
        on_delete=models.CASCADE, 
        related_name='media_files'
    )
    album = models.ForeignKey(
        'Album',
        on_delete=models.CASCADE,
        related_name='media_files',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file = models.FileField(upload_to='gallery_media/')
    thumbnail = models.ImageField(upload_to='gallery_thumbnails/', null=True, blank=True)
    
    # File metadata
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)  # For videos
    
    # Moderation
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_approved = models.BooleanField(default=False)
    moderation_notes = models.TextField(blank=True, null=True)
    moderated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='moderated_media'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    # Engagement
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    
    # Upload info
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='uploaded_media'
    )
    
    # Location data
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True, null=True)
    
    # AI analysis results
    ai_tags = models.JSONField(default=list, blank=True)
    ai_description = models.TextField(blank=True, null=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    
    class Meta:
        db_table = 'media_files'
        verbose_name = 'Media File'
        verbose_name_plural = 'Media Files'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gallery', 'status']),
            models.Index(fields=['media_type']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.gallery.title} - {self.title or self.original_filename}"
    
    @property
    def is_image(self):
        return self.media_type == 'image'
    
    @property
    def is_video(self):
        return self.media_type == 'video'
    
    @property
    def file_url(self):
        if self.file:
            return self.file.url
        return None
    
    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        elif self.is_image:
            return self.file.url
        return None
    
    def increment_views(self):
        """Increment view count."""
        self.views_count += 1
        self.save(update_fields=['views_count'])
    
    def approve(self, moderator_user, notes=''):
        """Approve media file."""
        self.status = 'approved'
        self.is_approved = True
        self.moderated_by = moderator_user
        self.moderated_at = timezone.now()
        self.moderation_notes = notes
        self.save()
    
    def reject(self, moderator_user, notes=''):
        """Reject media file."""
        self.status = 'rejected'
        self.is_approved = False
        self.moderated_by = moderator_user
        self.moderated_at = timezone.now()
        self.moderation_notes = notes
        self.save()


class MediaLike(TimeStampedModel):
    """
    Media like model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_file = models.ForeignKey(
        MediaFile, 
        on_delete=models.CASCADE, 
        related_name='likes'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='media_likes'
    )
    
    class Meta:
        db_table = 'media_likes'
        verbose_name = 'Media Like'
        verbose_name_plural = 'Media Likes'
        unique_together = ['media_file', 'user']
        indexes = [
            models.Index(fields=['media_file', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} likes {self.media_file.title}"


class MediaComment(TimeStampedModel):
    """
    Media comment model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_file = models.ForeignKey(
        MediaFile, 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='media_comments'
    )
    comment = models.TextField()
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='replies'
    )
    is_approved = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'media_comments'
        verbose_name = 'Media Comment'
        verbose_name_plural = 'Media Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['media_file', 'is_approved']),
            models.Index(fields=['user']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} commented on {self.media_file.title}"
    
    @property
    def is_reply(self):
        return self.parent is not None
    
    @property
    def replies_count(self):
        return self.replies.filter(is_approved=True).count()


class MediaTag(TimeStampedModel):
    """
    Media tag model for tagging users in photos.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_file = models.ForeignKey(
        MediaFile, 
        on_delete=models.CASCADE, 
        related_name='user_tags'
    )
    tagged_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='photo_tags'
    )
    x_position = models.FloatField(help_text="X position as percentage (0-100)")
    y_position = models.FloatField(help_text="Y position as percentage (0-100)")
    tagged_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_tags'
    )
    
    class Meta:
        db_table = 'media_tags'
        verbose_name = 'Media Tag'
        verbose_name_plural = 'Media Tags'
        unique_together = ['media_file', 'tagged_user']
        indexes = [
            models.Index(fields=['media_file', 'tagged_user']),
            models.Index(fields=['tagged_user']),
        ]
    
    def __str__(self):
        return f"{self.tagged_user.full_name} tagged in {self.media_file.title}"


class MediaCollection(TimeStampedModel):
    """
    Media collection model for organizing favorites.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='media_collections'
    )
    media_files = models.ManyToManyField(
        MediaFile, 
        related_name='collections',
        blank=True
    )
    
    class Meta:
        db_table = 'media_collections'
        verbose_name = 'Media Collection'
        verbose_name_plural = 'Media Collections'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.created_by.full_name}'s {self.name}"
    
    @property
    def media_count(self):
        return self.media_files.count()


class MediaReport(TimeStampedModel):
    """
    Media report model for inappropriate content.
    """
    REPORT_REASONS = [
        ('inappropriate', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('copyright', 'Copyright Violation'),
        ('violence', 'Violence'),
        ('privacy', 'Privacy Violation'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_file = models.ForeignKey(
        MediaFile, 
        on_delete=models.CASCADE, 
        related_name='reports'
    )
    reported_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='media_reports'
    )
    reason = models.CharField(max_length=20, choices=REPORT_REASONS)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_reports'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'media_reports'
        verbose_name = 'Media Report'
        verbose_name_plural = 'Media Reports'
        unique_together = ['media_file', 'reported_by']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report on {self.media_file.title} by {self.reported_by.full_name}"
