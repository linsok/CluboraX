#!/usr/bin/env python
"""
Verification script for club logo issue.
Run from backend directory: python verify_logo_issue.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.clubs.models import Club
from apps.proposals.models import ClubProposal

def check_logo_issue():
    print("=" * 80)
    print("CLUB LOGO VERIFICATION")
    print("=" * 80)
    
    # Check 1: Clubs with no logo
    print("\n1. CLUBS IN DATABASE")
    print("-" * 80)
    all_clubs = Club.objects.all()
    print(f"   Total clubs: {all_clubs.count()}")
    
    clubs_with_logo = all_clubs.exclude(logo='').exclude(logo__isnull=True)
    clubs_without_logo = all_clubs.filter(logo='') | all_clubs.filter(logo__isnull=True)
    
    print(f"   Clubs WITH logo: {clubs_with_logo.count()}")
    print(f"   Clubs WITHOUT logo: {clubs_without_logo.count()}")
    
    # Show clubs without logo
    if clubs_without_logo.exists():
        print(f"\n   ⚠️  Clubs missing logos:")
        for club in clubs_without_logo[:5]:
            print(f"      - {club.name} (ID: {club.id})")
            print(f"        Status: {club.status}")
            print(f"        Created by: {club.created_by.username}")
    
    # Check 2: Proposals with logo
    print("\n2. CLUB PROPOSALS IN DATABASE")
    print("-" * 80)
    all_proposals = ClubProposal.objects.all()
    print(f"   Total proposals: {all_proposals.count()}")
    
    proposals_with_logo = all_proposals.exclude(club_logo='').exclude(club_logo__isnull=True)
    proposals_without_logo = all_proposals.filter(club_logo='') | all_proposals.filter(club_logo__isnull=True)
    
    print(f"   Proposals WITH logo: {proposals_with_logo.count()}")
    print(f"   Proposals WITHOUT logo: {proposals_without_logo.count()}")
    
    if proposals_with_logo.exists():
        print(f"\n   ✅ Proposals with logos:")
        for prop in proposals_with_logo[:5]:
            print(f"      - {prop.name} (ID: {prop.id})")
            print(f"        Status: {prop.status}")
            print(f"        Logo path: {prop.club_logo.name}")
    
    # Check 3: Correlation - Published proposals and clubs
    print("\n3. PUBLISHED PROPOSALS → CLUB CORRELATION")
    print("-" * 80)
    published_proposals = ClubProposal.objects.filter(status='published')
    print(f"   Published proposals: {published_proposals.count()}")
    
    if published_proposals.exists():
        for prop in published_proposals[:5]:
            try:
                club = Club.objects.get(name=prop.name)
                has_logo_in_proposal = prop.club_logo and prop.club_logo.name
                has_logo_in_club = club.logo and club.logo.name
                
                print(f"\n   Proposal: {prop.name}")
                print(f"     - Status: {prop.status}")
                print(f"     - Has logo in proposal: {'✅ YES' if has_logo_in_proposal else '❌ NO'}")
                if has_logo_in_proposal:
                    print(f"       Path: {prop.club_logo.name}")
                print(f"     - Has logo in club: {'✅ YES' if has_logo_in_club else '❌ NO'}")
                if has_logo_in_club:
                    print(f"       Path: {club.logo.name}")
                
                if has_logo_in_proposal and not has_logo_in_club:
                    print(f"     ⚠️  ISSUE DETECTED: Logo not copied from proposal to club!")
                    
            except Club.DoesNotExist:
                print(f"\n   ❌ Proposal '{prop.name}' has no corresponding club!")
    
    # Check 4: File system check
    print("\n4. FILE SYSTEM CHECK")
    print("-" * 80)
    
    from django.conf import settings
    import os
    
    media_root = settings.MEDIA_ROOT
    club_logos_dir = os.path.join(media_root, 'club_logos')
    
    print(f"   MEDIA_ROOT: {media_root}")
    print(f"   MEDIA_URL: {settings.MEDIA_URL}")
    print(f"   Club logos directory: {club_logos_dir}")
    
    if os.path.exists(club_logos_dir):
        print(f"   ✅ Directory exists")
        logo_files = os.listdir(club_logos_dir)
        print(f"   Files in directory: {len(logo_files)}")
        for f in logo_files[:10]:
            file_path = os.path.join(club_logos_dir, f)
            file_size = os.path.getsize(file_path)
            print(f"      - {f} ({file_size} bytes)")
    else:
        print(f"   ❌ Directory does NOT exist!")
    
    # Check 5: Serializer test
    print("\n5. SERIALIZER TEST")
    print("-" * 80)
    
    if clubs_with_logo.exists():
        club = clubs_with_logo.first()
        from apps.clubs.serializers import ClubSerializer
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/api/clubs/')
        serializer = ClubSerializer(club, context={'request': request})
        
        data = serializer.data
        print(f"   Testing club: {club.name}")
        print(f"   - logo field: {data.get('logo')}")
        print(f"   - logo_url field: {data.get('logo_url')}")
        
        if data.get('logo') or data.get('logo_url'):
            print(f"   ✅ Serializer returns logo data")
        else:
            print(f"   ❌ Serializer NOT returning logo data!")
    
    # Summary
    print("\n" + "=" * 80)
    print("DIAGNOSIS SUMMARY")
    print("=" * 80)
    
    logo_coverage = (clubs_with_logo.count() / max(all_clubs.count(), 1)) * 100 if all_clubs.exists() else 0
    
    if logo_coverage == 0 and all_clubs.exists():
        print(f"🔴 CRITICAL: {logo_coverage:.1f}% of clubs have logos - likely issue with logo copying")
    elif logo_coverage < 50:
        print(f"🟡 WARNING: Only {logo_coverage:.1f}% of clubs have logos")
    elif logo_coverage >= 80:
        print(f"🟢 OK: {logo_coverage:.1f}% of clubs have logos")
    else:
        print(f"🟡 PARTIAL: {logo_coverage:.1f}% of clubs have logos")

if __name__ == '__main__':
    try:
        check_logo_issue()
    except Exception as e:
        print(f"Error running verification: {str(e)}")
        import traceback
        traceback.print_exc()
