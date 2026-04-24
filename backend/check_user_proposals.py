#!/usr/bin/env python
"""Check user event proposals in database"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.proposals.models import EventProposal

User = get_user_model()

# Find the organizer user
email = 'rupproombooking@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"\n=== User Info ===")
    print(f"Email: {user.email}")
    print(f"Role: {getattr(user, 'role', 'NO ROLE ATTRIBUTE')}")
    
    # Check event PROPOSALS created by this user
    proposals = EventProposal.objects.filter(submitted_by=user)
    print(f"\n=== Event PROPOSALS Created By User ===")
    print(f"Total: {proposals.count()}")
    
    for prop in proposals.order_by('-created_at')[:10]:
        print(f"\nProposal: {prop.event_title}")
        print(f"  ID: {prop.id}")
        print(f"  Status: {prop.status}")
        print(f"  Created At: {prop.created_at}")
        print(f"  Submitted By: {prop.submitted_by.email}")
    
except User.DoesNotExist:
    print(f"User {email} not found!")
