#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from pathlib import Path

# List all files in mediafiles
media_path = Path('mediafiles')
if media_path.exists():
    print("📁 Files in mediafiles:")
    for root, dirs, files in os.walk(media_path):
        for file in files:
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, 'mediafiles')
            print(f"   {rel_path}")
else:
    print("❌ mediafiles directory not found")

# Find Room 12
room12 = Club.objects.filter(name='Room 12').first()
if room12:
    print(f"\n✅ Found Room 12 Club")
    print(f"   Current logo: {room12.logo}")
    print(f"   Has logo: {bool(room12.logo)}")
else:
    print("\n❌ Room 12 Club not found")
