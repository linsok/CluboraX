# Generated migration for Album model and MediaFile updates

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('gallery', '0001_initial'),
    ]

    operations = [
        # Create Album model
        migrations.CreateModel(
            name='Album',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('cover_image', models.ImageField(blank=True, null=True, upload_to='album_covers/')),
                ('is_public', models.BooleanField(default=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('gallery', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='albums', to='gallery.gallery')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_albums', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Album',
                'verbose_name_plural': 'Albums',
                'db_table': 'albums',
                'ordering': ['order', '-created_at'],
            },
        ),
        # Add album field to MediaFile
        migrations.AddField(
            model_name='mediafile',
            name='album',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='media_files', to='gallery.album'),
        ),
        # Add index for album field
        migrations.AddIndex(
            model_name='mediafile',
            index=models.Index(fields=['album'], name='media_files_album_idx'),
        ),
    ]
