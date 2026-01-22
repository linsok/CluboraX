import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { changePassword } from '../api/auth'
import { 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon,
  UserCircleIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

const Settings = () => {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('general')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
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
    push: false,
    sms: true,
    marketing: false
  })

  const sections = [
    { id: 'general', label: 'General', icon: CogIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'account', label: 'Account', icon: UserCircleIcon },
    { id: 'language', label: 'Language', icon: GlobeAltIcon },
    { id: 'terms', label: 'Terms & Policies', icon: DocumentTextIcon }
  ]

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
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
                        defaultValue={user?.full_name || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Eastern Time (ET)</option>
                        <option>Central Time (CT)</option>
                        <option>Mountain Time (MT)</option>
                        <option>Pacific Time (PT)</option>
                      </select>
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
                      push: 'Push Notifications',
                      sms: 'SMS Notifications',
                      marketing: 'Marketing Communications'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{label}</h3>
                          <p className="text-sm text-gray-600">
                            {key === 'email' && 'Receive notifications via email'}
                            {key === 'push' && 'Receive push notifications in your browser'}
                            {key === 'sms' && 'Receive notifications via SMS'}
                            {key === 'marketing' && 'Receive marketing and promotional emails'}
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

              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Profile Visibility</h3>
                      <p className="text-sm text-gray-600 mb-3">Control who can see your profile information</p>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Everyone</option>
                        <option>Only Campus Members</option>
                        <option>Only Friends</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Data Sharing</h3>
                      <p className="text-sm text-gray-600">Manage how your data is shared with third parties</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Theme</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input type="radio" name="theme" defaultChecked className="text-purple-600" />
                          <span>Light Theme</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="radio" name="theme" className="text-purple-600" />
                          <span>Dark Theme</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="radio" name="theme" className="text-purple-600" />
                          <span>System Default</span>
                        </label>
                      </div>
                    </div>
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
                      <button className="text-red-600 hover:text-red-700 font-medium">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'language' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Language & Region</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'terms' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Terms & Policies</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Terms of Service</h3>
                      <button className="text-purple-600 hover:text-purple-700 font-medium">
                        View Terms of Service →
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Privacy Policy</h3>
                      <button className="text-purple-600 hover:text-purple-700 font-medium">
                        View Privacy Policy →
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Cookie Policy</h3>
                      <button className="text-purple-600 hover:text-purple-700 font-medium">
                        View Cookie Policy →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300">
                  Save Changes
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
