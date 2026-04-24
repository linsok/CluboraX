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

// Hooks
import { usePushNotifications } from './hooks/usePushNotifications.jsx'

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
import Notifications from './pages/Notifications'
import AIAdvisor from './pages/AIAdvisor'
import Landing from './pages/Landing'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import GoogleCallback from './pages/Auth/GoogleCallback'
import GoogleAccountSelection from './pages/Auth/GoogleAccountSelection'
import RoleSelection from './pages/Auth/RoleSelection'

// Support Pages
import HelpCenter from './pages/HelpCenter'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminUI from './pages/admin/AdminUI'
import ContentPublishManagement from './pages/admin/ContentPublishManagement'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Enable push notifications polling if user is authenticated and has notifications enabled
  const pushNotificationsEnabled = isAuthenticated && user?.notification_preferences?.push_notifications !== false
  usePushNotifications(pushNotificationsEnabled)

  // Check if current page is an auth page or landing page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/auth/google/callback' || location.pathname === '/auth/google/select-account' || location.pathname === '/auth/role-selection'
  const isLandingPage = location.pathname === '/'
  const isAdminPage = location.pathname.startsWith('/admin')
  const isSupportPage = ['/help-center', '/contact', '/privacy', '/terms'].includes(location.pathname)
  const isAIAdvisorPage = location.pathname === '/ai-advisor'

  // Redirect to landing if not authenticated and not on auth page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage && !isLandingPage && !isSupportPage) {
      navigate('/')
    }
  }, [isLoading, isAuthenticated, isAuthPage, isLandingPage, isSupportPage, navigate])

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAuthPage && !isLandingPage && !isAdminPage && user?.role === 'admin') {
      navigate('/admin/dashboard')
    }
  }, [isLoading, isAuthenticated, isAuthPage, isLandingPage, isAdminPage, user, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">CluboraX</span>
        </div>

        {/* Spinner */}
        <div className="relative w-14 h-14 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>

        {/* Text */}
        <p className="text-sm font-medium text-gray-500 tracking-wide">Loading Campus Hub…</p>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-[loading-bar_1.4s_ease-in-out_infinite]"></div>
        </div>
      </div>
    )
  }

  // Return null while redirecting
  if (!isAuthenticated && !isAuthPage && !isLandingPage && !isSupportPage) {
    return null
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
  if (user) {
    // Build display name from first_name + last_name, with fallbacks
    const firstName = (user.first_name || '').trim()
    const lastName = (user.last_name || '').trim()
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || 
                       user.full_name?.trim() ||
                       user.name ||
                       user.email?.split('@')[0] ||
                       'Campus User'
    
    currentUser.name = displayName
    currentUser.first_name = firstName || user.first_name || ''
    currentUser.last_name = lastName || user.last_name || ''
    
    // Map faculty to major if not present
    if (!user.major && user.faculty) {
      currentUser.major = user.faculty
    }
    
    // Use profile picture URL if available
    if (!user.avatar && user.profile_picture_url) {
      currentUser.avatar = user.profile_picture_url
    }
    
    // Debug: log the current user
    console.log('App currentUser:', {
      name: currentUser.name,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      full_name: user.full_name,
      email: currentUser.email
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* Support Pages - accessible to all, with minimal layout */}
      {isSupportPage && (
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <Routes>
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </motion.div>
          <Footer />
        </main>
      )}
      
      {/* Show sidebar and navbar only on authenticated pages */}
      {!isAuthPage && !isLandingPage && !isAdminPage && !isSupportPage && !isAIAdvisorPage && (
        <div className="flex flex-col">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={currentUser} />
          
          {/* Main Content */}
          <div className="flex-1 w-full">
            <Navbar user={currentUser} onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen"
              >
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/courses" element={<Dashboard />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/clubs" element={<Clubs />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/achievements" element={<Profile />} />
                  <Route path="/activities" element={<Profile />} />
                  <Route path="/analytics" element={<Dashboard />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.div>
            </main>
            {!isAIAdvisorPage && <Footer />}
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
            <Route path="/admin/publish" element={<ContentPublishManagement />} />
            <Route path="/admin/ui" element={<AdminUI />} />
            <Route path="/admin/users" element={<AdminUI />} />
            <Route path="/admin/proposals" element={<AdminUI />} />
          </Routes>
        </main>
      )}
      
      {/* AI Advisor page - no sidebar or navbar */}
      {isAIAdvisorPage && (
        <main className="flex-1">
          <Routes>
            <Route path="/ai-advisor" element={<AIAdvisor />} />
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
