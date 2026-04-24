import { apiClient } from './client'

// ── Payments ───────────────────────────────────────────────────────────────────

export const getPayments = async (params = {}) => {
  const res = await apiClient.get('/api/payments/', { params })
  return res.data?.results ?? res.data ?? []
}

export const getPayment = async (id) => {
  const res = await apiClient.get(`/api/payments/${id}/`)
  return res.data
}

export const createPayment = async (data) => {
  const res = await apiClient.post('/api/payments/', data)
  return res.data
}

export const updatePaymentStatus = async (id, status) => {
  const res = await apiClient.patch(`/api/payments/${id}/`, { status })
  return res.data
}

// ── Fee Submissions (organizer pays platform fee for paid event) ───────────────

/** Organizer submits proof of platform-fee payment */
export const getFeeSubmissions = async (params = {}) => {
  const res = await apiClient.get('/api/payments/fee-submissions/', { params })
  return res.data?.results ?? res.data ?? []
}

export const createFeeSubmission = async (data) => {
  const isFormData = data instanceof FormData
  const res = await apiClient.post('/api/payments/fee-submissions/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return res.data
}

export const reviewFeeSubmission = async (id, action, note = '') => {
  // action: 'confirm' | 'reject'
  const res = await apiClient.patch(`/api/payments/fee-submissions/${id}/`, {
    action,
    note,
  })
  return res.data
}

// ── Payment Stats (admin) ──────────────────────────────────────────────────────

export const getPaymentStats = async () => {
  try {
    const res = await apiClient.get('/api/payments/stats/')
    return res.data
  } catch {
    return { total_revenue: 0, pending_count: 0, confirmed_count: 0 }
  }
}
