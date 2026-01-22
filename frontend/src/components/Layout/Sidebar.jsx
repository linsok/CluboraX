import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  PhotoIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  SparklesIcon,
  Bars3Icon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const Sidebar = ({ isOpen, onClose, user }) => {
  const [expandedSections, setExpandedSections] = useState({})
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout()
      onClose()
    }
  }

  const menuItems = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
        { name: 'Clubs', href: '/clubs', icon: UserGroupIcon },
        { name: 'Gallery', href: '/gallery', icon: PhotoIcon },
      ]
    },
    {
      title: 'Learning',
      items: [
        { name: 'Video Library', href: '/videos', icon: VideoCameraIcon },
        { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Profile', href: '/profile', icon: UserCircleIcon },
        { name: 'Settings', href: '/settings', icon: CogIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
      ]
    }
  ]

  const toggleSection = (title) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                {/* CluboraX Logo */}
                <img src="C:\Users\User\Downloads\photo_2026-01-22_15-08-14.jpg" alt="CluboraX Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">CluboraX</h2>
                <p className="text-xs text-gray-500">Club Management Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user?.full_name || user?.name || user?.first_name && user?.last_name ? 
                        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : 
                        'User'
                      }
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user?.full_name || user?.name || user?.first_name && user?.last_name ? 
                    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : 
                    'Guest User'
                  }
                </h3>
                <p className="text-sm text-gray-500">
                  {user?.major || user?.faculty || 'Student'} • {user?.year || 'Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {menuItems.map((section) => (
              <div key={section.title} className="space-y-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>{section.title}</span>
                  <motion.svg
                    animate={{ rotate: expandedSections[section.title] ? 90 : 0 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedSections[section.title] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1"
                    >
                      {section.items.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                          <span className={`font-medium ${isActive(item.href) ? 'text-white' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {isActive(item.href) && (
                            <div className="w-2 h-2 bg-white rounded-full ml-auto" />
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <AcademicCapIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Help Center</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>CluboraX v2.0</p>
              <p>© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
