import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
  ExclamationTriangleIcon,
  UserGroupIcon as UserGroupSolidIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

// Import QR Code with fallback
let QRCode = null
try {
  QRCode = require('react-qr-code').default
} catch (error) {
  console.warn('QR Code library not available, using fallback')
  QRCode = null
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

const Events = () => {
  const { user } = useAuth()
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
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    notes: ''
  })

  const handleCreateEvent = () => {
    // Check if user is a student
    if (user?.role === 'student') {
      setShowOrganizerModal(true)
    } else {
      // If user is not a student (organizer or admin), allow event creation
      toast.success('Event creation form would open here')
      // TODO: Navigate to event creation form
    }
  }

  const handleRegisterAsOrganizer = () => {
    // Navigate to organizer registration page
    setShowOrganizerModal(false)
    navigate('/register?role=organizer')
    toast.success('Redirecting to Organizer Registration...')
  }

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', { searchTerm, filterStatus, filterType }],
    queryFn: () => {
      // This would fetch events from API
      return [
        {
          id: 1,
          title: 'Tech Innovation Summit 2024',
          description: 'Join us for an exciting day of technology showcases, workshops, and networking opportunities with industry leaders.',
          date: '2024-03-15',
          time: '09:00 AM',
          location: 'Main Auditorium',
          type: 'conference',
          status: 'approved',
          maxAttendees: 500,
          currentAttendees: 234,
          price: 0,
          image: 'https://images.unsplash.com/photo-1540575498872-042c504ba367?w=800',
          organizer: {
            name: 'Tech Club',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
          },
          tags: ['technology', 'innovation', 'networking']
        },
        {
          id: 2,
          title: 'Spring Music Festival',
          description: 'A celebration of musical talent featuring student bands, solo artists, and special performances.',
          date: '2024-03-20',
          time: '06:00 PM',
          location: 'Campus Grounds',
          type: 'entertainment',
          status: 'approved',
          maxAttendees: 1000,
          currentAttendees: 789,
          price: 15,
          image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
          organizer: {
            name: 'Music Society',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332f1c0?w=100'
          },
          tags: ['music', 'festival', 'entertainment']
        },
        {
          id: 3,
          title: 'Career Development Workshop',
          description: 'Enhance your professional skills with resume building, interview techniques, and career planning.',
          date: '2024-03-18',
          time: '02:00 PM',
          location: 'Room 203, Business Building',
          type: 'workshop',
          status: 'pending_approval',
          maxAttendees: 50,
          currentAttendees: 0,
          price: 0,
          image: 'https://images.unsplash.com/photo-1515187029135-18e286b8b6b8?w=800',
          organizer: {
            name: 'Career Services',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
          },
          tags: ['career', 'workshop', 'professional']
        }
      ]
    },
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending_approval':
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
        return '🎯'
      case 'workshop':
        return '🛠️'
      case 'entertainment':
        return '🎭'
      case 'sports':
        return '⚽'
      default:
        return '📅'
    }
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setIsRegistered(false)
    setIsLiked(false)
  }

  const handleRegister = () => {
    if (selectedEvent.status !== 'approved') {
      toast.error('This event is not yet approved for registration')
      return
    }
    
    if (selectedEvent.currentAttendees >= selectedEvent.maxAttendees) {
      toast.error('This event is already full')
      return
    }
    
    // Show registration form instead of immediate registration
    setShowRegisterForm(true)
  }

  const handleRegistrationChange = useCallback((e) => {
    const { name, value } = e.target
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const handleRegistrationSubmit = useCallback((e) => {
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
    
    // Generate unique ticket ID
    const ticketId = `TKT-${selectedEvent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Create ticket data
    const ticket = {
      id: ticketId,
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
        ticketId: ticketId,
        eventId: selectedEvent.id,
        userEmail: registrationData.email,
        userName: registrationData.name,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time
      })
    }
    
    // Simulate registration
    setIsRegistered(true)
    selectedEvent.currentAttendees += 1
    toast.success('Successfully registered for the event!')
    
    // Set ticket data and show ticket modal
    setTicketData(ticket)
    setShowTicketModal(true)
    
    // Reset form and close registration form
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      studentId: '',
      notes: ''
    })
    setShowRegisterForm(false)
  }, [registrationData, selectedEvent, setIsRegistered, setTicketData, setShowTicketModal, setRegistrationData, setShowRegisterForm])

  // Create a completely stable form component
const StableRegistrationForm = React.memo(({ registrationData, onChange, onSubmit, selectedEvent, onClose }) => (
  <form onSubmit={onSubmit} className="p-6 space-y-6">
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter your full name"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={registrationData.email}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter your email"
          required
        />
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
))

  const RegistrationFormModal = () => (
    <AnimatePresence>
      {showRegisterForm && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRegisterForm(false)}
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
                    onClick={() => setShowRegisterForm(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Use the stable form component */}
              <StableRegistrationForm 
                registrationData={registrationData}
                onChange={handleRegistrationChange}
                onSubmit={handleRegistrationSubmit}
                selectedEvent={selectedEvent}
                onClose={() => setShowRegisterForm(false)}
              />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

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
    setTicketData(null)
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      studentId: '',
      notes: ''
    })
  }

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
                      {selectedEvent.status.replace('_', ' ').toUpperCase()}
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
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLike}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      {isLiked ? (
                        <HeartSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                      <span className="font-medium">{isLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors">
                      <EyeIcon className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleRegister}
                    disabled={isRegistered || selectedEvent.status !== 'approved' || selectedEvent.currentAttendees >= selectedEvent.maxAttendees}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isRegistered
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : selectedEvent.status !== 'approved'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedEvent.currentAttendees >= selectedEvent.maxAttendees
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    }`}
                  >
                    {isRegistered ? (
                      <span className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Registered</span>
                      </span>
                    ) : selectedEvent.status !== 'approved' ? (
                      'Not Available'
                    ) : selectedEvent.currentAttendees >= selectedEvent.maxAttendees ? (
                      'Event Full'
                    ) : (
                      'Register Now'
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

  const EventCard = ({ event, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => handleEventClick(event)}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-2xl">{getTypeIcon(event.type)}</span>
          </div>
        </div>
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
          {event.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-3">
              {event.description}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleLike()
            }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-300"
          >
            <HeartIcon className="w-5 h-5" />
          </button>
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
            <span className="text-sm">{event.currentAttendees}/{event.maxAttendees} attending</span>
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
        <div className="flex items-center justify-between">
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Events</h1>
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

              <button 
                onClick={handleCreateEvent}
                className="btn-primary text-sm px-4 py-1.5"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events?.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal />
      
      {/* Registration Form Modal */}
      <RegistrationFormModal />
      
      {/* Ticket Modal */}
      <TicketModal />
      
      {/* Organizer Registration Modal */}
      <OrganizerRegistrationModal />
    </div>
  )
}

export default Events
