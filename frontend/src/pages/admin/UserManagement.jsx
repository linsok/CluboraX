import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  BanIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  const queryClient = useQueryClient()

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('access_token')
      const params = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      })
      const response = await fetch(`http://localhost:8000/api/admin/api/users/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    }
  })

  // User actions mutations
  const activateUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/api/users/${userId}/activate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) throw new Error('Failed to activate user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setShowUserModal(false)
      setSelectedUser(null)
      // Show success message
    }
  })

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/api/users/${userId}/deactivate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) throw new Error('Failed to deactivate user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setShowUserModal(false)
      setSelectedUser(null)
      // Show success message
    }
  })

  const verifyUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/api/users/${userId}/verify/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) throw new Error('Failed to verify user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setShowUserModal(false)
      setSelectedUser(null)
      // Show success message
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setShowUserModal(false)
      setSelectedUser(null)
      // Show success message
    }
  })

  const handleUserAction = (userId, action) => {
    switch (action) {
      case 'activate':
        activateUserMutation.mutate(userId)
        break
      case 'deactivate':
        deactivateUserMutation.mutate(userId)
        break
      case 'verify':
        verifyUserMutation.mutate(userId)
        break
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          deleteUserMutation.mutate(userId)
        }
        break
    }
  }

  const UserCard = ({ user }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.role === 'student'
                  ? 'bg-blue-100 text-blue-800'
                  : user.role === 'faculty'
                  ? 'bg-green-100 text-green-800'
                  : user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.role}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : user.status === 'inactive'
                  ? 'bg-gray-100 text-gray-800'
                  : user.status === 'suspended'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status}
              </span>
              {user.is_verified && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedUser(user)
              setShowUserModal(true)
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <AcademicCapIcon className="w-4 h-4" />
          <span>{user.major || 'Not specified'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{user.joinDate}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>ID: {user.studentId || 'N/A'}</span>
          <span>•</span>
          <span>Phone: {user.phone || 'N/A'}</span>
        </div>
        <div className="flex space-x-2">
          {user.status === 'active' ? (
            <button
              onClick={() => handleUserAction(user.id, 'deactivate')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleUserAction(user.id, 'activate')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Activate
            </button>
          )}
          {!user.is_verified && (
            <button
              onClick={() => handleUserAction(user.id, 'verify')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Verify
            </button>
          )}
          <button
            onClick={() => handleUserAction(user.id, 'delete')}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )

  const UserModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'student'
                        ? 'bg-blue-100 text-blue-800'
                        : user.role === 'faculty'
                        ? 'bg-green-100 text-green-800'
                        : user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : user.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status}
                    </span>
                    {user.is_verified && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{user.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{user.major || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{user.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Actions</h4>
                <div className="flex space-x-3">
                  {user.status === 'active' ? (
                    <button
                      onClick={() => handleUserAction(user.id, 'deactivate')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction(user.id, 'activate')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {!user.is_verified && (
                    <button
                      onClick={() => handleUserAction(user.id, 'verify')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleUserAction(user.id, 'delete')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading users</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage all users in the system</p>
              </div>
              
              {/* Filters */}
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
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usersData?.users?.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {usersData?.pagination && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {usersData.pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(usersData.pagination.totalPages, prev + 1))}
                  disabled={currentPage === usersData.pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}

export default UserManagement
