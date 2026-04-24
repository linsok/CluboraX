import React from 'react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

const OverviewSection = ({ users = [], requests = [], stats = {}, requestsLoading, getStatusColor }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">System Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Users',
            value: stats.total_users || (Array.isArray(users) ? users.length : 0),
            icon: UsersIcon,
            color: 'from-blue-500 to-blue-600',
            change: '+8.2%'
          },
          {
            label: 'Active Clubs',
            value: stats.total_clubs || 45,
            icon: UserGroupIcon,
            color: 'from-green-500 to-green-600',
            change: '+12%'
          },
          {
            label: 'Total Events',
            value: stats.total_events || 128,
            icon: CalendarIcon,
            color: 'from-purple-500 to-purple-600',
            change: '+23%'
          },
          {
            label: 'Pending Proposals',
            value: stats.pending_approvals || (Array.isArray(requests) ? requests.filter(r => r.status === 'pending_review').length : 0),
            icon: DocumentTextIcon,
            color: 'from-yellow-500 to-yellow-600',
            change: '+5.1%'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-green-400">{stat.change}</p>
              </div>
              <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Recent Activities</h3>
        </div>
        <div className="p-6">
          {requestsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading activities...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show mixed activities from proposals, clubs, and events */}
              {[
                { id: 1, type: 'club', title: 'New Club: Computer Science Society', submittedBy: 'John Doe', status: 'pending', date: '2 hours ago', icon: UserGroupIcon },
                { id: 2, type: 'event', title: 'Tech Summit 2026', submittedBy: 'Tech Club', status: 'approved', date: '4 hours ago', icon: CalendarIcon },
                { id: 3, type: 'proposal', title: 'Funding Request: AI Workshop', submittedBy: 'Jane Smith', status: 'pending', date: '6 hours ago', icon: DocumentTextIcon },
                { id: 4, type: 'club', title: 'Club Update: Drama Club', submittedBy: 'Admin', status: 'approved', date: '1 day ago', icon: UserGroupIcon },
                { id: 5, type: 'event', title: 'Spring Festival', submittedBy: 'Events Team', status: 'approved', date: '1 day ago', icon: CalendarIcon },
              ].map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'club' ? 'bg-blue-600' :
                      activity.type === 'event' ? 'bg-purple-600' :
                      'bg-yellow-600'
                    }`}>
                      <activity.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-gray-400">by {activity.submittedBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverviewSection
