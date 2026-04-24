import React, { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  approveClubProposal,
  rejectClubProposal,
  returnClubProposalForRevision,
  publishClubProposal
} from '../../../api/admin'

const ProposalsSection = ({ 
  requests = [], 
  requestsLoading, 
  updateRequestMutation,
  setDetailItem,
  setDetailType,
  setShowDetailModal,
  setRejectItem,
  setRejectType,
  setShowRejectModal
}) => {
  const [filterStatus, setFilterStatus] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const queryClient = useQueryClient()

  // Separate mutations for club proposals
  const approveClubMutation = useMutation({
    mutationFn: ({ proposalId, comments }) => approveClubProposal(proposalId, comments),
    onSuccess: (data) => {
      console.log('✅ Club proposal approved:', data)
      // Refresh the proposals list
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast.success('Club proposal approved successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to approve club proposal:', error)
      toast.error('Failed to approve club proposal')
    }
  })

  const rejectClubMutation = useMutation({
    mutationFn: ({ proposalId, comments }) => rejectClubProposal(proposalId, comments),
    onSuccess: (data) => {
      console.log('✅ Club proposal rejected:', data)
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast.success('Club proposal rejected successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to reject club proposal:', error)
      toast.error('Failed to reject club proposal')
    }
  })

  const returnClubMutation = useMutation({
    mutationFn: ({ proposalId, comments }) => returnClubProposalForRevision(proposalId, comments),
    onSuccess: (data) => {
      console.log('✅ Club proposal returned for revision:', data)
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast.success('Club proposal returned for revision')
    },
    onError: (error) => {
      console.error('❌ Failed to return club proposal:', error)
      toast.error('Failed to return club proposal for revision')
    }
  })

  const publishClubMutation = useMutation({
    mutationFn: (proposalId) => publishClubProposal(proposalId),
    onSuccess: (data) => {
      console.log('✅ Club proposal published:', data)
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      toast.success('Club proposal published successfully')
    },
    onError: (error) => {
      console.error('❌ Failed to publish club proposal:', error)
      toast.error('Failed to publish club proposal')
    }
  })

  // Debug: log proposals with their statuses to help identify why buttons are hidden
  useEffect(() => {
    const proposalsWithStatus = (Array.isArray(requests) ? requests : []).map(p => ({
      title: p.title || p.name,
      status: p.status,
      role: p.submitted_by_role || p.submitterRole,
      type: p.type,
      id: p.id,
      id_type: typeof p.id,
      hasApproveButton: p.status === 'pending_review' || p.status === 'returned_for_revision'
    }))
    const organizerProposals = proposalsWithStatus.filter(p => p.role === 'organizer')
    console.log('📊 ALL Proposals loaded:', proposalsWithStatus.length)
    console.log('🔶 Organizer Proposals:', organizerProposals)
    if (organizerProposals.length > 0) {
      organizerProposals.forEach(p => {
        console.log(`  └─ ${p.title} [${p.type}] id="${p.id}" status=${p.status} hasButtons=${p.hasApproveButton}`)
      })
    }
    
    // Show first request object structure for debugging
    if (requests && requests.length > 0) {
      console.log('📋 FIRST PROPOSAL RAW OBJECT:', JSON.stringify(requests[0], null, 2))
    }
  }, [requests, updateRequestMutation])

  const filteredProposals = (Array.isArray(requests) ? requests : []).filter(
    p => (filterStatus === 'all' || p.status === filterStatus) &&
         (typeFilter === 'all' || p.type === typeFilter) &&
         (roleFilter === 'all' || p.submitted_by_role === roleFilter || p.submitterRole === roleFilter)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-white">Proposal Management</h2>
      </div>
      
      {/* Type Filter Buttons */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 font-medium">Filter by Type:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Proposals
          </button>
          <button
            onClick={() => setTypeFilter('event_proposal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'event_proposal'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Event Proposals
          </button>
          <button
            onClick={() => setTypeFilter('club_proposal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'club_proposal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Club Proposals
          </button>
        </div>
      </div>
      
      {/* Status Filter Toggle Buttons */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 font-medium">Filter by Status:</label>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending_review', 'approved', 'published', 'rejected', 'returned_for_revision'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {status === 'all' ? 'All Proposals' :
             status === 'pending_review' ? 'Pending Review' :
             status === 'approved' ? 'Approved' :
             status === 'published' ? 'Published' :
             status === 'rejected' ? 'Rejected' :
             'Returned for Revision'}
          </button>
        ))}
        </div>
      </div>

      {/* Role Filter Buttons */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 font-medium">Submitted by:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRoleFilter('organizer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === 'organizer'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Organizers
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === 'student'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Students
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading proposals...</p>
          </div>
        ) : (() => {
            if (filteredProposals.length === 0) {
              return (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No proposals found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {typeFilter === 'all' && filterStatus === 'all'
                      ? 'No proposals have been submitted yet.'
                      : `No ${typeFilter === 'event_proposal' ? 'event' : typeFilter === 'club_proposal' ? 'club' : ''} proposals ${filterStatus !== 'all' ? `with status: ${filterStatus}` : ''}`}
                  </p>
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProposals.map((p) => (
                  <div key={`${p.type}-${p.id}`} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${
                          p.type === 'event_proposal' 
                            ? 'from-purple-500 to-pink-600' 
                            : 'from-yellow-500 to-orange-600'
                        } rounded-lg flex items-center justify-center`}>
                          {p.type === 'event_proposal' ? (
                            <CalendarIcon className="w-6 h-6 text-white" />
                          ) : (
                            <DocumentTextIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {p.title || p.name || 'Untitled'}
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">
                            {p.type === 'event_proposal' 
                              ? 'Event Proposal' 
                              : p.club_type?.replace('_', ' ') || 'Club Proposal'
                            }
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.status === 'pending_review' ? 'bg-yellow-900 text-yellow-400' :
                        p.status === 'approved' ? 'bg-green-900 text-green-400' :
                        p.status === 'published' ? 'bg-purple-900 text-purple-400' :
                        p.status === 'rejected' ? 'bg-red-900 text-red-400' :
                        p.status === 'returned_for_revision' ? 'bg-orange-900 text-orange-400' :
                        'bg-gray-900 text-gray-400'
                      }`}>
                        {p.status === 'pending_review' ? 'Pending Review' :
                         p.status === 'returned_for_revision' ? 'Returned for Revision' :
                         p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {p.mission || p.description || 'No description available'}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                      {p.type === 'event_proposal' ? (
                        <>
                          {p.details?.venue && (
                            <p className="flex items-center justify-between">
                              <span>Venue:</span>
                              <span className="font-medium">{p.details.venue}</span>
                            </p>
                          )}
                          {p.details?.date && (
                            <p className="flex items-center justify-between">
                              <span>Date:</span>
                              <span className="font-medium">{p.details.date}</span>
                            </p>
                          )}
                          {p.details?.organizer && (
                            <p className="flex items-center justify-between">
                              <span>Organizer:</span>
                              <span className="font-medium">{p.details.organizer}</span>
                            </p>
                          )}
                          {p.details?.expectedAttendees && (
                            <p className="flex items-center justify-between">
                              <span>Expected Attendees:</span>
                              <span className="font-medium">{p.details.expectedAttendees}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="flex items-center justify-between">
                            <span>President:</span>
                            <span className="font-medium">{p.president_name || 'N/A'}</span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Expected Members:</span>
                            <span className="font-medium">{p.expected_members ?? 'N/A'}</span>
                          </p>
                        </>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Submitted By:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.submitted_by || p.submittedBy || p.submitted_by_details?.email || 'Unknown'}</span>
                          {(p.submitted_by_role || p.submitterRole) && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              (p.submitted_by_role || p.submitterRole) === 'student'
                                ? 'bg-green-900 text-green-400'
                                : (p.submitted_by_role || p.submitterRole) === 'organizer'
                                ? 'bg-indigo-900 text-indigo-400'
                                : (p.submitted_by_role || p.submitterRole) === 'admin'
                                ? 'bg-red-900 text-red-400'
                                : 'bg-gray-900 text-gray-400'
                            }`}>
                              {(p.submitted_by_role || p.submitterRole) === 'student' ? 'Student' :
                               (p.submitted_by_role || p.submitterRole) === 'organizer' ? 'Organizer' :
                               (p.submitted_by_role || p.submitterRole) === 'admin' ? 'Admin' :
                               (p.submitted_by_role || p.submitterRole)?.charAt(0).toUpperCase() + (p.submitted_by_role || p.submitterRole)?.slice(1) || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Date:</span>
                        <span className="font-medium">
                          {p.submittedDate || (p.submitted_date ? new Date(p.submitted_date).toLocaleDateString() : 'N/A')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setDetailItem({ ...p, modalType: 'proposal' })
                          setDetailType('proposal')
                          setShowDetailModal(true)
                        }}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                      {p.status === 'pending_review' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (!window.confirm(`Approve proposal "${p.title || p.name}"?`)) return
                              
                              // Use correct endpoint based on proposal type
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Using approveClubProposal for', p.id)
                                approveClubMutation.mutate({ proposalId: p.id, comments: '' })
                              } else {
                                console.log('🟢 Using updateRequestMutation for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'approved' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Opening reject modal for club proposal', p.id)
                                setRejectItem(p)
                                setRejectType('club_proposal')
                                setShowRejectModal(true)
                              } else {
                                if (!window.confirm(`Reject proposal "${p.title || p.name}"?`)) return
                                console.log('🟢 Using updateRequestMutation for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'rejected' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {p.status === 'returned_for_revision' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (!window.confirm(`Approve proposal "${p.title || p.name}"?`)) return
                              
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Using approveClubProposal for', p.id)
                                approveClubMutation.mutate({ proposalId: p.id, comments: '' })
                              } else {
                                console.log('🟢 Using updateRequestMutation for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'approved' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Opening reject modal for club proposal', p.id)
                                setRejectItem(p)
                                setRejectType('club_proposal')
                                setShowRejectModal(true)
                              } else {
                                if (!window.confirm(`Reject proposal "${p.title || p.name}"?`)) return
                                console.log('🟢 Using updateRequestMutation for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'rejected' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {p.status === 'approved' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (!window.confirm(`Publish proposal "${p.title || p.name}"?`)) return
                              
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Using publishClubProposal for', p.id)
                                publishClubMutation.mutate(p.id)
                              } else {
                                console.log('🟢 Using updateRequestMutation (publish) for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'published' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => {
                              if (p.type === 'club_proposal') {
                                console.log('🔶 Opening reject modal for club proposal', p.id)
                                setRejectItem(p)
                                setRejectType('club_proposal')
                                setShowRejectModal(true)
                              } else {
                                if (!window.confirm(`Reject proposal "${p.title || p.name}"?`)) return
                                console.log('🟢 Using updateRequestMutation for', p.id)
                                updateRequestMutation.mutate({ requestId: p.id, status: 'rejected' })
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
      </div>
    </div>
  )
}

export default ProposalsSection
