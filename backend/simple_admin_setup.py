#!/usr/bin/env python
"""
Simple Django Admin Setup Script
"""
import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and print the result"""
    print(f"\n🔧 {description}")
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        print(f"✅ Success: {result.stdout}")
        if result.stderr:
            print(f"⚠️  Warning: {result.stderr}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Django Admin Setup Script")
    print("=" * 50)
    
    # Step 1: Create minimal settings
    minimal_settings = '''
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = 'django-insecure-your-secret-key-here-for-development-only'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'simple_urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    'django.contrib.auth.password_validation.MinimumLengthValidator',
    'django.contrib.auth.password_validation.CommonPasswordValidator',
    'django.contrib.auth.password_validation.NumericPasswordValidator',
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
'''
    
    with open('simple_settings.py', 'w') as f:
        f.write(minimal_settings)
    print("✅ Created simple_settings.py")
    
    # Step 2: Create simple URLs
    simple_urls = '''
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
]
'''
    
    with open('simple_urls.py', 'w') as f:
        f.write(simple_urls)
    print("✅ Created simple_urls.py")
    
    # Step 3: Run migrations
    if not run_command("python manage.py migrate --settings=simple_settings", "Running migrations"):
        print("❌ Migration failed. Trying with --run-syncdb...")
        run_command("python manage.py migrate --run-syncdb --settings=simple_settings", "Running migrations with --run-syncdb")
    
    # Step 4: Create superuser
    print("\n👤 Creating superuser...")
    print("Please follow the prompts to create your admin account:")
    run_command("python manage.py createsuperuser --settings=simple_settings", "Creating superuser")
    
    # Step 5: Start server
    print("\n🌐 Starting Django development server...")
    print("Admin panel will be available at: http://127.0.0.1:8000/admin/")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run("python manage.py runserver --settings=simple_settings", shell=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == '__main__':
    main()
