import os
import sys
import logging
from decimal import Decimal
from datetime import timedelta
import requests
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone

try:
    from apps.clubs.models import Club, ClubMembership
    from apps.events.models import Event
    from apps.gallery.models import Gallery, Album, MediaFile
except ImportError as e:
    raise ImportError(f"Required models not found: {e}")

User = get_user_model()
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seed comprehensive and realistic demo data including clubs, free/paid events, and gallery media with real images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-images',
            action='store_true',
            help='Skip downloading images from Unsplash (for offline mode)'
        )

    def handle(self, *args, **options):
        no_images = options.get('no_images', False)

        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS('🌱 Starting CluboraX database seeding...'))
        self.stdout.write("="*60 + "\n")

        # 1. Ensure system admin and demo user exist
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
            self.stdout.write(self.style.SUCCESS('✅ Created demo user: demo@cluborax.com / demo123'))
        else:
            self.stdout.write('⏭️  Demo user already exists')

        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = demo_user

        # 2. Clubs Data Definitions
        clubs_data = [
            {
                'name': 'Computer Science & Robotics Club',
                'category': 'Technical',
                'description': 'We design, build, and program robots for challenges. From mechanical design to AI neural networks, join our cutting-edge community!',
                'mission_statement': 'To inspire students to learn robotics, electronics, and engineering through hands-on building.',
                'advisor_name': 'Dr. John Smith',
                'advisor_email': 'john.smith@university.edu',
                'president_name': 'Alex Rivera',
                'president_email': 'alex.rivera@student.university.edu',
                'location': 'IT Building, Lab 4',
                'meeting_schedule': 'Every Tuesday and Thursday at 5:00 PM',
                'image_url': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
            },
            {
                'name': 'Photography Society',
                'category': 'Arts',
                'description': 'Capture the beauty of campus life and visual storytelling! Share techniques, participate in guided photo walks, and exhibit student work.',
                'mission_statement': 'To promote photography as a creative form of art and self-expression across campus.',
                'advisor_name': 'Ms. Sarah Johnson',
                'advisor_email': 'sarah.johnson@university.edu',
                'president_name': 'Emily Chen',
                'president_email': 'emily.chen@student.university.edu',
                'location': 'Fine Arts Hall, Room 102',
                'meeting_schedule': 'Wednesdays at 4:30 PM',
                'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
            },
            {
                'name': 'Debate Society',
                'category': 'Academic',
                'description': 'Sharpen your critical thinking, argumentation, and public speaking skills. Compete in tournaments and receive mentoring.',
                'mission_statement': 'To foster critical thinking, public speaking, and polite academic discourse.',
                'advisor_name': 'Prof. Robert Taylor',
                'advisor_email': 'robert.taylor@university.edu',
                'president_name': 'Marcus Vance',
                'president_email': 'marcus.vance@student.university.edu',
                'location': 'Humanities Hall, Room 305',
                'meeting_schedule': 'Mondays at 6:00 PM',
                'image_url': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
            },
            {
                'name': 'Music & Band Club',
                'category': 'Arts',
                'description': 'Connect with fellow student musicians, practice in our studio, host live acoustic nights, and form bands.',
                'mission_statement': 'To celebrate diverse musical styles and provide a stage for student musical performances.',
                'advisor_name': 'Dr. Alan Walker',
                'advisor_email': 'alan.walker@university.edu',
                'president_name': 'Chloe Bennett',
                'president_email': 'chloe.bennett@student.university.edu',
                'location': 'Student Center, Music Room B',
                'meeting_schedule': 'Thursdays at 7:00 PM',
                'image_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            },
            {
                'name': 'Sports & Fitness Club',
                'category': 'Sports',
                'description': 'Promote wellness, teamwork, and active healthy lifestyles. Organize friendly campus leagues and group workouts.',
                'mission_statement': 'To build student teamwork, health, and athletic passion through active campus sports leagues.',
                'advisor_name': 'Coach Davis',
                'advisor_email': 'davis.fitness@university.edu',
                'president_name': 'Jordan Lee',
                'president_email': 'jordan.lee@student.university.edu',
                'location': 'University Gym & Arena',
                'meeting_schedule': 'Fridays at 4:00 PM',
                'image_url': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
            },
        ]

        # 3. Seed Clubs
        self.stdout.write("\n📍 Seeding Clubs...")
        created_clubs = {}
        for club_data in clubs_data:
            image_url = club_data.pop('image_url')
            club, created = Club.objects.get_or_create(
                name=club_data['name'],
                defaults={
                    **club_data,
                    'status': 'published',
                    'created_by': admin_user,
                }
            )
            created_clubs[club.name] = club
            if created:
                if not no_images:
                    img_data = self._download_image(image_url)
                    if img_data:
                        filename = f"{club.name.lower().replace(' ', '_')}_logo.jpg"
                        club.logo.save(filename, ContentFile(img_data), save=True)
                        self.stdout.write(self.style.SUCCESS(f"  ✅ Club Created (with Image): {club.name}"))
                    else:
                        self.stdout.write(self.style.WARNING(f"  ⚠️  Club Created (no Image): {club.name}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"  ✅ Club Created: {club.name}"))
                
                # Add demo user as approved member
                ClubMembership.objects.get_or_create(
                    club=club,
                    user=demo_user,
                    defaults={'role': 'member', 'status': 'approved'}
                )
            else:
                self.stdout.write(f"  ⏭️  Club already exists: {club.name}")

        # 4. Events Data Definitions
        events_data = [
            # Technology Events
            {
                'title': 'AI & Machine Learning Bootcamp',
                'description': 'A two-day intensive bootcamp covering the fundamentals of Artificial Intelligence and Machine Learning. Build your first neural network, receive hands-on training, and get a certificate of completion.',
                'category': 'Technology',
                'event_type': 'workshop',
                'start_datetime': timezone.now() + timedelta(days=14, hours=9),
                'end_datetime': timezone.now() + timedelta(days=15, hours=17),
                'venue': 'IT Building, Lab 3',
                'max_participants': 45,
                'is_paid': True,
                'price': Decimal('15.00'),
                'registration_deadline': timezone.now() + timedelta(days=12),
                'status': 'published',
                'club': created_clubs.get('Computer Science & Robotics Club'),
                'requirements': 'Bring your own laptop. Basic Python programming background is helpful.',
                'agenda': 'Day 1: Intro to Machine Learning, Regression, and Data Processing.\nDay 2: Intro to Neural Networks, tensorflow labs, and project presentations.',
                'tags': ['AI', 'Python', 'Machine Learning', 'Workshop'],
                'image_url': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
            },
            {
                'title': 'Hackathon 2026: Build for Impact',
                'description': 'A 24-hour programming hackathon where student teams build innovative software solutions to real-world campus problems. Cash prizes, sponsor swag, food, and energy drinks are provided!',
                'category': 'Technology',
                'event_type': 'competition',
                'start_datetime': timezone.now() + timedelta(days=21, hours=10),
                'end_datetime': timezone.now() + timedelta(days=22, hours=14),
                'venue': 'Main Auditorium & Co-working Space',
                'max_participants': 80,
                'is_paid': True,
                'price': Decimal('5.00'),
                'registration_deadline': timezone.now() + timedelta(days=18),
                'status': 'published',
                'club': created_clubs.get('Computer Science & Robotics Club'),
                'requirements': 'Teams of 2-4 members. Bring laptops, chargers, and sleeping bags.',
                'agenda': '10:00 AM: Hacking Starts\n02:00 PM: Mentor Feedback Sessions\n10:00 AM (Next Day): Submissions & Presentations.',
                'tags': ['Programming', 'Hackathon', 'Competition', 'Coding'],
                'image_url': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800',
            },
            # Arts & Photography
            {
                'title': 'Campus Photography Tour',
                'description': 'Join the Photography Society for an afternoon photo walk around the campus historic sights. Learn framing, camera settings, and golden-hour lighting tricks.',
                'category': 'Arts',
                'event_type': 'workshop',
                'start_datetime': timezone.now() + timedelta(days=7, hours=15),
                'end_datetime': timezone.now() + timedelta(days=7, hours=19),
                'venue': 'Meet at University Main Gate',
                'max_participants': 30,
                'is_paid': False,
                'price': Decimal('0.00'),
                'registration_deadline': timezone.now() + timedelta(days=6),
                'status': 'published',
                'club': created_clubs.get('Photography Society'),
                'requirements': 'Bring any digital camera or a smartphone with manual settings capabilities.',
                'agenda': '03:00 PM: Introduction to framing & composition\n04:00 PM: Photo walk to landmarks\n06:00 PM: Group discussion and editing tips.',
                'tags': ['Photography', 'Arts', 'Workshop', 'Outdoor'],
                'image_url': 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=800',
            },
            # Music Concert
            {
                'title': 'Annual Spring Music Concert',
                'description': 'A spectacular evening featuring live performances by student rock bands, acoustic duos, and soloists. Entry fee covers a custom event t-shirt and snacks.',
                'category': 'Entertainment',
                'event_type': 'cultural',
                'start_datetime': timezone.now() + timedelta(days=12, hours=18),
                'end_datetime': timezone.now() + timedelta(days=12, hours=22),
                'venue': 'University Grand Hall',
                'max_participants': 150,
                'is_paid': True,
                'price': Decimal('8.00'),
                'registration_deadline': timezone.now() + timedelta(days=10),
                'status': 'published',
                'club': created_clubs.get('Music & Band Club'),
                'requirements': 'Smart-casual dress code. Bring digital QR ticket code.',
                'agenda': '06:00 PM: Doors Open & Snacks\n07:00 PM: Acoustic and Solo Performances\n08:30 PM: Student Rock Bands.',
                'tags': ['Concert', 'Music', 'Performance', 'Festival'],
                'image_url': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
            },
            # Debate
            {
                'title': 'Debate Society Weekly Practice',
                'description': 'Friendly debate practice session in British Parliamentary format. We will announce debate motions on the spot. Great for public speaking skills.',
                'category': 'Academic',
                'event_type': 'social',
                'start_datetime': timezone.now() + timedelta(days=3, hours=17),
                'end_datetime': timezone.now() + timedelta(days=3, hours=19),
                'venue': 'Humanities Hall, Room 305',
                'max_participants': 40,
                'is_paid': False,
                'price': Decimal('0.00'),
                'registration_deadline': timezone.now() + timedelta(days=2),
                'status': 'published',
                'club': created_clubs.get('Debate Society'),
                'requirements': 'No prior public speaking experience required.',
                'agenda': '05:00 PM: Debate structure overview\n05:15 PM: Motions revealed & team prep\n05:30 PM: Debate rounds start.',
                'tags': ['Debate', 'Speaking', 'Academic', 'Practice'],
                'image_url': 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
            },
            # Sports
            {
                'title': 'Badminton League Open Trials',
                'description': 'Showcase your skills at our open court tournament. Top 3 performers receive a professional badminton racket set.',
                'category': 'Sports',
                'event_type': 'competition',
                'start_datetime': timezone.now() + timedelta(days=10, hours=9),
                'end_datetime': timezone.now() + timedelta(days=10, hours=16),
                'venue': 'Indoor Sports Complex',
                'max_participants': 64,
                'is_paid': False,
                'price': Decimal('0.00'),
                'registration_deadline': timezone.now() + timedelta(days=8),
                'status': 'published',
                'club': created_clubs.get('Sports & Fitness Club'),
                'requirements': 'Bring sports clothing and non-marking indoor shoes. Badminton racket is recommended.',
                'agenda': '09:00 AM: Group bracket stages\n01:00 PM: Knockout rounds\n03:00 PM: Finals and Prize ceremony.',
                'tags': ['Badminton', 'Tournament', 'Sports', 'Trials'],
                'image_url': 'https://images.unsplash.com/photo-1502224562085-639556652f33?w=800',
            },
        ]

        # 5. Seed Events
        self.stdout.write("\n📍 Seeding Events...")
        for event_data in events_data:
            image_url = event_data.pop('image_url')
            event, created = Event.objects.get_or_create(
                title=event_data['title'],
                defaults={
                    **event_data,
                    'created_by': admin_user,
                }
            )
            if created:
                if not no_images:
                    img_data = self._download_image(image_url)
                    if img_data:
                        filename = f"{event.title.lower().replace(' ', '_')}_poster.jpg"
                        event.poster_image.save(filename, ContentFile(img_data), save=True)
                        self.stdout.write(self.style.SUCCESS(f"  ✅ Event Created (with Image): {event.title} (${event.price})"))
                    else:
                        self.stdout.write(self.style.WARNING(f"  ⚠️  Event Created (no Image): {event.title}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"  ✅ Event Created: {event.title}"))
            else:
                self.stdout.write(f"  ⏭️  Event already exists: {event.title}")

        # 6. Seed Gallery, Album, and MediaFiles
        self.stdout.write("\n📍 Seeding Gallery & Media Files...")
        galleries_data = [
            {
                'title': 'Campus Life & Student Activities',
                'description': 'Glimpses of daily university energy, study sessions, student groups, and graduation events.',
                'gallery_type': 'campus',
                'cover_image_url': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                'photos': [
                    {
                        'title': 'Graduation Celebration',
                        'description': 'Graduates tossing their caps after the commencement ceremony.',
                        'url': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800'
                    },
                    {
                        'title': 'Study Group in Library',
                        'description': 'Students working on a computer science programming project inside the main library.',
                        'url': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a91?w=800'
                    }
                ]
            },
            {
                'title': 'Robotics Lab & Hackathons',
                'description': 'Student builders coding microcontroller platforms and soldering robotics components.',
                'gallery_type': 'event',
                'cover_image_url': 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800',
                'photos': [
                    {
                        'title': 'Robotics Arm Testing',
                        'description': 'Calibrating a custom robotic arm system in the campus IT lab.',
                        'url': 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800'
                    },
                    {
                        'title': 'Embedded Coding Session',
                        'description': 'Student debugging firmware code for an autonomous obstacle-avoidance vehicle.',
                        'url': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
                    }
                ]
            },
            {
                'title': 'Sports Leagues & Tournaments',
                'description': 'Highlights from the annual fitness festivals, races, and badminton tournament courts.',
                'gallery_type': 'general',
                'cover_image_url': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
                'photos': [
                    {
                        'title': 'Sprint Track Finish',
                        'description': 'Runners competing in the final stretch of the campus 5K fitness sprint.',
                        'url': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'
                    },
                    {
                        'title': 'Badminton Finals',
                        'description': 'Dynamic rally during the mixed-doubles badminton finals.',
                        'url': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800'
                    }
                ]
            }
        ]

        for gal_data in galleries_data:
            photos = gal_data.pop('photos')
            cover_image_url = gal_data.pop('cover_image_url')
            
            gallery, created = Gallery.objects.get_or_create(
                title=gal_data['title'],
                defaults={
                    **gal_data,
                    'created_by': admin_user,
                    'is_public': True,
                    'is_featured': True,
                }
            )
            
            if created:
                if not no_images:
                    cover_img = self._download_image(cover_image_url)
                    if cover_img:
                        filename = f"{gallery.title.lower().replace(' ', '_')}_cover.jpg"
                        gallery.cover_image.save(filename, ContentFile(cover_img), save=True)
                
                self.stdout.write(self.style.SUCCESS(f"  ✅ Gallery Created: {gallery.title}"))

                # Create an Album inside this gallery
                album, album_created = Album.objects.get_or_create(
                    gallery=gallery,
                    name='Default Album',
                    defaults={
                        'description': f'Media collection for {gallery.title}',
                        'created_by': admin_user,
                    }
                )

                # Add Photos to the Gallery and Album
                for photo_data in photos:
                    img_data = self._download_image(photo_data['url'])
                    if img_data:
                        filename = f"{photo_data['title'].lower().replace(' ', '_')}.jpg"
                        
                        media_file = MediaFile.objects.create(
                            gallery=gallery,
                            album=album,
                            title=photo_data['title'],
                            description=photo_data['description'],
                            media_type='image',
                            file=ContentFile(img_data, name=filename),
                            original_filename=filename,
                            file_size=len(img_data),
                            status='approved',
                            is_approved=True,
                            uploaded_by=admin_user,
                        )
                        self.stdout.write(f"    - Added Media Photo: {photo_data['title']}")
            else:
                self.stdout.write(f"  ⏭️  Gallery already exists: {gallery.title}")

        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding process successfully completed!'))
        self.stdout.write("="*60 + "\n")

    def _download_image(self, url, timeout=12):
        """Helper to download image bytes with graceful fallback on failure"""
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code == 200:
                return response.content
        except Exception as e:
            logger.warning(f"Image download failed for {url}: {e}")
        return None
