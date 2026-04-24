#!/usr/bin/env python
"""Check user events in database"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.events.models import Event

User = get_user_model()

# Find the organizer user
email = 'rupproombooking@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"\n=== User Info ===")
    print(f"Email: {user.email}")
    print(f"Role: {getattr(user, 'role', 'NO ROLE ATTRIBUTE')}")
    print(f"ID: {user.id}")
    
    # Check events created by this user
    events = Event.objects.filter(created_by=user)
    print(f"\n=== Events Created By User ===")
    print(f"Total: {events.count()}")
    
    for event in events:
        print(f"\nEvent: {event.title}")
        print(f"  ID: {event.id}")
        print(f"  Status: {event.status}")
        print(f"  Created At: {event.created_at}")
        print(f"  Created By: {event.created_by.email}")
    
    if events.count() == 0:
        print("\nNo events found! Events might be created under a different user.")
        print("\nAll events in database:")
        all_events = Event.objects.all().order_by('-created_at')[:10]
        for event in all_events:
            print(f"  - {event.title} (status={event.status}, created_by={event.created_by.email if event.created_by else 'None'})")
    
except User.DoesNotExist:
    print(f"User {email} not found!")
    print("\nAll users:")
    for u in User.objects.all():
        print(f"  - {u.email} (role={getattr(u, 'role', 'NO ROLE')})")
