import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { changePassword } from '../api/auth'
import { apiClient } from '../api/client'
import { 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  UserCircleIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

const Settings = () => {
  const { user, logout, setUser } = useAuth()
  const [activeSection, setActiveSection] = useState('general')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: false
  })

  // Helper function to build display name from first and last name
  const getDisplayName = (userData) => {
    if (!userData) return ''
    
    let firstName = userData?.first_name || ''
    let lastName = userData?.last_name || ''
    
    // Handle if fields contain the string "undefined"
    if (firstName === 'undefined' || firstName === null) firstName = ''
    if (lastName === 'undefined' || lastName === null) lastName = ''
    
    const combined = `${firstName} ${lastName}`.trim()
    return combined && combined !== 'undefined' ? combined : ''
  }

  const [generalForm, setGeneralForm] = useState({
    displayName: getDisplayName(user),
    email: user?.email || ''
  })
  const [isSaving, setIsSaving] = useState(false)

  // Sync form when user data changes
  useEffect(() => {
    if (user) {
      setGeneralForm({
        displayName: getDisplayName(user),
        email: user?.email || ''
      })
    }
  }, [user])

  const sections = [
    { id: 'general', label: 'General', icon: CogIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'account', label: 'Account', icon: UserCircleIcon }
  ]

  const handleNotificationChange = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    try {
      await apiClient.put('/api/notifications/preferences/', updated)
      toast.success('Notification preference updated')
    } catch (err) {
      // Revert on failure
      setNotifications(notifications)
      toast.error('Failed to update notification preference')
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Split display name into first and last name
      const nameParts = generalForm.displayName?.trim().split(/\s+/) || []
      
      if (!nameParts[0]?.trim()) {
        toast.error('Display name is required. Please enter at least a first name.')
        setIsSaving(false)
        return
      }
      
      const payload = {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || ''
      }
      
      const result = await apiClient.patch('/api/auth/profile/', payload)
      
      // Update user data in AuthContext
      if (user && result.data) {
        const updatedUser = {
          ...user,
          first_name: result.data.first_name || nameParts[0] || '',
          last_name: result.data.last_name || nameParts.slice(1).join(' ') || '',
          name: result.data.first_name + (result.data.last_name ? ' ' + result.data.last_name : ''),
          full_name: result.data.first_name + (result.data.last_name ? ' ' + result.data.last_name : '')
        }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Also update the form to reflect saved values
        const fullName = (result.data.first_name || '') + (result.data.last_name ? ' ' + result.data.last_name : '')
        setGeneralForm(prev => ({
          ...prev,
          displayName: fullName.trim()
        }))
      }
      
      toast.success('Settings saved successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.first_name?.[0] || err.response?.data?.last_name?.[0] || 'Failed to save settings'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    
    setIsDeletingAccount(true)
    try {
      const response = await apiClient.delete('/api/auth/profile/')
      toast.success('Account deleted successfully. You will be logged out now.')
      setTimeout(() => {
        logout()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete account. Please contact support.'
      toast.error(msg)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      toast.error('Current password is required')
      return false
    }
    if (!passwordData.newPassword) {
      toast.error('New password is required')
      return false
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return false
    }
    if (!passwordData.confirmPassword) {
      toast.error('Please confirm your new password')
      return false
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return false
    }
    return true
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) return
    
    try {
      // Call the API to change password
      const response = await changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirm: passwordData.confirmPassword
      })
      
      if (response.success) {
        toast.success('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordForm(false)
      } else {
        toast.error(response.message || 'Failed to update password')
      }
    } catch (error) {
      console.error('Password update error:', error)
      
      // Handle API errors
      if (error.data) {
        // Django REST framework returns errors in data object
        const errors = error.data
        if (typeof errors === 'object') {
          // Handle field-specific errors
          Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]]
            fieldErrors.forEach(err => {
              if (field === 'old_password') {
                toast.error('Current password is incorrect')
              } else if (field === 'new_password') {
                toast.error(`New password: ${err}`)
              } else if (field === 'non_field_errors') {
                toast.error(err)
              } else {
                toast.error(`${field}: ${err}`)
              }
            })
          })
        } else if (errors.message) {
          toast.error(errors.message)
        } else {
          toast.error('Failed to update password. Please try again.')
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update password. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="h-5 w-5" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeSection === 'general' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={generalForm.displayName || ''}
                        onChange={e => setGeneralForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={generalForm.email}
                        onChange={e => setGeneralForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {Object.entries({
                      email: 'Email Notifications',
                      push: 'Push Notifications'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{label}</h3>
                          <p className="text-sm text-gray-600">
                            {key === 'email' && 'Receive notifications via email'}
                            {key === 'push' && 'Receive push notifications in your browser'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange(key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[key] ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[key] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Management</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                      {!showPasswordForm ? (
                        <button 
                          onClick={() => setShowPasswordForm(true)}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Update Password →
                        </button>
                      ) : (
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? 'text' : 'password'}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPasswords.current ? (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? 'text' : 'password'}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPasswords.new ? (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPasswords.confirm ? (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Update Password
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPasswordForm(false)
                                setPasswordData({
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                })
                              }}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                      <p className="text-sm text-red-600 mb-3">Permanently delete your account and all data</p>
                      
                      {!showDeleteConfirm ? (
                        <button
                          onClick={handleDeleteAccount}
                          className="text-red-600 hover:text-red-700 font-medium hover:underline"
                        >
                          Delete Account
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-red-100 border border-red-300 rounded">
                            <p className="text-sm text-red-900 font-medium">
                              ⚠️ Are you absolutely sure? This action is permanent and cannot be undone.
                            </p>
                            <p className="text-xs text-red-700 mt-2">
                              All your data will be permanently deleted, including your profile, events, clubs, and all associated information.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              disabled={isDeletingAccount}
                              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeleteAccount}
                              disabled={isDeletingAccount}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isDeletingAccount ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Deleting...
                                </>
                              ) : (
                                'Permanently Delete'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Settings
