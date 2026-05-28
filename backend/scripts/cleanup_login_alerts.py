#!/usr/bin/env python
"""
Clean up old Login Alert notifications from database
"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.notifications.models import Notification

# Delete all "Login Alert" notifications
deleted_count, _ = Notification.objects.filter(title='Login Alert').delete()

print(f"✅ Deleted {deleted_count} 'Login Alert' notifications")
print("✅ No more Login Alerts will appear on page refresh")
