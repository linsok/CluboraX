import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  PlusIcon, 
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  getEventProposals, 
  getClubProposals, 
  deleteEventProposal, 
  deleteClubProposal,
  createEventProposal,
  createClubProposal,
  resubmitEventProposal,
  resubmitClubProposal
} from '../api/proposals'
import toast from 'react-hot-toast'

const Proposals = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showClubModal, setShowClubModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState(null)
  const [revisedEventProposal, setRevisedEventProposal] = useState(null)
  const [revisedClubProposal, setRevisedClubProposal] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Please login to view proposals')
      navigate('/login')
    }
  }, [navigate])
  
  // Fetch event proposals
  const { data: eventProposals = [], isLoading: loadingEvents, error: eventError } = useQuery({
    queryKey: ['my-event-proposals'],
    queryFn: getEventProposals,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch event proposals:', error)
    }
  })
  
  // Fetch club proposals
  const { data: clubProposals = [], isLoading: loadingClubs, error: clubError } = useQuery({
    queryKey: ['my-club-proposals'],
    queryFn: getClubProposals,
    retry: 1,
    onError: (error) => {
      console.error('Failed to fetch club proposals:', error)
    }
  })
  
  // Ensure arrays (handle cases where API returns non-array data)
  const safeEventProposals = Array.isArray(eventProposals) ? eventProposals : []
  const safeClubProposals = Array.isArray(clubProposals) ? clubProposals : []
  
  // Combine all proposals
  const allProposals = [
    ...safeEventProposals.map(p => ({ ...p, type: 'event' })),
    ...safeClubProposals.map(p => ({ ...p, type: 'club' }))
  ]
  
  // Filter proposals based on active tab
  const filteredProposals = activeTab === 'all'
    ? allProposals
    : allProposals.filter(p => p.status === activeTab)
  
  // Check for errors
  const hasError = eventError || clubError
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'returned': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-5 h-5" />
      case 'rejected': return <XCircleIcon className="w-5 h-5" />
      case 'returned': return <ArrowPathIcon className="w-5 h-5" />
      case 'pending': return <ClockIcon className="w-5 h-5" />
      default: return <ClockIcon className="w-5 h-5" />
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <DocumentTextIcon className="w-10 h-10 text-indigo-600" />
                My Proposals
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your event and club proposals
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                New Event Proposal
              </button>
              <button
                onClick={() => setShowClubModal(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                New Club Proposal
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'all', label: 'All Proposals' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'returned', label: 'Returned for Revision' },
              { id: 'rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Proposals Grid */}
        {hasError ? (
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading proposals</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {eventError?.message || clubError?.message || 'Unable to fetch proposals.'}
            </p>
            {(eventError?.response?.status === 401 || clubError?.response?.status === 401) && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Authentication required. Please log in again.
              </p>
            )}
            {eventError?.code === 'ERR_NETWORK' || clubError?.code === 'ERR_NETWORK' ? (
              <div className="mt-4">
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  Cannot connect to server. Please check:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                  <li>Backend server is running on port 8888</li>
                  <li>Network connection is stable</li>
                  <li>No firewall blocking the connection</li>
                </ul>
              </div>
            ) : null}
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
              {(eventError?.response?.status === 401 || clubError?.response?.status === 401) && (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        ) : loadingEvents || loadingClubs ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No proposals</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new event or club proposal.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map(proposal => (
              <ProposalCard 
                key={`${proposal.type}-${proposal.id}`} 
                proposal={proposal} 
                onEdit={setEditingProposal}
                onRevise={(p) => p.type === 'event' ? setRevisedEventProposal(p) : setRevisedClubProposal(p)}
                queryClient={queryClient}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modals would go here */}
      {showEventModal && <EventProposalModal onClose={() => setShowEventModal(false)} />}
      {showClubModal && <ClubProposalModal onClose={() => setShowClubModal(false)} />}
      {revisedEventProposal && (
        <EventRevisionModal
          proposal={revisedEventProposal}
          onClose={() => setRevisedEventProposal(null)}
          queryClient={queryClient}
        />
      )}
      {revisedClubProposal && (
        <ClubRevisionModal
          proposal={revisedClubProposal}
          onClose={() => setRevisedClubProposal(null)}
          queryClient={queryClient}
        />
      )}
    </div>
  )
}

const ProposalCard = ({ proposal, onEdit, onRevise, queryClient, getStatusColor, getStatusIcon }) => {
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
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      deleteProposalMutation.mutate(proposal.id)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden"
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
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {proposal.type} Proposal
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {proposal.title || proposal.name}
            </h3>
          </div>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            {proposal.status}
          </span>
        </div>
        
        {/* Content */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {proposal.description || proposal.mission}
        </p>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          {proposal.type === 'event' ? (
            <>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {new Date(proposal.proposed_date).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {proposal.venue}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="w-4 h-4 mr-2" />
                {proposal.expected_participants} participants
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="w-4 h-4 mr-2" />
                Expected members: {proposal.expected_members}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Type: {proposal.club_type}
              </div>
            </>
          )}
        </div>
        
        {/* Review Comments */}
        {proposal.review_comments && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Admin Feedback:</p>
            <p className="text-sm text-red-800 dark:text-red-200">{proposal.review_comments}</p>
          </div>
        )}

        {/* Resubmission count badge */}
        {proposal.resubmission_count > 0 && (
          <div className="mb-3">
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
              Revised {proposal.resubmission_count}x
            </span>
          </div>
        )}
        
        {/* Actions */}
        {proposal.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onEdit(proposal)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteProposalMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Revise & Resubmit button for rejected/returned proposals */}
        {(proposal.status === 'rejected' || proposal.status === 'returned_for_revision') && (
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRevise(proposal); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4" />
              Revise &amp; Resubmit
            </button>
          </div>
        )}
        
        {/* Submission Date */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Submitted {new Date(proposal.submitted_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Event Proposal Modal Component
const EventProposalModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    eventTitle: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    province: '',
    specificLocation: '',
    venue: '',
    capacity: '',
    ticketPrice: '0',
    catering: '',
    sponsor: '',
    budget: '',
    eventDurationDays: '1',
    eventDate: '',
    startDate: '',
    endDate: '',
    description: '',
    payment_method: ''
  })
  const [scheduleFile, setScheduleFile] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  const queryClient = useQueryClient()

  const provinces = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kandal', 'Takeo', 'Sihanoukville', 'Kampot', 'Banteay Meanchey', 'Kampong Speu', 'Kampong Thom', 'Preah Sihanouk', 'Svay Rieng', 'Koh Kong', 'Pailin', 'Oddar Meanchey', 'Ratanakiri', 'Stung Treng', 'Mondulkiri', 'Preah Vihear', 'Kampong Chhnang', 'Kep', 'Kratie']

  const checkPaymentRequirement = () => {
    const { venue, capacity, ticketPrice, catering, sponsor, budget } = formData
    const p = parseInt(capacity || 0)
    const tp = parseFloat(ticketPrice || 0)
    const b = parseFloat(budget || 0)

    let msg = ''
    let show = false

    if (venue === 'Auditorium' || venue === 'Sports Field') {
      msg = 'Payment required: Rental fee for campus facilities.'
      show = true
    } else if (catering === 'Yes') {
      msg = 'Payment required: Estimated cost for catering/refreshments.'
      show = true
    } else if (sponsor === 'Yes') {
      msg = 'Payment waived: Sponsored by external organization.'
      show = false
    } else if (b > 500) {
      msg = 'Payment required: Budget exceeds threshold; organizer contributes.'
      show = true
    }

    if (tp > 0 && p > 0) {
      const ticketPayment = (tp * p * 0.05).toFixed(2)
      msg += `\nTicket Revenue Payment: $${ticketPayment} (5% of total ticket revenue)`
      show = true
    }

    if (msg === '') {
      msg = 'No payment required for this event.'
      show = false
    }

    setPaymentMessage(msg)
    setShowPayment(show)
  }

  useEffect(() => {
    checkPaymentRequirement()
  }, [formData.venue, formData.capacity, formData.ticketPrice, formData.catering, formData.sponsor, formData.budget])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate multi-day event dates
    const durationDays = parseInt(formData.eventDurationDays) || 1
    if (durationDays > 1) {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please provide both start and end dates for multi-day events!')
        return
      }
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast.error('End date must be after start date!')
        return
      }
    } else {
      if (!formData.eventDate) {
        toast.error('Please provide an event date!')
        return
      }
    }
    
    try {
      const payload = {
        title: formData.eventTitle,
        eventTitle: formData.eventTitle,
        description: formData.description || '',
        organizerName: formData.organizerName,
        organizerEmail: formData.organizerEmail,
        organizerPhone: formData.organizerPhone,
        province: formData.province,
        specificLocation: formData.specificLocation,
        venue: formData.venue,
        capacity: parseInt(formData.capacity) || 0,
        expected_participants: parseInt(formData.capacity) || 0,
        ticketPrice: parseFloat(formData.ticketPrice) || 0,
        catering: formData.catering,
        sponsor: formData.sponsor,
        budget: parseFloat(formData.budget) || 0,
        total_budget: parseFloat(formData.budget) || 0,
        eventDurationDays: durationDays,
        eventDate: durationDays === 1 ? formData.eventDate : null,
        startDate: durationDays > 1 ? formData.startDate : null,
        endDate: durationDays > 1 ? formData.endDate : null,
        proposed_date: durationDays === 1 ? formData.eventDate : formData.startDate,
        payment_method: formData.payment_method || null,
        budget_items: [],
      }
      await createEventProposal(payload)
      toast.success('Event proposal submitted successfully!')
      queryClient.invalidateQueries(['my-event-proposals'])
      onClose()
    } catch (error) {
      console.error('Submission error:', error)
      const errData = error?.response?.data
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        toast.error(`Submission failed: ${msgs}`)
      } else {
        toast.error('Failed to submit event proposal')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campus Event Proposal Form</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Title *</label>
              <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Name *</label>
              <input type="text" name="organizerName" value={formData.organizerName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Email *</label>
              <input type="email" name="organizerEmail" value={formData.organizerEmail} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Phone *</label>
              <input type="tel" name="organizerPhone" value={formData.organizerPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Province (Cambodia) *</label>
              <select name="province" value={formData.province} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specific Location *</label>
              <input type="text" name="specificLocation" value={formData.specificLocation} onChange={handleInputChange} required disabled={!formData.province} placeholder="Street, Building, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Venue Type *</label>
              <select name="venue" value={formData.venue} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Venue</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Sports Field">Sports Field</option>
                <option value="Classroom">Classroom</option>
                <option value="Outdoor Area">Outdoor Area</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Capacity (Max Participants) *</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ticket Price (USD, 0 if free) *</label>
              <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">How many days will the event run? *</label>
              <select name="eventDurationDays" value={formData.eventDurationDays} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
                <option value="6">6 Days</option>
                <option value="7">7 Days (1 Week)</option>
              </select>
            </div>
          </div>

          {parseInt(formData.eventDurationDays) === 1 ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Date *</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Require Catering/Refreshments? *</label>
              <select name="catering" value={formData.catering} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sponsored by External Organization? *</label>
              <select name="sponsor" value={formData.sponsor} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Budget (USD)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload Schedule File *</label>
              <input type="file" onChange={(e) => setScheduleFile(e.target.files[0])} required accept=".pdf,.doc,.docx,.xlsx" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Description *</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>

          {showPayment && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Payment Requirement</h4>
              <p className="text-yellow-800 dark:text-yellow-200 whitespace-pre-line mb-4">{paymentMessage}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Payment Method *</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} required className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">--Select Payment Method--</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_payment">Mobile Payment (Wing, Pi Pay, etc.)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Club Proposal Modal Component
const ClubProposalModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    clubName: '',
    department: '',
    mission: '',
    missionOther: '',
    startDate: '',
    endDate: '',
    advisorName: '',
    advisorEmail: '',
    advisorPhone: '',
    leaderName: '',
    leaderPhone: '',
    leaderGender: ''
  })
  const [members, setMembers] = useState([])
  const [studentCard, setStudentCard] = useState(null)
  const queryClient = useQueryClient()

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const addMember = () => {
    setMembers([...members, { name: '', gender: '', phone: '' }])
  }

  const updateMember = (index, field, value) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)
  }

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (members.length < 5) {
      toast.error('You must add at least 5 members!')
      return
    }

    const leaderExists = members.some(m => m.name.toLowerCase().trim() === formData.leaderName.toLowerCase().trim())
    if (!leaderExists) {
      toast.error('Leader must be one of the members!')
      return
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be after start date!')
      return
    }

    if (!studentCard) {
      toast.error('Please upload student card for verification!')
      return
    }

    try {
      // Map frontend form fields to backend model fields
      const missionTypeMap = {
        'Sports': 'sports',
        'Academic': 'academic',
        'Arts': 'arts',
        'Social': 'social',
        'Other': 'other'
      }
      const missionText = formData.mission === 'Other'
        ? (formData.missionOther || 'Other')
        : formData.mission

      const payload = {
        name: formData.clubName,
        club_type: missionTypeMap[formData.mission] || 'other',
        mission: missionText,
        description: formData.missionOther || missionText,
        objectives: missionText,
        activities: missionText,
        president_name: formData.leaderName,
        president_email: '',       // not collected in form; made optional in backend
        advisor_name: formData.advisorName || '',
        advisor_email: formData.advisorEmail || '',
        expected_members: members.length,
        requirements: formData.department || '',
      }

      await createClubProposal(payload)
      toast.success('Club proposal submitted successfully!')
      queryClient.invalidateQueries(['my-club-proposals'])
      onClose()
    } catch (error) {
      const errData = error?.response?.data
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        toast.error(`Submission failed: ${msgs}`)
      } else {
        toast.error('Failed to submit club proposal')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Club Proposal Form</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Club Name *</label>
              <input type="text" name="clubName" value={formData.clubName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department / Faculty *</label>
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mission / Goal *</label>
              <select name="mission" value={formData.mission} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">--Select Mission--</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Arts">Arts</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.mission === 'Other' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specify Mission</label>
                <input type="text" name="missionOther" value={formData.missionOther} onChange={handleInputChange} placeholder="Please specify" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advisor / Dean Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input type="text" name="advisorName" value={formData.advisorName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input type="email" name="advisorEmail" value={formData.advisorEmail} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                <input type="tel" name="advisorPhone" value={formData.advisorPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members (Minimum 5 required)</h3>
              <button type="button" onClick={addMember} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input type="text" placeholder="Member Name" value={member.name} onChange={(e) => updateMember(index, 'name', e.target.value)} required className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  <select value={member.gender} onChange={(e) => updateMember(index, 'gender', e.target.value)} required className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="tel" placeholder="Phone" value={member.phone} onChange={(e) => updateMember(index, 'phone', e.target.value)} required className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  <button type="button" onClick={() => removeMember(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {members.length < 5 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">You need to add at least {5 - members.length} more member(s)</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leader Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leader Name *</label>
                <input type="text" name="leaderName" value={formData.leaderName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leader Phone *</label>
                <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leader Gender *</label>
                <select name="leaderGender" value={formData.leaderGender} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload Student Card (For AI Verification) *</label>
            <input type="file" onChange={(e) => setStudentCard(e.target.files[0])} required accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Event Revision Modal – pre-filled with existing proposal data
// ─────────────────────────────────────────────────────────────────
const EventRevisionModal = ({ proposal, onClose, queryClient }) => {
  const provinces = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kandal', 'Takeo', 'Sihanoukville', 'Kampot', 'Banteay Meanchey', 'Kampong Speu', 'Kampong Thom', 'Preah Sihanouk', 'Svay Rieng', 'Koh Kong', 'Pailin', 'Oddar Meanchey', 'Ratanakiri', 'Stung Treng', 'Mondulkiri', 'Preah Vihear', 'Kampong Chhnang', 'Kep', 'Kratie']

  // Smart parsing: handle both old (combined "Auditorium, Main St, Koh Kong") and new (separate fields) formats
  const knownVenues = ['Auditorium', 'Conference Room', 'Outdoor Area', 'Sports Field', 'Online', 'Other']
  const rawVenue = proposal.venue || ''
  const venueParts = rawVenue.split(',').map(s => s.trim())
  const isOldFormat = venueParts.length > 1 && knownVenues.includes(venueParts[0])
  const parsedVenue = isOldFormat ? venueParts[0] : rawVenue
  const parsedSpecificLocation = proposal.specificLocation || (isOldFormat && venueParts[1]) || ''
  const parsedProvince = proposal.province || (isOldFormat && venueParts[2]) || ''

  const [formData, setFormData] = useState({
    eventTitle: proposal.title || proposal.eventTitle || '',
    organizerName: proposal.organizerName || '',
    organizerEmail: proposal.organizerEmail || '',
    organizerPhone: proposal.organizerPhone || '',
    venue: parsedVenue,
    specificLocation: parsedSpecificLocation,
    province: parsedProvince,
    eventDurationDays: String(proposal.eventDurationDays || 1),
    eventDate: proposal.eventDate || proposal.proposed_date || '',
    startDate: proposal.startDate || '',
    endDate: proposal.endDate || '',
    capacity: proposal.capacity || proposal.expected_participants || '',
    budget: proposal.budget || proposal.total_budget || '',
    description: proposal.description || '',
    ticketPrice: String(proposal.ticketPrice || 0),
    catering: proposal.catering || '',
    sponsor: proposal.sponsor || '',
    payment_method: proposal.payment_method || '',
    revision_notes: '',
  })
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  const checkPaymentRequirement = () => {
    const { venue, capacity, ticketPrice, catering, sponsor, budget } = formData
    const p = parseInt(capacity || 0)
    const tp = parseFloat(ticketPrice || 0)
    const b = parseFloat(budget || 0)

    let msg = ''
    let show = false

    if (venue === 'Auditorium' || venue === 'Sports Field') {
      msg = 'Payment required: Rental fee for campus facilities.'
      show = true
    } else if (catering === 'Yes') {
      msg = 'Payment required: Estimated cost for catering/refreshments.'
      show = true
    } else if (sponsor === 'Yes') {
      msg = 'Payment waived: Sponsored by external organization.'
      show = false
    } else if (b > 500) {
      msg = 'Payment required: Budget exceeds threshold; organizer contributes.'
      show = true
    }

    if (tp > 0 && p > 0) {
      const ticketPayment = (tp * p * 0.05).toFixed(2)
      msg += `\nTicket Revenue Payment: $${ticketPayment} (5% of total ticket revenue)`
      show = true
    }

    if (msg === '') {
      msg = 'No payment required for this event.'
      show = false
    }

    setPaymentMessage(msg)
    setShowPayment(show)
  }

  useEffect(() => {
    checkPaymentRequirement()
  }, [formData.venue, formData.capacity, formData.ticketPrice, formData.catering, formData.sponsor, formData.budget])

  const revisionMutation = useMutation({
    mutationFn: ({ id, data, files }) => resubmitEventProposal(id, data, files),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-event-proposals'])
      toast.success('Proposal resubmitted! It is now pending review.')
      onClose()
    },
    onError: (error) => {
      const errData = error?.response?.data
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        toast.error(`Resubmission failed: ${msgs}`)
      } else {
        toast.error('Failed to resubmit proposal')
      }
    }
  })

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachmentFiles(prev => [...prev, ...files])
    e.target.value = '' // Reset input to allow selecting same file again
  }

  const removeFile = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate multi-day event dates
    const durationDays = parseInt(formData.eventDurationDays) || 1
    if (durationDays > 1) {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please provide both start and end dates for multi-day events!')
        return
      }
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast.error('End date must be after start date!')
        return
      }
    } else {
      if (!formData.eventDate) {
        toast.error('Please provide an event date!')
        return
      }
    }

    if (!formData.eventTitle.trim()) { toast.error('Please fill in the event title'); return }
    if (!formData.venue) { toast.error('Please select the venue type'); return }
    if (!formData.province) { toast.error('Please select the province'); return }
    if (!formData.specificLocation.trim()) { toast.error('Please fill in the specific location'); return }
    if (!formData.capacity || parseInt(formData.capacity) < 1) { toast.error('Please enter expected number of participants'); return }
    if (!formData.description.trim()) { toast.error('Please fill in the event description'); return }
    
    const updateData = {
      title: formData.eventTitle,
      eventTitle: formData.eventTitle,
      description: formData.description,
      organizerName: formData.organizerName,
      organizerEmail: formData.organizerEmail,
      organizerPhone: formData.organizerPhone,
      province: formData.province,
      specificLocation: formData.specificLocation,
      venue: formData.venue,
      capacity: parseInt(formData.capacity) || 0,
      expected_participants: parseInt(formData.capacity) || 0,
      ticketPrice: parseFloat(formData.ticketPrice) || 0,
      catering: formData.catering,
      sponsor: formData.sponsor,
      budget: parseFloat(formData.budget) || 0,
      total_budget: parseFloat(formData.budget) || 0,
      eventDurationDays: durationDays,
      eventDate: durationDays === 1 ? formData.eventDate : null,
      startDate: durationDays > 1 ? formData.startDate : null,
      endDate: durationDays > 1 ? formData.endDate : null,
      proposed_date: durationDays === 1 ? formData.eventDate : formData.startDate,
      payment_method: formData.payment_method || null,
      revision_notes: formData.revision_notes,
      budget_items: [],
    }
    revisionMutation.mutate({ id: proposal.id, data: updateData, files: attachmentFiles })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revise Event Proposal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your proposal and resubmit for review</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Admin feedback banner */}
        {proposal.review_comments && (
          <div className={`mx-6 mt-4 p-4 border rounded-lg ${
            proposal.status === 'returned'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <p className={`text-sm font-semibold mb-1 ${
              proposal.status === 'returned'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {proposal.status === 'returned' ? 'Admin Feedback (Returned for Revision):' : 'Admin Rejection Reason:'}
            </p>
            <p className={`text-sm ${
              proposal.status === 'returned'
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-red-800 dark:text-red-200'
            }`}>{proposal.review_comments}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Title *</label>
              <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Name *</label>
              <input type="text" name="organizerName" value={formData.organizerName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Email *</label>
              <input type="email" name="organizerEmail" value={formData.organizerEmail} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organizer Phone *</label>
              <input type="tel" name="organizerPhone" value={formData.organizerPhone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Province (Cambodia) *</label>
              <select name="province" value={formData.province} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specific Location *</label>
              <input type="text" name="specificLocation" value={formData.specificLocation} onChange={handleInputChange} required disabled={!formData.province} placeholder="Street, Building, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Venue Type *</label>
              <select name="venue" value={formData.venue} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Venue</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Sports Field">Sports Field</option>
                <option value="Classroom">Classroom</option>
                <option value="Outdoor Area">Outdoor Area</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Capacity (Max Participants) *</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ticket Price (USD, 0 if free) *</label>
              <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">How many days will the event run? *</label>
              <select name="eventDurationDays" value={formData.eventDurationDays} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
                <option value="6">6 Days</option>
                <option value="7">7 Days (1 Week)</option>
              </select>
            </div>
          </div>

          {parseInt(formData.eventDurationDays) === 1 ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Date *</label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Require Catering/Refreshments? *</label>
              <select name="catering" value={formData.catering} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sponsored by External Organization? *</label>
              <select name="sponsor" value={formData.sponsor} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Budget (USD)</label>
            <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Description *</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>

          {showPayment && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Payment Requirement</h4>
              <p className="text-yellow-800 dark:text-yellow-200 whitespace-pre-line mb-4">{paymentMessage}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Payment Method *</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} required className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">--Select Payment Method--</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_payment">Mobile Payment (Wing, Pi Pay, etc.)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Revision Notes <span className="text-xs font-normal text-gray-400">(what you changed)</span></label>
              <textarea name="revision_notes" value={formData.revision_notes} onChange={handleInputChange} rows="3" placeholder="Briefly describe what you changed based on admin feedback..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload Documents <span className="text-xs font-normal text-gray-400">(optional - multiple files allowed)</span>
              </label>
              <input 
                type="file" 
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-300 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700"
              />
              {proposal.attachment && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Previous attachment kept. Upload new files to add more.</p>
              )}
            </div>

            {/* Display selected files */}
            {attachmentFiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Selected Files ({attachmentFiles.length}):</label>
                <div className="space-y-2">
                  {attachmentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={revisionMutation.isLoading} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50">
              {revisionMutation.isLoading ? 'Submitting...' : 'Resubmit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Club Revision Modal – pre-filled with existing proposal data
// ─────────────────────────────────────────────────────────────────
const ClubRevisionModal = ({ proposal, onClose, queryClient }) => {
  // Reverse-map stored club_type → select option value
  const clubTypeToMission = {
    sports: 'Sports',
    academic: 'Academic',
    arts: 'Arts',
    social: 'Social',
    technical: 'Other',
    other: 'Other',
  }
  const knownMissions = ['Sports', 'Academic', 'Arts', 'Social']
  const derivedMission = clubTypeToMission[proposal.club_type] || 'Other'
  // If mission text matches a known option use it; otherwise treat as custom
  const storedMission = proposal.mission || ''
  const missionSelectValue = knownMissions.includes(storedMission) ? storedMission : derivedMission
  const missionOtherValue = knownMissions.includes(storedMission) ? '' : storedMission

  const [formData, setFormData] = useState({
    clubName: proposal.name || '',
    department: proposal.requirements || '',
    mission: missionSelectValue,
    missionOther: missionOtherValue,
    startDate: proposal.start_date || '',
    endDate: proposal.end_date || '',
    advisorName: proposal.advisor_name || '',
    advisorEmail: proposal.advisor_email || '',
    advisorPhone: proposal.advisor_phone || '',  // May not be in DB
    leaderName: proposal.president_name || '',
    leaderPhone: proposal.president_phone || '',  // May not be in DB
    leaderGender: proposal.president_gender || '',  // May not be in DB
    revision_notes: '',
  })

  // Pre-populate member rows equal to the stored count (details not stored, need re-entry)
  const [members, setMembers] = useState(
    Array.from({ length: proposal.expected_members || 5 }, () => ({ name: '', gender: '', phone: '' }))
  )
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [studentCard, setStudentCard] = useState(null)

  const revisionMutation = useMutation({
    mutationFn: ({ id, data, files }) => resubmitClubProposal(id, data, files),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-club-proposals'])
      toast.success('Club proposal resubmitted! It is now pending review.')
      onClose()
    },
    onError: (error) => {
      const errData = error?.response?.data
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        toast.error(`Resubmission failed: ${msgs}`)
      } else {
        toast.error('Failed to resubmit club proposal')
      }
    }
  })

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const addMember = () => setMembers([...members, { name: '', gender: '', phone: '' }])
  const updateMember = (i, field, value) => {
    const updated = [...members]
    updated[i][field] = value
    setMembers(updated)
  }
  const removeMember = (i) => setMembers(members.filter((_, idx) => idx !== i))

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachmentFiles(prev => [...prev, ...files])
    e.target.value = '' // Reset input
  }

  const removeFile = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate dates
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast.error('End date must be after start date!')
        return
      }
    }
    
    // Guard: leaderName must be explicitly filled (empty '' would match all-empty member names)
    if (!formData.leaderName.trim()) { toast.error('Please enter the leader name'); return }
    if (members.length < 5) { toast.error('You must add at least 5 members!'); return }
    const allMembersFilled = members.every(m => m.name.trim() !== '' && m.gender !== '' && m.phone.trim() !== '')
    if (!allMembersFilled) { toast.error('Please fill in all member names, genders, and phone numbers'); return }
    const leaderExists = members.some(m => m.name.toLowerCase().trim() === formData.leaderName.toLowerCase().trim())
    if (!leaderExists) { toast.error('Leader must be one of the listed members!'); return }

    const missionTypeMap = { Sports: 'sports', Academic: 'academic', Arts: 'arts', Social: 'social', Other: 'other' }
    const missionText = formData.mission === 'Other' ? (formData.missionOther || 'Other') : formData.mission
    revisionMutation.mutate({
      id: proposal.id,
      data: {
        name: formData.clubName,
        club_type: missionTypeMap[formData.mission] || 'other',
        mission: missionText,
        description: formData.missionOther || missionText,
        objectives: missionText,
        activities: missionText,
        start_date: formData.startDate,
        end_date: formData.endDate,
        president_name: formData.leaderName,
        president_email: '',
        president_phone: formData.leaderPhone,
        president_gender: formData.leaderGender,
        advisor_name: formData.advisorName,
        advisor_email: formData.advisorEmail,
        advisor_phone: formData.advisorPhone,
        expected_members: members.length,
        requirements: formData.department,
        revision_notes: formData.revision_notes,
      },
      file: attachmentFiles,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revise Club Proposal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your proposal based on admin feedback and resubmit</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pt-4 space-y-4">
          {/* Admin feedback */}
          {proposal.review_comments && (
            <div className={`p-4 border rounded-lg ${
              proposal.status === 'returned'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            }`}>
              <p className={`text-sm font-semibold mb-1 ${
                proposal.status === 'returned'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {proposal.status === 'returned' ? 'Admin Feedback (Returned for Revision):' : 'Admin Rejection Reason:'}
              </p>
              <p className={`text-sm ${
                proposal.status === 'returned'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>{proposal.review_comments}</p>
            </div>
          )}

          {/* Info: which fields couldn't be pre-loaded */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Note:</span> Club name, department, mission, advisor, and leader name are pre-filled from your original submission.
            Member details and phone numbers are <span className="font-semibold">not stored</span> — please re-enter them below.
          </div>

          {/* Previous attachment */}
          {proposal.attachment && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center gap-3 text-sm">
              <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1">
                <span className="text-blue-800 dark:text-blue-200 font-medium">Previously attached file:</span>
                <a href={proposal.attachment} target="_blank" rel="noopener noreferrer"
                  className="ml-2 text-blue-600 dark:text-blue-400 underline break-all">
                  View / Download
                </a>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── Basic Info ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Club Name *</label>
              <input type="text" name="clubName" value={formData.clubName} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department / Faculty *</label>
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          {/* ── Mission ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mission / Goal *</label>
              <select name="mission" value={formData.mission} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">--Select Mission--</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Arts">Arts</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.mission === 'Other' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specify Mission *</label>
                <input type="text" name="missionOther" value={formData.missionOther} onChange={handleInputChange}
                  placeholder="Please specify" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            )}
          </div>

          {/* ── Start and End Dates ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>

          {/* ── Advisor / Dean Info ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advisor / Dean Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input type="text" name="advisorName" value={formData.advisorName} onChange={handleInputChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input type="email" name="advisorEmail" value={formData.advisorEmail} onChange={handleInputChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone <span className="text-xs font-normal text-gray-400">(optional – not on file)</span>
                </label>
                <input type="tel" name="advisorPhone" value={formData.advisorPhone} onChange={handleInputChange}
                  placeholder="Re-enter phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          </div>

          {/* ── Members ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {members.length} row(s) pre-added from your original count — please fill in names, genders, and phone numbers.
                </p>
              </div>
              <button type="button" onClick={addMember}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm">
                <PlusIcon className="w-4 h-4" /> Add Member
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {members.map((member, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
                  <input type="text" placeholder="Member Name *" value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)} required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                  <select value={member.gender} onChange={(e) => updateMember(index, 'gender', e.target.value)} required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                    <option value="">Gender *</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="tel" placeholder="Phone *" value={member.phone}
                    onChange={(e) => updateMember(index, 'phone', e.target.value)} required
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                  <button type="button" onClick={() => removeMember(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No members added yet. Click "Add Member" to begin.</p>
              )}
            </div>
            {members.length < 5 && (
              <p className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                ⚠ Need at least {5 - members.length} more member(s) to reach the minimum of 5.
              </p>
            )}
          </div>

          {/* ── Leader Info ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leader Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leader Name *</label>
                <input type="text" name="leaderName" value={formData.leaderName} onChange={handleInputChange} required
                  placeholder="Must match a member name above"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Leader Phone <span className="text-xs font-normal text-gray-400">(optional – not on file)</span>
                </label>
                <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleInputChange}
                  placeholder="Re-enter phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Leader Gender <span className="text-xs font-normal text-gray-400">(optional – not on file)</span>
                </label>
                <select name="leaderGender" value={formData.leaderGender} onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Student Card Upload ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Student Card <span className="text-xs font-normal text-gray-400">(optional - for verification)</span>
            </label>
            <input type="file" onChange={(e) => setStudentCard(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-300 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700" />
          </div>

          {/* ── Upload & Revision Notes ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload Documents <span className="text-xs font-normal text-gray-400">(student card, PDF, etc. - multiple files allowed)</span>
              </label>
              <input 
                type="file" 
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,image/*"
                className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-300 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700" 
              />
              {proposal.attachment && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Previous attachment kept. Upload new files to add more.</p>
              )}
            </div>

            {/* Display selected files */}
            {attachmentFiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Selected Files ({attachmentFiles.length}):</label>
                <div className="space-y-2">
                  {attachmentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Revision Notes <span className="text-xs font-normal text-gray-400">(what you changed)</span>
              </label>
              <textarea name="revision_notes" value={formData.revision_notes} onChange={handleInputChange} rows="4"
                placeholder="Briefly describe changes you made based on admin feedback..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none text-sm" />
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={revisionMutation.isLoading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2">
              {revisionMutation.isLoading
                ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>
                : 'Resubmit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Proposals
