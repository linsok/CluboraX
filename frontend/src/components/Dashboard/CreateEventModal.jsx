import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { createEventProposal } from '../../api/proposals'
import { apiClient } from '../../api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import {
  XMarkIcon,
  CalendarIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TagIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PhotoIcon,
  PlusIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'


// ── Section 7: Create Event Modal (module-level, React.memo — prevents flicker) ──
const CreateEventModal = React.memo(({
  eventForm, handleFormChange, handlePdfUpload, removePdf,
  calculatePlatformFee, setEventForm, setShowCreateEventModal, user
}) => {
  const queryClient = useQueryClient()

  // Local multi-step state
  const [createEventStep, setCreateEventStep] = React.useState('form')
  const [aiEvalProgress, setAiEvalProgress] = React.useState(0)
  const [aiEvalDone, setAiEvalDone] = React.useState(false)
  const [paymentProof, setPaymentProof] = React.useState(null)
  const [eventPosterPreview, setEventPosterPreview] = React.useState(null)

  const isPaidEvent = Number(eventForm.price) > 0
  const platformFee = calculatePlatformFee()
  const totalRevenue = Number(eventForm.price) * Number(eventForm.maxAttendees)

  // Fetch Telegram Connect Link for organizers
  const { data: telegramLinkData } = useQuery({
    queryKey: ['telegram-connect-link'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/notifications/telegram/connect-link/')
        return res.data
      } catch (err) {
        console.error('Failed to get Telegram link', err)
        return null
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Progress bar steps — 4 steps: form, payment, AI eval, submit
  const STEPS = isPaidEvent ? ['Event Details', 'Payment', 'AI Evaluation', 'Submit'] : ['Event Details', 'AI Evaluation', 'Submit']
  const stepIndex = isPaidEvent ? { form: 0, payment: 1, ai_eval: 2, submitted: 3 } : { form: 0, ai_eval: 1, submitted: 2 }
  const currentStepIdx = stepIndex[createEventStep] ?? 0

  const closeCreateEventModal = React.useCallback(() => {
    setShowCreateEventModal(false)
    setCreateEventStep('form')
    setAiEvalProgress(0)
    setAiEvalDone(false)
    setPaymentProof(null)
    setEventPosterPreview(null)
  }, [setShowCreateEventModal])

  const triggerAiEval = React.useCallback(() => {
    setAiEvalProgress(0)
    setAiEvalDone(false)
    let count = 0
    const iv = setInterval(() => {
      count += 1
      setAiEvalProgress(count)
      if (count >= 4) { clearInterval(iv); setAiEvalDone(true) }
    }, 700)
  }, [])

  const handleCreateEvent = React.useCallback(() => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location || !eventForm.maxAttendees || !eventForm.phoneNumber) {
      toast.error('Please fill in all required fields')
      return
    }
    // If paid event, go to payment step first, otherwise go to AI eval
    if (isPaidEvent) {
      setCreateEventStep('payment')
    } else {
      setCreateEventStep('ai_eval')
      triggerAiEval()
    }
  }, [eventForm, triggerAiEval, isPaidEvent])

  const handlePaymentProofUpload = React.useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (image only)
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setPaymentProof(file)
      toast.success('Payment proof uploaded')
    }
  }, [])

  const removePaymentProof = React.useCallback(() => {
    setPaymentProof(null)
  }, [])

  const handleProceedToAiEval = React.useCallback(() => {
    if (!paymentProof) {
      toast.error('Please upload payment proof to continue')
      return
    }
    setCreateEventStep('ai_eval')
    triggerAiEval()
  }, [paymentProof, triggerAiEval])

  const handleSubmitEventProposal = React.useCallback(async () => {
    const fee = calculatePlatformFee()
    
    // Map frontend form fields to backend EventProposal model fields
    const proposalData = {
      title: eventForm.title,
      eventTitle: eventForm.title,
      description: eventForm.description || '',
      event_type: eventForm.eventType || 'academic',
      eventType: eventForm.eventType || 'academic',
      eventDate: eventForm.date, // Single day event
      event_time: eventForm.time || '',
      eventTime: eventForm.time || '',
      eventDurationDays: 1, // Default to single day
      venue: eventForm.location,
      specificLocation: eventForm.location,
      capacity: parseInt(eventForm.maxAttendees) || 0,
      expected_participants: parseInt(eventForm.maxAttendees) || 0,
      ticketPrice: parseFloat(eventForm.price) || 0,
      budget: parseFloat(eventForm.price) || 0,
      organizerName: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Unknown',
      organizerEmail: user?.email || '',
      organizerPhone: eventForm.phoneNumber || '',
      agenda_description: eventForm.agenda || '',
      agenda: eventForm.agenda || '',
      special_requirements: eventForm.requirements || '',
      requirements: eventForm.requirements || '',
      status: isPaidEvent ? 'pending_payment' : 'pending_review',
      payment_status: isPaidEvent ? 'pending' : 'not_required',
      platform_fee_receipt: paymentProof,
      event_poster: eventForm.posterImage,
      agenda_pdf: eventForm.agendaPdf,
    }
    
    try {
      await createEventProposal(proposalData)
      toast.success('Event proposal submitted! Pending admin approval.')
      queryClient.invalidateQueries(['my-event-proposals'])
      queryClient.invalidateQueries(['events'])
    } catch (error) {
      console.error('Failed to submit proposal:', error)
      toast.error('Failed to submit event proposal. Please try again.')
      return // Don't proceed to submitted step if it failed
    }
    setCreateEventStep('submitted')
    setEventForm({
      title: '', date: '', time: '', agenda: '', agendaPdf: null,
      location: '', eventType: 'academic', maxAttendees: '', phoneNumber: '',
      price: 0, description: '', organizer: user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user?.name || 'Event Organizer',
      requirements: '', tags: []
    })
  }, [eventForm, calculatePlatformFee, setEventForm, user, queryClient, paymentProof, isPaidEvent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeCreateEventModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create Event Proposal</h2>
              <p className="text-purple-100">Section 7 · Organizer Proposal Flow</p>
            </div>
            <button onClick={closeCreateEventModal} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStepIdx ? 'bg-green-400 text-white' : i === currentStepIdx ? 'bg-white text-purple-700' : 'bg-white/20 text-white/60'}`}>
                    {i < currentStepIdx ? '' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${i === currentStepIdx ? 'text-white font-semibold' : 'text-white/60'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStepIdx ? 'bg-green-400' : 'bg-white/20'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ STEP 1 — Event Details Form ══ */}
        {createEventStep === 'form' && (
          <>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
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
                          <option value="academic">Academic</option>
                          <option value="sports">Sports</option>
                          <option value="cultural">Cultural</option>
                          <option value="social">Social</option>
                          <option value="workshop">Workshop</option>
                          <option value="conference">Conference</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={eventForm.description} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe your event" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Date &amp; Time</h3>
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
                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-4">Location &amp; Capacity</h3>
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
                    <textarea name="agenda" value={eventForm.agenda} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe the agenda, schedule and activities..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Agenda PDF (Optional)</label>
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-white/50 hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer transition-all">
                      {eventForm.agendaPdf ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{eventForm.agendaPdf.name}</p>
                              <p className="text-xs text-gray-500">{(eventForm.agendaPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" onClick={removePdf} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <DocumentTextIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                          <label htmlFor="agenda-pdf-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">Click to upload PDF</span>
                            <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                            <input id="agenda-pdf-upload" type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} className="hidden" />
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
              
              {/* Event Poster/Profile Image Upload */}
              <div className="mt-6 bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-4 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Event Poster / Profile Image
                </h3>
                <p className="text-sm text-gray-600 mb-3">Upload a poster or profile image for your event (recommended: 1200x800px)</p>
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-white/50 hover:border-pink-400 hover:bg-pink-100/50 cursor-pointer transition-all">
                  {eventForm.posterImage && eventPosterPreview ? (
                    <div className="space-y-3">
                      <img src={eventPosterPreview} alt="Event poster preview" className="w-full h-48 object-cover rounded-lg" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="w-8 h-8 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{eventForm.posterImage.name}</p>
                            <p className="text-xs text-gray-500">{(eventForm.posterImage.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEventForm({...eventForm, posterImage: null})
                            setEventPosterPreview(null)
                          }} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                      <label htmlFor="event-poster-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">Click to upload image</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF - max 5MB</p>
                        <input 
                          id="event-poster-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be less than 5MB')
                                return
                              }
                              setEventForm({...eventForm, posterImage: file})
                              // Create data URL preview
                              const reader = new FileReader()
                              reader.onload = (e) => setEventPosterPreview(e.target.result)
                              reader.readAsDataURL(file)
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-red-600 font-medium">{platformFee > 0 ? `Platform fee: $${platformFee.toFixed(2)}` : <span className="text-green-600">Free event — no platform fee</span>}</span>
              <div className="flex items-center space-x-4">
                <button onClick={closeCreateEventModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                <button onClick={handleCreateEvent} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all flex items-center gap-2">
                  {isPaidEvent ? 'Next: Payment ' : 'Next: AI Evaluation '}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ STEP 2 — Payment (Paid Events Only) ══ */}
        {createEventStep === 'payment' && isPaidEvent && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Fee Payment Required</h3>
                <p className="text-gray-600">Your event has a ticket price, so a platform fee is required before submission</p>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Fee Calculation Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Ticket Price:</span>
                    <span className="text-lg font-bold text-gray-900">${Number(eventForm.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Max Attendees:</span>
                    <span className="text-lg font-bold text-gray-900">{eventForm.maxAttendees}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Total Revenue:</span>
                    <span className="text-lg font-bold text-green-600">${totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4">
                    <span className="text-gray-900 font-bold text-lg">Platform Fee (3%):</span>
                    <span className="text-2xl font-bold text-red-600">${platformFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How to Pay Platform Fee
                </h4>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <ol className="space-y-3 text-sm text-blue-900 flex-1 mt-1">
                    <li className="flex items-start gap-2">
                      <span className="font-bold min-w-[20px]">1.</span>
                      <span>Scan the QR code or transfer <strong className="text-red-600">${platformFee.toFixed(2)}</strong> to our payment account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold min-w-[20px]">2.</span>
                      <span>Take a screenshot or photo of your payment confirmation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold min-w-[20px]">3.</span>
                      <span>Upload the payment proof below</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold min-w-[20px]">4.</span>
                      <span>Click "Continue to AI Evaluation" to proceed</span>
                    </li>
                  </ol>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col items-center shrink-0">
                    <div className="w-32 h-32 bg-white flex items-center justify-center mb-2">
                      <QRCode value="ABA_PAY_ADMIN_PLATFORM_FEE_123456789" size={128} level="H" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">Scan to Pay</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Upload */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Upload Payment Proof <span className="text-red-500">*</span>
                </label>
                {paymentProof ? (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{paymentProof.name}</p>
                          <p className="text-sm text-gray-500">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removePaymentProof}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label htmlFor="payment-proof-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-purple-600 hover:text-purple-700">Click to upload payment proof</span>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                      <input
                        id="payment-proof-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {paymentProof && telegramLinkData && (
                  telegramLinkData.is_linked ? (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-2 text-left w-full">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-xs text-green-800 font-medium">You are connected to our Telegram bot. We will send you updates on this event proposal there!</p>
                      </div>
                      <a 
                        href={telegramLinkData.connect_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc] text-white text-xs font-bold rounded hover:bg-[#0077b3] transition-colors self-start"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                        Open Telegram Bot
                      </a>
                    </div>
                  ) : (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-bold text-blue-900 text-sm mb-1">Get Approval Notifications Instantly</h5>
                        <p className="text-sm text-blue-800 mb-2">
                          Connect to our Telegram bot to receive an immediate notification when the admin approves or rejects this event proposal.
                        </p>
                        <a 
                          href={telegramLinkData.connect_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white text-sm font-bold rounded hover:bg-[#0077b3] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                          Join Telegram Bot
                        </a>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="max-w-2xl mx-auto mt-6 flex items-center justify-between">
              <button
                onClick={() => setCreateEventStep('form')}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
              >
                 Back to Form
              </button>
              <button
                onClick={handleProceedToAiEval}
                disabled={!paymentProof}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to AI Evaluation 
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3/4 — AI Evaluation ══ */}
        {createEventStep === 'ai_eval' && (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SparklesIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI Evaluation</h3>
                <p className="text-sm text-gray-500 mt-1">Running automated checks on your event proposal...</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
                {[
                  { label: 'Event Name Uniqueness Check', desc: 'Checking for duplicate event names in the system' },
                  { label: 'Rule Violation Scan', desc: 'Scanning for policy and campus rule violations' },
                  { label: 'Document Validation', desc: 'Validating agenda PDF and uploaded documents' },
                  { label: 'Policy Compliance Check', desc: 'Verifying event complies with university guidelines' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500 ${i < aiEvalProgress ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {i < aiEvalProgress
                        ? <span className="text-green-600 text-xs font-bold"></span>
                        : i === aiEvalProgress
                          ? <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                          : <div className="w-3 h-3 bg-gray-300 rounded-full" />}
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center text-sm text-green-700 font-medium">
                    All checks passed — your event is ready for submission!
                  </div>
                  <button onClick={handleSubmitEventProposal} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold transition-all text-lg">
                    Submit Event Proposal
                  </button>
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

        {/* ══ STEP 3 — Submitted ══ */}
        {createEventStep === 'submitted' && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-purple-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Proposal Submitted!</h3>
              <p className="text-gray-500 text-sm">Your event proposal is now <span className="font-semibold text-amber-600">Pending Admin Approval</span>. Three things are now happening simultaneously:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardDocumentListIcon className="w-5 h-5 text-amber-700" /></div>
                <h4 className="font-bold text-amber-800 mb-2">A) Admin Review</h4>
                <p className="text-xs text-amber-700">Your event proposal has been queued for admin review. Once approved, it will be published on the calendar.</p>
                <div className="mt-3 px-3 py-1 bg-amber-200 rounded-full text-xs font-semibold text-amber-800 inline-block">Pending Approval</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mx-auto mb-3"><SparklesIcon className="w-5 h-5 text-indigo-700" /></div>
                <h4 className="font-bold text-indigo-800 mb-2">B) AI Payment Verification</h4>
                <p className="text-xs text-indigo-700">AI is scanning submitted receipts for duplicate payments, edited images, and amount discrepancies.</p>
                <div className="mt-3 px-3 py-1 bg-indigo-200 rounded-full text-xs font-semibold text-indigo-800 inline-block">Running</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3"><UserGroupIcon className="w-5 h-5 text-purple-700" /></div>
                <h4 className="font-bold text-purple-800 mb-2">C) Stage 1 Admin Queue</h4>
                <p className="text-xs text-purple-700">Admin will check form completeness, safety, policy compliance, and conflict of schedule before final approval.</p>
                <div className="mt-3 px-3 py-1 bg-purple-200 rounded-full text-xs font-semibold text-purple-800 inline-block">Queued</div>
              </motion.div>
            </div>
            <div className="text-center">
              <button onClick={closeCreateEventModal} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all">
                View My Events 
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
})
CreateEventModal.displayName = 'CreateEventModal'


export default CreateEventModal
