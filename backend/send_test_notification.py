#!/usr/bin/env python
"""Send sample notification to user"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()

# Find user
user = User.objects.filter(email='cchhounpiseth@gmail.com').first()

if user:
    # Create sample notification
    notif = Notification.objects.create(
        user=user,
        title='Test Notification 🧪',
        message='This is a sample notification to test the system. You should see this in your Notification page within 5 seconds!',
        type='event_update',
        priority='medium'
    )
    
    print(f'✅ Notification created successfully!')
    print(f'   User: {user.email}')
    print(f'   Title: {notif.title}')
    print(f'   ID: {notif.id}')
    print(f'   Type: {notif.type}')
    print(f'   Priority: {notif.priority}')
    print(f'   Created: {notif.created_at}')
    print(f'\n✅ Check the Notifications page - should see toast appear in 5 seconds!')
else:
    print(f'❌ User not found: cchhounpiseth@gmail.com')
    print(f'\n📋 Available users:')
    for u in User.objects.all()[:10]:
        print(f'   - {u.email}')
