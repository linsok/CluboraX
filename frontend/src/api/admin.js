import axios from 'axios'
import { apiClient } from './client'

// Create separate axios instance for admin APIs
const adminClient = axios.create({
  baseURL: 'http://localhost:8000',
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

export const getAdminRequests = async () => {
  try {
    const response = await adminClient.get('/api/admin/proposals/')
    // Handle different response formats
    return response.data?.proposals || response.data || []
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

export const updateRequestStatus = async (requestId, status, comment = '') => {
  try {
    let endpoint;
    if (status === 'approved') {
      endpoint = `/api/admin/proposals/${requestId}/approve/`;
    } else if (status === 'rejected') {
      endpoint = `/api/admin/proposals/${requestId}/reject/`;
    } else {
      throw new Error('Invalid status update');
    }
    
    const response = await adminClient.post(endpoint, { comment });
    return response.data?.data || response.data;
  } catch (error) {
    throw error.response?.data || error;
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
