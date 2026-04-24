# Generated manually for event proposal form fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proposals', '0005_add_revision_fields'),
    ]

    operations = [
        # Add frontend compatibility fields
        migrations.AddField(
            model_name='eventproposal',
            name='eventTitle',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='organizerName',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='organizerEmail',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='organizerPhone',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='province',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='specificLocation',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='eventDate',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='startDate',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='endDate',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='eventDurationDays',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='capacity',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='ticketPrice',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='catering',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='sponsor',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='budget',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='eventproposal',
            name='payment_method',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        # Make existing required fields nullable for compatibility
        migrations.AlterField(
            model_name='eventproposal',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='eventproposal',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='eventproposal',
            name='venue',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='eventproposal',
            name='proposed_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='eventproposal',
            name='expected_participants',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
