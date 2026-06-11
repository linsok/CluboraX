import React from 'react'
import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => {
  // Safety checks for value
  const safeValue = value !== undefined && value !== null ? value : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} shadow-md group-hover:shadow-lg transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
              {trendValue}
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  )
}


export default StatCard
