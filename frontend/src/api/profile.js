import { apiClient } from './client'

// ── Profile CRUD ───────────────────────────────────────────────────────────────

export const getProfile = async () => {
  const res = await apiClient.get('/api/auth/profile/')
  return res.data
}

export const updateProfile = async (data) => {
  const isFormData = data instanceof FormData
  const res = await apiClient.patch('/api/auth/profile/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return res.data
}

export const getExtendedProfile = async () => {
  const res = await apiClient.get('/api/auth/profile/extended/')
  return res.data
}

// ── Password ───────────────────────────────────────────────────────────────────

export const changePassword = async (data) => {
  const res = await apiClient.post('/api/auth/change-password/', data)
  return res.data
}

export const requestPasswordReset = async (email) => {
  const res = await apiClient.post('/api/auth/password-reset/', { email })
  return res.data
}

export const confirmPasswordReset = async (data) => {
  const res = await apiClient.post('/api/auth/password-reset-confirm/', data)
  return res.data
}

// ── Achievements & Certificates ────────────────────────────────────────────────

export const getAchievements = async () => {
  const res = await apiClient.get('/api/auth/achievements/')
  return res.data?.results ?? res.data ?? []
}

export const getCertificates = async () => {
  const res = await apiClient.get('/api/auth/certificates/')
  return res.data?.results ?? res.data ?? []
}

export const getAnalytics = async () => {
  const res = await apiClient.get('/api/auth/analytics/')
  return res.data ?? {}
}

// ── User Activity ──────────────────────────────────────────────────────────────

export const getUserActivity = async () => {
  const res = await apiClient.get('/api/auth/activity/')
  return res.data?.results ?? res.data ?? []
}

// ── User List (admin) ──────────────────────────────────────────────────────────

export const getUserList = async (params = {}) => {
  const res = await apiClient.get('/api/auth/list/', { params })
  return res.data?.results ?? res.data ?? []
}
