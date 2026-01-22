from celery import shared_task
from django.utils import timezone
from django.core.files.storage import default_storage
from .models import MediaFile, Gallery, MediaReport
import logging

logger = logging.getLogger(__name__)


@shared_task
def process_uploaded_media(media_file_id):
    """
    Process uploaded media file (generate thumbnails, extract metadata).
    """
    try:
        media_file = MediaFile.objects.get(id=media_file_id)
        
        # Process image
        if media_file.is_image:
            process_image_metadata(media_file)
            generate_image_thumbnail(media_file)
        
        # Process video
        elif media_file.is_video:
            process_video_metadata(media_file)
            generate_video_thumbnail(media_file)
        
        # AI analysis (placeholder)
        analyze_media_with_ai(media_file)
        
        logger.info(f"Processed media file: {media_file.title or media_file.original_filename}")
        return "Media processed successfully"
        
    except MediaFile.DoesNotExist:
        logger.error(f"Media file {media_file_id} not found")
        return "Media file not found"
    except Exception as e:
        logger.error(f"Media processing error: {e}")
        return f"Error: {str(e)}"


def process_image_metadata(media_file):
    """
    Process image metadata.
    """
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS
        
        with Image.open(media_file.file.path) as img:
            # Get dimensions
            width, height = img.size
            media_file.width = width
            media_file.height = height
            
            # Extract EXIF data
            if hasattr(img, '_getexif') and img._getexif() is not None:
                exif_data = img._getexif()
                for tag, value in exif_data.items():
                    decoded = TAGS.get(tag, tag)
                    if decoded == "DateTime":
                        # Parse date from EXIF
                        from datetime import datetime
                        try:
                            exif_date = datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
                            media_file.date_taken = exif_date.date()
                        except:
                            pass
                    elif decoded == "GPSInfo":
                        # Extract GPS coordinates
                        gps_data = {}
                        for key in value.keys():
                            decoded_tag = TAGS.get(key, key)
                            gps_data[decoded_tag] = value[key]
                        
                        # Convert GPS coordinates to decimal
                        if 'GPSLatitude' in gps_data and 'GPSLongitude' in gps_data:
                            lat = convert_to_decimal(gps_data['GPSLatitude'])
                            lon = convert_to_decimal(gps_data['GPSLongitude'])
                            media_file.gps_latitude = lat
                            media_file.gps_longitude = lon
            
            media_file.save(update_fields=['width', 'height', 'date_taken', 'gps_latitude', 'gps_longitude'])
    
    except Exception as e:
        logger.error(f"Image metadata processing error: {e}")


def convert_to_decimal(gps_coord):
    """
    Convert GPS coordinates to decimal format.
    """
    degrees = gps_coord[0]
    minutes = gps_coord[1]
    seconds = gps_coord[2]
    
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    
    return decimal


def generate_image_thumbnail(media_file):
    """
    Generate thumbnail for image.
    """
    try:
        from PIL import Image
        from io import BytesIO
        from django.core.files.base import ContentFile
        
        with Image.open(media_file.file.path) as img:
            # Create thumbnail
            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumb_io = BytesIO()
            img.save(thumb_io, format='JPEG', quality=85)
            thumb_io.seek(0)
            
            # Save thumbnail file
            thumbnail_name = f"thumb_{media_file.id}.jpg"
            media_file.thumbnail.save(thumbnail_name, ContentFile(thumb_io.read()), save=False)
            media_file.save()
    
    except Exception as e:
        logger.error(f"Image thumbnail generation error: {e}")


def process_video_metadata(media_file):
    """
    Process video metadata.
    """
    try:
        import cv2
        
        # Open video file
        cap = cv2.VideoCapture(media_file.file.path)
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate duration
        if fps > 0:
            duration_seconds = frame_count / fps
            from datetime import timedelta
            media_file.duration = timedelta(seconds=duration_seconds)
        
        media_file.width = width
        media_file.height = height
        media_file.save(update_fields=['width', 'height', 'duration'])
        
        cap.release()
    
    except Exception as e:
        logger.error(f"Video metadata processing error: {e}")


def generate_video_thumbnail(media_file):
    """
    Generate thumbnail for video.
    """
    try:
        import cv2
        from io import BytesIO
        from django.core.files.base import ContentFile
        from PIL import Image
        
        # Open video file
        cap = cv2.VideoCapture(media_file.file.path)
        
        # Get frame at 1 second
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps > 0:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(fps))
        
        ret, frame = cap.read()
        
        if ret:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create PIL image
            img = Image.fromarray(frame_rgb)
            
            # Create thumbnail
            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumb_io = BytesIO()
            img.save(thumb_io, format='JPEG', quality=85)
            thumb_io.seek(0)
            
            # Save thumbnail file
            thumbnail_name = f"thumb_{media_file.id}.jpg"
            media_file.thumbnail.save(thumbnail_name, ContentFile(thumb_io.read()), save=False)
            media_file.save()
        
        cap.release()
    
    except Exception as e:
        logger.error(f"Video thumbnail generation error: {e}")


