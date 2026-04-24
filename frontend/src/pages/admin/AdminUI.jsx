import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getAdminStats, getAdminUsers, getAdminRequests } from '../../api/admin'
import { 
  UsersIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserCircleIcon,
  ArchiveBoxArrowDownIcon,
  CreditCardIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const AdminUI = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [proposalType, setProposalType] = useState('all')
  const [proposalStatus, setProposalStatus] = useState('all')
  const [proposalSubmittedBy, setProposalSubmittedBy] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch real data from API
  const { data: statsData = {} } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const { data: usersData = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const { data: requestsData = [] } = useQuery({
    queryKey: ['admin-requests', proposalType, proposalStatus, proposalSubmittedBy],
    queryFn: () => getAdminRequests({
      proposalType,
      status: proposalStatus,
      submittedBy: proposalSubmittedBy
    }),
    staleTime: 60 * 1000,
    retry: 1,
  })

  // Normalize stats
  const stats = {
    totalUsers: statsData.total_users ?? statsData.totalUsers ?? 0,
    activeUsers: statsData.active_users ?? statsData.activeUsers ?? 0,
    pendingProposals: statsData.pending_proposals ?? statsData.pendingProposals ?? 0,
    totalProposals: statsData.total_proposals ?? statsData.totalProposals ?? 0,
    totalRevenue: statsData.total_revenue ?? statsData.totalRevenue ?? 0,
    monthlyRevenue: statsData.monthly_revenue ?? statsData.monthlyRevenue ?? 0,
  }

  // Normalize recent users (take last 4)
  const recentUsers = (Array.isArray(usersData) ? usersData : []).slice(0, 4).map(u => ({
    id: u.id,
    name: u.full_name || u.name || u.email,
    email: u.email,
    role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'User',
    status: u.is_active ? 'active' : 'inactive',
    joinDate: u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '',
  }))

  // Normalize recent proposals (take last 3)
  const recentProposals = (Array.isArray(requestsData) ? requestsData : []).slice(0, 3).map(r => ({
    id: r.id,
    title: r.title || r.name || 'Untitled',
    type: r.proposal_type === 'club' ? 'Club' : r.proposal_type === 'event' ? 'Event' : (r.type || 'Other'),
    status: r.status || 'pending',
    submittedBy: r.submitted_by?.full_name || r.created_by?.full_name || 'Unknown',
    submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
    role: r.submitted_by?.role || 'unknown',
  }))

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'proposals', label: 'Proposals', icon: DocumentTextIcon },
    { id: 'events', label: 'Events', icon: CalendarIcon },
    { id: 'clubs', label: 'Clubs', icon: BuildingOfficeIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'finance', label: 'Finance', icon: CurrencyDollarIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ]

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</h3>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </motion.div>
  )

  const UserCard = ({ user }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {user.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <AcademicCapIcon className="w-4 h-4 mr-1" />
            {user.role}
          </span>
          <span className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {user.joinDate}
          </span>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  const ProposalCard = ({ proposal }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{proposal.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-1" />
              {proposal.type}
            </span>
            <span className="flex items-center">
              <UserCircleIcon className="w-4 h-4 mr-1" />
              {proposal.submittedBy}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
          proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {proposal.status.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{proposal.submittedAt}</span>
        <div className="flex space-x-2">
          <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            <EyeIcon className="w-4 h-4" />
          </button>
          {proposal.status === 'pending' && (
            <>
              <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                <CheckCircleIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">
                <XCircleIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UsersIcon}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={12}
          description="Registered users"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserGroupIcon}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend={8}
          description="Currently active"
        />
        <StatCard
          title="Pending Proposals"
          value={stats.pendingProposals}
          icon={DocumentTextIcon}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          description="Need review"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          trend={23}
          description="This month"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Proposals</h3>
          <div className="space-y-3">
            {recentProposals.map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{proposal.title}</p>
                  <p className="text-xs text-gray-500">{proposal.submittedBy} • {proposal.submittedAt}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                  proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {proposal.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage all users in the system</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )

  const renderProposals = () => {
    // Filter proposals based on selected filters
    const filteredProposals = (Array.isArray(requestsData) ? requestsData : []).map(r => ({
      id: r.id,
      title: r.title || r.name || 'Untitled',
      type: r.proposal_type === 'club' ? 'Club' : r.proposal_type === 'event' ? 'Event' : (r.type || 'Other'),
      status: r.status || 'pending',
      submittedBy: r.submitted_by?.full_name || r.created_by?.full_name || 'Unknown',
      submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
      role: r.submitted_by?.role || 'unknown',
    })).filter(p => {
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Proposal Management</h2>
              <p className="text-gray-600">Review and manage all proposals</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FunnelIcon className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Proposal Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Type</label>
                  <select
                    value={proposalType}
                    onChange={(e) => setProposalType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Proposals</option>
                    <option value="event">Event Proposals</option>
                    <option value="club">Club Proposals</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    value={proposalStatus}
                    onChange={(e) => setProposalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Proposals</option>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                    <option value="returned_for_revision">Returned for Revision</option>
                  </select>
                </div>

                {/* Submitted By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submitted by</label>
                  <select
                    value={proposalSubmittedBy}
                    onChange={(e) => setProposalSubmittedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="organizer">Organizers</option>
                    <option value="student">Students</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setProposalType('all')
                    setProposalStatus('all')
                    setProposalSubmittedBy('all')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Active Filters Display */}
        {(proposalType !== 'all' || proposalStatus !== 'all' || proposalSubmittedBy !== 'all') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              {proposalType !== 'all' && <span className="ml-2">Type: {proposalType}</span>}
              {proposalStatus !== 'all' && <span className="ml-2">Status: {proposalStatus}</span>}
              {proposalSubmittedBy !== 'all' && <span className="ml-2">Submitted by: {proposalSubmittedBy}</span>}
            </div>
          </div>
        )}

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No proposals found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard()
      case 'users':
        return renderUsers()
      case 'proposals':
        return renderProposals()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                >
                  <Bars3Icon className="w-6 h-6" />
                </button>
                <h1 className="ml-4 text-2xl font-semibold text-gray-900">
                  {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">admin@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AdminUI
