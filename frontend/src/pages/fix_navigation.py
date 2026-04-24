#!/usr/bin/env python3
"""
Fix venue_fee back button navigation
"""

# Read the file
with open('Events.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the back button in venue_fee step to navigate to ticket_payment
old_pattern = """              <button onClick={() => setStep('form')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">"""

new_pattern = """              <button onClick={() => setStep('ticket_payment')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">"""

if old_pattern in content:
    # Only replace the first occurrence (in the venue_fee step)
    idx = content.find(old_pattern)
    # Make sure this is in the venue_fee section by checking context
    section_start = content.rfind('{/* – STEP 3: Venue', 0, idx)
    if section_start != -1:
        content = content[:idx] + new_pattern + content[idx + len(old_pattern):]
        print("✓ Updated back button navigation to ticket_payment")
    else:
        print("✗ Could not find venue_fee section")
else:
    print(f"✗ Could not find the exact pattern")

# Write back
with open('Events.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ File updated!")
