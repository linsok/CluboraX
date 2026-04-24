from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Gallery, MediaFile, MediaLike, MediaComment, MediaTag,
    MediaCollection, MediaReport
)
from .serializers import (
    GallerySerializer, GalleryCreateSerializer, GalleryListSerializer,
    MediaFileSerializer, MediaFileCreateSerializer,
    MediaLikeSerializer, MediaCommentSerializer, MediaCommentCreateSerializer,
    MediaTagSerializer, MediaCollectionSerializer, MediaReportSerializer,
    MediaReportCreateSerializer, MediaStatsSerializer
)
from apps.core.permissions import IsOwnerOrAdmin, IsClubMember
from apps.core.utils import send_notification, log_user_action
import logging

logger = logging.getLogger(__name__)


class GalleryListCreateView(generics.ListCreateAPIView):
    """
    Gallery list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gallery_type', 'is_public', 'is_featured', 'event', 'club']
    search_fields = ['title', 'description', 'location', 'tags']
    ordering_fields = ['created_at', 'title', 'media_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get galleries based on user role and filters.
        """
        user = self.request.user
        queryset = Gallery.objects.all()
        
        # Filter by visibility based on user role
        if user.role == 'student':
            # Students can see public galleries and galleries they're members of
            user_clubs = user.club_memberships.filter(status='approved').values_list('club_id', flat=True)
            queryset = queryset.filter(
                Q(is_public=True) | Q(club_id__in=user_clubs)
            )
        elif user.role == 'organizer':
            # Organizers can see their own galleries and public galleries
            queryset = queryset.filter(
                Q(created_by=user) | Q(is_public=True)
            )
        elif user.role in ['approver', 'admin']:
            # Approvers and admins can see all galleries
            pass
        
        # Additional filters
        my_galleries = self.request.query_params.get('my_galleries')
        if my_galleries == 'true':
            queryset = queryset.filter(created_by=user)
        
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return GalleryCreateSerializer
        return GalleryListSerializer
    
    def perform_create(self, serializer):
        """
        Create gallery with current user and handle uploaded images.
        """
        gallery = serializer.save(created_by=self.request.user)
        
        # Get album name from request (default to "Default Album" if not provided)
        album_name = self.request.data.get('album_name', 'Default Album')
        
        # Check if album already exists for this gallery with this name
        from apps.gallery.models import Album
        album, created = Album.objects.get_or_create(
            gallery=gallery,
            name=album_name,
            defaults={
                'created_by': self.request.user,
                'description': self.request.data.get('album_description', ''),
                'is_public': True
            }
        )
        
        # Handle multiple image uploads
        images = self.request.FILES.getlist('images')
        if images:
            first_image = True
            for image in images:
                media_file = MediaFile.objects.create(
                    gallery=gallery,
                    album=album,
                    title=f"{gallery.title} - Image",
                    media_type='image',
                    file=image,
                    original_filename=image.name,
                    file_size=image.size,
                    uploaded_by=self.request.user,
                    status='approved',  # Auto-approve for organizers
                    is_approved=True
                )
                # Set first image as album cover
                if first_image and not album.cover_image:
                    album.cover_image = media_file.file
                    album.save(update_fields=['cover_image'])
                # Set first image as gallery cover
                if first_image and not gallery.cover_image:
                    gallery.cover_image = media_file.file
                    gallery.save(update_fields=['cover_image'])
                    first_image = False
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'Gallery',
            gallery.id,
            new_values=serializer.data
        )


class GalleryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Gallery detail view.
    """
    serializer_class = GallerySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """
        Get galleries based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            # Students can see public galleries and galleries they're members of
            user_clubs = user.club_memberships.filter(status='approved').values_list('club_id', flat=True)
            return Gallery.objects.filter(
                Q(is_public=True) | Q(club_id__in=user_clubs)
            )
        elif user.role == 'organizer':
            return Gallery.objects.filter(
                Q(created_by=user) | Q(is_public=True)
            )
        else:
            return Gallery.objects.all()
    
    def perform_update(self, serializer):
        """
        Update gallery and log action.
        """
        old_values = Gallery.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'Gallery',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )
    
    def perform_destroy(self, instance):
        """
        Delete gallery and log action.
        """
        gallery_id = str(instance.id)
        instance.delete()
        
        # Log user action
        log_user_action(
            self.request,
            'delete',
            'Gallery',
            gallery_id
        )


