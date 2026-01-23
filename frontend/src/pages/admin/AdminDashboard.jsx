import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
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
    const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token')
    const userData = localStorage.getItem('admin_user') || localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/admin/login')
      return
    }
    
    try {
      const user = JSON.parse(userData)
      // Check if user is admin
      if (user.role !== 'admin') {
        navigate('/dashboard')
        return
      }
      setAdminUser(user)
    } catch (error) {
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
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
    mutationFn: ({ requestId, status, comment = '' }) => updateRequestStatus(requestId, status, comment),
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
  const handleRequestAction = (requestId, action, comment = '') => {
    if (action === 'approve') {
      updateRequestMutation.mutate({ requestId, status: 'approved', comment })
    } else if (action === 'reject') {
      updateRequestMutation.mutate({ requestId, status: 'rejected', comment })
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
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
              <p className="text-sm text-gray-400">System Administration</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Quick navigation */}
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'overview' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('requests')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'requests' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Request Management
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'users' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              User Management
            </button>
            <Link
              to="/admin/proposals"
              className="px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
            >
              Advanced View
            </Link>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminUser?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400">{adminUser?.email || 'admin@campus.edu'}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Logout
            </button>
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

          {/* Request Management Section */}
          {activeSection === 'requests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Request Management</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Proposals</p>
                      <p className="text-2xl font-bold text-white">{requests.length}</p>
                    </div>
                    <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-white">{requests.filter(r => r.status === 'pending').length}</p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Approved</p>
                      <p className="text-2xl font-bold text-white">{requests.filter(r => r.status === 'approved').length}</p>
                    </div>
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Rejected</p>
                      <p className="text-2xl font-bold text-white">{requests.filter(r => r.status === 'rejected').length}</p>
                    </div>
                    <XCircleIcon className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Proposals List */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">All Proposals ({requests.length})</h3>
                  <button 
                    onClick={() => navigate('/admin/proposals')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Advanced View
                  </button>
                </div>
                
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading proposals...</p>
                  </div>
                ) : requestsError ? (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-400">Failed to load proposals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <div key={request.id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-gray-600 rounded-lg">
                                  {getTypeIcon(request.type)}
                                </div>
                                <div>
                                  <h4 className="text-white font-semibold text-lg">{request.title}</h4>
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                                    <span className="capitalize">{request.type}</span>
                                    <span>•</span>
                                    <span>By {request.submitted_by?.name || request.submitted_by?.email || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{new Date(request.submitted_at || request.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {request.description && (
                                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{request.description}</p>
                              )}
                              
                              {/* Club Details Preview */}
                              {request.type === 'club' && request.long_description && (
                                <div className="bg-gray-600/30 rounded p-3 mb-4">
                                  <p className="text-xs text-gray-400 mb-2">Club Details Preview:</p>
                                  <div className="text-xs text-gray-300 space-y-1">
                                    {request.long_description.includes('Leader:') && (
                                      <p><strong>Leader:</strong> {request.long_description.split('Leader:')[1]?.split('\n')[0]?.trim()}</p>
                                    )}
                                    {request.long_description.includes('Capacity:') && (
                                      <p><strong>Capacity:</strong> {request.long_description.split('Capacity:')[1]?.split('\n')[0]?.trim()}</p>
                                    )}
                                    {request.long_description.includes('Meeting Time:') && (
                                      <p><strong>Meeting:</strong> {request.long_description.split('Meeting Time:')[1]?.split('\n')[0]?.trim()}</p>
                                    )}
                                    {request.long_description.includes('Location:') && (
                                      <p><strong>Location:</strong> {request.long_description.split('Location:')[1]?.split('\n')[0]?.trim()}</p>
                                    )}
                                  </div>
                                  <p className="text-xs text-blue-400 mt-2">Click view details to see complete information</p>
                                </div>
                              )}
                              
                              {/* Additional Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500">Priority</p>
                                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                                    {request.priority}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Status</p>
                                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                                    {request.status.replace('_', ' ')}
                                  </span>
                                </div>
                                {request.budget && (
                                  <div>
                                    <p className="text-xs text-gray-500">Budget</p>
                                    <p className="text-sm text-gray-300">${parseFloat(request.budget).toLocaleString()}</p>
                                  </div>
                                )}
                                {request.deadline && (
                                  <div>
                                    <p className="text-xs text-gray-500">Deadline</p>
                                    <p className="text-sm text-gray-300">{new Date(request.deadline).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Tags */}
                              {request.tags && request.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {request.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-500 rounded transition-colors"
                                title="View full details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              {request.status === 'pending' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleRequestAction(request.id, 'approve', 'Approved by admin')}
                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-500 rounded transition-colors"
                                    title="Approve"
                                    disabled={updateRequestMutation.isLoading}
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(request.id, 'reject', 'Rejected by admin')}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-500 rounded transition-colors"
                                    title="Reject"
                                    disabled={updateRequestMutation.isLoading}
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No proposals found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Analytics</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400">Analytics dashboard coming soon...</p>
              </div>
            </div>
          )}

          {/* System Health Section */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">System Health</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400">System health monitoring coming soon...</p>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400">Admin settings coming soon...</p>
              </div>
            </div>
          )}

          {/* Request Detail Modal */}
          <AnimatePresence>
            {showRequestModal && selectedRequest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowRequestModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{selectedRequest.title}</h3>
                    <button
                      onClick={() => setShowRequestModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="text-white capitalize">{selectedRequest.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Priority</p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                          {selectedRequest.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted By</p>
                        <p className="text-white">{selectedRequest.submitted_by?.name || selectedRequest.submitted_by?.email || 'Unknown'}</p>
                      </div>
                      {selectedRequest.budget && (
                        <div>
                          <p className="text-sm text-gray-500">Budget</p>
                          <p className="text-white">${parseFloat(selectedRequest.budget).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedRequest.deadline && (
                        <div>
                          <p className="text-sm text-gray-500">Deadline</p>
                          <p className="text-white">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedRequest.description && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Description</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedRequest.description}</p>
                      </div>
                    )}
                    
                    {/* Enhanced Club Details Display */}
                    {selectedRequest.type === 'club' && selectedRequest.long_description && (
                      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 mb-3">Complete Club Proposal Details</p>
                        <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedRequest.long_description}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional description field if separate from long_description */}
                    {selectedRequest.long_description && !selectedRequest.long_description.includes('**Club Details:**') && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Additional Information</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedRequest.long_description}</p>
                      </div>
                    )}
                    
                    {selectedRequest.tags && selectedRequest.tags.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                      {selectedRequest.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              handleRequestAction(selectedRequest.id, 'reject', 'Rejected by admin')
                              setShowRequestModal(false)
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            disabled={updateRequestMutation.isLoading}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              handleRequestAction(selectedRequest.id, 'approve', 'Approved by admin')
                              setShowRequestModal(false)
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            disabled={updateRequestMutation.isLoading}
                          >
                            Approve
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowRequestModal(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
