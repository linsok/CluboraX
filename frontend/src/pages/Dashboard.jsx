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
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  GlobeAltIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { getDashboardStats, getRecentActivities, getUserCourses, getMyEventRegistrations, getMyClubMemberships } from '../api/dashboard'
import { verifyPayment as adminVerifyPayment } from '../api/admin'
import { getUserAchievements, getUserCertificates } from '../api/courses'
import { getEventRegistrations } from '../api/events'
import { getClubMembers, updateMembershipStatus, leaveClub } from '../api/clubs'
import EnhancedEventDetailsModal from '../components/Modals/EnhancedEventDetailsModal'
import { 
  getEventProposals, 
  getClubProposals, 
  deleteEventProposal, 
  deleteClubProposal,
  createEventProposal,
  createClubProposal,
  resubmitClubProposal,
  resubmitEventProposal
} from '../api/proposals'
import { apiClient } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import ProposalCard from '../components/Dashboard/ProposalCard'
import ClubProposalModal from '../components/Dashboard/ClubProposalModal'
import CreateEventModal from '../components/Dashboard/CreateEventModal'
import StatCard from '../components/Dashboard/StatCard'
import CourseCard from '../components/Dashboard/CourseCard'
import ActivityItem from '../components/Dashboard/ActivityItem'
import ClubRequestCard from '../components/Dashboard/ClubRequestCard'
import EventRegistrationCard from '../components/Dashboard/EventRegistrationCard'
import TicketModal from '../components/Dashboard/TicketModal'
import ClubRequestDetailModal from '../components/Dashboard/ClubRequestDetailModal'
import RegistrationsModal from '../components/Dashboard/RegistrationsModal'
import ClubMembersModal from '../components/Dashboard/ClubMembersModal'
import EventDetailModal from '../components/Dashboard/EventDetailModal'
import OrganizerClubDetailModal from '../components/Dashboard/OrganizerClubDetailModal'
import OrganizerEventCard from '../components/Dashboard/OrganizerEventCard'
import OrganizerClubCard from '../components/Dashboard/OrganizerClubCard'
import StudentOrganizedClubCard from '../components/Dashboard/StudentOrganizedClubCard'

// Utility function to format phone numbers
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // If it's a 10-digit number, format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  // If it's a 11-digit number (with leading 1), format as 1 (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  // Otherwise, return the original
  return phone
}

