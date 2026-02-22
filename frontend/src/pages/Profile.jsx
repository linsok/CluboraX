import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getUserAchievements } from '../api/courses'
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
  const [activeTab, setActiveTab] = useState('overview')
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    major: '',
    year: ''
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
    name: user?.name || user?.full_name || '',
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
    setEditFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      bio: userData.bio,
      major: userData.major,
      year: userData.year
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
  const handleSaveProfile = () => {
    // TODO: Connect to backend API to save profile changes
    console.log('Saving profile:', editFormData)
    // For now, just close the modal
    setIsEditing(false)
    alert('Profile updated successfully!')
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
              {/* Interests - Only show for students or if user has interests */}
              {(user?.role !== 'organizer' || userData.interests?.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
                  {user?.role === 'organizer' ? (
                    <p className="text-gray-500 italic">
                      Organizers cannot join events or clubs. Switch to a student account to track interests.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userData.interests && userData.interests.length > 0 ? (
                        userData.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No interests added yet. Join clubs and events to build your interests!</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Club Memberships - Only show for students */}
              {user?.role !== 'organizer' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Club Memberships</h3>
                  <div className="space-y-3">
                    {userData.clubs && userData.clubs.length > 0 ? (
                      userData.clubs.map((club, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{club.name}</h4>
                            <p className="text-sm text-gray-600">{club.role} • Joined {club.joined}</p>
                          </div>
                          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                            View →
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No club memberships yet. Join a club to get started!</p>
                    )}
                  </div>
                </div>
              )}
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
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={editFormData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Major
                        </label>
                        <input
                          type="text"
                          name="major"
                          value={editFormData.major}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <select
                          name="year"
                          value={editFormData.year}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Freshman">Freshman</option>
                          <option value="Sophomore">Sophomore</option>
                          <option value="Junior">Junior</option>
                          <option value="Senior">Senior</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={editFormData.bio}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
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
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save Changes
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
