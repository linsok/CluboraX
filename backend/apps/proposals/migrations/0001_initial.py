# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EventProposal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('proposed_date', models.DateField()),
                ('venue', models.CharField(max_length=255)),
                ('expected_participants', models.IntegerField()),
                ('budget_items', models.JSONField(blank=True, default=list)),
                ('total_budget', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('review_comments', models.TextField(blank=True, null=True)),
                ('reviewed_date', models.DateTimeField(blank=True, null=True)),
                ('submitted_date', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_event_proposals', to=settings.AUTH_USER_MODEL)),
                ('submitted_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_proposals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-submitted_date'],
            },
        ),
        migrations.CreateModel(
            name='ClubProposal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('club_type', models.CharField(choices=[('academic', 'Academic'), ('sports', 'Sports'), ('arts', 'Arts & Culture'), ('social', 'Social Service'), ('technical', 'Technical'), ('other', 'Other')], max_length=50)),
                ('mission', models.TextField()),
                ('description', models.TextField()),
                ('objectives', models.TextField()),
                ('activities', models.TextField()),
                ('president_name', models.CharField(max_length=255)),
                ('president_email', models.EmailField(max_length=254)),
                ('advisor_name', models.CharField(blank=True, max_length=255)),
                ('advisor_email', models.EmailField(blank=True, max_length=254)),
                ('expected_members', models.IntegerField()),
                ('requirements', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('review_comments', models.TextField(blank=True, null=True)),
                ('reviewed_date', models.DateTimeField(blank=True, null=True)),
                ('submitted_date', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_club_proposals', to=settings.AUTH_USER_MODEL)),
                ('submitted_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='club_proposals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-submitted_date'],
            },
        ),
    ]
