from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import MediaFile, MediaLike, MediaComment, MediaTag, MediaReport
from apps.core.utils import send_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=MediaFile)
def media_file_post_save(sender, instance, created, **kwargs):
    """
    Handle media file post-save signals.
    """
    if created:
        # Send notification to gallery owner if different from uploader
        if instance.gallery.created_by != instance.uploaded_by:
            send_notification(
                instance.gallery.created_by,
                'New Media Upload',
                f'{instance.uploaded_by.full_name} uploaded media to "{instance.gallery.title}"',
                'system'
            )
        
        # Log creation
        logger.info(f"Media file uploaded: {instance.title or instance.original_filename}")


@receiver(post_save, sender=MediaLike)
def media_like_post_save(sender, instance, created, **kwargs):
    """
    Handle media like post-save signals.
    """
    if created:
        # Update likes count is handled in the view
        logger.info(f"Media liked: {instance.media_file.title} by {instance.user.full_name}")


@receiver(post_delete, sender=MediaLike)
def media_like_post_delete(sender, instance, **kwargs):
    """
    Handle media like post-delete signals.
    """
    # Update likes count
    media_file = instance.media_file
    media_file.likes_count = max(0, media_file.likes_count - 1)
    media_file.save(update_fields=['likes_count'])
    
    logger.info(f"Media unliked: {media_file.title} by {instance.user.full_name}")


@receiver(post_save, sender=MediaComment)
def media_comment_post_save(sender, instance, created, **kwargs):
    """
    Handle media comment post-save signals.
    """
    if created:
        # Update comments count is handled in the view
        logger.info(f"Comment added to {instance.media_file.title} by {instance.user.full_name}")


@receiver(post_delete, sender=MediaComment)
def media_comment_post_delete(sender, instance, **kwargs):
    """
    Handle media comment post-delete signals.
    """
    # Update comments count
    media_file = instance.media_file
    media_file.comments_count = max(0, media_file.comments_count - 1)
    media_file.save(update_fields=['comments_count'])
    
    logger.info(f"Comment deleted from {media_file.title}")


@receiver(post_save, sender=MediaTag)
def media_tag_post_save(sender, instance, created, **kwargs):
    """
    Handle media tag post-save signals.
    """
    if created:
        # Notification is handled in the view
        logger.info(f"User tagged: {instance.tagged_user.full_name} in {instance.media_file.title}")


@receiver(post_save, sender=MediaReport)
def media_report_post_save(sender, instance, created, **kwargs):
    """
    Handle media report post-save signals.
    """
    if created:
        # Notification is handled in the view
        logger.info(f"Media reported: {instance.media_file.title} for {instance.get_reason_display()}")
    
    elif not created and hasattr(instance, '_old_status'):
        old_status = instance._old_status
        if old_status != instance.status:
            # Status changed
            if instance.status == 'resolved':
                send_notification(
                    instance.reported_by,
                    'Report Resolved',
                    f'Your report on "{instance.media_file.title}" has been resolved',
                    'system'
                )
            elif instance.status == 'dismissed':
                send_notification(
                    instance.reported_by,
                    'Report Dismissed',
                    f'Your report on "{instance.media_file.title}" has been dismissed',
                    'system'
                )


@receiver(pre_save, sender=MediaReport)
def media_report_pre_save(sender, instance, **kwargs):
    """
    Store old status before saving.
    """
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            pass
