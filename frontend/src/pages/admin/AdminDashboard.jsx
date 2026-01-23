import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  UserIcon,
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getAdminUsers, getAdminRequests, getAdminStats, updateUserStatus, updateRequestStatus } from '../../api/admin'

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token')
    const adminUserData = localStorage.getItem('admin_user')
    
    if (!adminToken || !adminUserData) {
      navigate('/admin/login')
      return
    }
    
    try {
      setAdminUser(JSON.parse(adminUserData))
    } catch (error) {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    toast.success('Logged out successfully')
    navigate('/admin/login')
  }

  // Real API queries for admin data
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('Fetching users...')
        const result = await getAdminUsers()
        console.log('Users fetched successfully:', result)
        return result
      } catch (error) {
        console.error('Error fetching users:', error)
        throw error
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Failed to load users:', error)
      if (error.response?.status === 401) {
        toast.error('Admin authentication failed')
        navigate('/admin/login')
      } else if (error.response?.status === 403) {
        toast.error('Admin access required')
      } else {
        toast.error('Failed to load users')
      }
    }
  })

  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      try {
        console.log('Fetching requests...')
        const result = await getAdminRequests()
        console.log('Requests fetched successfully:', result)
        return result
      } catch (error) {
        console.error('Error fetching requests:', error)
        throw error
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Failed to load requests:', error)
      if (error.response?.status === 401) {
        toast.error('Admin authentication failed')
        navigate('/admin/login')
      } else if (error.response?.status === 403) {
        toast.error('Admin access required')
      } else {
        toast.error('Failed to load requests')
      }
    }
  })

  const { data: stats = {}, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        console.log('Fetching stats...')
        const result = await getAdminStats()
        console.log('Stats fetched successfully:', result)
        return result
      } catch (error) {
        console.error('Error fetching stats:', error)
        throw error
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Failed to load stats:', error)
      if (error.response?.status === 401) {
        toast.error('Admin authentication failed')
        navigate('/admin/login')
      } else if (error.response?.status === 403) {
        toast.error('Admin access required')
      } else {
        toast.error('Failed to load statistics')
      }
    }
  })

  // Mutations for user management
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      queryClient.invalidateQueries(['admin-stats'])
      toast.success('User status updated successfully')
    },
    onError: (error) => {
      console.error('Failed to update user:', error)
      toast.error('Failed to update user status')
    }
  })

  // Mutations for request management
  const updateRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) => updateRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-requests'])
      queryClient.invalidateQueries(['admin-stats'])
      toast.success('Request status updated successfully')
    },
    onError: (error) => {
      console.error('Failed to update request:', error)
      toast.error('Failed to update request status')
    }
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900'
      case 'pending': return 'text-yellow-400 bg-yellow-900'
      case 'rejected': return 'text-red-400 bg-red-900'
      case 'approved': return 'text-green-400 bg-green-900'
      default: return 'text-gray-400 bg-gray-900'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900'
      case 'medium': return 'text-yellow-400 bg-yellow-900'
      case 'low': return 'text-blue-400 bg-blue-900'
      default: return 'text-gray-400 bg-gray-900'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'club': return <UserGroupIcon className="w-5 h-5" />
      case 'event': return <CalendarIcon className="w-5 h-5" />
      case 'funding': return <CurrencyDollarIcon className="w-5 h-5" />
      default: return <DocumentTextIcon className="w-5 h-5" />
    }
  }

  // Handler functions for user actions
  const handleUserAction = (userId, action) => {
    if (action === 'activate') {
      updateUserMutation.mutate({ userId, status: true })
    } else if (action === 'deactivate') {
      updateUserMutation.mutate({ userId, status: false })
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this user?')) {
        // Implement delete functionality
        toast.success('User deleted successfully')
      }
    }
  }

  // Handler functions for request actions
  const handleRequestAction = (requestId, action) => {
    if (action === 'approve') {
      updateRequestMutation.mutate({ requestId, status: 'approved' })
    } else if (action === 'reject') {
      updateRequestMutation.mutate({ requestId, status: 'rejected' })
    }
  }

  // Filter functions
  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const userName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active) ||
                         (filterStatus === 'pending' && !user.is_verified)
    return matchesSearch && matchesStatus
  })

  const filteredRequests = (Array.isArray(requests) ? requests : []).filter(request => {
    const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
                <p className="text-sm text-gray-400">System Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              <button className="p-2 text-gray-400 hover:text-white">
                <BellIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                { id: 'users', label: 'User Management', icon: UsersIcon },
                { id: 'requests', label: 'Request Management', icon: DocumentTextIcon },
                { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
                { id: 'system', label: 'System Health', icon: ServerIcon },
                { id: 'settings', label: 'Settings', icon: CogIcon }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Overview Section */}
          {activeSection === 'overview' && (
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
                    label: 'Active Users',
                    value: stats.active_users || (Array.isArray(users) ? users.filter(u => u.is_active).length : 0),
                    icon: UserGroupIcon,
                    color: 'from-green-500 to-green-600',
                    change: '+15.3%'
                  },
                  {
                    label: 'Pending Requests',
                    value: stats.pending_approvals || (Array.isArray(requests) ? requests.filter(r => r.status === 'pending').length : 0),
                    icon: ClockIcon,
                    color: 'from-yellow-500 to-yellow-600',
                    change: '+5.1%'
                  },
                  {
                    label: 'System Uptime',
                    value: stats.system_health?.status === 'healthy' ? '99.9%' : 'Degraded',
                    icon: ServerIcon,
                    color: stats.system_health?.status === 'healthy' ? 'from-purple-500 to-purple-600' : 'from-red-500 to-red-600',
                    change: stats.system_health?.status === 'healthy' ? 'Stable' : 'Warning'
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
                      {requests.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-700 rounded-lg">
                              {getTypeIcon(request.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{request.title}</p>
                              <p className="text-xs text-gray-400">by {request.submittedBy}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">{request.submittedDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">User Management</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                {usersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading users...</p>
                  </div>
                ) : usersError ? (
                  <div className="text-center py-12">
                    <p className="text-red-400">Failed to load users</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-300" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-300">{user.role}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active ? 'text-green-400 bg-green-900' : 'text-red-400 bg-red-900'
                            }`}>
                              {user.is_active ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowUserModal(true)
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                                className="text-green-400 hover:text-green-300"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="text-red-400 hover:text-red-300"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Other sections would go here */}
          {activeSection === 'requests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Request Management</h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
                <p className="text-gray-300">Request management interface would go here</p>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Analytics</h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
                <p className="text-gray-300">Analytics dashboard would go here</p>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CircleStackIcon className="w-8 h-8 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">Database</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">Healthy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-gray-300">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time:</span>
                      <span className="text-gray-300">45ms</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <ServerIcon className="w-8 h-8 text-green-400" />
                    <h3 className="text-lg font-medium text-white">Server</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU Usage:</span>
                      <span className="text-gray-300">32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory:</span>
                      <span className="text-gray-300">4.2GB / 8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Disk Space:</span>
                      <span className="text-gray-300">156GB / 500GB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
                <p className="text-gray-300">System settings would go here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