class MediaFileListCreateView(generics.ListCreateAPIView):
    """
    Media file list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gallery', 'media_type', 'status', 'is_approved']
    search_fields = ['title', 'description', 'original_filename', 'tags']
    ordering_fields = ['created_at', 'title', 'likes_count', 'views_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get media files based on user role and filters.
        """
        user = self.request.user
        queryset = MediaFile.objects.all()
        
        # Filter by approval status based on user role
        if user.role == 'student':
            # Students can only see approved media
            queryset = queryset.filter(is_approved=True)
        elif user.role == 'organizer':
            # Organizers can see their own media (all statuses) and approved media
            queryset = queryset.filter(
                Q(uploaded_by=user) | Q(is_approved=True)
            )
        elif user.role in ['approver', 'admin']:
            # Approvers and admins can see all media
            pass
        
        # Filter by gallery access
        gallery_id = self.request.query_params.get('gallery')
        if gallery_id:
            gallery = Gallery.objects.filter(id=gallery_id).first()
            if gallery and not gallery.is_public:
                # Check if user has access to private gallery
                if user.role == 'student':
                    user_clubs = user.club_memberships.filter(status='approved').values_list('club_id', flat=True)
                    if gallery.club_id not in user_clubs and gallery.created_by != user:
                        queryset = MediaFile.objects.none()
                elif user.role == 'organizer':
                    if gallery.created_by != user and not gallery.is_public:
                        queryset = MediaFile.objects.none()
        
        # Additional filters
        my_media = self.request.query_params.get('my_media')
        if my_media == 'true':
            queryset = queryset.filter(uploaded_by=user)
        
        liked = self.request.query_params.get('liked')
        if liked == 'true':
            liked_media = user.media_likes.values_list('media_file_id', flat=True)
            queryset = queryset.filter(id__in=liked_media)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return MediaFileCreateSerializer
        return MediaFileSerializer
    
    def perform_create(self, serializer):
        """
        Create media file with current user.
        """
        media_file = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'MediaFile',
            media_file.id,
            new_values=serializer.data
        )


class MediaFileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Media file detail view.
    """
    serializer_class = MediaFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get media files based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return MediaFile.objects.filter(is_approved=True)
        elif user.role == 'organizer':
            return MediaFile.objects.filter(
                Q(uploaded_by=user) | Q(is_approved=True)
            )
        else:
            return MediaFile.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve media file and increment view count.
        """
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        """
        Update media file and log action.
        """
        old_values = MediaFile.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'MediaFile',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class MediaLikeCreateDestroyView(APIView):
    """
    Media like create/destroy view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, media_file_id):
        """
        Like or unlike media file.
        """
        try:
            media_file = MediaFile.objects.get(id=media_file_id, is_approved=True)
            user = request.user
            
            # Toggle like
            like, created = MediaLike.objects.get_or_create(
                media_file=media_file,
                user=user
            )
            
            if created:
                # Increment likes count
                media_file.likes_count += 1
                media_file.save(update_fields=['likes_count'])
                
                # Send notification to media owner
                if media_file.uploaded_by != user:
                    send_notification(
                        media_file.uploaded_by,
                        'New Like',
                        f'{user.full_name} liked your photo "{media_file.title or media_file.original_filename}"',
                        'system'
                    )
                
                message = 'Media liked successfully'
                is_liked = True
            else:
                # Unlike
                like.delete()
                media_file.likes_count -= 1
                media_file.save(update_fields=['likes_count'])
                
                message = 'Media unliked successfully'
                is_liked = False
            
            # Log user action
            action = 'like' if created else 'unlike'
            log_user_action(
                request,
                action,
                'MediaLike',
                str(media_file.id)
            )
            
            return Response({
                'success': True,
                'message': message,
                'data': {
                    'is_liked': is_liked,
                    'likes_count': media_file.likes_count
                }
            })
            
        except MediaFile.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Media file not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Media like error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to process like'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaCommentListCreateView(generics.ListCreateAPIView):
    """
    Media comment list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['media_file', 'parent']
    
    def get_queryset(self):
        """
        Get comments based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return MediaComment.objects.filter(is_approved=True)
        elif user.role == 'organizer':
            return MediaComment.objects.filter(
                Q(is_approved=True) | Q(media_file__uploaded_by=user)
            )
        else:
            return MediaComment.objects.all()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return MediaCommentCreateSerializer
        return MediaCommentSerializer
    
    def perform_create(self, serializer):
        """
        Create comment and update count.
        """
        comment = serializer.save()
        
        # Update comments count
        media_file = comment.media_file
        media_file.comments_count += 1
        media_file.save(update_fields=['comments_count'])
        
        # Send notification to media owner
        if media_file.uploaded_by != comment.user:
            send_notification(
                media_file.uploaded_by,
                'New Comment',
                f'{comment.user.full_name} commented on your photo',
                'system'
            )
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'MediaComment',
            comment.id,
            new_values=serializer.data
        )


class MediaTagListCreateView(generics.ListCreateAPIView):
    """
    Media tag list and create view.
    """
    serializer_class = MediaTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['media_file', 'tagged_user']
    
    def get_queryset(self):
        """
        Get tags based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return MediaTag.objects.filter(
                Q(media_file__is_approved=True) |
                Q(tagged_user=user)
            )
        elif user.role == 'organizer':
            return MediaTag.objects.filter(
                Q(media_file__uploaded_by=user) |
                Q(media_file__is_approved=True)
            )
        else:
            return MediaTag.objects.all()
    
    def perform_create(self, serializer):
        """
        Create tag and send notification.
        """
        tag = serializer.save(tagged_by=self.request.user)
        
        # Send notification to tagged user
        if tag.tagged_user != tag.tagged_by:
            send_notification(
                tag.tagged_user,
                'Photo Tag',
                f'{tag.tagged_by.full_name} tagged you in a photo',
                'system'
            )
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'MediaTag',
            tag.id,
            new_values=serializer.data
        )


