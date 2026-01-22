from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField
from apps.core.models import TimeStampedModel
from apps.users.managers import UserManager
import uuid


class User(AbstractUser):
    """
    Custom user model with additional fields.
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('organizer', 'Organizer'),
        ('approver', 'Approver'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = PhoneNumberField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    student_id = models.CharField(max_length=50, blank=True, null=True)
    staff_id = models.CharField(max_length=50, blank=True, null=True)
    faculty = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def generate_otp(self):
        """
        Generate OTP code for email verification.
        """
        import random
        import string
        
        self.otp_code = ''.join(random.choices(string.digits, k=6))
        self.otp_expires_at = timezone.now() + timezone.timedelta(minutes=10)
        self.save(update_fields=['otp_code', 'otp_expires_at'])
        
        return self.otp_code
    
    def verify_otp(self, otp_code):
        """
        Verify OTP code.
        """
        if not self.otp_code or not self.otp_expires_at:
            return False
        
        if timezone.now() > self.otp_expires_at:
            return False
        
        if self.otp_code != otp_code:
            return False
        
        # Clear OTP after successful verification
        self.otp_code = None
        self.otp_expires_at = None
        self.is_verified = True
        self.save(update_fields=['otp_code', 'otp_expires_at', 'is_verified'])
        
        return True
    
    def is_otp_valid(self):
        """
        Check if OTP is still valid.
        """
        return (
            self.otp_code and 
            self.otp_expires_at and 
            timezone.now() <= self.otp_expires_at
        )


class UserProfile(TimeStampedModel):
    """
    Extended user profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = PhoneNumberField(blank=True, null=True)
    social_links = models.JSONField(default=dict, blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True, null=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.full_name} Profile"


class UserSession(TimeStampedModel):
    """
    Track user sessions for security and analytics.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
    
    def __str__(self):
        return f"{self.user.email} - {self.ip_address}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at


class UserActivity(TimeStampedModel):
    """
    Track user activities for analytics.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'user_activities'
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type}"


class PasswordResetToken(TimeStampedModel):
    """
    Password reset tokens.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    def __str__(self):
        return f"{self.user.email} - {self.token[:8]}..."
    
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
    
    @classmethod
    def generate_token(cls, user):
        """
        Generate password reset token for user.
        """
        import secrets
        
        # Invalidate existing tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(hours=1)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )


class EmailVerificationToken(TimeStampedModel):
    """
    Email verification tokens.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_tokens')
    token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'email_verification_tokens'
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'
    
    def __str__(self):
        return f"{self.user.email} - {self.token[:8]}..."
    
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
    
    @classmethod
    def generate_token(cls, user):
        """
        Generate email verification token for user.
        """
        import secrets
        
        # Invalidate existing tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(hours=24)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
