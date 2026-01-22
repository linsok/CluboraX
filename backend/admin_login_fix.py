#!/usr/bin/env python
import os
import sys
import django

# Set up Django with minimal settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings_mysql_fixed')

# Create minimal settings that work
settings = {
    'DEBUG': True,
    'DATABASES': {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'campus_event_club_management',
            'USER': 'root',
            'PASSWORD': 'Soklin0976193630',
            'HOST': 'localhost',
            'PORT': '3306',
        }
    },
    'INSTALLED_APPS': [
        'django.contrib.auth',
        'django.contrib.contenttypes',
    ],
    'SECRET_KEY': 'django-insecure-for-testing-only',
    'USE_TZ': True,
}

# Configure Django manually
from django.conf import settings as django_settings
for key, value in settings.items():
    setattr(django_settings, key, value)

# Now try to update the password
try:
    from django.contrib.auth.hashers import make_password
    import mysql.connector
    
    # Connect to database
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='Soklin0976193630',
        database='campus_event_club_management'
    )
    cursor = conn.cursor()
    
    # Generate proper password hash
    password_hash = make_password('Soklin0976193630')
    
    # Update the admin user password
    cursor.execute(
        "UPDATE accounts_user SET password = %s WHERE username = %s",
        (password_hash, 'admin@example.com')
    )
    
    conn.commit()
    print("✅ Password updated successfully!")
    print(f"📧 Email: admin@example.com")
    print(f"🔑 Password: Soklin0976193630")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
