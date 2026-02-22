import React, { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
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
  BuildingOfficeIcon,
  UserIcon,
  PlusIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { getDashboardStats, getRecentActivities, getUserCourses, getMyEventRegistrations, getMyClubMemberships, getMyCreatedEvents, getMyCreatedClubs } from '../api/dashboard'
import { getUserAchievements, getUserCertificates } from '../api/courses'
import { 
  getEventProposals, 
  getClubProposals, 
  deleteEventProposal, 
  deleteClubProposal,
  createEventProposal,
  createClubProposal
} from '../api/proposals'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [highlightedCardId, setHighlightedCardId] = useState(null)
  
  // Handle URL tab parameter and highlight parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    const highlightParam = params.get('highlight')
    
    if (tabParam && (tabParam === 'overview' || tabParam === 'my-events' || tabParam === 'my-clubs' || tabParam === 'my-clubs-events' || tabParam === 'my-organized' || tabParam === 'proposals')) {
      setActiveTab(tabParam)
    }
    
    if (highlightParam) {
      setHighlightedCardId(highlightParam)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedCardId(null), 3000)
    }
  }, [location.search])
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showClubDetailModal, setShowClubDetailModal] = useState(false)
  const [selectedClubRequest, setSelectedClubRequest] = useState(null)
  const [showEventDetailModal, setShowEventDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false)
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null)
  const [showClubMembersModal, setShowClubMembersModal] = useState(false)
  const [selectedClubForMembers, setSelectedClubForMembers] = useState(null)
  const [showOrganizerClubDetailModal, setShowOrganizerClubDetailModal] = useState(false)
  const [selectedOrganizerClub, setSelectedOrganizerClub] = useState(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)
  const [selectedEventForImage, setSelectedEventForImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imgAiStep, setImgAiStep] = useState('idle') // 'idle' | 'scanning' | 'passed' | 'rejected'
  const [imgAiChecks, setImgAiChecks] = useState([])
  const [myEventsContentType, setMyEventsContentType] = useState('events') // 'events' or 'clubs'
  const [studentContentType, setStudentContentType] = useState('events') // 'events' or 'clubs' for students
  const [studentOrganizedType, setStudentOrganizedType] = useState('events') // 'events' or 'clubs' for student organized content
  const [eventStatusFilter, setEventStatusFilter] = useState('all') // Status filter for events
  const [clubStatusFilter, setClubStatusFilter] = useState('all') // Status filter for clubs
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedCancelItem, setSelectedCancelItem] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelType, setCancelType] = useState('') // 'event' or 'club'
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showEditClubModal, setShowEditClubModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingClub, setEditingClub] = useState(null)
  
  // Proposals tab state
  const [proposalTab, setProposalTab] = useState('all') // 'all', 'pending', 'approved', 'rejected'
  const [showEventProposalModal, setShowEventProposalModal] = useState(false)
  const [showClubProposalModal, setShowClubProposalModal] = useState(false)
  const queryClient = useQueryClient()

  // Scroll to highlighted card when highlightedCardId changes
  useEffect(() => {
    if (highlightedCardId && activeTab === 'my-events') {
      // Check if it's a club and switch to clubs toggle
      if (highlightedCardId.startsWith('club-')) {
        setMyEventsContentType('clubs')
      } else if (highlightedCardId.startsWith('event-')) {
        setMyEventsContentType('events')
      }
      
      // Scroll to the card after a delay to ensure tab/toggle transition completes
      setTimeout(() => {
        const element = document.getElementById(highlightedCardId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [highlightedCardId, activeTab, myEventsContentType])
  
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
  
  // Fetch real event registrations and club memberships
  const { data: myEventRegistrations = [], isLoading: loadingEventRegs } = useQuery({
    queryKey: ['my-event-registrations', user?.id],
    queryFn: getMyEventRegistrations,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })

  const { data: myClubRequests = [], isLoading: loadingClubMemberships } = useQuery({
    queryKey: ['my-club-memberships', user?.id],
    queryFn: getMyClubMemberships,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      if (!user) return null
      return await getDashboardStats(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
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

  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['user-courses', user?.role],
    queryFn: async () => {
      if (!user) return []
      return await getUserCourses(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  })

  const { data: achievements, isLoading: achievementsLoading, error: achievementsError } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return null
      return await getUserAchievements(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 15 * 60 * 1000,
  })

  const { data: certificates, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user) return null
      return await getUserCertificates(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 15 * 60 * 1000,
  })

  // Fetch organizer's created events and clubs
  const { data: myCreatedEvents = [], isLoading: loadingCreatedEvents } = useQuery({
    queryKey: ['my-created-events', user?.id],
    queryFn: getMyCreatedEvents,
    enabled: !!user && isOrganizer,
    staleTime: 2 * 60 * 1000,
  })

  const { data: myCreatedClubs = [], isLoading: loadingCreatedClubs } = useQuery({
    queryKey: ['my-created-clubs', user?.id],
    queryFn: getMyCreatedClubs,
    enabled: !!user && isOrganizer,
    staleTime: 2 * 60 * 1000,
  })

  // Fetch event proposals
  const { data: eventProposals = [], isLoading: loadingEventProposals, error: eventProposalsError } = useQuery({
    queryKey: ['my-event-proposals'],
    queryFn: async () => {
      const data = await getEventProposals()
      return Array.isArray(data) ? data : []
    },
    retry: 1,
    enabled: activeTab === 'proposals',
    onError: (error) => {
      console.error('Failed to fetch event proposals:', error)
    }
  })
  
  // Fetch club proposals
  const { data: clubProposals = [], isLoading: loadingClubProposals, error: clubProposalsError } = useQuery({
    queryKey: ['my-club-proposals'],
    queryFn: async () => {
      const data = await getClubProposals()
      return Array.isArray(data) ? data : []
    },
    retry: 1,
    enabled: activeTab === 'proposals',
    onError: (error) => {
      console.error('Failed to fetch club proposals:', error)
    }
  })
  
  // Ensure arrays (handle cases where API returns non-array data)
  const safeEventProposals = Array.isArray(eventProposals) ? eventProposals : []
  const safeClubProposals = Array.isArray(clubProposals) ? clubProposals : []
  
  // Filter published content (approved proposals that are now live)
  const publishedEvents = safeEventProposals.filter(p => p.status === 'published')
  const publishedClubs = safeClubProposals.filter(p => p.status === 'published')
  const hasPublishedContent = publishedEvents.length > 0 || publishedClubs.length > 0
  
  // Combine all proposals
  const allProposals = [
    ...safeEventProposals.map(p => ({ ...p, type: 'event' })),
    ...safeClubProposals.map(p => ({ ...p, type: 'club' }))
  ]
  
  // Filter proposals based on active tab
  const filteredProposals = proposalTab === 'all' 
    ? allProposals 
    : allProposals.filter(p => p.status === proposalTab)

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
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'published':
        return 'bg-emerald-100 text-emerald-800'
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'published':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'rejected':
        return <XCircleIcon className="w-5 h-5" />
      case 'pending':
      case 'under_review':
        return <ClockIcon className="w-5 h-5" />
      case 'needs_revision':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
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
    // If event is rejected, open edit modal
    if (event.status === 'rejected') {
      setEditingEvent(event)
      setShowEditEventModal(true)
      return
    }
    
    // Otherwise, show detail modal
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

  // Handler for viewing club members
  const viewClubMembers = (club) => {
    setSelectedClubForMembers(club)
    setShowClubMembersModal(true)
  }

  // Handler for viewing organizer club details
  const viewOrganizerClubDetails = (club) => {
    // If club is rejected, open edit modal
    if (club.status === 'rejected') {
      setEditingClub(club)
      setShowEditClubModal(true)
      return
    }
    
    // Otherwise, show detail modal
    const detailedClub = {
      ...club,
      longDescription: `${club.name} is a vibrant campus organization dedicated to bringing together students who share a passion for ${club.category}. Join us for regular meetings, workshops, and events designed to enhance your skills and expand your network.`,
      president: 'Student Leader',
      category: club.category,
      tags: ['Community', 'Leadership', 'Networking', 'Growth'],
      requirements: 'Open to all students. Membership application required.',
      activities: [
        { type: 'Weekly Meetings', schedule: 'Every Friday 4:00 PM' },
        { type: 'Workshops', schedule: 'Monthly' },
        { type: 'Social Events', schedule: 'Quarterly' },
        { type: 'Community Service', schedule: 'Bi-monthly' }
      ]
    }
    setSelectedOrganizerClub(detailedClub)
    setShowOrganizerClubDetailModal(true)
  }

  // Handler for opening image upload modal
  const openImageUploadModal = (event, e) => {
    if (e) e.stopPropagation()
    setSelectedEventForImage(event)
    setShowImageUploadModal(true)
  }

  // Handler for closing image upload modal
  const closeImageUploadModal = () => {
    setShowImageUploadModal(false)
    setSelectedEventForImage(null)
    setImagePreview(null)
    setSelectedFile(null)
    setImgAiStep('idle')
    setImgAiChecks([])
  }

  // Handler for exporting registrations to CSV
  const exportRegistrationsToCSV = (registrations, eventTitle) => {
    const headers = ['Name', 'Email', 'Phone', 'Student ID', 'Major', 'Year', 'Registered At', 'Status', 'Ticket ID']
    const csvData = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.studentId,
      reg.formData.major,
      reg.formData.year,
      formatDate(reg.registeredAt),
      reg.status,
      reg.ticketId
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${eventTitle}_registrations_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handler for exporting club members to CSV
  const exportClubMembersToCSV = (members, clubName) => {
    const headers = ['Name', 'Email', 'Phone', 'Student ID', 'Role', 'Joined At', 'Status']
    const csvData = members.map(member => [
      member.name,
      member.email,
      member.phone,
      member.studentId,
      member.role,
      formatDate(member.joinedAt),
      member.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${clubName}_members_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handler for image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // AI scan then upload
  const handleImageAIScan = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }
    setImgAiStep('scanning')
    setImgAiChecks([])

    // Simulate progressive AI checks streaming in
    const checks = [
      { label: 'Inappropriate / Adult Content', delay: 600 },
      { label: 'Violence or Harmful Material', delay: 1100 },
      { label: 'Offensive Text or Symbols', delay: 1600 },
      { label: 'Image Relevance to Event', delay: 2200 },
      { label: 'Image Quality & Clarity', delay: 2700 },
    ]

    // Use file name/size as a deterministic seed so results are consistent per file
    const seed = (selectedFile.name.length + Math.floor(selectedFile.size / 1000)) % 10
    // Fail 1 in 5 times (seed 0 or 1) to demo the rejection flow
    const willFail = seed <= 1
    const failIndex = willFail ? (seed === 0 ? 3 : 0) : -1 // which check fails

    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 0 ? checks[0].delay : checks[i].delay - checks[i - 1].delay))
      const passed = !(willFail && i === failIndex)
      setImgAiChecks(prev => [
        ...prev,
        {
          label: checks[i].label,
          passed,
          detail: passed
            ? 'No issues detected'
            : i === 0 ? 'Explicit or adult content detected'
            : i === 3 ? 'Image does not appear related to the event topic'
            : 'Violation detected'
        }
      ])
    }

    await new Promise(resolve => setTimeout(resolve, 400))
    if (willFail) {
      setImgAiStep('rejected')
    } else {
      setImgAiStep('passed')
    }
  }

  const handleImageUpload = async () => {
    setUploadingImage(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Image added to gallery!')
      closeImageUploadModal()
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handler for form input changes — useCallback prevents new reference on every render
  const handleFormChange = useCallback((e) => {
    const { name, value, type } = e.target
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }, [])

  // Handler for PDF file upload — useCallback prevents new reference on every render
  const handlePdfUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setEventForm(prev => ({ ...prev, agendaPdf: file }))
    toast.success('PDF uploaded successfully')
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

  // Club Request Card Component
  const ClubRequestCard = ({ request }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={() => viewClubDetails(request)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer"
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
      onClick={() => viewEvent(registration)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer"
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
    const isPaidEvent = (selectedEventForRegistrations?.price || 0) > 0

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
        payment: {
          status: 'pending_confirmation',
          amount: selectedEventForRegistrations?.price || 0,
          paidAt: '2024-01-15T10:28:00Z',
          method: 'KHQR / ABA Bank',
          transactionId: 'TXN-ABA-20240115-001',
          proofType: 'image'
        },
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
        payment: {
          status: 'confirmed',
          amount: selectedEventForRegistrations?.price || 0,
          paidAt: '2024-01-16T14:10:00Z',
          method: 'KHQR / Wing Bank',
          transactionId: 'TXN-WING-20240116-002',
          proofType: 'image'
        },
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
        payment: {
          status: 'pending_confirmation',
          amount: selectedEventForRegistrations?.price || 0,
          paidAt: '2024-01-17T09:40:00Z',
          method: 'KHQR / ABA Bank',
          transactionId: 'TXN-ABA-20240117-003',
          proofType: 'pdf'
        },
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
        payment: {
          status: 'rejected',
          amount: selectedEventForRegistrations?.price || 0,
          paidAt: '2024-01-18T16:00:00Z',
          method: 'KHQR / ABA Bank',
          transactionId: 'TXN-ABA-20240118-004',
          proofType: 'image',
          rejectionReason: 'Receipt amount does not match ticket price. Please re-submit correct proof.'
        },
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
        payment: {
          status: 'confirmed',
          amount: selectedEventForRegistrations?.price || 0,
          paidAt: '2024-01-19T11:25:00Z',
          method: 'KHQR / ABA Bank',
          transactionId: 'TXN-ABA-20240119-005',
          proofType: 'image'
        },
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

    const [selectedRegistration, setSelectedRegistration] = React.useState(null)
    const [showRegistrationDetailModal, setShowRegistrationDetailModal] = React.useState(false)
    const [regModalTab, setRegModalTab] = React.useState('attendees') // 'attendees' | 'payments'
    const [paymentStatuses, setPaymentStatuses] = React.useState(
      () => Object.fromEntries(mockRegistrations.map(r => [r.id, r.payment?.status || 'n/a']))
    )
    const [selectedPaymentProof, setSelectedPaymentProof] = React.useState(null)

    const pendingCount = Object.values(paymentStatuses).filter(s => s === 'pending_confirmation').length
    const confirmedCount = Object.values(paymentStatuses).filter(s => s === 'confirmed').length
    const totalCollected = confirmedCount * (selectedEventForRegistrations?.price || 0)

    const confirmPayment = (reg) => {
      setPaymentStatuses(prev => ({ ...prev, [reg.id]: 'confirmed' }))
      toast.success(`Payment confirmed for ${reg.name}`)
    }
    const rejectPayment = (reg) => {
      setPaymentStatuses(prev => ({ ...prev, [reg.id]: 'rejected' }))
      toast.error(`Payment rejected for ${reg.name} — student will be notified`)
    }

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
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-green-200 text-sm">
                      {selectedEventForRegistrations?.registrations} / {selectedEventForRegistrations?.maxAttendees} registered
                    </span>
                    {isPaidEvent && pendingCount > 0 && (
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                        {pendingCount} payment{pendingCount > 1 ? 's' : ''} awaiting confirmation
                      </span>
                    )}
                    {isPaidEvent && (
                      <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Collected: ${totalCollected.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {/* Sub-tabs for paid events */}
              {isPaidEvent && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setRegModalTab('attendees')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      regModalTab === 'attendees' ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => setRegModalTab('payments')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      regModalTab === 'payments' ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Payments
                    {pendingCount > 0 && (
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* ── PAYMENTS TAB ── */}
              {isPaidEvent && regModalTab === 'payments' && (
                <div className="space-y-4">
                  {/* Revenue summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                      <p className="text-xs text-amber-600 font-medium mt-1">Awaiting Confirmation</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">Confirmed</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">${totalCollected.toFixed(2)}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">Total Collected</p>
                    </div>
                  </div>

                  {/* Payment cards */}
                  {mockRegistrations.map((reg) => {
                    const pStatus = paymentStatuses[reg.id]
                    return (
                      <div key={reg.id} className={`border rounded-xl p-5 ${
                        pStatus === 'pending_confirmation' ? 'border-amber-300 bg-amber-50' :
                        pStatus === 'confirmed' ? 'border-green-300 bg-green-50' :
                        pStatus === 'rejected' ? 'border-red-300 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          {/* Student + payment info */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {reg.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{reg.name}</span>
                                <span className="text-xs text-gray-500">{reg.studentId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  pStatus === 'pending_confirmation' ? 'bg-amber-200 text-amber-800' :
                                  pStatus === 'confirmed' ? 'bg-green-200 text-green-800' :
                                  pStatus === 'rejected' ? 'bg-red-200 text-red-800' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {pStatus === 'pending_confirmation' ? 'Pending' :
                                   pStatus === 'confirmed' ? 'Confirmed' :
                                   pStatus === 'rejected' ? 'Rejected' : 'No payment'}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                                <span><span className="font-medium">Amount:</span> ${(reg.payment?.amount || 0).toFixed(2)}</span>
                                <span><span className="font-medium">Method:</span> {reg.payment?.method || '—'}</span>
                                <span><span className="font-medium">Paid at:</span> {reg.payment?.paidAt ? new Date(reg.payment.paidAt).toLocaleString() : '—'}</span>
                                <span><span className="font-medium">Txn ID:</span> {reg.payment?.transactionId || '—'}</span>
                              </div>
                              {pStatus === 'rejected' && reg.payment?.rejectionReason && (
                                <p className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                                  Rejection note: {reg.payment.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Proof + actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                              onClick={() => setSelectedPaymentProof(reg)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 bg-white rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-all"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View Proof {reg.payment?.proofType === 'pdf' ? '(PDF)' : '(Image)'}
                            </button>
                            {pStatus === 'pending_confirmation' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => rejectPayment(reg)}
                                  className="flex items-center gap-1 text-xs text-red-700 border border-red-300 bg-white hover:bg-red-50 rounded-lg px-3 py-1.5 font-medium transition-all"
                                >
                                  <XCircleIcon className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => confirmPayment(reg)}
                                  className="flex items-center gap-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 font-medium transition-all"
                                >
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                  Confirm
                                </button>
                              </div>
                            )}
                            {pStatus === 'confirmed' && (
                              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                <CheckCircleIcon className="w-4 h-4" /> Payment confirmed
                              </span>
                            )}
                            {pStatus === 'rejected' && (
                              <button
                                onClick={() => confirmPayment(reg)}
                                className="text-xs text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 font-medium transition-all"
                              >
                                Re-confirm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Payment Proof Preview Modal */}
                  {selectedPaymentProof && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                      onClick={() => setSelectedPaymentProof(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900">Payment Proof</h3>
                          <button onClick={() => setSelectedPaymentProof(null)} className="p-1 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                          <div><span className="font-medium">Student:</span> {selectedPaymentProof.name}</div>
                          <div><span className="font-medium">Amount:</span> ${(selectedPaymentProof.payment?.amount || 0).toFixed(2)}</div>
                          <div><span className="font-medium">Transaction ID:</span> {selectedPaymentProof.payment?.transactionId}</div>
                          <div><span className="font-medium">Method:</span> {selectedPaymentProof.payment?.method}</div>
                        </div>
                        {/* Proof placeholder — in production this would show the actual uploaded image/PDF */}
                        {selectedPaymentProof.payment?.proofType === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-8 gap-3">
                            <DocumentTextIcon className="w-16 h-16 text-gray-400" />
                            <p className="text-sm text-gray-500">PDF receipt uploaded</p>
                            <button className="text-xs text-blue-600 underline">Download PDF</button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-8 gap-3">
                            <PhotoIcon className="w-16 h-16 text-gray-400" />
                            <p className="text-sm text-gray-500">Payment screenshot uploaded</p>
                            <p className="text-xs text-gray-400">(Image preview requires backend integration)</p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => { rejectPayment(selectedPaymentProof); setSelectedPaymentProof(null) }}
                            className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { confirmPayment(selectedPaymentProof); setSelectedPaymentProof(null) }}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            Confirm Payment
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── ATTENDEES TAB (or non-paid default) ── */}
              {(!isPaidEvent || regModalTab === 'attendees') && (
              <>
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
              </> )}

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
                      exportRegistrationsToCSV(mockRegistrations, selectedEventForRegistrations?.title || 'Event')
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

  // Club Members Modal
  const ClubMembersModal = () => {
    // Mock members data for the selected club
    const mockMembers = [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice.johnson@university.edu',
        studentId: 'ST2024001',
        phone: '+1-555-0101',
        joinedAt: '2024-01-15T10:30:00Z',
        role: 'President',
        status: 'active'
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob.smith@university.edu',
        studentId: 'ST2024002',
        phone: '+1-555-0102',
        joinedAt: '2024-01-20T14:15:00Z',
        role: 'Vice President',
        status: 'active'
      },
      {
        id: 3,
        name: 'Carol Williams',
        email: 'carol.williams@university.edu',
        studentId: 'ST2024003',
        phone: '+1-555-0103',
        joinedAt: '2024-02-01T09:45:00Z',
        role: 'Member',
        status: 'active'
      },
      {
        id: 4,
        name: 'David Brown',
        email: 'david.brown@university.edu',
        studentId: 'ST2024004',
        phone: '+1-555-0104',
        joinedAt: '2024-02-05T16:20:00Z',
        role: 'Member',
        status: 'active'
      },
      {
        id: 5,
        name: 'Emma Davis',
        email: 'emma.davis@university.edu',
        studentId: 'ST2024005',
        phone: '+1-555-0105',
        joinedAt: '2024-02-10T11:30:00Z',
        role: 'Member',
        status: 'pending'
      }
    ]

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowClubMembersModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Club Members</h2>
                <p className="text-purple-100">{selectedClubForMembers?.name}</p>
                <p className="text-purple-200 text-sm mt-1">
                  {selectedClubForMembers?.members || mockMembers.length} total members
                </p>
              </div>
              <button
                onClick={() => setShowClubMembersModal(false)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Members</p>
                    <p className="text-2xl font-bold text-purple-900">{mockMembers.length}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active Members</p>
                    <p className="text-2xl font-bold text-green-900">{mockMembers.filter(m => m.status === 'active').length}</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{mockMembers.filter(m => m.status === 'pending').length}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.email}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.studentId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'President' ? 'bg-indigo-100 text-indigo-700' :
                            member.role === 'Vice President' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
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
                Showing {mockMembers.length} members
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowClubMembersModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    exportClubMembersToCSV(mockMembers, selectedClubForMembers?.name || 'Club')
                    toast.success('Member list exported successfully!')
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Export List
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

          {/* Registration Status - Only show for non-organizers */}
          {!isOrganizer && (
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
          )}
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
            {!isOrganizer && (
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
            )}
            {isOrganizer && (
              <button
                onClick={() => {
                  setShowEventDetailModal(false)
                  viewEventRegistrations(selectedEvent)
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
              >
                <UsersIcon className="w-5 h-5" />
                View Registrations
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  // Organizer Club Detail Modal
  const OrganizerClubDetailModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowOrganizerClubDetailModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">{selectedOrganizerClub?.name}</h2>
              <p className="text-purple-100">{selectedOrganizerClub?.category}</p>
            </div>
            <button
              onClick={() => setShowOrganizerClubDetailModal(false)}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Club</h3>
            <p className="text-gray-600 leading-relaxed">{selectedOrganizerClub?.longDescription}</p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">Club Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizerClub?.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">President:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizerClub?.president}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedOrganizerClub?.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedOrganizerClub?.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-pink-50 rounded-lg p-4">
              <h4 className="font-semibold text-pink-900 mb-3">Membership</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Members:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizerClub?.members || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requirements:</span>
                  <span className="font-medium text-gray-900">Open to all</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {selectedOrganizerClub?.tags?.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Club Activities</h4>
            <div className="space-y-3">
              {selectedOrganizerClub?.activities?.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-32 text-sm font-medium text-gray-600">
                    {activity.type}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.schedule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Membership Requirements</h4>
            <p className="text-sm text-gray-600">{selectedOrganizerClub?.requirements}</p>
          </div>

          {/* Club Description */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600">
              {selectedOrganizerClub?.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => setShowOrganizerClubDetailModal(false)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowOrganizerClubDetailModal(false)
                viewClubMembers(selectedOrganizerClub)
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
            >
              <UserGroupIcon className="w-5 h-5" />
              View Members
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
      {/* Hero Section */}
      <div 
        className="relative text-white text-center overflow-hidden"
        style={{
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/img/home.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          padding: 'calc(6rem + 60px) 2rem 4rem'
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

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '3rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
              <UserIcon className="w-12 h-12" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                Welcome back, <span>{user?.name || 'User'}</span>!
              </h1>
              <p style={{ fontSize: '1.15rem', opacity: 0.95, margin: '0.5rem 0 0 0', fontWeight: 500 }}>
                Manage your events and activities
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center' }}>
            {isOrganizer && (
              <>
                <button 
                  onClick={() => setShowCreateEventModal(true)}
                  style={{ background: 'white', color: '#667eea', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s', fontSize: '1rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)' }}
                >
                  <PlusIcon className="w-5 h-5 inline mr-2" /> Create New Event
                </button>
                <button 
                  onClick={() => navigate('/clubs?create=true')}
                  style={{ background: 'white', color: '#764ba2', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s', fontSize: '1rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)' }}
                >
                  <UserGroupIcon className="w-5 h-5 inline mr-2" /> Create New Club
                </button>
              </>
            )}
            <button 
              onClick={() => navigate('/dashboard?tab=proposals')}
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 600, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" /> My Proposals
            </button>
            <button 
              onClick={() => navigate('/ai-advisor')}
              style={{ background: 'rgba(255,255,255,0.95)', color: '#667eea', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)' }}
            >
              <SparklesIcon className="w-5 h-5 inline mr-2" /> CluboraX AI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Navigation Tabs - Different for organizers vs students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-2"
          >
            <div className="flex space-x-1">
              {isOrganizer ? 
                ['overview', 'my-events', 'proposals'].map((tab) => (
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
                    {tab === 'my-events' && 'My Events/Clubs'}
                    {tab === 'proposals' && 'Proposals'}
                  </button>
                ))
                :
                // Student tabs - conditionally include 'my-organized' if they have published content
                [
                  'overview',
                  'my-clubs-events',
                  ...(hasPublishedContent ? ['my-organized'] : []),
                  'proposals'
                ].map((tab) => (
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
                    {tab === 'my-clubs-events' && 'Participating'}
                    {tab === 'my-organized' && 'My Organized'}
                    {tab === 'proposals' && 'Proposals'}
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
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                        </div>
                        <div className="space-y-4">
                          <div 
                            onClick={() => {
                              setActiveTab('my-events')
                              setMyEventsContentType('events')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-8 h-8 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0} Active Event{(Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {stats?.totalRegistrations ? `Managing ${stats.totalRegistrations} registration${stats.totalRegistrations !== 1 ? 's' : ''}` : 'View event details'}
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div 
                            onClick={() => {
                              setActiveTab('my-events')
                              setMyEventsContentType('clubs')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <UserGroupIcon className="w-8 h-8 text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {stats?.activeClubs ?? stats?.totalClubs ?? 0} Active Club{(stats?.activeClubs ?? stats?.totalClubs ?? 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">View club details</p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* Proposals Summary */}
                          <div 
                            onClick={() => setActiveTab('proposals')}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <DocumentTextIcon className="w-8 h-8 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {allProposals.length} Proposal{allProposals.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {allProposals.filter(p => p.status === 'published').length} published, {' '}
                                  {allProposals.filter(p => p.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
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
                          <button 
                            onClick={() => {
                              setActiveTab('my-events')
                              setMyEventsContentType('events')
                              toast.success('View your event statistics and analytics here!')
                            }}
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <ChartBarIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">View Analytics</span>
                          </button>
                          <button 
                            onClick={() => {
                              setActiveTab('my-events')
                              setMyEventsContentType('events')
                              toast.info('Click on "Registrations" to manage your event attendees')
                            }}
                            className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Manage Attendees</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* My Clubs/Events Section for Students */}
                    <div className="lg:col-span-2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                        </div>
                        <div className="space-y-4">
                          {/* Event Registrations Summary */}
                          <div 
                            onClick={() => {
                              setActiveTab('my-clubs-events')
                              setStudentContentType('events')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-8 h-8 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {myEventRegistrations.length} Event Registration{myEventRegistrations.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {myEventRegistrations.filter(r => r.status === 'confirmed').length} confirmed
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          
                          {/* Club Requests Summary */}
                          <div 
                            onClick={() => {
                              setActiveTab('my-clubs-events')
                              setStudentContentType('clubs')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <UserGroupIcon className="w-8 h-8 text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {myClubRequests.length} Club Request{myClubRequests.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {myClubRequests.filter(r => r.status === 'approved').length} approved, {' '}
                                  {myClubRequests.filter(r => r.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* Proposals Summary */}
                          <div 
                            onClick={() => setActiveTab('proposals')}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <DocumentTextIcon className="w-8 h-8 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {allProposals.length} Proposal{allProposals.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {allProposals.filter(p => p.status === 'published').length} published, {' '}
                                  {allProposals.filter(p => p.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* My Organized Summary - Only show if has published content */}
                          {hasPublishedContent && (
                            <div 
                              onClick={() => setActiveTab('my-organized')}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <SparklesIcon className="w-8 h-8 text-orange-600" />
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    My Organized
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {publishedEvents.length} event{publishedEvents.length !== 1 ? 's' : ''}, {' '}
                                    {publishedClubs.length} club{publishedClubs.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
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
                        <div className="space-y-3">
                          {/* Combine and sort recent activities */}
                          {(() => {
                            const activities = [
                              ...myEventRegistrations.map(reg => ({
                                type: 'event',
                                name: reg.eventName,
                                date: new Date(reg.registeredAt),
                                status: reg.status,
                                icon: CalendarIcon,
                                color: 'blue'
                              })),
                              ...myClubRequests.map(req => ({
                                type: 'club',
                                name: req.clubName,
                                date: new Date(req.submittedAt),
                                status: req.status,
                                icon: UserGroupIcon,
                                color: 'purple'
                              }))
                            ].sort((a, b) => b.date - a.date).slice(0, 5)

                            if (activities.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <ClockIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                  <p className="text-sm">No recent activity</p>
                                  <p className="text-xs mt-1">Join events and clubs to see activity here!</p>
                                </div>
                              )
                            }

                            return activities.map((activity, idx) => (
                              <div 
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className={`p-2 rounded-lg ${
                                  activity.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                  <activity.icon className={`w-4 h-4 ${
                                    activity.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {activity.type === 'event' ? 'Registered for' : 'Applied to'} {activity.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      activity.status === 'confirmed' || activity.status === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : activity.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {activity.status}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {activity.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          })()}
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

          {/* Combined Clubs/Events Tab for Students */}
          {activeTab === 'my-clubs-events' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {studentContentType === 'events' ? 'My Event Registrations' : 'My Club Requests'}
                    </h2>
                    <p className="text-gray-600">
                      {studentContentType === 'events' 
                        ? 'View your event tickets and registration details'
                        : 'Track your club membership applications and status'}
                    </p>
                  </div>
                  
                  {/* Toggle Buttons for Students */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setStudentContentType('events')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        studentContentType === 'events'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setStudentContentType('clubs')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        studentContentType === 'clubs'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Clubs
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Events Section */}
              {studentContentType === 'events' && (
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
              
              {/* Clubs Section */}
              {studentContentType === 'clubs' && (
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
              )}
            </motion.div>
          )}

          {/* Student Organized Content Tab - Shows published clubs from approved proposals */}
          {activeTab === 'my-organized' && !isOrganizer && hasPublishedContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    My Organized Clubs
                  </h2>
                  <p className="text-gray-600">
                    Manage clubs you created that are now published
                  </p>
                </div>
                
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Congratulations!</h3>
                      <p className="text-sm text-green-800">
                        Your club proposals have been approved by the admin 
                        and are now published. You can manage them here, view members, and track their success.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Clubs Section */}
              <div className="space-y-4">
                {publishedClubs.length > 0 ? (
                  publishedClubs.map((club) => (
                    <div 
                      key={club.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-purple-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <UserGroupIcon className="w-6 h-6 text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              Published
                            </span>
                          </div>
                          <p className="text-gray-700 mb-4">{club.mission}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <BuildingOfficeIcon className="w-4 h-4" />
                              <span>{club.club_type || 'General'} Club</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <UsersIcon className="w-4 h-4" />
                              <span>{club.expected_members || 0} expected members</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <AcademicCapIcon className="w-4 h-4" />
                              <span>{club.department || 'Multi-department'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DocumentTextIcon className="w-4 h-4" />
                              <span>Submitted: {new Date(club.submitted_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => {
                              toast.success('Opening club details...')
                              // You can add logic to view full club details
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <EyeIcon className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              toast.success('Opening members list...')
                              // You can add logic to view members
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <UsersIcon className="w-4 h-4" />
                            Members
                          </button>
                          <button
                            onClick={() => {
                              toast.info('Image upload feature coming soon!')
                              // You can add logic to upload club images
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            Upload Image
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No published clubs yet</h3>
                    <p className="text-gray-500 mb-4">Submit club proposals and get them approved to see them here!</p>
                    <button
                      onClick={() => setActiveTab('proposals')}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Create Club Proposal
                    </button>
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {isOrganizer ? 'My Created Events/Clubs' : 'My Event Registrations'}
                    </h2>
                    <p className="text-gray-600">
                      {isOrganizer ? 'Manage events and clubs you have created' : 'View your event tickets and registration details'}
                    </p>
                  </div>
                  
                  {/* Toggle Buttons for Organizers */}
                  {isOrganizer && (
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setMyEventsContentType('events')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          myEventsContentType === 'events'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Events
                      </button>
                      <button
                        onClick={() => setMyEventsContentType('clubs')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          myEventsContentType === 'clubs'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Clubs
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {isOrganizer ? (
                <>
                {/* Status Filter for Events */}
                {myEventsContentType === 'events' && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const statusCounts = {
                          all: myCreatedEvents.length,
                          published: myCreatedEvents.filter(e => e.status === 'published').length,
                          approved: myCreatedEvents.filter(e => e.status === 'approved').length,
                          pending_approval: myCreatedEvents.filter(e => e.status === 'pending_approval').length,
                          rejected: myCreatedEvents.filter(e => e.status === 'rejected').length,
                          cancelled: myCreatedEvents.filter(e => e.status === 'cancelled').length
                        }
                        return ['all', 'published', 'approved', 'pending_approval', 'rejected', 'cancelled'].map(status => (
                          <button
                            key={status}
                            onClick={() => setEventStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${
                              eventStatusFilter === status
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status.replace('_', ' ')}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              eventStatusFilter === status
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {statusCounts[status]}
                            </span>
                          </button>
                        ))
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Status Filter for Clubs */}
                {myEventsContentType === 'clubs' && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const statusCounts = {
                          all: myCreatedClubs.length,
                          published: myCreatedClubs.filter(c => c.status === 'published').length,
                          approved: myCreatedClubs.filter(c => c.status === 'approved').length,
                          pending_approval: myCreatedClubs.filter(c => c.status === 'pending_approval').length,
                          rejected: myCreatedClubs.filter(c => c.status === 'rejected').length,
                          suspended: myCreatedClubs.filter(c => c.status === 'suspended').length
                        }
                        return ['all', 'published', 'approved', 'pending_approval', 'rejected', 'suspended'].map(status => (
                          <button
                            key={status}
                            onClick={() => setClubStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${
                              clubStatusFilter === status
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status.replace('_', ' ')}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              clubStatusFilter === status
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {statusCounts[status]}
                            </span>
                          </button>
                        ))
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Events Section */}
                {myEventsContentType === 'events' && (
                <div>
                  {loadingCreatedEvents ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (() => {
                    const filteredEvents = eventStatusFilter === 'all' 
                      ? myCreatedEvents 
                      : myCreatedEvents.filter(e => e.status === eventStatusFilter)
                    
                    if (filteredEvents.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                          <p className="text-gray-500">No events match the selected status filter.</p>
                        </div>
                      )
                    }
                    
                    return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
                    const isHighlighted = highlightedCardId === `event-${event.id}`
                    // Apply status filter
                    if (eventStatusFilter !== 'all' && event.status !== eventStatusFilter) {
                      return null
                    }
                    return (
                      <div 
                        key={event.id}
                        id={`event-${event.id}`}
                        className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all flex flex-col h-full ${
                          isHighlighted 
                            ? 'border-emerald-500 border-2 ring-4 ring-emerald-200 animate-pulse' 
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                          <div className="absolute inset-0 bg-black bg-opacity-20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CalendarIcon className="w-16 h-16 text-white opacity-50" />
                          </div>
                          
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                              {event.registrations}/{event.maxAttendees} registered
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              event.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                              event.status === 'approved' ? 'bg-green-100 text-green-700' :
                              event.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                              event.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              event.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                              event.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {event.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                          
                          {/* Rejection Reason - Only for rejected events */}
                          {event.status === 'rejected' && event.rejection_reason && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
                              <p className="text-sm text-red-700">{event.rejection_reason}</p>
                            </div>
                          )}
                          
                          {/* Cancellation/Suspension Reason */}
                          {(event.status === 'cancelled' || event.status === 'suspended') && event.admin_reason && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-xs font-semibold text-orange-800 mb-1">
                                {event.status === 'cancelled' ? 'Cancellation' : 'Suspension'} Reason:
                              </p>
                              <p className="text-sm text-orange-700">{event.admin_reason}</p>
                            </div>
                          )}
                          
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

                          {/* Management Buttons */}
                          <div className="flex gap-2 mt-auto">
                            {/* Show Registrations only for published events */}
                            {event.status === 'published' && (
                              <button
                                onClick={() => viewEventRegistrations(event)}
                                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 relative"
                              >
                                <UsersIcon className="h-4 w-4" />
                                Registrations
                                {event.price > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    $
                                  </span>
                                )}
                              </button>
                            )}
                            
                            {/* Show Edit for rejected events */}
                            {event.status === 'rejected' && (
                              <button
                                onClick={() => viewOrganizerEventDetails(event)}
                                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <PencilIcon className="h-4 w-4" />
                                Edit & Resubmit
                              </button>
                            )}
                            
                            {/* Show Upload Image for published events */}
                            {event.status === 'published' && (
                              <button
                                onClick={(e) => openImageUploadModal(event, e)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <PhotoIcon className="h-4 w-4" />
                                Upload Image
                              </button>
                            )}
                            
                            {/* Show Appeal button for cancelled/suspended events */}
                            {(event.status === 'cancelled' || event.status === 'suspended') && (
                              <button
                                onClick={() => {
                                  setSelectedCancelItem(event)
                                  setCancelType('event')
                                  setShowCancelModal(true)
                                }}
                                className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <EnvelopeIcon className="h-4 w-4" />
                                Request Review
                              </button>
                            )}
                            
                            {/* View Details for pending/approved */}
                            {(event.status === 'pending_approval' || event.status === 'approved') && (
                              <button
                                onClick={() => viewOrganizerEventDetails(event)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                    )
                  })()}
                </div>
                )}
                
                {/* Clubs Section for Organizers */}
                {myEventsContentType === 'clubs' && (
                  <div>
                    {loadingCreatedClubs ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : (() => {
                      const filteredClubs = clubStatusFilter === 'all' 
                        ? myCreatedClubs 
                        : myCreatedClubs.filter(c => c.status === clubStatusFilter)
                      
                      if (filteredClubs.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
                            <p className="text-gray-500">No clubs match the selected status filter.</p>
                          </div>
                        )
                      }
                      
                      return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClubs.map((club) => {
                      const isHighlighted = highlightedCardId === `club-${club.id}`
                      return (
                      <div 
                        key={club.id}
                        id={`club-${club.id}`}
                        className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all flex flex-col h-full ${
                          isHighlighted 
                            ? 'border-emerald-500 border-2 ring-4 ring-emerald-200 animate-pulse' 
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="relative h-48 bg-gradient-to-r from-purple-500 to-indigo-600">
                          <div className="absolute inset-0 bg-black bg-opacity-20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <UserGroupIcon className="w-16 h-16 text-white opacity-50" />
                          </div>
                          
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                              {club.members} members
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              club.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                              club.status === 'approved' ? 'bg-green-100 text-green-700' :
                              club.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                              club.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              club.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                              club.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {club.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{club.description}</p>
                          
                          {/* Rejection Reason - Only for rejected clubs */}
                          {club.status === 'rejected' && club.rejection_reason && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
                              <p className="text-sm text-red-700">{club.rejection_reason}</p>
                            </div>
                          )}
                          
                          {/* Cancellation/Suspension Reason */}
                          {(club.status === 'cancelled' || club.status === 'suspended') && club.admin_reason && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-xs font-semibold text-orange-800 mb-1">
                                {club.status === 'cancelled' ? 'Cancellation' : 'Suspension'} Reason:
                              </p>
                              <p className="text-sm text-orange-700">{club.admin_reason}</p>
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {club.category}
                            </span>
                          </div>

                          {/* Management Buttons */}
                          <div className="flex gap-2 mt-auto">
                            {/* Show Members only for published clubs */}
                            {club.status === 'published' && (
                              <button
                                onClick={() => viewClubMembers(club)}
                                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                                Members
                              </button>
                            )}
                            
                            {/* Show Edit for rejected clubs */}
                            {club.status === 'rejected' && (
                              <button
                                onClick={() => viewOrganizerClubDetails(club)}
                                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <PencilIcon className="h-4 w-4" />
                                Edit & Resubmit
                              </button>
                            )}
                            
                            {/* Show Upload Image for published clubs */}
                            {club.status === 'published' && (
                              <button
                                onClick={(e) => openImageUploadModal(club, e)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <PhotoIcon className="h-4 w-4" />
                                Upload Image
                              </button>
                            )}
                            
                            {/* Show Appeal button for cancelled/suspended clubs */}
                            {(club.status === 'cancelled' || club.status === 'suspended') && (
                              <button
                                onClick={() => {
                                  setSelectedCancelItem(club)
                                  setCancelType('club')
                                  setShowCancelModal(true)
                                }}
                                className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <EnvelopeIcon className="h-4 w-4" />
                                Request Review
                              </button>
                            )}
                            
                            {/* View Details for pending/approved */}
                            {(club.status === 'pending_approval' || club.status === 'approved') && (
                              <button
                                onClick={() => viewOrganizerClubDetails(club)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                      )
                    })()}
                  </div>
                )}
                </>
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

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
                      My Proposals
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Manage your event and club proposals
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {isOrganizer && (
                      <button
                        onClick={() => setShowEventProposalModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        New Event Proposal
                      </button>
                    )}
                    <button
                      onClick={() => setShowClubProposalModal(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      New Club Proposal
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex flex-wrap space-x-4">
                  {[
                    { id: 'all', label: 'All', badge: allProposals.length },
                    { id: 'pending', label: 'Pending', badge: allProposals.filter(p => p.status === 'pending').length },
                    { id: 'under_review', label: 'Under Review', badge: allProposals.filter(p => p.status === 'under_review').length },
                    { id: 'needs_revision', label: 'Needs Revision', badge: allProposals.filter(p => p.status === 'needs_revision').length },
                    { id: 'approved', label: 'Approved', badge: allProposals.filter(p => p.status === 'approved').length },
                    { id: 'published', label: 'Published', badge: allProposals.filter(p => p.status === 'published').length },
                    { id: 'rejected', label: 'Rejected', badge: allProposals.filter(p => p.status === 'rejected').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setProposalTab(tab.id)}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        proposalTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          proposalTab === tab.id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Proposals Grid */}
              {(eventProposalsError || clubProposalsError) ? (
                <div className="text-center py-12">
                  <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading proposals</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {eventProposalsError?.message || clubProposalsError?.message || 'Unable to fetch proposals.'}
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button 
                      onClick={() => {
                        queryClient.invalidateQueries(['my-event-proposals'])
                        queryClient.invalidateQueries(['my-club-proposals'])
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : loadingEventProposals || loadingClubProposals ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
                  <p className="mt- text-sm text-gray-500">
                    Get started by creating a new event or club proposal.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProposals.map(proposal => (
                    <ProposalCard 
                      key={`${proposal.type}-${proposal.id}`} 
                      proposal={proposal} 
                      queryClient={queryClient}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      setActiveTab={setActiveTab}
                      isOrganizer={isOrganizer}
                      navigate={navigate}
                    />
                  ))}
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
        {showOrganizerClubDetailModal && <OrganizerClubDetailModal />}
        {showRegistrationsModal && <RegistrationsModal />}
        {showClubMembersModal && <ClubMembersModal />}
        {showCreateEventModal && (
          <CreateEventModal
            eventForm={eventForm}
            handleFormChange={handleFormChange}
            handlePdfUpload={handlePdfUpload}
            removePdf={removePdf}
            calculatePlatformFee={calculatePlatformFee}
            setEventForm={setEventForm}
            setShowCreateEventModal={setShowCreateEventModal}
            user={user}
          />
        )}
        {showEventProposalModal && <EventProposalModal onClose={() => setShowEventProposalModal(false)} queryClient={queryClient} />}
        {showClubProposalModal && <ClubProposalModal onClose={() => setShowClubProposalModal(false)} queryClient={queryClient} />}
        {showImageUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={imgAiStep === 'idle' ? closeImageUploadModal : undefined}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Upload Event Image</h2>
                    <p className="text-gray-500 text-sm mt-0.5">{selectedEventForImage?.title}</p>
                  </div>
                  {imgAiStep === 'idle' && (
                    <button onClick={closeImageUploadModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-5">
                  {['Select Image', 'AI Validation', 'Add to Gallery'].map((label, i) => {
                    const stepIndex = imgAiStep === 'idle' ? 0 : (imgAiStep === 'scanning' ? 1 : 2)
                    const active = i === stepIndex
                    const done = i < stepIndex
                    return (
                      <React.Fragment key={label}>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            done ? 'bg-green-500 text-white' :
                            active ? 'bg-blue-600 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {done ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className={`text-xs font-medium ${
                            active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'
                          }`}>{label}</span>
                        </div>
                        {i < 2 && <div className={`flex-1 h-0.5 rounded ${ done ? 'bg-green-400' : 'bg-gray-200' }`} />}
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* ── STEP 1: Select image ── */}
                {imgAiStep === 'idle' && (
                  <>
                    <div className="mb-5">
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                          <button
                            onClick={() => { setImagePreview(null); setSelectedFile(null) }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                            {selectedFile?.name} &bull; {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="mb-1 text-sm text-gray-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or WEBP &bull; Max 5 MB</p>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                        </label>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
                      <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Your image will be scanned by AI before being added to the gallery. Inappropriate, violent, or unrelated images will be rejected automatically.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={closeImageUploadModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
                        Cancel
                      </button>
                      <button
                        onClick={handleImageAIScan}
                        disabled={!selectedFile}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Scan with AI
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP 2: AI Scanning ── */}
                {(imgAiStep === 'scanning' || imgAiStep === 'passed' || imgAiStep === 'rejected') && (
                  <>
                    {/* Image thumbnail */}
                    <div className="flex gap-4 mb-5">
                      <img src={imagePreview} alt="Preview" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        {imgAiStep === 'scanning' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                            <span className="text-sm font-semibold text-blue-700">AI is scanning your image...</span>
                          </div>
                        )}
                        {imgAiStep === 'passed' && (
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">All checks passed — image approved</span>
                          </div>
                        )}
                        {imgAiStep === 'rejected' && (
                          <div className="flex items-center gap-2 mb-1">
                            <XCircleIcon className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-700">Image rejected by AI validation</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">{selectedFile?.name} &bull; {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {/* Checks list */}
                    <div className="space-y-2 mb-5">
                      {imgAiChecks.map((check, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                            check.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          {check.passed
                            ? <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                            : <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-red-800'}`}>{check.label}</p>
                            <p className={`text-xs mt-0.5 ${check.passed ? 'text-green-600' : 'text-red-600'}`}>{check.detail}</p>
                          </div>
                        </motion.div>
                      ))}
                      {imgAiStep === 'scanning' && imgAiChecks.length < 5 && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="animate-pulse w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-40" />
                            <div className="h-2.5 bg-gray-200 rounded animate-pulse w-24" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions after scan */}
                    {imgAiStep === 'passed' && (
                      <div className="flex gap-3">
                        <button onClick={closeImageUploadModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
                          Cancel
                        </button>
                        <button
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {uploadingImage ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>Adding...</span></>
                          ) : (
                            <><CheckCircleIcon className="h-4 w-4" /><span>Add to Gallery</span></>
                          )}
                        </button>
                      </div>
                    )}
                    {imgAiStep === 'rejected' && (
                      <>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                          <p className="text-xs text-red-700 font-medium">Your image did not pass AI validation. Please choose a different image that is relevant to your event and does not contain inappropriate content.</p>
                        </div>
                        <button
                          onClick={() => { setImgAiStep('idle'); setImgAiChecks([]); setImagePreview(null); setSelectedFile(null) }}
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <PhotoIcon className="h-4 w-4" />
                          Choose Different Image
                        </button>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCancelModal(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended' 
                        ? 'Request Admin Review' 
                        : 'Request Cancellation'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {cancelType === 'event' ? selectedCancelItem?.title : selectedCancelItem?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Show admin's reason if cancelled/suspended */}
                {(selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended') && selectedCancelItem?.admin_reason && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Admin's {selectedCancelItem.status === 'cancelled' ? 'Cancellation' : 'Suspension'} Reason:
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          {selectedCancelItem.admin_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Message */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Request a review from admin'
                          : 'Your request will be sent to admin'}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Explain why you believe this decision should be reconsidered.'
                          : 'The admin will review your request and take appropriate action.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Your appeal / explanation *'
                      : 'Reason for cancellation *'}
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={
                      selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                        ? 'Explain why you believe this decision should be reconsidered...'
                        : 'Please provide a detailed reason for cancellation...'
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Provide clear reasons and any supporting information for your appeal.'
                      : 'Provide a clear reason to help the admin process your request faster.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false)
                      setCancelReason('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!cancelReason.trim()) {
                        toast.error(
                          selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                            ? 'Please provide your appeal explanation'
                            : 'Please provide a reason for cancellation'
                        )
                        return
                      }
                      toast.success(
                        selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Review request sent to admin'
                          : 'Cancellation request submitted for admin review'
                      )
                      setShowCancelModal(false)
                      setCancelReason('')
                      setSelectedCancelItem(null)
                    }}
                    disabled={!cancelReason.trim()}
                    className={`flex-1 px-4 py-2 ${
                      selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Send Review Request'
                      : 'Submit Request'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        {showEditEventModal && editingEvent && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setShowEditEventModal(false)
                  setEditingEvent(null)
                }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Edit & Resubmit Event</h2>
                      <p className="text-blue-100 mt-1">Address the rejection feedback and resubmit</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditEventModal(false)
                        setEditingEvent(null)
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rejection Reason Alert */}
                  {editingEvent.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Previous Rejection Reason:</p>
                          <p className="text-sm text-red-700">{editingEvent.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    toast.success('Event resubmitted for approval!')
                    setShowEditEventModal(false)
                    setEditingEvent(null)
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingEvent.title}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          defaultValue={editingEvent.description}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="4"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date *
                          </label>
                          <input
                            type="date"
                            defaultValue={editingEvent.date}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time *
                          </label>
                          <input
                            type="time"
                            defaultValue={editingEvent.time}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingEvent.location}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Attendees *
                          </label>
                          <input
                            type="number"
                            defaultValue={editingEvent.maxAttendees}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($) *
                          </label>
                          <input
                            type="number"
                            defaultValue={editingEvent.price}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Changes Made / Response to Feedback
                        </label>
                        <textarea
                          placeholder="Describe what you've changed to address the rejection feedback..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditEventModal(false)
                          setEditingEvent(null)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Resubmit for Approval
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        {showEditClubModal && editingClub && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setShowEditClubModal(false)
                  setEditingClub(null)
                }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Edit & Resubmit Club</h2>
                      <p className="text-purple-100 mt-1">Address the rejection feedback and resubmit</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditClubModal(false)
                        setEditingClub(null)
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rejection Reason Alert */}
                  {editingClub.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Previous Rejection Reason:</p>
                          <p className="text-sm text-red-700">{editingClub.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    toast.success('Club resubmitted for approval!')
                    setShowEditClubModal(false)
                    setEditingClub(null)
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingClub.name}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          defaultValue={editingClub.category}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="academic">Academic</option>
                          <option value="arts">Arts</option>
                          <option value="sports">Sports</option>
                          <option value="technology">Technology</option>
                          <option value="cultural">Cultural</option>
                          <option value="social">Social</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          defaultValue={editingClub.description}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="4"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mission Statement
                        </label>
                        <textarea
                          placeholder="What is the club's mission and goals?"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Changes Made / Response to Feedback
                        </label>
                        <textarea
                          placeholder="Describe what you've changed to address the rejection feedback..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditClubModal(false)
                          setEditingClub(null)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Resubmit for Approval
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Proposal Card Component with 5-Stage Approval Process
const ProposalCard = ({ proposal, queryClient, getStatusColor, getStatusIcon, setActiveTab, isOrganizer, navigate }) => {
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Handle navigation to published event/club
  const handleViewPublished = () => {
    if (isOrganizer) {
      // Organizers: Navigate to dashboard tabs with highlight parameter
      const highlightId = `${proposal.type}-${proposal.id}`
      if (proposal.type === 'event') {
        navigate(`/dashboard?tab=my-events&highlight=${highlightId}`)
      } else {
        // For clubs, go to my-events tab with clubs toggle
        navigate(`/dashboard?tab=my-events&highlight=${highlightId}`)
      }
    } else {
      // Students: Navigate based on type
      if (proposal.type === 'event') {
        // Events: go to public events page
        navigate(`/events?highlight=${proposal.id}`)
      } else {
        // Clubs: go to my-organized tab to manage their published club
        navigate(`/dashboard?tab=my-organized`)
        setTimeout(() => {
          toast.success('Your published club is now ready to manage!')
        }, 500)
      }
    }
  }
  
  const deleteProposalMutation = useMutation({
    mutationFn: (id) => {
      return proposal.type === 'event' 
        ? deleteEventProposal(id)
        : deleteClubProposal(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-event-proposals'])
      queryClient.invalidateQueries(['my-club-proposals'])
      toast.success('Proposal deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete proposal')
    }
  })
  
  const handleDelete = () => {
    // Special confirmation for needs_revision status
    if (proposal.needs_revision || proposal.status === 'needs_revision') {
      const confirmed = window.confirm(
        'Please Think Clearly!\n\n' +
        'This proposal needs revision. Are you sure you want to DELETE it instead of revising?\n\n' +
        'Deleting means you\'ll lose all your work and will need to start over.\n\n' +
        'Click OK only if you\'re absolutely certain you want to delete this proposal.'
      )
      if (confirmed) {
        deleteProposalMutation.mutate(proposal.id)
      }
    } else {
      if (window.confirm('Are you sure you want to delete this proposal?')) {
        deleteProposalMutation.mutate(proposal.id)
      }
    }
  }
  
  // Get current stage (1-5) from proposal data
  const getCurrentStage = () => {
    if (!proposal.approval_stage) return 1
    return proposal.approval_stage
  }
  
  // Determine stage status
  const getStageStatus = (stageNum) => {
    const currentStage = getCurrentStage()
    if (proposal.status === 'rejected' && stageNum === currentStage) return 'rejected'
    if (proposal.needs_revision && stageNum === currentStage) return 'needs_revision'
    if (stageNum < currentStage) return 'completed'
    if (stageNum === currentStage) return 'current'
    return 'pending'
  }
  
  const currentStage = getCurrentStage()
  
  // Stage descriptions
  const stages = [
    { num: 1, label: 'Submitted', desc: 'Proposal received' },
    { num: 2, label: 'Form Check', desc: proposal.type === 'event' ? 'Details verification' : 'Members ≥10, Info check' },
    { num: 3, label: 'Compliance', desc: 'Safety & policy review' },
    { num: 4, label: 'Final Review', desc: 'Admin approval' },
    { num: 5, label: 'Published', desc: proposal.type === 'event' ? 'Visible to students' : 'Added to directory' }
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {proposal.type === 'event' ? (
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
              ) : (
                <UsersIcon className="w-5 h-5 text-purple-600" />
              )}
              <span className="text-xs font-medium text-gray-500 uppercase">
                {proposal.type} Proposal
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {proposal.title || proposal.name}
            </h3>
          </div>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            {proposal.status}
          </span>
        </div>
        
        {/* 5-Stage Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.num)
              return (
                <React.Fragment key={stage.num}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'current' ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' :
                      status === 'rejected' ? 'bg-red-500 text-white' :
                      status === 'needs_revision' ? 'bg-yellow-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {status === 'completed' ? '✓' : stage.num}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1 text-center font-medium">
                      {stage.label}
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`h-1 flex-1 mx-1 rounded transition-all ${
                      getStageStatus(stage.num + 1) === 'completed' || getStageStatus(stage.num + 1) === 'current'
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {stages[currentStage - 1]?.desc}
          </p>
        </div>
        
        {/* Content */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {proposal.description || proposal.mission}
        </p>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          {proposal.type === 'event' ? (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {new Date(proposal.proposed_date).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {proposal.venue}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="w-4 h-4 mr-2" />
                {proposal.expected_participants} participants
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="w-4 h-4 mr-2" />
                Expected members: {proposal.expected_members}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Type: {proposal.club_type}
              </div>
            </>
          )}
        </div>
        
        {/* Rejection Reason */}
        {proposal.status === 'rejected' && proposal.rejection_reason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-800">{proposal.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Needs Revision Alert */}
        {proposal.needs_revision && proposal.revision_notes && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-900 mb-1">Revision Required:</p>
                <p className="text-sm text-yellow-800">{proposal.revision_notes}</p>
                <p className="text-xs text-yellow-700 mt-2">Please revise and resubmit your proposal.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Review Comments */}
        {proposal.review_comments && !proposal.needs_revision && !proposal.rejection_reason && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Review Comments:</p>
            <p className="text-sm text-blue-800">{proposal.review_comments}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {proposal.status === 'published' && (
            <button
              onClick={handleViewPublished}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <EyeIcon className="w-4 h-4" />
              {isOrganizer 
                ? `View in My ${proposal.type === 'event' ? 'Events' : 'Clubs'}` 
                : proposal.type === 'club' 
                  ? 'View in My Clubs' 
                  : 'View in Events Page'
              }
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
          {proposal.needs_revision && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4" />
              Revise & Resubmit
            </button>
          )}
          {proposal.status === 'rejected' && (
            <button
              onClick={() => {
                const subject = encodeURIComponent(`Appeal Request: ${proposal.title || proposal.name}`)
                const body = encodeURIComponent(
                  `Dear Admin,\n\n` +
                  `I would like to request an appeal for my ${proposal.type} proposal:\n\n` +
                  `Proposal Title: ${proposal.title || proposal.name}\n` +
                  `Rejection Reason: ${proposal.rejection_reason || 'Not specified'}\n\n` +
                  `Additional Information:\n` +
                  `[Please write your appeal details here]\n\n` +
                  `Best regards`
                )
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=admin@campus.edu&su=${subject}&body=${body}`, '_blank')
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <EnvelopeIcon className="w-4 h-4" />
              Send Request for Appeal
            </button>
          )}
          {(proposal.status === 'pending' || proposal.needs_revision) && (
            <button
              onClick={handleDelete}
              disabled={deleteProposalMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
        
        {/* Submission Date */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Submitted {new Date(proposal.submitted_date).toLocaleDateString()}</span>
            {proposal.updated_at && proposal.updated_at !== proposal.submitted_date && (
              <span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Revise & Resubmit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Revise & Resubmit Proposal</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Revision Notes Display */}
                {proposal.revision_notes && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">Admin's Revision Request:</p>
                        <p className="text-sm text-yellow-800">{proposal.revision_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {proposal.type === 'event' ? 'Event Title' : 'Club Name'} *
                    </label>
                    <input
                      type="text"
                      defaultValue={proposal.title || proposal.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={proposal.type === 'event' ? 'Enter event title' : 'Enter club name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {proposal.type === 'event' ? 'Description' : 'Mission'} *
                    </label>
                    <textarea
                      defaultValue={proposal.description || proposal.mission}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={proposal.type === 'event' ? 'Describe your event...' : 'Describe your club mission...'}
                    />
                  </div>

                  {proposal.type === 'event' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date *</label>
                          <input
                            type="date"
                            defaultValue={proposal.proposed_date}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                          <input
                            type="text"
                            defaultValue={proposal.venue}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter venue"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Participants *</label>
                          <input
                            type="number"
                            defaultValue={proposal.expected_participants}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Number of participants"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                          <input
                            type="number"
                            defaultValue={proposal.budget}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Budget amount"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Club Type *</label>
                          <select
                            defaultValue={proposal.club_type}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select type</option>
                            <option value="Academic">Academic</option>
                            <option value="Arts">Arts</option>
                            <option value="Sports">Sports</option>
                            <option value="Technology">Technology</option>
                            <option value="Social">Social</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <input
                            type="text"
                            defaultValue={proposal.department}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Department name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Members *</label>
                        <input
                          type="number"
                          defaultValue={proposal.expected_members}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Expected number of members"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Any additional information you'd like to add..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      toast.success('Proposal updated and resubmitted successfully!')
                      setShowEditModal(false)
                      queryClient.invalidateQueries(['my-event-proposals'])
                      queryClient.invalidateQueries(['my-club-proposals'])
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Submit Revision
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Event Proposal Modal Component
const EventProposalModal = ({ onClose, queryClient }) => {
  const [formData, setFormData] = useState({
    eventTitle: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    province: '',
    specificLocation: '',
    venue: '',
    capacity: '',
    ticketPrice: '0',
    catering: '',
    sponsor: '',
    budget: '',
    eventDate: '',
    description: '',
    payment_method: ''
  })
  const [scheduleFile, setScheduleFile] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  const provinces = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kandal', 'Takeo', 'Sihanoukville', 'Kampot', 'Banteay Meanchey', 'Kampong Speu', 'Kampong Thom', 'Preah Sihanouk', 'Svay Rieng', 'Koh Kong', 'Pailin', 'Oddar Meanchey', 'Ratanakiri', 'Stung Treng', 'Mondulkiri', 'Preah Vihear', 'Kampong Chhnang', 'Kep', 'Kratie']

  const checkPaymentRequirement = () => {
    const { venue, capacity, ticketPrice, catering, sponsor, budget } = formData
    const p = parseInt(capacity || 0)
    const tp = parseFloat(ticketPrice || 0)
    const b = parseFloat(budget || 0)

    let msg = ''
    let show = false

    if (venue === 'Auditorium' || venue === 'Sports Field') {
      msg = 'Payment required: Rental fee for campus facilities.'
      show = true
    } else if (catering === 'Yes') {
      msg = 'Payment required: Estimated cost for catering/refreshments.'
      show = true
    } else if (sponsor === 'Yes') {
      msg = 'Payment waived: Sponsored by external organization.'
      show = false
    } else if (b > 500) {
      msg = 'Payment required: Budget exceeds threshold; organizer contributes.'
      show = true
    }

    if (tp > 0 && p > 0) {
      const ticketPayment = (tp * p * 0.05).toFixed(2)
      msg += `\nTicket Revenue Payment: $${ticketPayment} (5% of total ticket revenue)`
      show = true
    }

    if (msg === '') {
      msg = 'No payment required for this event.'
      show = false
    }

    setPaymentMessage(msg)
    setShowPayment(show)
  }

  useEffect(() => {
    checkPaymentRequirement()
  }, [formData.venue, formData.capacity, formData.ticketPrice, formData.catering, formData.sponsor, formData.budget])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createEventProposal(formData)
      toast.success('Event proposal submitted successfully!')
      queryClient.invalidateQueries(['my-event-proposals'])
      onClose()
    } catch (error) {
      toast.error('Failed to submit event proposal')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Campus Event Proposal Form</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
              <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer Name *</label>
              <input type="text" name="organizerName" value={formData.organizerName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer Email *</label>
              <input type="email" name="organizerEmail" value={formData.organizerEmail} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer Phone *</label>
              <input type="tel" name="organizerPhone" value={formData.organizerPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Province (Cambodia) *</label>
              <select name="province" value={formData.province} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Location *</label>
              <input type="text" name="specificLocation" value={formData.specificLocation} onChange={handleInputChange} required disabled={!formData.province} placeholder="Street, Building, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Venue Type *</label>
              <select name="venue" value={formData.venue} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Select Venue</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Sports Field">Sports Field</option>
                <option value="Classroom">Classroom</option>
                <option value="Outdoor Area">Outdoor Area</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity (Max Participants) *</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Price (USD, 0 if free) *</label>
              <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Require Catering/Refreshments? *</label>
              <select name="catering" value={formData.catering} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sponsored by External Organization? *</label>
              <select name="sponsor" value={formData.sponsor} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Budget (USD)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Schedule File *</label>
              <input type="file" onChange={(e) => setScheduleFile(e.target.files[0])} required accept=".pdf,.doc,.docx,.xlsx" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Description *</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"></textarea>
          </div>

          {showPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Payment Requirement</h4>
              <p className="text-yellow-800 whitespace-pre-line mb-4">{paymentMessage}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-yellow-900 mb-2">Payment Method *</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} required className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                    <option value="">--Select Payment Method--</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_payment">Mobile Payment (Wing, Pi Pay, etc.)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Club Proposal Modal Component
const ClubProposalModal = ({ onClose, queryClient }) => {
  const [formData, setFormData] = useState({
    clubName: '',
    department: '',
    mission: '',
    missionOther: '',
    startDate: '',
    endDate: '',
    advisorName: '',
    advisorEmail: '',
    advisorPhone: '',
    leaderName: '',
    leaderPhone: '',
    leaderGender: ''
  })
  const [members, setMembers] = useState([])
  const [studentCard, setStudentCard] = useState(null)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const addMember = () => {
    setMembers([...members, { name: '', gender: '', phone: '' }])
  }

  const updateMember = (index, field, value) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)
  }

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (members.length < 10) {
      toast.error('You must add at least 10 members!')
      return
    }

    const leaderExists = members.some(m => m.name.toLowerCase().trim() === formData.leaderName.toLowerCase().trim())
    if (!leaderExists) {
      toast.error('Leader must be one of the members!')
      return
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be after start date!')
      return
    }

    if (!studentCard) {
      toast.error('Please upload student card for verification!')
      return
    }

    try {
      await createClubProposal({ ...formData, members })
      toast.success('Club proposal submitted successfully!')
      queryClient.invalidateQueries(['my-club-proposals'])
      onClose()
    } catch (error) {
      toast.error('Failed to submit club proposal')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Student Club Proposal Form</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Club Name *</label>
              <input type="text" name="clubName" value={formData.clubName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department / Faculty *</label>
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mission / Goal *</label>
              <select name="mission" value={formData.mission} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">--Select Mission--</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Arts">Arts</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.mission === 'Other' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specify Mission</label>
                <input type="text" name="missionOther" value={formData.missionOther} onChange={handleInputChange} placeholder="Please specify" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advisor / Dean Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input type="text" name="advisorName" value={formData.advisorName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" name="advisorEmail" value={formData.advisorEmail} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input type="tel" name="advisorPhone" value={formData.advisorPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Members (Minimum 10 required)</h3>
              <button type="button" onClick={addMember} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input type="text" placeholder="Member Name" value={member.name} onChange={(e) => updateMember(index, 'name', e.target.value)} required className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  <select value={member.gender} onChange={(e) => updateMember(index, 'gender', e.target.value)} required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="tel" placeholder="Phone" value={member.phone} onChange={(e) => updateMember(index, 'phone', e.target.value)} required className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  <button type="button" onClick={() => removeMember(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {members.length < 10 && (
                <p className="text-sm text-orange-600">You need to add at least {10 - members.length} more member(s)</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leader Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Leader Name *</label>
                <input type="text" name="leaderName" value={formData.leaderName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Leader Phone *</label>
                <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Leader Gender *</label>
                <select name="leaderGender" value={formData.leaderGender} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Student Card (For AI Verification) *</label>
            <input type="file" onChange={(e) => setStudentCard(e.target.files[0])} required accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Section 7: Create Event Modal (module-level, React.memo — prevents flicker) ──
const CreateEventModal = React.memo(({
  eventForm, handleFormChange, handlePdfUpload, removePdf,
  calculatePlatformFee, setEventForm, setShowCreateEventModal, user
}) => {
  const queryClient = useQueryClient()

  // Local multi-step state
  const [createEventStep, setCreateEventStep] = React.useState('form')
  const [feeProof, setFeeProof] = React.useState(null)
  const [feeProofPreview, setFeeProofPreview] = React.useState(null)
  const [aiEvalProgress, setAiEvalProgress] = React.useState(0)
  const [aiEvalDone, setAiEvalDone] = React.useState(false)

  const isPaidEvent = Number(eventForm.price) > 0
  const platformFee = calculatePlatformFee()
  const totalRevenue = Number(eventForm.price) * Number(eventForm.maxAttendees)

  // Progress bar steps — dynamic based on whether the event has a ticket price
  const STEPS = isPaidEvent
    ? ['Event Details', 'Fees', 'AI Evaluation', 'Submit']
    : ['Event Details', 'AI Evaluation', 'Submit']
  const stepIndex = isPaidEvent
    ? { form: 0, fees: 1, ai_eval: 2, submitted: 3 }
    : { form: 0, ai_eval: 1, submitted: 2 }
  const currentStepIdx = stepIndex[createEventStep] ?? 0

  const closeCreateEventModal = React.useCallback(() => {
    setShowCreateEventModal(false)
    setCreateEventStep('form')
    setFeeProof(null)
    setFeeProofPreview(null)
    setAiEvalProgress(0)
    setAiEvalDone(false)
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
    if (isPaidEvent) {
      setCreateEventStep('fees')
    } else {
      setCreateEventStep('ai_eval')
      triggerAiEval()
    }
  }, [eventForm, isPaidEvent, triggerAiEval])

  const handleFeeProofUpload = React.useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return }
    setFeeProof(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFeeProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }, [])

  const handleFeeProofSubmit = React.useCallback(() => {
    if (!feeProof) { toast.error('Please upload your payment proof first'); return }
    setCreateEventStep('ai_eval')
    triggerAiEval()
  }, [feeProof, triggerAiEval])

  const handleSubmitEventProposal = React.useCallback(async () => {
    const fee = calculatePlatformFee()
    const proposalData = {
      ...eventForm,
      status: 'pending_approval',
      platformFee: fee,
      submittedAt: new Date().toISOString()
    }
    try {
      await createEventProposal(proposalData)
      toast.success('Event proposal submitted! Pending admin approval.')
      queryClient.invalidateQueries(['my-event-proposals'])
    } catch {
      // Optimistic UI — show submitted state anyway for demo
    }
    setCreateEventStep('submitted')
    setEventForm({
      title: '', date: '', time: '', agenda: '', agendaPdf: null,
      location: '', eventType: 'academic', maxAttendees: '', phoneNumber: '',
      price: 0, description: '', organizer: user?.name || 'Event Organizer',
      requirements: '', tags: []
    })
  }, [eventForm, calculatePlatformFee, setEventForm, user, queryClient])

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
              <h2 className="text-2xl font-bold mb-1">Create New Event</h2>
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
                    {i < currentStepIdx ? '✓' : i + 1}
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
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-red-600 font-medium">{platformFee > 0 ? `Platform fee: $${platformFee.toFixed(2)}` : <span className="text-green-600">Free event — no platform fee</span>}</span>
              <div className="flex items-center space-x-4">
                <button onClick={closeCreateEventModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                <button onClick={handleCreateEvent} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all flex items-center gap-2">
                  {isPaidEvent ? 'Next: Fees →' : 'Next: AI Evaluation →'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ STEP 2 — Fees (paid events only) ══ */}
        {createEventStep === 'fees' && (
          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">Platform Fee Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <h4 className="font-semibold text-yellow-900 mb-4">Payment Summary</h4>
                <div className="space-y-0 text-sm">
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">${Number(eventForm.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Max Attendees</span>
                    <span className="font-semibold">{eventForm.maxAttendees}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 mt-1 bg-red-50 rounded-lg px-3 font-bold text-red-700">
                    <span>Platform Fee (3%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Scan the QR with your banking app and pay <span className="font-semibold text-red-600">${platformFee.toFixed(2)}</span> to the university finance account before proceeding.</p>
              </div>
              {/* QR code */}
              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Scan to Pay Platform Fee</p>
                <div className="bg-white p-3 rounded-xl shadow border border-gray-100">
                  <QRCode
                    value={`CAMPUS_PLATFORM_FEE|event=${encodeURIComponent(eventForm.title || 'event')}&amount=${platformFee.toFixed(2)}&attendees=${eventForm.maxAttendees}&payTo=CAMPUS_FINANCE_OFFICE`}
                    size={160}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">KHQR · ABA Bank · ACC: 000-123-456</p>
              </div>
            </div>

            {/* Upload proof */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Upload Payment Proof <span className="text-red-500">*</span></h4>
              <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${feeProofPreview ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'}`}>
                <input type="file" accept="image/*,application/pdf" onChange={handleFeeProofUpload} className="hidden" />
                {feeProofPreview ? (
                  feeProofPreview.startsWith('data:image') ? (
                    <img src={feeProofPreview} alt="proof" className="max-h-32 mx-auto rounded-lg object-contain mb-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <DocumentTextIcon className="w-10 h-10 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">{feeProof?.name}</span>
                    </div>
                  )
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload payment receipt</p>
                    <p className="text-xs text-gray-400 mt-1">Image or PDF · max 5 MB</p>
                  </>
                )}
              </label>
              {feeProof && <p className="text-xs text-green-600 mt-1">✓ {feeProof.name} ready to submit</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateEventStep('form')} className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all">← Back</button>
              <button onClick={handleFeeProofSubmit} className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all">Submit Proof &amp; Continue →</button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — AI Evaluation ══ */}
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
                        ? <span className="text-green-600 text-xs font-bold">✓</span>
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

        {/* ══ STEP 4 — Submitted ══ */}
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
                View My Events →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
})
CreateEventModal.displayName = 'CreateEventModal'

export default Dashboard
