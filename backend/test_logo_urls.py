import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from apps.clubs.models import Club
from apps.clubs.serializers import ClubSerializer
from django.test import RequestFactory

factory = RequestFactory()
request = factory.get('http://localhost:8888/api/clubs/')

print("\n=== TESTING LOGO URL GENERATION ===\n")

clubs_with_logos = Club.objects.filter(logo__isnull=False).exclude(logo='')
print(f"Found {clubs_with_logos.count()} clubs with logos\n")

for club in clubs_with_logos[:5]:
    print(f"Club: {club.name}")
    print(f"  logo field: {club.logo.name if club.logo else 'None'}")
    print(f"  logo.url: {club.logo.url}")
    
    serializer = ClubSerializer(club, context={'request': request})
    logo_url = serializer.data.get('logo_url')
    print(f"  logo_url (serialized): {logo_url}")
    print(f"  URL valid: {logo_url.startswith('http://') if logo_url else False}")
    print()

print("=== COMPLETE ===\n")
