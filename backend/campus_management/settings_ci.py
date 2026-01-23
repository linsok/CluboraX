import os
from .settings import *

# CI/CD specific settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'ci-test-secret-key')

# Database settings for CI
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'campus_management_test'),
        'USER': os.environ.get('DB_USER', 'test_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'test_password'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Email backend for testing
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, key):
        return None

    def get(self, key, default):
        return None

MIGRATION_MODULES = DisableMigrations()

# Use in-memory cache for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Logging for CI
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Test settings
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# Disable security settings for testing
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Allow all hosts for testing
ALLOWED_HOSTS = ['*']

# OAuth2 Provider settings for testing
OAUTH2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.Application'
OAUTH2_PROVIDER_ACCESS_TOKEN_MODEL = 'oauth2_provider.AccessToken'
OAUTH2_PROVIDER_REFRESH_TOKEN_MODEL = 'oauth2_provider.RefreshToken'
OAUTH2_PROVIDER_GRANT_MODEL = 'oauth2_provider.Grant'
OAUTH2_PROVIDER_ID_TOKEN_MODEL = 'oauth2_provider.IDToken'

# CORS settings for testing
CORS_ALLOW_ALL_ORIGINS = True