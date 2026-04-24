#!/usr/bin/env python
"""
Notification System Quick Tester
Run this script to automatically test various notification scenarios
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.events.models import Event, EventRegistration
from apps.clubs.models import Club, ClubMembership
from apps.gallery.models import Gallery, MediaFile
from apps.notifications.models import Notification, NotificationPreference
from apps.core.utils import send_notification
from datetime import datetime, timedelta
import json

User = get_user_model()

class NotificationTester:
    def __init__(self):
        self.test_results = []
        self.test_user = None
        self.setup()
    
    def setup(self):
        """Create test users and data"""
        print("🔧 Setting up test environment...")
        
        # Create test users if not exist
        self.test_user, _ = User.objects.get_or_create(
            email='test_student@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Student',
                'role': 'student',
                'is_active': True
            }
        )
        
        self.test_organizer, _ = User.objects.get_or_create(
            email='test_organizer@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Organizer',
                'role': 'student',
                'is_active': True
            }
        )
        
        self.test_leader, _ = User.objects.get_or_create(
            email='test_leader@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Leader',
                'role': 'student',
                'is_active': True
            }
        )
        
        print(f"✅ Test users created: {self.test_user.email}, {self.test_organizer.email}, {self.test_leader.email}")
    
    def test(self, name, func):
        """Execute a test and log result"""
        try:
            print(f"\n📋 Testing: {name}...")
            func()
            self.test_results.append({'name': name, 'status': '✅ PASS', 'error': None})
            print(f"✅ {name} - PASSED")
            return True
        except Exception as e:
            self.test_results.append({'name': name, 'status': '❌ FAIL', 'error': str(e)})
            print(f"❌ {name} - FAILED: {e}")
            return False
    
    # TEST SET 1: Event Notifications
    def test_event_registration_notification(self):
        """Test event registration sends notifications"""
        # Create event
        event = Event.objects.create(
            title='Test Event',
            description='Test event for notifications',
            created_by=self.test_organizer,
            status='approved',
            capacity=10,
            event_date=datetime.now() + timedelta(days=1),
            event_time='10:00:00'
        )
        
        # Register student
        registration = EventRegistration.objects.create(
            event=event,
            user=self.test_user,
            status='confirmed'
        )
        
        # Check notification created
        notif = Notification.objects.filter(
            user=self.test_user,
            title__contains='Registration Confirmed'
        ).first()
        
        assert notif is not None, "Registration notification not created"
        assert notif.type == 'event_update', f"Wrong type: {notif.type}"
        assert notif.priority == 'medium', f"Wrong priority: {notif.priority}"
    
    def test_event_capacity_notification(self):
        """Test event full capacity notification"""
        event = Event.objects.create(
            title='Capacity Test Event',
            description='Testing capacity',
            created_by=self.test_organizer,
            status='approved',
            capacity=1,
            event_date=datetime.now() + timedelta(days=1),
            event_time='10:00:00'
        )
        
        # Register first student (reaches capacity)
        EventRegistration.objects.create(
            event=event,
            user=self.test_user,
            status='confirmed'
        )
        
        # Check event is full
        assert event.is_full, "Event should be marked as full"
        
        # Try to register second student
        reg2 = EventRegistration.objects.create(
            event=event,
            user=self.test_leader,
            status='waitlist'
        )
        
        # Check waitlist notification
        notif = Notification.objects.filter(
            user=self.test_leader,
            title__contains='Waitlist'
        ).first()
        
        assert notif is not None, "Waitlist notification not created"
        assert 'waitlist' in notif.title.lower() or 'waitlist' in notif.message.lower()
    
    def test_event_cancellation_notification(self):
        """Test event cancellation notifies all registered users"""
        event = Event.objects.create(
            title='Cancel Test Event',
            description='Testing cancellation',
            created_by=self.test_organizer,
            status='approved',
            capacity=10,
            event_date=datetime.now() + timedelta(days=1),
            event_time='10:00:00'
        )
        
        # Register multiple students
        EventRegistration.objects.create(event=event, user=self.test_user, status='confirmed')
        EventRegistration.objects.create(event=event, user=self.test_leader, status='confirmed')
        
        # Cancel event
        event.status = 'cancelled'
        event.save()
        
        # Check notifications sent to all registrants
        notifications = Notification.objects.filter(
            title__contains='Cancelled'
        )
        
        assert notifications.count() >= 2, f"Expected at least 2 cancellation notifications, got {notifications.count()}"
    
    # TEST SET 2: Club Notifications
    def test_club_membership_approval(self):
        """Test club membership approval notification"""
        club = Club.objects.create(
            name='Test Club',
            description='Test club',
            created_by=self.test_leader,
            status='approved'
        )
        
        # Create membership request
        membership = ClubMembership.objects.create(
            club=club,
            user=self.test_user,
            status='pending'
        )
        
        # Approve membership
        membership.status = 'approved'
        membership.save()
        
        # Check notification
        notif = Notification.objects.filter(
            user=self.test_user,
            title__contains='Approved'
        ).first()
        
        assert notif is not None, "Membership approval notification not created"
        assert notif.priority == 'medium'
    
    def test_club_membership_rejection(self):
        """Test club membership rejection notification"""
        club = Club.objects.create(
            name='Reject Test Club',
            description='Test club',
            created_by=self.test_leader,
            status='approved'
        )
        
        membership = ClubMembership.objects.create(
            club=club,
            user=self.test_user,
            status='pending'
        )
        
        # Reject membership
        membership.status = 'rejected'
        membership.save()
        
        # Check notification
        notif = Notification.objects.filter(
            user=self.test_user,
            title__contains='Rejected'
        ).first()
        
        assert notif is not None, "Membership rejection notification not created"
        assert notif.priority == 'high'
    
    # TEST SET 3: Manual Notification Test
    def test_send_notification_function(self):
        """Test send_notification utility function"""
        send_notification(
            self.test_user,
            'Test Notification 🧪',
            'This is a test notification',
            'system',
            priority='medium'
        )
        
        notif = Notification.objects.filter(
            user=self.test_user,
            title='Test Notification 🧪'
        ).first()
        
        assert notif is not None, "Notification not created via send_notification"
        assert notif.message == 'This is a test notification'
    
    # TEST SET 4: Notification Preferences
    def test_notification_preferences_exist(self):
        """Test notification preferences creation"""
        prefs, created = NotificationPreference.objects.get_or_create(
            user=self.test_user
        )
        
        assert prefs.email_notifications is not None
        assert prefs.push_notifications is not None
        assert prefs.in_app_notifications is not None
    
    def test_disable_email_notifications(self):
        """Test email cannot be sent if disabled"""
        prefs, _ = NotificationPreference.objects.get_or_create(user=self.test_user)
        prefs.email_notifications = False
        prefs.save()
        
        # Notification should still be created
        send_notification(
            self.test_user,
            'Email Disabled Test',
            'This should not send email',
            'system'
        )
        
        notif = Notification.objects.filter(
            user=self.test_user,
            title='Email Disabled Test'
        ).first()
        
        assert notif is not None, "Notification not created when email disabled"
        # Note: Email actually sending is tested via email backend
    
    # TEST SET 5: Database Integrity
    def test_notification_fields_populated(self):
        """Test all required notification fields are populated"""
        send_notification(
            self.test_user,
            'Complete Test 📬',
            'All fields should be populated',
            'event_update',
            priority='high'
        )
        
        notif = Notification.objects.filter(
            user=self.test_user,
            title='Complete Test 📬'
        ).first()
        
        assert notif.user is not None
        assert notif.title is not None
        assert notif.message is not None
        assert notif.type is not None
        assert notif.priority is not None
        assert notif.is_read is not None
        assert notif.created_at is not None
    
    def test_notification_counters(self):
        """Test unread notification count"""
        # Create some notifications
        for i in range(3):
            send_notification(
                self.test_user,
                f'Count Test {i}',
                'Testing counter',
                'system'
            )
        
        unread = Notification.objects.filter(
            user=self.test_user,
            is_read=False
        ).count()
        
        assert unread >= 3, f"Expected at least 3 unread, got {unread}"
    
    # Reporting
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 NOTIFICATION TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if '✅' in r['status'])
        failed = sum(1 for r in self.test_results if '❌' in r['status'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status_icon = "✅" if "PASS" in result['status'] else "❌"
            print(f"{status_icon} {result['name']}: {result['status']}")
            if result['error']:
                print(f"   Error: {result['error']}")
        
        print("="*60)
        print(f"Results: {passed}/{total} passed, {failed}/{total} failed")
        print("="*60)
        
        return failed == 0

def main():
    """Run all tests"""
    print("\n🚀 Starting Notification System Tests...\n")
    
    tester = NotificationTester()
    
    # Run all tests
    print("\n▶️  EVENT NOTIFICATION TESTS:")
    tester.test("Event Registration Notification", tester.test_event_registration_notification)
    tester.test("Event Capacity Notification", tester.test_event_capacity_notification)
    tester.test("Event Cancellation Notification", tester.test_event_cancellation_notification)
    
    print("\n▶️  CLUB NOTIFICATION TESTS:")
    tester.test("Club Membership Approval", tester.test_club_membership_approval)
    tester.test("Club Membership Rejection", tester.test_club_membership_rejection)
    
    print("\n▶️  UTILITY TESTS:")
    tester.test("Send Notification Function", tester.test_send_notification_function)
    tester.test("Notification Preferences Exist", tester.test_notification_preferences_exist)
    tester.test("Disable Email Notifications", tester.test_disable_email_notifications)
    
    print("\n▶️  DATABASE INTEGRITY TESTS:")
    tester.test("Notification Fields Populated", tester.test_notification_fields_populated)
    tester.test("Notification Counters", tester.test_notification_counters)
    
    # Print summary
    success = tester.print_summary()
    
    exit(0 if success else 1)

if __name__ == '__main__':
    main()
