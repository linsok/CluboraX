from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from phonenumber_field.phonenumber import PhoneNumber
from .models import User, UserProfile, PasswordResetToken, EmailVerificationToken
from .authentication import generate_jwt_token
from apps.core.utils import validate_student_id, get_client_ip
import logging

logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    User registration serializer.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm',
            'role', 'phone', 'student_id', 'staff_id', 'faculty', 'department'
        ]
    
    def validate_email(self, value):
        """
        Validate email domain for university emails.
        """
        if '@' in value:
            domain = value.split('@')[1].lower()
            # Add university domain validation if needed
            # if domain not in ['rupp.edu.kh', 'student.rupp.edu.kh']:
            #     raise serializers.ValidationError("Only university email addresses are allowed.")
        return value
    
    def validate_student_id(self, value):
        """
        Validate student ID format.
        """
        if self.initial_data.get('role') == 'student' and not value:
            raise serializers.ValidationError("Student ID is required for student role.")
        
        if value:
            is_valid, error_message = validate_student_id(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        
        return value
    
    def validate_staff_id(self, value):
        """
        Validate staff ID for organizer role.
        """
        if self.initial_data.get('role') in ['organizer', 'approver'] and not value:
            raise serializers.ValidationError("Staff ID is required for this role.")
        return value
    
    def validate(self, attrs):
        """
        Validate password confirmation.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        """
        Create user with validated data.
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Set username to email for Django compatibility
        validated_data['username'] = validated_data['email']
        
        # Extract first_name and last_name explicitly
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        
        user = User.objects.create_user(
            password=password,
            first_name=first_name,
            last_name=last_name,
            **{k: v for k, v in validated_data.items() if k not in ['first_name', 'last_name']}
        )
        
        # Verify they were saved correctly
        user.refresh_from_db()
        
        # Create user profile only if it doesn't exist
        from apps.users.models import UserProfile
        if not UserProfile.objects.filter(user=user).exists():
            UserProfile.objects.create(user=user)
        
        # Generate email verification token
        EmailVerificationToken.generate_token(user)
        
        # Generate OTP for verification
        user.generate_otp()
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    User login serializer.
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        """
        Validate login credentials.
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled.')
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError('Both email and password are required.')


class OTPVerificationSerializer(serializers.Serializer):
    """
    OTP verification serializer.
    """
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    
    def validate(self, attrs):
        """
        Validate OTP code.
        """
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email.')
        
        if not user.verify_otp(otp_code):
            raise serializers.ValidationError('Invalid or expired OTP.')
        
        attrs['user'] = user
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """
    Password reset serializer.
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """
        Validate email exists.
        """
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Email not found.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Password reset confirmation serializer.
    """
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        """
        Validate token and password confirmation.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        
        try:
            reset_token = PasswordResetToken.objects.get(
                token=attrs['token'],
                is_used=False
            )
            
            if not reset_token.is_valid():
                raise serializers.ValidationError('Token has expired or been used.')
            
            attrs['user'] = reset_token.user
            attrs['reset_token'] = reset_token
            return attrs
            
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Invalid token.')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    User profile serializer.
    """
    full_name = serializers.ReadOnlyField()
    profile_picture_url = serializers.SerializerMethodField()
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    notification_preferences = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'profile_picture', 'profile_picture_url',
            'is_verified', 'student_id', 'staff_id', 'faculty', 
            'department', 'date_joined', 'last_login', 'notification_preferences'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined', 'last_login', 'full_name', 'notification_preferences']
    
    def get_notification_preferences(self, obj):
        """
        Get user's notification preferences.
        """
        try:
            prefs = obj.notification_preferences
            return {
                'email_notifications': prefs.email_notifications,
                'push_notifications': prefs.push_notifications,
                'in_app_notifications': prefs.in_app_notifications,
            }
        except:
            # Return defaults if preferences don't exist
            return {
                'email_notifications': True,
                'push_notifications': True,
                'in_app_notifications': True,
            }
    
    def validate_phone(self, value):
        """
        Validate phone field - accept any format as long as it's not empty.
        """
        if value:
            # Remove spaces and special characters for length check
            clean_value = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
            if len(clean_value) < 7:
                raise serializers.ValidationError("Phone number must have at least 7 digits.")
            if len(clean_value) > 15:
                raise serializers.ValidationError("Phone number cannot exceed 15 digits.")
        return value
    
    def get_profile_picture_url(self, obj):
        """
        Get profile picture URL.
        """
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def to_representation(self, instance):
        """
        Ensure first_name and last_name are always in the response.
        """
        data = super().to_representation(instance)
        # Ensure first_name and last_name are always present, even if empty
        data['first_name'] = instance.first_name or ''
        data['last_name'] = instance.last_name or ''
        data['full_name'] = instance.full_name or ''
        return data
    
    def update(self, instance, validated_data):
        """
        Update user profile, handling phone field specially to bypass PhoneNumberField validation.
        """
        # Extract phone separately if present
        phone = validated_data.pop('phone', None)
        
        # Update other fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update phone field using queryset to bypass PhoneNumberField validation
        if phone is not None:
            User.objects.filter(pk=instance.pk).update(phone=phone)
            instance.phone = phone
        
        instance.save()
        return instance


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    User update serializer.
    """
    profile_picture = serializers.ImageField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'profile_picture',
            'faculty', 'department'
        ]
    
    def validate_phone(self, value):
        """
        Validate phone field - accept any format as long as it's not empty.
        """
        if value:
            # Remove spaces and special characters for length check
            clean_value = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
            if len(clean_value) < 7:
                raise serializers.ValidationError("Phone number must have at least 7 digits.")
            if len(clean_value) > 15:
                raise serializers.ValidationError("Phone number cannot exceed 15 digits.")
        return value
    
    def validate_profile_picture(self, value):
        """
        Validate profile picture.
        """
        if value:
            from apps.core.utils import validate_image_file
            is_valid, error_message = validate_image_file(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value
    
    def update(self, instance, validated_data):
        """
        Update user, handling phone field specially to bypass PhoneNumberField validation.
        """
        # Extract phone separately if present
        phone = validated_data.pop('phone', None)
        
        # Update other fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update phone field using queryset to bypass PhoneNumberField validation
        if phone is not None:
            User.objects.filter(pk=instance.pk).update(phone=phone)
            instance.phone = phone
        
        instance.save(update_fields=[
            'first_name', 'last_name', 'profile_picture', 'faculty', 'department'
        ])
        
        return instance


class ExtendedUserProfileSerializer(serializers.ModelSerializer):
    """
    Extended user profile serializer.
    """
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'date_of_birth', 'address',
            'emergency_contact_name', 'emergency_contact_phone',
            'social_links', 'preferences'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """
    Change password serializer.
    """
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate_old_password(self, value):
        """
        Validate old password.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def validate(self, attrs):
        """
        Validate password confirmation.
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class TokenSerializer(serializers.Serializer):
    """
    Token response serializer.
    """
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = UserProfileSerializer()
    expires_in = serializers.IntegerField()


class UserListSerializer(serializers.ModelSerializer):
    """
    User list serializer (for admin).
    """
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'role_display',
            'is_active', 'is_verified', 'date_joined', 'last_login'
        ]


class UserActivitySerializer(serializers.Serializer):
    """
    User activity serializer.
    """
    activity_type = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    ip_address = serializers.IPAddressField()


class EmailVerificationSerializer(serializers.Serializer):
    """
    Email verification serializer.
    """
    token = serializers.CharField()
    
    def validate_token(self, value):
        """
        Validate verification token.
        """
        try:
            token = EmailVerificationToken.objects.get(
                token=value,
                is_used=False
            )
            
            if not token.is_valid():
                raise serializers.ValidationError('Token has expired or been used.')
            
            return token
            
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid token.')
