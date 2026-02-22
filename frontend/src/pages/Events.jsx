import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import FloatingChatbot from '../components/FloatingChatbot'
import { 
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon,
  HeartIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  UserIcon,
  TagIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  UserGroupIcon as UserGroupSolidIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../api/client'
import QRCode from 'react-qr-code'

// Import Create Event Modal components from Dashboard
let CreateEventModalImport = null
try {
  // We'll need to import or recreate the CreateEventModal here
  CreateEventModalImport = null // Placeholder
} catch (error) {
  console.warn('Create Event Modal not available')
}

// Fallback QR Code Component
const FallbackQRCode = ({ value, size = 200 }) => {
  return (
    <div 
      className="bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="text-center p-4">
        <div className="grid grid-cols-8 gap-1 mb-2">
          {[...Array(64)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 ${
                Math.random() > 0.5 ? 'bg-black' : 'bg-white'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">QR Code</p>
        <p className="text-xs text-gray-500">Ticket ID: {JSON.parse(value)?.ticketId?.substring(0, 8)}...</p>
      </div>
    </div>
  )
}

// Defined OUTSIDE Events so React never recreates it on re-render (prevents input flicker)
const StableRegistrationForm = React.memo(({ registrationData, onChange, onSubmit, selectedEvent, onClose }) => {
  const [emailTouched, setEmailTouched] = React.useState(false)
  const emailError = emailTouched && registrationData.email && !/\S+@\S+\.\S+/.test(registrationData.email)

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6" autoComplete="off" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={registrationData.name}
            onChange={onChange}
            autoComplete="off"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="text"
            name="email"
            value={registrationData.email}
            onChange={onChange}
            onBlur={() => setEmailTouched(true)}
            autoComplete="off"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              emailError ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
          {emailError && (
            <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={registrationData.phone}
            onChange={onChange}
            autoComplete="off"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student ID
          </label>
          <input
            type="text"
            name="studentId"
            value={registrationData.studentId}
            onChange={onChange}
            autoComplete="off"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your student ID (optional)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={registrationData.notes}
          onChange={onChange}
          autoComplete="off"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Any additional information or special requirements"
        />
      </div>

      {/* Event Info Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Date:</span> {selectedEvent.date} at {selectedEvent.time}</p>
          <p><span className="font-medium">Location:</span> {selectedEvent.location}</p>
          <p><span className="font-medium">Price:</span> {selectedEvent.price > 0 ? `$${selectedEvent.price}` : 'Free'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-gray-600 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium"
        >
          Complete Registration
        </button>
      </div>
    </form>
  )
})

// =============================================================================
// STRIPE INTEGRATION GUIDELINE â€” Connect when backend is ready
// =============================================================================
// 1. Install packages:
//      npm install @stripe/react-stripe-js @stripe/stripe-js
//
// 2. Add env variable:
//      VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx  (in .env)
//
// 3. Wrap your app root with Stripe Elements provider (in main.jsx or App.jsx):
//      import { loadStripe } from '@stripe/stripe-js'
//      import { Elements } from '@stripe/react-stripe-js'
//      const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
//      <Elements stripe={stripePromise}><App /></Elements>
//
// 4. Backend (Django) â€” create these endpoints:
//      POST /api/payments/create-intent/
//        â†’ receives { event_id, amount, user_id }
//        â†’ calls stripe.PaymentIntent.create(amount=..., currency='usd', metadata={...})
//        â†’ returns { clientSecret, paymentIntentId }
//
//      POST /api/payments/confirm/
//        â†’ receives { paymentIntentId, ticketData }
//        â†’ verifies status == 'succeeded' via Stripe API
//        â†’ saves PaymentRecord (invoice_id, student_id, event_id, amount, timestamp, status)
//        â†’ activates registration, generates QR ticket
//        â†’ returns { ticket, success }
//
//      POST /api/payments/webhook/  (Stripe webhook endpoint)
//        â†’ handles payment_intent.succeeded, payment_intent.payment_failed
//        â†’ validate with stripe.WebhookSignature.verify()
//
// 5. Replace the card-form placeholder below with real Stripe Elements:
//      import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
//      const stripe = useStripe()
//      const elements = useElements()
//      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//        payment_method: { card: elements.getElement(CardElement) }
//      })
//      if (paymentIntent.status === 'succeeded') { call onPaymentApproved() }
//
// 6. For Bank Transfer / QR (manual):
//      Proof upload â†’ stored in Django (FileField / S3)
//      Finance admin reviews via admin panel (proposal_management style)
//      PUT /api/payments/<id>/verify/ â†’ { status: 'approved'|'rejected', reason }
//      WebSocket or polling to update UI in real time
// =============================================================================

const CHECKLIST_DELAYS = [0, 0.5, 1.0, 1.5]

const PaymentModal = React.memo(({
  show, step, selectedEvent, paymentProof, paymentProofPreview,
  rejectionReason, abaTransactionId, onProofUpload, onSubmitProof, onReupload, onClose,
  onProceedToUpload, onStartAbaQr, onSimulateApprove, onSimulateReject
}) => {
  const [timeLeft, setTimeLeft] = React.useState(10 * 60)
  const [pollCount, setPollCount] = React.useState(0)
  const [pollStatus, setPollStatus] = React.useState('pending') // 'pending'|'checking'

  // â”€â”€ Countdown timer (info step) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  React.useEffect(() => {
    if (!show || step !== 'info') return
    setTimeLeft(10 * 60)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [show, step])

  // â”€â”€ Polling loop (qr_scanning step) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // When connected to a real backend, replace the simulate block below with:
  //   const res = await fetch(`/api/payments/status/${abaTransactionId}/`)
  //   const data = await res.json()
  //   if (data.status === 'paid')   { onSimulateApprove() }
  //   if (data.status === 'failed') { onSimulateReject()  }
  React.useEffect(() => {
    if (!show || step !== 'qr_scanning' || !abaTransactionId) return
    setPollCount(0)
    setPollStatus('pending')
    const interval = setInterval(() => {
      setPollStatus('checking')
      setPollCount(prev => prev + 1)
      setTimeout(() => setPollStatus('pending'), 600)
      // DEMO AUTO-COMPLETE after ~12 s (4 polls Ã— 3 s) â€” remove in production
      // In production this setInterval just polls and only resolves via webhook/DB
    }, 3000)
    return () => clearInterval(interval)
  }, [show, step, abaTransactionId])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const isExpired = timeLeft === 0
  const amount = selectedEvent?.price || 0

  if (!show || !selectedEvent) return null

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[55] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: info â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'info' && (
                <>
                  <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white text-red-700 text-sm font-extrabold px-2.5 py-1 rounded-lg tracking-wide">ABA</div>
                        <div>
                          <h2 className="text-xl font-bold">ABA PayWay</h2>
                          <p className="text-red-100 text-sm mt-0.5 truncate max-w-xs">{selectedEvent.title}</p>
                        </div>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Countdown timer */}
                    <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${isExpired ? 'bg-red-900/40 text-red-200' : 'bg-white/15 text-red-100'}`}>
                      <ClockIcon className="w-4 h-4 flex-shrink-0" />
                      {isExpired
                        ? 'âš ï¸ Payment window expired. Please re-register.'
                        : `Payment window: ${mins}:${secs} remaining`}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Amount card */}
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 flex items-center justify-between border border-red-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Amount Due</p>
                        <p className="text-4xl font-extrabold text-red-700">${amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">{selectedEvent.title}</p>
                      </div>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
                        <CurrencyDollarIcon className="w-8 h-8 text-red-600" />
                      </div>
                    </div>

                    {/* ABA QR block â€” always shown */}
                    <div className="border-2 border-red-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Scan to Pay</p>
                          <p className="text-xs text-gray-400">Page auto-completes after payment â€” no button needed</p>
                        </div>
                        <div className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg tracking-wide">PayWay</div>
                      </div>

                      {/* QR preview */}
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-red-100">
                          <QRCode
                            value={`aba-payway://pay?merchant=CAMPUS_EVENTS&amount=${amount.toFixed(2)}&ref=EVT${selectedEvent?.id}`}
                            size={160}
                            level="H"
                            bgColor="#ffffff"
                            fgColor="#991b1b"
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-3xl font-extrabold text-red-700">${amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Open ABA Mobile â†’ Scan QR â†’ Confirm</p>
                      </div>

                      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 leading-relaxed space-y-1">
                        <p className="font-semibold">Two ways to complete:</p>
                        <p>â€¢ <strong>Auto:</strong> Once you pay in ABA Mobile, our server detects it automatically via webhook.</p>
                        <p>â€¢ <strong>Manual:</strong> Paid but page didnâ€™t update? Upload your receipt for finance review (1â€“3 days).</p>
                      </div>

                      <button
                        disabled={isExpired}
                        onClick={onStartAbaQr}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold disabled:opacity-40 hover:from-red-700 hover:to-rose-700 transition-all shadow-sm text-base"
                      >
                        ðŸ“± Open Full QR + Auto-Detect
                      </button>
                      <button
                        disabled={isExpired}
                        onClick={onProceedToUpload}
                        className="w-full py-2.5 border-2 border-red-300 text-red-700 rounded-xl font-semibold disabled:opacity-40 hover:bg-red-50 transition-all text-sm"
                      >
                        Iâ€™ve Already Paid â€” Upload Proof
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: qr_scanning â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'qr_scanning' && (
                <>
                  {/* ABA-branded header */}
                  <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-white text-red-700 text-xs font-extrabold px-2 py-0.5 rounded">ABA</span>
                          <h2 className="text-xl font-bold">Waiting for Payment</h2>
                        </div>
                        <p className="text-red-100 text-sm">Scan the QR code with ABA Mobile app</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Transaction ID pill */}
                    <div className="flex items-center justify-center">
                      <span className="bg-gray-100 text-gray-500 text-xs font-mono px-3 py-1.5 rounded-full">
                        TXN: {abaTransactionId}
                      </span>
                    </div>

                    {/* QR with pulsing ring */}
                    <div className="flex justify-center">
                      <div className="relative">
                        {/* Outer pulse ring */}
                        <motion.div
                          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-2xl bg-red-400"
                          style={{ margin: '-10px' }}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.5 }}
                          className="absolute inset-0 rounded-2xl bg-red-300"
                          style={{ margin: '-18px' }}
                        />
                        <div className="relative bg-white p-4 rounded-2xl shadow-xl border-2 border-red-200">
                          <QRCode
                            value={`aba-payway://pay?merchant=CAMPUS_EVENTS&amount=${(selectedEvent?.price || 0).toFixed(2)}&ref=EVT${selectedEvent?.id}&tran=${abaTransactionId}`}
                            size={200}
                            level="H"
                            bgColor="#ffffff"
                            fgColor="#991b1b"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-gray-800">${(selectedEvent?.price || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{selectedEvent?.title}</p>
                    </div>

                    {/* Live polling status */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ opacity: pollStatus === 'checking' ? [1, 0.2, 1] : 1,
                                       scale: pollStatus === 'checking' ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-2.5 h-2.5 rounded-full bg-green-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            {pollStatus === 'checking' ? 'Checking payment status...' : 'Listening for payment'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">Poll #{pollCount} Â· every 3s</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [1, 2.5, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                            className="w-1.5 h-3 bg-red-400 rounded-full origin-bottom"
                          />
                        ))}
                        <span className="ml-2 text-xs text-gray-400">Waiting for ABA webhook...</span>
                      </div>
                    </div>

                    {/* Steps guide */}
                    <ol className="space-y-2 text-sm text-gray-600">
                      {[
                        ['1', 'Open ABA Mobile app', 'text-red-700 bg-red-100'],
                        ['2', 'Tap Scan QR â†’ point at code above', 'text-red-700 bg-red-100'],
                        ['3', 'Confirm the amount and pay', 'text-red-700 bg-red-100'],
                        ['4', 'This page completes automatically âœ“', 'text-green-700 bg-green-100'],
                      ].map(([num, text, cls]) => (
                        <li key={num} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>{num}</span>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ol>

                    {/* Demo controls */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-center text-gray-400 mb-3 font-medium">â€” DEMO: Simulate ABA Webhook Response â€”</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={onSimulateApprove}
                          className="py-2.5 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 transition-all"
                        >
                          âœ“ Payment Received
                        </button>
                        <button
                          onClick={onSimulateReject}
                          className="py-2.5 bg-red-500 text-white text-sm rounded-xl font-semibold hover:bg-red-600 transition-all"
                        >
                          âœ— Payment Failed
                        </button>
                      </div>
                    </div>

                    {/* Manual fallback â€” matches spec: Upload Proof â†’ Finance Verification path */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500 text-center mb-2">Page didnâ€™t auto-complete after paying?</p>
                      <button
                        onClick={onProceedToUpload}
                        className="w-full py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-red-300 hover:text-red-700 hover:bg-red-50 transition-all text-sm"
                      >
                        Upload Proof of Payment Instead â†’
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: upload â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'upload' && (
                <>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Upload Proof of Payment</h2>
                        <p className="text-blue-100 text-sm mt-0.5">Submit your receipt for finance review</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Amount reminder */}
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3 border border-blue-100">
                      <CurrencyDollarIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-700">Amount paid: <strong>${amount.toFixed(2)}</strong> Â· {selectedEvent.title}</p>
                    </div>

                    {/* Upload zone */}
                    <label htmlFor="payment-proof-upload" className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        paymentProof
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}>
                        {paymentProof ? (
                          <div className="space-y-3">
                            {paymentProofPreview && (
                              <img src={paymentProofPreview} alt="Proof preview" className="max-h-44 mx-auto rounded-xl object-contain shadow-md" />
                            )}
                            <p className="text-sm font-semibold text-green-700">âœ“ {paymentProof.name}</p>
                            <p className="text-xs text-gray-400">{(paymentProof.size / 1024).toFixed(1)} KB Â· Click to change</p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <ArrowUpTrayIcon className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-sm font-semibold text-gray-600">Click or drag to upload receipt</p>
                            <p className="text-xs text-gray-400">JPG, PNG or PDF Â· Max 5 MB</p>
                          </div>
                        )}
                      </div>
                      <input
                        id="payment-proof-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={onProofUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Finance checklist */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-amber-700 mb-2">ðŸ“‹ Finance Verification Checklist</p>
                      <ul className="text-xs text-amber-600 space-y-1.5 list-disc list-inside">
                        <li>Transfer amount must exactly match <strong>${amount.toFixed(2)}</strong></li>
                        <li>Transaction date and reference number must be visible</li>
                        <li>Image must not be cropped, edited, or blurred</li>
                        <li>Estimated verification time: <strong>1â€“3 business days</strong></li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button onClick={onClose} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all">
                        Cancel
                      </button>
                      <button
                        onClick={onSubmitProof}
                        disabled={!paymentProof}
                        className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                      >
                        Submit for Verification
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: verifying â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'verifying' && (
                <>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Under Finance Review</h2>
                        <p className="text-amber-100 text-sm mt-0.5">Your proof has been received</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex flex-col items-center py-4 space-y-3">
                      <div className="relative">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                          <ShieldCheckIcon className="w-10 h-10 text-amber-600" />
                        </div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-300"
                        />
                      </div>
                      <p className="text-lg font-bold text-gray-800">Verification in Progress</p>
                      <p className="text-sm text-gray-500 text-center max-w-xs">
                        Our finance team is reviewing your proof. This typically takes <strong>1â€“3 business days</strong>.
                        You'll receive an email and app notification once verified.
                      </p>
                    </div>

                    {/* Verification checklist (animated) */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      {[
                        ['Amount Match',       `Verifying transfer equals $${amount.toFixed(2)}`],
                        ['Transfer Code Valid', 'Validating transaction reference number'],
                        ['Duplicate Check',    'Scanning for previously submitted receipts'],
                        ['Image Authenticity', 'Detecting edited or altered screenshots'],
                      ].map(([title, desc], i) => (
                        <div key={title} className="flex items-start gap-3">
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.8, delay: CHECKLIST_DELAYS[i] }}
                            className="mt-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{title}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Demo simulation */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-center text-gray-400 mb-3 font-medium">â€” DEMO ONLY: Simulate Finance Decision â€”</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={onSimulateApprove}
                          className="py-2.5 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm"
                        >
                          âœ“ Approve Payment
                        </button>
                        <button
                          onClick={onSimulateReject}
                          className="py-2.5 bg-red-500 text-white text-sm rounded-xl font-semibold hover:bg-red-600 transition-all shadow-sm"
                        >
                          âœ— Reject Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: rejected â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'rejected' && (
                <>
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Payment Rejected</h2>
                        <p className="text-red-100 text-sm mt-0.5">Action required â€” please re-upload your proof</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Rejection reason */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="font-bold text-red-700">Rejection Reason</p>
                      </div>
                      <p className="text-sm text-red-600 leading-relaxed">
                        {rejectionReason || 'Payment verification failed. Please upload a valid proof of payment.'}
                      </p>
                    </div>

                    {/* Required actions */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Required Actions:</p>
                      <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                        <li>Ensure the exact amount of <strong>${amount.toFixed(2)}</strong> was transferred</li>
                        <li>Upload a clear, unedited screenshot or bank receipt</li>
                        <li>Include visible transaction date and reference number</li>
                        <li>Do not crop or edit the image in any way</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={onClose} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all">
                        Cancel
                      </button>
                      <button
                        onClick={onReupload}
                        className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-sm"
                      >
                        Re-upload Proof
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP: approved â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {step === 'approved' && (
                <>
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Payment Approved! ðŸŽ‰</h2>
                        <p className="text-green-100 text-sm mt-0.5">Registration activated â€” your ticket is ready</p>
                      </div>
                      <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex flex-col items-center py-6 space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-inner"
                      >
                        <CheckCircleIcon className="w-14 h-14 text-green-600" />
                      </motion.div>
                      <p className="text-xl font-bold text-gray-800">Registration Activated!</p>
                      <p className="text-sm text-gray-500 text-center max-w-xs">
                        Your payment has been verified. Your QR code ticket will appear in a moment.
                      </p>
                    </div>

                    {/* What was stored */}
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                      {[
                        'Payment Record Stored (Receipt, Invoice ID, Amount, Timestamp)',
                        'QR Code Ticket Generated',
                        'Email Confirmation Sent',
                        'Event Reminder Scheduled (1 day before)',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm">
                      View My Ticket â†’
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
})

// Defined at module level (not inside Events) so React never recreates the component
// type on re-render â€” prevents the "type one letter â†’ flicker/focus lost" bug
const RegistrationFormModal = React.memo(({ show, selectedEvent, registrationData, onRegistrationChange, onRegistrationSubmit, onClose }) => (
  <AnimatePresence>
    {show && selectedEvent && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Event Registration</h2>
                  <p className="text-purple-100">{selectedEvent.title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Use the stable form component */}
            <StableRegistrationForm 
              registrationData={registrationData}
              onChange={onRegistrationChange}
              onSubmit={onRegistrationSubmit}
              selectedEvent={selectedEvent}
              onClose={onClose}
            />
          </motion.div>
        </div>
      </div>
    )}
  </AnimatePresence>
))

const Events = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [showOrganizerModal, setShowOrganizerModal] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showOrganizerRestrictModal, setShowOrganizerRestrictModal] = useState(false)

  // â”€â”€â”€ Payment flow state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState('info') // 'info'|'upload'|'qr_scanning'|'verifying'|'rejected'|'approved'
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card'|'bank'|'qr'
  const [paymentProof, setPaymentProof] = useState(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pendingTicketData, setPendingTicketData] = useState(null)
  const [abaTransactionId, setAbaTransactionId] = useState(null)
  const [pendingRegistrationId, setPendingRegistrationId] = useState(null)

  // State for event creation form (same as Dashboard)
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    agendaPdf: null,
    location: '',
    eventType: 'academic',
    maxAttendees: '',
    phoneNumber: '',
    price: 0,
    description: '',
    organizer: user?.name || 'Event Organizer',
    requirements: '',
    tags: []
  })
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    notes: ''
  })

  const handleCreateEvent = () => {
    // Only organizers and admins can create events
    if (user?.role === 'organizer' || user?.role === 'admin') {
      setShowCreateEventModal(true)
    } else {
      toast.error('Only organizers can create events')
    }
  }

  const handleRegisterAsOrganizer = () => {
    // Navigate to organizer registration page
    setShowOrganizerModal(false)
    navigate('/register?role=organizer')
    toast.success('Redirecting to Organizer Registration...')
  }

  const handleSignUpAsStudent = () => {
    logout()
    navigate('/register')
  }

  const handleSignInAsStudent = () => {
    logout()
    navigate('/login')
  }

  // Handler for form input changes â€” useCallback prevents new reference on every render
  const handleFormChange = useCallback((e) => {
    const { name, value, type } = e.target
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }, [])

  // Handler for PDF file upload
  const handlePdfUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file')
        return
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      setEventForm(prev => ({
        ...prev,
        agendaPdf: file
      }))
      toast.success('PDF uploaded successfully')
    }
  }, [])

  // Handler for removing PDF
  const removePdf = useCallback(() => {
    setEventForm(prev => ({
      ...prev,
      agendaPdf: null
    }))
    toast.success('PDF removed')
  }, [])

  // Calculate platform fee (3% of total potential revenue)
  const calculatePlatformFee = useCallback(() => {
    const totalRevenue = eventForm.price * eventForm.maxAttendees
    return eventForm.price > 0 ? totalRevenue * 0.03 : 0
  }, [eventForm.price, eventForm.maxAttendees])

  // Handle event creation — useCallback prevents new reference on every render, keeping React.memo working
  const handleCreateEventSubmit = useCallback(() => {
    // Validation
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location || !eventForm.maxAttendees || !eventForm.phoneNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee()
    
    // Create new event object
    const newEvent = {
      id: Date.now(),
      ...eventForm,
      status: 'published',
      registrations: 0,
      image: '/api/placeholder/400/200',
      createdAt: new Date().toISOString()
    }

    console.log('Creating event:', newEvent)
    console.log('Platform fee:', platformFee)

    // Show success message
    if (platformFee > 0) {
      toast.success(`Event created successfully! Platform fee: $${platformFee.toFixed(2)}`)
    } else {
      toast.success('Free event created successfully!')
    }

    // Reset form and close modal
    setEventForm({
      title: '',
      date: '',
      time: '',
      agenda: '',
      agendaPdf: null,
      location: '',
      eventType: 'academic',
      maxAttendees: '',
      phoneNumber: '',
      price: 0,
      description: '',
      organizer: user?.name || 'Event Organizer',
      requirements: '',
      tags: []
    })
    setShowCreateEventModal(false)
  }, [eventForm, calculatePlatformFee, user, setShowCreateEventModal])

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', { searchTerm, filterStatus, filterType }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType && filterType !== 'all') params.set('event_type', filterType)
      params.set('ordering', '-start_datetime')
      const res = await apiClient.get(`/api/events/?${params.toString()}`)
      const raw = res.data?.results || (Array.isArray(res.data) ? res.data : [])
      return raw.map(e => {
        const startDt = e.start_datetime ? new Date(e.start_datetime) : null
        return {
          ...e,
          date: startDt ? startDt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          time: startDt ? startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          location: e.venue || '',
          type: e.event_type || 'general',
          image: e.poster_image_url || 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800',
          currentAttendees: e.current_participants || 0,
          maxAttendees: e.max_participants ?? null,
          price: e.is_paid ? (parseFloat(e.price) || 0) : 0,
          organizer: {
            name: e.created_by?.full_name || e.club_name || 'Campus Events',
            avatar: e.created_by?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.created_by?.full_name || 'Event')}&background=7c3aed&color=fff`
          },
          tags: Array.isArray(e.tags) ? e.tags : [],
        }
      })
    },
    staleTime: 2 * 60 * 1000,
  })

  const getStatusColor = (status) => {
    if (!status || status === '') {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    switch (status) {
      case 'approved':
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending_approval':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'conference':
        return 'ðŸŽ¤'
      case 'workshop':
        return 'ðŸ› ï¸'
      case 'entertainment':
        return 'ðŸŽ­'
      case 'academic':
        return 'ðŸ“š'
      case 'sports':
        return 'âš½'
      default:
        return 'ðŸ“…'
    }
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setIsRegistered(false)
    setIsLiked(false)
  }

  const handleRegister = () => {
    // Check if user is an organizer
    if (user?.role === 'organizer') {
      setShowOrganizerRestrictModal(true)
      return
    }
    
    console.log('Event status:', selectedEvent.status)
    console.log('Event data:', selectedEvent)
    
    // Check if event allows registration (more flexible status check)
    if (selectedEvent.status && selectedEvent.status !== 'approved' && selectedEvent.status !== 'published') {
      toast.error(`This event is not yet available for registration. Status: ${selectedEvent.status}`)
      return
    }
    
    if (selectedEvent.maxAttendees !== null && selectedEvent.currentAttendees >= selectedEvent.maxAttendees) {
      toast.error('This event is already full')
      return
    }
    
    // Show registration form
    setShowRegisterForm(true)
    toast.success('Opening registration form...')
  }

  const handleRegistrationChange = useCallback((e) => {
    const { name, value } = e.target
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const handleRegistrationSubmit = useCallback(async (e) => {
    e.preventDefault()

    // Basic validation
    if (!registrationData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!registrationData.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
      toast.error('Please enter a valid email')
      return
    }

    try {
      // POST registration to backend
      const res = await apiClient.post('/api/events/registrations/', {
        event: selectedEvent.id,
        notes: registrationData.notes || ''
      })
      const registrationId = res.data.id

      // Build local ticket enrichment
      const ticket = {
        id: registrationId,
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time,
        eventLocation: selectedEvent.location,
        userName: registrationData.name,
        userEmail: registrationData.email,
        userPhone: registrationData.phone,
        userStudentId: registrationData.studentId,
        registrationDate: new Date().toISOString(),
        price: selectedEvent.price,
        qrCodeData: JSON.stringify({
          ticketId: registrationId,
          eventId: selectedEvent.id,
          userEmail: registrationData.email,
          userName: registrationData.name,
          eventDate: selectedEvent.date,
          eventTime: selectedEvent.time
        })
      }

      setRegistrationData({ name: '', email: '', phone: '', studentId: '', notes: '' })
      setShowRegisterForm(false)

      if (selectedEvent.price > 0) {
        // Paid event → open payment modal; ticket activates only after approval
        setPendingRegistrationId(registrationId)
        setPendingTicketData(ticket)
        setPaymentStep('info')
        setPaymentMethod('card')
        setPaymentProof(null)
        setPaymentProofPreview(null)
        setRejectionReason('')
        setShowPaymentModal(true)
      } else {
        // Free event → confirmed in DB, show QR ticket
        setIsRegistered(true)
        selectedEvent.currentAttendees = (selectedEvent.currentAttendees || 0) + 1
        toast.success('Successfully registered for the event!')
        setTicketData(ticket)
        setShowTicketModal(true)
      }
    } catch (err) {
      const msg =
        err.response?.data?.event?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please try again.'
      toast.error(msg)
    }
  }, [registrationData, selectedEvent, setPendingRegistrationId, setPendingTicketData,
      setPaymentStep, setPaymentMethod, setPaymentProof, setPaymentProofPreview,
      setRejectionReason, setIsRegistered, setTicketData, setShowTicketModal,
      setShowRegisterForm, setShowPaymentModal])

  const handleLike = () => {
    setIsLiked(!isLiked)
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites')
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsRegistered(false)
    setIsLiked(false)
    setShowRegisterForm(false)
    setShowTicketModal(false)
    setShowPaymentModal(false)
    setTicketData(null)
    setPendingTicketData(null)
    setPaymentProof(null)
    setPaymentProofPreview(null)
    setAbaTransactionId(null)
    setPendingRegistrationId(null)
    setRejectionReason('')
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      studentId: '',
      notes: ''
    })
  }

  // â”€â”€â”€ Payment handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePaymentProofUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5 MB')
      return
    }
    setPaymentProof(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setPaymentProofPreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setPaymentProofPreview(null)
    }
  }, [])

  const handleSubmitProof = useCallback(async () => {
    if (!paymentProof) {
      toast.error('Please upload your proof of payment first')
      return
    }
    try {
      if (pendingRegistrationId) {
        const formData = new FormData()
        formData.append('payment_receipt', paymentProof)
        await apiClient.patch(`/api/events/registrations/${pendingRegistrationId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      setPaymentStep('verifying')
      toast.success('Proof submitted! Awaiting finance verification (1–3 days).')
    } catch (err) {
      toast.error('Failed to upload proof. Please try again.')
    }
  }, [paymentProof, pendingRegistrationId])

  const handleSimulateApprove = useCallback(() => {
    setPaymentStep('approved')
    if (pendingTicketData && selectedEvent) {
      setIsRegistered(true)
      selectedEvent.currentAttendees += 1
      setTicketData(pendingTicketData)
      toast.success('ðŸŸ© Payment approved! Your ticket is ready.')
      setTimeout(() => {
        setShowPaymentModal(false)
        setPendingTicketData(null)
        setShowTicketModal(true)
      }, 2200)
    }
  }, [pendingTicketData, selectedEvent])

  const handleSimulateReject = useCallback(() => {
    setRejectionReason(
      `Amount transferred does not match the required amount ($${(selectedEvent?.price || 0).toFixed(2)}). ` +
      'Possible reasons: partial payment, wrong reference, or edited screenshot. Please re-upload a valid proof.'
    )
    setPaymentStep('rejected')
    toast.error('ðŸŸ¥ Payment verification failed.')
  }, [selectedEvent])

  const handlePaymentClose = useCallback(() => {
    setShowPaymentModal(false)
    setPaymentProof(null)
    setPaymentProofPreview(null)
    setAbaTransactionId(null)
    // Keep pendingTicketData + step so user can reopen via their account notifications
  }, [])

  // â”€â”€â”€ ABA PayWay QR: create order â†’ go to qr_scanning step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleStartAbaQr = useCallback(() => {
    // â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    // â”‚  ABA PAYWAY INTEGRATION â€” replace this block with real API call     â”‚
    // â”‚                                                                     â”‚
    // â”‚  HOW IT WORKS (the magic behind "scan â†’ auto complete"):            â”‚
    // â”‚                                                                     â”‚
    // â”‚  1. YOUR BACKEND creates an ABA PayWay transaction:                 â”‚
    // â”‚     POST https://checkout.payway.com.kh/api/payment-gateway/v1/    â”‚
    // â”‚          payments/purchase                                          â”‚
    // â”‚     Headers: { Authorization: 'Bearer <ABA_API_KEY>' }             â”‚
    // â”‚     Body: {                                                         â”‚
    // â”‚       tran_id:   'EVT-<eventId>-<timestamp>',  // your unique ID   â”‚
    // â”‚       amount:    '5.00',                                            â”‚
    // â”‚       currency:  'USD',                                             â”‚
    // â”‚       items:     [{ name: eventTitle, quantity: 1, price: 5.00 }], â”‚
    // â”‚       return_url: 'https://yoursite.com/payment/return',            â”‚
    // â”‚       continue_success_url: 'https://yoursite.com/events',          â”‚
    // â”‚       purchase_type: 'purchase',                                    â”‚
    // â”‚       shipping: 0                                                   â”‚
    // â”‚     }                                                               â”‚
    // â”‚     â†’ ABA returns: { tran_id, qr_code (base64 PNG), status }       â”‚
    // â”‚                                                                     â”‚
    // â”‚  2. FRONTEND displays qr_code image directly (no library needed)   â”‚
    // â”‚     <img src={`data:image/png;base64,${qrCode}`} />                â”‚
    // â”‚                                                                     â”‚
    // â”‚  3. USER scans QR with ABA Mobile app â†’ confirms payment           â”‚
    // â”‚                                                                     â”‚
    // â”‚  4. ABA sends a WEBHOOK to your backend:                            â”‚
    // â”‚     POST /api/payments/aba-webhook/                                 â”‚
    // â”‚     Body: { tran_id, status: 'SUCCESS', amount, hash }              â”‚
    // â”‚     â†’ verify hash with SHA512-HMAC using your ABA_MERCHANT_SECRET  â”‚
    // â”‚     â†’ mark order as PAID in your database                          â”‚
    // â”‚                                                                     â”‚
    // â”‚  5. FRONTEND polls every 3 s:                                       â”‚
    // â”‚     GET /api/payments/status/{tran_id}/                             â”‚
    // â”‚     â†’ { status: 'pending'|'paid'|'failed' }                        â”‚
    // â”‚     â†’ when 'paid': auto-approve ticket, close modal                â”‚
    // â”‚                                                                     â”‚
    // â”‚  Django backend snippet:                                            â”‚
    // â”‚    @csrf_exempt                                                     â”‚
    // â”‚    def aba_webhook(request):                                        â”‚
    // â”‚        data = json.loads(request.body)                              â”‚
    // â”‚        expected = hmac.new(ABA_SECRET, msg, sha512).hexdigest()     â”‚
    // â”‚        if expected != data['hash']: return 403                      â”‚
    // â”‚        PaymentRecord.objects.filter(                                â”‚
    // â”‚            tran_id=data['tran_id']).update(status='paid')           â”‚
    // â”‚        return JsonResponse({'status': 'ok'})                        â”‚
    // â”‚                                                                     â”‚
    // â”‚  That is the full loop. The webhook updates the DB, the poll       â”‚
    // â”‚  detects the change â†’ page auto-completes with no user action.     â”‚
    // â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

    // DEMO: generate a fake transaction ID immediately
    const fakeTranId = `ABA-EVT${selectedEvent?.id}-${Date.now()}`
    setAbaTransactionId(fakeTranId)
    setPaymentStep('qr_scanning')
    toast.success('QR ready â€” scan with ABA Mobile to pay')
  }, [selectedEvent])
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const downloadTicket = () => {
    if (!ticketData) return
    
    // Create a canvas element to draw the ticket
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = 400
    canvas.height = 600
    
    // Draw ticket background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw border
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    
    // Draw header
    ctx.fillStyle = '#8b5cf6'
    ctx.fillRect(10, 10, canvas.width - 20, 80)
    
    // Draw title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.fillText('EVENT TICKET', 20, 45)
    
    // Draw event name
    ctx.font = 'bold 16px Arial'
    ctx.fillText(ticketData.eventName, 20, 70)
    
    // Draw ticket ID
    ctx.font = '12px Arial'
    ctx.fillStyle = '#e0e7ff'
    ctx.fillText(`Ticket ID: ${ticketData.id}`, 20, 90)
    
    // Draw event details
    ctx.fillStyle = '#1f2937'
    ctx.font = '14px Arial'
    ctx.fillText('Event Details:', 20, 120)
    
    ctx.font = '12px Arial'
    ctx.fillStyle = '#4b5563'
    ctx.fillText(`Date: ${ticketData.eventDate}`, 20, 145)
    ctx.fillText(`Time: ${ticketData.eventTime}`, 20, 165)
    ctx.fillText(`Location: ${ticketData.eventLocation}`, 20, 185)
    ctx.fillText(`Price: ${ticketData.price > 0 ? '$' + ticketData.price : 'Free'}`, 20, 205)
    
    // Draw attendee details
    ctx.fillStyle = '#1f2937'
    ctx.font = '14px Arial'
    ctx.fillText('Attendee:', 220, 120)
    
    ctx.font = '12px Arial'
    ctx.fillStyle = '#4b5563'
    ctx.fillText(`Name: ${ticketData.userName}`, 220, 145)
    ctx.fillText(`Email: ${ticketData.userEmail}`, 220, 165)
    if (ticketData.userPhone) {
      ctx.fillText(`Phone: ${ticketData.userPhone}`, 220, 185)
    }
    if (ticketData.userStudentId) {
      ctx.fillText(`Student ID: ${ticketData.userStudentId}`, 220, 205)
    }
    
    // Draw QR code placeholder (in a real app, you'd generate the QR code here)
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(20, 240, 120, 120)
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px Arial'
    ctx.fillText('QR Code', 65, 295)
    
    // Draw registration date
    ctx.fillStyle = '#9ca3af'
    ctx.font = '10px Arial'
    ctx.fillText(`Registered: ${new Date(ticketData.registrationDate).toLocaleDateString()}`, 20, 380)
    
    // Draw footer
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30)
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px Arial'
    ctx.fillText('Scan QR code at event entrance', 20, canvas.height - 20)
    
    // Download the ticket
    const link = document.createElement('a')
    link.download = `ticket-${ticketData.id}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    toast.success('Ticket downloaded successfully!')
  }

  const EventModal = () => (
    <AnimatePresence>
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-gray-900 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* Event Image */}
              <div className="relative h-64 md:h-80">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl">{getTypeIcon(selectedEvent.type)}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedEvent.status)}`}>
                      {selectedEvent.status ? selectedEvent.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedEvent.title}</h2>
                  <p className="text-white/90 text-lg">{selectedEvent.description}</p>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-600">{selectedEvent.date} at {selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <UserGroupIcon className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Attendance</p>
                      <p className="text-sm text-gray-600">{selectedEvent.currentAttendees}/{selectedEvent.maxAttendees}</p>
                    </div>
                  </div>
                  {selectedEvent.price > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Price</p>
                        <p className="text-sm text-gray-600 font-semibold">${selectedEvent.price}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Organizer */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer</h3>
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={selectedEvent.organizer.avatar}
                      alt={selectedEvent.organizer.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedEvent.organizer.name}</p>
                      <p className="text-sm text-gray-600">Event Organizer</p>
                    </div>
                    <button className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                      Contact
                    </button>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
                  <div className="prose prose-purple max-w-none">
                    <p className="text-gray-600 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Important Information</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Please arrive 15 minutes before the event starts. Bring a valid ID for registration.
                            {selectedEvent.price > 0 && ' Payment can be made at the venue.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={handleRegister}
                    disabled={isRegistered || (selectedEvent.maxAttendees !== null && selectedEvent.currentAttendees >= selectedEvent.maxAttendees)}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isRegistered
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : (selectedEvent.maxAttendees !== null && selectedEvent.currentAttendees >= selectedEvent.maxAttendees)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    }`}
                  >
                    {isRegistered ? (
                      <span className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Registered</span>
                      </span>
                    ) : (selectedEvent.maxAttendees !== null && selectedEvent.currentAttendees >= selectedEvent.maxAttendees) ? (
                      'Event Full'
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  const TicketModal = () => (
    <AnimatePresence>
      {showTicketModal && ticketData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTicketModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">Registration Successful!</h2>
                    <p className="text-green-100">Your event ticket has been generated</p>
                  </div>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6 space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    {QRCode ? (
                      <QRCode
                        value={ticketData.qrCodeData}
                        size={200}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    ) : (
                      <FallbackQRCode value={ticketData.qrCodeData} size={200} />
                    )}
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-center">Ticket Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Ticket ID:</span>
                      <span className="text-gray-900">{ticketData.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Event:</span>
                      <span className="text-gray-900">{ticketData.eventName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Date:</span>
                      <span className="text-gray-900">{ticketData.eventDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Time:</span>
                      <span className="text-gray-900">{ticketData.eventTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Location:</span>
                      <span className="text-gray-900">{ticketData.eventLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Attendee:</span>
                      <span className="text-gray-900">{ticketData.userName}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Important Information</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Please save this ticket or take a screenshot. You will need to present this QR code at the event entrance for verification.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={downloadTicket}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download Ticket
                  </button>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  // Organizer Registration Modal
  const OrganizerRegistrationModal = () => (
    <AnimatePresence>
      {showOrganizerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOrganizerModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Register as Organizer</h2>
                    <p className="text-orange-100">Unlock event creation privileges</p>
                  </div>
                  <button
                    onClick={() => setShowOrganizerModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Warning Message */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Student Account Detected</h3>
                      <p className="text-sm text-orange-700">
                        To create events, you need to register as an Organizer. This will give you access to event creation and management tools.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Organizer Benefits:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Create and manage campus events</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Track event attendance and analytics</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Communicate with event participants</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Promote your events campus-wide</span>
                    </li>
                  </ul>
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Must be an active student</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>No disciplinary actions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>Complete organizer training (if required)</span>
                    </li>
                  </ul>
                </div>

                {/* User Info Display */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Your Information:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{user?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Role:</span>
                      <span className="font-medium text-gray-900 capitalize">{user?.role || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowOrganizerModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterAsOrganizer}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-medium"
                  >
                    <UserGroupSolidIcon className="w-5 h-5" />
                    Register as Organizer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  const OrganizerRestrictModal = () => (
    <AnimatePresence>
      {showOrganizerRestrictModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOrganizerRestrictModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Organizer Account</h2>
                  </div>
                  <button
                    onClick={() => setShowOrganizerRestrictModal(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-gray-700 text-lg">
                    Organizers cannot register for events.
                  </p>
                  <p className="text-gray-600">
                    To join events as an attendee, please sign in with a student account.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleSignUpAsStudent}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Sign Up as Student</span>
                  </button>
                  <button
                    onClick={handleSignInAsStudent}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-medium"
                  >
                    <span>Sign In as Student</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center pt-2">
                  Note: Clicking either button will log you out of your organizer account.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  const EventCard = ({ event, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => handleEventClick(event)}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        </div>
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
          {event.status ? event.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {event.description}
          </p>
        </div>

        {/* Event Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-sm">{event.date} at {event.time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPinIcon className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <UserGroupIcon className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-sm">
              {event.currentAttendees}{event.maxAttendees !== null ? `/${event.maxAttendees}` : ''} attending
            </span>
          </div>
          {event.price > 0 && (
            <div className="flex items-center text-gray-600">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 text-purple-600" />
              <span className="text-sm font-semibold">${event.price}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Organizer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-3">
            <img
              src={event.organizer.avatar}
              alt={event.organizer.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{event.organizer.name}</p>
              <p className="text-xs text-gray-500">Organizer</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleEventClick(event)
            }}
            className="btn-primary"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/img/events.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: 'white',
          padding: 'calc(6rem + 60px) 2rem 5.5rem',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Curved bottom shape */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: '#f9fafb',
            borderRadius: '100% 100% 0 0 / 80px 80px 0 0'
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              opacity: 0.9,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: 500
            }}
          >
            Discover Events
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              fontWeight: 700,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
          >
            Campus <span style={{ color: '#667eea' }}>Events</span>
          </motion.h1>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Events</h2>
              <p className="text-gray-600">Discover and join exciting campus events</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-200 w-48"
                />
                <MagnifyingGlassIcon className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Filters */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending_approval">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
              </select>

              {(user?.role === 'organizer' || user?.role === 'admin') && (
                <button 
                  onClick={handleCreateEvent}
                  className="btn-primary text-sm px-4 py-1.5"
                >
                  Create Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium">No events found</p>
            <p className="text-sm mt-1">Check back later or adjust your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal />
      
      {/* Registration Form Modal */}
      <RegistrationFormModal
        show={showRegisterForm}
        selectedEvent={selectedEvent}
        registrationData={registrationData}
        onRegistrationChange={handleRegistrationChange}
        onRegistrationSubmit={handleRegistrationSubmit}
        onClose={() => setShowRegisterForm(false)}
      />
      
      {/* Payment Modal â€” Section 6: Student Payment & Event Attendance */}
      <PaymentModal
        show={showPaymentModal}
        step={paymentStep}
        selectedEvent={selectedEvent}
        paymentProof={paymentProof}
        paymentProofPreview={paymentProofPreview}
        rejectionReason={rejectionReason}
        abaTransactionId={abaTransactionId}
        onProofUpload={handlePaymentProofUpload}
        onSubmitProof={handleSubmitProof}
        onReupload={() => setPaymentStep('upload')}
        onClose={handlePaymentClose}
        onProceedToUpload={() => setPaymentStep('upload')}
        onStartAbaQr={handleStartAbaQr}
        onSimulateApprove={handleSimulateApprove}
        onSimulateReject={handleSimulateReject}
      />

      {/* Ticket Modal */}
      <TicketModal />
      
      {/* Organizer Registration Modal */}
      <OrganizerRegistrationModal />

      {/* Organizer Restrict Modal */}
      <OrganizerRestrictModal />

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <CreateEventModal 
            eventForm={eventForm}
            handleFormChange={handleFormChange}
            handlePdfUpload={handlePdfUpload}
            removePdf={removePdf}
            calculatePlatformFee={calculatePlatformFee}
            handleCreateEventSubmit={handleCreateEventSubmit}
            setShowCreateEventModal={setShowCreateEventModal}
          />
        )}
      </AnimatePresence>

      {/* Floating Chatbot Button */}
      <FloatingChatbot />
    </div>
  )
}

// Create Event Modal â€” React.memo + internal Section 7 multi-step flow
// Steps (per flowchart.md Â§7): form â†’ venue_fee â†’ fee_payment (if yes) â†’ ai_eval â†’ submitted
const CreateEventModal = React.memo(({ eventForm, handleFormChange, handlePdfUpload, removePdf, calculatePlatformFee, handleCreateEventSubmit, setShowCreateEventModal }) => {
  const platformFee = calculatePlatformFee()
  const totalRevenue = eventForm.price * eventForm.maxAttendees

  // â”€â”€ Section 7 local state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [step, setStep] = React.useState('form')
  const [venueFeeRequired, setVenueFeeRequired] = React.useState(null)
  const [venueFeeProof, setVenueFeeProof] = React.useState(null)
  const [venueFeeProofPreview, setVenueFeeProofPreview] = React.useState(null)
  const [venueFeePayStep, setVenueFeePayStep] = React.useState('upload')
  const [venueFeeRejectionReason, setVenueFeeRejectionReason] = React.useState('')
  const [aiEvalProgress, setAiEvalProgress] = React.useState(0)
  const [aiEvalDone, setAiEvalDone] = React.useState(false)

  const STEPS = ['Event Details', 'Venue & Fees', 'AI Evaluation', 'Submit']
  const stepIndex = { form: 0, venue_fee: 1, fee_payment: 1, ai_eval: 2, submitted: 3 }
  const currentStepIdx = stepIndex[step] ?? 0

  const closeModal = () => setShowCreateEventModal(false)

  const triggerAiEval = () => {
    setAiEvalProgress(0); setAiEvalDone(false)
    let count = 0
    const iv = setInterval(() => {
      count += 1; setAiEvalProgress(count)
      if (count >= 4) { clearInterval(iv); setAiEvalDone(true) }
    }, 700)
  }

  const handleVenueFeeProofUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { return }
    setVenueFeeProof(file)
    const reader = new FileReader()
    reader.onload = (ev) => setVenueFeeProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleFinalSubmit = () => {
    handleCreateEventSubmit()
    setStep('submitted')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header + Progress */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create New Event</h2>
              <p className="text-purple-100">Section 7 Â· Organizer Proposal Flow</p>
            </div>
            <button onClick={closeModal} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStepIdx ? 'bg-green-400 text-white' : i === currentStepIdx ? 'bg-white text-purple-700' : 'bg-white/20 text-white/60'}`}>
                    {i < currentStepIdx ? 'âœ“' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${i === currentStepIdx ? 'text-white font-semibold' : 'text-white/60'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStepIdx ? 'bg-green-400' : 'bg-white/20'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* â”€â”€ STEP 1: Event Details Form â”€â”€ */}
        {step === 'form' && (
          <>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
                        <input type="text" name="title" value={eventForm.title} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Enter event title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type <span className="text-red-500">*</span></label>
                        <select name="eventType" value={eventForm.eventType} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
                          <option value="academic">Academic</option><option value="sports">Sports</option><option value="cultural">Cultural</option>
                          <option value="social">Social</option><option value="workshop">Workshop</option><option value="conference">Conference</option><option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={eventForm.description} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe your event" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Date & Time</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="date" value={eventForm.date} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                        <input type="time" name="time" value={eventForm.time} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-4">Location & Capacity</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                        <input type="text" name="location" value={eventForm.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Event location" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees <span className="text-red-500">*</span></label>
                        <input type="number" name="maxAttendees" value={eventForm.maxAttendees} onChange={handleFormChange} min="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Maximum attendees" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone <span className="text-red-500">*</span></label>
                        <input type="tel" name="phoneNumber" value={eventForm.phoneNumber} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="+855 12 345 678" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-4">Pricing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                        <input type="number" name="price" value={eventForm.price} onChange={handleFormChange} min="0" step="0.01" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="0 for free event" />
                      </div>
                      {eventForm.price > 0 && eventForm.maxAttendees > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-yellow-200 text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-gray-600">Ticket Price:</span><span className="font-medium">${Number(eventForm.price).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Max Attendees:</span><span className="font-medium">{eventForm.maxAttendees}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Total Revenue:</span><span className="font-medium">${totalRevenue.toFixed(2)}</span></div>
                          <div className="flex justify-between font-semibold text-red-600"><span>Platform Fee (3%):</span><span>${platformFee.toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-4">Event Agenda</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agenda Description</label>
                    <textarea name="agenda" value={eventForm.agenda} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe the agenda, schedule, and activities..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Agenda PDF (Optional)</label>
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-white/50 hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer transition-all">
                      {eventForm.agendaPdf ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                            <div><p className="text-sm font-medium text-gray-900">{eventForm.agendaPdf.name}</p><p className="text-xs text-gray-500">{(eventForm.agendaPdf.size / 1024 / 1024).toFixed(2)} MB</p></div>
                          </div>
                          <button type="button" onClick={removePdf} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <DocumentTextIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                          <label htmlFor="agenda-pdf-upload-events" className="cursor-pointer">
                            <span className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">Click to upload PDF</span>
                            <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                            <input id="agenda-pdf-upload-events" type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} className="hidden" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-4">Requirements</h3>
                <textarea name="requirements" value={eventForm.requirements} onChange={handleFormChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Any special requirements for attendees..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm">{platformFee > 0 ? <span className="text-red-600 font-medium">Platform fee: ${platformFee.toFixed(2)}</span> : <span className="text-green-600 font-medium">Free event â€” no platform fee</span>}</span>
              <div className="flex items-center space-x-4">
                <button onClick={closeModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                <button onClick={() => setStep('venue_fee')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all">
                  Next: Venue &amp; Fees â†’
                </button>
              </div>
            </div>
          </>
        )}

        {/* â”€â”€ STEP 2: Venue / Equipment Fee Decision â”€â”€ */}
        {step === 'venue_fee' && (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            <div className="max-w-lg w-full text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">ðŸ›ï¸</span></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Venue / Equipment Fee Required?</h3>
              <p className="text-gray-500 mb-8 text-sm">Does your event require rental fees for venue space or equipment?</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => { setVenueFeeRequired(false); setStep('ai_eval'); triggerAiEval() }}
                  className="p-6 border-2 border-green-200 rounded-xl bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group">
                  <div className="text-3xl mb-2">âœ…</div>
                  <div className="font-semibold text-green-800">No Fees</div>
                  <div className="text-xs text-green-600 mt-1">Skip directly to AI Evaluation</div>
                </button>
                <button onClick={() => { setVenueFeeRequired(true); setStep('fee_payment') }}
                  className="p-6 border-2 border-amber-200 rounded-xl bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all group">
                  <div className="text-3xl mb-2">ðŸ’°</div>
                  <div className="font-semibold text-amber-800">Yes, Fees Required</div>
                  <div className="text-xs text-amber-600 mt-1">Upload payment proof first</div>
                </button>
              </div>
              <button onClick={() => setStep('form')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">â† Back to Event Details</button>
            </div>
          </div>
        )}

        {/* â”€â”€ STEP 2b: Fee Payment (upload â†’ verifying â†’ rejected/approved) â”€â”€ */}
        {step === 'fee_payment' && (
          <div className="p-6 overflow-y-auto flex-1">
            {venueFeePayStep !== 'approved' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-amber-900 mb-3">ðŸ“‹ Venue / Equipment Fee Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-100"><div className="text-lg font-bold text-amber-700">$250.00</div><div className="text-gray-500 text-xs mt-1">Rental / Equipment Fee</div></div>
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-100"><div className="text-base font-semibold text-amber-700">ABA / Bank Transfer</div><div className="text-gray-500 text-xs mt-1">Payment Method</div></div>
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-100"><div className="text-base font-semibold text-red-600">3 Days</div><div className="text-gray-500 text-xs mt-1">Payment Deadline</div></div>
                </div>
              </div>
            )}
            {venueFeePayStep === 'upload' && (
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">Upload Payment Proof</h4>
                <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${venueFeeProofPreview ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'}`}>
                  <input type="file" accept="image/*,application/pdf" onChange={handleVenueFeeProofUpload} className="hidden" />
                  {venueFeeProofPreview
                    ? venueFeeProofPreview.startsWith('data:image')
                      ? <img src={venueFeeProofPreview} alt="proof" className="max-h-48 mx-auto rounded-lg object-contain mb-3" />
                      : <div className="flex flex-col items-center gap-2"><DocumentTextIcon className="w-12 h-12 text-green-500" /><span className="text-sm text-green-700 font-medium">{venueFeeProof?.name}</span></div>
                    : <><ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-700">Click to upload payment receipt</p><p className="text-xs text-gray-400 mt-1">Image or PDF Â· max 5 MB</p></>
                  }
                </label>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep('venue_fee')} className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all">â† Back</button>
                  <button onClick={() => { if (!venueFeeProof) return; setVenueFeePayStep('verifying') }} className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all">Submit for Verification â†’</button>
                </div>
              </div>
            )}
            {venueFeePayStep === 'verifying' && (
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-10 h-10 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Finance Team Verifying</h4>
                <p className="text-sm text-gray-500 mb-6">Your payment proof is being reviewed (1â€“3 business days).</p>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-left space-y-3 mb-6">
                  {['Checking payment amount','Validating transfer code','Duplicate payment scan','Image authenticity check'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mb-3">â€” DEMO: Simulate finance decision â€”</p>
                <div className="flex gap-3">
                  <button onClick={() => { setVenueFeeRejectionReason('Amount on receipt does not match the quoted rental fee.'); setVenueFeePayStep('rejected') }} className="flex-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-all">âœ— Reject</button>
                  <button onClick={() => setVenueFeePayStep('approved')} className="flex-1 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-all">âœ“ Approve</button>
                </div>
              </div>
            )}
            {venueFeePayStep === 'rejected' && (
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-red-600 text-lg">âœ—</span></div><h4 className="font-bold text-red-800">Payment Proof Rejected</h4></div>
                  <p className="text-sm text-red-700 mb-3">{venueFeeRejectionReason}</p>
                  <div className="bg-red-100 rounded-lg p-3 text-sm text-red-800"><p className="font-medium mb-1">Required Actions:</p><ul className="list-disc list-inside space-y-1"><li>Upload a clear, unedited bank receipt</li><li>Ensure amount matches the quoted fee</li><li>Include visible transfer reference code</li></ul></div>
                </div>
                <button onClick={() => { setVenueFeeProof(null); setVenueFeeProofPreview(null); setVenueFeePayStep('upload') }} className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all">Re-upload Proof â†’</button>
              </div>
            )}
            {venueFeePayStep === 'approved' && (
              <div className="max-w-md mx-auto text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">âœ…</span></motion.div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Venue Fee Payment Approved!</h4>
                <p className="text-sm text-gray-500 mb-6">Proceed to AI Evaluation of your event proposal.</p>
                <button onClick={() => { setStep('ai_eval'); triggerAiEval() }} className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all">Proceed to AI Evaluation â†’</button>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ STEP 3: AI Evaluation â”€â”€ */}
        {step === 'ai_eval' && (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-3xl">ðŸ¤–</span></div>
                <h3 className="text-xl font-bold text-gray-900">AI Evaluation</h3>
                <p className="text-sm text-gray-500 mt-1">Running automated checks on your event proposal...</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
                {[
                  { label: 'Event Name Uniqueness Check', desc: 'Checking for duplicate event names' },
                  { label: 'Rule Violation Scan', desc: 'Scanning for policy and rule violations' },
                  { label: 'Document Validation', desc: 'Validating agenda PDF and documents' },
                  { label: 'Policy Compliance Check', desc: 'Verifying university guidelines compliance' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500 ${i < aiEvalProgress ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {i < aiEvalProgress ? <span className="text-green-600 text-xs font-bold">âœ“</span> : i === aiEvalProgress ? <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" /> : <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors ${i < aiEvalProgress ? 'text-green-700' : i === aiEvalProgress ? 'text-indigo-700' : 'text-gray-400'}`}>{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {aiEvalDone ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center text-sm text-green-700 font-medium">âœ… All checks passed â€” your event is ready for submission!</div>
                  <button onClick={handleFinalSubmit} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold transition-all text-lg">ðŸ“‹ Submit Event Proposal</button>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    AI evaluation in progress...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ STEP 4: Submitted â€” Three Simultaneous Outcomes â”€â”€ */}
        {step === 'submitted' && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">ðŸŽ‰</span></motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Proposal Submitted!</h3>
              <p className="text-gray-500 text-sm">Your event proposal is now <span className="font-semibold text-amber-600">Pending Admin Approval</span>. Three things are happening simultaneously:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">ðŸ“‹</div>
                <h4 className="font-bold text-amber-800 mb-2">A) Admin Review</h4>
                <p className="text-xs text-amber-700">Your proposal is queued for admin review. Once approved, it will be published on the calendar.</p>
                <div className="mt-3 px-3 py-1 bg-amber-200 rounded-full text-xs font-semibold text-amber-800 inline-block">Pending Approval</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">ðŸ¤–</div>
                <h4 className="font-bold text-indigo-800 mb-2">B) AI Payment Verification</h4>
                <p className="text-xs text-indigo-700">AI is scanning receipts for duplicates, edited images, and amount discrepancies.</p>
                <div className="mt-3 px-3 py-1 bg-indigo-200 rounded-full text-xs font-semibold text-indigo-800 inline-block">Running</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">ðŸ‘¤</div>
                <h4 className="font-bold text-purple-800 mb-2">C) Stage 1 Admin Queue</h4>
                <p className="text-xs text-purple-700">Admin will check completeness, safety, policy compliance, and schedule conflicts.</p>
                <div className="mt-3 px-3 py-1 bg-purple-200 rounded-full text-xs font-semibold text-purple-800 inline-block">Queued</div>
              </motion.div>
            </div>
            <div className="text-center">
              <button onClick={closeModal} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all">View Events â†’</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
})


export default Events
