import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { handleGoogleCallback } from '../../utils/googleAuth'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const GoogleCallback = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters manually
        const urlParams = new URLSearchParams(location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        
        // Debug: Log the received parameters
        console.log('Google Callback - Full URL:', window.location.href)
        console.log('Google Callback - Search params:', location.search)
        console.log('Google Callback - Code:', code)
        console.log('Google Callback - Error:', error)
        
        // Handle OAuth errors
        if (error) {
          const errorDescription = urlParams.get('error_description') || 'Authentication failed'
          throw new Error(`Google OAuth Error: ${errorDescription}`)
        }
        
        if (!code) {
          throw new Error('No authorization code found in callback')
        }

        // Handle real Google OAuth callback
        const { user, tokens } = await handleGoogleCallback(code)
        
        // Create a user object compatible with our auth system
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'student', // Default role for Google users
          major: 'Not specified', // Default major
          year: 'Not specified',
          avatar: user.avatar,
          provider: 'google'
        }
        
        // Auto-login with Google user data
        login(userData, tokens.access_token, tokens.refresh_token || 'google_refresh_token')
        
        toast.success('Successfully signed in with Google!')
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/')
        }, 100)
      } catch (error) {
        console.error('Google OAuth callback error:', error)
        setError(error.message || 'Failed to sign in with Google')
        toast.error(error.message || 'Failed to sign in with Google')
        
        // Redirect back to login after a delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }

    handleCallback()
  }, [location.search, navigate, login])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Signing you in...</h2>
            <p className="text-gray-600">Please wait while we complete your sign in.</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Sign In Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you back to the login page...
            </p>
            <div className="animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded-full mx-auto"></div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Sign In Successful!</h2>
          <p className="text-gray-600 mb-6">You have successfully signed in with Google.</p>
          <div className="animate-pulse">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default GoogleCallback
