import React from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, UserGroupIcon, UsersIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const ActivityItem = ({ activity }) => {
  // Map icon string to actual icon component
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'CalendarIcon':
        return CalendarIcon
      case 'UserGroupIcon':
        return UserGroupIcon
      case 'UsersIcon':
        return UsersIcon
      default:
        return CalendarIcon
    }
  }

  const Icon = getIcon(activity?.icon || 'CalendarIcon')
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      transition={{ duration: 0.3 }}
      className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 group"
    >
      <div className="relative">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity?.message || 'No message'}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500">{activity?.user || 'Unknown'}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{activity?.time || 'Just now'}</span>
        </div>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}

export default ActivityItem
