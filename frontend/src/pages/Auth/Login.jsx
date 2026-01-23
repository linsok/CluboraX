import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { signInWithGoogle } from '../../utils/googleAuth'
import { useAuth } from '../../contexts/AuthContext'
import { login as loginUser } from '../../api/auth'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Call the login API
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      })
      
      // Handle Django API response
      if (response.success) {
        // Authenticate user with tokens
        if (response.data && response.data.access_token) {
          login(response.data.user, response.data.access_token, 'mock_refresh_token')
          toast.success('Login successful!')
          
          // Navigate to dashboard after successful login
          setTimeout(() => {
            navigate('/dashboard')
          }, 100)
        } else {
          toast.error('Login failed: No access token received')
        }
      } else {
        // Handle error response
        if (response.requires_verification) {
          toast.error('Please verify your email address first.')
          // Store email for verification
          localStorage.setItem('pending_verification_email', formData.email)
        } else {
          toast.error(response.message || 'Login failed')
        }
      }
      
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle API errors
      if (error.data) {
        // Django REST framework returns errors in data object
        const errors = error.data
        if (typeof errors === 'object') {
          // Handle field-specific errors
          Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]]
            fieldErrors.forEach(err => {
              toast.error(`${field}: ${err}`)
            })
          })
        } else {
          toast.error(errors.message || 'Login failed')
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Login failed. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      toast.loading('Redirecting to Google...', { id: 'google-signin' })
      
      // For development/testing, provide a fallback
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Check if user wants to try real Google OAuth or use mock
        const useRealGoogle = confirm(
          'Google OAuth Setup Required:\n\n' +
          'For Google OAuth to work, you need to:\n' +
          '1. Set up redirect URIs in Google Cloud Console\n' +
          '2. Add: http://localhost:' + window.location.port + '/auth/google/callback\n\n' +
          'Click OK for real Google OAuth\n' +
          'Click Cancel for mock sign-in (testing)'
        )
        
        if (!useRealGoogle) {
          // Mock Google sign-in for testing
          setTimeout(() => {
            const mockUser = {
              id: 'google_mock_' + Date.now(),
              name: 'Mock Google User',
              email: 'mockuser@gmail.com',
              role: 'student',
              major: 'Computer Science',
              year: 'Senior',
              avatar: 'https://picsum.photos/seed/googleuser/100/100.jpg',
              provider: 'google'
            }
            
            login(mockUser, 'mock_google_token', 'mock_google_refresh')
            toast.success('Mock Google sign-in successful!', { id: 'google-signin' })
            setIsGoogleLoading(false)
            
            setTimeout(() => {
              navigate('/dashboard')
            }, 100)
          }, 1500)
          return
        }
      }
      
      // Redirect to Google OAuth
      signInWithGoogle()
    } catch (error) {
      setIsGoogleLoading(false)
      toast.error('Failed to sign in with Google', { id: 'google-signin' })
      console.error('Google sign-in error:', error)
    }
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Campus Hub account
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-8"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-600"
        >
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
            Sign up for free
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Login
