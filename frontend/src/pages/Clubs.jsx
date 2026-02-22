import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, CalendarIcon, XMarkIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import FloatingChatbot from '../components/FloatingChatbot'

// ── Stable top-level modal components – defined outside Clubs so React never
// ── sees a new component type on re-render, preventing focus-loss flicker ──

const JoinRequestModal = React.memo(({ show, selectedClub, onClose }) => {
  const nameRef = useRef()
  const emailRef = useRef()
  const studentIdRef = useRef()
  const majorRef = useRef()
  const [year, setYear] = useState('')
  const messageRef = useRef()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const name = nameRef.current?.value.trim()
    const email = emailRef.current?.value.trim()
    if (!name) { toast.error('Name is required'); return }
    if (!email) { toast.error('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error('Please enter a valid email'); return }
    toast.success(`Join request sent to ${selectedClub.name}!`)
    if (nameRef.current) nameRef.current.value = ''
    if (emailRef.current) emailRef.current.value = ''
    if (studentIdRef.current) studentIdRef.current.value = ''
    if (majorRef.current) majorRef.current.value = ''
    if (messageRef.current) messageRef.current.value = ''
    setYear('')
    onClose()
  }, [selectedClub, onClose])

  if (!show || !selectedClub) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Join Club Request</h2>
                <p className="text-purple-100">{selectedClub.name}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input ref={nameRef} type="text" placeholder="Enter your full name" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input ref={emailRef} type="email" placeholder="Enter your email" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <input ref={studentIdRef} type="text" placeholder="Enter your student ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                <input ref={majorRef} type="text" placeholder="Enter your major"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
              <textarea ref={messageRef} rows={4} placeholder="Tell us why you want to join this club..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Club Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Club:</span> {selectedClub.name}</p>
                <p><span className="font-medium">Category:</span> {selectedClub.category}</p>
                <p><span className="font-medium">Current Members:</span> {selectedClub.members}</p>
                <p><span className="font-medium">Events:</span> {selectedClub.events}</p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium">Send Request</button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
})

const OrganizerRestrictModal = React.memo(({ show, onClose, onSignUpAsStudent, onSignInAsStudent }) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Organizer Account</h2>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center space-y-3">
              <p className="text-gray-700 text-lg">Organizers cannot join clubs.</p>
              <p className="text-gray-600">To join clubs as a member, please sign in with a student account.</p>
            </div>
            <div className="space-y-3 pt-4">
              <button onClick={onSignUpAsStudent} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium">
                <UserGroupIcon className="w-5 h-5" />
                <span>Sign Up as Student</span>
              </button>
              <button onClick={onSignInAsStudent} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-medium">
                <span>Sign In as Student</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center pt-2">Note: Clicking either button will log you out of your organizer account.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
})