class MediaCollectionListCreateView(generics.ListCreateAPIView):
    """
    Media collection list and create view.
    """
    serializer_class = MediaCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_public']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        """
        Get collections based on user role.
        """
        user = self.request.user
        
        if user.role == 'student':
            return MediaCollection.objects.filter(
                Q(is_public=True) | Q(created_by=user)
            )
        elif user.role == 'organizer':
            return MediaCollection.objects.filter(
                Q(is_public=True) | Q(created_by=user)
            )
        else:
            return MediaCollection.objects.all()
    
    def perform_create(self, serializer):
        """
        Create collection with current user.
        """
        collection = serializer.save(created_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'MediaCollection',
            collection.id,
            new_values=serializer.data
        )


class MediaReportListCreateView(generics.ListCreateAPIView):
    """
    Media report list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get reports based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return MediaReport.objects.all()
        elif user.role == 'approver':
            return MediaReport.objects.all()
        else:
            return MediaReport.objects.filter(reported_by=user)
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return MediaReportCreateSerializer
        return MediaReportSerializer
    
    def perform_create(self, serializer):
        """
        Create report and send notification.
        """
        report = serializer.save(reported_by=self.request.user)
        
        # Send notification to admins
        from apps.users.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        
        for admin in admins:
            send_notification(
                admin,
                'New Media Report',
                f'A media file has been reported for {report.get_reason_display()}',
                'system'
            )
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'MediaReport',
            report.id,
            new_values=serializer.data
        )


class MediaModerationView(APIView):
    """
    Media moderation view for admins and approvers.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, media_file_id):
        """
        Approve or reject media file.
        """
        try:
            media_file = MediaFile.objects.get(id=media_file_id)
            
            # Check permissions
            user = request.user
            if user.role not in ['admin', 'approver']:
                return Response({
                    'error': True,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            if action == 'approve':
                media_file.approve(user, notes)
                message = 'Media approved successfully'
            elif action == 'reject':
                media_file.reject(user, notes)
                message = 'Media rejected successfully'
            else:
                return Response({
                    'error': True,
                    'message': 'Invalid action'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Send notification to uploader
            send_notification(
                media_file.uploaded_by,
                f'Media {action.title()}',
                f'Your media "{media_file.title or media_file.original_filename}" has been {action}d',
                'system'
            )
            
            # Log user action
            log_user_action(
                request,
                action,
                'MediaFile',
                media_file.id,
                new_values={'status': media_file.status, 'moderation_notes': notes}
            )
            
            return Response({
                'success': True,
                'message': message,
                'data': MediaFileSerializer(media_file, context={'request': request}).data
            })
            
        except MediaFile.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Media file not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Media moderation error: {e}")
            return Response({
                'error': True,
                'message': 'Moderation failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaStatsView(APIView):
    """
    Media statistics view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get media statistics.
        """
        try:
            user = request.user
            
            # Base queryset
            if user.role == 'student':
                media_files = MediaFile.objects.filter(is_approved=True)
                galleries = Gallery.objects.filter(is_public=True)
            elif user.role == 'organizer':
                media_files = MediaFile.objects.filter(uploaded_by=user)
                galleries = Gallery.objects.filter(created_by=user)
            else:
                media_files = MediaFile.objects.all()
                galleries = Gallery.objects.all()
            
            # Calculate statistics
            stats = {
                'total_media': media_files.count(),
                'total_galleries': galleries.count(),
                'total_likes': media_files.aggregate(total=Sum('likes_count'))['total'] or 0,
                'total_comments': media_files.aggregate(total=Sum('comments_count'))['total'] or 0,
            }
            
            # Media by type
            media_by_type = media_files.values('media_type').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['media_by_type'] = list(media_by_type)
            
            # Media by gallery
            media_by_gallery = media_files.values('gallery__title').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            stats['media_by_gallery'] = list(media_by_gallery)
            
            # Recent uploads
            recent_uploads = media_files.order_by('-created_at')[:5]
            stats['recent_uploads'] = MediaFileSerializer(
                recent_uploads, many=True, context={'request': request}
            ).data
            
            serializer = MediaStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Media stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
