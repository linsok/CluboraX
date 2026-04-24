import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, CalendarIcon, XMarkIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import FloatingChatbot from '../components/FloatingChatbot'
import EnhancedClubDetailsModal from '../components/Modals/EnhancedClubDetailsModal'

// ── Stable top-level modal components – defined outside Clubs so React never
// ── sees a new component type on re-render, preventing focus-loss flicker ──

const JoinRequestModal = React.memo(({ show, selectedClub, onClose, onSubmitRequest }) => {
  const nameRef = useRef()
  const emailRef = useRef()
  const studentIdRef = useRef()
  const majorRef = useRef()
  const [year, setYear] = useState('')
  const messageRef = useRef()

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const name = nameRef.current?.value.trim()
    const email = emailRef.current?.value.trim()
    if (!name) { toast.error('Name is required'); return }
    if (!email) { toast.error('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error('Please enter a valid email'); return }
    if (onSubmitRequest) {
      try {
        await onSubmitRequest({ message: messageRef.current?.value.trim() || '' })
      } catch {
        return // error already toasted by parent
      }
    }
    if (nameRef.current) nameRef.current.value = ''
    if (emailRef.current) emailRef.current.value = ''
    if (studentIdRef.current) studentIdRef.current.value = ''
    if (majorRef.current) majorRef.current.value = ''
    if (messageRef.current) messageRef.current.value = ''
    setYear('')
    onClose()
  }, [selectedClub, onClose, onSubmitRequest])

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


const Clubs = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showOrganizerRestrictModal, setShowOrganizerRestrictModal] = useState(false)
  
  // Helper function to get gradient colors based on category
  const getCategoryGradient = (category) => {
    const gradients = {
      'Academic': 'from-blue-400 to-blue-600',
      'Arts': 'from-pink-400 to-rose-600',
      'Sports': 'from-green-400 to-emerald-600',
      'Cultural': 'from-yellow-400 to-orange-600',
      'Technical': 'from-purple-400 to-indigo-600',
      'General': 'from-gray-400 to-gray-600'
    }
    return gradients[category] || gradients['General']
  }
  
  const defaultClubImage = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800'
  
  const { data: clubsRaw = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['public-clubs', Math.floor(Date.now() / 60000)], // Refresh every minute
    queryFn: async () => {
      // Add cache-bust parameter to force fresh data
      const cacheBustParam = Math.floor(Date.now() / 1000)
      const res = await apiClient.get(`/api/clubs/?ordering=-created_at&t=${cacheBustParam}`)
      const raw = res.data?.results || (Array.isArray(res.data) ? res.data : [])
      return raw.map(c => {
        // Accept logo_url if it's returned by API (with or without http)
        const logoUrl = c.logo_url || c.logo
        const isValidImageUrl = logoUrl && 
                                typeof logoUrl === 'string' && 
                                !logoUrl.startsWith('file://') &&
                                logoUrl.trim().length > 0
        
        return {
          id: c.id,
          name: c.name,
          category: c.category || 'General',
          description: c.description || '',
          longDescription: c.mission_statement || c.description || '',
          members: c.member_count || 0,
          events: 0,
          image: isValidImageUrl ? logoUrl : null,
          fallbackGradient: getCategoryGradient(c.category || 'General'),
          status: c.status || 'active',
          president: c.advisor_name || c.created_by?.full_name || 'Club Leader',
          meetingTime: c.meeting_schedule || 'TBD',
          location: c.requirements || '',
          requirements: c.requirements || '',
          achievements: [],
          socialMedia: c.social_links || {},
          website: c.social_links?.website || null,
          tags: Array.isArray(c.tags) ? c.tags : [],
        }
      })
    },
    staleTime: 0,  // Always fetch fresh data
    refetchInterval: 30 * 1000,  // Auto-refetch every 30 seconds
    refetchOnMount: true,  // Always refetch on mount
    refetchOnWindowFocus: true,  // Refetch when window regains focus
  })

  // Only show clubs that are not 'inactive' or 'finished'

  const clubs = clubsRaw.filter(club => club.status !== 'inactive' && club.status !== 'finished')

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

  const handleJoinRequest = useCallback(async ({ message }) => {
    try {
      await apiClient.post('/api/clubs/memberships/', {
        club: selectedClub.id,
        notes: message
      })
      toast.success(`Join request sent to ${selectedClub.name}! Pending approval.`)
    } catch (err) {
      const msg =
        err.response?.data?.club?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Failed to send join request. Please try again.'
      toast.error(msg)
      throw err
    }
  }, [selectedClub])

  const handleSignUpAsStudent = () => {
    logout()
    navigate('/register')
  }

  const handleSignInAsStudent = () => {
    logout()
    navigate('/login')
  }

  const handleViewDetails = async (club) => {
    setSelectedClub(club)         // show modal immediately with list data
    setShowDetailsModal(true)
    try {
      const res = await apiClient.get(`/api/clubs/${club.id}/`)
      setSelectedClub(res.data)   // replace with full detail once loaded
    } catch {
      // modal already open with partial data, fail silently
    }
  }

  const handleClubFormChange = (e) => {
    // This function is now removed - Create Club functionality is disabled in MVP
  }
  
  const handleCreateClub = async () => {
    // This function is now removed - Create Club functionality is disabled in MVP
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
              <div className={`h-48 bg-gradient-to-r ${club.fallbackGradient} relative overflow-hidden`}>
                <img 
                  src={club.image || defaultClubImage}
                  alt={club.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    if (e.target.src !== defaultClubImage) {
                      e.target.src = defaultClubImage
                    }
                  }}
                />
                {!club.image ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <UserGroupIcon className="h-16 w-16 text-white opacity-60" />
                  </div>
                ) : null}
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
        onSubmitRequest={handleJoinRequest}
      />

      {/* Club Details Modal */}
      <EnhancedClubDetailsModal
        show={showDetailsModal}
        clubId={selectedClub?.id}
        onClose={() => { setShowDetailsModal(false); setSelectedClub(null) }}
        onJoinClub={handleJoinClub}
      />

      {/* Organizer Restrict Modal */}
      <OrganizerRestrictModal
        show={showOrganizerRestrictModal}
        onClose={() => setShowOrganizerRestrictModal(false)}
        onSignUpAsStudent={handleSignUpAsStudent}
        onSignInAsStudent={handleSignInAsStudent}
      />

      {/* Create Club Modal - Removed for MVP */}

      {/* Floating Chatbot Button */}
      <FloatingChatbot />
    </div>
  )
}

export default Clubs
