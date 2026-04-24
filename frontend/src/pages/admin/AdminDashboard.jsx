import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CogIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getAdminUsers, getAdminRequests, getAdminStats, updateUserStatus, updateRequestStatus, rejectClubProposal, getFullClubProposal, getFullEventProposal } from '../../api/admin'
import { getFeeSubmissions, reviewFeeSubmission } from '../../api/payments'

// Import section components
import OverviewSection from './sections/OverviewSection'
import UsersSection from './sections/UsersSection'
import ProposalsSection from './sections/ProposalsSection'
import PaymentsSection from './sections/PaymentsSection'
import SettingsSection from './sections/SettingsSection'

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = searchParams.get('section') || 'overview'
  
  const handleSectionChange = (section) => {
    setSearchParams({ section })
  }
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectItem, setRejectItem] = useState(null)
  const [rejectType, setRejectType] = useState('') // 'club', 'event', or 'proposal'
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [detailType, setDetailType] = useState('') // 'club', 'event', or 'proposal'
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewItem, setReviewItem] = useState(null)
  const [showStage2Modal, setShowStage2Modal] = useState(false)
  const [showStage3Modal, setShowStage3Modal] = useState(false)
  const [stage2Notes, setStage2Notes] = useState('')
  const [stage3Notes, setStage3Notes] = useState('')
  const [stageReviewItem, setStageReviewItem] = useState(null)
  const [revisionReason, setRevisionReason] = useState('')

  // Fee payment states
  const [feeFilterStatus, setFeeFilterStatus] = useState('all')
  const [selectedFeeProof, setSelectedFeeProof] = useState(null)

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

  const { data: requests = [], isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      try {
        console.log('📡 Fetching requests...')
        const result = await getAdminRequests()
        console.log(`📡 Requests fetched successfully: ${result.length} proposals`)
        // Show first club_proposal to verify status
        const firstClub = result.find(r => r.type === 'club_proposal')
        if (firstClub) {
          console.log(`📡 First club proposal: "${firstClub.title}" id=${firstClub.id} status=${firstClub.status}`)
        }
        return result
      } catch (error) {
        console.error('Error fetching requests:', error)
        throw error
      }
    },
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for faster updates)
    gcTime: 1 * 60 * 1000, // 1 minute
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

  // Query to fetch full proposal details when modal is opened
  const { data: fullProposal = null, isLoading: proposalDetailLoading } = useQuery({
    queryKey: ['full-proposal', detailItem?.id, detailItem?.modalType],
    queryFn: async () => {
      if (!detailItem?.id || detailItem?.modalType !== 'proposal') {
        return null
      }
      
      try {
        const proposalType = detailItem.type === 'club_proposal' || detailItem.type === 'club' ? 'club' : 'event'
        console.log(`📡 Fetching full ${proposalType} proposal details for ID: ${detailItem.id}`, { detailItemType: detailItem.type })
        
        if (proposalType === 'club') {
          const result = await getFullClubProposal(detailItem.id)
          console.log('📡 Full club proposal data:', result)
          return result
        } else {
          const result = await getFullEventProposal(detailItem.id)
          console.log('📡 Full event proposal data:', result)
          return result
        }
      } catch (error) {
        console.error('❌ Error fetching full proposal details:', error)
        throw error
      }
    },
    enabled: !!detailItem?.id && detailItem?.modalType === 'proposal', // Only fetch when modal is open with proposal
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error('Failed to load proposal details:', error)
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

  // Update mutation - with direct state management
  const updateRequestMutation = useMutation({
    mutationFn: ({ requestId, status, comments }) => {
      console.log('🔴 UPDATE REQUEST: Sending PATCH to backend', { requestId, status })
      return updateRequestStatus(requestId, status, comments)
    },
    onSuccess: async (data, variables) => {
      console.log('🟢 UPDATE SUCCESS - Response from backend:', data)
      
      // STRATEGY 1: Update the cache directly
      queryClient.setQueryData(['admin-requests'], (oldRequests) => {
        if (!Array.isArray(oldRequests)) return oldRequests
        console.log('🟢 CACHE UPDATE: Found', oldRequests.length, 'requests to search')
        return oldRequests.map((req) => {
          const matches = String(req.id) === String(variables.requestId)
          if (matches) {
            console.log(`🟢 CACHE UPDATE: Matched request ${req.id}, setting status to ${variables.status}`)
            return { ...req, status: variables.status }
          }
          return req
        })
      })
      
      // STRATEGY 2: Also force a fresh backend refetch to be absolutely sure
      console.log('🟢 REFETCH: Waiting 200ms then refetching...')
      setTimeout(async () => {
        console.log('🟢 REFETCH: Calling refetch now')
        try {
          const result = await refetchRequests()
          console.log('🟢 REFETCH: Got', result?.data?.length, 'proposals back')
          const found = result?.data?.find(r => String(r.id) === String(variables.requestId))
          console.log(`🟢 REFETCH: Proposal ${variables.requestId} status is now: ${found?.status}`)
        } catch (e) {
          console.error('🟢 REFETCH ERROR:', e)
        }
      }, 200)
      
      toast.success('Request status updated successfully')
    },
    onError: (error) => {
      console.error('❌ UPDATE FAILED:', error?.message)
      console.error('❌ Response data:', error?.response?.data)
      console.error('❌ Status code:', error?.response?.status)
      
      let errorMsg = 'Failed to update request status'
      if (error?.response?.status === 403) {
        errorMsg = 'Permission denied: Only admins can update proposal status'
      } else if (error?.response?.data?.error) {
        errorMsg = error.response.data.error
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message
      }
      toast.error(errorMsg)
    }
  })

  // Mutation for rejecting club proposals
  const rejectClubMutation = useMutation({
    mutationFn: ({ proposalId, comments }) => rejectClubProposal(proposalId, comments),
    onSuccess: (data) => {
      console.log('✅ Club proposal rejected:', data)
      // Refresh the proposals list
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast.success('Club proposal rejected successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to reject club proposal:', error)
      toast.error('Failed to reject club proposal')
    }
  })

  // Fee submissions query
  const { data: rawFeeSubmissions = [], isLoading: feeLoading } = useQuery({
    queryKey: ['admin-fee-submissions'],
    queryFn: getFeeSubmissions,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  // Normalize fee submissions to UI shape
  const normalizeFee = (f) => ({
    id: f.id,
    eventTitle: f.event_title || f.event?.title || 'Unknown Event',
    organizer: f.organizer_name || f.user?.full_name || f.user?.email || 'Unknown',
    organizerEmail: f.organizer_email || f.user?.email || '',
    ticketPrice: parseFloat(f.ticket_price || 0),
    expectedRevenue: parseFloat(f.expected_revenue || 0),
    registrations: f.registrations_count || 0,
    submittedAt: f.created_at || f.submitted_at,
    paymentMethod: f.payment_method || 'KHQR',
    transactionId: f.transaction_id || '',
    proofType: f.proof_url ? (String(f.proof_url).endsWith('.pdf') ? 'pdf' : 'image') : 'image',
    proofUrl: f.proof_url || null,
    platformFeeRate: parseFloat(f.platform_fee_rate || 0.03),
    platformFee: parseFloat(f.platform_fee || 0),
    netPayout: parseFloat(f.net_payout || 0),
    status: f.status || 'pending_confirmation',
    note: f.note || '',
    rejectionReason: f.rejection_reason || '',
  })

  const feeSubmissions = feeLoading ? [] : rawFeeSubmissions.map(normalizeFee)

  const confirmFeePayment = async (fee) => {
    try {
      await reviewFeeSubmission(fee.id, 'confirm')
      queryClient.invalidateQueries(['admin-fee-submissions'])
      toast.success(`Fee confirmed for "${fee.eventTitle}" â€” event can now go live`)
    } catch {
      toast.error('Failed to confirm fee payment')
    }
  }

  const rejectFeePayment = async (fee) => {
    try {
      await reviewFeeSubmission(fee.id, 'reject')
      queryClient.invalidateQueries(['admin-fee-submissions'])
      toast.error(`Fee rejected for "${fee.eventTitle}" â€” organizer will be notified`)
    } catch {
      toast.error('Failed to reject fee payment')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900'
      case 'pending': return 'text-yellow-400 bg-yellow-900'
      case 'returned': return 'text-orange-400 bg-orange-900'
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
      if (!window.confirm('Are you sure you want to approve this request?')) return
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
                { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                { id: 'users', label: 'Users', icon: UsersIcon },
                { id: 'proposals', label: 'Proposals', icon: DocumentTextIcon },
                { id: 'fees', label: 'Payments', icon: BanknotesIcon },
                { id: 'settings', label: 'Settings', icon: CogIcon }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.id === 'fees' && (
                    feeSubmissions.filter(f => f.status === 'pending_confirmation').length > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {feeSubmissions.filter(f => f.status === 'pending_confirmation').length}
                      </span>
                    )
                  )}
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
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          {activeSection === 'overview' && (
            <OverviewSection 
              users={users} 
              requests={requests} 
              stats={stats} 
              requestsLoading={requestsLoading} 
              getStatusColor={getStatusColor} 
            />
          )}

          {activeSection === 'users' && (
            <UsersSection
              users={users}
              usersLoading={usersLoading}
              usersError={usersError}
              updateUserMutation={updateUserMutation}
              setSelectedUser={setSelectedUser}
              setShowUserModal={setShowUserModal}
            />
          )}

          {activeSection === 'fees' && (
            <PaymentsSection
              feeSubmissions={feeSubmissions}
              feeLoading={feeLoading}
              confirmFeePayment={confirmFeePayment}
              rejectFeePayment={rejectFeePayment}
            />
          )}

          {activeSection === 'proposals' && (
            <ProposalsSection
              requests={requests}
              requestsLoading={requestsLoading}
              updateRequestMutation={updateRequestMutation}
              setDetailItem={setDetailItem}
              setDetailType={setDetailType}
              setShowDetailModal={setShowDetailModal}
              setRejectItem={setRejectItem}
              setRejectType={setRejectType}
              setShowRejectModal={setShowRejectModal}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsSection />
          )}
        </div>
      </div>


      {/* Detail View Modal */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-700"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-white capitalize">{detailType} Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setDetailItem(null)
                  setDetailType('')
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 p-4">
            {/* Show loading state for proposals */}
            {detailType === 'proposal' && proposalDetailLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-400">Loading proposal details...</p>
              </div>
            )}

            {/* Merge fullProposal with detailItem for complete proposal data */}
            {detailType === 'proposal' && !proposalDetailLoading && (
              (() => {
                const displayData = fullProposal ? { ...detailItem, ...fullProposal } : detailItem
                const proposalType = displayData.type === 'club_proposal' || displayData.type === 'club' ? 'club' : 'event'
                
                return proposalType === 'club' ? (
                  // CLUB PROPOSAL
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white">{displayData.name || 'Untitled Club'}</h4>
                        {displayData.club_type && <p className="text-gray-400 capitalize">{displayData.club_type}</p>}
                        <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                          displayData.status === 'pending_review' ? 'bg-yellow-900 text-yellow-400' :
                          displayData.status === 'approved' ? 'bg-green-900 text-green-400' :
                          displayData.status === 'published' ? 'bg-purple-900 text-purple-400' :
                          displayData.status === 'rejected' ? 'bg-red-900 text-red-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {displayData.status === 'pending_review' ? 'Pending' : displayData.status?.charAt(0).toUpperCase() + (displayData.status?.slice(1) || '')}
                        </span>
                      </div>
                    </div>
                    
                    {displayData.club_logo && (
                      <div className="bg-gray-700 rounded-lg p-4 flex justify-center">
                        <img src={displayData.club_logo} alt="Club Logo" className="h-48 w-auto object-contain rounded" onError={(e) => e.target.style.display='none'} />
                      </div>
                    )}
                    
                    {displayData.mission && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Mission</h5>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{displayData.mission}</p>
                      </div>
                    )}

                    {displayData.description && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Description</h5>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{displayData.description}</p>
                      </div>
                    )}

                    {displayData.objectives && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Goals & Objectives</h5>
                        <div className="text-gray-300 leading-relaxed text-sm space-y-2">
                          {(
                            (() => {
                              let items = displayData.objectives
                                .split('\n')
                                .join(';')
                                .split('. ')
                                .map(item => item.replace(/^;/, '').trim())
                                .filter(item => item.length > 0);
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-gray-400 mr-3">•</span>
                                  <span>{item.endsWith('.') ? item : item + '.'}</span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    {displayData.activities && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Planned Activities</h5>
                        <div className="text-gray-300 leading-relaxed text-sm space-y-2">
                          {(
                            (() => {
                              let items = displayData.activities
                                .split('\n')
                                .join(';')
                                .split('. ')
                                .map(item => item.replace(/^;/, '').trim())
                                .filter(item => item.length > 0);
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-gray-400 mr-3">•</span>
                                  <span>{item.endsWith('.') ? item : item + '.'}</span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {displayData.expected_members && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs font-semibold">Expected Members</p>
                          <p className="text-3xl font-bold text-white mt-2">{displayData.expected_members}</p>
                        </div>
                      )}
                      {displayData.submitted_date && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs font-semibold">Submitted</p>
                          <p className="text-white font-semibold mt-2">{new Date(displayData.submitted_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-4">Contact Information</h5>
                      <div className="space-y-2 text-sm">
                        {displayData.submitted_by && (
                          <p className="flex justify-between"><span className="text-gray-400">Submitted By:</span><span className="text-white">{displayData.submitted_by}</span></p>
                        )}
                        {displayData.president_name && (
                          <p className="flex justify-between"><span className="text-gray-400">President:</span><span className="text-white">{displayData.president_name}</span></p>
                        )}
                        {displayData.president_email && (
                          <p className="flex justify-between"><span className="text-gray-400">President Email:</span><span className="text-blue-300 truncate">{displayData.president_email}</span></p>
                        )}
                        {displayData.advisor_name && (
                          <p className="flex justify-between"><span className="text-gray-400">Advisor:</span><span className="text-white">{displayData.advisor_name}</span></p>
                        )}
                        {displayData.advisor_email && (
                          <p className="flex justify-between"><span className="text-gray-400">Advisor Email:</span><span className="text-blue-300 truncate">{displayData.advisor_email}</span></p>
                        )}
                        {displayData.meeting_time && (
                          <p className="flex justify-between"><span className="text-gray-400">Meeting Time:</span><span className="text-white">{displayData.meeting_time}</span></p>
                        )}
                        {displayData.meeting_location && (
                          <p className="flex justify-between"><span className="text-gray-400">Location:</span><span className="text-white">{displayData.meeting_location}</span></p>
                        )}
                      </div>
                    </div>

                    {displayData.requirements && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Membership Requirements</h5>
                        <div className="text-gray-300 leading-relaxed text-sm space-y-2">
                          {(
                            (() => {
                              let items = displayData.requirements
                                .split('\n')
                                .join(';')
                                .split('. ')
                                .map(item => item.replace(/^;/, '').trim())
                                .filter(item => item.length > 0);
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-gray-400 mr-3">•</span>
                                  <span>{item.endsWith('.') ? item : item + '.'}</span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // EVENT PROPOSAL
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white">{displayData.title || displayData.eventTitle || 'Untitled Event'}</h4>
                        {displayData.event_type && <p className="text-gray-400 capitalize">{displayData.event_type}</p>}
                        <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                          displayData.status === 'pending_review' ? 'bg-yellow-900 text-yellow-400' :
                          displayData.status === 'approved' ? 'bg-green-900 text-green-400' :
                          displayData.status === 'published' ? 'bg-purple-900 text-purple-400' :
                          displayData.status === 'rejected' ? 'bg-red-900 text-red-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {displayData.status === 'pending_review' ? 'Pending' : displayData.status?.charAt(0).toUpperCase() + (displayData.status?.slice(1) || '')}
                        </span>
                      </div>
                    </div>

                    {displayData.event_poster && (
                      <div className="bg-gray-700 rounded-lg p-4 flex justify-center">
                        <img src={displayData.event_poster} alt="Event Poster" className="h-48 w-auto object-contain rounded" onError={(e) => e.target.style.display='none'} />
                      </div>
                    )}
                    
                    {displayData.description && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Description</h5>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{displayData.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {(displayData.eventDate || displayData.startDate) && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Event Date</p>
                          <p className="text-white font-semibold mt-2">
                            {displayData.eventDate ? new Date(displayData.eventDate).toLocaleDateString() : 
                             displayData.startDate ? new Date(displayData.startDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      )}
                      {displayData.event_time && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Time</p>
                          <p className="text-white font-semibold mt-2">{displayData.event_time}</p>
                        </div>
                      )}
                    </div>

                    {/* Organizer & Venue Section */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-4">Event Details</h5>
                      <div className="space-y-3">
                        {displayData.organizerName && (
                          <div className="flex items-start pb-3 border-b border-gray-600">
                            <span className="text-gray-400 font-medium min-w-32">Organizer:</span>
                            <span className="text-white ml-4">{displayData.organizerName}</span>
                          </div>
                        )}
                        {displayData.organizerEmail && (
                          <div className="flex items-start pb-3 border-b border-gray-600">
                            <span className="text-gray-400 font-medium min-w-32">Email:</span>
                            <span className="text-gray-300 ml-4 break-all">{displayData.organizerEmail}</span>
                          </div>
                        )}
                        {displayData.organizerPhone && (
                          <div className="flex items-start pb-3 border-b border-gray-600">
                            <span className="text-gray-400 font-medium min-w-32">Phone:</span>
                            <span className="text-white ml-4">{displayData.organizerPhone}</span>
                          </div>
                        )}
                        {(displayData.specificLocation || displayData.venue) && (
                          <div className="flex items-start pb-3 border-b border-gray-600">
                            <span className="text-gray-400 font-medium min-w-32">Venue:</span>
                            <span className="text-white ml-4">{displayData.specificLocation || displayData.venue}</span>
                          </div>
                        )}
                        {displayData.capacity && (
                          <div className="flex items-start pb-3 border-b border-gray-600">
                            <span className="text-gray-400 font-medium min-w-32">Max Attendees:</span>
                            <span className="text-white ml-4">{displayData.capacity}</span>
                          </div>
                        )}
                        {displayData.ticketPrice && (
                          <div className="flex items-start">
                            <span className="text-gray-400 font-medium min-w-32">Ticket Price:</span>
                            <span className="text-white ml-4">${displayData.ticketPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {displayData.agenda_description && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Event Agenda</h5>
                        <div className="text-gray-300 leading-relaxed text-sm space-y-2">
                          {(
                            (() => {
                              let items = displayData.agenda_description
                                .split('\n')
                                .join(';')
                                .split('. ')
                                .map(item => item.replace(/^;/, '').trim())
                                .filter(item => item.length > 0);
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-gray-400 mr-3">•</span>
                                  <span>{item.endsWith('.') ? item : item + '.'}</span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    {displayData.special_requirements && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Special Requirements</h5>
                        <div className="text-gray-300 leading-relaxed text-sm space-y-2">
                          {(
                            (() => {
                              let items = displayData.special_requirements
                                .split('\n')
                                .join(';')
                                .split('. ')
                                .map(item => item.replace(/^;/, '').trim())
                                .filter(item => item.length > 0);
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                  <span className="text-gray-400 mr-3">•</span>
                                  <span>{item.endsWith('.') ? item : item + '.'}</span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      </div>
                    )}

                    {displayData.agenda_pdf && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Event Agenda Document</h5>
                        <a href={displayData.agenda_pdf} download className="text-blue-400 hover:text-blue-300 flex items-center break-all">
                          {displayData.agenda_pdf.split('/').pop()}
                        </a>
                      </div>
                    )}
                  </div>
                )
              })()
            )}
            
            {detailType === 'club' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white">{detailItem.title}</h4>
                    <p className="text-gray-400 capitalize">{detailItem.event_type || detailItem.category || 'Event'}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                      detailItem.status === 'pending_approval' || detailItem.status === 'pending' ? 'bg-yellow-900 text-yellow-400' :
                      detailItem.status === 'approved' ? 'bg-green-900 text-green-400' :
                      detailItem.status === 'published' ? 'bg-purple-900 text-purple-400' :
                      detailItem.status === 'rejected' ? 'bg-red-900 text-red-400' :
                      'bg-gray-900 text-gray-400'
                    }`}>
                      {detailItem.status ? detailItem.status.replace('_', ' ').charAt(0).toUpperCase() + detailItem.status.replace('_', ' ').slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Description</h5>
                  <p className="text-gray-300">{detailItem.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="text-lg font-bold text-white">
                      {detailItem.start_datetime ? new Date(detailItem.start_datetime).toLocaleDateString() : 'TBD'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {detailItem.start_datetime ? new Date(detailItem.start_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Capacity</p>
                    <p className="text-lg font-bold text-white">{detailItem.max_attendees || 'Unlimited'}</p>
                    <p className="text-sm text-gray-400">{detailItem.is_paid ? `Paid: $${detailItem.ticket_price}` : 'Free'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Organizer:</span>
                    <span className="text-white font-medium">{detailItem.organizer?.email || detailItem.created_by?.email || 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Venue:</span>
                    <span className="text-white font-medium">{detailItem.venue || detailItem.location || 'TBD'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Registration Deadline:</span>
                    <span className="text-white font-medium">
                      {detailItem.registration_deadline ? new Date(detailItem.registration_deadline).toLocaleDateString() : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            {detailType === 'club' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white">{detailItem.name}</h4>
                    <p className="text-gray-400 capitalize">{detailItem.category || 'General'}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                      detailItem.status === 'pending' ? 'bg-yellow-900 text-yellow-400' :
                      detailItem.status === 'approved' ? 'bg-green-900 text-green-400' :
                      detailItem.status === 'published' ? 'bg-purple-900 text-purple-400' :
                      detailItem.status === 'rejected' ? 'bg-red-900 text-red-400' :
                      'bg-gray-900 text-gray-400'
                    }`}>
                      {detailItem.status ? detailItem.status.charAt(0).toUpperCase() + detailItem.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Description</h5>
                  <p className="text-gray-300">{detailItem.description || 'No description provided.'}</p>
                </div>

                {detailItem.mission_statement && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h5 className="font-semibold text-white mb-2">Mission Statement</h5>
                    <p className="text-gray-300">{detailItem.mission_statement}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Members</p>
                    <p className="text-2xl font-bold text-white">{detailItem.member_count ?? 0}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Founded</p>
                    <p className="text-lg font-bold text-white">{detailItem.founded_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Created By:</span>
                    <span className="text-white font-medium">{detailItem.created_by?.email || 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Advisor:</span>
                    <span className="text-white font-medium">{detailItem.advisor_name || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Advisor Email:</span>
                    <span className="text-white font-medium">{detailItem.advisor_email || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Meeting Schedule:</span>
                    <span className="text-white font-medium">{detailItem.meeting_schedule || 'Not set'}</span>
                  </p>
                </div>
              </div>
            )}
            
            {detailType === 'event' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white">{detailItem.title}</h4>
                    <p className="text-gray-400 capitalize">{detailItem.event_type || detailItem.category || 'Event'}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                      detailItem.status === 'pending_approval' || detailItem.status === 'pending' ? 'bg-yellow-900 text-yellow-400' :
                      detailItem.status === 'approved' ? 'bg-green-900 text-green-400' :
                      detailItem.status === 'published' ? 'bg-purple-900 text-purple-400' :
                      detailItem.status === 'rejected' ? 'bg-red-900 text-red-400' :
                      'bg-gray-900 text-gray-400'
                    }`}>
                      {detailItem.status ? detailItem.status.replace('_', ' ').charAt(0).toUpperCase() + detailItem.status.replace('_', ' ').slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Description</h5>
                  <p className="text-gray-300">{detailItem.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="text-lg font-bold text-white">
                      {detailItem.start_datetime ? new Date(detailItem.start_datetime).toLocaleDateString() : 'TBD'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {detailItem.start_datetime ? new Date(detailItem.start_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Capacity</p>
                    <p className="text-lg font-bold text-white">{detailItem.max_attendees || 'Unlimited'}</p>
                    <p className="text-sm text-gray-400">{detailItem.is_paid ? `Paid: $${detailItem.ticket_price}` : 'Free'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Organizer:</span>
                    <span className="text-white font-medium">{detailItem.organizer?.email || detailItem.created_by?.email || 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Venue:</span>
                    <span className="text-white font-medium">{detailItem.venue || detailItem.location || 'TBD'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Registration Deadline:</span>
                    <span className="text-white font-medium">
                      {detailItem.registration_deadline ? new Date(detailItem.registration_deadline).toLocaleDateString() : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setDetailItem(null)
                  setDetailType('')
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add Review Notes</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setReviewNotes('')
                  setReviewItem(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Reviewing: <span className="font-semibold text-white">{reviewItem.title || reviewItem.name || 'this item'}</span>
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Add your review notes and feedback. This will mark the {reviewItem.type} as "Under Review" and notify the submitter.
              </p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter your review notes, questions, or feedback..."
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setReviewNotes('')
                  setReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewNotes.trim()) {
                    toast.success(`${reviewItem.type} marked for review. Notes saved.`)
                    console.log(`Review notes for ${reviewItem.type}:`, reviewItem, 'Notes:', reviewNotes)
                  } else {
                    toast.success(`${reviewItem.type} marked for review (no notes added)`)
                  }
                  setShowReviewModal(false)
                  setReviewNotes('')
                  setReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Reject {rejectType}</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectItem(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                You are about to reject: <span className="font-semibold text-white">{rejectItem?.title || rejectItem?.name || 'this item'}</span>
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Please provide a reason for rejection. This will be sent to the organization/submitter.
              </p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this submission is being rejected..."
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectItem(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('Please provide a rejection reason')
                    return
                  }
                  if (rejectType === 'proposal') {
                    updateRequestMutation.mutate({ requestId: rejectItem.id, status: 'rejected', comments: rejectReason })
                  } else if (rejectType === 'club_proposal') {
                    console.log('🔶 Rejecting club proposal with reason:', rejectReason)
                    rejectClubMutation.mutate({ proposalId: rejectItem.id, comments: rejectReason })
                  }
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectItem(null)
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stage 2 Review Modal - Form Completeness Check */}
      {showStage2Modal && stageReviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Stage 2: Form Completeness Check</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Review proposal form for completeness and required information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStage2Modal(false)
                  setStage2Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">{stageReviewItem.title}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>Type: {stageReviewItem.type}</span>
                <span>â€¢</span>
                <span>Submitted by: {stageReviewItem.submittedBy}</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
              <h5 className="font-semibold text-blue-400 mb-2">Stage 2 Checklist:</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>âœ“ All mandatory fields completed</li>
                <li>âœ“ For Events: Title, date, venue, capacity filled</li>
                <li>âœ“ For Clubs: Members â‰¥ 5, mandatory info provided</li>
                <li>âœ“ Contact information provided</li>
                <li>âœ“ Budget/resources specified (if applicable)</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={stage2Notes}
                onChange={(e) => setStage2Notes(e.target.value)}
                placeholder="Add any observations or notes about the form completeness..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Revision (if sending back)
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Specify what needs to be corrected or completed..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowStage2Modal(false)
                  setStage2Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!revisionReason.trim()) {
                    toast.error('Please provide a reason for requesting revision')
                    return
                  }
                  toast.success('Proposal sent back for revision. Submitter has been notified.')
                  console.log('Stage 2 - Requesting Revision:', stageReviewItem, 'Reason:', revisionReason)
                  setShowStage2Modal(false)
                  setStage2Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Send Back for Revision
              </button>
              <button
                onClick={() => {
                  toast.success('âœ“ Stage 2 passed! Proposal moved to Stage 3: Safety & Compliance Check')
                  console.log('Stage 2 - Passed to Stage 3:', stageReviewItem, 'Notes:', stage2Notes)
                  setShowStage2Modal(false)
                  setStage2Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Pass to Stage 3
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stage 3 Review Modal - Safety & Compliance Check */}
      {showStage3Modal && stageReviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Stage 3: Safety & Compliance Check</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Verify safety requirements and policy compliance
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStage3Modal(false)
                  setStage3Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">{stageReviewItem.title}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>Type: {stageReviewItem.type}</span>
                <span>â€¢</span>
                <span>Submitted by: {stageReviewItem.submittedBy}</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-600 rounded-lg">
              <h5 className="font-semibold text-indigo-400 mb-2">Stage 3 Checklist:</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>âœ“ No safety conflicts or concerns</li>
                <li>âœ“ For Events: Date/venue conflicts checked</li>
                <li>âœ“ For Clubs: Purpose is clear, safe, and legal</li>
                <li>âœ“ Campus policy compliance verified</li>
                <li>âœ“ Appropriate resources and oversight planned</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={stage3Notes}
                onChange={(e) => setStage3Notes(e.target.value)}
                placeholder="Add any observations about safety and compliance..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Revision (if sending back)
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Specify what safety or compliance issues need to be addressed..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowStage3Modal(false)
                  setStage3Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!revisionReason.trim()) {
                    toast.error('Please provide a reason for requesting revision')
                    return
                  }
                  toast.success('Proposal sent back for revision. Submitter has been notified.')
                  console.log('Stage 3 - Requesting Revision:', stageReviewItem, 'Reason:', revisionReason)
                  setShowStage3Modal(false)
                  setStage3Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Send Back for Revision
              </button>
              <button
                onClick={() => {
                  toast.success('âœ“ Stage 3 passed! Proposal moved to Stage 4: Final Approval')
                  console.log('Stage 3 - Passed to Stage 4:', stageReviewItem, 'Notes:', stage3Notes)
                  setShowStage3Modal(false)
                  setStage3Notes('')
                  setRevisionReason('')
                  setStageReviewItem(null)
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Final Approval (Stage 4)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
