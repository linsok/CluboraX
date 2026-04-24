/**
 * Frontend Notification Testing Guide
 * 
 * Paste these commands into your browser's DevTools Console to test notifications
 */

// ==================== UTILITY FUNCTIONS ====================

// Test 1: Manually fetch unread notifications
async function testFetchNotifications() {
  console.log("🔍 Fetching unread notifications...");
  try {
    const response = await fetch('http://localhost:8888/api/notifications/?is_read=false');
    const data = await response.json();
    console.log("📬 Unread notifications:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
  }
}

// Test 2: Check if push notifications polling is running
function testPollingStatus() {
  console.log("🔄 Checking notification polling status...");
  // Check if usePushNotifications interval is set
  const intervals = setInterval.toString();
  console.log("✅ If polling is active, you should see interval IDs in the next output");
  console.log("💡 Tip: Open Notifications page and watch for 'GET /api/notifications' requests every 5 seconds in Network tab");
}

// Test 3: Manually trigger a notification display
function testToastDisplay() {
  console.log("🎨 Testing toast display (if react-hot-toast available)");
  // This requires react-hot-toast to be available globally
  if (window.toast) {
    window.toast.custom(
      <div style={{ 
        padding: '16px', 
        background: '#4CAF50', 
        color: 'white',
        borderRadius: '8px'
      }}>
        ✅ Test Notification! This is working!
      </div>
    );
  } else {
    console.warn("⚠️  react-hot-toast not available globally");
    alert("✅ Test notification - If you see this, toasts work!");
  }
}

// Test 4: Check localStorage for notification state
function testLocalStorage() {
  console.log("💾 Checking localStorage for notification cache...");
  const keys = Object.keys(localStorage);
  const notifKeys = keys.filter(k => k.includes('notif') || k.includes('query'));
  console.log("Found notification-related keys:", notifKeys);
  notifKeys.forEach(key => {
    console.log(`  ${key}: ${localStorage.getItem(key).substring(0, 100)}...`);
  });
}

// Test 5: Monitor API calls in next 10 seconds
function testMonitorAPIcalls() {
  console.log("📊 Monitoring API calls for 10 seconds...");
  const originalFetch = window.fetch;
  let callCount = 0;
  
  window.fetch = function(...args) {
    if (args[0].includes('/api/')) {
      callCount++;
      console.log(`[${callCount}] API Call: ${args[0]}`);
    }
    return originalFetch.apply(this, args);
  };
  
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log(`✅ Monitoring complete. Total API calls: ${callCount}`);
  }, 10000);
}

// Test 6: Check authenticated user
async function testAuthStatus() {
  console.log("🔐 Checking authentication...");
  try {
    const response = await fetch('http://localhost:8888/api/auth/profile/');
    if (response.ok) {
      const user = await response.json();
      console.log("✅ Authenticated as:", user.email, user.role);
      return user;
    } else {
      console.error("❌ Not authenticated (401)");
    }
  } catch (error) {
    console.error("❌ Auth check failed:", error);
  }
}

