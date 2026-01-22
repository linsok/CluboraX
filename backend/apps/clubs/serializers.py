from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import (
    Club, ClubMembership, ClubApproval, ClubActivity, 
    ClubAnnouncement, ClubResource, ClubFeedback
)
from apps.users.serializers import UserProfileSerializer
from apps.core.utils import validate_image_file
import logging

logger = logging.getLogger(__name__)


class ClubSerializer(serializers.ModelSerializer):
    """
    Club serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    pending_memberships = serializers.ReadOnlyField()
    leader_count = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    can_join = serializers.ReadOnlyField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'description', 'category', 'mission_statement',
            'logo', 'logo_url', 'status', 'founded_date', 'advisor_name',
            'advisor_email', 'meeting_schedule', 'created_by', 'tags',
            'social_links', 'requirements', 'member_count',
            'pending_memberships', 'leader_count', 'is_active', 'can_join',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'status', 'created_at', 'updated_at'
        ]
    
    def get_logo_url(self, obj):
        """
        Get logo URL.
        """
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def validate_name(self, value):
        """
        Validate club name uniqueness.
        """
        if self.instance:
            # Update case - exclude current instance
            if Club.objects.filter(name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A club with this name already exists.")
        else:
            # Create case
            if Club.objects.filter(name=value).exists():
                raise serializers.ValidationError("A club with this name already exists.")
        return value
    
    def validate_logo(self, value):
        """
        Validate logo image.
        """
        if value:
            is_valid, error_message = validate_image_file(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value
    
    def validate_advisor_email(self, value):
        """
        Validate advisor email format.
        """
        if value and '@' not in value:
            raise serializers.ValidationError("Enter a valid email address.")
        return value
    
    def validate_founded_date(self, value):
        """
        Validate founded date is not in future.
        """
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Founded date cannot be in the future.")
        return value


class ClubCreateSerializer(ClubSerializer):
    """
    Club creation serializer.
    """
    class Meta(ClubSerializer.Meta):
        read_only_fields = ClubSerializer.Meta.read_only_fields + ['status']
    
    def create(self, validated_data):
        """
        Create club and initialize approval workflow.
        """
        user = self.context['request'].user
        
        # Set created_by
        validated_data['created_by'] = user
        
        # Create club
        club = super().create(validated_data)
        
        # Initialize approval workflow
        self.create_club_approvals(club)
        
        # Add creator as leader
        club.add_member(user, role='leader')
        
        return club
    
    def create_club_approvals(self, club):
        """
        Create required club approvals.
        """
        from .models import ClubApproval
        
        # All clubs need student affairs and dean approval
        required_approvals = ['student_affairs', 'dean']
        
        # Create approval records
        for approver_type in required_approvals:
            ClubApproval.objects.create(
                club=club,
                approver_type=approver_type
            )
        
        # Update club status
        club.status = 'pending'
        club.save()


class ClubUpdateSerializer(ClubSerializer):
    """
    Club update serializer.
    """
    class Meta(ClubSerializer.Meta):
        read_only_fields = ClubSerializer.Meta.read_only_fields + ['created_by']


class ClubMembershipSerializer(serializers.ModelSerializer):
    """
    Club membership serializer.
    """
    user = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ClubMembership
        fields = [
            'id', 'club', 'club_name', 'user', 'role', 'role_display',
            'status', 'status_display', 'joined_at', 'notes'
        ]
        read_only_fields = ['id', 'user', 'joined_at']


class ClubMembershipCreateSerializer(serializers.ModelSerializer):
    """
    Club membership creation serializer.
    """
    class Meta:
        model = ClubMembership
        fields = ['club', 'role', 'notes']
    
    def validate_club(self, value):
        """
        Validate club membership.
        """
        user = self.context['request'].user
        
        # Check if club is active and can be joined
        if not value.can_join:
            raise serializers.ValidationError("This club is not currently accepting new members.")
        
        # Check if user is already a member
        if value.is_member(user):
            raise serializers.ValidationError("You are already a member of this club.")
        
        # Check if user has a pending membership
        if value.memberships.filter(user=user, status='pending').exists():
            raise serializers.ValidationError("You already have a pending membership request for this club.")
        
        return value
    
    def create(self, validated_data):
        """
        Create club membership.
        """
        user = self.context['request'].user
        club = validated_data['club']
        role = validated_data.get('role', 'member')
        
        # Create membership
        membership = club.add_member(user, role)
        
        # Add notes if provided
        if 'notes' in validated_data:
            membership.notes = validated_data['notes']
            membership.save()
        
        # Send notification to club leaders
        from apps.core.utils import send_notification
        leaders = club.memberships.filter(role='leader', status='approved')
        for leader in leaders:
            send_notification(
                leader.user,
                'New Membership Request',
                f'{user.full_name} has requested to join "{club.name}"',
                'club_update'
            )
        
        return membership


class ClubApprovalSerializer(serializers.ModelSerializer):
    """
    Club approval serializer.
    """
    approver = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    approver_type_display = serializers.CharField(source='get_approver_type_display', read_only=True)
    
    class Meta:
        model = ClubApproval
        fields = [
            'id', 'club', 'club_name', 'approver_type', 'approver_type_display',
            'approver', 'status', 'comments', 'reviewed_at'
        ]
        read_only_fields = ['id', 'club', 'approver_type', 'reviewed_at']


class ClubActivitySerializer(serializers.ModelSerializer):
    """
    Club activity serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = ClubActivity
        fields = [
            'id', 'club', 'club_name', 'title', 'description', 'activity_type',
            'activity_type_display', 'date', 'location', 'is_public',
            'created_by', 'attachments', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def validate_date(self, value):
        """
        Validate activity date.
        """
        if value < timezone.now():
            raise serializers.ValidationError("Activity date cannot be in the past.")
        return value


class ClubAnnouncementSerializer(serializers.ModelSerializer):
    """
    Club announcement serializer.
    """
    created_by = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = ClubAnnouncement
        fields = [
            'id', 'club', 'club_name', 'title', 'content', 'priority',
            'priority_display', 'is_active', 'expires_at', 'is_expired',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def validate_expires_at(self, value):
        """
        Validate expiry date.
        """
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value


class ClubResourceSerializer(serializers.ModelSerializer):
    """
    Club resource serializer.
    """
    uploaded_by = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ClubResource
        fields = [
            'id', 'club', 'club_name', 'title', 'description', 'resource_type',
            'resource_type_display', 'file', 'file_url', 'url', 'is_public',
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
    
    def validate(self, attrs):
        """
        Validate that either file or URL is provided.
        """
        resource_type = attrs.get('resource_type')
        file = attrs.get('file')
        url = attrs.get('url')
        
        if resource_type in ['document', 'image', 'video'] and not file:
            raise serializers.ValidationError("File is required for this resource type.")
        
        if resource_type == 'link' and not url:
            raise serializers.ValidationError("URL is required for link resources.")
        
        return attrs
    
    def validate_file(self, value):
        """
        Validate uploaded file.
        """
        if value:
            # Check file size
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError("File size must be less than 10MB.")
        return value


class ClubFeedbackSerializer(serializers.ModelSerializer):
    """
    Club feedback serializer.
    """
    user = UserProfileSerializer(read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    
    class Meta:
        model = ClubFeedback
        fields = [
            'id', 'club', 'club_name', 'user', 'rating', 'comments',
            'suggestions', 'would_recommend', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_club(self, value):
        """
        Validate that user is a member of the club.
        """
        user = self.context['request'].user
        
        if not value.is_member(user):
            raise serializers.ValidationError("You must be a member of this club to provide feedback.")
        
        return value


class ClubListSerializer(serializers.ModelSerializer):
    """
    Club list serializer (for overview).
    """
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    member_count = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    can_join = serializers.ReadOnlyField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'category', 'description', 'logo', 'logo_url',
            'status', 'created_by_name', 'member_count', 'is_active', 'can_join'
        ]
    
    def get_logo_url(self, obj):
        """
        Get logo URL.
        """
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class ClubMembershipActionSerializer(serializers.Serializer):
    """
    Club membership action serializer.
    """
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)


class ClubStatsSerializer(serializers.Serializer):
    """
    Club statistics serializer.
    """
    total_clubs = serializers.IntegerField()
    active_clubs = serializers.IntegerField()
    pending_clubs = serializers.IntegerField()
    total_memberships = serializers.IntegerField()
    my_memberships = serializers.IntegerField()
    clubs_by_category = serializers.JSONField()
    membership_growth = serializers.JSONField()
