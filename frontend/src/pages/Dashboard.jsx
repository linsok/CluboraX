import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  PhotoIcon,
  FireIcon,
  TrophyIcon,
  GiftIcon,
  StarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  UsersIcon,
  QrCodeIcon,
  TicketIcon,
  XMarkIcon,
  EyeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { getDashboardStats, getRecentActivities, getUserCourses } from '../api/dashboard'
import { getUserAchievements, getUserCertificates } from '../api/courses'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showClubDetailModal, setShowClubDetailModal] = useState(false)
  const [selectedClubRequest, setSelectedClubRequest] = useState(null)
  const [showEventDetailModal, setShowEventDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Mock data for user's club requests and event registrations
  const [myClubRequests] = useState([
    {
      id: 1,
      clubName: 'Computer Science Club',
      clubCategory: 'Academic',
      status: 'pending',
      submittedAt: '2024-01-15T10:30:00Z',
      formData: {
        name: 'Thoeun Soklin',
        email: 'soklin1220lin@gmail.com',
        phone: '0977569023',
        studentId: 'ST5667',
        major: 'Computer Science',
        year: 'Junior',
        message: 'I am very interested in joining the Computer Science Club to learn more about programming and participate in hackathons.'
      }
    },
    {
      id: 2,
      clubName: 'Photography Club',
      clubCategory: 'Arts',
      status: 'approved',
      submittedAt: '2024-01-10T14:15:00Z',
      formData: {
        name: 'Thoeun Soklin',
        email: 'soklin1220lin@gmail.com',
        phone: '0977569023',
        studentId: 'ST5667',
        major: 'Computer Science',
        year: 'Junior',
        message: 'I love photography and would like to learn more about camera techniques and photo editing.'
      }
    }
  ])

  const [myEventRegistrations] = useState([
    {
      id: 1,
      eventName: 'Tech Innovation Summit 2024',
      eventDate: '2024-03-15',
      eventTime: '09:00 AM',
      eventLocation: 'Main Auditorium',
      eventPrice: 0,
      status: 'confirmed',
      registeredAt: '2024-01-12T16:45:00Z',
      ticketId: 'TKT-1-1705123456789-ABC123',
      qrCodeData: JSON.stringify({
        ticketId: 'TKT-1-1705123456789-ABC123',
        eventId: 1,
        userEmail: 'soklin1220lin@gmail.com',
        userName: 'Thoeun Soklin',
        eventDate: '2024-03-15',
        eventTime: '09:00 AM'
      }),
      formData: {
        name: 'Thoeun Soklin',
        email: 'soklin1220lin@gmail.com',
        phone: '0977569023',
        studentId: 'ST5667',
        notes: 'Looking forward to attending this tech summit!'
      }
    },
    {
      id: 2,
      eventName: 'Spring Music Festival',
      eventDate: '2024-03-20',
      eventTime: '06:00 PM',
      eventLocation: 'Campus Grounds',
      eventPrice: 15,
      status: 'confirmed',
      registeredAt: '2024-01-08T11:20:00Z',
      ticketId: 'TKT-2-1704704000123-XYZ789',
      qrCodeData: JSON.stringify({
        ticketId: 'TKT-2-1704704000123-XYZ789',
        eventId: 2,
        userEmail: 'soklin1220lin@gmail.com',
        userName: 'Thoeun Soklin',
        eventDate: '2024-03-20',
        eventTime: '06:00 PM'
      }),
      formData: {
        name: 'Thoeun Soklin',
        email: 'soklin1220lin@gmail.com',
        phone: '0977569023',
        studentId: 'ST5667',
        notes: 'Excited for the music festival!'
      }
    }
  ])
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: getRecentActivities,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-courses'],
    queryFn: getUserCourses,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: getUserAchievements,
    retry: 2,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })

  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['user-certificates'],
    queryFn: getUserCertificates,
    retry: 2,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })

  const isLoading = statsLoading || activitiesLoading || coursesLoading || achievementsLoading || certificatesLoading

  if (statsError) {
    console.error('Dashboard error:', statsError)
  }

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} shadow-md group-hover:shadow-lg transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
              {trendValue}
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  )

  const CourseCard = ({ course, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden group cursor-pointer"
    >
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {course.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {course.level}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{course.instructor}</p>
        
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
          <span>{course.duration}</span>
        </div>
      </div>
    </motion.div>
  )

  const ActivityItem = ({ activity }) => {
    // Map icon string to actual icon component
    const getIcon = (iconName) => {
      switch (iconName) {
        case 'CalendarIcon':
          return CalendarIcon
        case 'UserGroupIcon':
          return UserGroupIcon
        case 'UsersIcon':
          return UsersIcon
        default:
          return CalendarIcon
      }
    }

    const Icon = getIcon(activity.icon)
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 5 }}
        transition={{ duration: 0.3 }}
        className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 group"
      >
        <div className="relative">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{activity.user}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity.time}</span>
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    )
  }

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const viewTicket = (registration) => {
    setSelectedTicket(registration)
    setShowTicketModal(true)
  }

  const downloadTicket = (ticket) => {
    // Create a canvas element to generate the ticket
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = 400
    canvas.height = 600
    
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Header background
    const gradient = ctx.createLinearGradient(0, 0, 0, 120)
    gradient.addColorStop(0, '#059669')
    gradient.addColorStop(1, '#10b981')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, 120)
    
    // Header text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Event Ticket', canvas.width / 2, 40)
    
    ctx.font = '18px Arial'
    ctx.fillText(ticket.eventName, canvas.width / 2, 70)
    
    // Ticket ID
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.fillText(`Ticket ID: ${ticket.ticketId}`, canvas.width / 2, 100)
    
    // QR Code placeholder
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(50, 140, 120, 120)
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('QR Code', 110, 195)
    ctx.fillText(ticket.ticketId.substring(0, 8) + '...', 110, 210)
    
    // Event details section
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Event Details', 200, 160)
    
    ctx.font = '14px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Event:', 200, 185)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.eventName, 200, 205)
    
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Date:', 200, 230)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.eventDate, 200, 250)
    
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Time:', 200, 275)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.eventTime, 200, 295)
    
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Location:', 200, 320)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.eventLocation, 200, 340)
    
    // Attendee section
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('Attendee Information', 50, 300)
    
    ctx.font = '14px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Name:', 50, 325)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.formData.name, 50, 345)
    
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Email:', 50, 370)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.formData.email, 50, 390)
    
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Student ID:', 50, 415)
    ctx.fillStyle = '#1f2937'
    ctx.fillText(ticket.formData.studentId || 'N/A', 50, 435)
    
    // Price
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(ticket.eventPrice > 0 ? `$${ticket.eventPrice}` : 'Free', canvas.width / 2, 480)
    
    // Footer
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.fillText('Generated on ' + new Date().toLocaleDateString(), canvas.width / 2, 520)
    ctx.fillText('CluboraX - Campus Event Management', canvas.width / 2, 540)
    
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${ticket.ticketId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Ticket downloaded successfully!')
    }, 'image/png')
  }

  const viewClubDetails = (request) => {
    setSelectedClubRequest(request)
    setShowClubDetailModal(true)
  }

  const viewEvent = (registration) => {
    // Create event object from registration data
    const event = {
      id: registration.id,
      title: registration.eventName,
      date: registration.eventDate,
      time: registration.eventTime,
      location: registration.eventLocation,
      price: registration.eventPrice,
      description: 'Join us for an exciting event filled with learning, networking, and fun activities. This event promises to be an unforgettable experience for all attendees.',
      longDescription: `${registration.eventName} is a premier campus event designed to bring together students, faculty, and industry professionals for a day of learning, networking, and entertainment. Whether you\'re looking to expand your knowledge, meet new people, or simply have a great time, this event has something for everyone. Don\'t miss out on this opportunity to be part of something special!`,
      organizer: 'Campus Activities Department',
      category: 'Campus Event',
      maxAttendees: 500,
      currentAttendees: 150 + Math.floor(Math.random() * 100),
      image: '/api/placeholder/400/200',
      tags: ['Technology', 'Networking', 'Learning', 'Entertainment'],
      requirements: 'Open to all students and faculty. Registration is required.',
      agenda: [
        { time: '09:00 AM', title: 'Registration & Welcome Coffee' },
        { time: '10:00 AM', title: 'Opening Keynote' },
        { time: '11:00 AM', title: 'Workshop Sessions' },
        { time: '01:00 PM', title: 'Networking Lunch' },
        { time: '02:30 PM', title: 'Panel Discussion' },
        { time: '04:00 PM', title: 'Closing Remarks' }
      ]
    }
    setSelectedEvent(event)
    setShowEventDetailModal(true)
  }

  // Club Request Card Component
  const ClubRequestCard = ({ request }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.clubName}</h3>
          <p className="text-sm text-gray-500">{request.clubCategory}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="w-4 h-4 mr-2" />
          {request.formData.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <BuildingOfficeIcon className="w-4 h-4 mr-2" />
          {request.formData.studentId}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-2" />
          Submitted: {formatDate(request.submittedAt)}
        </div>
      </div>

      {request.formData.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{request.formData.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Year: {request.formData.year} • Major: {request.formData.major}
        </span>
        <button 
          onClick={() => viewClubDetails(request)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details
        </button>
      </div>
    </motion.div>
  )

  // Event Registration Card Component
  const EventRegistrationCard = ({ registration }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{registration.eventName}</h3>
          <p className="text-sm text-gray-500">
            {registration.eventDate} at {registration.eventTime}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
          {registration.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {registration.eventLocation}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <TicketIcon className="w-4 h-4 mr-2" />
          Ticket ID: {registration.ticketId}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-2" />
          Registered: {formatDate(registration.registeredAt)}
        </div>
      </div>

      {registration.formData.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{registration.formData.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {registration.eventPrice > 0 ? `$${registration.eventPrice}` : 'Free'}
        </span>
        <div className="flex space-x-2">
          <button 
            onClick={() => viewEvent(registration)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <EyeIcon className="w-4 h-4" />
            View Event
          </button>
          <button 
            onClick={() => viewTicket(registration)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <QrCodeIcon className="w-4 h-4" />
            View Ticket
          </button>
        </div>
      </div>
    </motion.div>
  )

  // Ticket Modal Component
  const TicketModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowTicketModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Event Ticket</h2>
              <p className="text-green-100">{selectedTicket?.eventName}</p>
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
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCodeIcon className="w-16 h-16 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedTicket?.ticketId?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Ticket Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Ticket ID:</span>
                <span className="text-gray-900">{selectedTicket?.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Event:</span>
                <span className="text-gray-900">{selectedTicket?.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-900">{selectedTicket?.eventDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Time:</span>
                <span className="text-gray-900">{selectedTicket?.eventTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Location:</span>
                <span className="text-gray-900">{selectedTicket?.eventLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Attendee:</span>
                <span className="text-gray-900">{selectedTicket?.formData.name}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowTicketModal(false)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => downloadTicket(selectedTicket)}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
            >
              <TicketIcon className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  // Club Request Detail Modal
  const ClubRequestDetailModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowClubDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Club Request Details</h2>
              <p className="text-purple-100">{selectedClubRequest?.clubName}</p>
            </div>
            <button
              onClick={() => setShowClubDetailModal(false)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Request Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClubRequest?.status)}`}>
              {selectedClubRequest?.status}
            </span>
          </div>

          {/* Club Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Club Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Club Name:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.clubName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.clubCategory}</span>
              </div>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Applicant Information</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Student ID:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Major:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.major}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium text-gray-900">{selectedClubRequest?.formData.year}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          {selectedClubRequest?.formData.message && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Application Message</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedClubRequest?.formData.message}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Request Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Request Submitted</p>
                  <p className="text-gray-600">{formatDate(selectedClubRequest?.submittedAt)}</p>
                </div>
              </div>
              {selectedClubRequest?.status === 'approved' && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Request Approved</p>
                    <p className="text-gray-600">Your membership has been approved!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about your club request, feel free to contact the club administration or the campus activities office.
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Contact Club
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Email Support
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => setShowClubDetailModal(false)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium"
            >
              Print Details
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  // Event Detail Modal
  const EventDetailModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowEventDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">{selectedEvent?.title}</h2>
              <p className="text-blue-100">{selectedEvent?.category}</p>
            </div>
            <button
              onClick={() => setShowEventDetailModal(false)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h3>
            <p className="text-gray-600 leading-relaxed">{selectedEvent?.longDescription}</p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Event Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">
                    {selectedEvent?.price > 0 ? `$${selectedEvent?.price}` : 'Free'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-3">Attendance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.currentAttendees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maximum:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.maxAttendees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organizer:</span>
                  <span className="font-medium text-gray-900">{selectedEvent?.organizer}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {selectedEvent?.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Agenda */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Event Agenda</h4>
            <div className="space-y-3">
              {selectedEvent?.agenda.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
            <p className="text-sm text-gray-600">{selectedEvent?.requirements}</p>
          </div>

          {/* Registration Status */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Your Registration Status</h4>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">You are registered for this event</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Your ticket has been generated and is ready for download.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => setShowEventDetailModal(false)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowEventDetailModal(false)
                // Find and view the ticket for this event
                const ticket = myEventRegistrations.find(reg => reg.id === selectedEvent?.id)
                if (ticket) viewTicket(ticket)
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
            >
              <TicketIcon className="w-5 h-5" />
              View Ticket
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-ping opacity-20" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading Campus Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CluboraX</h1>
                <p className="text-gray-600">Your comprehensive campus learning and activity platform</p>
              </div>
              <div className="flex items-center space-x-4">
                {stats?.systemHealth?.status === 'healthy' ? (
                  <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">System Healthy</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">System Issues</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-2"
          >
            <div className="flex space-x-1">
              {['overview', 'my-clubs', 'my-events'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'my-clubs' && 'My Clubs'}
                  {tab === 'my-events' && 'My Events'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  icon={UsersIcon}
                  color="bg-gradient-to-r from-blue-500 to-blue-600"
                  trend="up"
                  trendValue="+12%"
                  description="Registered students"
                />
                <StatCard
                  title="Active Courses"
                  value={stats?.totalEvents || 0}
                  icon={BookOpenIcon}
                  color="bg-gradient-to-r from-purple-500 to-purple-600"
                  trend="up"
                  trendValue="+15%"
                  description="Available courses"
                />
                <StatCard
                  title="Total Clubs"
                  value={stats?.totalClubs || 0}
                  icon={UserGroupIcon}
                  color="bg-gradient-to-r from-green-500 to-green-600"
                  trend="up"
                  trendValue="+5%"
                  description="Student organizations"
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Courses Section */}
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Your Courses</h2>
                        <p className="text-gray-600 mt-1">Continue your learning journey</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        View All
                      </button>
                    </div>
                    <div className="space-y-6">
                      {coursesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : courses?.length > 0 ? (
                        courses?.map((course, index) => (
                          <CourseCard key={course.id} course={course} index={index} />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                          <p className="text-gray-500">Start exploring events and clubs to see them here!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Recent Activities */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                      <BellIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      {activitiesLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg animate-pulse">
                              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : recentActivities?.length > 0 ? (
                        recentActivities?.map((activity, index) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <button className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Create Event</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                        <UserGroupIcon className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Start Club</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <PhotoIcon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Upload Photos</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          )}

          {/* My Clubs Tab Content */}
          {activeTab === 'my-clubs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Club Requests</h2>
                <p className="text-gray-600">Track your club membership applications and status</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClubRequests.length > 0 ? (
                  myClubRequests.map((request) => (
                    <ClubRequestCard key={request.id} request={request} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No club requests yet</h3>
                    <p className="text-gray-500">Browse clubs and submit your membership requests!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* My Events Tab Content */}
          {activeTab === 'my-events' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Event Registrations</h2>
                <p className="text-gray-600">View your event tickets and registration details</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEventRegistrations.length > 0 ? (
                  myEventRegistrations.map((registration) => (
                    <EventRegistrationCard key={registration.id} registration={registration} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No event registrations yet</h3>
                    <p className="text-gray-500">Browse events and register to get your tickets!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && <TicketModal />}
      
      {/* Club Request Detail Modal */}
      {showClubDetailModal && <ClubRequestDetailModal />}
      
      {/* Event Detail Modal */}
      {showEventDetailModal && <EventDetailModal />}
    </div>
  )
}

export default Dashboard
