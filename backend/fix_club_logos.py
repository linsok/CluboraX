#!/usr/bin/env python
"""
Fix published clubs by ensuring logos are properly copied from proposals
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.proposals.models import ClubProposal
import logging

logger = logging.getLogger(__name__)

print("\n=== FIXING CLUB LOGOS FROM PUBLISHED PROPOSALS ===\n")

# Find all published club proposals
published_proposals = ClubProposal.objects.filter(status='published')
print(f"Found {published_proposals.count()} published proposals\n")

for proposal in published_proposals:
    print(f"Processing: {proposal.name}")
    print(f"  Proposal has logo: {bool(proposal.club_logo)}")
    
    if proposal.club_logo:
        print(f"  Logo path: {proposal.club_logo.name}")
        
        # Find matching club
        try:
            club = Club.objects.get(name=proposal.name)
            print(f"  Found club: {club.name}")
            print(f"  Club currently has logo: {bool(club.logo)}")
            
            # Copy logo from proposal to club
            club.logo = proposal.club_logo
            club.save()
            
            print(f"  ✅ Logo copied successfully!")
            print(f"  Club logo now: {club.logo.name}")
            
        except Club.DoesNotExist:
            print(f"  ❌ Club not found - should have been created during publish")
    else:
        print(f"  ⚠️  Proposal has NO logo file")
    
    print()

print("=== COMPLETE ===\n")