const ClubDetailsModal = React.memo(({ show, selectedClub, onClose, onJoinClub }) => {
  if (!show || !selectedClub) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-1">{selectedClub.name}</h2>
                <p className="text-purple-100">{selectedClub.category} Club</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">About Us</h3>
              <p className="text-gray-600 leading-relaxed">{selectedClub.longDescription}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3">Club Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">President:</span><span className="font-medium text-gray-900">{selectedClub.president}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Members:</span><span className="font-medium text-gray-900">{selectedClub.members}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Events:</span><span className="font-medium text-gray-900">{selectedClub.events}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="font-medium text-green-600">{selectedClub.status}</span></div>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3">Meeting Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Time:</span><span className="font-medium text-gray-900">{selectedClub.meetingTime}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Location:</span><span className="font-medium text-gray-900">{selectedClub.location}</span></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
              <p className="text-gray-600 text-sm">{selectedClub.requirements}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Achievements</h4>
              <ul className="space-y-2">
                {selectedClub.achievements?.map((a, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Connect With Us</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(selectedClub.socialMedia || {}).map(([platform, handle]) => (
                  <div key={platform} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                    <span className="font-medium text-gray-700 capitalize">{platform}:</span>
                    <span className="text-gray-600">{handle}</span>
                  </div>
                ))}
              </div>
            </div>
            {selectedClub.website && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Official Website</h4>
                <a href={selectedClub.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline text-sm">{selectedClub.website}</a>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-4">
              <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">Close</button>
              <button onClick={() => { onClose(); onJoinClub(selectedClub) }} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium">Join Club</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
})

const Clubs = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [showOrganizerRestrictModal, setShowOrganizerRestrictModal] = useState(false)
  
  // Check URL parameters to auto-open create modal
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('create') === 'true' && user?.role === 'organizer') {
      setShowCreateClubModal(true)
    }
  }, [location, user])
  const [clubForm, setClubForm] = useState({
    name: '',
    category: 'Academic',
    description: '',
    longDescription: '',
    meetingTime: '',
    locationType: 'physical',
    location: '',
    physicalLocation: '',
    onlinePlatform: '',
    meetingLink: '',
    requirements: '',
    goals: '',
    leaderName: '',
    capacity: 10,
    memberEmails: '',
    president: user?.name || '',
    contactEmail: user?.email || '',
    socialMedia: {
      instagram: '',
      linkedin: '',
      github: ''
    }
  })

  const { data: clubsRaw = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['public-clubs'],
    queryFn: async () => {
      const res = await apiClient.get('/api/clubs/?ordering=-created_at')
      const raw = res.data?.results || (Array.isArray(res.data) ? res.data : [])
      return raw.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category || 'General',
        description: c.description || '',
        longDescription: c.mission_statement || c.description || '',
        members: c.member_count || 0,
        events: 0,
        image: c.logo_url || null,
        status: c.status || 'active',
        president: c.advisor_name || c.created_by?.full_name || 'Club Leader',
        meetingTime: c.meeting_schedule || 'TBD',
        location: c.requirements || '',
        requirements: c.requirements || '',
        achievements: [],
        socialMedia: c.social_links || {},
        website: c.social_links?.website || null,
        tags: Array.isArray(c.tags) ? c.tags : [],
      }))
    },
    staleTime: 5 * 60 * 1000,
  })

  const clubs = clubsRaw

  const categories = ['all', 'Academic', 'Arts', 'Sports', 'Cultural', 'Technical']

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleJoinClub = (club) => {
    // Check if user is an organizer
    if (user?.role === 'organizer') {
      setShowOrganizerRestrictModal(true)
      return
    }
    
    setSelectedClub(club)
    setShowJoinModal(true)
  }

  const handleSignUpAsStudent = () => {
    logout()
    navigate('/register')
  }

  const handleSignInAsStudent = () => {
    logout()
    navigate('/login')
  }

  const handleViewDetails = (club) => {
    setSelectedClub(club)
    setShowDetailsModal(true)
  }

  const handleCreateClub = () => {
    // Check if user is an organizer
    if (user?.role !== 'organizer') {
      toast.error('Only organizers can create clubs')
      return
    }
    
    // Validation
    if (!clubForm.name.trim()) {
      toast.error('Club name is required')
      return
    }
    if (!clubForm.description.trim()) {
      toast.error('Club description is required')
      return
    }
    if (!clubForm.meetingTime.trim()) {
      toast.error('Meeting time is required')
      return
    }
    if (!clubForm.location.trim()) {
      toast.error('Location is required')
      return
    }
    if (!clubForm.leaderName.trim()) {
      toast.error('Leader name is required')
      return
    }
    if (clubForm.capacity < 10) {
      toast.error('Club capacity must be at least 10 members')
      return
    }
    
    // Create new club object
    const newClub = {
      id: Date.now(),
      ...clubForm,
      members: 1,
      image: '/api/placeholder/300/200',
      events: 0,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Student'
    }
    
    console.log('Creating club:', newClub)
    
    // Show success message
    toast.success('Club creation request submitted! Your club is pending approval.')
    
    // Reset form and close modal
    setClubForm({
      name: '',
      category: 'Academic',
      description: '',
      longDescription: '',
      meetingTime: '',
      locationType: 'physical',
      location: '',
      physicalLocation: '',
      onlinePlatform: '',
      meetingLink: '',
      requirements: '',
      goals: '',
      leaderName: '',
      capacity: 10,
      memberEmails: '',
      president: user?.name || '',
      contactEmail: user?.email || '',
      socialMedia: {
        instagram: '',
        linkedin: '',
        github: ''
      }
    })
    setShowCreateClubModal(false)
  }

  const handleClubFormChange = (e) => {
    const { name, value } = e.target
    if (name.includes('socialMedia.')) {
      const socialField = name.split('.')[1]
      setClubForm(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }))
    } else {
      setClubForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/img/clubs.jpg)',
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
            Join Communities
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
            Campus <span style={{ color: '#667eea' }}>Clubs</span>
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campus Clubs</h2>
          <p className="text-gray-600">Discover and join student organizations</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
            
            {/* Create Club Button - For Organizers Only */}
            {user?.role === 'organizer' && (
              <button 
                onClick={() => setShowCreateClubModal(true)}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create Club
              </button>
            )}
          </div>
        </motion.div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubsLoading ? (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Loading clubs...</p>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <UserGroupIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-medium">No clubs found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
          filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-r from-purple-400 to-indigo-400 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <UserGroupIcon className="h-16 w-16 text-white" />
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                    {club.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{club.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {club.members}
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {club.events}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {club.category}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewDetails(club)}
                    className="flex-1 border border-purple-600 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors duration-300"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleJoinClub(club)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300"
                  >
                    Join Club
                  </button>
                </div>
              </div>
            </motion.div>
          ))
          )}
        </div>
      </div>

      {/* Join Request Modal */}
      <JoinRequestModal
        show={showJoinModal}
        selectedClub={selectedClub}
        onClose={() => { setShowJoinModal(false); setSelectedClub(null) }}
      />

      {/* Club Details Modal */}
      <ClubDetailsModal
        show={showDetailsModal}
        selectedClub={selectedClub}
        onClose={() => setShowDetailsModal(false)}
        onJoinClub={handleJoinClub}
      />

      {/* Organizer Restrict Modal */}
      <OrganizerRestrictModal
        show={showOrganizerRestrictModal}
        onClose={() => setShowOrganizerRestrictModal(false)}
        onSignUpAsStudent={handleSignUpAsStudent}
        onSignInAsStudent={handleSignInAsStudent}
      />

      {/* Create Club Modal */}
      <AnimatePresence>
        {showCreateClubModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCreateClubModal(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Create New Club</h2>
                      <p className="text-purple-100">Start your own student organization</p>
                    </div>
                    <button
                      onClick={() => setShowCreateClubModal(false)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleCreateClub(); }} className="p-6 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={clubForm.name}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter club name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={clubForm.category}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="Academic">Academic</option>
                          <option value="Arts">Arts</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={clubForm.description}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Brief description of your club"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leader Name *
                        </label>
                        <input
                          type="text"
                          name="leaderName"
                          value={clubForm.leaderName}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter leader's full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Capacity * (Minimum 10)
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={clubForm.capacity}
                          onChange={handleClubFormChange}
                          min="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Maximum number of members"
                          required
                        />
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Meeting Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Time *
                        </label>
                        <input
                          type="text"
                          name="meetingTime"
                          value={clubForm.meetingTime}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Every Wednesday at 6:00 PM"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <select
                          name="locationType"
                          value={clubForm.locationType || 'physical'}
                          onChange={(e) => {
                            setClubForm(prev => ({
                              ...prev,
                              locationType: e.target.value,
                              location: e.target.value === 'physical' ? '' : 'Online Meeting'
                            }))
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                          required
                        >
                          <option value="physical">Physical Location</option>
                          <option value="online">Online Meeting</option>
                          <option value="hybrid">Hybrid (Physical + Online)</option>
                        </select>
                        
                        {clubForm.locationType === 'physical' ? (
                          <input
                            type="text"
                            name="location"
                            value={clubForm.location}
                            onChange={handleClubFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="e.g., Tech Building, Room 301"
                            required
                          />
                        ) : clubForm.locationType === 'online' ? (
                          <div className="space-y-2">
                            <select
                              name="onlinePlatform"
                              value={clubForm.onlinePlatform || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  onlinePlatform: e.target.value,
                                  location: e.target.value ? `Online via ${e.target.value}` : ''
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Platform</option>
                              <option value="Zoom">Zoom</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="Skype">Skype</option>
                              <option value="Discord">Discord</option>
                              <option value="Other">Other Platform</option>
                            </select>
                            
                            <input
                              type="text"
                              name="meetingLink"
                              value={clubForm.meetingLink || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  meetingLink: e.target.value,
                                  location: prev.onlinePlatform ? `Online via ${prev.onlinePlatform}` : ''
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter meeting link (e.g., https://zoom.us/j/123456789)"
                              required
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              name="physicalLocation"
                              value={clubForm.physicalLocation || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  physicalLocation: e.target.value,
                                  location: e.target.value ? `${e.target.value} + Online Meeting` : 'Hybrid Meeting'
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                              placeholder="e.g., Tech Building, Room 301"
                              required
                            />
                            
                            <select
                              name="onlinePlatform"
                              value={clubForm.onlinePlatform || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  onlinePlatform: e.target.value,
                                  location: prev.physicalLocation ? `${prev.physicalLocation} + Online via ${e.target.value}` : 'Hybrid Meeting'
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Online Platform</option>
                              <option value="Zoom">Zoom</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="Skype">Skype</option>
                              <option value="Discord">Discord</option>
                              <option value="Other">Other Platform</option>
                            </select>
                            
                            <input
                              type="text"
                              name="meetingLink"
                              value={clubForm.meetingLink || ''}
                              onChange={(e) => {
                                setClubForm(prev => ({
                                  ...prev,
                                  meetingLink: e.target.value
                                }))
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter meeting link (e.g., https://zoom.us/j/123456789)"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requirements
                        </label>
                        <textarea
                          name="requirements"
                          value={clubForm.requirements}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Any requirements for joining the club"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Members by Email (CluboraX Accounts)
                        </label>
                        <textarea
                          name="memberEmails"
                          value={clubForm.memberEmails}
                          onChange={handleClubFormChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Enter email addresses separated by commas (e.g., student1@campushub.edu, student2@campushub.edu)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Add CluboraX member email addresses to invite them to join your club
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Long Description
                      </label>
                      <textarea
                        name="longDescription"
                        value={clubForm.longDescription}
                        onChange={handleClubFormChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Detailed description of your club's mission and activities"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goals & Objectives
                      </label>
                      <textarea
                        name="goals"
                        value={clubForm.goals}
                        onChange={handleClubFormChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="What do you want to achieve with this club?"
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Social Media (Optional)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <input
                          type="text"
                          name="socialMedia.instagram"
                          value={clubForm.socialMedia.instagram}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="@clubname"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn
                        </label>
                        <input
                          type="text"
                          name="socialMedia.linkedin"
                          value={clubForm.socialMedia.linkedin}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Club Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GitHub
                        </label>
                        <input
                          type="text"
                          name="socialMedia.github"
                          value={clubForm.socialMedia.github}
                          onChange={handleClubFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="club-username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateClubModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 font-medium"
                    >
                      Submit for Approval
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chatbot Button */}
      <FloatingChatbot />
    </div>
  )
}

export default Clubs