def analyze_media_with_ai(media_file):
    """
    Analyze media with AI (placeholder implementation).
    """
    try:
        # This would integrate with an AI service like:
        # - Google Vision API
        # - AWS Rekognition
        # - Custom ML model
        
        # For now, we'll add some basic analysis
        ai_tags = []
        ai_description = ""
        confidence = 0.0
        
        if media_file.is_image:
            # Basic image analysis based on filename and gallery
            filename_lower = media_file.original_filename.lower()
            
            # Add tags based on filename
            if 'event' in filename_lower or media_file.gallery.gallery_type == 'event':
                ai_tags.append('event')
            if 'club' in filename_lower or media_file.gallery.gallery_type == 'club':
                ai_tags.append('club')
            if 'campus' in filename_lower:
                ai_tags.append('campus')
            if 'student' in filename_lower:
                ai_tags.append('students')
            
            # Generate basic description
            ai_description = f"Media from {media_file.gallery.title}"
            confidence = 0.7
        
        # Save AI results
        media_file.ai_tags = ai_tags
        media_file.ai_description = ai_description
        media_file.ai_confidence = confidence
        media_file.save(update_fields=['ai_tags', 'ai_description', 'ai_confidence'])
        
        logger.info(f"AI analysis completed for {media_file.title or media_file.original_filename}")
    
    except Exception as e:
        logger.error(f"AI analysis error: {e}")


@shared_task
def cleanup_unused_media():
    """
    Clean up unused media files (files without approved media records).
    """
    try:
        # Get all file paths in media directory
        media_files = MediaFile.objects.all()
        used_files = set()
        
        for media_file in media_files:
            if media_file.file:
                used_files.add(media_file.file.name)
            if media_file.thumbnail:
                used_files.add(media_file.thumbnail.name)
        
        # Get all files in storage
        all_files = set()
        for root, dirs, files in default_storage.walk('gallery_media/'):
            for file in files:
                all_files.add(f'gallery_media/{file}')
        
        for root, dirs, files in default_storage.walk('gallery_thumbnails/'):
            for file in files:
                all_files.add(f'gallery_thumbnails/{file}')
        
        # Delete unused files
        unused_files = all_files - used_files
        deleted_count = 0
        
        for file_path in unused_files:
            try:
                default_storage.delete(file_path)
                deleted_count += 1
            except Exception as e:
                logger.error(f"Failed to delete unused file {file_path}: {e}")
        
        logger.info(f"Cleaned up {deleted_count} unused media files")
        return f"Deleted {deleted_count} unused files"
    
    except Exception as e:
        logger.error(f"Media cleanup error: {e}")
        return f"Error: {str(e)}"


@shared_task
def update_media_statistics():
    """
    Update media statistics.
    """
    try:
        from apps.core.models import SystemSetting
        
        # Calculate statistics
        total_media = MediaFile.objects.count()
        approved_media = MediaFile.objects.filter(is_approved=True).count()
        total_galleries = Gallery.objects.count()
        
        # Update system settings
        SystemSetting.set_value('total_media', str(total_media), 'Total media files')
        SystemSetting.set_value('approved_media', str(approved_media), 'Approved media files')
        SystemSetting.set_value('total_galleries', str(total_galleries), 'Total galleries')
        
        # Calculate engagement statistics
        total_likes = MediaFile.objects.aggregate(total=models.Sum('likes_count'))['total'] or 0
        total_comments = MediaFile.objects.aggregate(total=models.Sum('comments_count'))['total'] or 0
        
        SystemSetting.set_value('total_media_likes', str(total_likes), 'Total media likes')
        SystemSetting.set_value('total_media_comments', str(total_comments), 'Total media comments')
        
        logger.info("Updated media statistics")
        return "Statistics updated successfully"
    
    except Exception as e:
        logger.error(f"Media statistics update error: {e}")
        return f"Error: {str(e)}"


@shared_task
def auto_approve_safe_content():
    """
    Auto-approve media that passes basic safety checks.
    """
    try:
        from .models import MediaFile
        
        # Get pending media from trusted users
        pending_media = MediaFile.objects.filter(
            status='pending',
            uploaded_by__role__in=['admin', 'approver', 'organizer']
        )
        
        approved_count = 0
        
        for media_file in pending_media:
            # Basic safety checks
            if is_safe_content(media_file):
                media_file.approve(None, "Auto-approved: Trusted user content")
                approved_count += 1
        
        logger.info(f"Auto-approved {approved_count} media files")
        return f"Auto-approved {approved_count} files"
    
    except Exception as e:
        logger.error(f"Auto-approval error: {e}")
        return f"Error: {str(e)}"


def is_safe_content(media_file):
    """
    Basic content safety check.
    """
    try:
        # Check file size (very large files might be suspicious)
        if media_file.file_size > 100 * 1024 * 1024:  # 100MB
            return False
        
        # Check file extension
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov']
        file_extension = media_file.original_filename.split('.')[-1].lower()
        
        if file_extension not in allowed_extensions:
            return False
        
        # Check for suspicious keywords in filename
        suspicious_keywords = ['virus', 'malware', 'hack', 'exploit']
        filename_lower = media_file.original_filename.lower()
        
        for keyword in suspicious_keywords:
            if keyword in filename_lower:
                return False
        
        return True
    
    except Exception as e:
        logger.error(f"Content safety check error: {e}")
        return False
