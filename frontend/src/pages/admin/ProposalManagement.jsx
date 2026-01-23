import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  FlagIcon,
  ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/outline'

const ProposalManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [commentText, setCommentText] = useState('')

  const queryClient = useQueryClient()

  // Fetch proposals
  const { data: proposalsData, isLoading, error } = useQuery({
    queryKey: ['admin-proposals', currentPage, searchTerm, typeFilter, statusFilter, priorityFilter],
    queryFn: async () => {
      console.log('Fetching proposals...')
      const token = localStorage.getItem('access_token')
      console.log('Token exists:', !!token)
      const params = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        priority: priorityFilter
      })
      console.log('API URL:', `http://localhost:8000/api/admin/proposals/?${params}`)
      const response = await fetch(`http://localhost:8000/api/admin/proposals/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        console.log('Response error:', await response.text())
        throw new Error('Failed to fetch proposals')
      }
      const data = await response.json()
      console.log('Response data:', data)
      return data
    }
  })

  // Proposal actions mutations
  const approveProposalMutation = useMutation({
    mutationFn: async ({ proposalId, comment }) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/proposals/${proposalId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment })
      })
      if (!response.ok) throw new Error('Failed to approve proposal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-proposals'])
      setShowProposalModal(false)
      setSelectedProposal(null)
      setCommentText('')
      // Show success message
    }
  })

  const rejectProposalMutation = useMutation({
    mutationFn: async ({ proposalId, comment }) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/proposals/${proposalId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment })
      })
      if (!response.ok) throw new Error('Failed to reject proposal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-proposals'])
      setShowProposalModal(false)
      setSelectedProposal(null)
      setCommentText('')
      // Show success message
    }
  })

  const deleteProposalMutation = useMutation({
    mutationFn: async (proposalId) => {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/admin/proposals/${proposalId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) throw new Error('Failed to delete proposal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-proposals'])
      setShowProposalModal(false)
      setSelectedProposal(null)
      // Show success message
    }
  })

  const handleProposalAction = (proposalId, action, comment = '') => {
    switch (action) {
      case 'approve':
        approveProposalMutation.mutate({ proposalId, comment })
        break
      case 'reject':
        rejectProposalMutation.mutate({ proposalId, comment })
        break
      case 'delete':
        if (window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
          deleteProposalMutation.mutate(proposalId)
        }
        break
    }
  }

  const ProposalCard = ({ proposal }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800'
        case 'under_review':
          return 'bg-blue-100 text-blue-800'
        case 'approved':
          return 'bg-green-100 text-green-800'
        case 'rejected':
          return 'bg-red-100 text-red-800'
        case 'implemented':
          return 'bg-purple-100 text-purple-800'
        case 'cancelled':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'urgent':
          return 'bg-red-100 text-red-800'
        case 'high':
          return 'bg-orange-100 text-orange-800'
        case 'medium':
          return 'bg-yellow-100 text-yellow-800'
        case 'low':
          return 'bg-green-100 text-green-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    const getTypeColor = (type) => {
      switch (type) {
        case 'club':
          return 'bg-blue-100 text-blue-800'
        case 'event':
          return 'bg-purple-100 text-purple-800'
        case 'project':
          return 'bg-green-100 text-green-800'
        case 'funding':
          return 'bg-yellow-100 text-yellow-800'
        case 'complaint':
          return 'bg-red-100 text-red-800'
        case 'suggestion':
          return 'bg-indigo-100 text-indigo-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{proposal.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{proposal.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(proposal.priority)}`}>
                {proposal.priority}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(proposal.status)}`}>
                {proposal.status}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(proposal.type)}`}>
                {proposal.type}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Submitted by:</span>
              <span className="font-medium">{proposal.submitted_by.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Submitted:</span>
              <span className="font-medium">{new Date(proposal.submitted_at).toLocaleDateString()}</span>
            </div>
            {proposal.deadline && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Deadline:</span>
                <span className={`font-medium ${new Date(proposal.deadline) < new Date() ? 'text-red-600' : ''}`}>
                  {new Date(proposal.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            {proposal.budget && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Budget:</span>
                <span className="font-medium">${proposal.budget.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {proposal.tags && proposal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {proposal.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedProposal(proposal)
                setShowProposalModal(true)
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              View Details
            </button>
            
            {proposal.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleProposalAction(proposal.id, 'approve')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleProposalAction(proposal.id, 'reject')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const ProposalModal = ({ proposal, isOpen, onClose }) => {
    if (!isOpen || !proposal) return null

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
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Proposal Details</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Proposal Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{proposal.title}</h3>
                <p className="text-gray-600">{proposal.description}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        proposal.type === 'club'
                          ? 'bg-blue-100 text-blue-800'
                          : proposal.type === 'event'
                          ? 'bg-purple-100 text-purple-800'
                          : proposal.type === 'project'
                          ? 'bg-green-100 text-green-800'
                          : proposal.type === 'funding'
                          ? 'bg-yellow-100 text-yellow-800'
                          : proposal.type === 'complaint'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {proposal.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Priority:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        proposal.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : proposal.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : proposal.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : proposal.priority === 'low'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.priority}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        proposal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : proposal.status === 'under_review'
                          ? 'bg-blue-100 text-blue-800'
                          : proposal.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : proposal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : proposal.status === 'implemented'
                          ? 'bg-purple-100 text-purple-800'
                          : proposal.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Submission Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{proposal.submitted_by.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{new Date(proposal.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {proposal.deadline && (
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <span className={`text-sm ${new Date(proposal.deadline) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                          {new Date(proposal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget */}
              {proposal.budget && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Budget</h4>
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">${proposal.budget.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {proposal.tags && proposal.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {proposal.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        <TagIcon className="w-4 h-4 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Comments</h4>
                <div className="space-y-3">
                  {proposal.comments?.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!proposal.comments || proposal.comments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>No comments yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Add Comment</h4>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleProposalAction(proposal.id, 'approve', commentText)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleProposalAction(proposal.id, 'reject', commentText)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleProposalAction(proposal.id, 'delete')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
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
    console.log('Proposal fetch error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading proposals</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  console.log('Proposals data:', proposalsData)
  console.log('Is loading:', isLoading)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Proposal Management</h1>
                <p className="text-gray-600">Review and manage all proposals</p>
              </div>
              
              {/* Filters */}
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
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="club">Club</option>
                  <option value="event">Event</option>
                  <option value="project">Project</option>
                  <option value="funding">Funding</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="implemented">Implemented</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proposals Grid */}
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
              {proposalsData?.proposals?.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {proposalsData?.pagination && (
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
                  Page {currentPage} of {proposalsData.pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(proposalsData.pagination.totalPages, prev + 1))}
                  disabled={currentPage === proposalsData.pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Modal */}
      <ProposalModal
        proposal={selectedProposal}
        isOpen={showProposalModal}
        onClose={() => {
          setShowProposalModal(false)
          setSelectedProposal(null)
          setCommentText('')
        }}
      />
    </div>
  )
}

export default ProposalManagement
