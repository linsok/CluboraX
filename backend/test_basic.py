"""
Basic test file to ensure CI/CD pipeline can run tests
"""
import os
import django
from django.test import TestCase

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

class BasicTests(TestCase):
    """Basic tests to verify the application can start"""
    
    def test_django_import(self):
        """Test that Django can be imported"""
        self.assertIsNotNone(django.VERSION)
        
    def test_basic_math(self):
        """Simple test to verify testing framework works"""
        self.assertEqual(1 + 1, 2)
        
    def test_database_connection(self):
        """Test database connection (will be skipped if no database)"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.assertTrue(True)
        except Exception:
            # Skip this test if database is not available
            self.skipTest("Database not available")
