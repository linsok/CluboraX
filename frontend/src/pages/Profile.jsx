import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getUserAchievements } from '../api/courses'
import { updateProfile } from '../api/profile'
import toast from 'react-hot-toast'
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  AcademicCapIcon,
  CalendarIcon,
  PencilIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated, isLoading } = useAuth()

  // Fetch real achievements data
  const { data: realAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: getUserAchievements,
    retry: 2,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })

  // Set active tab based on route
  useEffect(() => {
    if (location.pathname === '/achievements') {
      setActiveTab('achievements')
    } else if (location.pathname === '/activities') {
      setActiveTab('activities')
    }
  }, [location.pathname])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleSignOut = () => {
    logout()
  }

  const handleSignOutConfirm = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      handleSignOut()
    }
  }

  // Use real user data if available
  const userData = {
    name: (user?.first_name?.trim() || '') + ' ' + (user?.last_name?.trim() || '')
      ? [(user?.first_name || '').trim(), (user?.last_name || '').trim()].filter(Boolean).join(' ')
      : user?.full_name?.trim() || user?.name || 'User',
    email: user?.email || '',
    phone: user?.phone || '',
    major: user?.major || '',
    year: user?.year || '',
    studentId: user?.student_id || user?.studentId || '',
    joinDate: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    achievements: realAchievements || [],
    clubs: user?.clubs || []
  }

  // Initialize edit form when opening modal
  const handleEditProfile = () => {
    // Combine first_name and last_name, with fallback
    const displayName = (user?.first_name && user?.last_name)
      ? `${user.first_name} ${user.last_name}`.trim()
      : (user?.name || user?.full_name || '').trim()
    
    setEditFormData({
      name: displayName || '',
      email: userData.email || '',
      phone: userData.phone || ''
    })
    setIsEditing(true)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Split name into first and last name
      const nameParts = editFormData.name?.trim().split(/\s+/) || []
      
      // Validate required fields
      if (!nameParts[0]?.trim()) {
        toast.error('Name is required. Please enter at least a first name.')
        setIsSaving(false)
        return
      }
      
      // Validate phone number format if provided
      let phoneToSend = editFormData.phone?.trim() || ''
      if (phoneToSend) {
        // Remove common phone formatting characters for validation
        const cleanPhone = phoneToSend.replace(/[\s\-()]/g, '')
        
        // Check if it only contains digits (and possibly a leading +)
        // Accept formats like: 098890913, +85598098913, etc.
        if (!/^(\+)?[\d]{7,15}$/.test(cleanPhone)) {
          toast.error('Phone number must be 7-15 digits. Examples: 098890913 or +85598098913')
          setIsSaving(false)
          return
        }
        
        // Keep the original format - backend will handle it
        phoneToSend = editFormData.phone
      }
      
      const payload = {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        phone: phoneToSend
      }
      
      await updateProfile(payload)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Failed to update profile:', err)
      
      // Show specific error messages from backend
      const errorData = err.response?.data
      if (errorData?.data) {
        // Handle validation errors from serializer
        const errors = errorData.data
        const errorMessages = Object.keys(errors)
          .map(field => {
            const fieldError = errors[field]
            const errorMsg = Array.isArray(fieldError) ? fieldError[0] : fieldError
            // Make phone error more user-friendly
            if (field === 'phone') {
              return `Phone: ${errorMsg} - Use format like +1 (555) 123-4567 or leave blank`
            }
            return `${field}: ${errorMsg}`
          })
          .join('\n')
        toast.error(errorMessages || 'Failed to update profile. Please check your input.')
      } else if (errorData?.message) {
        toast.error(errorData.message)
      } else {
        toast.error(err?.message || 'Failed to update profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Debug: Log authentication state
  console.log('Profile - Auth state:', { isAuthenticated, isLoading, user })

  const tabs = [
    { id: 'overview', label: 'Overview' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-20 w-20 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors">
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                <button
                  onClick={handleEditProfile}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit Profile"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Settings"
                >
                  <CogIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSignOutConfirm}
                  className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">{userData.bio}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{userData.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{userData.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>{userData.major}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{userData.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs - Only show if more than one tab */}
        {tabs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm mb-8"
          >
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
            </div>
          )}
        </motion.div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditing && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={handleCancelEdit}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email (Read-only)
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={editFormData.phone}
                          onChange={handleInputChange}
                          placeholder="098890913 or +85598098913"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Examples: 098890913 • +85598098913 • Must be 7-15 digits • Leave blank if not needed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving && (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Profile
