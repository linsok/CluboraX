// Authentication utilities for API calls

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('access_token')
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token')
      window.location.href = '/login'
      throw new Error('Authentication expired')
    }
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

export const getApiUrl = (endpoint) => {
  const baseUrl = 'http://localhost:8000/api/admin/api'
  return `${baseUrl}${endpoint}`
}

// API endpoints
export const API_ENDPOINTS = {
  DASHBOARD_STATS: '/dashboard-stats/',
  USER_STATS: '/user-stats/',
  PROPOSAL_STATS: '/proposal-stats/',
  USERS: '/users/',
  PROPOSALS: '/proposals/',
  SYSTEM_HEALTH: '/system-health/',
  RECENT_ACTIVITIES: '/recent-activities/',
  UPCOMING_EVENTS: '/upcoming-events/',
  ACTIVATE_USER: (userId) => `/users/${userId}/activate/`,
  DEACTIVATE_USER: (userId) => `/users/${userId}/deactivate/`,
  VERIFY_USER: (userId) => `/users/${userId}/verify/`,
  APPROVE_PROPOSAL: (proposalId) => `/proposals/${proposalId}/approve/`,
  REJECT_PROPOSAL: (proposalId) => `/proposals/${proposalId}/reject/`,
  DELETE_PROPOSAL: (proposalId) => `/proposals/${proposalId}/`
}
