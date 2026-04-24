import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.proposals.models import ClubProposal

print('=== CHECKING AUTHENTICATED CLUB ===\n')

# Find the Authenticated club
try:
    club = Club.objects.get(name__icontains='Authenticated')
    print(f'Club Name: {club.name}')
    print(f'Club Status: {club.status}')
    print(f'Club Logo Field: {club.logo}')
    print(f'Club Logo Name: {club.logo.name if club.logo else "None"}')
    print(f'Club Logo URL: {club.logo.url if club.logo else "None"}')
    print()
except Club.DoesNotExist:
    print('Authenticated club not found')
    print()

# Find the Authenticated proposal
try:
    proposal = ClubProposal.objects.get(name__icontains='Authenticated', status='published')
    print(f'Proposal Name: {proposal.name}')
    print(f'Proposal Status: {proposal.status}')
    print(f'Proposal Logo Field: {proposal.club_logo}')
    print(f'Proposal Logo Name: {proposal.club_logo.name if proposal.club_logo else "None"}')
    print(f'Proposal Logo URL: {proposal.club_logo.url if proposal.club_logo else "None"}')
    print()
except ClubProposal.DoesNotExist:
    print('Authenticated published proposal not found')
    print()

# List all files in club_logos directory
import os
path = 'mediafiles/club_logos/'
if os.path.exists(path):
    print(f'Files in {path}:')
    for f in os.listdir(path):
        print(f'  - {f}')
