import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { login } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

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
      const response = await login(formData)
      
      if (response.success) {
        // Check if user is admin
        if (response.data.user.role === 'admin') {
          // Direct admin login
          localStorage.setItem('admin_token', response.data.access_token)
          localStorage.setItem('admin_refresh_token', response.data.refresh_token)
          localStorage.setItem('admin_user', JSON.stringify(response.data.user))
          
          // Also set regular tokens for compatibility with other components
          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('refresh_token', response.data.refresh_token)
          localStorage.setItem('user', JSON.stringify(response.data.user))
          
          toast.success('Welcome Admin!')
          
          // Use React Router navigate instead of window.location.replace
          setTimeout(() => {
            navigate('/admin/dashboard')
          }, 500)
        } else {
          // Regular user - use AuthContext
          authLogin(response.data.user, response.data.access_token, response.data.refresh_token)
        }
      } else {
        toast.error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Login failed. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
      </div>
      
      {/* Admin Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Campus Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="admin@campus.edu"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>

          {/* Admin Features */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-gray-400">
                <ServerIcon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs">System</p>
              </div>
              <div className="text-gray-400">
                <ChartBarIcon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs">Analytics</p>
              </div>
              <div className="text-gray-400">
                <CogIcon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs">Settings</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-center text-gray-400 text-xs">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>This is a restricted area. Unauthorized access will be logged.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin
