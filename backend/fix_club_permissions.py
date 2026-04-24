#!/usr/bin/env python
"""
Fix club permissions - Make cchhounpiseth@gmail.com a leader of Music Club
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club, ClubMembership
from django.contrib.auth import get_user_model

User = get_user_model()

# Fix Music Club - Make cchhounpiseth@gmail.com a leader
try:
    club = Club.objects.get(name='Music Club')
    student = User.objects.get(email='cchhounpiseth@gmail.com')
    
    print(f"Club: {club.name}")
    print(f"Making {student.email} a leader...")
    
    # Get or update the student's membership to leader
    membership, created = ClubMembership.objects.get_or_create(
        club=club,
        user=student,
        defaults={'role': 'leader', 'status': 'approved'}
    )
    
    if not created:
        # Update existing membership
        membership.role = 'leader'
        membership.status = 'approved'
        membership.save()
        print(f"✅ Updated {student.email} to leader")
    else:
        print(f"✅ Created leader membership for {student.email}")
    
    # Show all memberships
    print("\n📋 Current memberships:")
    for m in ClubMembership.objects.filter(club=club):
        print(f"  - {m.user.email}: {m.role} ({m.status})")
        
except Club.DoesNotExist:
    print("❌ Music Club not found")
except User.DoesNotExist:
    print("❌ User not found")
