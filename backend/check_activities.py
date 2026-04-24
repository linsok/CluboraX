#!/usr/bin/env python
"""
Check UserActivity data in database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.users.models import UserActivity
from apps.events.models import EventRegistration
from apps.clubs.models import ClubMembership

print("="*60)
print("USER ACTIVITY TRACKING STATUS")
print("="*60)

# Check activity types
print("\n📊 Activity Types in Database:")
types = UserActivity.objects.values_list('activity_type', flat=True).distinct()
for t in types:
    count = UserActivity.objects.filter(activity_type=t).count()
    print(f"  - {t}: {count} records")

print("\n🕒 Recent Activities (All Users):")
recent = UserActivity.objects.select_related('user').order_by('-created_at')[:10]
for a in recent:
    desc = a.description[:50] if a.description else "No description"
    print(f"  - {a.user.email} | {a.activity_type} | {desc}")

print("\n👤 Recent Activities for cchhounpiseth@gmail.com:")
user_acts = UserActivity.objects.filter(user__email='cchhounpiseth@gmail.com').order_by('-created_at')[:5]
if user_acts.exists():
    for a in user_acts:
        print(f"  - {a.activity_type}: {a.description or 'No description'} ({a.created_at})")
else:
    print("  - No activities found for this user")

print("\n📅 Event Registrations:")
regs = EventRegistration.objects.select_related('user', 'event').order_by('-registration_date')[:5]
for r in regs:
    print(f"  - {r.user.email} registered for '{r.event.title}'")

print("\n🏛️ Club Memberships:")
clubs = ClubMembership.objects.select_related('user', 'club').order_by('-joined_at')[:5]
for c in clubs:
    print(f"  - {c.user.email} joined '{c.club.name}' ({c.status})")

print("\n" + "="*60)
print("Summary:")
print(f"  - Total UserActivity records: {UserActivity.objects.count()}")
print(f"  - Total Event Registrations: {EventRegistration.objects.count()}")
print(f"  - Total Club Memberships: {ClubMembership.objects.count()}")
print("="*60)
