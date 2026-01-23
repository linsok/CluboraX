import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showClubDetailModal, setShowClubDetailModal] = useState(false)
  const [selectedClubRequest, setSelectedClubRequest] = useState(null)
  const [showEventDetailModal, setShowEventDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false)
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  
  // State for event creation form
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
  
  // Check if user is organizer
  const isOrganizer = user?.role === 'organizer'
  
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
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      if (!user) return null
      try {
        return await getDashboardStats(user)
      } catch (error) {
        console.warn('Dashboard stats API error, using fallback data:', error.message)
        // Return fallback data when API fails
        return {
          myEvents: user?.role === 'organizer' ? 5 : 0,
          totalUsers: user?.role === 'organizer' ? 1247 : 0,
          myRegistrations: user?.role === 'student' ? 3 : 0,
          totalAttendees: 245,
          revenue: user?.role === 'organizer' ? 1250 : 0
        }
      }
    },
    enabled: !!user, // Only run query if user exists
    retry: 1, // Reduce retries to avoid spamming failing APIs
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      // Don't show toast for expected API errors, just log
      console.warn('Dashboard stats temporarily unavailable')
    }
  })

  const { data: recentActivities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: getRecentActivities,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      console.error('Failed to fetch recent activities:', error)
      toast.error('Failed to load recent activities')
    }
  })

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['user-courses', user?.role],
    queryFn: async () => {
      if (!user) return null
      try {
        return await getUserCourses(user)
      } catch (error) {
        console.warn('User courses API error, using fallback data:', error.message)
        // Return fallback course data
        return [
          {
            id: 1,
            title: 'Introduction to React',
            instructor: 'Dr. Sarah Johnson',
            progress: 75,
            thumbnail: '/api/placeholder/300/200',
            category: 'Web Development',
            level: 'Intermediate',
            duration: '6 weeks',
            enrolledStudents: 234
          },
          {
            id: 2,
            title: 'Data Science Fundamentals',
            instructor: 'Prof. Michael Chen',
            progress: 45,
            thumbnail: '/api/placeholder/300/200',
            category: 'Data Science',
            level: 'Beginner',
            duration: '8 weeks',
            enrolledStudents: 456
          }
        ]
      }
    },
    enabled: !!user, // Only run query if user exists
    retry: 1, // Reduce retries
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.warn('User courses temporarily unavailable')
    }
  })

  const { data: achievements, isLoading: achievementsLoading, error: achievementsError } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return null
      try {
        return await getUserAchievements(user)
      } catch (error) {
        console.warn('User achievements API error, using fallback data:', error.message)
        // Return fallback achievement data
        return [
          {
            id: 1,
            title: 'First Steps',
            description: 'Complete your profile setup',
            icon: '🎯',
            dateEarned: '2024-01-15',
            category: 'Onboarding'
          },
          {
            id: 2,
            title: 'Event Enthusiast',
            description: 'Register for 5 events',
            icon: '🎉',
            dateEarned: '2024-01-20',
            category: 'Events'
          }
        ]
      }
    },
    enabled: !!user, // Only run query if user exists
    retry: 1, // Reduce retries
    staleTime: 15 * 60 * 1000, // 15 minutes
    onError: (error) => {
      console.warn('User achievements temporarily unavailable')
    }
  })

  const { data: certificates, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user) return null
      try {
        return await getUserCertificates(user)
      } catch (error) {
        console.warn('User certificates API error, using fallback data:', error.message)
        // Return fallback certificate data
        return [
          {
            id: 1,
            title: 'React Development Certificate',
            issuer: 'Campus Learning Platform',
            dateIssued: '2024-01-10',
            credentialId: 'CLP-2024-REACT-001',
            category: 'Web Development'
          }
        ]
      }
    },
    enabled: !!user, // Only run query if user exists
    retry: 1, // Reduce retries
    staleTime: 15 * 60 * 1000, // 15 minutes
    onError: (error) => {
      console.warn('User certificates temporarily unavailable')
    }
  })

  const isLoading = statsLoading || activitiesLoading || coursesLoading || achievementsLoading || certificatesLoading

  // Since we're handling errors gracefully with fallback data, we don't need to log them
  // The console.warn messages in the query functions provide sufficient debugging info

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => {
    // Safety checks for value
    const safeValue = value !== undefined && value !== null ? value : 0
    
    return (
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
          <p className="text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </motion.div>
    )
  }

  const CourseCard = ({ course, index }) => {
    // Safety checks for course properties
    const safeCourse = {
      category: course?.category || 'General',
      level: course?.level || 'Beginner',
      title: course?.title || 'Untitled Course',
      instructor: course?.instructor || 'Unknown Instructor',
      progress: course?.progress || 0,
      completedLessons: course?.completedLessons || 0,
      totalLessons: course?.totalLessons || 1,
      duration: course?.duration || 'Unknown duration'
    }

    return (
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
              {safeCourse.category}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {safeCourse.level}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{safeCourse.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{safeCourse.instructor}</p>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">{safeCourse.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${safeCourse.progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{safeCourse.completedLessons}/{safeCourse.totalLessons} lessons</span>
            <span>{safeCourse.duration}</span>
          </div>
        </div>
      </motion.div>
    )
  }

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

    const Icon = getIcon(activity?.icon || 'CalendarIcon')
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
          <p className="text-sm font-medium text-gray-900">{activity?.message || 'No message'}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{activity?.user || 'Unknown'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity?.time || 'Just now'}</span>
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    )
  }

  // Helper functions
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid date'
    }
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
    // Safety check for ticket data
    if (!ticket) {
      toast.error('No ticket data available')
      return
    }

    try {
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
      ctx.fillText(ticket.eventName || 'Unknown Event', canvas.width / 2, 70)
      
      // Ticket ID
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.fillText(`Ticket ID: ${ticket.ticketId || 'Unknown'}`, canvas.width / 2, 100)
      
      // QR Code placeholder
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(50, 140, 120, 120)
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('QR Code', 110, 195)
      ctx.fillText((ticket.ticketId || 'Unknown').substring(0, 8) + '...', 110, 210)
      
      // Event details section
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Event Details', 200, 160)
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Event:', 200, 185)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventName || 'Unknown Event', 200, 205)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Date:', 200, 230)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventDate || 'Unknown Date', 200, 250)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Time:', 200, 275)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventTime || 'Unknown Time', 200, 295)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Location:', 200, 320)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventLocation || 'Unknown Location', 200, 340)
      
      // Attendee section
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Attendee Information', 50, 300)
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Name:', 50, 325)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.name || 'Unknown', 50, 345)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Email:', 50, 370)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.email || 'Unknown', 50, 390)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Student ID:', 50, 415)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.studentId || 'N/A', 50, 435)
      
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
        link.download = `ticket-${ticket.ticketId || 'unknown'}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success('Ticket downloaded successfully!')
      }, 'image/png')
    } catch (error) {
      console.error('Error generating ticket:', error)
      toast.error('Failed to generate ticket')
    }
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

  // Handler for viewing organizer event details
  const viewOrganizerEventDetails = (event) => {
    const detailedEvent = {
      ...event,
      longDescription: `${event.title} is a premier campus event designed to bring together students, faculty, and industry professionals for a day of learning, networking, and entertainment. Whether you're looking to expand your knowledge, meet new people, or simply have a great time, this event has something for everyone. Don't miss out on this opportunity to be part of something special!`,
      organizer: 'Campus Activities Department',
      category: 'Campus Event',
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
    setSelectedEvent(detailedEvent)
    setShowEventDetailModal(true)
  }

  // Handler for viewing event registrations
  const viewEventRegistrations = (event) => {
    setSelectedEventForRegistrations(event)
    setShowRegistrationsModal(true)
  }

  // Handler for form input changes
  const handleFormChange = (e) => {
    const { name, value, type } = e.target
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }

  // Handler for PDF file upload
  const handlePdfUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Add loading animation
      const uploadArea = e.target.closest('.border-dashed')
      if (uploadArea) {
        uploadArea.classList.add('border-purple-500', 'bg-purple-50')
        uploadArea.innerHTML = `
          <div class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p class="text-sm text-purple-600">Uploading...</p>
          </div>
        `
      }

      // Simulate upload delay for smooth UX
      setTimeout(() => {
        // Check if file is PDF
        if (file.type !== 'application/pdf') {
          toast.error('Please upload a PDF file')
          if (uploadArea) {
            uploadArea.classList.remove('border-purple-500', 'bg-purple-50')
            uploadArea.innerHTML = `
              <div class="text-center">
                <svg class="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <label for="agenda-pdf-upload" class="cursor-pointer">
                  <span class="text-sm font-medium text-purple-600 hover:text-purple-700">
                    Click to upload PDF
                  </span>
                  <p class="text-xs text-gray-500 mt-1">
                    PDF files only, max 10MB
                  </p>
                  <input
                    id="agenda-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange="handlePdfUpload"
                    class="hidden"
                  />
                </label>
              </div>
            `
          }
          return
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size must be less than 10MB')
          if (uploadArea) {
            uploadArea.classList.remove('border-purple-500', 'bg-purple-50')
            uploadArea.innerHTML = `
              <div class="text-center">
                <svg class="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <label for="agenda-pdf-upload" class="cursor-pointer">
                  <span class="text-sm font-medium text-purple-600 hover:text-purple-700">
                    Click to upload PDF
                  </span>
                  <p class="text-xs text-gray-500 mt-1">
                    PDF files only, max 10MB
                  </p>
                  <input
                    id="agenda-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange="handlePdfUpload"
                    class="hidden"
                  />
                </label>
              </div>
            `
          }
          return
        }

        setEventForm(prev => ({
          ...prev,
          agendaPdf: file
        }))
        toast.success('PDF uploaded successfully')
      }, 800)
    }
  }

  // Handler for removing PDF
  const removePdf = () => {
    setEventForm(prev => ({
      ...prev,
      agendaPdf: null
    }))
    toast.success('PDF removed')
  }

  // Calculate platform fee (3% of total potential revenue)
  const calculatePlatformFee = () => {
    const totalRevenue = eventForm.price * eventForm.maxAttendees
    return eventForm.price > 0 ? totalRevenue * 0.03 : 0
  }

  // Handle event creation
  const handleCreateEvent = () => {
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

  // Event Registrations Modal
  const RegistrationsModal = () => {
    // Mock registration data for the selected event
    const mockRegistrations = [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice.johnson@university.edu',
        studentId: 'ST2024001',
        phone: '+1-555-0101',
        registeredAt: '2024-01-15T10:30:00Z',
        status: 'confirmed',
        ticketId: 'TKT-1-1705123456789-ABC123',
        formData: {
          name: 'Alice Johnson',
          email: 'alice.johnson@university.edu',
          phone: '+1-555-0101',
          studentId: 'ST2024001',
          major: 'Computer Science',
          year: 'Junior',
          notes: 'Looking forward to attending this tech summit! Very interested in AI and machine learning topics.',
          dietaryRestrictions: 'Vegetarian',
          emergencyContact: 'Mary Johnson - Mother: +1-555-0100'
        }
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob.smith@university.edu',
        studentId: 'ST2024002',
        phone: '+1-555-0102',
        registeredAt: '2024-01-16T14:15:00Z',
        status: 'confirmed',
        ticketId: 'TKT-1-1705123456789-DEF456',
        formData: {
          name: 'Bob Smith',
          email: 'bob.smith@university.edu',
          phone: '+1-555-0102',
          studentId: 'ST2024002',
          major: 'Business Administration',
          year: 'Senior',
          notes: 'Excited to network with tech professionals and learn about industry trends.',
          dietaryRestrictions: 'None',
          emergencyContact: 'John Smith - Father: +1-555-0103'
        }
      },
      {
        id: 3,
        name: 'Carol Williams',
        email: 'carol.williams@university.edu',
        studentId: 'ST2024003',
        phone: '+1-555-0103',
        registeredAt: '2024-01-17T09:45:00Z',
        status: 'confirmed',
        ticketId: 'TKT-1-1705123456789-GHI789',
        formData: {
          name: 'Carol Williams',
          email: 'carol.williams@university.edu',
          phone: '+1-555-0103',
          studentId: 'ST2024003',
          major: 'Graphic Design',
          year: 'Sophomore',
          notes: 'Interested in the design and UX aspects of technology presentations.',
          dietaryRestrictions: 'Gluten-free',
          emergencyContact: 'Lisa Williams - Sister: +1-555-0104'
        }
      },
      {
        id: 4,
        name: 'David Brown',
        email: 'david.brown@university.edu',
        studentId: 'ST2024004',
        phone: '+1-555-0104',
        registeredAt: '2024-01-18T16:20:00Z',
        status: 'pending',
        ticketId: 'TKT-1-1705123456789-JKL012',
        formData: {
          name: 'David Brown',
          email: 'david.brown@university.edu',
          phone: '+1-555-0104',
          studentId: 'ST2024004',
          major: 'Electrical Engineering',
          year: 'Graduate',
          notes: 'Researching IoT applications and looking for collaboration opportunities.',
          dietaryRestrictions: 'None',
          emergencyContact: 'Robert Brown - Father: +1-555-0105'
        }
      },
      {
        id: 5,
        name: 'Emma Davis',
        email: 'emma.davis@university.edu',
        studentId: 'ST2024005',
        phone: '+1-555-0105',
        registeredAt: '2024-01-19T11:30:00Z',
        status: 'confirmed',
        ticketId: 'TKT-1-1705123456789-MNO345',
        formData: {
          name: 'Emma Davis',
          email: 'emma.davis@university.edu',
          phone: '+1-555-0105',
          studentId: 'ST2024005',
          major: 'Marketing',
          year: 'Junior',
          notes: 'Interested in technology marketing and startup ecosystems.',
          dietaryRestrictions: 'Vegan',
          emergencyContact: 'Sarah Davis - Sister: +1-555-0106'
        }
      }
    ]

    const [selectedRegistration, setSelectedRegistration] = useState(null)
    const [showRegistrationDetailModal, setShowRegistrationDetailModal] = useState(false)

    const viewRegistrationDetails = (registration) => {
      setSelectedRegistration(registration)
      setShowRegistrationDetailModal(true)
    }

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowRegistrationsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Event Registrations</h2>
                  <p className="text-green-100">{selectedEventForRegistrations?.title}</p>
                  <p className="text-green-200 text-sm mt-1">
                    {selectedEventForRegistrations?.registrations} / {selectedEventForRegistrations?.maxAttendees} registered
                  </p>
                </div>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Simplified Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Registered</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedEventForRegistrations?.registrations || 0}</p>
                    </div>
                    <UsersIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Available Spots</p>
                      <p className="text-2xl font-bold text-purple-900">{(selectedEventForRegistrations?.maxAttendees || 0) - (selectedEventForRegistrations?.registrations || 0)}</p>
                    </div>
                    <TicketIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Registrations Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockRegistrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                {registration.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{registration.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{registration.email}</div>
                            <div className="text-sm text-gray-500">{registration.phone}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.studentId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(registration.registeredAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {registration.ticketId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewRegistrationDetails(registration)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {mockRegistrations.length} registrations
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowRegistrationsModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Registrations exported successfully!')
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Export List
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Registration Detail Modal */}
        {showRegistrationDetailModal && selectedRegistration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegistrationDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Registration Details</h2>
                    <p className="text-blue-100">{selectedRegistration.name}</p>
                    <p className="text-blue-200 text-sm mt-1">Ticket ID: {selectedRegistration.ticketId}</p>
                  </div>
                  <button
                    onClick={() => setShowRegistrationDetailModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.studentId}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Academic Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Major:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.major}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.year}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Additional Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedRegistration.formData.notes}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dietary Restrictions:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRegistration.formData.dietaryRestrictions}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Emergency Contact:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedRegistration.formData.emergencyContact}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Information */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Registration Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedRegistration.registeredAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedRegistration.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedRegistration.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket ID:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.ticketId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowRegistrationDetailModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Registration details exported successfully!')
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Export Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </>
    )
  }

  // Create Event Modal
  const CreateEventModal = () => {
    const platformFee = calculatePlatformFee()
    const totalRevenue = eventForm.price * eventForm.maxAttendees

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowCreateEventModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Create New Event</h2>
                <p className="text-purple-100">Fill in the details to create your event</p>
              </div>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 transition-all duration-300 hover:text-purple-600 cursor-pointer">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={eventForm.title}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                        placeholder="Enter event title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="eventType"
                        value={eventForm.eventType}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      >
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={eventForm.description}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm resize-none"
                        placeholder="Describe your event"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-4 transition-all duration-300 hover:text-blue-600 cursor-pointer">Date & Time</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={eventForm.date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="time"
                        value={eventForm.time}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Location & Capacity */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-4 transition-all duration-300 hover:text-green-600 cursor-pointer">Location & Capacity</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={eventForm.location}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                        placeholder="Event location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Attendees <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="maxAttendees"
                        value={eventForm.maxAttendees}
                        onChange={handleFormChange}
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                        placeholder="Maximum number of attendees"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={eventForm.phoneNumber}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-4 transition-all duration-300 hover:text-yellow-600 cursor-pointer">Pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ticket Price ($)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={eventForm.price}
                        onChange={handleFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm"
                        placeholder="0 for free event"
                      />
                    </div>

                    {eventForm.price > 0 && eventForm.maxAttendees > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ticket Price:</span>
                            <span className="font-medium">${eventForm.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Attendees:</span>
                            <span className="font-medium">{eventForm.maxAttendees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Revenue:</span>
                            <span className="font-medium">${totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-red-600">
                            <span>Platform Fee (3%):</span>
                            <span>${platformFee.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Agenda */}
            <div className="mt-6 bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-4 transition-all duration-300 hover:text-purple-600 cursor-pointer">Event Agenda</h3>
              <div className="space-y-4">
                {/* Text Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agenda Description
                  </label>
                  <textarea
                    name="agenda"
                    value={eventForm.agenda}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm resize-none"
                    placeholder="Describe the event agenda, schedule, and activities..."
                  />
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Agenda PDF (Optional)
                  </label>
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-white/50 transition-all duration-300 hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer">
                    {eventForm.agendaPdf ? (
                      <div className="flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="w-8 h-8 text-purple-600 animate-pulse" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{eventForm.agendaPdf.name}</p>
                            <p className="text-xs text-gray-500">
                              {(eventForm.agendaPdf.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removePdf}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:scale-110"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <DocumentTextIcon className="w-12 h-12 text-purple-400 mx-auto mb-3 transition-transform duration-300 hover:scale-110" />
                        <label htmlFor="agenda-pdf-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-300">
                            Click to upload PDF
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF files only, max 10MB
                          </p>
                          <input
                            id="agenda-pdf-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload a detailed agenda PDF for attendees to download
                  </p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="mt-6 bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-4 transition-all duration-300 hover:text-orange-600 cursor-pointer">Requirements</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requirements
                </label>
                <textarea
                  name="requirements"
                  value={eventForm.requirements}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 hover:shadow-sm resize-none"
                  placeholder="Any special requirements for attendees..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {platformFee > 0 ? (
                  <span className="text-red-600 font-medium">
                    Platform fee: ${platformFee.toFixed(2)} will be charged
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    Free event - no platform fee
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-all duration-300 hover:bg-gray-100 rounded-lg transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isOrganizer ? 'Event Organizer Dashboard' : 'Welcome to CluboraX'}
                </h1>
                <p className="text-gray-600">
                  {isOrganizer ? 'Manage your events and track performance' : 'Your comprehensive campus learning and activity platform'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs - Different for organizers vs students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-2"
          >
            <div className="flex space-x-1">
              {isOrganizer ? 
                ['overview', 'my-events'].map((tab) => (
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
                    {tab === 'my-events' && 'My Events'}
                  </button>
                ))
                :
                ['overview', 'my-clubs', 'my-events'].map((tab) => (
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
                ))
              }
            </div>
          </motion.div>

          {/* Tab Content */}
          <>
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
            <>
              {/* Stats Grid - Different for organizers vs students */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isOrganizer ? (
                  <>
                    <StatCard
                      title="My Events"
                      value={stats?.myEvents || 5}
                      icon={CalendarIcon}
                      color="bg-gradient-to-r from-blue-500 to-blue-600"
                      trend="up"
                      trendValue="+12%"
                      description="Events created"
                    />
                    <StatCard
                      title="Total Attendees"
                      value={stats?.totalAttendees || 245}
                      icon={UsersIcon}
                      color="bg-gradient-to-r from-green-500 to-green-600"
                      trend="up"
                      trendValue="+18%"
                      description="People registered"
                    />
                    <StatCard
                      title="Revenue"
                      value={stats?.revenue || 1250}
                      icon={TrophyIcon}
                      color="bg-gradient-to-r from-purple-500 to-purple-600"
                      trend="up"
                      trendValue="+25%"
                      description="Total earnings"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Main Content Grid - Different for organizers vs students */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isOrganizer ? (
                  <>
                    {/* Events Section for Organizers */}
                    <div className="lg:col-span-2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">My Events</h2>
                            <p className="text-gray-600 mt-1">Manage your upcoming events</p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            View All
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div className="text-center py-12 text-gray-500">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No events created yet</p>
                            <p className="text-sm mt-2">Start creating events to see them here!</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Quick Actions for Organizers */}
                    <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setShowCreateEventModal(true)}
                            className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Create Event</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                            <ChartBarIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">View Analytics</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Manage Attendees</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Courses Section for Students */}
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
                        <div className="space-y-4">
                          <div className="text-center py-12 text-gray-500">
                            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No courses yet</p>
                            <p className="text-sm mt-2">Start exploring events and clubs to see them here!</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Recent Activity for Students */}
                    <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                          <div className="text-center py-8 text-gray-500">
                            <ClockIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No recent activity</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
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

          {activeTab === 'my-events' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isOrganizer ? 'My Created Events' : 'My Event Registrations'}
                </h2>
                <p className="text-gray-600">
                  {isOrganizer ? 'Manage events you have created and track registrations' : 'View your event tickets and registration details'}
                </p>
              </div>
              
              {isOrganizer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      id: 1,
                      title: 'Tech Innovation Summit 2024',
                      date: '2024-03-15',
                      time: '09:00 AM',
                      location: 'Main Auditorium',
                      price: 0,
                      status: 'published',
                      registrations: 45,
                      maxAttendees: 100,
                      image: '/api/placeholder/400/200',
                      description: 'Annual technology conference featuring industry leaders'
                    },
                    {
                      id: 2,
                      title: 'Spring Music Festival',
                      date: '2024-03-20',
                      time: '06:00 PM',
                      location: 'Campus Grounds',
                      price: 15,
                      status: 'published',
                      registrations: 78,
                      maxAttendees: 200,
                      image: '/api/placeholder/400/200',
                      description: 'Outdoor music celebration with student bands'
                    }
                  ].map((event) => (
                      <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                          <div className="absolute inset-0 bg-black bg-opacity-20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CalendarIcon className="w-16 h-16 text-white opacity-50" />
                          </div>
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                              {event.status}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                              {event.registrations}/{event.maxAttendees} registered
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {event.date} at {event.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <UsersIcon className="w-4 h-4 mr-2" />
                              {event.registrations} people registered
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {event.price > 0 ? `$${event.price}` : 'Free'}
                            </span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => viewOrganizerEventDetails(event)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                <EyeIcon className="w-4 h-4" />
                                View Details
                              </button>
                              <button 
                                onClick={() => viewEventRegistrations(event)}
                                className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm"
                              >
                                <UsersIcon className="w-4 h-4" />
                                View Registrations
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
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
              )}
            </motion.div>
          )}
          </>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTicketModal && <TicketModal />}
        {showClubDetailModal && <ClubRequestDetailModal />}
        {showEventDetailModal && <EventDetailModal />}
        {showRegistrationsModal && <RegistrationsModal />}
        {showCreateEventModal && <CreateEventModal />}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
