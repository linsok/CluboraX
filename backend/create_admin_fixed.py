#!/usr/bin/env python
import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings_mysql_fixed')
django.setup()

from apps.users.models import User

# Create superuser
try:
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='Soklin0976193630'
    )
    print(f"✅ Superuser created successfully: {user.username}")
except Exception as e:
    print(f"❌ Error creating superuser: {e}")
    
    # Try to get existing user
    try:
        user = User.objects.get(username='admin')
        print(f"✅ Superuser already exists: {user.username}")
    except User.DoesNotExist:
        print("❌ Superuser does not exist and could not be created")
