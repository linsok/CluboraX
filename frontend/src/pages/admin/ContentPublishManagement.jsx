import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserGroupIcon,
  CalendarIcon,
  RectangleStackIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  BanknotesIcon,
  CogIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getClubs } from '../../api/clubs'
import { getEvents } from '../../api/events'

const ContentPublishManagement = () => {
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'events', 'clubs'
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
    toast.success('Logged out successfully')
  }

  // Fetch all events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: getEvents,
    staleTime: 2 * 60 * 1000,
  })

  // Fetch all clubs
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: getClubs,
    staleTime: 2 * 60 * 1000,
  })

  const isLoading = eventsLoading || clubsLoading

  // Combine events and clubs with type property
  const allContent = [
    ...(Array.isArray(events) ? events : []).map(event => ({ ...event, type: 'event' })),
    ...(Array.isArray(clubs) ? clubs : []).map(club => ({ ...club, type: 'club' }))
  ]

  const refetch = () => {
    queryClient.invalidateQueries(['admin-events'])
    queryClient.invalidateQueries(['admin-clubs'])
  }

  // Filter and search logic
  const filteredContent = allContent
    .filter(item => {
      // Type filter
      const typeMatch = 
        activeFilter === 'all' ||
        (activeFilter === 'events' && item.type === 'event') ||
        (activeFilter === 'clubs' && item.type === 'club')
      
      // Search filter
      const searchMatch = 
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.mission?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return typeMatch && searchMatch
    })

  const handleDelete = (item) => {
    setItemToDelete(item)
    setDeleteReason('')
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion')
      return
    }
    
    // TODO: Implement actual deletion API call
    toast.success(`${itemToDelete.type === 'event' ? 'Event' : 'Club'} "${itemToDelete.title || itemToDelete.name}" will be deleted. Reason: ${deleteReason}`)
    setShowDeleteModal(false)
    setShowDetailModal(false)
    setItemToDelete(null)
    setDeleteReason('')
    
    // Refetch data after deletion
    refetch()
  }

  const viewDetails = (item, type) => {
    setSelectedItem(item)
    setSelectedType(type)
    setShowDetailModal(true)
  }

  // Statistics
  const stats = {
    all: filteredContent.length,
    events: filteredContent.filter(i => i.type === 'event').length,
    clubs: filteredContent.filter(i => i.type === 'club').length,
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="fixed top-0 w-full bg-gray-800 border-b border-gray-700 z-50">
        <div className="flex">
          {/* Left side - Admin Branding (aligned with sidebar) */}
          <div className="w-64 flex items-center space-x-3 px-6 py-4 border-r border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">System Control</p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex-1 flex justify-end items-center px-4 sm:px-6 lg:px-8 py-4 space-x-4">
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

      <div className="pt-[73px]">
        {/* Sidebar */}
        <div className="fixed left-0 top-[73px] w-64 bg-gray-800 border-r border-gray-700 h-[calc(100vh-73px)] overflow-y-auto">
          <nav className="mt-6 px-4">
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: ChartBarIcon, path: '/admin/dashboard?section=overview' },
                { id: 'users', label: 'Users', icon: UsersIcon, path: '/admin/dashboard?section=users' },
                { id: 'proposals', label: 'Proposals', icon: DocumentTextIcon, path: '/admin/dashboard?section=proposals' },
                { id: 'fees', label: 'Payments', icon: BanknotesIcon, path: '/admin/dashboard?section=payments' },
                { id: 'settings', label: 'Settings', icon: CogIcon, path: '/admin/dashboard?section=settings' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Divider */}
              <div className="my-4 border-t border-gray-700"></div>
              
              {/* Publish Management Link - Active */}
              <button
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-red-600 text-white"
              >
                <RectangleStackIcon className="w-5 h-5" />
                <span>Publish Management</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Published Content Management</h1>
          <p className="text-gray-400">View and manage all published events and clubs visible to students and organizations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <RectangleStackIcon className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">{stats.all}</span>
            </div>
            <p className="text-sm text-gray-400">Total Items</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-white">{stats.events}</span>
            </div>
            <p className="text-sm text-gray-400">Events</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-white">{stats.clubs}</span>
            </div>
            <p className="text-sm text-gray-400">Clubs</p>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Type Filter Tabs */}
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All Content', icon: RectangleStackIcon },
                { id: 'events', label: 'Events', icon: CalendarIcon },
                { id: 'clubs', label: 'Clubs', icon: UserGroupIcon },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <filter.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading content...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <RectangleStackIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No content found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.type === 'event'
                        ? 'bg-purple-600'
                        : 'bg-green-600'
                    }`}>
                      {item.type === 'event' ? (
                        <CalendarIcon className="w-6 h-6 text-white" />
                      ) : (
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        {item.title || item.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {item.type === 'event' ? 'Event' : 'Club'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                  {item.description || item.mission || 'No description available'}
                </p>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  {item.type === 'event' && (
                    <>
                      {item.venue && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                          <span>{item.venue}</span>
                        </div>
                      )}
                      {item.date && (
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.expected_attendees && (
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="w-4 h-4 text-gray-500" />
                          <span>{item.expected_attendees} expected</span>
                        </div>
                      )}
                    </>
                  )}
                  {item.type === 'club' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                        <span className="capitalize">{item.club_type?.replace('_', ' ') || 'General Club'}</span>
                      </div>
                      {item.president_name && (
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="w-4 h-4 text-gray-500" />
                          <span>President: {item.president_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewDetails(item, item.type)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedType === 'event' ? 'bg-purple-600' : 'bg-green-600'
                    }`}>
                      {selectedType === 'event' ? (
                        <CalendarIcon className="w-6 h-6 text-white" />
                      ) : (
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedItem.title || selectedItem.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {selectedType} Details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Description</h4>
                    <p className="text-gray-300">
                      {selectedItem.description || selectedItem.mission || 'No description available'}
                    </p>
                  </div>

                  {selectedType === 'event' && selectedItem.details && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Event Details</h4>
                      <div className="space-y-2 text-sm">
                        {selectedItem.details.venue && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Venue:</span>
                            <span className="text-white font-medium">{selectedItem.details.venue}</span>
                          </div>
                        )}
                        {selectedItem.details.date && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white font-medium">{selectedItem.details.date}</span>
                          </div>
                        )}
                        {selectedItem.details.organizer && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Organizer:</span>
                            <span className="text-white font-medium">{selectedItem.details.organizer}</span>
                          </div>
                        )}
                        {selectedItem.details.expectedAttendees && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expected Attendees:</span>
                            <span className="text-white font-medium">{selectedItem.details.expectedAttendees}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedType === 'club' && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Club Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white font-medium capitalize">
                            {selectedItem.club_type?.replace('_', ' ') || 'General'}
                          </span>
                        </div>
                        {selectedItem.president_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">President:</span>
                            <span className="text-white font-medium">{selectedItem.president_name}</span>
                          </div>
                        )}
                        {selectedItem.expected_members && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expected Members:</span>
                            <span className="text-white font-medium">{selectedItem.expected_members}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Submission Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-medium ${
                          selectedItem.status === 'approved' ? 'text-amber-400' :
                          selectedItem.status === 'published' ? 'text-emerald-400' :
                          'text-gray-400'
                        }`}>
                          {selectedItem.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitted By:</span>
                        <span className="text-white font-medium">
                          {selectedItem.submittedBy || selectedItem.submitted_by_details?.email || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitted Date:</span>
                        <span className="text-white font-medium">
                          {selectedItem.submitted_date 
                            ? new Date(selectedItem.submitted_date).toLocaleDateString()
                            : selectedItem.submittedDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex space-x-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem)}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && itemToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-xl border border-red-700 max-w-lg w-full"
              >
                {/* Modal Header */}
                <div className="bg-red-900/30 border-b border-red-700 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
                      <TrashIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Delete Confirmation</h3>
                      <p className="text-sm text-red-300">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">You are about to delete:</p>
                    <p className="text-white font-semibold text-lg">
                      {itemToDelete.title || itemToDelete.name}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 capitalize">
                      {itemToDelete.type}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reason for deletion <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Please provide a detailed reason for deleting this content..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This reason will be logged for audit purposes
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t border-gray-700 p-6 flex space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteReason('')
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={!deleteReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>Confirm Delete</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentPublishManagement
