import axios from 'axios'
import { apiClient } from './client'

// Create separate axios instance for admin APIs
const adminClient = axios.create({
  baseURL: 'http://localhost:8888',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add admin token
adminClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle admin auth errors
adminClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Admin token expired or invalid
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// Admin API functions
export const adminLogin = async (credentials) => {
  try {
    const response = await adminClient.post('/api/admin/login/', credentials)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const adminLogout = async () => {
  try {
    const response = await adminClient.post('/api/admin/logout/')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminUsers = async () => {
  try {
    const response = await adminClient.get('/api/admin/users/')
    // Handle different response formats - users are in results property
    return response.data?.results || response.data?.data?.results || response.data || []
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminRequests = async (filters = {}) => {
  try {
    // Add cache-busting parameter to force fresh data from backend
    const timestamp = new Date().getTime()
    let url = `/api/admin/requests/?_t=${timestamp}`
    
    // Add filter parameters if provided
    if (filters.proposalType && filters.proposalType !== 'all') {
      url += `&proposal_type=${filters.proposalType}`
    }
    if (filters.status && filters.status !== 'all') {
      url += `&status=${filters.status}`
    }
    if (filters.submittedBy && filters.submittedBy !== 'all') {
      url += `&submitted_by_role=${filters.submittedBy}`
    }
    
    const response = await adminClient.get(url)
    // Handle different response formats
    return response.data?.data || response.data || []
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await adminClient.patch(`/api/admin/users/${userId}/`, { 
      is_active: status 
    })
    return response.data?.data || response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateRequestStatus = async (requestId, status, comments = null) => {
  try {
    const payload = { status }
    if (comments) {
      payload.comments = comments
    }
    const response = await adminClient.patch(`/api/admin/requests/${requestId}/`, payload)
    return response.data?.data || response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminStats = async () => {
  try {
    const response = await adminClient.get('/api/admin/stats/')
    // Handle different response formats - stats are in data property
    return response.data?.data || response.data || {}
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminClubs = async () => {
  try {
    const response = await adminClient.get('/api/clubs/')
    return response.data?.results || response.data || []
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminEvents = async () => {
  try {
    const response = await adminClient.get('/api/events/')
    return response.data?.results || response.data || []
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAdminClubProposals = async () => {
  try {
    const response = await adminClient.get('/api/proposals/clubs/')
    return response.data?.results || response.data || []
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateClubStatus = async (clubId, status, reason = '') => {
  try {
    const response = await adminClient.patch(`/api/admin/requests/${clubId}/`, { status, reason })
    return response.data?.data || response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateEventStatus = async (eventId, status, reason = '') => {
  try {
    const response = await adminClient.patch(`/api/admin/requests/${eventId}/`, { status, reason })
    return response.data?.data || response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const updateClubProposalStatus = async (proposalId, status, reason = '') => {
  try {
    const response = await adminClient.patch(`/api/proposals/clubs/${proposalId}/`, {
      status,
      review_comments: reason,
    })
    return response.data?.data || response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Event Proposal Actions
export const approveEventProposal = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/events/${proposalId}/approve/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const rejectEventProposal = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/events/${proposalId}/reject/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const returnEventProposalForRevision = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/events/${proposalId}/return_for_revision/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const publishEventProposal = async (proposalId) => {
  try {
    const response = await adminClient.post(`/api/proposals/events/${proposalId}/publish/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Club Proposal Actions
export const approveClubProposal = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/clubs/${proposalId}/approve/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const rejectClubProposal = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/clubs/${proposalId}/reject/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const returnClubProposalForRevision = async (proposalId, comments = '') => {
  try {
    const response = await adminClient.post(`/api/proposals/clubs/${proposalId}/return_for_revision/`, { comments })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const publishClubProposal = async (proposalId) => {
  try {
    const response = await adminClient.post(`/api/proposals/clubs/${proposalId}/publish/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Get full proposal details for display in admin detail modal
export const getFullClubProposal = async (proposalId) => {
  try {
    const response = await adminClient.get(`/api/proposals/clubs/${proposalId}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getFullEventProposal = async (proposalId) => {
  try {
    const response = await adminClient.get(`/api/proposals/events/${proposalId}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Event Status Management (for organizer-created events)
export const approveEvent = async (eventId, comments = '') => {
  try {
    const response = await adminClient.patch(`/api/events/${eventId}/`, { 
      status: 'approved',
      review_comments: comments 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const rejectEvent = async (eventId, reason = '') => {
  try {
    const response = await adminClient.patch(`/api/events/${eventId}/`, { 
      status: 'rejected',
      review_comments: reason 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const publishEvent = async (eventId) => {
  try {
    const response = await adminClient.patch(`/api/events/${eventId}/`, { 
      status: 'published'
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const returnEventForRevision = async (eventId, comments = '') => {
  try {
    const response = await adminClient.patch(`/api/events/${eventId}/`, { 
      status: 'draft',
      review_comments: comments 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Club Status Management (for organizer-created clubs)
export const approveClub = async (clubId, comments = '') => {
  try {
    const response = await adminClient.patch(`/api/clubs/${clubId}/`, { 
      status: 'approved',
      review_comments: comments 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const rejectClub = async (clubId, reason = '') => {
  try {
    const response = await adminClient.patch(`/api/clubs/${clubId}/`, { 
      status: 'rejected',
      review_comments: reason 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const publishClub = async (clubId) => {
  try {
    const response = await adminClient.patch(`/api/clubs/${clubId}/`, { 
      status: 'published'
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const returnClubForRevision = async (clubId, comments = '') => {
  try {
    const response = await adminClient.patch(`/api/clubs/${clubId}/`, { 
      status: 'pending',
      review_comments: comments 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}
