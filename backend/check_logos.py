import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club  
from apps.proposals.models import ClubProposal

print('=== CLUBS ===')
clubs = Club.objects.all()
print(f'Total clubs: {clubs.count()}')
for club in clubs[:10]:
    logo_name = club.logo.name if club.logo else 'None'
    print(f'  {club.name}: logo={logo_name}')

print('\n=== CLUB PROPOSALS (Published) ===')
proposals = ClubProposal.objects.filter(status='published')
print(f'Published proposals: {proposals.count()}')
for prop in proposals[:10]:
    logo_name = prop.club_logo.name if prop.club_logo else 'None'
    print(f'  {prop.name}: logo={logo_name}')
