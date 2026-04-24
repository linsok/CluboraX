import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings_minimal')

import django
django.setup()

from apps.events.models import Event
from apps.clubs.models import Club

e = Event.objects.first()
c = Club.objects.first()

if e:
    print("=== EVENT ===")
    print(f"Title: {e.title}")
    print(f"Created by: {e.created_by.username if e.created_by else 'None'}")
    print(f"Club: {e.club.name if e.club else 'None'}")
    print(f"Requirements: {e.requirements}")
    print(f"Agenda: {e.agenda}")
    print()

if c:
    print("=== CLUB ===")
    print(f"Name: {c.name}")
    print(f"Advisor Name: {c.advisor_name}")
    print(f"Advisor Email: {c.advisor_email}")
    print(f"Meeting Schedule: {c.meeting_schedule}")
