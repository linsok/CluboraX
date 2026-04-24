#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.proposals.models import ClubProposal

print("🔍 Searching for 'Collecting' club and proposal...")

# Check clubs - more flexible search
clubs = Club.objects.all()
print(f"\nAll Clubs in DB: {clubs.count()}")
collecting_club = None
for club in clubs:
    if 'collect' in club.name.lower():
        print(f"  ⭐ {club.name}: {club.status}")
        collecting_club = club

if not collecting_club:
    print("  ❌ No club with 'Collecting' found")

# Check proposal
prop = ClubProposal.objects.filter(name__icontains='collecting').first()
if prop:
    print(f"\n✅ Found Proposal:")
    print(f"   Name: {prop.name}")
    print(f"   Status: {prop.status}")
    print(f"   Submitted by: {prop.submitted_by}")
    print(f"   Club Type: {prop.get_club_type_display()}")
    print(f"   Mission: {prop.mission}")
else:
    print("\n❌ No proposal found")

# Try to manually create the club from proposal
if prop and not collecting_club:
    print(f"\n🔧 Creating Club from Proposal...")
    club, created = Club.objects.get_or_create(
        name=prop.name,
        defaults={
            'description': prop.objectives or prop.mission or '',
            'category': prop.get_club_type_display(),
            'mission_statement': prop.mission or '',
            'status': 'published',
            'advisor_name': prop.advisor_name or '',
            'advisor_email': prop.advisor_email,
            'requirements': prop.requirements or '',
            'created_by': prop.submitted_by,
        }
    )
    print(f"   Created: {created}")
    print(f"   Club ID: {club.id}")
    print(f"   Club Status: {club.status}")
    print(f"✅ Club '{club.name}' is now created and should appear in the Clubs page!")
