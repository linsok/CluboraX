import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const UserProfileDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()

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
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
      >
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900">{user?.name || 'John Doe'}</p>
          <p className="text-xs text-gray-500">{user?.role || 'Student'}</p>
        </div>
        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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
              className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
            >
              {/* User Info Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{user?.name || 'John Doe'}</h3>
                    <p className="text-sm text-blue-100">{user?.email || 'john.doe@campus.edu'}</p>
                    <p className="text-xs text-blue-200 mt-1">{user?.major || 'Computer Science'} • {user?.year || 'Senior'}</p>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500">
                    <p>Member since {user?.joinDate || 'September 2021'}</p>
                    <p>Last active {user?.lastActive || '2 hours ago'}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
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
  )
}

export default UserProfileDropdown
