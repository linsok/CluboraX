#!/usr/bin/env python3
"""
Final cleanup: Remove duplicate comments and update back button
"""

with open('Events.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove duplicate STEP 3 comments and old STEP 2 comment
content = content.replace(
    """{/* – STEP 3: Venue / Equipment Fee Decision – */}
        {/* – STEP 3: Venue / Equipment Fee Decision – */}
        {/* – STEP 2: Venue / Equipment Fee Decision – */}""",
    """{/* – STEP 3: Venue / Equipment Fee Decision – */}"""
)

# Fix 2: Update back button to navigate to ticket_payment
# Find the back button in STEP 3 (Venue) section
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'Back to Event Details' in line and "setStep('form')" in line:
        # Check context - should be in STEP 3
        context = '\n'.join(lines[max(0, i-50):i])
        if 'STEP 3: Venue' in context or 'STEP 3' in context:
            lines[i] = line.replace("setStep('form')", "setStep('ticket_payment')")
            print(f"✓ Updated back button at line {i+1}")
            break

content = '\n'.join(lines)

with open('Events.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ All cleanups completed!")
