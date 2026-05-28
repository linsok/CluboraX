"""
Seed script: add paid events to the database.
Run with:  venv\\Scripts\\python.exe seed_paid_events.py
(idempotent - skips events that already exist by title)
"""
import os
import sys
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.clubs.models import Club
from apps.events.models import Event

# ─── Helpers ────────────────────────────────────────────────────────────────

def dt(days_ahead, hour=9):
    """Return an aware datetime N days in the future at the given hour."""
    return timezone.now().replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)

# ─── Pick actors ─────────────────────────────────────────────────────────────

organizer = User.objects.filter(role='organizer').first()
if not organizer:
    print("ERROR: No organizer user found. Please create one first.")
    sys.exit(1)

print("Using organizer: " + organizer.email)

clubs = {c.name: c for c in Club.objects.all()}
cs_club      = clubs.get('Computer Science Club')
music_club   = clubs.get('Music Club')
photo_club   = clubs.get('Photography Club')
debate_club  = clubs.get('Debate Society')
sports_club  = clubs.get('Sports & Fitness Club')
running_club = clubs.get('Running')

# ─── Event definitions ───────────────────────────────────────────────────────

EVENTS = [
    # ── Tech / CS ──────────────────────────────────────────────────────────
    dict(
        title="AI & Machine Learning Bootcamp",
        description=(
            "A two-day intensive bootcamp covering the fundamentals of Artificial Intelligence "
            "and Machine Learning. Participants will build their first neural network, work with "
            "real datasets, and receive a certificate of completion.\n\n"
            "Topics covered:\n"
            "- Python for Data Science\n"
            "- Supervised & Unsupervised Learning\n"
            "- Deep Learning with TensorFlow\n"
            "- Model Deployment basics"
        ),
        category="Technology",
        event_type="workshop",
        start_datetime=dt(14, 8),
        end_datetime=dt(15, 18),
        venue="IT Building, Lab 3",
        max_participants=40,
        is_paid=True,
        price=Decimal("15.00"),
        registration_deadline=dt(11, 23),
        status="published",
        club=cs_club,
        tags=["AI", "Machine Learning", "Python", "Workshop"],
        requirements="Basic Python knowledge required. Bring your own laptop.",
        agenda=(
            "Day 1 (08:00-18:00): Python refresher, data preprocessing, supervised learning\n"
            "Day 2 (08:00-18:00): Neural networks, deep learning, model deployment, graduation ceremony"
        ),
    ),
    dict(
        title="Hackathon 2026: Build for Impact",
        description=(
            "A 24-hour hackathon where teams of 2-4 students compete to build innovative solutions "
            "to real-world campus problems. Cash prizes, sponsor swag, and networking opportunities await!\n\n"
            "Prize pool:\n"
            "1st Place: $200\n"
            "2nd Place: $100\n"
            "3rd Place: $50\n\n"
            "Meals, snacks, and energy drinks provided throughout the event."
        ),
        category="Technology",
        event_type="competition",
        start_datetime=dt(21, 9),
        end_datetime=dt(22, 9),
        venue="Main Auditorium & Co-working Space",
        max_participants=80,
        is_paid=True,
        price=Decimal("5.00"),
        registration_deadline=dt(18, 23),
        status="published",
        club=cs_club,
        tags=["Hackathon", "Competition", "Programming", "Innovation"],
        requirements="Teams of 2-4. Register all team members. Laptops required.",
        agenda=(
            "Day 1 09:00 - Opening ceremony & team formation\n"
            "Day 1 10:00 - Hacking begins!\n"
            "Day 2 09:00 - Submission deadline\n"
            "Day 2 10:00 - Judging & presentations\n"
            "Day 2 14:00 - Awards ceremony"
        ),
    ),

    # ── Music ───────────────────────────────────────────────────────────────
    dict(
        title="Annual Spring Music Concert",
        description=(
            "The biggest musical event of the year! The Music Club presents a spectacular evening "
            "featuring student bands, solo performances, and a special guest artist. "
            "Genre mix: classical, jazz, pop, and indie.\n\n"
            "Ticket includes: reserved seating, complimentary drink, and a commemorative program booklet."
        ),
        category="Entertainment",
        event_type="cultural",
        start_datetime=dt(10, 19),
        end_datetime=dt(10, 22),
        venue="University Grand Hall",
        max_participants=200,
        is_paid=True,
        price=Decimal("8.00"),
        registration_deadline=dt(8, 23),
        status="published",
        club=music_club,
        tags=["Music", "Concert", "Live Performance", "Spring"],
        requirements="Smart-casual dress code. No outside food or drinks.",
        agenda=(
            "19:00 - Doors open\n"
            "19:30 - Opening act: Student Jazz Ensemble\n"
            "20:00 - Main performances\n"
            "21:30 - Guest artist set\n"
            "22:00 - Finale & closing"
        ),
    ),
    dict(
        title="Music Production Workshop",
        description=(
            "Learn to produce your own tracks! This hands-on workshop covers DAW basics "
            "(FL Studio / Ableton), beat making, mixing, and mastering. Guided by our resident music producer.\n\n"
            "Each participant gets:\n"
            "- 4 hours of studio time\n"
            "- A sample pack to take home\n"
            "- Certificate of participation"
        ),
        category="Arts",
        event_type="workshop",
        start_datetime=dt(18, 10),
        end_datetime=dt(18, 14),
        venue="Music Studio, Room 5",
        max_participants=15,
        is_paid=True,
        price=Decimal("12.00"),
        registration_deadline=dt(16, 23),
        status="published",
        club=music_club,
        tags=["Music Production", "Workshop", "DAW", "Beatmaking"],
        requirements="No experience needed. Headphones recommended.",
        agenda=(
            "10:00 - Intro to DAWs & music theory basics\n"
            "11:00 - Beat construction exercise\n"
            "12:00 - Mixing & EQ fundamentals\n"
            "13:00 - Create your own mini-track\n"
            "14:00 - Playback & feedback session"
        ),
    ),

    # ── Photography ─────────────────────────────────────────────────────────
    dict(
        title="Campus Photography Tour & Workshop",
        description=(
            "Explore the campus through a lens! Join our Photography Club for a guided "
            "photo walk followed by an editing masterclass. All skill levels welcome.\n\n"
            "What you will learn:\n"
            "- Composition & lighting techniques\n"
            "- Golden-hour shooting tips\n"
            "- Lightroom editing workflow\n\n"
            "The best three shots from participants will be displayed in the year-end exhibition."
        ),
        category="Arts",
        event_type="workshop",
        start_datetime=dt(7, 16),
        end_datetime=dt(7, 20),
        venue="Meet at Main Gate",
        max_participants=25,
        is_paid=True,
        price=Decimal("6.00"),
        registration_deadline=dt(5, 23),
        status="published",
        club=photo_club,
        tags=["Photography", "Workshop", "Lightroom", "Art"],
        requirements="Bring a camera or smartphone. Laptop/tablet for the editing session.",
        agenda=(
            "16:00 - Intro & composition talk\n"
            "16:30 - Guided photo walk around campus\n"
            "18:00 - Break & snacks\n"
            "18:30 - Lightroom editing masterclass\n"
            "20:00 - Gallery review & wrap-up"
        ),
    ),

    # ── Debate ──────────────────────────────────────────────────────────────
    dict(
        title="Inter-Club Debate Championship",
        description=(
            "The Debate Society flagship tournament! Clubs compete in British Parliamentary format "
            "over two rounds of preliminary debates and a grand final. Topics span politics, ethics, "
            "technology, and social issues.\n\n"
            "Registration is per team (4 members). Entry fee covers:\n"
            "- Tournament materials\n"
            "- Lunch for all participants\n"
            "- Trophy & certificates for finalists"
        ),
        category="Academic",
        event_type="competition",
        start_datetime=dt(28, 8),
        end_datetime=dt(28, 17),
        venue="Lecture Hall B, 2nd Floor",
        max_participants=60,
        is_paid=True,
        price=Decimal("3.00"),
        registration_deadline=dt(25, 23),
        status="published",
        club=debate_club,
        tags=["Debate", "Competition", "Public Speaking", "Championship"],
        requirements="Register as a team of 4. Formal attire required.",
        agenda=(
            "08:00 - Registration & briefing\n"
            "09:00 - Round 1 debates\n"
            "11:00 - Round 2 debates\n"
            "13:00 - Lunch break\n"
            "14:00 - Semi-finals\n"
            "16:00 - Grand Final\n"
            "17:00 - Awards ceremony"
        ),
    ),

    # ── Sports ──────────────────────────────────────────────────────────────
    dict(
        title="5K Fun Run & Fitness Festival",
        description=(
            "Lace up your sneakers for our annual 5K Fun Run! Open to all fitness levels - "
            "whether you run or walk, everyone gets a finisher medal. Post-race festival includes "
            "fitness booths, healthy food stalls, and a yoga cool-down session.\n\n"
            "Entry fee includes:\n"
            "- Race bib & timing chip\n"
            "- Finisher medal\n"
            "- Refreshment pack\n"
            "- Access to the post-race festival"
        ),
        category="Sports",
        event_type="sports",
        start_datetime=dt(35, 6),
        end_datetime=dt(35, 12),
        venue="University Sports Ground",
        max_participants=150,
        is_paid=True,
        price=Decimal("4.00"),
        registration_deadline=dt(32, 23),
        status="published",
        club=running_club or sports_club,
        tags=["5K", "Fun Run", "Fitness", "Sports", "Marathon"],
        requirements="Wear comfortable running shoes. Warm up before the race.",
        agenda=(
            "06:00 - Registration & bib collection\n"
            "06:45 - Warm-up session\n"
            "07:00 - Race start\n"
            "09:00 - Post-race festival opens\n"
            "10:30 - Yoga cool-down\n"
            "12:00 - Prize-giving & closing"
        ),
    ),
    dict(
        title="Badminton Tournament - Open Category",
        description=(
            "Singles and doubles badminton tournament open to all students. "
            "Matches follow BWF rules. The top prize is a full sports gear kit worth $80!\n\n"
            "Entry fee per player covers:\n"
            "- Shuttlecocks & court rental\n"
            "- Referees & scorekeepers\n"
            "- Water & energy drinks\n"
            "- Medal for all participants"
        ),
        category="Sports",
        event_type="competition",
        start_datetime=dt(42, 8),
        end_datetime=dt(43, 17),
        venue="Indoor Sports Hall",
        max_participants=64,
        is_paid=True,
        price=Decimal("2.50"),
        registration_deadline=dt(39, 23),
        status="published",
        club=sports_club,
        tags=["Badminton", "Tournament", "Sports", "Competition"],
        requirements="Bring your own racket. Sports attire required.",
        agenda=(
            "Day 1 08:00 - Group stage matches\n"
            "Day 1 17:00 - End of day 1\n"
            "Day 2 08:00 - Quarter-finals & semi-finals\n"
            "Day 2 14:00 - Finals\n"
            "Day 2 16:30 - Awards ceremony"
        ),
    ),
]

# ─── Create events ───────────────────────────────────────────────────────────

created = 0
skipped = 0

for data in EVENTS:
    if Event.objects.filter(title=data['title']).exists():
        print("  SKIP (already exists): " + data['title'])
        skipped += 1
        continue

    Event.objects.create(
        created_by=organizer,
        **data
    )
    print("  OK: " + data['title'] + "  ($" + str(data['price']) + ")")
    created += 1

print()
print("Done! Created " + str(created) + " paid event(s), skipped " + str(skipped) + " duplicate(s).")
print("Total paid events in DB: " + str(Event.objects.filter(is_paid=True).count()))
