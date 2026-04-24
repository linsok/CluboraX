// QUICK FIX FOR MISSING CREATE CLUB BUTTON
// Copy this entire code, paste in browser console (F12), and press Enter

console.log('=== DEBUGGING CREATE CLUB BUTTON ===');

// 1. Check current user data
const userStr = localStorage.getItem('user');
console.log('Raw user string from localStorage:', userStr);

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('Parsed user object:', user);
        console.log('User role:', user.role);
        
        if (!user.role) {
            console.error('❌ PROBLEM FOUND: User object has NO role field!');
            console.log('This is likely old cached data from before role was added.');
            console.log('\n✅ SOLUTION: Run the fix below:\n');
            console.log('%cRUN THIS FIX:', 'color: yellow; font-size: 16px; font-weight: bold;');
            console.log('%clocalStorage.clear(); location.href = "/login";', 'color: lime; font-size: 14px; background: black; padding: 5px;');
        } else {
            console.log('✅ Role field exists:', user.role);
            if (user.role === 'student' || user.role === 'organizer') {
                console.log('✅ Role is student or organizer - button SHOULD be visible');
                console.log('Check if button is hidden by CSS or below the fold on page');
            } else {
                console.warn('⚠️ Role is:', user.role);
                console.log('Button only shows for "student" or "organizer" roles');
            }
        }
    } catch (e) {
        console.error('❌ Error parsing user data:', e);
    }
} else {
    console.error('❌ No user data in localStorage - you are not logged in');
}

console.log('\n=== ACCESS TOKEN ===');
console.log('Token exists:', !!localStorage.getItem('access_token'));

console.log('\n=== QUICK FIX (if role is missing) ===');
console.log('Copy and run this in console:');
console.log('%clocalStorage.clear(); location.href = "/login";', 'color: lime; font-size: 14px; background: black; padding: 10px;');
