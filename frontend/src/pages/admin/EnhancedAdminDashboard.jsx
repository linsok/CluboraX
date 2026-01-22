import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import { useQuery } from '@tanstack/react-query'
import { apiRequest, getApiUrl, API_ENDPOINTS } from '../../utils/auth'
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
  SignalIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

const EnhancedAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [timeRange, setTimeRange] = useState('7d')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch dashboard statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.DASHBOARD_STATS))
  })

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.USER_STATS))
  })

  // Fetch proposal statistics
  const { data: proposalStats } = useQuery({
    queryKey: ['admin-proposal-stats'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.PROPOSAL_STATS))
  })

  // Fetch recent activities
  const { data: activities } = useQuery({
    queryKey: ['admin-recent-activities'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.RECENT_ACTIVITIES))
  })

  // Fetch upcoming events
  const { data: events } = useQuery({
    queryKey: ['admin-upcoming-events'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.UPCOMING_EVENTS))
  })

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => apiRequest(getApiUrl(API_ENDPOINTS.SYSTEM_HEALTH))
  })

  const userGrowthData = userStats?.userGrowth || [
    { day: 'Mon', users: 45 },
    { day: 'Tue', users: 52 },
    { day: 'Wed', users: 48 },
    { day: 'Thu', users: 61 },
    { day: 'Fri', users: 55 },
    { day: 'Sat', users: 72 },
    { day: 'Sun', users: 68 }
  ]

  const proposalData = proposalStats?.proposalData || [
    { type: 'Club', count: 45, color: 'bg-blue-500' },
    { type: 'Event', count: 32, color: 'bg-green-500' },
    { type: 'Funding', count: 28, color: 'bg-yellow-500' },
    { type: 'Project', count: 21, color: 'bg-purple-500' }
  ]

  const recentActivities = activities?.activities?.map(activity => ({
    id: activity.id,
    user: activity.user,
    action: activity.action,
    target: activity.target,
    time: new Date(activity.timestamp).toLocaleString(),
    icon: activity.action.includes('proposal') ? DocumentTextIcon : 
          activity.action.includes('event') ? CalendarIcon : 
          activity.action.includes('club') ? UsersIcon : 
          activity.action.includes('profile') ? PencilIcon : DocumentTextIcon,
    color: activity.action.includes('proposal') ? 'text-blue-600' : 
           activity.action.includes('event') ? 'text-green-600' : 
           activity.action.includes('club') ? 'text-purple-600' : 
           activity.action.includes('profile') ? 'text-gray-600' : 'text-blue-600'
  })) || [
    { id: 1, user: 'John Doe', action: 'Submitted proposal', target: 'Computer Science Club', time: '2 hours ago', icon: DocumentTextIcon, color: 'text-blue-600' },
    { id: 2, user: 'Jane Smith', action: 'Created event', target: 'Spring Festival', time: '3 hours ago', icon: CalendarIcon, color: 'text-green-600' },
    { id: 3, user: 'Mike Johnson', action: 'Joined club', target: 'Photography Club', time: '5 hours ago', icon: UsersIcon, color: 'text-purple-600' },
    { id: 4, user: 'Sarah Wilson', action: 'Updated profile', target: 'Personal Information', time: '6 hours ago', icon: PencilIcon, color: 'text-gray-600' }
  ]

  const upcomingEvents = events?.events?.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    attendees: event.attendees,
    status: event.status
  })) || [
    { id: 1, title: 'Spring Festival 2024', date: '2024-03-15', attendees: 245, status: 'upcoming' },
    { id: 2, title: 'Tech Talk: AI in Education', date: '2024-03-18', attendees: 89, status: 'upcoming' },
    { id: 3, title: 'Career Fair 2024', date: '2024-03-22', attendees: 412, status: 'upcoming' }
  ]

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{description}</p>
      )}
    </motion.div>
  )

  const ActivityCard = ({ activity }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
        <activity.icon className={`w-5 h-5 ${activity.color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.user} {activity.action}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.target}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
      </div>
    </motion.div>
  )

  const EventCard = ({ event }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {event.date}
            </span>
            <span className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-1" />
              {event.attendees} attendees
            </span>
          </div>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          {event.status}
        </span>
      </div>
      <div className="flex space-x-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          View Details
        </button>
        <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
          Edit
        </button>
      </div>
    </motion.div>
  )

  const ChartPlaceholder = ({ title, data }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.day || item.type}</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.users || item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            icon={UsersIcon}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            trend={stats?.growth?.monthly_growth}
            description="Registered users"
          />
          <StatCard
            title="Active Users"
            value={stats?.users?.active || 0}
            icon={UserGroupIcon}
            color="bg-gradient-to-r from-green-500 to-green-600"
            trend={8.2}
            description="Currently active"
          />
          <StatCard
            title="Pending Proposals"
            value={stats?.proposals?.pending || 0}
            icon={DocumentTextIcon}
            color="bg-gradient-to-r from-yellow-500 to-yellow-600"
            description="Need review"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.revenue?.total || 0).toLocaleString()}`}
            icon={CurrencyDollarIcon}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            trend={15.3}
            description="This month"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder title="User Growth (Last 7 Days)" data={userGrowthData} />
          <ChartPlaceholder title="Proposals by Type" data={proposalData} />
        </div>

        {/* Activity and Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
              <PlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Add User</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
              <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Create Event</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors">
              <DocumentTextIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Review Proposals</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
              <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default EnhancedAdminDashboard
