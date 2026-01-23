import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  BellIcon,
  CogIcon,
  ChartBarIcon,
  PhotoIcon,
  SparklesIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { Toaster } from 'react-hot-toast'

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'
import Footer from './components/Layout/Footer'

// Page Components
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Clubs from './pages/Clubs'
import Gallery from './pages/Gallery'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import GoogleCallback from './pages/Auth/GoogleCallback'
import GoogleAccountSelection from './pages/Auth/GoogleAccountSelection'
import RoleSelection from './pages/Auth/RoleSelection'

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogin from './pages/admin/AdminLogin'
import ProposalManagement from './pages/admin/ProposalManagement'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Check if current page is an auth page or landing page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/auth/google/callback' || location.pathname === '/auth/google/select-account' || location.pathname === '/auth/role-selection'
  const isLandingPage = location.pathname === '/'
  const isAdminPage = location.pathname.startsWith('/admin')

  // Single authentication and routing logic
  useEffect(() => {
    if (isLoading) return // Don't do anything while loading

    if (!isAuthenticated) {
      // Not authenticated
      if (isAuthPage || isLandingPage) {
        // Allow access to auth and landing pages
        return
      } else {
        // Redirect unauthenticated users
        if (isAdminPage) {
          localStorage.setItem('intended_destination', location.pathname)
        }
        navigate('/login')
        return
      }
    }

    // Authenticated user
    if (isAdminPage && user?.role !== 'admin') {
      // Non-admin trying to access admin pages
      navigate('/dashboard')
      return
    }

    // Allow admin users to access admin dashboard
    if (location.pathname.startsWith('/admin/dashboard') && user?.role === 'admin') {
      return
    }

    // Authenticated user is on the right page type
    return
  }, [isLoading, isAuthenticated, isAuthPage, isLandingPage, isAdminPage, user, navigate, location.pathname])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Campus Hub...</p>
        </div>
      </div>
    )
  }

  // Mock data for development - in production, this would come from API
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@campus.edu',
    role: 'Student',
    major: 'Computer Science',
    year: 'Senior',
    avatar: null,
    joinDate: 'September 2021',
    lastActive: '2 hours ago'
  }

  // Use authenticated user if available, otherwise use mock data
  const currentUser = user || mockUser
  
  // Ensure user has consistent field names
  if (user && !user.name && user.first_name) {
    currentUser.name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }
  if (user && !user.major && user.faculty) {
    currentUser.major = user.faculty
  }
  if (user && !user.avatar && user.profile_picture_url) {
    currentUser.avatar = user.profile_picture_url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Show sidebar and navbar only on authenticated pages */}
      {!isAuthPage && !isLandingPage && !isAdminPage && (
        <div className="flex">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={currentUser} />
          
          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <Navbar user={currentUser} onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen"
              >
                <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/courses" element={<Dashboard />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/clubs" element={<Clubs />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/achievements" element={<Profile />} />
                  <Route path="/activities" element={<Profile />} />
                  <Route path="/analytics" element={<Dashboard />} />
                  <Route path="/notifications" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.div>
            </main>
            <Footer />
          </div>
        </div>
      )}
      
      {/* Landing Page - no sidebar or navbar */}
      {isLandingPage && (
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        </main>
      )}
      
      {/* Admin pages - no sidebar or navbar */}
      {isAdminPage && (
        <main className="flex-1">
          <Routes>
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/proposals" element={<ProposalManagement />} />
          </Routes>
        </main>
      )}
      
      {/* Auth pages - no sidebar or navbar */}
      {isAuthPage && (
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/google/select-account" element={<GoogleAccountSelection />} />
              <Route path="/auth/role-selection" element={<RoleSelection />} />
            </Routes>
          </motion.div>
        </main>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