// Proposal Card Component with 5-Stage Approval Process
// Club Proposal Modal Component
const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [highlightedCardId, setHighlightedCardId] = useState(null)
  
  // Debug: Log current user
  console.log(' Current User:', user?.email, '| Role:', user?.role, '| ID:', user?.id)
  const isOrganizer = user?.role === 'organizer'
  
  // Handle URL tab parameter and highlight parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    const highlightParam = params.get('highlight')
    
    if (tabParam && (tabParam === 'overview' || tabParam === 'my-clubs' || tabParam === 'my-clubs-events' || tabParam === 'my-organized' || tabParam === 'my-events' || tabParam === 'proposals')) {
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
  const [imagePreview, setImagePreview] = useState([])
  const [selectedFile, setSelectedFile] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [imgAiStep, setImgAiStep] = useState('idle') // 'idle' | 'scanning' | 'passed' | 'rejected'
  const [imgAiChecks, setImgAiChecks] = useState([])
  const [studentContentType, setStudentContentType] = useState('events') // 'events' or 'clubs' for students
  const [eventRegFilter, setEventRegFilter] = useState('all') // 'all', 'confirmed', 'pending_payment'
  const [clubReqFilter, setClubReqFilter] = useState('all') // 'all', 'approved', 'pending'
  const [studentOrganizedType, setStudentOrganizedType] = useState('events') // 'events' or 'clubs' for student organized content
  const [organizerContentType, setOrganizerContentType] = useState('events') // 'events' or 'clubs' for organizer
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedCancelItem, setSelectedCancelItem] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelType, setCancelType] = useState('') // 'event' or 'club'
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showEditClubModal, setShowEditClubModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingClub, setEditingClub] = useState(null)
  const [showClubProposalModal, setShowClubProposalModal] = useState(false)
  
  // Proposals tab state - read from URL parameter
  const [proposalTab, setProposalTab] = useState('all') // 'all', 'pending', 'approved', 'rejected'
  const queryClient = useQueryClient()
  
  // Handle URL proposal tab parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const proposalTabParam = params.get('proposalTab')
    
    if (proposalTabParam && ['all', 'pending', 'approved', 'published', 'rejected'].includes(proposalTabParam)) {
      setProposalTab(proposalTabParam)
    }
  }, [location.search])
  
  // State for event creation form
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    agendaPdf: null,
    posterImage: null,
    location: '',
    eventType: 'academic',
    maxAttendees: '',
    phoneNumber: '',
    price: 0,
    description: '',
    organizer: user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.name || 'Event Organizer',
    requirements: '',
    tags: []
  })
  const [eventPosterPreview, setEventPosterPreview] = useState(null)
  
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
      if (!user) return []
      return await getUserAchievements(user)
    },
    enabled: !!user,
    retry: false, // Don't retry - endpoint may not exist yet
    staleTime: 15 * 60 * 1000,
  })

  const { data: certificates, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user) return []
      return await getUserCertificates(user)
    },
    enabled: !!user,
    retry: false, // Don't retry - endpoint may not exist yet
    staleTime: 15 * 60 * 1000,
  })

  // Fetch event proposals
  const { data: eventProposals = [], isLoading: loadingEventProposals, error: eventProposalsError } = useQuery({
    queryKey: ['my-event-proposals'],
    queryFn: async () => {
      const data = await getEventProposals()
      // Handle paginated response format
      const proposals = data?.results || data
      return Array.isArray(proposals) ? proposals : []
    },
    retry: 1,
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
    onError: (error) => {
      console.error('Failed to fetch event proposals:', error)
    }
  })
  
  // Fetch club proposals
  const { data: clubProposals = [], isLoading: loadingClubProposals, error: clubProposalsError } = useQuery({
    queryKey: ['my-club-proposals'],
    queryFn: async () => {
      console.log(' Fetching club proposals for user:', user?.email)
      const data = await getClubProposals()
      console.log(' Club proposals received:', data)
      // Handle paginated response format
      const proposals = data?.results || data
      return Array.isArray(proposals) ? proposals : []
    },
    retry: 1,
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
    onError: (error) => {
      console.error(' Failed to fetch club proposals:', error)
    }
  })
  
  // Ensure arrays (handle cases where API returns non-array data)
  const safeEventProposals = Array.isArray(eventProposals) ? eventProposals : []
  const safeClubProposals = Array.isArray(clubProposals) ? clubProposals : []
  
  // Debug logging
  console.log(' Safe Event Proposals:', safeEventProposals.length, safeEventProposals)
  console.log(' Safe Club Proposals:', safeClubProposals.length, safeClubProposals)
  
  // Filter published content (approved proposals that are now live)
  const publishedEvents = safeEventProposals.filter(p => p.status === 'published')
  const publishedClubs = safeClubProposals.filter(p => p.status === 'published')
  const hasPublishedContent = publishedEvents.length > 0 || publishedClubs.length > 0
  
  // Combine all proposals
  const allProposals = [
    ...safeEventProposals.map(p => ({ ...p, type: 'event' })),
    ...safeClubProposals.map(p => ({ ...p, type: 'club' }))
  ]
  
  console.log(' All Proposals Combined:', allProposals.length, allProposals)
  
  // Filter proposals based on active tab
  // Map student-friendly tab IDs to actual backend status values
  const filteredProposals = proposalTab === 'all' 
    ? allProposals 
    : proposalTab === 'pending'
    ? allProposals.filter(p => p.status === 'pending_review' || p.status === 'returned_for_revision')
    : allProposals.filter(p => p.status === proposalTab)

  const isLoading = statsLoading || activitiesLoading || coursesLoading || achievementsLoading || certificatesLoading

  // Since we're handling errors gracefully with fallback data, we don't need to log them
  // The console.warn messages in the query functions provide sufficient debugging info


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
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending_payment':
        return 'bg-blue-100 text-blue-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'published':
        return 'bg-emerald-100 text-emerald-800'
      case 'needs_revision':
      case 'returned_for_revision':
        return 'bg-orange-100 text-orange-800'
      case 'returned':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get user-friendly status label for student view
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_review':
        return 'Pending'
      case 'pending_payment':
        return 'Pending Payment'
      case 'returned_for_revision':
        return 'Pending' // Show as Pending when student resubmits
      case 'approved':
        return 'Approved'
      case 'published':
        return 'Published'
      case 'rejected':
        return 'Rejected'
      default:
        return status ? status.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown'
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
      case 'pending_review':
      case 'pending_payment':
      case 'returned_for_revision':
      case 'under_review':
        return <ClockIcon className="w-5 h-5" />
      case 'needs_revision':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'returned':
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
    // Pass real registration data to modal - no hardcoding
    setSelectedEvent(registration)
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
    
    // Use real event data - no hardcoding
    setSelectedEvent(event)
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
    
    // Use real club data
    setSelectedOrganizerClub(club)
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
    setImagePreview([])
    setSelectedFile([])
    setAlbumName('')
    setImgAiStep('idle')
    setImgAiChecks([])
  }

  // Handler for viewing event payments
  const viewEventPayments = (event) => {
    const registrations = myEventRegistrations.filter(reg => reg.event_id === event.id || reg.id === event.id)
    setSelectedEventForRegistrations(event)
    setShowRegistrationsModal(true)
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

  // Handler for image file selection (multiple files)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Each image must be less than 5MB`)
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return
      }
    }
    
    setSelectedFile(files)
    
    // Generate previews for all selected files
    const previews = []
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result)
        if (previews.length === files.length) {
          setImagePreview(previews)
        }
      }
      reader.readAsDataURL(file)
    })
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
    if (!selectedFile || selectedFile.length === 0) {
      toast.error('Please select at least one image')
      return
    }
    
    setUploadingImage(true)
    try {
      const item = selectedEventForImage
      
      // Prepare form data
      const formData = new FormData()
      
      // Determine if it's an event or club
      const isEvent = item.title && !item.name
      const isClub = item.name && !item.title
      
      // Set title and gallery type (don't link event/club IDs since these might be proposals)
      if (isEvent) {
        formData.append('title', `${item.title} - Gallery`)
        formData.append('gallery_type', 'event')
      } else if (isClub) {
        formData.append('title', `${item.name} - Gallery`)
        formData.append('gallery_type', 'club')
      } else {
        formData.append('title', `${item.title || item.name} - Gallery`)
        formData.append('gallery_type', 'general')
      }
      
      formData.append('description', item.description || '')
      formData.append('is_public', 'true')
      
      // Add album name (default to "Main Album" if not provided)
      formData.append('album_name', albumName || 'Main Album')
      
      // Append all selected images
      selectedFile.forEach(file => {
        formData.append('images', file)
      })
      
      // Upload to gallery
      await apiClient.post('/api/gallery/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success(`${selectedFile.length} image(s) added to gallery!`)
      queryClient.invalidateQueries(['gallery'])
      closeImageUploadModal()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to upload image'
      toast.error(errorMsg)
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

  // Event Registration Card Component
  // Ticket Modal Component
  // Club Request Detail Modal
  // Event Registrations Modal
  // Club Members Modal
  // Event Detail Modal

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">CluboraX</span>
        </div>

        {/* Dual-ring spinner */}
        <div className="relative w-14 h-14 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>

        <p className="text-sm font-medium text-gray-400 tracking-wide">Loading your dashboard…</p>

        {/* Animated bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{ animation: 'loadingBar 1.4s ease-in-out infinite' }}
          />
        </div>

        <style>{`
          @keyframes loadingBar {
            0%   { transform: translateX(-100%); }
            50%  { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
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
                  <PlusIcon className="w-5 h-5 inline mr-2" /> Create Event Proposal
                </button>
                <button 
                  onClick={() => setShowClubProposalModal(true)}
                  style={{ background: 'white', color: '#764ba2', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s', fontSize: '1rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)' }}
                >
                  <UserGroupIcon className="w-5 h-5 inline mr-2" /> Create Club Proposal
                </button>
              </>
            )}
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    onClick={() => navigate(`/dashboard?tab=${tab}`)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'my-events' && 'My Events & Clubs'}
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
                    onClick={() => navigate(`/dashboard?tab=${tab}`)}
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
                          {/* Events Overview - No longer clickable */}
                          <div 
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-8 h-8 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0} Active Event{(Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {stats?.totalRegistrations ? `Managing ${stats.totalRegistrations} registration${stats.totalRegistrations !== 1 ? 's' : ''}` : 'Events you organize'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Clubs Overview - No longer clickable */}
                          <div 
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                          >
                            <div className="flex items-center gap-3">
                              <UserGroupIcon className="w-8 h-8 text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {stats?.activeClubs ?? stats?.totalClubs ?? 0} Active Club{(stats?.activeClubs ?? stats?.totalClubs ?? 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">Clubs you manage</p>
                              </div>
                            </div>
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
                              setActiveTab('proposals')
                              toast.info('View and manage your proposals here!')
                            }}
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <DocumentTextIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">View Proposals</span>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myClubRequests.length > 0 ? (
                  myClubRequests.map((request) => (
                    <ClubRequestCard key={request.id} request={request} getStatusColor={getStatusColor} viewClubDetails={viewClubDetails} formatDate={formatDate} />
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
                <>
                  {/* Filter Toolbar */}
                  <div className="flex gap-2 mb-6">
                    {[
                      { id: 'all', label: 'All Registrations' },
                      { id: 'confirmed', label: 'Confirmed' },
                      { id: 'pending_payment', label: 'Pending Payment' }
                    ].map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setEventRegFilter(filter.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          eventRegFilter === filter.id
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myEventRegistrations.filter(reg => eventRegFilter === 'all' || reg.status === eventRegFilter).length > 0 ? (
                      myEventRegistrations
                        .filter(reg => eventRegFilter === 'all' || reg.status === eventRegFilter)
                        .map((registration) => (
                          <EventRegistrationCard key={registration.id} registration={registration} getStatusColor={getStatusColor} viewEvent={viewEvent} formatDate={formatDate} />
                        ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
                        <p className="text-gray-500">Try changing your filters or browse events!</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Clubs Section */}
              {studentContentType === 'clubs' && (
                <>
                  {/* Filter Toolbar */}
                  <div className="flex gap-2 mb-6">
                    {[
                      { id: 'all', label: 'All Requests' },
                      { id: 'approved', label: 'Approved' },
                      { id: 'pending', label: 'Pending' }
                    ].map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setClubReqFilter(filter.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          clubReqFilter === filter.id
                            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myClubRequests.filter(req => clubReqFilter === 'all' || req.status === clubReqFilter).length > 0 ? (
                      myClubRequests
                        .filter(req => clubReqFilter === 'all' || req.status === clubReqFilter)
                        .map((request) => (
                          <ClubRequestCard key={request.id} request={request} getStatusColor={getStatusColor} viewClubDetails={viewClubDetails} formatDate={formatDate} />
                        ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No club requests found</h3>
                        <p className="text-gray-500">Try changing your filters or apply for new clubs!</p>
                      </div>
                    )}
                  </div>
                </>
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
              <div>
                {publishedClubs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {publishedClubs.map((club) => (
                      <StudentOrganizedClubCard
                        key={club.id}
                        club={club}
                        setSelectedOrganizerClub={setSelectedOrganizerClub}
                        setShowOrganizerClubDetailModal={setShowOrganizerClubDetailModal}
                        viewClubMembers={viewClubMembers}
                        openImageUploadModal={openImageUploadModal}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No published clubs yet</h3>
                    <p className="text-gray-500 mb-4">Submit club proposals and get them approved to see them here!</p>
                    <button
                      onClick={() => setShowClubProposalModal(true)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Create Club Proposal
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* My Events & Clubs Tab Content - For Organizers Only */}
          {activeTab === 'my-events' && isOrganizer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">My Events & Clubs</h2>
                  <p className="text-gray-600 text-sm">Manage events and clubs you've created and published</p>
                </div>
                {/* Toggle Buttons for Organizers */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setOrganizerContentType('events')}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      organizerContentType === 'events'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => setOrganizerContentType('clubs')}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      organizerContentType === 'clubs'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Clubs
                  </button>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Events Tab Content */}
                {organizerContentType === 'events' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.isArray(courses) && courses.filter(c => c.duration === 'Event').length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.filter(c => c.duration === 'Event').map((event) => (
                          <OrganizerEventCard
                            key={event.id}
                            event={event}
                            setSelectedEvent={setSelectedEvent}
                            setShowEventDetailModal={setShowEventDetailModal}
                            openImageUploadModal={openImageUploadModal}
                            viewEventPayments={viewEventPayments}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No events created yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Clubs Tab Content */}
                {organizerContentType === 'clubs' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {publishedClubs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {publishedClubs.map((club) => (
                          <OrganizerClubCard
                            key={club.id}
                            club={club}
                            setSelectedOrganizerClub={setSelectedOrganizerClub}
                            setShowOrganizerClubDetailModal={setShowOrganizerClubDetailModal}
                            viewClubMembers={viewClubMembers}
                            openImageUploadModal={openImageUploadModal}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No clubs created yet</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
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
                        onClick={() => setShowCreateEventModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Create Event Proposal
                      </button>
                    )}
                    <button
                      onClick={() => setShowClubProposalModal(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Club Proposal
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex flex-wrap space-x-4">
                  {[
                    { id: 'all', label: 'All', badge: allProposals.length },
                    { id: 'pending', label: 'Pending', badge: allProposals.filter(p => p.status === 'pending_review' || p.status === 'returned_for_revision').length },
                    { id: 'approved', label: 'Approved', badge: allProposals.filter(p => p.status === 'approved').length },
                    { id: 'published', label: 'Published', badge: allProposals.filter(p => p.status === 'published').length },
                    { id: 'rejected', label: 'Rejected', badge: allProposals.filter(p => p.status === 'rejected').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => navigate(`/dashboard?tab=proposals&proposalTab=${tab.id}`)}
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
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProposals.map(proposal => (
                    <ProposalCard 
                      key={`${proposal.type}-${proposal.id}`} 
                      proposal={proposal} 
                      queryClient={queryClient}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      getStatusLabel={getStatusLabel}
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
        {showTicketModal && <TicketModal selectedTicket={selectedTicket} setShowTicketModal={setShowTicketModal} downloadTicket={downloadTicket} />}
        {showClubDetailModal && <ClubRequestDetailModal selectedClubRequest={selectedClubRequest} setShowClubDetailModal={setShowClubDetailModal} getStatusColor={getStatusColor} formatDate={formatDate} />}
        {showEventDetailModal && (selectedEvent?.eventId || selectedEvent?.id) && (
          <EnhancedEventDetailsModal
            show={showEventDetailModal}
            eventId={selectedEvent?.eventId || selectedEvent?.id}
            registrationStatus={selectedEvent?.status}
            paymentStatus={selectedEvent?.paymentStatus}
            onClose={() => setShowEventDetailModal(false)}
          />
        )}
        {showOrganizerClubDetailModal && <OrganizerClubDetailModal selectedOrganizerClub={selectedOrganizerClub} setShowOrganizerClubDetailModal={setShowOrganizerClubDetailModal} />}
        {showRegistrationsModal && <RegistrationsModal selectedEventForRegistrations={selectedEventForRegistrations} setShowRegistrationsModal={setShowRegistrationsModal} queryClient={queryClient} formatDate={formatDate} />}
        {showClubMembersModal && (
          <ClubMembersModal
            selectedClubForMembers={selectedClubForMembers}
            setShowClubMembersModal={setShowClubMembersModal}
            queryClient={queryClient}
            formatDate={formatDate}
            exportClubMembersToCSV={exportClubMembersToCSV}
          />
        )}
        {showClubProposalModal && (
          <ClubProposalModal
            onClose={() => setShowClubProposalModal(false)}
            queryClient={queryClient}
            setActiveTab={setActiveTab}
          />
        )}
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
                    <h2 className="text-xl font-bold text-gray-900">Upload Image</h2>
                    <p className="text-gray-500 text-sm mt-0.5">{selectedEventForImage?.title || selectedEventForImage?.name}</p>
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
                      {imagePreview && imagePreview.length > 0 ? (
                        <div className="space-y-2">
                          {imagePreview.length > 1 && (
                            <div className="text-sm text-gray-600 font-medium mb-2">
                              {imagePreview.length} images selected
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                            {imagePreview.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-40 object-cover rounded-lg" />
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                  {selectedFile[idx]?.name}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => { setImagePreview([]); setSelectedFile([]) }}
                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                          >
                            Remove all
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="mb-1 text-sm text-gray-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or WEBP &bull; Max 5 MB each &bull; Multiple files supported</p>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageSelect} />
                        </label>
                      )}
                    </div>
                    
                    {/* Album Name Input */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Album Name <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                        placeholder="e.g., Annual Day 2024, Sports Meet, Club Activities..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Group your images into albums. If not specified, images will be added to "Main Album"
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
                      <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Your images will be added to the gallery. Make sure they are appropriate and related to your club/event.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={closeImageUploadModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
                        Cancel
                      </button>
                      <button
                        onClick={handleImageUpload}
                        disabled={!selectedFile || selectedFile.length === 0 || uploadingImage}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <PhotoIcon className="h-4 w-4" />
                            Upload {selectedFile.length > 1 ? `${selectedFile.length} Images` : 'Image'}
                          </>
                        )}
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
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-gray-600 p-6 text-white z-10">
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

export default Dashboard
