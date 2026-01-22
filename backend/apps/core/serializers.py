from rest_framework import serializers
from django.utils import timezone
from .models import SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    """
    Serializer for system settings.
    """
    
    class Meta:
        model = SystemSetting
        fields = ['key', 'value', 'description', 'is_public', 'updated_at']
        read_only_fields = ['updated_at']


class AuditLogSerializer(serializers.Serializer):
    """
    Serializer for audit logs.
    """
    user = serializers.CharField(source='user.email', read_only=True)
    action = serializers.CharField(read_only=True)
    table_name = serializers.CharField(read_only=True)
    record_id = serializers.CharField(read_only=True)
    old_values = serializers.JSONField(read_only=True)
    new_values = serializers.JSONField(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True)
    user_agent = serializers.CharField(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)


class ErrorResponseSerializer(serializers.Serializer):
    """
    Standard error response serializer.
    """
    error = serializers.BooleanField(default=True)
    message = serializers.CharField()
    status_code = serializers.IntegerField()
    data = serializers.JSONField(required=False, allow_null=True)


class SuccessResponseSerializer(serializers.Serializer):
    """
    Standard success response serializer.
    """
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(required=False)
    data = serializers.JSONField(required=False, allow_null=True)


class PaginationSerializer(serializers.Serializer):
    """
    Pagination metadata serializer.
    """
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    page_size = serializers.IntegerField()
    current_page = serializers.IntegerField()
    total_pages = serializers.IntegerField()


class FileUploadSerializer(serializers.Serializer):
    """
    File upload serializer.
    """
    file = serializers.FileField()
    
    def validate_file(self, value):
        """
        Validate uploaded file.
        """
        from django.conf import settings
        
        # Check file size
        max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(f"File size must be less than {max_size // (1024*1024)}MB")
        
        return value


class ImageUploadSerializer(serializers.Serializer):
    """
    Image upload serializer.
    """
    image = serializers.ImageField()
    
    def validate_image(self, value):
        """
        Validate uploaded image.
        """
        from .utils import validate_image_file
        from django.conf import settings
        
        is_valid, error_message = validate_image_file(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)
        
        return value


class QRCodeSerializer(serializers.Serializer):
    """
    QR code serializer.
    """
    qr_code = serializers.ImageField(read_only=True)
    qr_data = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)


class NotificationSerializer(serializers.Serializer):
    """
    Notification serializer.
    """
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class RevenueSplitSerializer(serializers.Serializer):
    """
    Revenue split serializer.
    """
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    club_percentage = serializers.IntegerField()
    club_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    university_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    university_percentage = serializers.IntegerField()


class SearchSerializer(serializers.Serializer):
    """
    Search query serializer.
    """
    query = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    status = serializers.CharField(required=False, allow_blank=True)
    sort_by = serializers.CharField(required=False, default='created_at')
    sort_order = serializers.ChoiceField(choices=['asc', 'desc'], default='desc')
    page = serializers.IntegerField(required=False, default=1)
    page_size = serializers.IntegerField(required=False, default=20)


class BulkActionSerializer(serializers.Serializer):
    """
    Bulk action serializer.
    """
    action = serializers.ChoiceField(choices=['approve', 'reject', 'delete', 'archive'])
    ids = serializers.ListField(child=serializers.UUIDField())
    reason = serializers.CharField(required=False, allow_blank=True)


class ExportSerializer(serializers.Serializer):
    """
    Export data serializer.
    """
    format = serializers.ChoiceField(choices=['csv', 'excel', 'pdf'], default='csv')
    filters = serializers.JSONField(required=False, default=dict)
    columns = serializers.ListField(child=serializers.CharField(), required=False)


class StatisticsSerializer(serializers.Serializer):
    """
    Statistics serializer.
    """
    total_count = serializers.IntegerField()
    active_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    rejected_count = serializers.IntegerField()
    growth_rate = serializers.FloatField()
    last_updated = serializers.DateTimeField()


class ChartDataSerializer(serializers.Serializer):
    """
    Chart data serializer.
    """
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.ListField(child=serializers.DictField())


class FilterOptionsSerializer(serializers.Serializer):
    """
    Filter options serializer.
    """
    categories = serializers.ListField(child=serializers.CharField())
    statuses = serializers.ListField(child=serializers.CharField())
    date_ranges = serializers.ListField(child=serializers.DictField())
    sort_options = serializers.ListField(child=serializers.DictField())