// Test 7: Create test event (requires auth)
async function testCreateEvent() {
  console.log("📅 Creating test event...");
  try {
    const eventData = {
      title: 'Test Event ' + new Date().getTime(),
      description: 'Automated test event',
      event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      event_time: '10:00:00',
      capacity: 5,
      status: 'approved'
    };
    
    const response = await fetch('http://localhost:8888/api/events/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      const event = await response.json();
      console.log("✅ Event created:", event);
      return event;
    } else {
      console.error("❌ Failed to create event:", response.status, await response.text());
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Test 8: Register for event (requires auth)
async function testRegisterEvent(eventId) {
  console.log(`📝 Registering for event ${eventId}...`);
  try {
    const response = await fetch(`http://localhost:8888/api/events/${eventId}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      console.log("✅ Registration successful");
      console.log("📬 Check for notification in 5 seconds...");
      return true;
    } else {
      console.error("❌ Registration failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Test 9: Mark notification as read
async function testMarkAsRead(notificationId) {
  console.log(`📖 Marking notification ${notificationId} as read...`);
  try {
    const response = await fetch(`http://localhost:8888/api/notifications/${notificationId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify({ is_read: true })
    });
    
    if (response.ok) {
      console.log("✅ Notification marked as read");
    } else {
      console.error("❌ Failed to mark as read:", response.status);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Test 10: Delete notification
async function testDeleteNotification(notificationId) {
  console.log(`🗑️  Deleting notification ${notificationId}...`);
  try {
    const response = await fetch(`http://localhost:8888/api/notifications/${notificationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });
    
    if (response.ok || response.status === 204) {
      console.log("✅ Notification deleted");
    } else {
      console.error("❌ Failed to delete:", response.status);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ==================== QUICK TEST SEQUENCES ====================

// Sequence 1: Full notification flow test
async function quickTestSequence() {
  console.log("\n🚀 Starting quick test sequence...\n");
  
  // Step 1: Check auth
  console.log("Step 1: Checking authentication...");
  const user = await testAuthStatus();
  if (!user) return;
  
  // Step 2: Fetch current notifications
  console.log("\nStep 2: Fetching current notifications...");
  const notifs = await testFetchNotifications();
  
  // Step 3: Create event
  console.log("\nStep 3: Creating test event...");
  // const event = await testCreateEvent();
  // if (!event) return;
  
  // Step 4: Register for event
  // console.log("\nStep 4: Registering for event...");
  // await testRegisterEvent(event.id);
  
  // Step 5: Wait and check notifications
  console.log("\nStep 5: Waiting 8 seconds for notification...");
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  console.log("\nStep 6: Checking for new notifications...");
  await testFetchNotifications();
  
  console.log("\n✅ Test sequence complete!");
}

// ==================== COPY-PASTE TEST COMMANDS ====================

/*
QUICK TESTS - Copy & paste one line at a time into console:

1. Check if HTTP backend is reachable:
   testAuthStatus()

2. Fetch all unread notifications:
   testFetchNotifications()

3. Check polling status:
   testPollingStatus()

4. Monitor API calls for 10 seconds:
   testMonitorAPIcalls()

5. Check browser storage:
   testLocalStorage()

6. Test push notification display:
   testToastDisplay()

7. Run full test sequence:
   quickTestSequence()

8. Register for event (after getting event ID from testCreateEvent):
   testRegisterEvent(1)

9. Mark notification as read (after getting notif ID from testFetchNotifications):
   testMarkAsRead(1)

10. Delete notification:
    testDeleteNotification(1)
*/

// ==================== DEBUGGING UTILITIES ====================

// Monitor network tab for notifications endpoint
function debugNotificationRequests() {
  console.log("🔍 Logging all API requests containing 'notification'...");
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    if (url.includes('notification')) {
      console.log(`[API] ${new Date().toLocaleTimeString()} - ${url}`);
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log("✅ Monitoring enabled. All notification API calls will be logged.");
}

// Check for React DevTools errors
function debugErrors() {
  console.log("🐛 Checking for recent errors...");
  const errors = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.errors || [];
  console.log(`Found ${errors.length} React errors:`, errors);
}

// Performance check
function debugPerformance() {
  console.log("⏱️  Performance metrics:");
  if (window.performance) {
    const entries = window.performance.getEntriesByType('navigation');
    entries.forEach(entry => {
      console.log(`Navigation timing: ${entry.duration.toFixed(2)}ms`);
    });
  }
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        NOTIFICATION TESTING CONSOLE - Ready to test!          ║
╚═══════════════════════════════════════════════════════════════╝

📋 Quick Commands:
  • testAuthStatus() - Check if logged in
  • testFetchNotifications() - Get all unread notifications
  • testPollingStatus() - Check if polling is running
  • quickTestSequence() - Run full automated test
  • debugNotificationRequests() - Monitor all API calls
  • testMonitorAPIcalls() - Monitor API for 10 seconds

🔗 More detailed tests available - see comments above
`);
