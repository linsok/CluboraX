from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Event, EventRegistration, EventApproval, EventFeedback, EventMedia
from apps.users.serializers import UserProfileSerializer
from apps.core.utils import validate_image_file
import logging

logger = logging.getLogger(__name__)


class EventSerializer(serializers.ModelSerializer):
    """
    Event serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    current_participants = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()
    poster_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'category', 'event_type',
            'start_datetime', 'end_datetime', 'venue', 'max_participants',
            'is_paid', 'price', 'registration_deadline', 'status',
            'created_by', 'club', 'club_name', 'poster_image',
            'poster_image_url', 'requirements', 'agenda', 'tags',
            'current_participants', 'available_slots', 'is_full',
            'is_upcoming', 'is_ongoing', 'is_past', 'registration_open',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'status', 'created_at', 'updated_at'
        ]
    
    def get_poster_image_url(self, obj):
        """
        Get poster image URL.
        """
        if obj.poster_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.poster_image.url)
            return obj.poster_image.url
        return None
    
    def validate_start_datetime(self, value):
        """
        Validate start datetime.
        """
        if value <= timezone.now():
            raise serializers.ValidationError("Start time must be in the future.")
        return value
    
    def validate_end_datetime(self, value):
        """
        Validate end datetime.
        """
        if 'start_datetime' in self.initial_data:
            start_datetime = self.initial_data['start_datetime']
            if isinstance(start_datetime, str):
                from datetime import datetime
                start_datetime = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
            
            if value <= start_datetime:
                raise serializers.ValidationError("End time must be after start time.")
        return value
    
    def validate_registration_deadline(self, value):
        """
        Validate registration deadline.
        """
        if 'start_datetime' in self.initial_data:
            start_datetime = self.initial_data['start_datetime']
            if isinstance(start_datetime, str):
                from datetime import datetime
                start_datetime = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
            
            if value >= start_datetime:
                raise serializers.ValidationError("Registration deadline must be before event start time.")
        return value
    
    def validate_price(self, value):
        """
        Validate price for paid events.
        """
        if self.initial_data.get('is_paid') and (not value or value <= 0):
            raise serializers.ValidationError("Price must be greater than 0 for paid events.")
        return value
    
    def validate_poster_image(self, value):
        """
        Validate poster image.
        """
        if value:
            is_valid, error_message = validate_image_file(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value
    
    def validate(self, attrs):
        """
        Validate event data.
        """
        # Check for schedule conflicts with creator's existing events
        user = self.context['request'].user
        if 'start_datetime' in attrs and 'end_datetime' in attrs:
            conflicting_events = Event.objects.filter(
                created_by=user,
                status='approved'
            ).filter(
                start_datetime__lte=attrs['end_datetime'],
                end_datetime__gte=attrs['start_datetime']
            )
            
            if self.instance:
                conflicting_events = conflicting_events.exclude(id=self.instance.id)
            
            if conflicting_events.exists():
                raise serializers.ValidationError(
                    "You have a schedule conflict with an existing approved event."
                )
        
        return attrs


class EventCreateSerializer(EventSerializer):
    """
    Event creation serializer.
    """
    class Meta(EventSerializer.Meta):
        read_only_fields = EventSerializer.Meta.read_only_fields + ['status']
    
    def create(self, validated_data):
        """
        Create event and initialize approval workflow.
        """
        user = self.context['request'].user
        
        # Set created_by
        validated_data['created_by'] = user
        
        # Create event
        event = super().create(validated_data)
        
        # Initialize approval workflow
        if event.status == 'draft':
            # If draft, don't create approvals yet
            pass
        else:
            # Create required approvals
            self.create_event_approvals(event)
        
        return event
    
    def create_event_approvals(self, event):
        """
        Create required event approvals.
        """
        from .models import EventApproval
        
        # Determine required approvals based on event type and price
        required_approvals = ['student_affairs', 'venue_manager']
        
        if event.is_paid:
            required_approvals.append('finance')
        
        if event.event_type in ['academic', 'competition']:
            required_approvals.append('dean')
        
        # Create approval records
        for approver_type in required_approvals:
            EventApproval.objects.create(
                event=event,
                approver_type=approver_type
            )
        
        # Update event status
        event.status = 'pending_approval'
        event.save()


class EventUpdateSerializer(EventSerializer):
    """
    Event update serializer.
    """
    class Meta(EventSerializer.Meta):
        read_only_fields = EventSerializer.Meta.read_only_fields + ['created_by']


class EventRegistrationSerializer(serializers.ModelSerializer):
    """
    Event registration serializer.
    """
    user = UserProfileSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    qr_code_url = serializers.SerializerMethodField()
    payment_receipt_url = serializers.SerializerMethodField()
    is_qr_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'event_title', 'user', 'registration_date',
            'status', 'qr_code', 'qr_code_url', 'payment_status',
            'payment_receipt', 'payment_receipt_url', 'checked_in',
            'checked_in_at', 'notes', 'is_qr_expired'
        ]
        read_only_fields = [
            'id', 'user', 'registration_date', 'qr_code', 'checked_in_at'
        ]
    
    def get_qr_code_url(self, obj):
        """
        Get QR code image URL.
        """
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return obj.qr_code_image.url
        return None
    
    def get_payment_receipt_url(self, obj):
        """
        Get payment receipt URL.
        """
        if obj.payment_receipt:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.payment_receipt.url)
            return obj.payment_receipt.url
        return None
    
    def validate_payment_receipt(self, value):
        """
        Validate payment receipt.
        """
        if value:
            is_valid, error_message = validate_image_file(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value


class EventRegistrationCreateSerializer(serializers.ModelSerializer):
    """
    Event registration creation serializer.
    """
    class Meta:
        model = EventRegistration
        fields = ['event', 'payment_receipt', 'notes']
    
    def validate_event(self, value):
        """
        Validate event registration.
        """
        user = self.context['request'].user
        
        # Check if user can register
        can_register, message = value.can_register(user)
        if not can_register:
            raise serializers.ValidationError(message)
        
        # Check for schedule conflicts
        if value.check_schedule_conflicts(user):
            raise serializers.ValidationError(
                "You have a schedule conflict with an existing registered event."
            )
        
        return value
    
    def create(self, validated_data):
        """
        Create event registration.
        """
        user = self.context['request'].user
        event = validated_data['event']
        
        # Create registration
        registration = EventRegistration.objects.create(
            user=user,
            **validated_data
        )
        
        # Set status based on payment
        if event.is_paid:
            registration.status = 'pending_payment'
            registration.payment_status = 'pending'
        else:
            registration.status = 'confirmed'
        
        registration.save()
        
        # Generate QR code if confirmed
        if registration.status == 'confirmed':
            registration.generate_qr_code()
        
        # Send notification
        from apps.core.utils import send_notification
        send_notification(
            user,
            'Event Registration',
            f'You have successfully registered for "{event.title}"',
            'event_update'
        )
        
        return registration


class EventApprovalSerializer(serializers.ModelSerializer):
    """
    Event approval serializer.
    """
    approver = UserProfileSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    approver_type_display = serializers.CharField(source='get_approver_type_display', read_only=True)
    
    class Meta:
        model = EventApproval
        fields = [
            'id', 'event', 'event_title', 'approver_type', 'approver_type_display',
            'approver', 'status', 'comments', 'reviewed_at'
        ]
        read_only_fields = ['id', 'event', 'approver_type', 'reviewed_at']


class EventFeedbackSerializer(serializers.ModelSerializer):
    """
    Event feedback serializer.
    """
    user = UserProfileSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = EventFeedback
        fields = [
            'id', 'event', 'event_title', 'user', 'rating', 'comments',
            'suggestions', 'would_recommend', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_event(self, value):
        """
        Validate that user can provide feedback.
        """
        user = self.context['request'].user
        
        # Check if user attended the event
        if not EventRegistration.objects.filter(
            event=value,
            user=user,
            checked_in=True
        ).exists():
            raise serializers.ValidationError(
                "You must attend this event to provide feedback."
            )
        
        # Check if event is completed
        if not value.is_past:
            raise serializers.ValidationError(
                "You can only provide feedback for completed events."
            )
        
        return value


class EventMediaSerializer(serializers.ModelSerializer):
    """
    Event media serializer.
    """
    uploaded_by = UserProfileSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EventMedia
        fields = [
            'id', 'event', 'event_title', 'title', 'description',
            'media_type', 'file', 'file_url', 'is_approved',
            'uploaded_by', 'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']
    
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
    
    def validate_file(self, value):
        """
        Validate uploaded file.
        """
        # Check file size
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be less than 10MB.")
        
        return value


class EventListSerializer(serializers.ModelSerializer):
    """
    Event list serializer (for overview).
    """
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    current_participants = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()
    poster_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'event_type', 'start_datetime',
            'end_datetime', 'venue', 'is_paid', 'price', 'status',
            'created_by_name', 'club_name', 'poster_image_url',
            'current_participants', 'available_slots', 'is_full',
            'registration_open'
        ]
    
    def get_poster_image_url(self, obj):
        """
        Get poster image URL.
        """
        if obj.poster_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.poster_image.url)
            return obj.poster_image.url
        return None


class EventCheckInSerializer(serializers.Serializer):
    """
    Event check-in serializer.
    """
    qr_code = serializers.CharField()
    
    def validate_qr_code(self, value):
        """
        Validate QR code.
        """
        try:
            registration = EventRegistration.objects.get(qr_code=value)
            
            if registration.checked_in:
                raise serializers.ValidationError("Already checked in.")
            
            if registration.is_qr_expired:
                raise serializers.ValidationError("QR code has expired.")
            
            return registration
            
        except EventRegistration.DoesNotExist:
            raise serializers.ValidationError("Invalid QR code.")


class EventStatsSerializer(serializers.Serializer):
    """
    Event statistics serializer.
    """
    total_events = serializers.IntegerField()
    upcoming_events = serializers.IntegerField()
    ongoing_events = serializers.IntegerField()
    past_events = serializers.IntegerField()
    total_registrations = serializers.IntegerField()
    my_registrations = serializers.IntegerField()
    events_by_category = serializers.JSONField()
    events_by_type = serializers.JSONField()
