#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.notifications.models import Notification

# Delete all membership-related notifications
membership_types = [
    'Club Membership Approved ✅',
    'New Member Joined 👋',
    'Club Membership Request Pending ⏳',
    'New Membership Request 🔔',
    'Club Membership Request Rejected ❌',
]

deleted_count = 0
for notif_title in membership_types:
    count, _ = Notification.objects.filter(title__icontains='Membership').delete()
    count2, _ = Notification.objects.filter(title__icontains='New Member').delete()
    deleted_count += count + count2

print(f"✅ Cleaned up {deleted_count} old membership notifications from database")
