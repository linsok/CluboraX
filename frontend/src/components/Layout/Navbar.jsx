import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  BellIcon,
  CogIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PhotoIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import UserProfileDropdown from '../UserProfileDropdown'

const Navbar = ({ user, onMenuClick }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => {
      // This would fetch notifications from API
      return []
    },
  })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    // Clear authentication tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    
    // Show success message and navigate to login
    toast.success('Logged out successfully!')
    navigate('/login')
  }

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Navigation Bar */}
          <div className="hidden lg:flex flex-1 mx-4">
            <div className="flex space-x-8">
              <Link
                to="/dashboard"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/events"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/events'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Events
              </Link>
              <Link
                to="/clubs"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/clubs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Clubs
              </Link>
              <Link
                to="/gallery"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/gallery'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gallery
              </Link>
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <BellIcon className="w-5 h-5" />
              {notifications?.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* User Profile Dropdown */}
            {user ? (
              <UserProfileDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
