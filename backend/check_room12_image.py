#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.proposals.models import ClubProposal

# Find Room 12 club
club = Club.objects.filter(name='Room 12').first()
if club:
    print(f"✅ Found Club: {club.name}")
    print(f"   ID: {club.id}")
    print(f"   Logo: {club.logo}")
    print(f"   Logo URL: {club.logo.url if club.logo else 'None'}")
else:
    print("❌ Club 'Room 12' not found")

# Find Room 12 proposal
proposal = ClubProposal.objects.filter(name='Room 12').first()
if proposal:
    print(f"\n✅ Found Proposal: {proposal.name}")
    print(f"   ID: {proposal.id}")
    print(f"   Club Logo: {proposal.club_logo}")
    print(f"   Club Logo URL: {proposal.club_logo.url if proposal.club_logo else 'None'}")
else:
    print("\n❌ Proposal 'Room 12' not found")
