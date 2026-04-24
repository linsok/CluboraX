import React, { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  PhotoIcon,
  FireIcon,
  TrophyIcon,
  GiftIcon,
  StarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  UsersIcon,
  QrCodeIcon,
  TicketIcon,
  XMarkIcon,
  EyeIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  UserIcon,
  PlusIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  GlobeAltIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { getDashboardStats, getRecentActivities, getUserCourses, getMyEventRegistrations, getMyClubMemberships } from '../api/dashboard'
import { getUserAchievements, getUserCertificates } from '../api/courses'
import { getEventRegistrations } from '../api/events'
import { getClubMembers, updateMembershipStatus, leaveClub } from '../api/clubs'
import EnhancedEventDetailsModal from '../components/Modals/EnhancedEventDetailsModal'
import { 
  getEventProposals, 
  getClubProposals, 
  deleteEventProposal, 
  deleteClubProposal,
  createEventProposal,
  createClubProposal,
  resubmitClubProposal,
  resubmitEventProposal
} from '../api/proposals'
import { apiClient } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Utility function to format phone numbers
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // If it's a 10-digit number, format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  // If it's a 11-digit number (with leading 1), format as 1 (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  // Otherwise, return the original
  return phone
}

// Proposal Card Component with 5-Stage Approval Process
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {proposal.type === 'event' ? (
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
              ) : (
                <UsersIcon className="w-5 h-5 text-purple-600" />
              )}
              <span className="text-xs font-medium text-gray-500 uppercase">
                {proposal.type} Proposal
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {proposal.title || proposal.name}
            </h3>
          </div>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            {getStatusLabel(proposal.status)}
          </span>
        </div>
        
        {/* 5-Stage Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.num)
              return (
                <React.Fragment key={stage.num}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'current' ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' :
                      status === 'rejected' ? 'bg-red-500 text-white' :
                      status === 'returned' ? 'bg-orange-500 text-white ring-4 ring-orange-200' :
                      status === 'needs_revision' ? 'bg-yellow-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {status === 'completed' ? '✓' : stage.num}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1 text-center font-medium">
                      {stage.label}
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`h-1 flex-1 mx-1 rounded transition-all ${
                      getStageStatus(stage.num + 1) === 'completed' || getStageStatus(stage.num + 1) === 'current'
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {stages[currentStage - 1]?.desc}
          </p>
        </div>
        
        {/* Content */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {proposal.description || proposal.mission}
        </p>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          {proposal.type === 'event' ? (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {new Date(proposal.proposed_date).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {proposal.venue}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="w-4 h-4 mr-2" />
                {proposal.expected_participants} participants
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="w-4 h-4 mr-2" />
                Expected members: {proposal.expected_members}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Type: {proposal.club_type}
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
                <p className="text-sm text-red-800">{proposal.review_comments}</p>
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
                  <p className="text-sm text-orange-800">{proposal.review_comments}</p>
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
                <p className="text-sm text-yellow-800">{proposal.revision_notes}</p>
                <p className="text-xs text-yellow-700 mt-2">Please revise and resubmit your proposal.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Review Comments */}
        {proposal.review_comments && !proposal.needs_revision && proposal.status !== 'rejected' && proposal.status !== 'returned_for_revision' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Review Comments:</p>
            <p className="text-sm text-blue-800">{proposal.review_comments}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {proposal.status === 'published' && (
            <button
              onClick={handleViewPublished}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <EyeIcon className="w-4 h-4" />
              {isOrganizer 
                ? `View in My ${proposal.type === 'event' ? 'Events' : 'Clubs'}` 
                : proposal.type === 'club' 
                  ? 'View in My Clubs' 
                  : 'View in Events Page'
              }
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
          {proposal.needs_revision && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4" />
              Revise & Resubmit
            </button>
          )}
          {(proposal.status === 'rejected' || proposal.status === 'returned_for_revision') && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditModal(true) }}
                disabled={resubmitMutation.isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <PencilIcon className="w-4 h-4" />
                Revise & Submit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProposalMutation.isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </button>
            </>
          )}
          {(proposal.status === 'pending_review' || proposal.needs_revision) && (
            <button
              onClick={handleDelete}
              disabled={deleteProposalMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
        
        {/* Submission Date */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
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

// Club Proposal Modal Component
const ClubProposalModal = ({ onClose, queryClient, setActiveTab }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Academic',
    description: '',
    leaderName: '',
    capacity: 10,
    meetingTime: '',
    locationType: 'Physical Location',
    location: '',
    requirements: '',
    memberEmails: '',
    livingDescription: '',
    goals: '',
    instagram: '',
    linkedin: '',
    github: '',
    clubLogo: null
  })
  const [clubLogoPreview, setClubLogoPreview] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const closeModal = () => {
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.description || !formData.leaderName || !formData.meetingTime || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    if (Number(formData.capacity) < 5) {
      toast.error('Club capacity must be at least 5 members!')
      return
    }

    setIsSubmitting(true)
    try {
      // Map category to club_type for backend
      const clubTypeMap = {
        'Academic': 'academic',
        'Arts': 'arts',
        'Sports': 'sports',
        'Cultural': 'cultural',
        'Technical': 'technical'
      }

      // Build the payload with ALL fields that were collected
      const payload = {
        name: formData.name,
        club_type: clubTypeMap[formData.category] || 'academic',
        description: formData.description + (formData.livingDescription ? `\n\nDetailed Description: ${formData.livingDescription}` : ''),
        objectives: formData.goals || `This club aims to bring together students interested in ${formData.category} activities.`,
        activities: formData.additionalNotes || '',
        mission: formData.mission || '',
        president_name: formData.leaderName || '',
        president_email: formData.presidentEmail || formData.leaderEmail || '',
        president_phone: formData.presidentPhone || formatPhoneNumber(formData.leaderPhoneNumber) || '',
        president_gender: formData.presidentGender || '',
        advisor_name: formData.advisorName || '',
        advisor_email: formData.advisorEmail || '',
        advisor_phone: formData.advisorPhone || '',
        expected_members: Number(formData.capacity) || 0,
        requirements: formData.requirements || 'Open to all interested students',
        meeting_time: formData.meetingTime || '',
        meeting_location: formData.location || '',
        instagram: formData.instagram || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        start_date: formData.startDate || new Date().toISOString().split('T')[0],
        end_date: formData.endDate || '',
      }

      // Add member emails if provided
      if (formData.memberEmails && Array.isArray(formData.memberEmails)) {
        payload.member_emails = formData.memberEmails
      } else if (formData.memberEmails) {
        // If it's a string, split by comma
        payload.member_emails = formData.memberEmails.split(',').map(email => email.trim())
      }

      // Add club logo if provided (as File object, not string)
      if (formData.clubLogo && formData.clubLogo instanceof File) {
        payload.club_logo = formData.clubLogo
      }

      await createClubProposal(payload)
      toast.success('Club proposal submitted successfully! Pending admin approval.')
      queryClient.invalidateQueries(['my-club-proposals'])
      setActiveTab('proposals')
      closeModal()
    } catch (error) {
      console.error('Club proposal error:', error)
      const errorMsg = error.response?.data?.name?.[0] || 
                       error.response?.data?.club_type?.[0] || 
                       error.response?.data?.detail || 
                       'Failed to submit club proposal'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create Club Proposal</h2>
              <p className="text-purple-100">Start your own student organization</p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Club Details Form */}
        <>
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter club name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          required
                        >
                          <option value="Academic">Academic</option>
                          <option value="Arts">Arts</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          placeholder="Brief description of your club"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leader Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="leaderName"
                          value={formData.leaderName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter leader's full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Capacity <span className="text-red-500">*</span> (Minimum 5)
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          min="5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Meeting Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="meetingTime"
                          value={formData.meetingTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="e.g., Every Wednesday at 6:00 PM"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="locationType"
                          value={formData.locationType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all mb-3"
                        >
                          <option value="Physical Location">Physical Location</option>
                          <option value="Virtual">Virtual</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="e.g., Tech Building, Room 301"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requirements
                        </label>
                        <textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          placeholder="Any requirements for joining the club"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Members by Email (Student Accounts)
                    </label>
                    <textarea
                      name="memberEmails"
                      value={formData.memberEmails}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Enter email addresses separated by commas (student@campusedu.edu, student2@campusedu.edu)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Add multiple member email addresses to invite them to join your club</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Living Description
                    </label>
                    <textarea
                      name="livingDescription"
                      value={formData.livingDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Detailed description of your club's mission and activities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goals & Objectives
                    </label>
                    <textarea
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="What do you want to achieve with this club?"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4">Social Media (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="@clubname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Club Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="club-username"
                    />
                  </div>
                </div>
              </div>

              {/* Club Logo / Profile Image Upload */}
              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-4 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Club Logo / Profile Image
                </h3>
                <p className="text-sm text-gray-600 mb-3">Upload a logo or profile image for your club (recommended: 500x500px)</p>
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-white/50 hover:border-pink-400 hover:bg-pink-100/50 cursor-pointer transition-all">
                  {formData.clubLogo && clubLogoPreview ? (
                    <div className="space-y-3">
                      <img src={clubLogoPreview} alt="Club logo preview" className="w-full h-48 object-cover rounded-lg" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="w-8 h-8 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formData.clubLogo.name}</p>
                            <p className="text-xs text-gray-500">{(formData.clubLogo.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setFormData({...formData, clubLogo: null})
                            setClubLogoPreview(null)
                          }} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                      <label htmlFor="club-logo-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">Click to upload image</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF - max 5MB</p>
                        <input 
                          id="club-logo-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be less than 5MB')
                                return
                              }
                              setFormData({...formData, clubLogo: file})
                              // Create data URL preview
                              const reader = new FileReader()
                              reader.onload = (e) => setClubLogoPreview(e.target.result)
                              reader.readAsDataURL(file)
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end">
                <div className="flex items-center space-x-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit for Approval'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
      </motion.div>
    </motion.div>
  )
}

// ── Section 7: Create Event Modal (module-level, React.memo — prevents flicker) ──
const CreateEventModal = React.memo(({
  eventForm, handleFormChange, handlePdfUpload, removePdf,
  calculatePlatformFee, setEventForm, setShowCreateEventModal, user
}) => {
  const queryClient = useQueryClient()

  // Local multi-step state
  const [createEventStep, setCreateEventStep] = React.useState('form')
  const [aiEvalProgress, setAiEvalProgress] = React.useState(0)
  const [aiEvalDone, setAiEvalDone] = React.useState(false)
  const [paymentProof, setPaymentProof] = React.useState(null)

  const isPaidEvent = Number(eventForm.price) > 0
  const platformFee = calculatePlatformFee()
  const totalRevenue = Number(eventForm.price) * Number(eventForm.maxAttendees)

  // Progress bar steps — 4 steps: form, payment, AI eval, submit
  const STEPS = isPaidEvent ? ['Event Details', 'Payment', 'AI Evaluation', 'Submit'] : ['Event Details', 'AI Evaluation', 'Submit']
  const stepIndex = isPaidEvent ? { form: 0, payment: 1, ai_eval: 2, submitted: 3 } : { form: 0, ai_eval: 1, submitted: 2 }
  const currentStepIdx = stepIndex[createEventStep] ?? 0

  const closeCreateEventModal = React.useCallback(() => {
    setShowCreateEventModal(false)
    setCreateEventStep('form')
    setAiEvalProgress(0)
    setAiEvalDone(false)
    setPaymentProof(null)
  }, [setShowCreateEventModal])

  const triggerAiEval = React.useCallback(() => {
    setAiEvalProgress(0)
    setAiEvalDone(false)
    let count = 0
    const iv = setInterval(() => {
      count += 1
      setAiEvalProgress(count)
      if (count >= 4) { clearInterval(iv); setAiEvalDone(true) }
    }, 700)
  }, [])

  const handleCreateEvent = React.useCallback(() => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location || !eventForm.maxAttendees || !eventForm.phoneNumber) {
      toast.error('Please fill in all required fields')
      return
    }
    // If paid event, go to payment step first, otherwise go to AI eval
    if (isPaidEvent) {
      setCreateEventStep('payment')
    } else {
      setCreateEventStep('ai_eval')
      triggerAiEval()
    }
  }, [eventForm, triggerAiEval, isPaidEvent])

  const handlePaymentProofUpload = React.useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (image only)
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setPaymentProof(file)
      toast.success('Payment proof uploaded')
    }
  }, [])

  const removePaymentProof = React.useCallback(() => {
    setPaymentProof(null)
  }, [])

  const handleProceedToAiEval = React.useCallback(() => {
    if (!paymentProof) {
      toast.error('Please upload payment proof to continue')
      return
    }
    setCreateEventStep('ai_eval')
    triggerAiEval()
  }, [paymentProof, triggerAiEval])

  const handleSubmitEventProposal = React.useCallback(async () => {
    const fee = calculatePlatformFee()
    
    // Map frontend form fields to backend EventProposal model fields
    const proposalData = {
      title: eventForm.title,
      eventTitle: eventForm.title,
      description: eventForm.description || '',
      event_type: eventForm.eventType || 'academic',
      eventType: eventForm.eventType || 'academic',
      eventDate: eventForm.date, // Single day event
      event_time: eventForm.time || '',
      eventTime: eventForm.time || '',
      eventDurationDays: 1, // Default to single day
      venue: eventForm.location,
      specificLocation: eventForm.location,
      capacity: parseInt(eventForm.maxAttendees) || 0,
      expected_participants: parseInt(eventForm.maxAttendees) || 0,
      ticketPrice: parseFloat(eventForm.price) || 0,
      budget: parseFloat(eventForm.price) || 0,
      organizerName: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Unknown',
      organizerEmail: user?.email || '',
      organizerPhone: eventForm.phoneNumber || '',
      agenda_description: eventForm.agenda || '',
      agenda: eventForm.agenda || '',
      special_requirements: eventForm.requirements || '',
      requirements: eventForm.requirements || '',
      status: 'pending_review',
    }
    
    try {
      await createEventProposal(proposalData)
      toast.success('Event proposal submitted! Pending admin approval.')
      queryClient.invalidateQueries(['my-event-proposals'])
      queryClient.invalidateQueries(['events'])
    } catch (error) {
      console.error('Failed to submit proposal:', error)
      toast.error('Failed to submit event proposal. Please try again.')
      return // Don't proceed to submitted step if it failed
    }
    setCreateEventStep('submitted')
    setEventForm({
      title: '', date: '', time: '', agenda: '', agendaPdf: null,
      location: '', eventType: 'academic', maxAttendees: '', phoneNumber: '',
      price: 0, description: '', organizer: user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user?.name || 'Event Organizer',
      requirements: '', tags: []
    })
  }, [eventForm, calculatePlatformFee, setEventForm, user, queryClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeCreateEventModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create Event Proposal</h2>
              <p className="text-purple-100">Section 7 · Organizer Proposal Flow</p>
            </div>
            <button onClick={closeCreateEventModal} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStepIdx ? 'bg-green-400 text-white' : i === currentStepIdx ? 'bg-white text-purple-700' : 'bg-white/20 text-white/60'}`}>
                    {i < currentStepIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${i === currentStepIdx ? 'text-white font-semibold' : 'text-white/60'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStepIdx ? 'bg-green-400' : 'bg-white/20'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ STEP 1 — Event Details Form ══ */}
        {createEventStep === 'form' && (
          <>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
                        <input type="text" name="title" value={eventForm.title} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Enter event title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type <span className="text-red-500">*</span></label>
                        <select name="eventType" value={eventForm.eventType} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
                          <option value="academic">Academic</option>
                          <option value="sports">Sports</option>
                          <option value="cultural">Cultural</option>
                          <option value="social">Social</option>
                          <option value="workshop">Workshop</option>
                          <option value="conference">Conference</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={eventForm.description} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe your event" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4">Date &amp; Time</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="date" value={eventForm.date} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                        <input type="time" name="time" value={eventForm.time} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-4">Location &amp; Capacity</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                        <input type="text" name="location" value={eventForm.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Event location" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees <span className="text-red-500">*</span></label>
                        <input type="number" name="maxAttendees" value={eventForm.maxAttendees} onChange={handleFormChange} min="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="Maximum attendees" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone <span className="text-red-500">*</span></label>
                        <input type="tel" name="phoneNumber" value={eventForm.phoneNumber} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="+855 12 345 678" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-4">Pricing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                        <input type="number" name="price" value={eventForm.price} onChange={handleFormChange} min="0" step="0.01" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" placeholder="0 for free event" />
                      </div>
                      {eventForm.price > 0 && eventForm.maxAttendees > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-yellow-200 text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-gray-600">Ticket Price:</span><span className="font-medium">${Number(eventForm.price).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Max Attendees:</span><span className="font-medium">{eventForm.maxAttendees}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Total Revenue:</span><span className="font-medium">${totalRevenue.toFixed(2)}</span></div>
                          <div className="flex justify-between font-semibold text-red-600"><span>Platform Fee (3%):</span><span>${platformFee.toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-4">Event Agenda</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agenda Description</label>
                    <textarea name="agenda" value={eventForm.agenda} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Describe the agenda, schedule and activities..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Agenda PDF (Optional)</label>
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-white/50 hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer transition-all">
                      {eventForm.agendaPdf ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{eventForm.agendaPdf.name}</p>
                              <p className="text-xs text-gray-500">{(eventForm.agendaPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" onClick={removePdf} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <DocumentTextIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                          <label htmlFor="agenda-pdf-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">Click to upload PDF</span>
                            <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                            <input id="agenda-pdf-upload" type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} className="hidden" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-4">Requirements</h3>
                <textarea name="requirements" value={eventForm.requirements} onChange={handleFormChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" placeholder="Any special requirements for attendees..." />
              </div>
              
              {/* Event Poster/Profile Image Upload */}
              <div className="mt-6 bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-4 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Event Poster / Profile Image
                </h3>
                <p className="text-sm text-gray-600 mb-3">Upload a poster or profile image for your event (recommended: 1200x800px)</p>
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-white/50 hover:border-pink-400 hover:bg-pink-100/50 cursor-pointer transition-all">
                  {eventForm.posterImage && eventPosterPreview ? (
                    <div className="space-y-3">
                      <img src={eventPosterPreview} alt="Event poster preview" className="w-full h-48 object-cover rounded-lg" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="w-8 h-8 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{eventForm.posterImage.name}</p>
                            <p className="text-xs text-gray-500">{(eventForm.posterImage.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEventForm({...eventForm, posterImage: null})
                            setEventPosterPreview(null)
                          }} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                      <label htmlFor="event-poster-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">Click to upload image</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF - max 5MB</p>
                        <input 
                          id="event-poster-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be less than 5MB')
                                return
                              }
                              setEventForm({...eventForm, posterImage: file})
                              // Create data URL preview
                              const reader = new FileReader()
                              reader.onload = (e) => setEventPosterPreview(e.target.result)
                              reader.readAsDataURL(file)
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-red-600 font-medium">{platformFee > 0 ? `Platform fee: $${platformFee.toFixed(2)}` : <span className="text-green-600">Free event — no platform fee</span>}</span>
              <div className="flex items-center space-x-4">
                <button onClick={closeCreateEventModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                <button onClick={handleCreateEvent} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all flex items-center gap-2">
                  {isPaidEvent ? 'Next: Payment →' : 'Next: AI Evaluation →'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ STEP 2 — Payment (Paid Events Only) ══ */}
        {createEventStep === 'payment' && isPaidEvent && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Fee Payment Required</h3>
                <p className="text-gray-600">Your event has a ticket price, so a platform fee is required before submission</p>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Fee Calculation Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Ticket Price:</span>
                    <span className="text-lg font-bold text-gray-900">${Number(eventForm.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Max Attendees:</span>
                    <span className="text-lg font-bold text-gray-900">{eventForm.maxAttendees}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-700 font-medium">Total Revenue:</span>
                    <span className="text-lg font-bold text-green-600">${totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4">
                    <span className="text-gray-900 font-bold text-lg">Platform Fee (3%):</span>
                    <span className="text-2xl font-bold text-red-600">${platformFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How to Pay Platform Fee
                </h4>
                <ol className="space-y-2 text-sm text-blue-900">
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[20px]">1.</span>
                    <span>Transfer <strong className="text-red-600">${platformFee.toFixed(2)}</strong> to our payment account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[20px]">2.</span>
                    <span>Take a screenshot or photo of your payment confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[20px]">3.</span>
                    <span>Upload the payment proof below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold min-w-[20px]">4.</span>
                    <span>Click "Continue to AI Evaluation" to proceed</span>
                  </li>
                </ol>
              </div>

              {/* Payment Proof Upload */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Upload Payment Proof <span className="text-red-500">*</span>
                </label>
                {paymentProof ? (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{paymentProof.name}</p>
                          <p className="text-sm text-gray-500">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removePaymentProof}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label htmlFor="payment-proof-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-purple-600 hover:text-purple-700">Click to upload payment proof</span>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                      <input
                        id="payment-proof-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="max-w-2xl mx-auto mt-6 flex items-center justify-between">
              <button
                onClick={() => setCreateEventStep('form')}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all"
              >
                ← Back to Form
              </button>
              <button
                onClick={handleProceedToAiEval}
                disabled={!paymentProof}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to AI Evaluation →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3/4 — AI Evaluation ══ */}
        {createEventStep === 'ai_eval' && (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SparklesIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI Evaluation</h3>
                <p className="text-sm text-gray-500 mt-1">Running automated checks on your event proposal...</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
                {[
                  { label: 'Event Name Uniqueness Check', desc: 'Checking for duplicate event names in the system' },
                  { label: 'Rule Violation Scan', desc: 'Scanning for policy and campus rule violations' },
                  { label: 'Document Validation', desc: 'Validating agenda PDF and uploaded documents' },
                  { label: 'Policy Compliance Check', desc: 'Verifying event complies with university guidelines' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500 ${i < aiEvalProgress ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {i < aiEvalProgress
                        ? <span className="text-green-600 text-xs font-bold">✓</span>
                        : i === aiEvalProgress
                          ? <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                          : <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors ${i < aiEvalProgress ? 'text-green-700' : i === aiEvalProgress ? 'text-indigo-700' : 'text-gray-400'}`}>{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {aiEvalDone ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center text-sm text-green-700 font-medium">
                    All checks passed — your event is ready for submission!
                  </div>
                  <button onClick={handleSubmitEventProposal} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold transition-all text-lg">
                    Submit Event Proposal
                  </button>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    AI evaluation in progress...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Submitted ══ */}
        {createEventStep === 'submitted' && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-purple-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Proposal Submitted!</h3>
              <p className="text-gray-500 text-sm">Your event proposal is now <span className="font-semibold text-amber-600">Pending Admin Approval</span>. Three things are now happening simultaneously:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardDocumentListIcon className="w-5 h-5 text-amber-700" /></div>
                <h4 className="font-bold text-amber-800 mb-2">A) Admin Review</h4>
                <p className="text-xs text-amber-700">Your event proposal has been queued for admin review. Once approved, it will be published on the calendar.</p>
                <div className="mt-3 px-3 py-1 bg-amber-200 rounded-full text-xs font-semibold text-amber-800 inline-block">Pending Approval</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mx-auto mb-3"><SparklesIcon className="w-5 h-5 text-indigo-700" /></div>
                <h4 className="font-bold text-indigo-800 mb-2">B) AI Payment Verification</h4>
                <p className="text-xs text-indigo-700">AI is scanning submitted receipts for duplicate payments, edited images, and amount discrepancies.</p>
                <div className="mt-3 px-3 py-1 bg-indigo-200 rounded-full text-xs font-semibold text-indigo-800 inline-block">Running</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3"><UserGroupIcon className="w-5 h-5 text-purple-700" /></div>
                <h4 className="font-bold text-purple-800 mb-2">C) Stage 1 Admin Queue</h4>
                <p className="text-xs text-purple-700">Admin will check form completeness, safety, policy compliance, and conflict of schedule before final approval.</p>
                <div className="mt-3 px-3 py-1 bg-purple-200 rounded-full text-xs font-semibold text-purple-800 inline-block">Queued</div>
              </motion.div>
            </div>
            <div className="text-center">
              <button onClick={closeCreateEventModal} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all">
                View My Events →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
})
CreateEventModal.displayName = 'CreateEventModal'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [highlightedCardId, setHighlightedCardId] = useState(null)
  
  // Debug: Log current user
  console.log('👤 Current User:', user?.email, '| Role:', user?.role, '| ID:', user?.id)
  const isOrganizer = user?.role === 'organizer'
  
  // Handle URL tab parameter and highlight parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    const highlightParam = params.get('highlight')
    
    if (tabParam && (tabParam === 'overview' || tabParam === 'my-clubs' || tabParam === 'my-clubs-events' || tabParam === 'my-organized' || tabParam === 'my-events' || tabParam === 'proposals')) {
      setActiveTab(tabParam)
    }
    
    if (highlightParam) {
      setHighlightedCardId(highlightParam)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedCardId(null), 3000)
    }
  }, [location.search])
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showClubDetailModal, setShowClubDetailModal] = useState(false)
  const [selectedClubRequest, setSelectedClubRequest] = useState(null)
  const [showEventDetailModal, setShowEventDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false)
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null)
  const [showClubMembersModal, setShowClubMembersModal] = useState(false)
  const [selectedClubForMembers, setSelectedClubForMembers] = useState(null)
  const [showOrganizerClubDetailModal, setShowOrganizerClubDetailModal] = useState(false)
  const [selectedOrganizerClub, setSelectedOrganizerClub] = useState(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)
  const [selectedEventForImage, setSelectedEventForImage] = useState(null)
  const [imagePreview, setImagePreview] = useState([])
  const [selectedFile, setSelectedFile] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [imgAiStep, setImgAiStep] = useState('idle') // 'idle' | 'scanning' | 'passed' | 'rejected'
  const [imgAiChecks, setImgAiChecks] = useState([])
  const [studentContentType, setStudentContentType] = useState('events') // 'events' or 'clubs' for students
  const [studentOrganizedType, setStudentOrganizedType] = useState('events') // 'events' or 'clubs' for student organized content
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedCancelItem, setSelectedCancelItem] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelType, setCancelType] = useState('') // 'event' or 'club'
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showEditClubModal, setShowEditClubModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingClub, setEditingClub] = useState(null)
  const [showClubProposalModal, setShowClubProposalModal] = useState(false)
  
  // Proposals tab state - read from URL parameter
  const [proposalTab, setProposalTab] = useState('all') // 'all', 'pending', 'approved', 'rejected'
  const queryClient = useQueryClient()
  
  // Handle URL proposal tab parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const proposalTabParam = params.get('proposalTab')
    
    if (proposalTabParam && ['all', 'pending', 'approved', 'published', 'rejected'].includes(proposalTabParam)) {
      setProposalTab(proposalTabParam)
    }
  }, [location.search])
  
  // State for event creation form
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    agendaPdf: null,
    posterImage: null,
    location: '',
    eventType: 'academic',
    maxAttendees: '',
    phoneNumber: '',
    price: 0,
    description: '',
    organizer: user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.name || 'Event Organizer',
    requirements: '',
    tags: []
  })
  const [eventPosterPreview, setEventPosterPreview] = useState(null)
  
  // Fetch real event registrations and club memberships
  const { data: myEventRegistrations = [], isLoading: loadingEventRegs } = useQuery({
    queryKey: ['my-event-registrations', user?.id],
    queryFn: getMyEventRegistrations,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })

  const { data: myClubRequests = [], isLoading: loadingClubMemberships } = useQuery({
    queryKey: ['my-club-memberships', user?.id],
    queryFn: getMyClubMemberships,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  })
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      if (!user) return null
      return await getDashboardStats(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: recentActivities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: getRecentActivities,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      console.error('Failed to fetch recent activities:', error)
      toast.error('Failed to load recent activities')
    }
  })

  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['user-courses', user?.role],
    queryFn: async () => {
      if (!user) return []
      return await getUserCourses(user)
    },
    enabled: !!user,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  })

  const { data: achievements, isLoading: achievementsLoading, error: achievementsError } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return []
      return await getUserAchievements(user)
    },
    enabled: !!user,
    retry: false, // Don't retry - endpoint may not exist yet
    staleTime: 15 * 60 * 1000,
  })

  const { data: certificates, isLoading: certificatesLoading, error: certificatesError } = useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user) return []
      return await getUserCertificates(user)
    },
    enabled: !!user,
    retry: false, // Don't retry - endpoint may not exist yet
    staleTime: 15 * 60 * 1000,
  })

  // Fetch event proposals
  const { data: eventProposals = [], isLoading: loadingEventProposals, error: eventProposalsError } = useQuery({
    queryKey: ['my-event-proposals'],
    queryFn: async () => {
      const data = await getEventProposals()
      // Handle paginated response format
      const proposals = data?.results || data
      return Array.isArray(proposals) ? proposals : []
    },
    retry: 1,
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
    onError: (error) => {
      console.error('Failed to fetch event proposals:', error)
    }
  })
  
  // Fetch club proposals
  const { data: clubProposals = [], isLoading: loadingClubProposals, error: clubProposalsError } = useQuery({
    queryKey: ['my-club-proposals'],
    queryFn: async () => {
      console.log('🔍 Fetching club proposals for user:', user?.email)
      const data = await getClubProposals()
      console.log('📊 Club proposals received:', data)
      // Handle paginated response format
      const proposals = data?.results || data
      return Array.isArray(proposals) ? proposals : []
    },
    retry: 1,
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
    onError: (error) => {
      console.error('❌ Failed to fetch club proposals:', error)
    }
  })
  
  // Ensure arrays (handle cases where API returns non-array data)
  const safeEventProposals = Array.isArray(eventProposals) ? eventProposals : []
  const safeClubProposals = Array.isArray(clubProposals) ? clubProposals : []
  
  // Debug logging
  console.log('📋 Safe Event Proposals:', safeEventProposals.length, safeEventProposals)
  console.log('📋 Safe Club Proposals:', safeClubProposals.length, safeClubProposals)
  
  // Filter published content (approved proposals that are now live)
  const publishedEvents = safeEventProposals.filter(p => p.status === 'published')
  const publishedClubs = safeClubProposals.filter(p => p.status === 'published')
  const hasPublishedContent = publishedEvents.length > 0 || publishedClubs.length > 0
  
  // Combine all proposals
  const allProposals = [
    ...safeEventProposals.map(p => ({ ...p, type: 'event' })),
    ...safeClubProposals.map(p => ({ ...p, type: 'club' }))
  ]
  
  console.log('🎯 All Proposals Combined:', allProposals.length, allProposals)
  
  // Filter proposals based on active tab
  // Map student-friendly tab IDs to actual backend status values
  const filteredProposals = proposalTab === 'all' 
    ? allProposals 
    : proposalTab === 'pending'
    ? allProposals.filter(p => p.status === 'pending_review' || p.status === 'returned_for_revision')
    : allProposals.filter(p => p.status === proposalTab)

  const isLoading = statsLoading || activitiesLoading || coursesLoading || achievementsLoading || certificatesLoading

  // Since we're handling errors gracefully with fallback data, we don't need to log them
  // The console.warn messages in the query functions provide sufficient debugging info

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => {
    // Safety checks for value
    const safeValue = value !== undefined && value !== null ? value : 0
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 overflow-hidden group"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${color} shadow-md group-hover:shadow-lg transition-all duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                {trendValue}
              </div>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </motion.div>
    )
  }

  const CourseCard = ({ course, index }) => {
    // Safety checks for course properties
    const safeCourse = {
      category: course?.category || 'General',
      level: course?.level || 'Beginner',
      title: course?.title || 'Untitled Course',
      instructor: course?.instructor || 'Unknown Instructor',
      progress: course?.progress || 0,
      completedLessons: course?.completedLessons || 0,
      totalLessons: course?.totalLessons || 1,
      duration: course?.duration || 'Unknown duration'
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden group cursor-pointer"
      >
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpenIcon className="w-16 h-16 text-white opacity-50" />
          </div>
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {safeCourse.category}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {safeCourse.level}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{safeCourse.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{safeCourse.instructor}</p>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">{safeCourse.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${safeCourse.progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{safeCourse.completedLessons}/{safeCourse.totalLessons} lessons</span>
            <span>{safeCourse.duration}</span>
          </div>
        </div>
      </motion.div>
    )
  }

  const ActivityItem = ({ activity }) => {
    // Map icon string to actual icon component
    const getIcon = (iconName) => {
      switch (iconName) {
        case 'CalendarIcon':
          return CalendarIcon
        case 'UserGroupIcon':
          return UserGroupIcon
        case 'UsersIcon':
          return UsersIcon
        default:
          return CalendarIcon
      }
    }

    const Icon = getIcon(activity?.icon || 'CalendarIcon')
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 5 }}
        transition={{ duration: 0.3 }}
        className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 group"
      >
        <div className="relative">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity?.message || 'No message'}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{activity?.user || 'Unknown'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity?.time || 'Just now'}</span>
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    )
  }

  // Helper functions
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid date'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'published':
        return 'bg-emerald-100 text-emerald-800'
      case 'needs_revision':
      case 'returned_for_revision':
        return 'bg-orange-100 text-orange-800'
      case 'returned':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get user-friendly status label for student view
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_review':
        return 'Pending'
      case 'returned_for_revision':
        return 'Pending' // Show as Pending when student resubmits
      case 'approved':
        return 'Approved'
      case 'published':
        return 'Published'
      case 'rejected':
        return 'Rejected'
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'published':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'rejected':
        return <XCircleIcon className="w-5 h-5" />
      case 'pending':
      case 'pending_review':
      case 'returned_for_revision':
      case 'under_review':
        return <ClockIcon className="w-5 h-5" />
      case 'needs_revision':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'returned':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      default:
        return <ClockIcon className="w-5 h-5" />
    }
  }

  const viewTicket = (registration) => {
    setSelectedTicket(registration)
    setShowTicketModal(true)
  }

  const downloadTicket = (ticket) => {
    // Safety check for ticket data
    if (!ticket) {
      toast.error('No ticket data available')
      return
    }

    try {
      // Create a canvas element to generate the ticket
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size
      canvas.width = 400
      canvas.height = 600
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header background
      const gradient = ctx.createLinearGradient(0, 0, 0, 120)
      gradient.addColorStop(0, '#059669')
      gradient.addColorStop(1, '#10b981')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, 120)
      
      // Header text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Event Ticket', canvas.width / 2, 40)
      
      ctx.font = '18px Arial'
      ctx.fillText(ticket.eventName || 'Unknown Event', canvas.width / 2, 70)
      
      // Ticket ID
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.fillText(`Ticket ID: ${ticket.ticketId || 'Unknown'}`, canvas.width / 2, 100)
      
      // QR Code placeholder
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(50, 140, 120, 120)
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('QR Code', 110, 195)
      ctx.fillText((ticket.ticketId || 'Unknown').substring(0, 8) + '...', 110, 210)
      
      // Event details section
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Event Details', 200, 160)
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Event:', 200, 185)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventName || 'Unknown Event', 200, 205)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Date:', 200, 230)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventDate || 'Unknown Date', 200, 250)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Time:', 200, 275)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventTime || 'Unknown Time', 200, 295)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Location:', 200, 320)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.eventLocation || 'Unknown Location', 200, 340)
      
      // Attendee section
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Attendee Information', 50, 300)
      
      ctx.font = '14px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Name:', 50, 325)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.name || 'Unknown', 50, 345)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Email:', 50, 370)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.email || 'Unknown', 50, 390)
      
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Student ID:', 50, 415)
      ctx.fillStyle = '#1f2937'
      ctx.fillText(ticket.formData?.studentId || 'N/A', 50, 435)
      
      // Price
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(ticket.eventPrice > 0 ? `$${ticket.eventPrice}` : 'Free', canvas.width / 2, 480)
      
      // Footer
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial'
      ctx.fillText('Generated on ' + new Date().toLocaleDateString(), canvas.width / 2, 520)
      ctx.fillText('CluboraX - Campus Event Management', canvas.width / 2, 540)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ticket-${ticket.ticketId || 'unknown'}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success('Ticket downloaded successfully!')
      }, 'image/png')
    } catch (error) {
      console.error('Error generating ticket:', error)
      toast.error('Failed to generate ticket')
    }
  }

  const viewClubDetails = (request) => {
    setSelectedClubRequest(request)
    setShowClubDetailModal(true)
  }

  const viewEvent = (registration) => {
    // Pass real registration data to modal - no hardcoding
    setSelectedEvent(registration)
    setShowEventDetailModal(true)
  }

  // Handler for viewing organizer event details
  const viewOrganizerEventDetails = (event) => {
    // If event is rejected, open edit modal
    if (event.status === 'rejected') {
      setEditingEvent(event)
      setShowEditEventModal(true)
      return
    }
    
    // Use real event data - no hardcoding
    setSelectedEvent(event)
    setShowEventDetailModal(true)
  }

  // Handler for viewing event registrations
  const viewEventRegistrations = (event) => {
    setSelectedEventForRegistrations(event)
    setShowRegistrationsModal(true)
  }

  // Handler for viewing club members
  const viewClubMembers = (club) => {
    setSelectedClubForMembers(club)
    setShowClubMembersModal(true)
  }

  // Handler for viewing organizer club details
  const viewOrganizerClubDetails = (club) => {
    // If club is rejected, open edit modal
    if (club.status === 'rejected') {
      setEditingClub(club)
      setShowEditClubModal(true)
      return
    }
    
    // Use real club data
    setSelectedOrganizerClub(club)
    setShowOrganizerClubDetailModal(true)
  }

  // Handler for opening image upload modal
  const openImageUploadModal = (event, e) => {
    if (e) e.stopPropagation()
    setSelectedEventForImage(event)
    setShowImageUploadModal(true)
  }

  // Handler for closing image upload modal
  const closeImageUploadModal = () => {
    setShowImageUploadModal(false)
    setSelectedEventForImage(null)
    setImagePreview([])
    setSelectedFile([])
    setAlbumName('')
    setImgAiStep('idle')
    setImgAiChecks([])
  }

  // Handler for viewing event payments
  const viewEventPayments = (event) => {
    const registrations = myEventRegistrations.filter(reg => reg.event_id === event.id || reg.id === event.id)
    setSelectedEventForRegistrations(event)
    setShowRegistrationsModal(true)
  }

  // Handler for exporting registrations to CSV
  const exportRegistrationsToCSV = (registrations, eventTitle) => {
    const headers = ['Name', 'Email', 'Phone', 'Student ID', 'Major', 'Year', 'Registered At', 'Status', 'Ticket ID']
    const csvData = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.studentId,
      reg.formData.major,
      reg.formData.year,
      formatDate(reg.registeredAt),
      reg.status,
      reg.ticketId
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${eventTitle}_registrations_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handler for exporting club members to CSV
  const exportClubMembersToCSV = (members, clubName) => {
    const headers = ['Name', 'Email', 'Phone', 'Student ID', 'Role', 'Joined At', 'Status']
    const csvData = members.map(member => [
      member.name,
      member.email,
      member.phone,
      member.studentId,
      member.role,
      formatDate(member.joinedAt),
      member.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${clubName}_members_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handler for image file selection (multiple files)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Each image must be less than 5MB`)
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return
      }
    }
    
    setSelectedFile(files)
    
    // Generate previews for all selected files
    const previews = []
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result)
        if (previews.length === files.length) {
          setImagePreview(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // AI scan then upload
  const handleImageAIScan = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }
    setImgAiStep('scanning')
    setImgAiChecks([])

    // Simulate progressive AI checks streaming in
    const checks = [
      { label: 'Inappropriate / Adult Content', delay: 600 },
      { label: 'Violence or Harmful Material', delay: 1100 },
      { label: 'Offensive Text or Symbols', delay: 1600 },
      { label: 'Image Relevance to Event', delay: 2200 },
      { label: 'Image Quality & Clarity', delay: 2700 },
    ]

    // Use file name/size as a deterministic seed so results are consistent per file
    const seed = (selectedFile.name.length + Math.floor(selectedFile.size / 1000)) % 10
    // Fail 1 in 5 times (seed 0 or 1) to demo the rejection flow
    const willFail = seed <= 1
    const failIndex = willFail ? (seed === 0 ? 3 : 0) : -1 // which check fails

    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 0 ? checks[0].delay : checks[i].delay - checks[i - 1].delay))
      const passed = !(willFail && i === failIndex)
      setImgAiChecks(prev => [
        ...prev,
        {
          label: checks[i].label,
          passed,
          detail: passed
            ? 'No issues detected'
            : i === 0 ? 'Explicit or adult content detected'
            : i === 3 ? 'Image does not appear related to the event topic'
            : 'Violation detected'
        }
      ])
    }

    await new Promise(resolve => setTimeout(resolve, 400))
    if (willFail) {
      setImgAiStep('rejected')
    } else {
      setImgAiStep('passed')
    }
  }

  const handleImageUpload = async () => {
    if (!selectedFile || selectedFile.length === 0) {
      toast.error('Please select at least one image')
      return
    }
    
    setUploadingImage(true)
    try {
      const item = selectedEventForImage
      
      // Prepare form data
      const formData = new FormData()
      
      // Determine if it's an event or club
      const isEvent = item.title && !item.name
      const isClub = item.name && !item.title
      
      // Set title and gallery type (don't link event/club IDs since these might be proposals)
      if (isEvent) {
        formData.append('title', `${item.title} - Gallery`)
        formData.append('gallery_type', 'event')
      } else if (isClub) {
        formData.append('title', `${item.name} - Gallery`)
        formData.append('gallery_type', 'club')
      } else {
        formData.append('title', `${item.title || item.name} - Gallery`)
        formData.append('gallery_type', 'general')
      }
      
      formData.append('description', item.description || '')
      formData.append('is_public', 'true')
      
      // Add album name (default to "Main Album" if not provided)
      formData.append('album_name', albumName || 'Main Album')
      
      // Append all selected images
      selectedFile.forEach(file => {
        formData.append('images', file)
      })
      
      // Upload to gallery
      await apiClient.post('/api/gallery/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success(`${selectedFile.length} image(s) added to gallery!`)
      queryClient.invalidateQueries(['gallery'])
      closeImageUploadModal()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to upload image'
      toast.error(errorMsg)
    } finally {
      setUploadingImage(false)
    }
  }

  // Handler for form input changes — useCallback prevents new reference on every render
  const handleFormChange = useCallback((e) => {
    const { name, value, type } = e.target
    setEventForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }, [])

  // Handler for PDF file upload — useCallback prevents new reference on every render
  const handlePdfUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setEventForm(prev => ({ ...prev, agendaPdf: file }))
    toast.success('PDF uploaded successfully')
  }, [])

  // Handler for removing PDF
  const removePdf = useCallback(() => {
    setEventForm(prev => ({
      ...prev,
      agendaPdf: null
    }))
    toast.success('PDF removed')
  }, [])

  // Calculate platform fee (3% of total potential revenue)
  const calculatePlatformFee = useCallback(() => {
    const totalRevenue = eventForm.price * eventForm.maxAttendees
    return eventForm.price > 0 ? totalRevenue * 0.03 : 0
  }, [eventForm.price, eventForm.maxAttendees])

  // Club Request Card Component
  const ClubRequestCard = ({ request }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={() => viewClubDetails(request)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.clubName}</h3>
          <p className="text-sm text-gray-500">{request.clubCategory}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="w-4 h-4 mr-2" />
          {request.formData.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <BuildingOfficeIcon className="w-4 h-4 mr-2" />
          {request.formData.studentId}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-2" />
          Submitted: {formatDate(request.submittedAt)}
        </div>
      </div>

      {request.formData.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{request.formData.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Year: {request.formData.year} • Major: {request.formData.major}
        </span>
      </div>
    </motion.div>
  )

  // Event Registration Card Component
  const EventRegistrationCard = ({ registration }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={() => viewEvent(registration)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{registration.eventName}</h3>
          <p className="text-sm text-gray-500">
            {registration.eventDate} at {registration.eventTime}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
          {registration.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {registration.eventLocation}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <TicketIcon className="w-4 h-4 mr-2" />
          Ticket ID: {registration.ticketId}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-2" />
          Registered: {formatDate(registration.registeredAt)}
        </div>
      </div>

      {registration.formData.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{registration.formData.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {registration.eventPrice > 0 ? `$${registration.eventPrice}` : 'Free'}
        </span>
      </div>
    </motion.div>
  )

  // Ticket Modal Component
  const TicketModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowTicketModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Event Ticket</h2>
              <p className="text-green-100">{selectedTicket?.eventName}</p>
            </div>
            <button
              onClick={() => setShowTicketModal(false)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCodeIcon className="w-16 h-16 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedTicket?.ticketId?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Ticket Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Ticket ID:</span>
                <span className="text-gray-900">{selectedTicket?.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Event:</span>
                <span className="text-gray-900">{selectedTicket?.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-900">{selectedTicket?.eventDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Time:</span>
                <span className="text-gray-900">{selectedTicket?.eventTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Location:</span>
                <span className="text-gray-900">{selectedTicket?.eventLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Attendee:</span>
                <span className="text-gray-900">{selectedTicket?.formData.name}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowTicketModal(false)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={() => downloadTicket(selectedTicket)}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
            >
              <TicketIcon className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  // Club Request Detail Modal
  const ClubRequestDetailModal = () => {
    const membershipDate = selectedClubRequest?.submittedAt ? new Date(selectedClubRequest.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowClubDetailModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
            <button
              onClick={() => setShowClubDetailModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-3xl font-bold mb-1">Club Membership Request</h2>
              <p className="text-purple-100 text-lg">{selectedClubRequest?.clubName}</p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedClubRequest?.status === 'approved' ? 'bg-green-500' : selectedClubRequest?.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-semibold text-gray-700">Status: {selectedClubRequest?.status?.toUpperCase()}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClubRequest?.status === 'approved' ? 'bg-green-100 text-green-700' : selectedClubRequest?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
              {selectedClubRequest?.status?.charAt(0).toUpperCase() + selectedClubRequest?.status?.slice(1)}
            </span>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Club Overview */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
              <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                About the Club
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Club Name</p>
                  <p className="text-gray-900 font-semibold text-base">{selectedClubRequest?.clubName}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900 font-semibold capitalize">{selectedClubRequest?.clubCategory}</p>
                </div>
              </div>
            </div>

            {/* Your Information */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Your Information
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">Full Name</p>
                    <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Student ID</p>
                    <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.studentId || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold text-sm truncate">{selectedClubRequest?.formData?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">Major</p>
                    <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.major || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Year</p>
                    <p className="text-gray-900 font-semibold">{selectedClubRequest?.formData?.year || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Message */}
            {selectedClubRequest?.formData?.message && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                  Your Message
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{selectedClubRequest?.formData?.message}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white" />
                    <div className="w-0.5 h-12 bg-purple-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Request Submitted</p>
                    <p className="text-sm text-gray-600">{membershipDate}</p>
                  </div>
                </div>
                {selectedClubRequest?.status === 'approved' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Request Approved</p>
                      <p className="text-sm text-gray-600">Welcome to the club! Your membership is now active.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowClubDetailModal(false)}
              className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Close
            </button>
            <button
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              Share Details
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Event Registrations Modal
  const RegistrationsModal = () => {
    const isPaidEvent = (selectedEventForRegistrations?.price || 0) > 0

    // Fetch real registrations from API, normalized to UI shape
    const { data: rawRegistrations = [], isLoading: loadingRegistrations } = useQuery({
      queryKey: ['event-registrations', selectedEventForRegistrations?.id],
      queryFn: () => getEventRegistrations(selectedEventForRegistrations.id),
      enabled: !!selectedEventForRegistrations?.id,
      staleTime: 60 * 1000,
    })

    const normalizeRegistration = (reg) => ({
      id: reg.id,
      name: reg.user?.full_name || reg.user?.first_name || reg.user?.email || 'Unknown',
      email: reg.user?.email || '',
      studentId: reg.user?.student_id || 'N/A',
      phone: reg.user?.phone || 'N/A',
      registeredAt: reg.registration_date || reg.created_at,
      status: reg.status,
      ticketId: reg.qr_code || String(reg.id),
      payment: {
        status: reg.payment_status || 'n/a',
        amount: parseFloat(reg.event_price) || selectedEventForRegistrations?.price || 0,
        paidAt: reg.registration_date,
        method: 'KHQR',
        transactionId: String(reg.id),
        proofType: reg.payment_receipt ? (String(reg.payment_receipt).endsWith('.pdf') ? 'pdf' : 'image') : null,
        receiptUrl: reg.payment_receipt_url || null,
      },
      formData: {
        name: reg.user?.full_name || '',
        email: reg.user?.email || '',
        phone: reg.user?.phone || 'N/A',
        studentId: reg.user?.student_id || 'N/A',
        major: reg.user?.major || '',
        year: reg.user?.year || '',
        notes: reg.notes || '',
      },
    })

    const registrations = loadingRegistrations ? [] : rawRegistrations.map(normalizeRegistration)

    const [selectedRegistration, setSelectedRegistration] = React.useState(null)
    const [showRegistrationDetailModal, setShowRegistrationDetailModal] = React.useState(false)
    const [regModalTab, setRegModalTab] = React.useState('attendees') // 'attendees' | 'payments'
    const [paymentStatuses, setPaymentStatuses] = React.useState({})
    const [selectedPaymentProof, setSelectedPaymentProof] = React.useState(null)

    // Sync paymentStatuses whenever registrations load
    React.useEffect(() => {
      if (registrations.length > 0) {
        setPaymentStatuses(
          Object.fromEntries(registrations.map(r => [r.id, r.payment?.status || 'n/a']))
        )
      }
    }, [registrations.length])

    const pendingCount = Object.values(paymentStatuses).filter(s => s === 'pending_confirmation').length
    const confirmedCount = Object.values(paymentStatuses).filter(s => s === 'confirmed').length
    const totalCollected = confirmedCount * (selectedEventForRegistrations?.price || 0)

    const confirmPayment = (reg) => {
      setPaymentStatuses(prev => ({ ...prev, [reg.id]: 'confirmed' }))
      toast.success(`Payment confirmed for ${reg.name}`)
    }
    const rejectPayment = (reg) => {
      setPaymentStatuses(prev => ({ ...prev, [reg.id]: 'rejected' }))
      toast.error(`Payment rejected for ${reg.name} — student will be notified`)
    }

    const viewRegistrationDetails = (registration) => {
      setSelectedRegistration(registration)
      setShowRegistrationDetailModal(true)
    }

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowRegistrationsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Event Registrations</h2>
                  <p className="text-green-100">{selectedEventForRegistrations?.title}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-green-200 text-sm">
                      {selectedEventForRegistrations?.registrations} / {selectedEventForRegistrations?.maxAttendees} registered
                    </span>
                    {isPaidEvent && pendingCount > 0 && (
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                        {pendingCount} payment{pendingCount > 1 ? 's' : ''} awaiting confirmation
                      </span>
                    )}
                    {isPaidEvent && (
                      <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Collected: ${totalCollected.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {/* Sub-tabs for paid events */}
              {isPaidEvent && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setRegModalTab('attendees')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      regModalTab === 'attendees' ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => setRegModalTab('payments')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      regModalTab === 'payments' ? 'bg-white text-green-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Payments
                    {pendingCount > 0 && (
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* ── PAYMENTS TAB ── */}
              {isPaidEvent && regModalTab === 'payments' && (
                <div className="space-y-4">
                  {/* Revenue summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                      <p className="text-xs text-amber-600 font-medium mt-1">Awaiting Confirmation</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">Confirmed</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">${totalCollected.toFixed(2)}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">Total Collected</p>
                    </div>
                  </div>

                  {/* Payment cards */}
                  {registrations.map((reg) => {
                    const pStatus = paymentStatuses[reg.id]
                    return (
                      <div key={reg.id} className={`border rounded-xl p-5 ${
                        pStatus === 'pending_confirmation' ? 'border-amber-300 bg-amber-50' :
                        pStatus === 'confirmed' ? 'border-green-300 bg-green-50' :
                        pStatus === 'rejected' ? 'border-red-300 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          {/* Student + payment info */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {reg.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{reg.name}</span>
                                <span className="text-xs text-gray-500">{reg.studentId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  pStatus === 'pending_confirmation' ? 'bg-amber-200 text-amber-800' :
                                  pStatus === 'confirmed' ? 'bg-green-200 text-green-800' :
                                  pStatus === 'rejected' ? 'bg-red-200 text-red-800' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {pStatus === 'pending_confirmation' ? 'Pending' :
                                   pStatus === 'confirmed' ? 'Confirmed' :
                                   pStatus === 'rejected' ? 'Rejected' : 'No payment'}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                                <span><span className="font-medium">Amount:</span> ${(reg.payment?.amount || 0).toFixed(2)}</span>
                                <span><span className="font-medium">Method:</span> {reg.payment?.method || '—'}</span>
                                <span><span className="font-medium">Paid at:</span> {reg.payment?.paidAt ? new Date(reg.payment.paidAt).toLocaleString() : '—'}</span>
                                <span><span className="font-medium">Txn ID:</span> {reg.payment?.transactionId || '—'}</span>
                              </div>
                              {pStatus === 'rejected' && reg.payment?.rejectionReason && (
                                <p className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                                  Rejection note: {reg.payment.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Proof + actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                              onClick={() => setSelectedPaymentProof(reg)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 bg-white rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-all"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View Proof {reg.payment?.proofType === 'pdf' ? '(PDF)' : '(Image)'}
                            </button>
                            {pStatus === 'pending_confirmation' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => rejectPayment(reg)}
                                  className="flex items-center gap-1 text-xs text-red-700 border border-red-300 bg-white hover:bg-red-50 rounded-lg px-3 py-1.5 font-medium transition-all"
                                >
                                  <XCircleIcon className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => confirmPayment(reg)}
                                  className="flex items-center gap-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 font-medium transition-all"
                                >
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                  Confirm
                                </button>
                              </div>
                            )}
                            {pStatus === 'confirmed' && (
                              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                <CheckCircleIcon className="w-4 h-4" /> Payment confirmed
                              </span>
                            )}
                            {pStatus === 'rejected' && (
                              <button
                                onClick={() => confirmPayment(reg)}
                                className="text-xs text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 font-medium transition-all"
                              >
                                Re-confirm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Payment Proof Preview Modal */}
                  {selectedPaymentProof && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                      onClick={() => setSelectedPaymentProof(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900">Payment Proof</h3>
                          <button onClick={() => setSelectedPaymentProof(null)} className="p-1 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                          <div><span className="font-medium">Student:</span> {selectedPaymentProof.name}</div>
                          <div><span className="font-medium">Amount:</span> ${(selectedPaymentProof.payment?.amount || 0).toFixed(2)}</div>
                          <div><span className="font-medium">Transaction ID:</span> {selectedPaymentProof.payment?.transactionId}</div>
                          <div><span className="font-medium">Method:</span> {selectedPaymentProof.payment?.method}</div>
                        </div>
                        {/* Proof placeholder — in production this would show the actual uploaded image/PDF */}
                        {selectedPaymentProof.payment?.proofType === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-8 gap-3">
                            <DocumentTextIcon className="w-16 h-16 text-gray-400" />
                            <p className="text-sm text-gray-500">PDF receipt uploaded</p>
                            <button className="text-xs text-blue-600 underline">Download PDF</button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-8 gap-3">
                            <PhotoIcon className="w-16 h-16 text-gray-400" />
                            <p className="text-sm text-gray-500">Payment screenshot uploaded</p>
                            <p className="text-xs text-gray-400">(Image preview requires backend integration)</p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => { rejectPayment(selectedPaymentProof); setSelectedPaymentProof(null) }}
                            className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { confirmPayment(selectedPaymentProof); setSelectedPaymentProof(null) }}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            Confirm Payment
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── ATTENDEES TAB (or non-paid default) ── */}
              {(!isPaidEvent || regModalTab === 'attendees') && (
              <>
              {/* Simplified Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Registered</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedEventForRegistrations?.registrations || 0}</p>
                    </div>
                    <UsersIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Available Spots</p>
                      <p className="text-2xl font-bold text-purple-900">{(selectedEventForRegistrations?.maxAttendees || 0) - (selectedEventForRegistrations?.registrations || 0)}</p>
                    </div>
                    <TicketIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Registrations Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                {registration.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{registration.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{registration.email}</div>
                            <div className="text-sm text-gray-500">{registration.phone}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.studentId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(registration.registeredAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {registration.ticketId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewRegistrationDetails(registration)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </> )}

            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {registrations.length} registrations
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowRegistrationsModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      exportRegistrationsToCSV(registrations, selectedEventForRegistrations?.title || 'Event')
                      toast.success('Registrations exported successfully!')
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Export List
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Registration Detail Modal */}
        {showRegistrationDetailModal && selectedRegistration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegistrationDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Registration Details</h2>
                    <p className="text-blue-100">{selectedRegistration.name}</p>
                    <p className="text-blue-200 text-sm mt-1">Ticket ID: {selectedRegistration.ticketId}</p>
                  </div>
                  <button
                    onClick={() => setShowRegistrationDetailModal(false)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.studentId}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Academic Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Major:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.major}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.formData.year}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Additional Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedRegistration.formData.notes}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dietary Restrictions:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRegistration.formData.dietaryRestrictions}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Emergency Contact:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedRegistration.formData.emergencyContact}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Information */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Registration Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedRegistration.registeredAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedRegistration.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedRegistration.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket ID:</span>
                      <span className="font-medium text-gray-900">{selectedRegistration.ticketId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowRegistrationDetailModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Registration details exported successfully!')
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Export Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </>
    )
  }

  // Club Members Modal
  const ClubMembersModal = () => {
    // Fetch real members from API, normalized to UI shape
    const { data: rawMembers = [], isLoading: loadingMembers } = useQuery({
      queryKey: ['club-members', selectedClubForMembers?.id],
      queryFn: () => getClubMembers(selectedClubForMembers.id),
      enabled: !!selectedClubForMembers?.id,
      staleTime: 60 * 1000,
    })

    // Mutations for member management
    const approveMemberMutation = useMutation({
      mutationFn: (membershipId) => updateMembershipStatus(membershipId, 'approve'),
      onSuccess: () => {
        queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
        toast.success('Member approved successfully!')
      },
      onError: () => {
        toast.error('Failed to approve member')
      }
    })

    const rejectMemberMutation = useMutation({
      mutationFn: (membershipId) => updateMembershipStatus(membershipId, 'reject'),
      onSuccess: () => {
        queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
        toast.success('Member request declined')
      },
      onError: () => {
        toast.error('Failed to decline member')
      }
    })

    const removeMemberMutation = useMutation({
      mutationFn: (membershipId) => leaveClub(membershipId),
      onSuccess: () => {
        queryClient.invalidateQueries(['club-members', selectedClubForMembers?.id])
        toast.success('Member removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove member')
      }
    })

    const handleApproveMember = (membershipId) => {
      if (window.confirm('Approve this member?')) {
        approveMemberMutation.mutate(membershipId)
      }
    }

    const handleDeclineMember = (membershipId) => {
      if (window.confirm('Decline this membership request?')) {
        rejectMemberMutation.mutate(membershipId)
      }
    }

    const handleRemoveMember = (membershipId, memberName) => {
      if (window.confirm(`Remove ${memberName} from the club? This action cannot be undone.`)) {
        removeMemberMutation.mutate(membershipId)
      }
    }

    const normalizeMember = (m) => ({
      id: m.id,
      name: m.user?.full_name || m.user?.first_name || m.user?.email || 'Unknown',
      email: m.user?.email || '',
      studentId: m.user?.student_id || 'N/A',
      phone: m.user?.phone || 'N/A',
      joinedAt: m.joined_at,
      role: m.role_display || m.role || 'Member',
      status: m.status || 'active',
    })

    const members = loadingMembers ? [] : rawMembers.map(normalizeMember)

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowClubMembersModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Club Members</h2>
                <p className="text-purple-100">{selectedClubForMembers?.name}</p>
                <p className="text-purple-200 text-sm mt-1">
                  {selectedClubForMembers?.member_count || members.length} total members
                </p>
              </div>
              <button
                onClick={() => setShowClubMembersModal(false)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Members</p>
                    <p className="text-2xl font-bold text-purple-900">{members.length}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active Members</p>
                    <p className="text-2xl font-bold text-green-900">{members.filter(m => m.status === 'approved' || m.status === 'active').length}</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-900">{members.filter(m => m.status === 'pending').length}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.email}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.studentId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'President' ? 'bg-indigo-100 text-indigo-700' :
                            member.role === 'Vice President' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.status === 'approved' || member.status === 'active' ? 'bg-green-100 text-green-700' : 
                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {member.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveMember(member.id)}
                                  disabled={approveMemberMutation.isLoading}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineMember(member.id)}
                                  disabled={rejectMemberMutation.isLoading}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Decline
                                </button>
                              </>
                            )}
                            {(member.status === 'approved' || member.status === 'active') && (
                              <button
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                disabled={removeMemberMutation.isLoading}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {members.length} members
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowClubMembersModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    exportClubMembersToCSV(members, selectedClubForMembers?.name || 'Club')
                    toast.success('Member list exported successfully!')
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Export List
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Event Detail Modal
  const EventDetailModal = () => {
    const formatDateTime = (datetime) => {
      if (!datetime) return 'N/A'
      try {
        const date = new Date(datetime)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      } catch { return 'N/A' }
    }

    // Safe field accessors with smart fallbacks
    const getEventDate = () => {
      if (selectedEvent?.eventDate) return new Date(selectedEvent.eventDate).toLocaleDateString()
      if (selectedEvent?.proposed_date) return new Date(selectedEvent.proposed_date).toLocaleDateString()
      if (selectedEvent?.start_datetime) return new Date(selectedEvent.start_datetime).toLocaleDateString()
      return 'TBA'
    }

    const getEventTime = () => {
      if (selectedEvent?.event_time) return selectedEvent.event_time
      if (selectedEvent?.start_datetime) {
        const time = new Date(selectedEvent.start_datetime)
        return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
      return 'TBA'
    }

    const getVenue = () => {
      return selectedEvent?.venue || selectedEvent?.specificLocation || 'TBA'
    }

    const getCapacity = () => {
      return selectedEvent?.capacity || selectedEvent?.expected_participants || selectedEvent?.max_participants || '0'
    }

    const getPrice = () => {
      const price = selectedEvent?.price || selectedEvent?.ticketPrice
      return price ? `$${parseFloat(price).toFixed(2)}` : 'Free'
    }

    const getDescription = () => {
      return selectedEvent?.description || 'No description provided'
    }

    const getAgenda = () => {
      return selectedEvent?.agenda_description || selectedEvent?.agenda || null
    }

    const getRequirements = () => {
      return selectedEvent?.requirements || selectedEvent?.special_requirements || null
    }

    const getSpecialRequirements = () => {
      return selectedEvent?.special_requirements || null
    }
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowEventDetailModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Image */}
          {selectedEvent?.poster_image && (
            <div className="relative h-40 bg-gradient-to-r from-blue-400 to-indigo-600 overflow-hidden">
              <img src={selectedEvent.poster_image} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}
          
          {/* Header */}
          <div className={`p-6 text-white relative ${ selectedEvent?.poster_image ? 'bg-gradient-to-r from-blue-600 to-indigo-600 -mt-8 relative z-10' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
            <button
              onClick={() => setShowEventDetailModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold mb-2">{selectedEvent?.title || 'Event Details'}</h2>
            <p className="text-blue-100 flex items-center">
              <SparklesIcon className="w-4 h-4 mr-2" />
              {selectedEvent?.event_type || selectedEvent?.category || 'Campus Event'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Description */}
            {getDescription() && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                  About This Event
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm">{getDescription()}</p>
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" /> When
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Date</p>
                    <p className="text-gray-900 font-semibold">{getEventDate()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Time</p>
                    <p className="text-gray-900 font-semibold">{getEventTime()}</p>
                  </div>
                </div>
              </div>

              {/* Location & Capacity */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center text-sm">
                  <MapPinIcon className="w-4 h-4 mr-2" /> Location & Capacity
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Venue</p>
                    <p className="text-gray-900 font-semibold">{getVenue()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Max Capacity</p>
                    <p className="text-gray-900 font-semibold">{getCapacity()} people</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-bold text-green-900 mb-3 flex items-center text-sm">
                  <TicketIcon className="w-4 h-4 mr-2" /> Cost
                </h4>
                <div className="text-sm">
                  <p className="text-gray-600 font-medium">Fee</p>
                  <p className="text-gray-900 font-bold text-lg">{getPrice()}</p>
                </div>
              </div>

              {selectedEvent?.registration_deadline && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <h4 className="font-bold text-orange-900 mb-3 flex items-center text-sm">
                    <ClockIcon className="w-4 h-4 mr-2" /> Registration Deadline
                  </h4>
                  <p className="text-gray-900 font-semibold text-sm">{formatDateTime(selectedEvent.registration_deadline)}</p>
                </div>
              )}
            </div>

            {/* Requirements */}
            {getRequirements() && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center text-sm">
                  <CheckCircleIcon className="w-4 h-4 mr-2" /> Requirements
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{getRequirements()}</p>
              </div>
            )}

            {/* Agenda Description */}
            {getAgenda() && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                <h4 className="font-bold text-violet-900 mb-2 flex items-center text-sm">
                  <DocumentTextIcon className="w-4 h-4 mr-2" /> Agenda
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{getAgenda()}</p>
              </div>
            )}

            {/* Special Requirements */}
            {getSpecialRequirements() && (
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
                <h4 className="font-bold text-rose-900 mb-2 flex items-center text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Special Requirements
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{getSpecialRequirements()}</p>
              </div>
            )}

            {/* Organizer Information */}
            {(selectedEvent?.organizerName || selectedEvent?.submitted_by_details) && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-3 flex items-center text-sm">
                  <UserIcon className="w-4 h-4 mr-2" /> Event Organizer
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Name</p>
                    <p className="text-gray-900 font-semibold">{selectedEvent?.organizerName || selectedEvent?.submitted_by_details?.first_name + ' ' + selectedEvent?.submitted_by_details?.last_name || 'Event Organizer'}</p>
                  </div>
                  {selectedEvent?.organizerEmail && (
                    <div>
                      <p className="text-gray-600 font-medium">Email</p>
                      <a href={`mailto:${selectedEvent.organizerEmail}`} className="text-emerald-600 hover:underline font-medium text-xs truncate">
                        {selectedEvent.organizerEmail}
                      </a>
                    </div>
                  )}
                  {selectedEvent?.organizerPhone && (
                    <div>
                      <p className="text-gray-600 font-medium">Phone</p>
                      <p className="text-gray-900 font-semibold">{selectedEvent.organizerPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedEvent?.tags && selectedEvent.tags.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
                  <TagIcon className="w-4 h-4 mr-2" /> Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowEventDetailModal(false)}
              className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Close
            </button>
            {!isOrganizer && (
              <button
                onClick={() => {
                  setShowEventDetailModal(false)
                  const ticket = myEventRegistrations?.find(reg => reg.id === selectedEvent?.id)
                  if (ticket) viewTicket(ticket)
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                <TicketIcon className="w-5 h-5" />
                View Ticket
              </button>
            )}
            {isOrganizer && (
              <button
                onClick={() => {
                  setShowEventDetailModal(false)
                  viewEventRegistrations(selectedEvent)
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                <UsersIcon className="w-5 h-5" />
                View Registrations
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Organizer Club Detail Modal
  const OrganizerClubDetailModal = () => {
    const club = selectedOrganizerClub
    const foundedDate = club?.submitted_date ? new Date(club.submitted_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowOrganizerClubDetailModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Logo */}
          {club?.club_logo && (
            <div className="relative h-40 bg-gradient-to-r from-purple-400 to-pink-400 overflow-hidden">
              <img src={club.club_logo} alt={club.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}
          
          {/* Header */}
          <div className={`p-6 text-white relative ${club?.club_logo ? 'bg-gradient-to-r from-purple-600 to-pink-600 -mt-8 relative z-10' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
            <button
              onClick={() => setShowOrganizerClubDetailModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold mb-2">{club?.name || 'Club Details'}</h2>
            <p className="text-purple-100 flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-2" />
              {club?.club_type ? club.club_type.charAt(0).toUpperCase() + club.club_type.slice(1) : 'Club'} Club
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Description */}
            {club?.description && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-purple-600" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm">{club.description}</p>
              </div>
            )}

            {/* Mission Statement */}
            {club?.mission && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-2 flex items-center text-sm">
                  <SparklesIcon className="w-4 h-4 mr-2" /> Mission
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{club.mission}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Club Info */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center text-sm">
                  <Cog6ToothIcon className="w-4 h-4 mr-2" /> Club Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Type</p>
                    <p className="text-gray-900 font-semibold capitalize">{club?.club_type || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                      club?.status === 'published' || club?.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : club?.status === 'approved' 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {club?.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Created</p>
                    <p className="text-gray-900 font-semibold">{foundedDate}</p>
                  </div>
                </div>
              </div>

              {/* Membership Info */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                <h4 className="font-bold text-pink-900 mb-3 flex items-center text-sm">
                  <UserGroupIcon className="w-4 h-4 mr-2" /> Members
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Expected Members</p>
                    <p className="text-gray-900 font-bold text-lg">{club?.expected_members || 0}</p>
                  </div>
                  {club?.start_date && (
                    <div>
                      <p className="text-gray-600 font-medium">Start Date</p>
                      <p className="text-gray-900 font-semibold">{new Date(club.start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Leadership & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {club?.president_name && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center text-sm">
                    <UserCircleIcon className="w-4 h-4 mr-2" /> Club President
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Name</p>
                      <p className="text-gray-900 font-semibold">{club.president_name}</p>
                    </div>
                    {club?.president_email && (
                      <div>
                        <p className="text-gray-600 font-medium">Email</p>
                        <a href={`mailto:${club.president_email}`} className="text-blue-600 hover:underline font-medium text-xs truncate">
                          {club.president_email}
                        </a>
                      </div>
                    )}
                    {club?.president_phone && (
                      <div>
                        <p className="text-gray-600 font-medium">Phone</p>
                        <a href={`tel:${club.president_phone}`} className="text-blue-600 hover:underline font-medium text-xs">
                          {club.president_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {club?.advisor_name && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-bold text-amber-900 mb-3 flex items-center text-sm">
                    <AcademicCapIcon className="w-4 h-4 mr-2" /> Faculty Advisor
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Name</p>
                      <p className="text-gray-900 font-semibold">{club.advisor_name}</p>
                    </div>
                    {club?.advisor_email && (
                      <div>
                        <p className="text-gray-600 font-medium">Email</p>
                        <a href={`mailto:${club.advisor_email}`} className="text-blue-600 hover:underline font-medium text-xs truncate">
                          {club.advisor_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Details */}
            {(club?.meeting_time || club?.meeting_location) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-bold text-green-900 mb-3 flex items-center text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" /> Meeting Details
                </h4>
                <div className="space-y-2 text-sm">
                  {club?.meeting_time && (
                    <div>
                      <p className="text-gray-600 font-medium">Time</p>
                      <p className="text-gray-900">{club.meeting_time}</p>
                    </div>
                  )}
                  {club?.meeting_location && (
                    <div>
                      <p className="text-gray-600 font-medium">Location</p>
                      <p className="text-gray-900">{club.meeting_location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media */}
            {(club?.instagram || club?.linkedin || club?.github) && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-3 flex items-center text-sm">
                  <GlobeAltIcon className="w-4 h-4 mr-2" /> Social Media
                </h4>
                <div className="flex flex-wrap gap-3">
                  {club?.instagram && (
                    <a href={`https://instagram.com/${club.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 text-sm font-medium">
                      📷 {club.instagram}
                    </a>
                  )}
                  {club?.linkedin && (
                    <a href={`https://linkedin.com/company/${club.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      💼 {club.linkedin}
                    </a>
                  )}
                  {club?.github && (
                    <a href={`https://github.com/${club.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 text-sm font-medium">
                      🐙 {club.github}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Objectives */}
            {club?.objectives && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <h4 className="font-bold text-orange-900 mb-2 flex items-center text-sm">
                  <CheckCircleIcon className="w-4 h-4 mr-2" /> Objectives
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{club.objectives}</p>
              </div>
            )}

            {/* Activities */}
            {club?.activities && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                <h4 className="font-bold text-cyan-900 mb-2 flex items-center text-sm">
                  <SparklesIcon className="w-4 h-4 mr-2" /> Planned Activities
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{club.activities}</p>
              </div>
            )}

            {/* Requirements */}
            {club?.requirements && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
                <h4 className="font-bold text-yellow-900 mb-2 flex items-center text-sm">
                  <CheckCircleIcon className="w-4 h-4 mr-2" /> Membership Requirements
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{club.requirements}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowOrganizerClubDetailModal(false)}
              className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">CluboraX</span>
        </div>

        {/* Dual-ring spinner */}
        <div className="relative w-14 h-14 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>

        <p className="text-sm font-medium text-gray-400 tracking-wide">Loading your dashboard…</p>

        {/* Animated bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{ animation: 'loadingBar 1.4s ease-in-out infinite' }}
          />
        </div>

        <style>{`
          @keyframes loadingBar {
            0%   { transform: translateX(-100%); }
            50%  { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative text-white text-center overflow-hidden"
        style={{
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/img/home.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          padding: 'calc(6rem + 60px) 2rem 4rem'
        }}
      >
        {/* Curved bottom shape */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: '#f9fafb',
            borderRadius: '100% 100% 0 0 / 80px 80px 0 0'
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '3rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
              <UserIcon className="w-12 h-12" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                Welcome back, <span>{user?.name || 'User'}</span>!
              </h1>
              <p style={{ fontSize: '1.15rem', opacity: 0.95, margin: '0.5rem 0 0 0', fontWeight: 500 }}>
                Manage your events and activities
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center' }}>
            {isOrganizer && (
              <>
                <button 
                  onClick={() => setShowCreateEventModal(true)}
                  style={{ background: 'white', color: '#667eea', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s', fontSize: '1rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)' }}
                >
                  <PlusIcon className="w-5 h-5 inline mr-2" /> Create Event Proposal
                </button>
                <button 
                  onClick={() => setShowClubProposalModal(true)}
                  style={{ background: 'white', color: '#764ba2', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s', fontSize: '1rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)' }}
                >
                  <UserGroupIcon className="w-5 h-5 inline mr-2" /> Create Club Proposal
                </button>
              </>
            )}
            <button 
              onClick={() => navigate('/ai-advisor')}
              style={{ background: 'rgba(255,255,255,0.95)', color: '#667eea', padding: '0.85rem 1.8rem', borderRadius: '12px', fontWeight: 700, border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)' }}
            >
              <SparklesIcon className="w-5 h-5 inline mr-2" /> CluboraX AI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Navigation Tabs - Different for organizers vs students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-2"
          >
            <div className="flex space-x-1">
              {isOrganizer ? 
                ['overview', 'my-events', 'proposals'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => navigate(`/dashboard?tab=${tab}`)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'my-events' && 'My Events & Clubs'}
                    {tab === 'proposals' && 'Proposals'}
                  </button>
                ))
                :
                // Student tabs - conditionally include 'my-organized' if they have published content
                [
                  'overview',
                  'my-clubs-events',
                  ...(hasPublishedContent ? ['my-organized'] : []),
                  'proposals'
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => navigate(`/dashboard?tab=${tab}`)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'my-clubs-events' && 'Participating'}
                    {tab === 'my-organized' && 'My Organized'}
                    {tab === 'proposals' && 'Proposals'}
                  </button>
                ))
              }
            </div>
          </motion.div>

          {/* Tab Content */}
          <>
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
            <>
              {/* Main Content Grid - Different for organizers vs students */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isOrganizer ? (
                  <>
                    {/* Events Section for Organizers */}
                    <div className="lg:col-span-2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                        </div>
                        <div className="space-y-4">
                          {/* Events Overview - No longer clickable */}
                          <div 
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-8 h-8 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0} Active Event{(Array.isArray(courses) ? courses.filter(c => c.duration === 'Event').length : 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {stats?.totalRegistrations ? `Managing ${stats.totalRegistrations} registration${stats.totalRegistrations !== 1 ? 's' : ''}` : 'Events you organize'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Clubs Overview - No longer clickable */}
                          <div 
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                          >
                            <div className="flex items-center gap-3">
                              <UserGroupIcon className="w-8 h-8 text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {stats?.activeClubs ?? stats?.totalClubs ?? 0} Active Club{(stats?.activeClubs ?? stats?.totalClubs ?? 0) !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">Clubs you manage</p>
                              </div>
                            </div>
                          </div>

                          {/* Proposals Summary */}
                          <div 
                            onClick={() => setActiveTab('proposals')}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <DocumentTextIcon className="w-8 h-8 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {allProposals.length} Proposal{allProposals.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {allProposals.filter(p => p.status === 'published').length} published, {' '}
                                  {allProposals.filter(p => p.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Quick Actions for Organizers */}
                    <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setShowCreateEventModal(true)}
                            className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Create Event</span>
                          </button>
                          <button 
                            onClick={() => {
                              setActiveTab('proposals')
                              toast.info('View and manage your proposals here!')
                            }}
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <DocumentTextIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">View Proposals</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* My Clubs/Events Section for Students */}
                    <div className="lg:col-span-2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                        </div>
                        <div className="space-y-4">
                          {/* Event Registrations Summary */}
                          <div 
                            onClick={() => {
                              setActiveTab('my-clubs-events')
                              setStudentContentType('events')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-8 h-8 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {myEventRegistrations.length} Event Registration{myEventRegistrations.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {myEventRegistrations.filter(r => r.status === 'confirmed').length} confirmed
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          
                          {/* Club Requests Summary */}
                          <div 
                            onClick={() => {
                              setActiveTab('my-clubs-events')
                              setStudentContentType('clubs')
                            }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <UserGroupIcon className="w-8 h-8 text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {myClubRequests.length} Club Request{myClubRequests.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {myClubRequests.filter(r => r.status === 'approved').length} approved, {' '}
                                  {myClubRequests.filter(r => r.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* Proposals Summary */}
                          <div 
                            onClick={() => setActiveTab('proposals')}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <DocumentTextIcon className="w-8 h-8 text-green-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {allProposals.length} Proposal{allProposals.length !== 1 ? 's' : ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {allProposals.filter(p => p.status === 'published').length} published, {' '}
                                  {allProposals.filter(p => p.status === 'pending').length} pending
                                </p>
                              </div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* My Organized Summary - Only show if has published content */}
                          {hasPublishedContent && (
                            <div 
                              onClick={() => setActiveTab('my-organized')}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <SparklesIcon className="w-8 h-8 text-orange-600" />
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    My Organized
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {publishedEvents.length} event{publishedEvents.length !== 1 ? 's' : ''}, {' '}
                                    {publishedClubs.length} club{publishedClubs.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>

                    {/* Recent Activity for Students */}
                    <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          {/* Combine and sort recent activities */}
                          {(() => {
                            const activities = [
                              ...myEventRegistrations.map(reg => ({
                                type: 'event',
                                name: reg.eventName,
                                date: new Date(reg.registeredAt),
                                status: reg.status,
                                icon: CalendarIcon,
                                color: 'blue'
                              })),
                              ...myClubRequests.map(req => ({
                                type: 'club',
                                name: req.clubName,
                                date: new Date(req.submittedAt),
                                status: req.status,
                                icon: UserGroupIcon,
                                color: 'purple'
                              }))
                            ].sort((a, b) => b.date - a.date).slice(0, 5)

                            if (activities.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <ClockIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                  <p className="text-sm">No recent activity</p>
                                  <p className="text-xs mt-1">Join events and clubs to see activity here!</p>
                                </div>
                              )
                            }

                            return activities.map((activity, idx) => (
                              <div 
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className={`p-2 rounded-lg ${
                                  activity.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                  <activity.icon className={`w-4 h-4 ${
                                    activity.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {activity.type === 'event' ? 'Registered for' : 'Applied to'} {activity.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      activity.status === 'confirmed' || activity.status === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : activity.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {activity.status}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {activity.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* My Clubs Tab Content */}
          {activeTab === 'my-clubs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Club Requests</h2>
                <p className="text-gray-600">Track your club membership applications and status</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClubRequests.length > 0 ? (
                  myClubRequests.map((request) => (
                    <ClubRequestCard key={request.id} request={request} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No club requests yet</h3>
                    <p className="text-gray-500">Browse clubs and submit your membership requests!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Combined Clubs/Events Tab for Students */}
          {activeTab === 'my-clubs-events' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {studentContentType === 'events' ? 'My Event Registrations' : 'My Club Requests'}
                    </h2>
                    <p className="text-gray-600">
                      {studentContentType === 'events' 
                        ? 'View your event tickets and registration details'
                        : 'Track your club membership applications and status'}
                    </p>
                  </div>
                  
                  {/* Toggle Buttons for Students */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setStudentContentType('events')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        studentContentType === 'events'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setStudentContentType('clubs')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        studentContentType === 'clubs'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Clubs
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Events Section */}
              {studentContentType === 'events' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myEventRegistrations.length > 0 ? (
                    myEventRegistrations.map((registration) => (
                      <EventRegistrationCard key={registration.id} registration={registration} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No event registrations yet</h3>
                      <p className="text-gray-500">Browse events and register to get your tickets!</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Clubs Section */}
              {studentContentType === 'clubs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myClubRequests.length > 0 ? (
                    myClubRequests.map((request) => (
                      <ClubRequestCard key={request.id} request={request} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No club requests yet</h3>
                      <p className="text-gray-500">Browse clubs and submit your membership requests!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Student Organized Content Tab - Shows published clubs from approved proposals */}
          {activeTab === 'my-organized' && !isOrganizer && hasPublishedContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    My Organized Clubs
                  </h2>
                  <p className="text-gray-600">
                    Manage clubs you created that are now published
                  </p>
                </div>
                
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Congratulations!</h3>
                      <p className="text-sm text-green-800">
                        Your club proposals have been approved by the admin 
                        and are now published. You can manage them here, view members, and track their success.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Clubs Section */}
              <div className="space-y-4">
                {publishedClubs.length > 0 ? (
                  publishedClubs.map((club) => (
                    <div 
                      key={club.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-purple-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <UserGroupIcon className="w-6 h-6 text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              Published
                            </span>
                          </div>
                          <p className="text-gray-700 mb-4">{club.mission}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <BuildingOfficeIcon className="w-4 h-4" />
                              <span>{club.club_type || 'General'} Club</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <UsersIcon className="w-4 h-4" />
                              <span>{club.expected_members || 0} expected members</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <AcademicCapIcon className="w-4 h-4" />
                              <span>{club.department || 'Multi-department'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DocumentTextIcon className="w-4 h-4" />
                              <span>Submitted: {new Date(club.submitted_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => {
                              // Convert club proposal to club format for details modal
                              const clubData = {
                                ...club,
                                category: club.club_type || 'General',
                                members: club.expected_members || 0,
                                requirements: club.requirements || 'No specific requirements',
                                mission_statement: club.mission || '',
                                advisor_name: club.advisor_name || 'TBA',
                                advisor_email: club.advisor_email || '',
                                meeting_schedule: club.meeting_schedule || 'TBA',
                                tags: [],
                                status: 'published'
                              }
                              viewOrganizerClubDetails(clubData)
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <EyeIcon className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              // Convert club proposal to club format for members
                              const clubData = {
                                id: club.id,
                                name: club.name,
                                member_count: club.expected_members || 0
                              }
                              viewClubMembers(clubData)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <UsersIcon className="w-4 h-4" />
                            Members
                          </button>
                          <button
                            onClick={(e) => {
                              // Convert club proposal to club format for image upload
                              const clubData = {
                                id: club.id,
                                title: club.name,
                                name: club.name
                              }
                              openImageUploadModal(clubData, e)
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            Upload Image
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No published clubs yet</h3>
                    <p className="text-gray-500 mb-4">Submit club proposals and get them approved to see them here!</p>
                    <button
                      onClick={() => setShowClubProposalModal(true)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Create Club Proposal
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* My Events & Clubs Tab Content - For Organizers Only */}
          {activeTab === 'my-events' && isOrganizer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Events & Clubs</h2>
                <p className="text-gray-600">Manage events and clubs you've created and published</p>
              </div>
              
              <div className="space-y-8">
                {/* Events Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                    My Events
                  </h3>
                  {Array.isArray(courses) && courses.filter(c => c.duration === 'Event').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.filter(c => c.duration === 'Event').map((event) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50"
                        >
                          {event.posterImage && (
                            <img
                              src={event.posterImage}
                              alt={event.title}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-2">{event.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{event.description?.slice(0, 100)}...</p>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              {event.eventDate && (
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  setSelectedEvent(event)
                                  setShowEventDetailModal(true)
                                }}
                                className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <EyeIcon className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={(e) => openImageUploadModal(event, e)}
                                className="py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <PhotoIcon className="w-3 h-3" />
                                Image
                              </button>
                              <button
                                onClick={() => viewEventPayments(event)}
                                className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <DocumentTextIcon className="w-3 h-3" />
                                Payments
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">No events created yet</p>
                    </div>
                  )}
                </div>

                {/* Clubs Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-6 h-6 text-purple-600" />
                    My Clubs
                  </h3>
                  {publishedClubs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publishedClubs.map((club) => (
                        <div
                          key={club.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50"
                        >
                          {club.club_logo && (
                            <img
                              src={club.club_logo}
                              alt={club.name}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-gray-900 flex-1">{club.name}</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                Published
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{club.mission?.slice(0, 80)}...</p>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              {club.club_type && (
                                <div className="flex items-center gap-2">
                                  <TagIcon className="w-4 h-4" />
                                  <span>{club.club_type}</span>
                                </div>
                              )}
                              {club.members_count !== undefined && (
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="w-4 h-4" />
                                  <span>{club.members_count} members</span>
                                </div>
                              )}
                            </div>
                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  setSelectedOrganizerClub(club)
                                  setShowOrganizerClubDetailModal(true)
                                }}
                                className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <EyeIcon className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => viewClubMembers(club)}
                                className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <UsersIcon className="w-3 h-3" />
                                Members
                              </button>
                              <button
                                onClick={(e) => openImageUploadModal(club, e)}
                                className="py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1"
                              >
                                <PhotoIcon className="w-3 h-3" />
                                Image
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">No clubs created yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
                      My Proposals
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Manage your event and club proposals
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {isOrganizer && (
                      <button
                        onClick={() => setShowCreateEventModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Create Event Proposal
                      </button>
                    )}
                    <button
                      onClick={() => setShowClubProposalModal(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Club Proposal
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex flex-wrap space-x-4">
                  {[
                    { id: 'all', label: 'All', badge: allProposals.length },
                    { id: 'pending', label: 'Pending', badge: allProposals.filter(p => p.status === 'pending_review' || p.status === 'returned_for_revision').length },
                    { id: 'approved', label: 'Approved', badge: allProposals.filter(p => p.status === 'approved').length },
                    { id: 'published', label: 'Published', badge: allProposals.filter(p => p.status === 'published').length },
                    { id: 'rejected', label: 'Rejected', badge: allProposals.filter(p => p.status === 'rejected').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => navigate(`/dashboard?tab=proposals&proposalTab=${tab.id}`)}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        proposalTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          proposalTab === tab.id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Proposals Grid */}
              {(eventProposalsError || clubProposalsError) ? (
                <div className="text-center py-12">
                  <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading proposals</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {eventProposalsError?.message || clubProposalsError?.message || 'Unable to fetch proposals.'}
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button 
                      onClick={() => {
                        queryClient.invalidateQueries(['my-event-proposals'])
                        queryClient.invalidateQueries(['my-club-proposals'])
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : loadingEventProposals || loadingClubProposals ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
                  <p className="mt- text-sm text-gray-500">
                    Get started by creating a new event or club proposal.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProposals.map(proposal => (
                    <ProposalCard 
                      key={`${proposal.type}-${proposal.id}`} 
                      proposal={proposal} 
                      queryClient={queryClient}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      getStatusLabel={getStatusLabel}
                      setActiveTab={setActiveTab}
                      isOrganizer={isOrganizer}
                      navigate={navigate}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
          </>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTicketModal && <TicketModal />}
        {showClubDetailModal && <ClubRequestDetailModal />}
        {showEventDetailModal && selectedEvent?.id && <EnhancedEventDetailsModal show={showEventDetailModal} eventId={selectedEvent?.id} onClose={() => setShowEventDetailModal(false)} />}
        {showOrganizerClubDetailModal && <OrganizerClubDetailModal />}
        {showRegistrationsModal && <RegistrationsModal />}
        {showClubMembersModal && <ClubMembersModal />}
        {showClubProposalModal && (
          <ClubProposalModal
            onClose={() => setShowClubProposalModal(false)}
            queryClient={queryClient}
            setActiveTab={setActiveTab}
          />
        )}
        {showCreateEventModal && (
          <CreateEventModal
            eventForm={eventForm}
            handleFormChange={handleFormChange}
            handlePdfUpload={handlePdfUpload}
            removePdf={removePdf}
            calculatePlatformFee={calculatePlatformFee}
            setEventForm={setEventForm}
            setShowCreateEventModal={setShowCreateEventModal}
            user={user}
          />
        )}
        {showImageUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={imgAiStep === 'idle' ? closeImageUploadModal : undefined}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Upload Image</h2>
                    <p className="text-gray-500 text-sm mt-0.5">{selectedEventForImage?.title || selectedEventForImage?.name}</p>
                  </div>
                  {imgAiStep === 'idle' && (
                    <button onClick={closeImageUploadModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-5">
                  {['Select Image', 'AI Validation', 'Add to Gallery'].map((label, i) => {
                    const stepIndex = imgAiStep === 'idle' ? 0 : (imgAiStep === 'scanning' ? 1 : 2)
                    const active = i === stepIndex
                    const done = i < stepIndex
                    return (
                      <React.Fragment key={label}>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            done ? 'bg-green-500 text-white' :
                            active ? 'bg-blue-600 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {done ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className={`text-xs font-medium ${
                            active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'
                          }`}>{label}</span>
                        </div>
                        {i < 2 && <div className={`flex-1 h-0.5 rounded ${ done ? 'bg-green-400' : 'bg-gray-200' }`} />}
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* ── STEP 1: Select image ── */}
                {imgAiStep === 'idle' && (
                  <>
                    <div className="mb-5">
                      {imagePreview && imagePreview.length > 0 ? (
                        <div className="space-y-2">
                          {imagePreview.length > 1 && (
                            <div className="text-sm text-gray-600 font-medium mb-2">
                              {imagePreview.length} images selected
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                            {imagePreview.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-40 object-cover rounded-lg" />
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                  {selectedFile[idx]?.name}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => { setImagePreview([]); setSelectedFile([]) }}
                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                          >
                            Remove all
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="mb-1 text-sm text-gray-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or WEBP &bull; Max 5 MB each &bull; Multiple files supported</p>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageSelect} />
                        </label>
                      )}
                    </div>
                    
                    {/* Album Name Input */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Album Name <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                        placeholder="e.g., Annual Day 2024, Sports Meet, Club Activities..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Group your images into albums. If not specified, images will be added to "Main Album"
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
                      <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Your images will be added to the gallery. Make sure they are appropriate and related to your club/event.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={closeImageUploadModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
                        Cancel
                      </button>
                      <button
                        onClick={handleImageUpload}
                        disabled={!selectedFile || selectedFile.length === 0 || uploadingImage}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <PhotoIcon className="h-4 w-4" />
                            Upload {selectedFile.length > 1 ? `${selectedFile.length} Images` : 'Image'}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP 2: AI Scanning ── */}
                {(imgAiStep === 'scanning' || imgAiStep === 'passed' || imgAiStep === 'rejected') && (
                  <>
                    {/* Image thumbnail */}
                    <div className="flex gap-4 mb-5">
                      <img src={imagePreview} alt="Preview" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        {imgAiStep === 'scanning' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                            <span className="text-sm font-semibold text-blue-700">AI is scanning your image...</span>
                          </div>
                        )}
                        {imgAiStep === 'passed' && (
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">All checks passed — image approved</span>
                          </div>
                        )}
                        {imgAiStep === 'rejected' && (
                          <div className="flex items-center gap-2 mb-1">
                            <XCircleIcon className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-700">Image rejected by AI validation</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">{selectedFile?.name} &bull; {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {/* Checks list */}
                    <div className="space-y-2 mb-5">
                      {imgAiChecks.map((check, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                            check.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          {check.passed
                            ? <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                            : <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-red-800'}`}>{check.label}</p>
                            <p className={`text-xs mt-0.5 ${check.passed ? 'text-green-600' : 'text-red-600'}`}>{check.detail}</p>
                          </div>
                        </motion.div>
                      ))}
                      {imgAiStep === 'scanning' && imgAiChecks.length < 5 && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="animate-pulse w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-40" />
                            <div className="h-2.5 bg-gray-200 rounded animate-pulse w-24" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions after scan */}
                    {imgAiStep === 'passed' && (
                      <div className="flex gap-3">
                        <button onClick={closeImageUploadModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
                          Cancel
                        </button>
                        <button
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {uploadingImage ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>Adding...</span></>
                          ) : (
                            <><CheckCircleIcon className="h-4 w-4" /><span>Add to Gallery</span></>
                          )}
                        </button>
                      </div>
                    )}
                    {imgAiStep === 'rejected' && (
                      <>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                          <p className="text-xs text-red-700 font-medium">Your image did not pass AI validation. Please choose a different image that is relevant to your event and does not contain inappropriate content.</p>
                        </div>
                        <button
                          onClick={() => { setImgAiStep('idle'); setImgAiChecks([]); setImagePreview(null); setSelectedFile(null) }}
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <PhotoIcon className="h-4 w-4" />
                          Choose Different Image
                        </button>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCancelModal(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended' 
                        ? 'Request Admin Review' 
                        : 'Request Cancellation'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {cancelType === 'event' ? selectedCancelItem?.title : selectedCancelItem?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Show admin's reason if cancelled/suspended */}
                {(selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended') && selectedCancelItem?.admin_reason && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Admin's {selectedCancelItem.status === 'cancelled' ? 'Cancellation' : 'Suspension'} Reason:
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          {selectedCancelItem.admin_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Message */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Request a review from admin'
                          : 'Your request will be sent to admin'}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Explain why you believe this decision should be reconsidered.'
                          : 'The admin will review your request and take appropriate action.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Your appeal / explanation *'
                      : 'Reason for cancellation *'}
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={
                      selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                        ? 'Explain why you believe this decision should be reconsidered...'
                        : 'Please provide a detailed reason for cancellation...'
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Provide clear reasons and any supporting information for your appeal.'
                      : 'Provide a clear reason to help the admin process your request faster.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false)
                      setCancelReason('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!cancelReason.trim()) {
                        toast.error(
                          selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                            ? 'Please provide your appeal explanation'
                            : 'Please provide a reason for cancellation'
                        )
                        return
                      }
                      toast.success(
                        selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                          ? 'Review request sent to admin'
                          : 'Cancellation request submitted for admin review'
                      )
                      setShowCancelModal(false)
                      setCancelReason('')
                      setSelectedCancelItem(null)
                    }}
                    disabled={!cancelReason.trim()}
                    className={`flex-1 px-4 py-2 ${
                      selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedCancelItem?.status === 'cancelled' || selectedCancelItem?.status === 'suspended'
                      ? 'Send Review Request'
                      : 'Submit Request'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        {showEditEventModal && editingEvent && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setShowEditEventModal(false)
                  setEditingEvent(null)
                }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Edit & Resubmit Event</h2>
                      <p className="text-blue-100 mt-1">Address the rejection feedback and resubmit</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditEventModal(false)
                        setEditingEvent(null)
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rejection Reason Alert */}
                  {editingEvent.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Previous Rejection Reason:</p>
                          <p className="text-sm text-red-700">{editingEvent.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    toast.success('Event resubmitted for approval!')
                    setShowEditEventModal(false)
                    setEditingEvent(null)
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingEvent.title}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          defaultValue={editingEvent.description}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="4"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date *
                          </label>
                          <input
                            type="date"
                            defaultValue={editingEvent.date}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time *
                          </label>
                          <input
                            type="time"
                            defaultValue={editingEvent.time}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingEvent.location}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Attendees *
                          </label>
                          <input
                            type="number"
                            defaultValue={editingEvent.maxAttendees}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($) *
                          </label>
                          <input
                            type="number"
                            defaultValue={editingEvent.price}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Changes Made / Response to Feedback
                        </label>
                        <textarea
                          placeholder="Describe what you've changed to address the rejection feedback..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditEventModal(false)
                          setEditingEvent(null)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Resubmit for Approval
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        {showEditClubModal && editingClub && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setShowEditClubModal(false)
                  setEditingClub(null)
                }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Edit & Resubmit Club</h2>
                      <p className="text-purple-100 mt-1">Address the rejection feedback and resubmit</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditClubModal(false)
                        setEditingClub(null)
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rejection Reason Alert */}
                  {editingClub.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Previous Rejection Reason:</p>
                          <p className="text-sm text-red-700">{editingClub.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    toast.success('Club resubmitted for approval!')
                    setShowEditClubModal(false)
                    setEditingClub(null)
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          defaultValue={editingClub.name}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          defaultValue={editingClub.category}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="academic">Academic</option>
                          <option value="arts">Arts</option>
                          <option value="sports">Sports</option>
                          <option value="technology">Technology</option>
                          <option value="cultural">Cultural</option>
                          <option value="social">Social</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          defaultValue={editingClub.description}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="4"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mission Statement
                        </label>
                        <textarea
                          placeholder="What is the club's mission and goals?"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Changes Made / Response to Feedback
                        </label>
                        <textarea
                          placeholder="Describe what you've changed to address the rejection feedback..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditClubModal(false)
                          setEditingClub(null)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Resubmit for Approval
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
