"""
Django management command to seed the database with sample clubs and events
Usage: python manage.py seed_demo_data

Enhanced version with:
- Better error handling and retry logic
- Improved formatting and progress display
- Fallback for image downloads
- Comprehensive summary
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
import logging
from datetime import timedelta

try:
    from apps.clubs.models import Club, ClubMembership
    from apps.events.models import Event
except ImportError as e:
    raise ImportError(f"Required models not found: {e}")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    import urllib.request
    REQUESTS_AVAILABLE = False

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed demo data for clubs and events with robust error handling'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-images',
            action='store_true',
            help='Skip image downloads (useful offline)'
        )

    def handle(self, *args, **options):
        no_images = options.get('no_images', False)
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS('🌱 Starting demo data seeding...'))
        self.stdout.write("="*60 + "\n")

        # Create demo user
        demo_user, user_created = User.objects.get_or_create(
            email='demo@cluborax.com',
            defaults={
                'username': 'demo_user',
                'first_name': 'Demo',
                'last_name': 'User',
                'is_staff': False,
                'role': 'student',
            }
        )
        if user_created:
            demo_user.set_password('demo123')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created demo user: demo@cluborax.com / demo123'))
        else:
            self.stdout.write(f'⏭️  Demo user already exists')

        # Clubs data
        clubs_data = [
            {
                'name': 'Robotics Club',
                'category': 'Technical',
                'description': 'We design, build, and program robots for competitions and learning. From mechanical design to AI algorithms, join our innovative community!',
                'mission': 'To inspire students to learn robotics and engineering',
                'advisor_name': 'Dr. John Smith',
                'advisor_email': 'john.smith@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
            },
            {
                'name': 'Photography Society',
                'category': 'Arts',
                'description': 'Capture the world through our lens! Share techniques, organize photo walks, and exhibit student work.',
                'mission': 'To promote photography as an art form',
                'advisor_name': 'Ms. Sarah Johnson',
                'advisor_email': 'sarah.johnson@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
            },
            {
                'name': 'Environmental Club',
                'category': 'Cultural',
                'description': 'Fight climate change and promote sustainability on campus. Join us for environmental advocacy and green initiatives.',
                'mission': 'Create positive environmental impact on campus',
                'advisor_name': 'Prof. Michael Chen',
                'advisor_email': 'michael.chen@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
            },
            {
                'name': 'Data Science Club',
                'category': 'Technical',
                'description': 'Explore machine learning, data analysis, and AI. Work on real-world projects and competitions.',
                'mission': 'Develop practical data science skills for real-world applications',
                'advisor_name': 'Dr. Emily Wong',
                'advisor_email': 'emily.wong@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
            },
            {
                'name': 'Debate Club',
                'category': 'Academic',
                'description': 'Sharpen your critical thinking and public speaking skills. Compete in debates and win recognition.',
                'mission': 'Foster critical thinking and communication skills',
                'advisor_name': 'Prof. Robert Taylor',
                'advisor_email': 'robert.taylor@university.edu',
                'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
            },
        ]

        # Events data
        events_data = [
            {
                'title': 'Annual Robotics Competition',
                'description': 'Compete with your robot in obstacle courses and challenges. Teams compete in robotics challenges. Registration required.',
                'category': 'Competition',
                'date': timezone.now() + timedelta(days=30),
                'image_url': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
            },
            {
                'title': 'Photography Workshop',
                'description': 'Professional photography training with industry experts. Learn composition, lighting, and post-processing techniques.',
                'category': 'Workshop',
                'date': timezone.now() + timedelta(days=14),
                'image_url': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
            },
            {
                'title': 'Environmental Cleanup Drive',
                'description': 'Help keep our campus green! Join us for a community service day focused on environmental conservation.',
                'category': 'Service',
                'date': timezone.now() + timedelta(days=7),
                'image_url': 'https://images.unsplash.com/photo-1559027615-cd1628902e4a?w=800',
            },
            {
                'title': 'Data Science Hackathon',
                'description': '24-hour hackathon to solve real-world problems using data science and machine learning.',
                'category': 'Competition',
                'date': timezone.now() + timedelta(days=60),
                'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            },
            {
                'title': 'Inter-Club Debate Tournament',
                'description': 'Friendly debate competition between clubs. Improve your rhetoric and argumentation skills.',
                'category': 'Tournament',
                'date': timezone.now() + timedelta(days=45),
                'image_url': 'https://images.unsplash.com/photo-1540575467063-178f50902556?w=800',
            },
        ]

        # Create clubs
        self.stdout.write("📍 Creating Clubs...\n")
        clubs_created = 0
        
        for club_data in clubs_data:
            image_url = club_data.pop('image_url')
            try:
                club, created = Club.objects.get_or_create(
                    name=club_data['name'],
                    defaults={
                        **club_data,
                        'status': 'published',
                        'created_by': demo_user,
                    }
                )

                if created:
                    if not no_images:
                        try:
                            img_data = self._download_image(image_url)
                            if img_data:
                                filename = f"{club.name.lower().replace(' ', '_')}_logo.jpg"
                                club.logo.save(filename, ContentFile(img_data), save=True)
                                self.stdout.write(f"  ✅ {club.name}")
                            else:
                                self.stdout.write(f"  ⚠️  {club.name} (no image)")
                        except Exception as e:
                            self.stdout.write(f"  ⚠️  {club.name} (image failed)")
                            logger.error(f"Image download failed for {club.name}: {e}")
                    else:
                        self.stdout.write(f"  ✅ {club.name} (no images mode)")
                    
                    clubs_created += 1
                else:
                    self.stdout.write(f"  ⏭️  {club.name} (already exists)")

                # Add demo user as member
                ClubMembership.objects.get_or_create(
                    club=club,
                    user=demo_user,
                    defaults={'role': 'member', 'status': 'approved'}
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ {club_data["name"]}: {e}'))

        self.stdout.write(f"\n✅ Processed {len(clubs_data)} clubs\n")

        # Create events
        self.stdout.write("📍 Creating Events...\n")
        events_created = 0
        
        for event_data in events_data:
            image_url = event_data.pop('image_url')
            try:
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
                    if not no_images:
                        try:
                            img_data = self._download_image(image_url)
                            if img_data:
                                filename = f"{event.title.lower().replace(' ', '_')}_poster.jpg"
                                # Try to save to 'image' or 'poster' field depending on model
                                if hasattr(event, 'image'):
                                    event.image.save(filename, ContentFile(img_data), save=True)
                                elif hasattr(event, 'poster'):
                                    event.poster.save(filename, ContentFile(img_data), save=True)
                                self.stdout.write(f"  ✅ {event.title}")
                            else:
                                self.stdout.write(f"  ⚠️  {event.title} (no image)")
                        except Exception as e:
                            self.stdout.write(f"  ⚠️  {event.title} (image failed)")
                            logger.error(f"Image download failed for {event.title}: {e}")
                    else:
                        self.stdout.write(f"  ✅ {event.title} (no images mode)")
                    
                    events_created += 1
                else:
                    self.stdout.write(f"  ⏭️  {event.title} (already exists)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ {event_data["title"]}: {e}'))

        self.stdout.write(f"\n✅ Processed {len(events_data)} events\n")

        # Summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("✅ Demo data seeding complete!"))
        self.stdout.write("="*60)
        self.stdout.write("\n📊 SUMMARY:")
        self.stdout.write(f"  • Clubs processed: {len(clubs_data)}")
        self.stdout.write(f"  • Clubs created: {clubs_created}")
        self.stdout.write(f"  • Events processed: {len(events_data)}")
        self.stdout.write(f"  • Events created: {events_created}")
        self.stdout.write(f"  • Demo user: demo@cluborax.com / demo123")
        self.stdout.write("\n🚀 Start your servers and login to see the demo data!\n")

    def _download_image(self, url, timeout=10, retries=2):
        """
        Download image from URL with retry logic
        Returns ContentFile or None on failure
        """
        for attempt in range(retries):
            try:
                if REQUESTS_AVAILABLE:
                    response = requests.get(url, timeout=timeout)
                    if response.status_code == 200:
                        return ContentFile(response.content)
                else:
                    import urllib.request
                    img_data = urllib.request.urlopen(url).read()
                    return ContentFile(img_data)
            except Exception as e:
                if attempt < retries - 1:
                    continue
                logger.warning(f"Failed to download {url}: {e}")
        
        return None
