import React, { useState, useMemo } from 'react'
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
  ArrowPathIcon,
  DocumentTextIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  BanknotesIcon,
  CogIcon,
  ArrowUturnLeftIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import {
  getAdminEvents,
  getAdminClubs,
  approveEvent,
  rejectEvent,
  publishEvent,
  returnEventForRevision,
  approveClub,
  rejectClub,
  publishClub,
  returnClubForRevision
} from '../../api/admin'

const OrganizerRequests = () => {
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'events', 'clubs'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'draft', 'pending', 'pending_approval', 'approved', 'published', 'rejected'
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('') // 'approve', 'reject', 'return_for_revision', 'publish'
  const [actionComments, setActionComments] = useState('')
  
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Logged out successfully')
  }

  // Fetch events created by organizers
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: getAdminEvents,
  })

  // Fetch clubs created by organizers
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['adminClubs'],
    queryFn: getAdminClubs,
  })

  // Filter for organizer-created events and clubs only
  const organizerEvents = useMemo(() => {
    return events.filter(event => 
      event.created_by?.role === 'organizer' &&
      ['draft', 'pending_approval', 'approved', 'rejected', 'published'].includes(event.status)
    ).map(event => ({ ...event, type: 'event' }))
  }, [events])

  const organizerClubs = useMemo(() => {
    return clubs.filter(club => 
      club.created_by?.role === 'organizer' &&
      ['pending', 'approved', 'rejected', 'published', 'active'].includes(club.status)
    ).map(club => ({ ...club, type: 'club' }))
  }, [clubs])

  // Combine and filter all requests
  const allRequests = useMemo(() => {
    let requests = []

    if (activeFilter === 'all' || activeFilter === 'events') {
      requests = [...requests, ...organizerEvents]
    }
    if (activeFilter === 'all' || activeFilter === 'clubs') {
      requests = [...requests, ...organizerClubs]
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Show both draft and pending_approval for events, pending for clubs
        requests = requests.filter(req => 
          (req.type === 'event' && ['draft', 'pending_approval'].includes(req.status)) ||
          (req.type === 'club' && req.status === 'pending')
        )
      } else {
        requests = requests.filter(req => req.status === statusFilter)
      }
    }

    // Search filter
    if (searchTerm) {
      requests = requests.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        const title = req.type === 'event' ? req.title : req.name
        const description = req.description || ''
        return title.toLowerCase().includes(searchLower) || 
               description.toLowerCase().includes(searchLower)
      })
    }

    // Sort by created date (newest first)
    return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [organizerEvents, organizerClubs, activeFilter, statusFilter, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    const allRequestsCount = organizerEvents.length + organizerClubs.length
    const eventsCount = organizerEvents.length
    const clubsCount = organizerClubs.length
    
    const pendingEvents = organizerEvents.filter(e => ['draft', 'pending_approval'].includes(e.status)).length
    const pendingClubs = organizerClubs.filter(c => c.status === 'pending').length
    const pendingCount = pendingEvents + pendingClubs
    
    const approvedCount = [...organizerEvents, ...organizerClubs].filter(r => r.status === 'approved').length
    const publishedCount = [...organizerEvents, ...organizerClubs].filter(r => r.status === 'published').length
    const rejectedCount = [...organizerEvents, ...organizerClubs].filter(r => r.status === 'rejected').length

    return {
      all: allRequestsCount,
      events: eventsCount,
      clubs: clubsCount,
      pending: pendingCount,
      approved: approvedCount,
      published: publishedCount,
      rejected: rejectedCount,
    }
  }, [organizerEvents, organizerClubs])

  const isLoading = eventsLoading || clubsLoading

  // Mutations for Events
  const approveEventMutation = useMutation({
    mutationFn: ({ id, comments }) => approveEvent(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminEvents'])
      toast.success('Event approved successfully')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to approve event')
    },
  })

  const rejectEventMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectEvent(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminEvents'])
      toast.success('Event rejected')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to reject event')
    },
  })

  const publishEventMutation = useMutation({
    mutationFn: (id) => publishEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminEvents'])
      toast.success('Event published successfully!')
      setShowDetailModal(false)
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to publish event')
    },
  })

  const returnEventMutation = useMutation({
    mutationFn: ({ id, comments }) => returnEventForRevision(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminEvents'])
      toast.success('Event returned for revision')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to return event for revision')
    },
  })

  // Mutations for Clubs
  const approveClubMutation = useMutation({
    mutationFn: ({ id, comments }) => approveClub(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminClubs'])
      toast.success('Club approved successfully')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to approve club')
    },
  })

  const rejectClubMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectClub(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminClubs'])
      toast.success('Club rejected')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to reject club')
    },
  })

  const publishClubMutation = useMutation({
    mutationFn: (id) => publishClub(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminClubs'])
      toast.success('Club published successfully!')
      setShowDetailModal(false)
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to publish club')
    },
  })

  const returnClubMutation = useMutation({
    mutationFn: ({ id, comments }) => returnClubForRevision(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminClubs'])
      toast.success('Club returned for revision')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to return club for revision')
    },
  })

  const handleViewDetails = (item, type) => {
    setSelectedItem(item)
    setSelectedType(type)
    setShowDetailModal(true)
  }

  const handleAction = (action) => {
    setActionType(action)
    if (action === 'publish') {
      // Publish immediately without modal
      if (selectedType === 'event') {
        publishEventMutation.mutate(selectedItem.id)
      } else {
        publishClubMutation.mutate(selectedItem.id)
      }
    } else {
      setShowActionModal(true)
    }
  }

  const handleConfirmAction = () => {
    if ((actionType === 'reject' || actionType === 'return_for_revision') && !actionComments.trim()) {
      toast.error('Please provide comments')
      return
    }

    const id = selectedItem.id

    if (selectedType === 'event') {
      switch (actionType) {
        case 'approve':
          approveEventMutation.mutate({ id, comments: actionComments })
          break
        case 'reject':
          rejectEventMutation.mutate({ id, reason: actionComments })
          break
        case 'return_for_revision':
          returnEventMutation.mutate({ id, comments: actionComments })
          break
      }
    } else {
      switch (actionType) {
        case 'approve':
          approveClubMutation.mutate({ id, comments: actionComments })
          break
        case 'reject':
          rejectClubMutation.mutate({ id, reason: actionComments })
          break
        case 'return_for_revision':
          returnClubMutation.mutate({ id, comments: actionComments })
          break
      }
    }
  }

  const refetch = () => {
    queryClient.invalidateQueries(['adminEvents'])
    queryClient.invalidateQueries(['adminClubs'])
  }

  // Approve mutation (legacy compatibility helper)
  const approveMutation = useMutation({
    mutationFn: ({ id, type, comments }) => 
      type === 'event' ? approveEvent(id, comments) : approveClub(id, comments),
    onSuccess: () => {
      refetch()
      toast.success('Approved successfully!')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve proposal')
    }
  })

  // Reject mutation (legacy compatibility helper)
  const rejectMutation = useMutation({
    mutationFn: ({ id, type, comments }) =>
      type === 'event' ? rejectEvent(id, comments) : rejectClub(id, comments),
    onSuccess: () => {
      refetch()
      toast.success('Rejected')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject')
    }
  })

  // Return for revision mutation (legacy compatibility helper)
  const returnForRevisionMutation = useMutation({
    mutationFn: ({ id, type, comments }) =>
      type === 'event' ? returnEventForRevision(id, comments) : returnClubForRevision(id, comments),
    onSuccess: () => {
      refetch()
      toast.success('Returned for revision')
      setShowActionModal(false)
      setShowDetailModal(false)
      setActionComments('')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to return for revision')
    }
  })

  // Publish mutation (legacy compatibility helper)
  const publishMutation = useMutation({
    mutationFn: ({ id, type }) =>
      type === 'event' ? publishEvent(id) : publishClub(id),
    onSuccess: () => {
      refetch()
      toast.success('Published successfully!')
      setShowActionModal(false)
      setShowDetailModal(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to publish')
    }
  })

  // Legacy action handlers
  const confirmAction = () => {
    if ((actionType === 'reject' || actionType === 'return_for_revision') && !actionComments.trim()) {
      toast.error('Please provide comments for this action')
      return
    }

    const mutationData = {
      id: selectedItem.id,
      type: selectedItem.type,
      comments: actionComments
    }

    switch (actionType) {
      case 'approve':
        approveMutation.mutate(mutationData)
        break
      case 'reject':
        rejectMutation.mutate(mutationData)
        break
      case 'return_for_revision':
        returnForRevisionMutation.mutate(mutationData)
        break
      case 'publish':
        publishMutation.mutate({ id: selectedItem.id, type: selectedItem.type })
        break
      default:
        break
    }
  }

  const viewDetails = (item, type) => {
    setSelectedItem(item)
    setSelectedType(type)
    setShowDetailModal(true)
  }

  // Handle status toggle
  const handleStatusToggle = async (item, currentStatus) => {
    try {
      if (currentStatus === 'pending' || currentStatus === 'draft' || currentStatus === 'pending_approval') {
        // Toggle to approved
        if (item.type === 'event') {
          await approveEvent(item.id, 'Auto-approved via toggle')
          toast.success('Event approved successfully')
        } else {
          await approveClub(item.id, 'Auto-approved via toggle')
          toast.success('Club approved successfully')
        }
        queryClient.invalidateQueries(['adminEvents'])
        queryClient.invalidateQueries(['adminClubs'])
      } else if (currentStatus === 'approved') {
        // Toggle to published
        if (item.type === 'event') {
          await publishEvent(item.id)
          toast.success('Event published successfully')
        } else {
          await publishClub(item.id)
          toast.success('Club published successfully')
        }
        queryClient.invalidateQueries(['adminEvents'])
        queryClient.invalidateQueries(['adminClubs'])
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  // Render toggle switch
  const renderStatusToggle = (item) => {
    const status = item.status
    const isToggled = status === 'approved' || status === 'published'
    const isDisabled = status === 'rejected' || status === 'published'
    
    return (
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-400 font-medium min-w-[80px]">
          {getStatusLabel(status)}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isToggled}
            onChange={() => !isDisabled && handleStatusToggle(item, status)}
            disabled={isDisabled}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 rounded-full peer transition-colors ${
            isDisabled 
              ? 'bg-gray-700 cursor-not-allowed' 
              : isToggled 
                ? 'bg-emerald-600 peer-hover:bg-emerald-700' 
                : 'bg-gray-600 peer-hover:bg-gray-500'
          }`}>
            <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform ${
              isToggled ? 'translate-x-5' : 'translate-x-0'
            }`}></div>
          </div>
        </label>
        <div className="text-xs text-gray-500 font-medium">
          {status === 'published' ? 'Published' : 
           status === 'rejected' ? 'Rejected' :
           status === 'approved' ? 'Publish' : 
           'Approve'}
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
       case 'draft':
      case 'pending':
      case 'pending_approval':
      case 'pending_review':
        return 'bg-amber-100 text-amber-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'published':
        return 'bg-emerald-100 text-emerald-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'returned_for_revision':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'pending':
        return 'Pending'
      case 'pending_approval':
        return 'Pending Approval'
      case 'pending_review':
        return 'Pending Review'
      case 'approved':
        return 'Approved'
      case 'published':
        return 'Published'
      case 'rejected':
        return 'Rejected'
      case 'returned_for_revision':
        return 'Returned for Revision'
      default:
        return status
    }
  }

  const getActionButtons = (item) => {
    const status = item.status

    // Pending/Draft: Can approve, reject, or request revision
    if (status === 'pending' || status === 'draft' || status === 'pending_approval' || status === 'pending_review') {
      return (
        <>
          <button
            onClick={() => handleAction('approve')}
            className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => handleAction('return_for_revision')}
            className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Request Revision
          </button>
          <button
            onClick={() => handleAction('reject')}
            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <XCircleIcon className="w-4 h-4" />
            Reject
          </button>
        </>
      )
    }

    // Approved: Can publish
    if (status === 'approved') {
      return (
        <button
          onClick={() => handleAction('publish')}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <RocketLaunchIcon className="w-4 h-4" />
          Publish
        </button>
      )
    }

    // Published/Rejected: View only
    return (
      <div className="text-center text-sm text-gray-500 py-2">
        {status === 'published' ? 'Already Published' : 'Rejected'}
      </div>
    )
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
              
              {/* Publish Management Link */}
              <button
                onClick={() => navigate('/admin/publish')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <RectangleStackIcon className="w-5 h-5" />
                <span>Publish Management</span>
              </button>
              
              {/* Organizer Requests Link - Active */}
              <button
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-red-600 text-white"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Organizer Requests</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Organizer Requests</h2>
            <p className="text-gray-400">Review and manage events and clubs created by organizers</p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            {/* Type Filter */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Requests {stats.all > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.all}</span>}
              </button>
              <button
                onClick={() => setActiveFilter('events')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === 'events'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Events Only {stats.events > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.events}</span>}
              </button>
              <button
                onClick={() => setActiveFilter('clubs')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === 'clubs'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Clubs Only {stats.clubs > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.clubs}</span>}
              </button>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Status {stats.all > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.all}</span>}
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pending {stats.pending > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.pending}</span>}
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  statusFilter === 'approved'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Approved {stats.approved > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.approved}</span>}
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  statusFilter === 'published'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Published {stats.published > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.published}</span>}
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  statusFilter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Rejected {stats.rejected > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-900 text-xs">{stats.rejected}</span>}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}

          {/* Requests Grid */}
          {!isLoading && (
            <>
              {allRequests.length === 0 ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                  <DocumentTextIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Requests Found</h3>
                  <p className="text-gray-400">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No organizer requests to review at this time'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {allRequests.map((item) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-red-500 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              item.type === 'event' ? 'bg-purple-900/50' : 'bg-green-900/50'
                            }`}
                          >
                            {item.type === 'event' ? (
                              <CalendarIcon className="w-5 h-5 text-purple-400" />
                            ) : (
                              <UserGroupIcon className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">
                              {item.type === 'event' ? item.title : item.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {item.type === 'event' ? 'Event Request' : 'Club Request'}
                            </p>
                          </div>
                        </div>
                        {renderStatusToggle(item)}
                      </div>

                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Details */}
                      <div className="space-y-2 mb-4 text-sm">
                        {item.type === 'event' && (
                          <>
                            <div className="flex items-center gap-2 text-gray-400">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{new Date(item.start_datetime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{item.venue}</span>
                            </div>
                          </>
                        )}
                        {item.type === 'club' && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <UsersIcon className="w-4 h-4" />
                            <span>{item.category}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-400">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>
                            By: {item.created_by?.name || item.created_by?.email || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => handleViewDetails(item, item.type)}
                          className="flex-1 border border-gray-600 text-gray-300 py-2 px-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                onClick={() => setShowDetailModal(false)}
              />

              {/* Modal panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-gray-700"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedType === 'event' ? (
                        <CalendarIcon className="w-6 h-6 text-white" />
                      ) : (
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {selectedType === 'event' ? selectedItem.title : selectedItem.name}
                        </h2>
                        <p className="text-red-100 text-sm">
                          {selectedType === 'event' ? 'Event Details' : 'Club Details'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-gray-800">
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Status Control
                      </label>
                      <div className="flex items-center gap-4">
                        {renderStatusToggle(selectedItem)}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Description
                      </label>
                      <p className="text-white">{selectedItem.description}</p>
                    </div>

                    {/* Event-specific fields */}
                    {selectedType === 'event' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Start Date
                            </label>
                            <p className="text-white">
                              {new Date(selectedItem.start_datetime).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              End Date
                            </label>
                            <p className="text-white">
                              {new Date(selectedItem.end_datetime).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Venue
                          </label>
                          <p className="text-white">{selectedItem.venue}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Category
                            </label>
                            <p className="text-white">{selectedItem.category}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Event Type
                            </label>
                            <p className="text-white capitalize">{selectedItem.event_type}</p>
                          </div>
                        </div>

                        {selectedItem.max_participants && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Max Participants
                            </label>
                            <p className="text-white">{selectedItem.max_participants}</p>
                          </div>
                        )}

                        {selectedItem.is_paid && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price
                            </label>
                            <p className="text-gray-900">${selectedItem.price}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Club-specific fields */}
                    {selectedType === 'club' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <p className="text-gray-900">{selectedItem.category}</p>
                        </div>

                        {selectedItem.mission_statement && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mission Statement
                            </label>
                            <p className="text-gray-900">{selectedItem.mission_statement}</p>
                          </div>
                        )}

                        {selectedItem.meeting_schedule && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Meeting Schedule
                            </label>
                            <p className="text-white">{selectedItem.meeting_schedule}</p>
                          </div>
                        )}

                        {selectedItem.requirements && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              Requirements
                            </label>
                            <p className="text-white">{selectedItem.requirements}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Organizer Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Created By
                      </label>
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <p className="text-white font-medium">
                          {selectedItem.created_by?.name || 'Unknown'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {selectedItem.created_by?.email}
                        </p>
                        <p className="text-gray-400 text-sm capitalize">
                          Role: {selectedItem.created_by?.role || 'organizer'}
                        </p>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Submitted On
                      </label>
                      <p className="text-white">
                        {new Date(selectedItem.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
                  <div className="flex items-center gap-3">
                    {getActionButtons(selectedItem)}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                onClick={() => setShowActionModal(false)}
              />

              {/* Modal panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {actionType === 'return_for_revision'
                        ? 'Request Revision'
                        : actionType}
                    </h3>
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-300 mb-4">
                    {actionType === 'approve' && 'Add optional comments for this approval:'}
                    {actionType === 'reject' && 'Please provide a reason for rejection:'}
                    {actionType === 'return_for_revision' &&
                      'Please specify what needs to be revised:'}
                  </p>

                  <textarea
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    placeholder={
                      actionType === 'reject' || actionType === 'return_for_revision'
                        ? 'Required...'
                        : 'Optional comments...'
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    required={actionType === 'reject' || actionType === 'return_for_revision'}
                  />

                  {(actionType === 'reject' || actionType === 'return_for_revision') && (
                    <p className="text-sm text-red-400 mt-2">* Comments are required</p>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-gray-900 px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="px-6 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                      actionType === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : actionType === 'reject'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OrganizerRequests
