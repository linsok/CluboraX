#!/usr/bin/env python3
"""
Insert ticket payment step into Events.jsx
"""

# Read the file
with open('Events.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The new ticket payment step JSX code
ticket_payment_code = '''        )}

        {/* – STEP 2: Ticket Payment & QR Code – */}
        {step === 'ticket_payment' && (
          <div className="p-6 overflow-y-auto flex-1">
            {ticketPaymentStep === 'review' && (
              <>
                <div className="max-w-2xl mx-auto">
                  {/* Payment Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg">Payment Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">Ticket Price</div>
                        <div className="text-2xl font-bold text-gray-900">${eventForm.price || '0.00'}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">Max Attendees</div>
                        <div className="text-2xl font-bold text-gray-900">{eventForm.maxAttendees || '0'}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600">${(eventForm.price * eventForm.maxAttendees).toFixed(2)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-100">
                        <div className="text-sm text-gray-600 mb-1">Platform Fee (3%)</div>
                        <div className="text-2xl font-bold text-red-600">${platformFee.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Total You Receive:</span>
                        <span className="text-2xl font-bold text-green-700">${(eventForm.price * eventForm.maxAttendees - platformFee).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-8 mb-6 text-center">
                    <h3 className="font-bold text-gray-900 mb-4">Payment QR Code</h3>
                    <p className="text-sm text-gray-600 mb-6">Scan this QR code to complete the ticket platform fee payment:</p>
                    <div className="bg-white inline-block p-6 rounded-lg border border-gray-300">
                      <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">📱</div>
                          <div className="text-sm font-semibold">QR Code</div>
                          <div className="text-xs">${platformFee.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Reference: EVT-{eventForm.title?.substring(0, 3).toUpperCase()}-{Date.now().toString().slice(-4)}</p>
                  </div>

                  {/* Upload Proof Section */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center"><span className="text-amber-600 mr-2">⚠️</span>Upload Payment Proof</h3>
                    <p className="text-sm text-gray-600 mb-4">Please upload a screenshot or receipt of your payment to proceed:</p>
                    
                    {!ticketPaymentProof ? (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleTicketPaymentProofUpload}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center cursor-pointer hover:bg-amber-100 transition-colors">
                          <div className="text-3xl mb-2">📸</div>
                          <p className="font-medium text-gray-900">Click to upload payment proof</p>
                          <p className="text-xs text-gray-500 mt-1">or drag & drop (Max 5MB)</p>
                        </div>
                      </label>
                    ) : (
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <p className="text-sm text-green-700 mb-2">✓ File selected: {ticketPaymentProof.name}</p>
                        <button
                          onClick={() => { setTicketPaymentProof(null); setTicketPaymentProofPreview(null); }}
                          className="text-sm text-amber-600 hover:text-amber-800"
                        >
                          Change file
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-between mt-6">
                  <button onClick={() => setStep('form')} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">← Back</button>
                  <button
                    onClick={() => {
                      if (!ticketPaymentProof) {
                        alert('Please upload payment proof to continue');
                        return;
                      }
                      setTicketPaymentStep('verifying');
                      setTimeout(() => {
                        setTicketPaymentStep('approved');
                      }, 2000);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all disabled:opacity-50"
                    disabled={!ticketPaymentProof}
                  >
                    Verify Payment →
                  </button>
                </div>
              </>
            )}

            {ticketPaymentStep === 'verifying' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Verifying payment...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your payment</p>
                </div>
              </div>
            )}

            {ticketPaymentStep === 'approved' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Approved!</h3>
                  <p className="text-gray-600 mb-6">Your ticket platform fee payment has been confirmed. You can now proceed to the next step.</p>
                  <button
                    onClick={() => setStep('venue_fee')}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all"
                  >
                    Continue to Venue Fees →
                  </button>
                </div>
              </div>
            )}

            {ticketPaymentStep === 'rejected' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">✕</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Verification Failed</h3>
                  <p className="text-gray-600 mb-4">{ticketPaymentRejectionReason || 'The payment proof could not be verified. Please try again.'}</p>
                  <button
                    onClick={() => {
                      setTicketPaymentStep('review');
                      setTicketPaymentProof(null);
                      setTicketPaymentProofPreview(null);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* – STEP 3: Venue / Equipment Fee Decision – */}'''

# Find where to insert - look for the STEP 2 Venue comment
search_str = "{/* – STEP 2: Venue / Equipment Fee Decision – */}"

# Try to find it in the content
if search_str in content:
    insert_pos = content.find(search_str)
    print(f"Found STEP 2 Venue at position {insert_pos}")
else:
    # Try searching for just the pattern without exact special chars
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'STEP 2: Venue' in line and 'Equipment Fee Decision' in line:
            print(f"Found at line {i+1}: {line[:80]}")
            # Reconstruct the position
            insert_pos = len('\n'.join(lines[:i])) + len('\n')
            break
    else:
        print("ERROR: Could not find insertion point!")
        exit(1)

# Extract the part to replace - we want to replace from the closing )} before the comment
# Find the opening of this block
before_insert = content[:insert_pos]
# Find the last ")}" before the insertion point
last_close_paren = before_insert.rfind(")}")
if last_close_paren != -1:
    # Look for the newlines after it
    newline_count = 0
    search_pos = last_close_paren + 2
    while search_pos < len(before_insert) and before_insert[search_pos] == '\n':
        newline_count += 1
        search_pos += 1
    
    # The actual insert position should be after )} and blank lines
    actual_insert_pos = last_close_paren + 2 + newline_count
    
    # Find next blank or comment
    next_pos = before_insert.rfind('\n', last_close_paren, actual_insert_pos)
    if next_pos != -1:
        actual_insert_pos = next_pos + 1

# Insert the code
new_content = content[:actual_insert_pos] + ticket_payment_code + '\n' + content[actual_insert_pos:]

# Update the STEP numbers in the new content for consistency
# Change "STEP 2: Venue" to "STEP 3: Venue"
new_content = new_content.replace(
    '{/* – STEP 2: Venue / Equipment Fee Decision – */}',
    '{/* – STEP 3: Venue / Equipment Fee Decision – */}'
)

# Write back the file
with open('Events.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✓ Inserted ticket payment step successfully!")
print("✓ Updated STEP numbers")
