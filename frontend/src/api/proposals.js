import { apiClient } from './client'

// Event Proposals API calls
export const getEventProposals = async () => {
  try {
    const response = await apiClient.get('/api/proposals/events/')
    const data = response.data
    // Handle both paginated {count, results:[...]} and plain array responses
    return Array.isArray(data) ? data : (data.results || [])
  } catch (error) {
    console.error('Error fetching event proposals:', error)
    throw error
  }
}

export const createEventProposal = async (proposalData) => {
  try {
    // Check if we have any file fields that require FormData
    const hasFile = proposalData.event_poster instanceof File || proposalData.agenda_pdf instanceof File
    
    if (hasFile) {
      // Use FormData for multipart/form-data when sending files
      const formData = new FormData()
      Object.entries(proposalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if ((key === 'event_poster' || key === 'agenda_pdf') && value instanceof File) {
            formData.append(key, value)
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, value)
          }
        }
      })
      const response = await apiClient.post('/api/proposals/events/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } else {
      // Regular JSON POST for non-file data
      // Remove empty strings for optional fields
      const cleanedData = Object.entries(proposalData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)) {
          acc[key] = value
        }
        return acc
      }, {})
      const response = await apiClient.post('/api/proposals/events/', cleanedData)
      return response.data
    }
  } catch (error) {
    console.error('Error creating event proposal:', error)
    throw error
  }
}

export const updateEventProposal = async (id, proposalData) => {
  try {
    const response = await apiClient.put(`/api/proposals/events/${id}/`, proposalData)
    return response.data
  } catch (error) {
    console.error('Error updating event proposal:', error)
    throw error
  }
}

export const deleteEventProposal = async (id) => {
  try {
    const response = await apiClient.delete(`/api/proposals/events/${id}/`)
    return response.data
  } catch (error) {
    console.error('Error deleting event proposal:', error)
    throw error
  }
}

// Club Proposals API calls
export const getClubProposals = async () => {
  try {
    const response = await apiClient.get('/api/proposals/clubs/')
    const data = response.data
    // Handle both paginated {count, results:[...]} and plain array responses
    return Array.isArray(data) ? data : (data.results || [])
  } catch (error) {
    console.error('Error fetching club proposals:', error)
    throw error
  }
}

export const createClubProposal = async (proposalData) => {
  try {
    // Check if we have any file fields that require FormData
    const hasFile = proposalData.club_logo instanceof File
    
    if (hasFile) {
      // Use FormData for multipart/form-data when sending files
      const formData = new FormData()
      Object.entries(proposalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'club_logo' && value instanceof File) {
            formData.append(key, value)
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, value)
          }
        }
      })
      const response = await apiClient.post('/api/proposals/clubs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } else {
      // Regular JSON POST for non-file data
      // Remove empty strings for optional fields
      const cleanedData = Object.entries(proposalData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)) {
          acc[key] = value
        }
        return acc
      }, {})
      const response = await apiClient.post('/api/proposals/clubs/', cleanedData)
      return response.data
    }
  } catch (error) {
    console.error('Error creating club proposal:', error)
    throw error
  }
}

export const updateClubProposal = async (id, proposalData) => {
  try {
    const response = await apiClient.put(`/api/proposals/clubs/${id}/`, proposalData)
    return response.data
  } catch (error) {
    console.error('Error updating club proposal:', error)
    throw error
  }
}

export const deleteClubProposal = async (id) => {
  try {
    const response = await apiClient.delete(`/api/proposals/clubs/${id}/`)
    return response.data
  } catch (error) {
    console.error('Error deleting club proposal:', error)
    throw error
  }
}

/**
 * Resubmit a rejected event proposal with updated data + optional file attachment.
 * @param {number} id - proposal id
 * @param {object} updateData - updated form fields
 * @param {File|null} attachmentFile - optional single file to attach
 */
export const resubmitEventProposal = async (id, updateData = {}, attachmentFile = null) => {
  try {
    const formData = new FormData()
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    // Handle file attachment (can be a single file or null)
    if (attachmentFile && attachmentFile instanceof File) {
      formData.append('attachment', attachmentFile)
    }
    const response = await apiClient.post(`/api/proposals/events/${id}/resubmit/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    console.error('Error resubmitting event proposal:', error)
    throw error
  }
}

/**
 * Resubmit a rejected club proposal with updated data + optional file attachment.
 * @param {number} id - proposal id
 * @param {object} updateData - updated form fields
 * @param {File|null} attachmentFile - optional single file to attach
 */
export const resubmitClubProposal = async (id, updateData = {}, attachmentFile = null) => {
  try {
    const formData = new FormData()
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    // Handle file attachment (can be a single file or null)
    if (attachmentFile && attachmentFile instanceof File) {
      formData.append('attachment', attachmentFile)
    }
    const response = await apiClient.post(`/api/proposals/clubs/${id}/resubmit/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    console.error('Error resubmitting club proposal:', error)
    throw error
  }
}
