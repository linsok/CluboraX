from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class UserManager(BaseUserManager):
    """
    Custom user manager.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a user with the given email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)
    
    def get_verified_users(self):
        """
        Get all verified users.
        """
        return self.filter(is_verified=True, is_active=True)
    
    def get_by_role(self, role):
        """
        Get users by role.
        """
        return self.filter(role=role, is_active=True)
    
    def get_active_users(self):
        """
        Get all active users.
        """
        return self.filter(is_active=True)
    
    def get_students(self):
        """
        Get all student users.
        """
        return self.filter(role='student', is_active=True)
    
    def get_organizers(self):
        """
        Get all organizer users.
        """
        return self.filter(role='organizer', is_active=True)
    
    def get_approvers(self):
        """
        Get all approver users.
        """
        return self.filter(role='approver', is_active=True)
    
    def get_admins(self):
        """
        Get all admin users.
        """
        return self.filter(role='admin', is_active=True)
    
    def search_users(self, query):
        """
        Search users by name, email, or student/staff ID.
        """
        from django.db.models import Q
        
        return self.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(student_id__icontains=query) |
            Q(staff_id__icontains=query)
        ).filter(is_active=True)
    
    def get_recent_users(self, days=30):
        """
        Get users created within the last N days.
        """
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created_at__gte=cutoff_date)
    
    def get_inactive_users(self, days=90):
        """
        Get users who haven't logged in for N days.
        """
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return self.filter(
            is_active=True,
            last_login__lt=cutoff_date
        )
    
    def get_unverified_users(self):
        """
        Get all unverified users.
        """
        return self.filter(is_verified=False, is_active=True)
