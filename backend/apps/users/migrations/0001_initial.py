# Generated manually for custom User model

from django.db import migrations, models
import django.contrib.auth.models
import django.contrib.auth.validators
import django.core.validators
from django.utils import timezone
import django.contrib.auth.hashers
import phonenumber_field.modelfields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(max_length=254, unique=True, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=timezone.now, verbose_name='date joined')),
                ('role', models.CharField(choices=[('student', 'Student'), ('organizer', 'Organizer'), ('approver', 'Approver'), ('admin', 'Admin')], default='student', max_length=20)),
                ('phone', phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region=None)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='profile_pics/')),
                ('is_verified', models.BooleanField(default=False)),
                ('student_id', models.CharField(blank=True, max_length=50, null=True)),
                ('staff_id', models.CharField(blank=True, max_length=50, null=True)),
                ('faculty', models.CharField(blank=True, max_length=100, null=True)),
                ('department', models.CharField(blank=True, max_length=100, null=True)),
                ('otp_code', models.CharField(blank=True, max_length=6, null=True)),
                ('otp_expires_at', models.DateTimeField(blank=True, null=True)),
                ('last_login_ip', models.GenericIPAddressField(blank=True, null=True)),
            ],
            options={
                'db_table': 'users',
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
    ]