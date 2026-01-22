import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  ServerIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    storage: 'healthy',
    cache: 'healthy'
  })

  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard-stats/')
      return response.json()
    }
  })

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-stats/')
      return response.json()
    }
  })

  // Fetch proposal statistics
  const { data: proposalStats } = useQuery({
    queryKey: ['admin-proposal-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/proposal-stats/')
      return response.json()
    }
  })

  // Fetch system health
  const { data: healthData } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-health/')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  useEffect(() => {
    if (healthData) {
      setSystemHealth(healthData)
    }
  }, [healthData])

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => (
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
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  )

  const SystemHealthCard = ({ component, status, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg border ${
        status === 'healthy' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${
            status === 'healthy' ? 'text-green-600' : 'text-red-600'
          }`} />
          <span className={`text-sm font-medium ${
            status === 'healthy' ? 'text-green-700' : 'text-red-700'
          }`}>
            {component}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full ${
          status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage users, proposals, and system settings</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">System Healthy</span>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <BellIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={userStats?.total || 0}
              icon={UsersIcon}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              trend="up"
              trendValue="+12%"
              description="Registered users"
            />
            <StatCard
              title="Active Users"
              value={userStats?.active || 0}
              icon={CheckCircleIcon}
              color="bg-gradient-to-r from-green-500 to-green-600"
              trend="up"
              trendValue="+8%"
              description="Currently active"
            />
            <StatCard
              title="Pending Proposals"
              value={proposalStats?.pending || 0}
              icon={ClockIcon}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
              description="Awaiting review"
            />
            <StatCard
              title="Total Proposals"
              value={proposalStats?.total || 0}
              icon={DocumentTextIcon}
              color="bg-gradient-to-r from-purple-500 to-purple-600"
              trend="up"
              trendValue="+23%"
              description="All proposals"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart component would go here</p>
                </div>
              </div>
            </motion.div>

            {/* Proposal Status Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Status</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart component would go here</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SystemHealthCard
                component="Database"
                status={systemHealth?.database || 'healthy'}
                icon={CircleStackIcon}
              />
              <SystemHealthCard
                component="Storage"
                status={systemHealth?.storage || 'healthy'}
                icon={ServerIcon}
              />
              <SystemHealthCard
                component="Cache"
                status={systemHealth?.cache || 'healthy'}
                icon={SignalIcon}
              />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
            >
              <UsersIcon className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
            >
              <DocumentTextIcon className="w-8 h-8 text-yellow-600 mb-3" />
              <h4 className="font-semibold text-gray-900">Review Proposals</h4>
              <p className="text-sm text-gray-600">Check pending proposals</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
            >
              <BellIcon className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-gray-900">Announcements</h4>
              <p className="text-sm text-gray-600">Create announcements</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
            >
              <CogIcon className="w-8 h-8 text-gray-600 mb-3" />
              <h4 className="font-semibold text-gray-900">Settings</h4>
              <p className="text-sm text-gray-600">System configuration</p>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
