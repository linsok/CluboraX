# Generated migration for updated proposal status workflow
from django.db import migrations, models


def migrate_status_forward(apps, schema_editor):
    """Update existing status values to new format"""
    EventProposal = apps.get_model('proposals', 'EventProposal')
    ClubProposal = apps.get_model('proposals', 'ClubProposal')
    
    # Update EventProposal statuses
    EventProposal.objects.filter(status='pending').update(status='pending_review')
    EventProposal.objects.filter(status='returned').update(status='returned_for_revision')
    
    # Update ClubProposal statuses
    ClubProposal.objects.filter(status='pending').update(status='pending_review')
    ClubProposal.objects.filter(status='returned').update(status='returned_for_revision')


def migrate_status_backward(apps, schema_editor):
    """Revert status values to old format"""
    EventProposal = apps.get_model('proposals', 'EventProposal')
    ClubProposal = apps.get_model('proposals', 'ClubProposal')
    
    # Revert EventProposal statuses
    EventProposal.objects.filter(status='pending_review').update(status='pending')
    EventProposal.objects.filter(status='returned_for_revision').update(status='returned')
    
    # Revert ClubProposal statuses
    ClubProposal.objects.filter(status='pending_review').update(status='pending')
    ClubProposal.objects.filter(status='returned_for_revision').update(status='returned')


class Migration(migrations.Migration):

    dependencies = [
        ('proposals', '0001_initial'),
    ]

    operations = [
        # Update EventProposal status field
        migrations.AlterField(
            model_name='eventproposal',
            name='status',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('pending_review', 'Pending Review'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('published', 'Published'),
                    ('returned_for_revision', 'Returned for Revision'),
                ],
                default='pending_review'
            ),
        ),
        # Update ClubProposal status field
        migrations.AlterField(
            model_name='clubproposal',
            name='status',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('pending_review', 'Pending Review'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('published', 'Published'),
                    ('returned_for_revision', 'Returned for Revision'),
                ],
                default='pending_review'
            ),
        ),
        # Migrate existing data
        migrations.RunPython(migrate_status_forward, migrate_status_backward),
    ]
