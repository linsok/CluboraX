import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  ShieldCheckIcon,
  BellIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
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

  // Use real user data if available, otherwise use mock data
  const userData = {
    // Use real user data if available
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@campus.edu',
    phone: user?.phone || '+1 234 567 8900',
    major: user?.major || 'Computer Science',
    year: user?.year || 'Senior',
    studentId: user?.studentId || '2021CS001',
    joinDate: user?.joinDate || 'September 2021',
    bio: user?.bio || 'Passionate about technology and innovation. Active member of Computer Science Club and Photography Club.',
    interests: user?.interests || ['Programming', 'Photography', 'Music', 'Sports'],
    achievements: realAchievements || [
      'Hackathon Winner 2023',
      'Dean\'s List 2022-2023',
      'Best Project Award 2022'
    ],
    clubs: user?.clubs || [
      { name: 'Computer Science Club', role: 'Member', joined: '2021' },
      { name: 'Photography Club', role: 'Treasurer', joined: '2022' }
    ]
  }

  // Debug: Log authentication state
  console.log('Profile - Auth state:', { isAuthenticated, isLoading, user })

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activities', label: 'Activities' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'settings', label: 'Settings' }
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
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
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

        {/* Tabs */}
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

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Interests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
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
                    <p className="text-gray-500">No interests added yet.</p>
                  )}
                </div>
              </div>

              {/* Clubs */}
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
                    <p className="text-gray-500">No club memberships yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No recent activities to display.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                {userData.achievements && userData.achievements.length > 0 ? (
                  userData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-bold">🏆</span>
                      </div>
                      <p className="text-gray-900">{achievement}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No achievements yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                {/* Account Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Account Settings</h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Edit Profile Information</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Change Password</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Privacy Settings</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <BellIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Email Notifications</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <BellIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Push Notifications</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">System Settings</h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <CogIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Preferences</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <CogIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">Language & Region</span>
                      </div>
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Sign Out Section */}
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                  <h4 className="font-medium text-red-900 mb-3">Account Actions</h4>
                  <button
                    onClick={handleSignOutConfirm}
                    className="w-full flex items-center justify-center space-x-3 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Signing out will clear your session and require you to log in again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
