import { apiClient } from './client'

// ── Club CRUD ──────────────────────────────────────────────────────────────────

export const getClubs = async (params = {}) => {
  const res = await apiClient.get('/api/clubs/', { params })
  return res.data?.results ?? res.data ?? []
}

export const getClub = async (id) => {
  const res = await apiClient.get(`/api/clubs/${id}/`)
  return res.data
}

export const createClub = async (data) => {
  const res = await apiClient.post('/api/clubs/', data)
  return res.data
}

export const updateClub = async (id, data) => {
  const res = await apiClient.patch(`/api/clubs/${id}/`, data)
  return res.data
}

export const deleteClub = async (id) => {
  await apiClient.delete(`/api/clubs/${id}/`)
}

// ── Club Stats ─────────────────────────────────────────────────────────────────

export const getClubStats = async () => {
  try {
    const res = await apiClient.get('/api/clubs/stats/')
    return res.data
  } catch {
    return { total_clubs: 0, active_clubs: 0 }
  }
}

// ── Memberships ────────────────────────────────────────────────────────────────

export const getClubMemberships = async (params = {}) => {
  const res = await apiClient.get('/api/clubs/memberships/', { params })
  return res.data?.results ?? res.data ?? []
}

/** Returns the list of memberships for a specific club (organizer view) */
export const getClubMembers = async (clubId) => {
  const res = await apiClient.get('/api/clubs/memberships/', {
    params: { club: clubId, page_size: 500 },
  })
  return res.data?.results ?? res.data ?? []
}

export const joinClub = async (clubId) => {
  const res = await apiClient.post('/api/clubs/memberships/', { club: clubId })
  return res.data
}

export const leaveClub = async (membershipId) => {
  await apiClient.delete(`/api/clubs/memberships/${membershipId}/`)
}

export const updateMembershipStatus = async (membershipId, action) => {
  // action: 'approve' | 'reject' | 'ban' | 'promote'
  const res = await apiClient.post(
    `/api/clubs/memberships/${membershipId}/action/`,
    { action }
  )
  return res.data
}

// ── Club Approvals (admin/approver) ───────────────────────────────────────────

export const getClubApprovals = async () => {
  const res = await apiClient.get('/api/clubs/approvals/')
  return res.data?.results ?? res.data ?? []
}

export const actionClubApproval = async (approvalId, action, reason = '') => {
  const res = await apiClient.post(`/api/clubs/approvals/${approvalId}/action/`, {
    action,
    reason,
  })
  return res.data
}

// ── Club Activities ────────────────────────────────────────────────────────────

export const getClubActivities = async (params = {}) => {
  const res = await apiClient.get('/api/clubs/activities/', { params })
  return res.data?.results ?? res.data ?? []
}

export const createClubActivity = async (data) => {
  const res = await apiClient.post('/api/clubs/activities/', data)
  return res.data
}

// ── Club Announcements ─────────────────────────────────────────────────────────

export const getClubAnnouncements = async (params = {}) => {
  const res = await apiClient.get('/api/clubs/announcements/', { params })
  return res.data?.results ?? res.data ?? []
}

export const createClubAnnouncement = async (data) => {
  const res = await apiClient.post('/api/clubs/announcements/', data)
  return res.data
}

// ── Club Resources ─────────────────────────────────────────────────────────────

export const getClubResources = async (params = {}) => {
  const res = await apiClient.get('/api/clubs/resources/', { params })
  return res.data?.results ?? res.data ?? []
}

export const createClubResource = async (data) => {
  const res = await apiClient.post('/api/clubs/resources/', data)
  return res.data
}

// ── Club Feedback ──────────────────────────────────────────────────────────────

export const submitClubFeedback = async (data) => {
  const res = await apiClient.post('/api/clubs/feedback/', data)
  return res.data
}
