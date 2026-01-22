import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AcademicCapIcon, BriefcaseIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const GoogleAccountSelection = () => {
  const [selectedRole, setSelectedRole] = useState('student')
  const [isLoading, setIsLoading] = useState(false)
  const [googleUserData, setGoogleUserData] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    // Get Google user data from session storage (temporarily stored during OAuth flow)
    const storedGoogleData = sessionStorage.getItem('google_user_data')
    const tokens = sessionStorage.getItem('google_tokens')
    
    if (!storedGoogleData || !tokens) {
      // If no Google data, redirect to login
      navigate('/login')
      return
    }

    try {
      const userData = JSON.parse(storedGoogleData)
      const tokenData = JSON.parse(tokens)
      setGoogleUserData({ user: userData, tokens: tokenData })
    } catch (error) {
      console.error('Error parsing Google data:', error)
      navigate('/login')
    }
  }, [navigate])

  const handleRoleSelection = async () => {
    if (!googleUserData) return

    setIsLoading(true)
    
    try {
      // Add role to user data
      const userWithRole = {
        ...googleUserData.user,
        role: selectedRole
      }

      // Log in the user with role
      login(
        userWithRole, 
        googleUserData.tokens.access_token, 
        googleUserData.tokens.refresh_token
      )

      // Clear temporary session storage
      sessionStorage.removeItem('google_user_data')
      sessionStorage.removeItem('google_tokens')

      toast.success(`Welcome! You're registered as a ${selectedRole}`)
      
      // Redirect based on role
      if (selectedRole === 'organizer') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error completing registration:', error)
      toast.error('Failed to complete registration')
    } finally {
      setIsLoading(false)
    }
  }

  if (!googleUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </motion.div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome, {googleUserData.user.firstName}!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please select your role to complete registration
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-8"
        >
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <img 
                src={googleUserData.user.avatar} 
                alt={googleUserData.user.name}
                className="w-14 h-14 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-600">
              Signed in as <span className="font-medium">{googleUserData.user.email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Your Role
            </label>
            
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`relative w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                selectedRole === 'student'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedRole === 'student' ? 'bg-purple-500' : 'bg-gray-300'
                }`}>
                  <AcademicCapIcon className={`h-6 w-6 ${
                    selectedRole === 'student' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Student</h3>
                  <p className="text-sm text-gray-600">Join events and clubs</p>
                </div>
              </div>
              {selectedRole === 'student' && (
                <div className="absolute top-4 right-4">
                  <CheckIcon className="h-5 w-5 text-purple-500" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('organizer')}
              className={`relative w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                selectedRole === 'organizer'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedRole === 'organizer' ? 'bg-purple-500' : 'bg-gray-300'
                }`}>
                  <BriefcaseIcon className={`h-6 w-6 ${
                    selectedRole === 'organizer' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Organizer</h3>
                  <p className="text-sm text-gray-600">Create and manage events</p>
                </div>
              </div>
              {selectedRole === 'organizer' && (
                <div className="absolute top-4 right-4">
                  <CheckIcon className="h-5 w-5 text-purple-500" />
                </div>
              )}
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={handleRoleSelection}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Completing registration...
                </div>
              ) : (
                `Complete Registration as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default GoogleAccountSelection
