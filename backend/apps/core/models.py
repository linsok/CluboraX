from django.db import models
from django.utils import timezone
import uuid


class TimeStampedModel(models.Model):
    """Abstract base model with created and updated timestamps."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """Manager for soft delete functionality."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def include_deleted(self):
        return super().get_queryset()

    def deleted(self):
        return super().get_queryset().filter(is_deleted=True)


class SoftDeleteModel(TimeStampedModel):
    """Abstract model with soft delete functionality."""
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft delete the model instance."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self, using=None, keep_parents=False):
        """Permanently delete the model instance."""
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """Restore a soft-deleted instance."""
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class AuditLog(models.Model):
    """Model to track changes to other models."""
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('restore', 'Restored'),
    ]

    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    table_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f'{self.user} {self.action} {self.table_name}:{self.record_id}'


class SystemSetting(models.Model):
    """Model for system-wide settings."""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return self.key

    @classmethod
    def get_value(cls, key, default=None):
        """Get setting value by key."""
        try:
            setting = cls.objects.get(key=key)
            return setting.value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_value(cls, key, value, description='', is_public=False):
        """Set setting value by key."""
        setting, created = cls.objects.update_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'is_public': is_public
            }
        )
        return setting
