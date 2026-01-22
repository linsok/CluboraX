import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ArchiveBoxArrowDownIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'

const AdminLayout = ({ children, title, activeSection, onSectionChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(3)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, badge: null },
    { id: 'users', label: 'Users', icon: UsersIcon, badge: 12 },
    { id: 'proposals', label: 'Proposals', icon: DocumentTextIcon, badge: 5 },
    { id: 'events', label: 'Events', icon: CalendarIcon, badge: null },
    { id: 'clubs', label: 'Clubs', icon: BuildingOfficeIcon, badge: null },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon, badge: null },
    { id: 'finance', label: 'Finance', icon: CurrencyDollarIcon, badge: null },
    { id: 'settings', label: 'Settings', icon: CogIcon, badge: null }
  ]

  const quickActions = [
    { id: 'add-user', label: 'Add User', icon: UsersIcon, color: 'bg-blue-500' },
    { id: 'create-event', label: 'Create Event', icon: CalendarIcon, color: 'bg-green-500' },
    { id: 'approve-proposal', label: 'Approve Proposal', icon: DocumentTextIcon, color: 'bg-yellow-500' },
    { id: 'view-reports', label: 'View Reports', icon: ChartBarIcon, color: 'bg-purple-500' }
  ]

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logging out...')
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl lg:hidden"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:block">
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <SidebarContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top Navigation */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </button>
                  <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                    {title || 'Admin Dashboard'}
                  </h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="hidden md:block">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative">
                      <BellIcon className="w-6 h-6" />
                      {notifications > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  </div>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {darkMode ? (
                      <SunIcon className="w-6 h-6" />
                    ) : (
                      <MoonIcon className="w-6 h-6" />
                    )}
                  </button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Sidebar Content Component */}
      <SidebarContent />
    </div>
  )

  function SidebarContent() {
    return (
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange?.(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="px-3 py-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="px-3 py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    )
  }
}

export default AdminLayout
