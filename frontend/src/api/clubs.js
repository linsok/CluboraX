import { apiClient } from './client'

// Get user's club requests/memberships
export const getUserClubRequests = async () => {
  try {
    console.log('Fetching club memberships...')
    const response = await apiClient.get('/api/clubs/memberships/')
    console.log('Club memberships response:', response.data)
    return response.data?.results || response.data || []
  } catch (error) {
    console.error('Error fetching club memberships:', error)
    throw error.response?.data || error
  }
}

// Submit club membership request
export const submitClubRequest = async (clubId, formData) => {
  try {
    const response = await apiClient.post('/api/clubs/memberships/', {
      club: clubId,
      ...formData
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Get user's club proposals (for students who created clubs)
export const getUserClubProposals = async () => {
  try {
    console.log('Fetching user club proposals from /api/admin/proposals/user/')
    // Use the admin endpoint with user-specific filtering
    const response = await apiClient.get('/api/admin/proposals/user/')
    console.log('User club proposals response:', response.data)
    // The backend already filters for club proposals
    return response.data || []
  } catch (error) {
    console.error('Error fetching user club proposals:', error)
    // If the user endpoint doesn't exist, return empty array
    if (error.response?.status === 404 || error.response?.status === 403) {
      console.log('User proposals endpoint not found, returning empty array')
      return []
    }
    throw error.response?.data || error
  }
}
