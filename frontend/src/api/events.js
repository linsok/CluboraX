import { apiClient } from './client'

// ── Event CRUD ─────────────────────────────────────────────────────────────────

export const getEvents = async (params = {}) => {
  const res = await apiClient.get('/api/events/', { params })
  return res.data?.results ?? res.data ?? []
}

export const getEvent = async (id) => {
  const res = await apiClient.get(`/api/events/${id}/`)
  return res.data
}

export const createEvent = async (data) => {
  const isFormData = data instanceof FormData
  const res = await apiClient.post('/api/events/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return res.data
}

export const updateEvent = async (id, data) => {
  const isFormData = data instanceof FormData
  const res = await apiClient.patch(`/api/events/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return res.data
}

export const deleteEvent = async (id) => {
  await apiClient.delete(`/api/events/${id}/`)
}

// ── Event Stats ────────────────────────────────────────────────────────────────

export const getEventStats = async () => {
  try {
    const res = await apiClient.get('/api/events/stats/')
    return res.data
  } catch {
    return { total_events: 0, upcoming_events: 0, total_registrations: 0 }
  }
}

// ── Event Calendar ─────────────────────────────────────────────────────────────

export const getEventCalendar = async (params = {}) => {
  const res = await apiClient.get('/api/events/calendar/', { params })
  return res.data?.results ?? res.data ?? []
}

// ── Registrations ──────────────────────────────────────────────────────────────

export const getRegistrations = async (params = {}) => {
  const res = await apiClient.get('/api/events/registrations/', { params })
  return res.data?.results ?? res.data ?? []
}

/** Returns registrations for a specific event (organizer view) */
export const getEventRegistrations = async (eventId) => {
  const res = await apiClient.get('/api/events/registrations/', {
    params: { event: eventId, page_size: 500 },
  })
  return res.data?.results ?? res.data ?? []
}

export const registerForEvent = async (data) => {
  const res = await apiClient.post('/api/events/registrations/', data)
  return res.data
}

export const updateRegistration = async (id, data) => {
  const isFormData = data instanceof FormData
  const res = await apiClient.patch(`/api/events/registrations/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return res.data
}

export const cancelRegistration = async (id) => {
  await apiClient.delete(`/api/events/registrations/${id}/`)
}

// ── Check-In ───────────────────────────────────────────────────────────────────

export const checkInAttendee = async (data) => {
  const res = await apiClient.post('/api/events/check-in/', data)
  return res.data
}

// ── Event Approvals ────────────────────────────────────────────────────────────

export const getEventApprovals = async () => {
  const res = await apiClient.get('/api/events/approvals/')
  return res.data?.results ?? res.data ?? []
}

export const actionEventApproval = async (approvalId, action, reason = '') => {
  const res = await apiClient.post(`/api/events/approvals/${approvalId}/action/`, {
    action,
    reason,
  })
  return res.data
}

// ── Event Feedback ─────────────────────────────────────────────────────────────

export const submitEventFeedback = async (data) => {
  const res = await apiClient.post('/api/events/feedback/', data)
  return res.data
}

export const getEventFeedback = async (params = {}) => {
  const res = await apiClient.get('/api/events/feedback/', { params })
  return res.data?.results ?? res.data ?? []
}

// ── Event Media ────────────────────────────────────────────────────────────────

export const uploadEventMedia = async (data) => {
  const res = await apiClient.post('/api/events/media/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
