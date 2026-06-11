from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import User, UserProfile

class IDCardUploadSerializer(serializers.Serializer):
    """
    Serializer for ID card upload step
    """
    id_card_image = serializers.ImageField(
        required=True,
        error_messages={
            'required': 'Please upload your ID card image',
            'invalid_image': 'Please upload a valid image file',
            'max_length': 'Image size must be less than 5MB'
        }
    )
    
    def validate_id_card_image(self, value):
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError('Only JPG, JPEG, and PNG images are allowed')
        
        # Check file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError('Image size must be less than 5MB')
        
        return value

class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer for user registration step 2 (email and password)
    """
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required',
            'invalid': 'Please enter a valid email address'
        }
    )
    
    password = serializers.CharField(
        required=True,
        min_length=8,
        write_only=True,
        error_messages={
            'required': 'Password is required',
            'min_length': 'Password must be at least 8 characters long'
        }
    )
    
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        error_messages={
            'required': 'Please confirm your password'
        }
    )
    
    def validate_email(self, value):
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists')
        return value
    
    def validate_password(self, value):
        # Password strength validation
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long')
        
        has_upper = any(c.isupper() for c in value)
        has_lower = any(c.islower() for c in value)
        has_digit = any(c.isdigit() for c in value)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in value)
        
        errors = []
        if not has_upper:
            errors.append('Password must contain at least one uppercase letter')
        if not has_lower:
            errors.append('Password must contain at least one lowercase letter')
        if not has_digit:
            errors.append('Password must contain at least one number')
        if not has_special:
            errors.append('Password must contain at least one special character')
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        return attrs

class ExtractedDataSerializer(serializers.Serializer):
    """
    Serializer for displaying extracted OCR data
    """
    name = serializers.CharField(read_only=True)
    id_number = serializers.CharField(read_only=True)
    date_of_birth = serializers.CharField(read_only=True)
    gender = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    expiry_date = serializers.CharField(read_only=True)
