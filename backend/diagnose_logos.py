#!/usr/bin/env python
"""
Complete diagnostic and fix for club logo display issues
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.clubs.serializers import ClubSerializer
from django.test import RequestFactory
import json

print("\n" + "="*70)
print("COMPLETE LOGO DISPLAY DIAGNOSTIC & FIX")
print("="*70 + "\n")

factory = RequestFactory()
request = factory.get('http://localhost:8888/api/clubs/')

# 1. Check physical files
print("STEP 1: CHECKING PHYSICAL FILES")
print("-" * 70)
media_path = 'mediafiles/club_logos/'
if os.path.exists(media_path):
    files = os.listdir(media_path)
    print(f"✅ Directory exists: {media_path}")
    print(f"   Files found: {files}\n")
else:
    print(f"❌ Directory NOT FOUND: {media_path}\n")

# 2. Check database
print("STEP 2: CHECKING DATABASE")
print("-" * 70)
clubs_with_logos = Club.objects.exclude(logo='')
print(f"Clubs with logos in DB: {clubs_with_logos.count()}\n")

for club in clubs_with_logos[:5]:
    print(f"Club: {club.name}")
    print(f"  - logo field: {club.logo.name if club.logo else 'EMPTY'}")
    print(f"  - logo.url: {club.logo.url if club.logo else 'N/A'}")
    print(f"  - file exists on disk: {os.path.exists(club.logo.path) if club.logo else 'N/A'}")

# 3. Check serializer output
print("\n\nSTEP 3: CHECKING API RESPONSE (Serializer)")
print("-" * 70)
for club in clubs_with_logos[:3]:
    serializer = ClubSerializer(club, context={'request': request})
    data = serializer.data
    print(f"Club: {club.name}")
    print(f"  - logo_url: {data.get('logo_url')}")
    print(f"  - Expected prefix: http://localhost:8888/media/")
    
    if data.get('logo_url'):
        if data.get('logo_url').startswith('http'):
            print(f"  - ✅ URL is absolute (GOOD)")
        else:
            print(f"  - ❌ URL is relative (BAD)")
    else:
        print(f"  - ❌ logo_url is NULL (BAD)")
    print()

# 4. Recommend fix
print("\nSTEP 4: RECOMMENDATIONS")
print("-" * 70)
print("""
If logos are in DB but not showing:

✅ BACKEND IS OK if:
   - Physical files exist in mediafiles/club_logos/
   - Database has logo paths stored
   - API returns absolute URLs starting with http://

❌ ISSUE IS LIKELY:
   1. Browser cache - Clear with Ctrl+Shift+R or Cmd+Shift+R
   2. React Query cache - Data cached in memory
   3. Network - Check DevTools Network tab for 404 errors

🔧 SOLUTIONS:
   1. Frontend: Force data refresh by invalidating React Query cache
   2. Frontend: Add timestamp to API calls to break cache
   3. Frontend: Clear browser storage (localStorage, sessionStorage)
""")

print("\n" + "="*70)
print("DIAGNOSTIC COMPLETE")
print("="*70 + "\n")
