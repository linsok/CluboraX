from rest_framework import serializers
from django.utils import timezone
from .models import (
    Gallery, MediaFile, MediaLike, MediaComment, MediaTag,
    MediaCollection, MediaReport
)
from apps.users.serializers import UserProfileSerializer
from apps.core.utils import validate_image_file
import logging

logger = logging.getLogger(__name__)


class GallerySerializer(serializers.ModelSerializer):
    """
    Gallery serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    media_count = serializers.ReadOnlyField()
    total_likes = serializers.ReadOnlyField()
    total_comments = serializers.ReadOnlyField()
    cover_image_url = serializers.SerializerMethodField()
    event_title = serializers.CharField(source='event.title', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    gallery_type_display = serializers.CharField(source='get_gallery_type_display', read_only=True)
    
    class Meta:
        model = Gallery
        fields = [
            'id', 'title', 'description', 'gallery_type', 'gallery_type_display',
            'cover_image', 'cover_image_url', 'is_public', 'is_featured',
            'created_by', 'event', 'event_title', 'club', 'club_name',
            'tags', 'location', 'date_taken', 'media_count',
            'total_likes', 'total_comments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'media_count', 'total_likes', 'total_comments',
            'created_at', 'updated_at'
        ]
    
    def get_cover_image_url(self, obj):
        """
        Get cover image URL.
        """
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def validate_cover_image(self, value):
        """
        Validate cover image.
        """
        if value:
            is_valid, error_message = validate_image_file(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value
    
    def validate_date_taken(self, value):
        """
        Validate date taken is not in future.
        """
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Date taken cannot be in the future.")
        return value


class GalleryCreateSerializer(GallerySerializer):
    """
    Gallery creation serializer.
    """
    class Meta(GallerySerializer.Meta):
        read_only_fields = GallerySerializer.Meta.read_only_fields


class MediaFileSerializer(serializers.ModelSerializer):
    """
    Media file serializer.
    """
    uploaded_by = UserProfileSerializer(read_only=True)
    gallery_title = serializers.CharField(source='gallery.title', read_only=True)
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    is_image = serializers.ReadOnlyField()
    is_video = serializers.ReadOnlyField()
    
    class Meta:
        model = MediaFile
        fields = [
            'id', 'gallery', 'gallery_title', 'title', 'description',
            'media_type', 'media_type_display', 'file', 'file_url',
            'thumbnail', 'thumbnail_url', 'original_filename', 'file_size',
            'width', 'height', 'duration', 'status', 'status_display',
            'is_approved', 'moderation_notes', 'likes_count', 'comments_count',
            'views_count', 'uploaded_by', 'gps_latitude', 'gps_longitude',
            'location_name', 'ai_tags', 'ai_description', 'ai_confidence',
            'is_image', 'is_video', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'original_filename', 'file_size', 'width', 'height',
            'duration', 'likes_count', 'comments_count', 'views_count',
            'uploaded_by', 'ai_tags', 'ai_description', 'ai_confidence',
            'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        """
        Get file URL.
        """
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_thumbnail_url(self, obj):
        """
        Get thumbnail URL.
        """
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        elif obj.is_image and obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def validate_file(self, value):
        """
        Validate uploaded file.
        """
        # Check file size
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be less than 50MB.")
        
        # Store original filename and file size
        self.validated_data['original_filename'] = value.name
        self.validated_data['file_size'] = value.size
        
        return value


class MediaFileCreateSerializer(MediaFileSerializer):
    """
    Media file creation serializer.
    """
    class Meta(MediaFileSerializer.Meta):
        read_only_fields = MediaFileSerializer.Meta.read_only_fields + ['status', 'is_approved']
    
    def create(self, validated_data):
        """
        Create media file with additional processing.
        """
        user = self.context['request'].user
        
        # Set uploaded_by
        validated_data['uploaded_by'] = user
        
        # Extract file metadata
        file = validated_data.get('file')
        if file:
            # Determine media type from file extension
            file_extension = file.name.split('.')[-1].lower()
            if file_extension in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                validated_data['media_type'] = 'image'
            elif file_extension in ['mp4', 'avi', 'mov', 'wmv']:
                validated_data['media_type'] = 'video'
            else:
                validated_data['media_type'] = 'document'
        
        # Create media file
        media_file = super().create(validated_data)
        
        # Process image dimensions (placeholder)
        if media_file.is_image:
            self.process_image_dimensions(media_file)
        
        # Generate thumbnail for images and videos
        if media_file.is_image or media_file.is_video:
            self.generate_thumbnail(media_file)
        
        return media_file
    
    def process_image_dimensions(self, media_file):
        """
        Process image dimensions.
        """
        try:
            from PIL import Image
            
            with Image.open(media_file.file.path) as img:
                width, height = img.size
                media_file.width = width
                media_file.height = height
                media_file.save(update_fields=['width', 'height'])
                
        except Exception as e:
            logger.error(f"Failed to process image dimensions: {e}")
    
    def generate_thumbnail(self, media_file):
        """
        Generate thumbnail for media file.
        """
        try:
            from PIL import Image
            from io import BytesIO
            from django.core.files.base import ContentFile
            
            if media_file.is_image:
                # Generate thumbnail from image
                with Image.open(media_file.file.path) as img:
                    img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                    
                    # Save thumbnail
                    thumb_io = BytesIO()
                    img.save(thumb_io, format='JPEG', quality=85)
                    thumb_io.seek(0)
                    
                    # Create thumbnail filename
                    thumbnail_name = f"thumb_{media_file.id}.jpg"
                    media_file.thumbnail.save(thumbnail_name, ContentFile(thumb_io.read()), save=False)
                    media_file.save()
                    
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")


class MediaLikeSerializer(serializers.ModelSerializer):
    """
    Media like serializer.
    """
    user = UserProfileSerializer(read_only=True)
    media_title = serializers.CharField(source='media_file.title', read_only=True)
    
    class Meta:
        model = MediaLike
        fields = ['id', 'media_file', 'media_title', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MediaCommentSerializer(serializers.ModelSerializer):
    """
    Media comment serializer.
    """
    user = UserProfileSerializer(read_only=True)
    media_title = serializers.CharField(source='media_file.title', read_only=True)
    replies = serializers.SerializerMethodField()
    is_reply = serializers.ReadOnlyField()
    replies_count = serializers.ReadOnlyField()
    
    class Meta:
        model = MediaComment
        fields = [
            'id', 'media_file', 'media_title', 'user', 'comment',
            'parent', 'is_approved', 'replies', 'is_reply',
            'replies_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        """
        Get replies to this comment.
        """
        if obj.is_reply:
            return []
        
        replies = obj.replies.filter(is_approved=True).order_by('created_at')
        return MediaCommentSerializer(replies, many=True, context=self.context).data


class MediaCommentCreateSerializer(serializers.ModelSerializer):
    """
    Media comment creation serializer.
    """
    class Meta:
        model = MediaComment
        fields = ['media_file', 'comment', 'parent']
    
    def validate_parent(self, value):
        """
        Validate parent comment.
        """
        if value and value.media_file_id != self.initial_data.get('media_file'):
            raise serializers.ValidationError("Parent comment must belong to the same media file.")
        return value


class MediaTagSerializer(serializers.ModelSerializer):
    """
    Media tag serializer.
    """
    tagged_user = UserProfileSerializer(read_only=True)
    tagged_by = UserProfileSerializer(read_only=True)
    media_title = serializers.CharField(source='media_file.title', read_only=True)
    
    class Meta:
        model = MediaTag
        fields = [
            'id', 'media_file', 'media_title', 'tagged_user', 'tagged_by',
            'x_position', 'y_position', 'created_at'
        ]
        read_only_fields = ['id', 'tagged_by', 'created_at']
    
    def validate_x_position(self, value):
        """
        Validate X position.
        """
        if not 0 <= value <= 100:
            raise serializers.ValidationError("X position must be between 0 and 100.")
        return value
    
    def validate_y_position(self, value):
        """
        Validate Y position.
        """
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Y position must be between 0 and 100.")
        return value


class MediaCollectionSerializer(serializers.ModelSerializer):
    """
    Media collection serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    media_count = serializers.ReadOnlyField()
    media_files = MediaFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = MediaCollection
        fields = [
            'id', 'name', 'description', 'is_public', 'created_by',
            'media_count', 'media_files', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class MediaReportSerializer(serializers.ModelSerializer):
    """
    Media report serializer.
    """
    reported_by = UserProfileSerializer(read_only=True)
    media_title = serializers.CharField(source='media_file.title', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MediaReport
        fields = [
            'id', 'media_file', 'media_title', 'reported_by', 'reason',
            'reason_display', 'description', 'status', 'status_display',
            'reviewed_by', 'reviewed_at', 'resolution_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reported_by', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at'
        ]


class MediaReportCreateSerializer(serializers.ModelSerializer):
    """
    Media report creation serializer.
    """
    class Meta:
        model = MediaReport
        fields = ['media_file', 'reason', 'description']
    
    def validate_media_file(self, value):
        """
        Validate media file.
        """
        user = self.context['request'].user
        
        # Check if user already reported this media file
        if MediaReport.objects.filter(media_file=value, reported_by=user).exists():
            raise serializers.ValidationError("You have already reported this media file.")
        
        return value


class GalleryListSerializer(serializers.ModelSerializer):
    """
    Gallery list serializer (for overview).
    """
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    media_count = serializers.ReadOnlyField()
    total_likes = serializers.ReadOnlyField()
    cover_image_url = serializers.SerializerMethodField()
    gallery_type_display = serializers.CharField(source='get_gallery_type_display', read_only=True)
    
    class Meta:
        model = Gallery
        fields = [
            'id', 'title', 'gallery_type', 'gallery_type_display',
            'cover_image', 'cover_image_url', 'is_public', 'is_featured',
            'created_by_name', 'media_count', 'total_likes', 'created_at'
        ]
    
    def get_cover_image_url(self, obj):
        """
        Get cover image URL.
        """
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None


class MediaStatsSerializer(serializers.Serializer):
    """
    Media statistics serializer.
    """
    total_media = serializers.IntegerField()
    total_galleries = serializers.IntegerField()
    total_likes = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    media_by_type = serializers.JSONField()
    media_by_gallery = serializers.JSONField()
    recent_uploads = serializers.JSONField()
