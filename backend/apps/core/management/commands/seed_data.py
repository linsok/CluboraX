"""
Management command to seed the database with sample clubs, events, and gallery items.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample clubs, events, and gallery items'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Get or create an admin/organizer user for created_by
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR('No superuser found. Run: python manage.py createsuperuser'))
            return

        self._seed_clubs(admin)
        self._seed_events(admin)
        self._seed_gallery(admin)

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    # ─── Clubs ────────────────────────────────────────────────────────────────
    def _seed_clubs(self, admin):
        from apps.clubs.models import Club

        clubs_data = [
            {
                'name': 'Computer Science Club',
                'description': 'Explore the world of technology and programming',
                'category': 'Academic',
                'mission_statement': 'Fostering innovation and excellence in technology through coding competitions, hackathons, and industry networking.',
                'status': 'approved',
                'advisor_name': 'Prof. Sarah Johnson',
                'advisor_email': 'sjohnson@campus.edu',
                'meeting_schedule': 'Every Wednesday at 6:00 PM',
                'requirements': 'Open to all students interested in technology. No prior experience required.',
                'tags': ['technology', 'programming', 'ai', 'hackathon'],
                'social_links': {'github': 'csclub-campus', 'linkedin': 'cs-club-campus'},
            },
            {
                'name': 'Photography Club',
                'description': 'Capture moments and express creativity through photography',
                'category': 'Arts',
                'mission_statement': 'Celebrating visual storytelling through photography workshops, exhibitions, and competitions.',
                'status': 'approved',
                'advisor_name': 'Prof. Michael Chen',
                'advisor_email': 'mchen@campus.edu',
                'meeting_schedule': 'Every Tuesday at 5:00 PM',
                'requirements': 'Basic camera or smartphone required. Open to all students.',
                'tags': ['photography', 'art', 'exhibition', 'creative'],
                'social_links': {'instagram': '@photoclub_campus'},
            },
            {
                'name': 'Debate Society',
                'description': 'Develop critical thinking and public speaking skills',
                'category': 'Academic',
                'mission_statement': 'Sharpening minds through rigorous debate training, inter-university competitions, and public discourse.',
                'status': 'approved',
                'advisor_name': 'Prof. Emily Rodriguez',
                'advisor_email': 'erodriguez@campus.edu',
                'meeting_schedule': 'Every Thursday at 7:00 PM',
                'requirements': 'Strong interest in public speaking and current events.',
                'tags': ['debate', 'public-speaking', 'critical-thinking'],
                'social_links': {'instagram': '@debate_campus'},
            },
            {
                'name': 'Music Club',
                'description': 'Share your passion for music and performance',
                'category': 'Arts',
                'mission_statement': 'Bringing together musicians and music lovers through concerts, jam sessions, and creative collaboration.',
                'status': 'approved',
                'advisor_name': 'Prof. David Martinez',
                'advisor_email': 'dmartinez@campus.edu',
                'meeting_schedule': 'Every Monday at 6:30 PM',
                'requirements': 'Open to all students. Auditions for performance groups.',
                'tags': ['music', 'performance', 'concert', 'band'],
                'social_links': {'instagram': '@musicclub_campus', 'youtube': 'MusicClubCampus'},
            },
            {
                'name': 'Sports & Fitness Club',
                'description': 'Promote health, fitness, and athletic excellence on campus',
                'category': 'Sports',
                'mission_statement': 'Encouraging active lifestyles and teamwork through various sports programs and fitness events.',
                'status': 'approved',
                'advisor_name': 'Coach Alex Turner',
                'advisor_email': 'aturner@campus.edu',
                'meeting_schedule': 'Every Saturday at 8:00 AM',
                'requirements': 'Open to all students. Any fitness level welcome.',
                'tags': ['sports', 'fitness', 'health', 'teamwork'],
                'social_links': {'instagram': '@sportsclub_campus'},
            },
        ]

        created = 0
        for data in clubs_data:
            _, was_created = Club.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'created_by': admin},
            )
            if was_created:
                created += 1

        self.stdout.write(f'  Clubs: {created} created, {len(clubs_data) - created} already existed')

    # ─── Events ───────────────────────────────────────────────────────────────
    def _seed_events(self, admin):
        from apps.events.models import Event

        now = timezone.now()

        events_data = [
            {
                'title': 'Tech Innovation Summit 2026',
                'description': 'Join us for an exciting day of technology showcases, workshops, and networking with industry leaders. Students present projects in AI, robotics, web dev, and more.',
                'category': 'Technology',
                'event_type': 'academic',
                'start_datetime': now + timedelta(days=14),
                'end_datetime': now + timedelta(days=14, hours=8),
                'venue': 'Main Auditorium, Building A',
                'max_participants': 500,
                'is_paid': False,
                'status': 'approved',
                'tags': ['technology', 'innovation', 'networking', 'ai'],
                'requirements': 'Open to all students and faculty.',
            },
            {
                'title': 'Spring Music Festival',
                'description': 'A vibrant celebration of musical talent featuring student bands, solo artists, and special guest performances. Food stalls and art installations included.',
                'category': 'Arts & Entertainment',
                'event_type': 'cultural',
                'start_datetime': now + timedelta(days=21),
                'end_datetime': now + timedelta(days=21, hours=5),
                'venue': 'Campus Outdoor Grounds',
                'max_participants': 1000,
                'is_paid': True,
                'price': 5.00,
                'status': 'approved',
                'tags': ['music', 'festival', 'entertainment', 'arts'],
                'requirements': 'Ticket required for entry.',
            },
            {
                'title': 'Career Development Workshop',
                'description': 'Enhance your professional skills with hands-on sessions covering resume writing, LinkedIn optimization, interview techniques, and career planning strategies.',
                'category': 'Professional Development',
                'event_type': 'workshop',
                'start_datetime': now + timedelta(days=7),
                'end_datetime': now + timedelta(days=7, hours=3),
                'venue': 'Room 203, Business Building',
                'max_participants': 50,
                'is_paid': False,
                'status': 'approved',
                'tags': ['career', 'workshop', 'professional', 'resume'],
                'requirements': 'Bring your resume draft.',
            },
            {
                'title': 'Inter-Faculty Sports Day',
                'description': 'Annual inter-faculty sports competition featuring basketball, volleyball, relay races, and chess. Compete for the championship trophy and represent your department!',
                'category': 'Sports',
                'event_type': 'sports',
                'start_datetime': now + timedelta(days=28),
                'end_datetime': now + timedelta(days=28, hours=10),
                'venue': 'Sports Complex & Field',
                'max_participants': 300,
                'is_paid': False,
                'status': 'approved',
                'tags': ['sports', 'competition', 'teamwork', 'fitness'],
                'requirements': 'Register with your faculty team.',
            },
            {
                'title': 'Cultural Diversity Night',
                'description': 'Celebrate the rich cultural diversity of our campus through music, dance, traditional food, and storytelling. Every culture is welcome to perform and share.',
                'category': 'Cultural',
                'event_type': 'cultural',
                'start_datetime': now + timedelta(days=35),
                'end_datetime': now + timedelta(days=35, hours=4),
                'venue': 'Open Air Theater',
                'max_participants': 400,
                'is_paid': False,
                'status': 'approved',
                'tags': ['culture', 'diversity', 'performance', 'food'],
                'requirements': 'No registration needed. All are welcome.',
            },
        ]

        created = 0
        for data in events_data:
            _, was_created = Event.objects.get_or_create(
                title=data['title'],
                defaults={**data, 'created_by': admin},
            )
            if was_created:
                created += 1

        self.stdout.write(f'  Events: {created} created, {len(events_data) - created} already existed')

    # ─── Gallery ──────────────────────────────────────────────────────────────
    def _seed_gallery(self, admin):
        from apps.gallery.models import Gallery

        from datetime import date

        gallery_data = [
            {
                'title': 'Annual Tech Fest Highlights',
                'description': 'Students showcasing innovative projects, prototypes, and research work at the annual technology festival.',
                'gallery_type': 'event',
                'is_public': True,
                'is_featured': True,
                'tags': ['technology', 'innovation', 'projects', 'ai'],
                'location': 'Main Auditorium',
                'date_taken': date.today() - timedelta(days=30),
            },
            {
                'title': 'Spring Music Concert 2026',
                'description': 'A night of incredible musical performances by student bands, orchestras, and solo vocalists.',
                'gallery_type': 'event',
                'is_public': True,
                'is_featured': True,
                'tags': ['music', 'performance', 'concert', 'entertainment'],
                'location': 'Campus Auditorium',
                'date_taken': date.today() - timedelta(days=14),
            },
            {
                'title': 'Campus Life - General',
                'description': 'Candid moments capturing the everyday beauty of campus life, from study sessions to social gatherings.',
                'gallery_type': 'general',
                'is_public': True,
                'is_featured': False,
                'tags': ['campus', 'life', 'students', 'community'],
                'location': 'Campus-wide',
                'date_taken': date.today() - timedelta(days=7),
            },
            {
                'title': 'CS Club Hackathon',
                'description': 'Teams competed around the clock to build innovative software solutions at the 24-hour hackathon.',
                'gallery_type': 'club',
                'is_public': True,
                'is_featured': False,
                'tags': ['programming', 'hackathon', 'coding', 'competition'],
                'location': 'Tech Building',
                'date_taken': date.today() - timedelta(days=45),
            },
            {
                'title': 'Sports Day 2026',
                'description': 'Action-packed inter-faculty sports competition highlighting athletic talent and teamwork.',
                'gallery_type': 'event',
                'is_public': True,
                'is_featured': True,
                'tags': ['sports', 'athletics', 'competition', 'fitness'],
                'location': 'Sports Complex',
                'date_taken': date.today() - timedelta(days=60),
            },
        ]

        created = 0
        for data in gallery_data:
            _, was_created = Gallery.objects.get_or_create(
                title=data['title'],
                defaults={**data, 'created_by': admin},
            )
            if was_created:
                created += 1

        self.stdout.write(f'  Gallery: {created} created, {len(gallery_data) - created} already existed')
