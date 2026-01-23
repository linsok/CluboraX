from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .models import User, UserProfile, PasswordResetToken, EmailVerificationToken, UserActivity


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name', 'role')
        field_classes = {
            'email': forms.EmailField,
        }

    def clean_username(self):
        # Since we use email as username, but don't show username field
        return self.cleaned_data['email']


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser')
        field_classes = {
            'email': forms.EmailField,
        }

    def clean_username(self):
        # Since we use email as username, but don't show username field
        return self.cleaned_data['email']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom user admin interface for email-based authentication.
    """
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    list_display = ['email', 'full_name', 'role', 'is_verified', 'is_active', 'date_joined', 'last_login']
    list_filter = ['role', 'is_verified', 'is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'student_id', 'staff_id']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        (_('Role & Status'), {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')}),
        (_('University Info'), {'fields': ('student_id', 'staff_id', 'faculty', 'department')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def get_username(self, obj):
        # Return email as username since we use email for authentication
        return obj.email
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    full_name.short_description = 'Full Name'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    User profile admin interface.
    """
    list_display = ['user', 'date_of_birth', 'created_at']
    list_filter = ['created_at', 'date_of_birth']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (_('User'), {'fields': ['user']}),
        (_('Personal Info'), {'fields': ['bio', 'date_of_birth', 'address']}),
        (_('Emergency Contact'), {'fields': ['emergency_contact_name', 'emergency_contact_phone']}),
        (_('Social & Preferences'), {'fields': ['social_links', 'preferences']}),
        (_('Timestamps'), {'fields': ['created_at', 'updated_at']}),
    )


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """
    Password reset token admin interface.
    """
    list_display = ['user', 'token_short', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']
    
    def token_short(self, obj):
        return f"{obj.token[:8]}..." if obj.token else ""
    token_short.short_description = 'Token'


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    """
    Email verification token admin interface.
    """
    list_display = ['user', 'token_short', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']
    
    def token_short(self, obj):
        return f"{obj.token[:8]}..." if obj.token else ""
    token_short.short_description = 'Token'


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """
    User activity admin interface.
    """
    list_display = ['user', 'activity_type', 'description', 'ip_address', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__email', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
