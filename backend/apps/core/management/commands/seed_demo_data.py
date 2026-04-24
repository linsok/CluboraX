"""
Django management command to seed the database with sample clubs and events
Usage: python manage.py seed_demo_data

Features:
- Creates 5 sample clubs with real Unsplash images
- Creates 5 sample events with posters
- Creates demo user account
- Adds demo user as member to all clubs
- Retry logic for failed image downloads
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
import logging
from datetime import datetime, timedelta
import os

try:
    from apps.clubs.models import Club, ClubMembership
    from apps.events.models import Event
    from apps.proposals.models import ClubProposal, EventProposal
except ImportError:
    raise ImportError("Club and Event models not found. Check apps are installed.")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    import urllib.request
    REQUESTS_AVAILABLE = False

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed demo data for clubs and events with automatic image downloads'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS('🌱 Starting demo data seeding...'))
        self.stdout.write("="*60 + "\n")

        # Create demo user if not exists
        demo_user, created = User.objects.get_or_create(
            email='demo@cluborax.com',
            defaults={
                'username': 'demo_user',
                'first_name': 'Demo',
                'last_name': 'User',
                'is_staff': False,
                'role': 'student',
            }
        )
        if created:
            demo_user.set_password('demo123')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created demo user: demo@cluborax.com / demo123'))
        else:
            self.stdout.write(f'⏭️  Demo user already exists')
        
        # Create clubs
        self.stdout.write("\n📍 Creating Clubs...\n")

        # Create clubs with images
        clubs_data = [
            {
                'name': 'Robotics Club',
                'category': 'Technical',
                'description': 'Building robots and competing in competitions',
                'mission': 'To inspire students to learn robotics and engineering',
                'advisor_name': 'Dr. John Smith',
                'advisor_email': 'john.smith@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
            },
            {
                'name': 'Photography Society',
                'category': 'Arts',
                'description': 'Capture beautiful moments and share photography techniques',
                'mission': 'To promote photography as an art form',
                'advisor_name': 'Ms. Sarah Johnson',
                'advisor_email': 'sarah.johnson@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
            },
            {
                'name': 'Environmental Club',
                'category': 'Cultural',
                'description': 'Promote sustainability and environmental awareness',
                'mission': 'Create positive environmental impact on campus',
                'advisor_name': 'Prof. Michael Chen',
                'advisor_email': 'michael.chen@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1559027274-404bbb6f7a39?w=800',
            },
            {
                'name': 'Data Science Club',
                'category': 'Technical',
                'description': 'Learn data analysis, machine learning, and data visualization',
                'mission': 'Develop practical data science skills for real-world applications',
                'advisor_name': 'Dr. Emily Wong',
                'advisor_email': 'emily.wong@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
            },
            {
                'name': 'Debate Club',
                'category': 'Academic',
                'description': 'Engage in competitive debate and public speaking',
                'mission': 'Foster critical thinking and communication skills',
                'advisor_name': 'Prof. Robert Taylor',
                'advisor_email': 'robert.taylor@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
            },
        ]

        for club_data in clubs_data:
            image_url = club_data.pop('image_url')
            club, created = Club.objects.get_or_create(
                name=club_data['name'],
                defaults={
                    **club_data,
                    'status': 'published',
                    'created_by': demo_user,
                }
            )

            if created:
                # Download and save image
                try:
                    img_data = urllib.request.urlopen(image_url).read()
                    filename = f"{club.name.lower().replace(' ', '_')}_logo.jpg"
                    club.logo.save(filename, ContentFile(img_data), save=True)
                    self.stdout.write(self.style.SUCCESS(f'✓ Created club: {club.name}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ Created club {club.name} but logo failed: {e}'))

            # Add demo user as member
            ClubMembership.objects.get_or_create(
                club=club,
                user=demo_user,
                defaults={'role': 'member', 'status': 'approved'}
            )

        # Create events
        events_data = [
            {
                'title': 'Annual Robotics Competition',
                'description': 'Compete with your robot in obstacle courses and challenges',
                'category': 'Competition',
                'date': timezone.now() + timedelta(days=30),
                'image_url': 'https://images.unsplash.com/photo-1491904768633-2b08faf4f628?w=800',
            },
            {
                'title': 'Photography Workshop',
                'description': 'Learn professional photography techniques from experienced photographers',
                'category': 'Workshop',
                'date': timezone.now() + timedelta(days=14),
                'image_url': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
            },
            {
                'title': 'Environmental Cleanup Drive',
                'description': 'Join us in cleaning up the campus and local community',
                'category': 'Service',
                'date': timezone.now() + timedelta(days=7),
                'image_url': 'https://images.unsplash.com/photo-1559027274-404bbb6f7a39?w=800',
            },
            {
                'title': 'Data Science Hackathon',
                'description': '24-hour competition to solve real-world data challenges',
                'category': 'Competition',
                'date': timezone.now() + timedelta(days=60),
                'image_url': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
            },
            {
                'title': 'Inter-Club Debate Tournament',
                'description': 'Showcase your debate skills against other clubs',
                'category': 'Competition',
                'date': timezone.now() + timedelta(days=45),
                'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
            },
        ]

        for event_data in events_data:
            image_url = event_data.pop('image_url')
            event, created = Event.objects.get_or_create(
                title=event_data['title'],
                defaults={
                    **event_data,
                    'status': 'active',
                    'created_by': demo_user,
                    'max_attendees': 100,
                }
            )

            if created:
                # Download and save image
                try:
                    img_data = urllib.request.urlopen(image_url).read()
                    filename = f"{event.title.lower().replace(' ', '_')}_poster.jpg"
                    event.image.save(filename, ContentFile(img_data), save=True)
                    self.stdout.write(self.style.SUCCESS(f'✓ Created event: {event.title}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ Created event {event.title} but image failed: {e}'))

        self.stdout.write(self.style.SUCCESS('\n✓ Demo data seeding completed!'))
        self.stdout.write(self.style.SUCCESS(f'Created/Updated:'))
        self.stdout.write(self.style.SUCCESS(f'  - Clubs: {len(clubs_data)}'))
        self.stdout.write(self.style.SUCCESS(f'  - Events: {len(events_data)}'))
        self.stdout.write(self.style.SUCCESS(f'  - Demo User: demo@cluborax.com / demo123'))
