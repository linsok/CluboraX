#!/usr/bin/env python3
"""
Update venue_fee navigation buttons in Events.jsx
"""

# Read the file
with open('Events.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update 1: Change "Back to Event Details" button to navigate to ticket_payment
updates = [
    # Update the back button text/navigation in venue_fee
    (
        'setStep(\'form\')" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back',
        'setStep(\'ticket_payment\')" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back'
    ),
]

for old, new in updates:
    if old in content:
        content = content.replace(old, new)
        print(f"✓ Updated: {old[:60]}...")
    else:
        print(f"✗ Not found: {old[:60]}...")

# Write back
with open('Events.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✓ Navigation buttons updated!")
