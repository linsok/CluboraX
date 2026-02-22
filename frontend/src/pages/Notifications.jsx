import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserNotifications } from '../api/courses'
import toast from 'react-hot-toast'
import { 
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CalendarIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const Notifications = () => {
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getUserNotifications,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  })

  const displayNotifications = Array.isArray(notifications) ? notifications : []

  // Filter notifications
  const filteredNotifications = displayNotifications.filter(notif => {
    const typeMatch = filterType === 'all' || notif.type === filterType
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'unread' && !notif.read) ||
                       (filterStatus === 'read' && notif.read)
    return typeMatch && statusMatch
  })

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    const iconClass = priority === 'high' ? 'text-red-500' : 
                     priority === 'medium' ? 'text-yellow-500' : 
                     'text-blue-500'
    
    switch (type) {
      case 'event':
        return <CalendarIcon className={`w-6 h-6 ${iconClass}`} />
      case 'club':
        return <UserGroupIcon className={`w-6 h-6 ${iconClass}`} />
      case 'announcement':
        return <ExclamationCircleIcon className={`w-6 h-6 ${iconClass}`} />
      case 'system':
        return <InformationCircleIcon className={`w-6 h-6 ${iconClass}`} />
      case 'success':
        return <CheckCircleIcon className={`w-6 h-6 ${iconClass}`} />
      default:
        return <BellIcon className={`w-6 h-6 ${iconClass}`} />
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      // TODO: Implement API call to mark notification as read
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('Notification marked as read')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement API call to mark all notifications as read
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('All notifications marked as read')
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      // TODO: Implement API call to delete notification
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('Notification deleted')
    }
  })

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleDeleteNotification = (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(notificationId)
    }
  }

  const unreadCount = filteredNotifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </motion.button>
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Mark All Read</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Filter:</span>
            </div>
            
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', 'event', 'club', 'announcement', 'system'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 hidden sm:block" />

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'unread', 'read'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'unread' ? (
                    <span className="flex items-center space-x-1">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>Unread</span>
                    </span>
                  ) : status === 'read' ? (
                    <span className="flex items-center space-x-1">
                      <EnvelopeOpenIcon className="w-4 h-4" />
                      <span>Read</span>
                    </span>
                  ) : (
                    'All'
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filterType !== 'all' || filterStatus !== 'all'
                  ? 'No notifications match your filters'
                  : 'You\'re all caught up! Check back later for updates.'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 ${
                    !notification.read ? 'border-l-4 border-purple-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      !notification.read ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="ml-2 flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {formatTimestamp(notification.timestamp)}
                        <span className="mx-2">•</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {notification.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Empty State for No More Notifications */}
        {filteredNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8"
          >
            <p className="text-gray-500 text-sm">
              That's all your notifications for now
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Notifications
