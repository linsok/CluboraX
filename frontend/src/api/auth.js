import { apiClient } from './client'

// Register a new user
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/api/auth/register/', userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Login user
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/api/auth/login/', credentials)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Logout user
export const logout = async () => {
  try {
    const response = await apiClient.post('/api/auth/logout/')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Verify OTP
export const verifyOTP = async (otpData) => {
  try {
    const response = await apiClient.post('/api/auth/verify-otp/', otpData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/profile/')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Refresh token
export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/api/auth/refresh-token/')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await apiClient.post('/api/auth/change-password/', passwordData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}
