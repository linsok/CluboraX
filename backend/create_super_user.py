#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.users.models import User

def create_super_user():
    try:
        # Check if superuser already exists
        email = "admin@campus.edu"
        if User.objects.filter(email=email).exists():
            print(f"Superuser with email {email} already exists!")
            return
        
        # Create superuser using the custom manager
        superuser = User.objects.create_superuser(
            email=email,
            password="admin123456",
            first_name="Admin",
            last_name="User"
        )
        
        print(f"Superuser created successfully!")
        print(f"Email: {email}")
        print(f"Password: admin123456")
        print(f"Role: {superuser.role}")
        
    except Exception as e:
        print(f"Error creating superuser: {e}")

if __name__ == "__main__":
    create_super_user()
