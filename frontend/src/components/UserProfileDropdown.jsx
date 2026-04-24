import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../api/client'
import {
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline'

const UserProfileDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false) // Prevent concurrent requests
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Fetch unread notifications count
  useEffect(() => {
    // DISABLED: Notification polling turned off to reduce API load
    // Uncomment the code below to re-enable notifications polling
    /*
    const fetchUnreadCount = async () => {
      // Skip if already fetching (deduplicate)
      if (isFetching) return
      
      setIsFetching(true)
      try {
        const response = await apiClient.get('/api/notifications/', {
          params: { page_size: 1, is_read: false }
        })
        setUnreadCount(response.data.count || 0)
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error)
      } finally {
        setIsFetching(false)
      }
    }

    // Initial fetch
    fetchUnreadCount()
    
    // Refresh unread count every 30 seconds (reduced from 5 seconds)
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
    */
  }, [isFetching])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout()
      setIsOpen(false)
    }
  }

  const menuItems = [
    {
      title: 'My Profile',
      href: '/profile',
      icon: UserCircleIcon,
      description: 'View and edit your profile'
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: CogIcon,
      description: 'Manage your account settings'
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: BellIcon,
      description: 'Manage your notifications'
    },
  ]

  return (
    <div className="flex items-center space-x-1">
      {/* Notification Icon */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-full hover:bg-blue-100 transition-all duration-200 group"
        title="Go to Notifications"
      >
        <BellIcon className="w-6 h-6 text-blue-500 group-hover:text-blue-700 font-semibold" />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      <div className="relative">
      {/* User Avatar Button - Icon Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-all duration-200 group"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
            >
              {/* User Info Header */}
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white drop-shadow-md truncate">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user?.name || 'John Doe'}
                    </h3>
                    <p className="text-xs text-white/90 drop-shadow-md truncate">{user?.email || 'john.doe@campus.edu'}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                      <item.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default UserProfileDropdown
