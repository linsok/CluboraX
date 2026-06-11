import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { resubmitEventProposal, resubmitClubProposal, deleteEventProposal, deleteClubProposal } from '../../api/proposals'
import {
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TagIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

const ProposalCard = ({ proposal, queryClient, getStatusColor, getStatusIcon, getStatusLabel, setActiveTab, isOrganizer, navigate }) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const [revisionFile, setRevisionFile] = useState(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [reviseForm, setReviseForm] = useState({
    // Event fields
    title: proposal.title || proposal.eventTitle || '',
    description: proposal.description || '',
    proposed_date: proposal.proposed_date || proposal.eventDate || '',
    eventDate: proposal.eventDate || proposal.proposed_date || '',
    time: proposal.time || proposal.startDate || '',
    venue: proposal.venue || proposal.specificLocation || '',
    specificLocation: proposal.specificLocation || proposal.venue || '',
    province: proposal.province || '',
    expected_participants: proposal.expected_participants || proposal.capacity || '',
    capacity: proposal.capacity || proposal.expected_participants || '',
    total_budget: proposal.total_budget || proposal.budget || '',
    budget: proposal.budget || proposal.total_budget || '',
    ticketPrice: proposal.ticketPrice || proposal.price || '',
    price: proposal.price || proposal.ticketPrice || '',
    organizerName: proposal.organizerName || '',
    organizerEmail: proposal.organizerEmail || '',
    organizerPhone: proposal.organizerPhone || proposal.phoneNumber || '',
    phoneNumber: proposal.phoneNumber || proposal.organizerPhone || '',
    eventType: proposal.eventType || 'academic',
    agenda: proposal.agenda || '',
    agendaPdf: proposal.agendaPdf || null,
    requirements: proposal.requirements || '',
    tags: proposal.tags || [],
    // Club fields
    name: proposal.name || '',
    mission: proposal.mission || '',
    club_type: proposal.club_type || '',
    advisor_name: proposal.advisor_name || '',
    advisor_email: proposal.advisor_email || '',
    president_name: proposal.president_name || '',
    expected_members: proposal.expected_members || '',
  })
  const handleReviseInput = (e) => setReviseForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // Handle navigation to published event/club
  const handleViewPublished = () => {
    if (isOrganizer) {
      // Organizers: Navigate to proposals page since my-events tab was removed
      navigate(`/dashboard?tab=proposals`)
      setTimeout(() => {
        toast.success('Your proposal has been published!')
      }, 300)
    } else {
      // Students: Navigate based on type
      if (proposal.type === 'event') {
        // Events: go to public events page
        navigate(`/events?highlight=${proposal.id}`)
      } else {
        // Clubs: go to my-organized tab to manage their published club
        navigate(`/dashboard?tab=my-organized`)
        setTimeout(() => {
          toast.success('Your published club is now ready to manage!')
        }, 500)
      }
    }
  }
  
  const deleteProposalMutation = useMutation({
    mutationFn: (id) => {
      return proposal.type === 'event' 
        ? deleteEventProposal(id)
        : deleteClubProposal(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-event-proposals'])
      queryClient.invalidateQueries(['my-club-proposals'])
      toast.success('Proposal deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete proposal')
    }
  })

  const resubmitMutation = useMutation({
    mutationFn: ({ id, data, file }) => proposal.type === 'event'
      ? resubmitEventProposal(id, data, file)
      : resubmitClubProposal(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-event-proposals'])
      queryClient.invalidateQueries(['my-club-proposals'])
      toast.success('Proposal revised and sent back for admin review!')
      setShowEditModal(false)
      setRevisionFile(null)
      setRevisionNotes('')
    },
    onError: (err) => {
      const d = err?.response?.data
      if (d && typeof d === 'object') {
        const msg = Object.entries(d).map(([, v]) => (Array.isArray(v) ? v.join(', ') : v)).join(' | ')
        toast.error(`Failed: ${msg}`)
      } else {
        toast.error('Failed to resubmit proposal')
      }
    }
  })

  const handleRevisionSubmit = (e) => {
    e.preventDefault()
    const data = proposal.type === 'event' ? {
      title: reviseForm.title,
      eventTitle: reviseForm.title,
      description: reviseForm.description,
      proposed_date: reviseForm.eventDate,
      eventDate: reviseForm.eventDate,
      venue: reviseForm.venue,
      specificLocation: reviseForm.venue,
      province: reviseForm.province,
      capacity: parseInt(reviseForm.capacity) || 0,
      expected_participants: parseInt(reviseForm.capacity) || 0,
      organizerEmail: reviseForm.organizerEmail,
      organizerPhone: reviseForm.phoneNumber,
      ticketPrice: parseFloat(reviseForm.price) || 0,
      budget: parseFloat(reviseForm.total_budget) || 0,
      total_budget: parseFloat(reviseForm.total_budget) || 0,
      requirements: reviseForm.requirements,
      revision_notes: revisionNotes,
    } : {
      name: reviseForm.name,
      club_type: reviseForm.club_type,
      mission: reviseForm.mission,
      description: reviseForm.description,
      advisor_name: reviseForm.advisor_name,
      advisor_email: reviseForm.advisor_email,
      president_name: reviseForm.president_name,
      expected_members: parseInt(reviseForm.expected_members) || 0,
      requirements: reviseForm.requirements,
      revision_notes: revisionNotes,
    }
    resubmitMutation.mutate({ id: proposal.id, data, file: revisionFile })
  }
  
  const handleDelete = () => {
    // Special confirmation for needs_revision status
    if (proposal.needs_revision || proposal.status === 'needs_revision') {
      const confirmed = window.confirm(
        'Please Think Clearly!\n\n' +
        'This proposal needs revision. Are you sure you want to DELETE it instead of revising?\n\n' +
        'Deleting means you\'ll lose all your work and will need to start over.\n\n' +
        'Click OK only if you\'re absolutely certain you want to delete this proposal.'
      )
      if (confirmed) {
        deleteProposalMutation.mutate(proposal.id)
      }
    } else {
      if (window.confirm('Are you sure you want to delete this proposal?')) {
        deleteProposalMutation.mutate(proposal.id)
      }
    }
  }
  
  // Get current stage (1-5) from proposal status
  const getCurrentStage = () => {
    if (proposal.approval_stage) return proposal.approval_stage
    // Derive stage from status since backend doesn't have approval_stage
    switch (proposal.status) {
      case 'published':   return 5
      case 'approved':    return 4
      case 'rejected':    return 3
      case 'returned_for_revision':    return 3
      default:            return 1  // pending_review
    }
  }
  
  // Determine stage status
  const getStageStatus = (stageNum) => {
    const currentStage = getCurrentStage()
    if (proposal.status === 'rejected' && stageNum === currentStage) return 'rejected'
    if (proposal.status === 'returned_for_revision' && stageNum === currentStage) return 'returned'
    if (proposal.needs_revision && stageNum === currentStage) return 'needs_revision'
    if (stageNum < currentStage) return 'completed'
    if (stageNum === currentStage) return 'current'
    return 'pending'
  }
  
  const currentStage = getCurrentStage()
  
  // Stage descriptions
  const stages = [
    { num: 1, label: 'Submitted', desc: 'Proposal received' },
    { num: 2, label: 'Form Check', desc: proposal.type === 'event' ? 'Details verification' : 'Members ≥5, Info check' },
    { num: 3, label: 'Compliance', desc: 'Safety & policy review' },
    { num: 4, label: 'Final Review', desc: 'Admin approval' },
    { num: 5, label: 'Published', desc: proposal.type === 'event' ? 'Visible to students' : 'Added to directory' }
  ]
  
  const progressPercent = ((Math.min(currentStage, stages.length) - 1) / (stages.length - 1)) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 overflow-hidden h-full flex flex-col justify-between"
    >
      <div className="p-6 flex-1 flex flex-col justify-between">
        {/* Top Content wrapper */}
        <div className="flex-grow flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2 mb-1">
                {proposal.type === 'event' ? (
                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
                ) : (
                  <UsersIcon className="w-4 h-4 text-purple-500" />
                )}
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {proposal.type} Proposal
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug h-[2.75rem]" title={proposal.title || proposal.name}>
                {proposal.title || proposal.name}
              </h3>
            </div>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusColor(proposal.status)}`}>
              {getStatusIcon(proposal.status)}
              {getStatusLabel(proposal.status)}
            </span>
          </div>
          
          {/* 5-Stage Progress Bar */}
          <div className="mb-6 relative">
            <div className="relative flex items-center justify-between mb-2">
              {/* Gray Background Track */}
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
              
              {/* Colored Active Track */}
              <div 
                className={`absolute left-4 top-4 h-0.5 transition-all duration-500 -translate-y-1/2 z-0 ${
                  proposal.status === 'rejected' ? 'bg-red-500' :
                  proposal.status === 'returned_for_revision' ? 'bg-orange-500' :
                  proposal.needs_revision ? 'bg-yellow-500' :
                  'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
              
              {stages.map((stage) => {
                const status = getStageStatus(stage.num)
                return (
                  <div key={stage.num} className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      status === 'completed' ? 'bg-green-500 text-white border-2 border-white' :
                      status === 'current' ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 border-2 border-white' :
                      status === 'rejected' ? 'bg-red-500 text-white border-2 border-white' :
                      status === 'returned' ? 'bg-orange-500 text-white ring-4 ring-orange-100 border-2 border-white' :
                      status === 'needs_revision' ? 'bg-yellow-500 text-white border-2 border-white' :
                      'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {status === 'completed' ? '✓' : stage.num}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1.5 font-semibold text-center bg-white px-1">
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2 italic font-medium">
              {stages[currentStage - 1]?.desc}
            </p>
          </div>
          
          {/* Content (Description) */}
          <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] mb-4">
            {proposal.description || proposal.mission || 'No description provided.'}
          </p>
          
          {/* Spacer to push details and warning boxes to bottom */}
          <div className="flex-1" />
          
          {/* Details */}
          <div className="space-y-2 mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
            {proposal.type === 'event' ? (
              <>
                <div className="flex items-center text-xs text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-1 text-gray-900">{proposal.proposed_date ? new Date(proposal.proposed_date).toLocaleDateString() : 'TBA'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Venue:</span>
                  <span className="ml-1 text-gray-900 truncate" title={proposal.venue || 'TBA'}>
                    {proposal.venue || 'TBA'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <UsersIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Capacity:</span>
                  <span className="ml-1 text-gray-900">{proposal.expected_participants || 'TBA'} participants</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-xs text-gray-600">
                  <UsersIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Expected Members:</span>
                  <span className="ml-1 text-gray-900">{proposal.expected_members || 'TBA'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Category:</span>
                  <span className="ml-1 text-gray-900 capitalize">{proposal.club_type || 'TBA'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <SparklesIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                  <span className="font-medium">Leader:</span>
                  <span className="ml-1 text-gray-900 truncate" title={proposal.president_name || 'TBA'}>
                    {proposal.president_name || 'TBA'}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Rejection Reason */}
          {proposal.status === 'rejected' && proposal.review_comments && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-800 line-clamp-3" title={proposal.review_comments}>{proposal.review_comments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Returned for Revision */}
          {proposal.status === 'returned_for_revision' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-900 mb-1">Returned for Revision:</p>
                  {proposal.review_comments && (
                    <p className="text-sm text-orange-800 line-clamp-3" title={proposal.review_comments}>{proposal.review_comments}</p>
                  )}
                  <p className="text-xs text-orange-700 mt-1">Please revise and resubmit your proposal.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Needs Revision Alert */}
          {proposal.needs_revision && proposal.revision_notes && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-900 mb-1">Revision Required:</p>
                  <p className="text-sm text-yellow-800 line-clamp-3" title={proposal.revision_notes}>{proposal.revision_notes}</p>
                  <p className="text-xs text-yellow-700 mt-2">Please revise and resubmit your proposal.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Review Comments */}
          {proposal.review_comments && !proposal.needs_revision && proposal.status !== 'rejected' && proposal.status !== 'returned_for_revision' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1">Review Comments:</p>
              <p className="text-sm text-blue-800 line-clamp-3" title={proposal.review_comments}>{proposal.review_comments}</p>
            </div>
          )}
        </div>
        
        {/* Actions & Submission Date */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="flex gap-2 min-h-[38px] items-center">
            {proposal.status === 'published' && (
              <button
                onClick={handleViewPublished}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm hover:shadow text-xs font-semibold whitespace-nowrap"
              >
                <EyeIcon className="w-3.5 h-3.5 shrink-0" />
                {isOrganizer 
                  ? `View My ${proposal.type === 'event' ? 'Events' : 'Clubs'}` 
                  : proposal.type === 'club' 
                    ? 'View My Clubs' 
                    : 'View Events'
                }
                <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
            {proposal.needs_revision && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-xs font-semibold whitespace-nowrap"
              >
                <PencilIcon className="w-3.5 h-3.5 shrink-0" />
                Revise & Resubmit
              </button>
            )}
            {(proposal.status === 'rejected' || proposal.status === 'returned_for_revision') && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditModal(true) }}
                  disabled={resubmitMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-[11px] font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  <PencilIcon className="w-3.5 h-3.5 shrink-0" />
                  Revise & Submit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteProposalMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-[11px] font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  <TrashIcon className="w-3.5 h-3.5 shrink-0" />
                  Remove
                </button>
              </>
            )}
            {(proposal.status === 'pending_review' || proposal.needs_revision) && (
              <button
                onClick={handleDelete}
                disabled={deleteProposalMutation.isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                <TrashIcon className="w-3.5 h-3.5 shrink-0" />
                Delete
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span>Submitted {new Date(proposal.submitted_date).toLocaleDateString()}</span>
            {proposal.updated_at && proposal.updated_at !== proposal.submitted_date && (
              <span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Revise & Resubmit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Revise & Resubmit {proposal.type === 'event' ? 'Event' : 'Club'} Proposal</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Update your proposal based on admin feedback</p>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRevisionSubmit} className="p-6 space-y-5">
                {/* Admin rejection reason */}
                {proposal.review_comments && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-1">Admin Rejection Reason:</p>
                    <p className="text-sm text-red-700">{proposal.review_comments}</p>
                  </div>
                )}

                {/* Previous attachment link */}
                {proposal.attachment && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
                    <DocumentTextIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-blue-800 font-medium">Previously uploaded:</span>
                    <a href={proposal.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                      View file
                    </a>
                  </div>
                )}

                {proposal.type === 'event' ? (
                  <>
                    {/* Basic Information */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-indigo-900 mb-3">Event Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title *</label>
                          <input type="text" name="title" value={reviseForm.title} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type *</label>
                          <select name="eventType" value={reviseForm.eventType} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="academic">Academic</option>
                            <option value="cultural">Cultural</option>
                            <option value="sports">Sports</option>
                            <option value="social">Social</option>
                            <option value="workshop">Workshop</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date *</label>
                          <input type="date" name="eventDate" value={reviseForm.eventDate} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time *</label>
                          <input type="time" name="time" value={reviseForm.time} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Max Attendees *</label>
                          <input type="number" name="capacity" value={reviseForm.capacity} onChange={handleReviseInput} required min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-3">Location & Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Venue/Location *</label>
                          <input type="text" name="venue" value={reviseForm.venue} onChange={handleReviseInput} required
                            placeholder="e.g. Main Auditorium"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Province/City *</label>
                          <input type="text" name="province" value={reviseForm.province} onChange={handleReviseInput} required
                            placeholder="e.g. Phnom Penh"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Organizer Email *</label>
                          <input type="email" name="organizerEmail" value={reviseForm.organizerEmail} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Organizer Phone *</label>
                          <input type="tel" name="phoneNumber" value={reviseForm.phoneNumber} onChange={handleReviseInput} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Ticket & Budget Information */}
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-green-900 mb-3">Admission & Budget</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Ticket Price (USD) *</label>
                          <input type="number" name="price" value={reviseForm.price} onChange={handleReviseInput} required min="0" step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Total Budget (USD) *</label>
                          <input type="number" name="total_budget" value={reviseForm.total_budget} onChange={handleReviseInput} required min="0" step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Description & Details */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Event Description *</label>
                      <textarea name="description" value={reviseForm.description} onChange={handleReviseInput} required rows="4"
                        placeholder="Describe your event, its purpose, and what attendees can expect..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements / Special Notes</label>
                      <textarea name="requirements" value={reviseForm.requirements} onChange={handleReviseInput} rows="3"
                        placeholder="Any special requirements, prerequisites, or additional information..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Agenda / Schedule</label>
                      <textarea name="agenda" value={reviseForm.agenda} onChange={handleReviseInput} rows="3"
                        placeholder="Outline the event schedule and key activities..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Club Name *</label>
                        <input type="text" name="name" value={reviseForm.name} onChange={handleReviseInput} required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Club Type *</label>
                        <select name="club_type" value={reviseForm.club_type} onChange={handleReviseInput} required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Select type</option>
                          <option value="academic">Academic</option>
                          <option value="arts">Arts & Culture</option>
                          <option value="sports">Sports</option>
                          <option value="technical">Technology</option>
                          <option value="social">Social Service</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Advisor Name</label>
                        <input type="text" name="advisor_name" value={reviseForm.advisor_name} onChange={handleReviseInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Advisor Email</label>
                        <input type="email" name="advisor_email" value={reviseForm.advisor_email} onChange={handleReviseInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">President / Leader Name *</label>
                        <input type="text" name="president_name" value={reviseForm.president_name} onChange={handleReviseInput} required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Members *</label>
                        <input type="number" name="expected_members" value={reviseForm.expected_members} onChange={handleReviseInput} required min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mission *</label>
                      <textarea name="mission" value={reviseForm.mission} onChange={handleReviseInput} required rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Department / Requirements</label>
                      <input type="text" name="requirements" value={reviseForm.requirements} onChange={handleReviseInput}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </>
                )}

                {/* File upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Upload Document <span className="font-normal text-gray-400 text-xs">(PDF, Word, image — optional)</span>
                  </label>
                  <input type="file" accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => setRevisionFile(e.target.files[0])}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-300 rounded-lg px-2 py-1" />
                  {revisionFile && (
                    <p className="mt-1 text-xs text-green-600">Selected: {revisionFile.name}</p>
                  )}
                </div>

                {/* Revision notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Revision Notes <span className="font-normal text-gray-400 text-xs">(briefly describe what you changed)</span>
                  </label>
                  <textarea rows="3" value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="e.g. Updated budget, changed venue, clarified mission..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 border-t border-gray-200">
                  <button type="submit" disabled={resubmitMutation.isLoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {resubmitMutation.isLoading
                      ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>
                      : 'Submit Revision'}
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


export default ProposalCard
