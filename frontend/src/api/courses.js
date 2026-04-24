import { apiClient } from './client'

// Get user's enrolled courses
export const getUserCourses = async (user = null) => {
  try {
    const response = await apiClient.get('/api/events/registrations/')
    const registrations = response.data.results || []
    
    // Transform event registrations into course format
    return registrations.map(registration => ({
      id: registration.event.id,
      title: registration.event.title,
      instructor: registration.event.created_by?.full_name || 'TBD',
      progress: calculateProgress(registration),
      totalLessons: null,
      completedLessons: null,
      thumbnail: registration.event.image || null,
      category: registration.event.category,
      duration: 'Event',
      level: 'All Levels',
      registrationDate: registration.created_at,
      eventId: registration.event.id,
      status: registration.status
    }))
  } catch (error) {
    console.error('Failed to fetch user courses:', error)
    throw error
  }
}

// Get user's achievements
export const getUserAchievements = async (user = null) => {
  try {
    const response = await apiClient.get('/api/users/achievements/')
    return response.data.results || []
  } catch (error) {
    // Silently return empty array if endpoint doesn't exist (404) - feature not yet implemented
    return []
  }
}

// Get user's certificates
export const getUserCertificates = async (user = null) => {
  try {
    const response = await apiClient.get('/api/users/certificates/')
    return response.data.results || []
  } catch (error) {
    // Silently return empty array if endpoint doesn't exist (404) - feature not yet implemented
    return []
  }
}

// Get user's analytics/progress
export const getUserAnalytics = async () => {
  try {
    const response = await apiClient.get('/api/users/analytics/')
    return response.data || {
      totalCourses: 0,
      completedCourses: 0,
      totalAchievements: 0,
      totalCertificates: 0,
      progressPercentage: 0
    }
  } catch (error) {
    console.error('Failed to fetch user analytics:', error)
    throw error
  }
}

// Helper function to calculate progress (placeholder logic)
const calculateProgress = (registration) => {
  // Simple progress calculation based on registration status
  if (registration.status === 'completed') return 100
  if (registration.status === 'attended') return 80
  if (registration.status === 'confirmed') return 20
  return 10 // registered
}

// Get user's documents
export const getUserDocuments = async () => {
  try {
    const response = await apiClient.get('/api/users/documents/')
    return response.data.results || []
  } catch (error) {
    console.error('Failed to fetch user documents:', error)
    throw error
  }
}

// Get user's notifications
export const getUserNotifications = async () => {
  try {
    const response = await apiClient.get('/api/notifications/')
    return response.data.results || []
  } catch (error) {
    console.error('Failed to fetch user notifications:', error)
    throw error
  }
}
