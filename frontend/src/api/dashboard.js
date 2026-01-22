import { apiClient } from './client'

// Dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/auth/profile/')
    const user = response.data.data
    
    // Get user-specific statistics based on role
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalEvents: 0,
      upcomingEvents: 0,
      totalClubs: 0,
      activeClubs: 0,
      totalRegistrations: 0,
      pendingApprovals: 0,
      systemHealth: {
        status: 'healthy',
        database: 'connected',
        cache: 'connected',
        storage: 'optimal'
      }
    }

    // Get events statistics
    try {
      const eventsResponse = await apiClient.get('/api/events/stats/')
      const eventsData = eventsResponse.data.data
      stats.totalEvents = eventsData.total_events || 0
      stats.upcomingEvents = eventsData.upcoming_events || 0
      stats.totalRegistrations = eventsData.total_registrations || 0
    } catch (error) {
      console.error('Failed to fetch events stats:', error)
    }

    // Get clubs statistics
    try {
      const clubsResponse = await apiClient.get('/api/clubs/stats/')
      const clubsData = clubsResponse.data.data
      stats.totalClubs = clubsData.total_clubs || 0
      stats.activeClubs = clubsData.active_clubs || 0
    } catch (error) {
      console.error('Failed to fetch clubs stats:', error)
    }

    // Get user count (admin only)
    if (user.role === 'admin') {
      try {
        const usersResponse = await apiClient.get('/api/auth/users/')
        stats.totalUsers = usersResponse.data.count || 0
        stats.activeUsers = usersResponse.data.results?.filter(u => u.is_active).length || 0
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
      }
    }

    // Get pending approvals for admins/approvers
    if (user.role === 'admin' || user.role === 'approver') {
      try {
        const eventsApprovalResponse = await apiClient.get('/api/events/approvals/')
        const clubsApprovalResponse = await apiClient.get('/api/clubs/approvals/')
        stats.pendingApprovals = 
          (eventsApprovalResponse.data.count || 0) + 
          (clubsApprovalResponse.data.count || 0)
      } catch (error) {
        console.error('Failed to fetch approval stats:', error)
      }
    }

    return stats
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    throw error
  }
}

// Get recent activities
export const getRecentActivities = async () => {
  try {
    const activities = []
    
    // Get recent events
    try {
      const eventsResponse = await apiClient.get('/api/events/?ordering=-created_at&limit=5')
      const events = eventsResponse.data.results || []
      events.forEach(event => {
        activities.push({
          id: `event-${event.id}`,
          type: 'event_created',
          message: `New event "${event.title}" created`,
          user: event.created_by?.full_name || 'Unknown',
          time: getTimeAgo(event.created_at),
          icon: 'CalendarIcon'
        })
      })
    } catch (error) {
      console.error('Failed to fetch recent events:', error)
    }

    // Get recent club approvals
    try {
      const clubsResponse = await apiClient.get('/api/clubs/?ordering=-created_at&limit=5')
      const clubs = clubsResponse.data.results || []
      clubs.forEach(club => {
        if (club.status === 'approved') {
          activities.push({
            id: `club-${club.id}`,
            type: 'club_approved',
            message: `${club.name} approved`,
            user: club.created_by?.full_name || 'Unknown',
            time: getTimeAgo(club.updated_at),
            icon: 'UserGroupIcon'
          })
        }
      })
    } catch (error) {
      console.error('Failed to fetch recent clubs:', error)
    }

    // Get user registrations (if student)
    try {
      const profileResponse = await apiClient.get('/api/auth/profile/')
      const user = profileResponse.data.data
      
      if (user.role === 'student') {
        const registrationsResponse = await apiClient.get('/api/events/registrations/')
        const registrations = registrationsResponse.data.results || []
        registrations.forEach(registration => {
          activities.push({
            id: `registration-${registration.id}`,
            type: 'user_registered',
            message: `Registered for "${registration.event.title}"`,
            user: user.full_name,
            time: getTimeAgo(registration.created_at),
            icon: 'UsersIcon'
          })
        })
      }
    } catch (error) {
      console.error('Failed to fetch user registrations:', error)
    }

    return activities.slice(0, 10) // Return only the 10 most recent
  } catch (error) {
    console.error('Failed to fetch recent activities:', error)
    throw error
  }
}

// Get user's courses/events (for students)
export const getUserCourses = async () => {
  try {
    const profileResponse = await apiClient.get('/api/auth/profile/')
    const user = profileResponse.data.data
    
    if (user.role === 'student') {
      // Get registered events
      const registrationsResponse = await apiClient.get('/api/events/registrations/')
      const registrations = registrationsResponse.data.results || []
      
      return registrations.map(registration => ({
        id: registration.event.id,
        title: registration.event.title,
        instructor: registration.event.created_by?.full_name || 'TBD',
        progress: Math.floor(Math.random() * 100), // Placeholder - would need actual progress tracking
        totalLessons: 10, // Placeholder
        completedLessons: Math.floor(Math.random() * 10), // Placeholder
        thumbnail: registration.event.image || '/api/placeholder/400/200',
        category: registration.event.category,
        duration: 'Event', // Placeholder
        level: 'All Levels'
      }))
    } else if (user.role === 'organizer') {
      // Get events created by the user
      const eventsResponse = await apiClient.get('/api/events/?my_events=true')
      const events = eventsResponse.data.results || []
      
      return events.map(event => ({
        id: event.id,
        title: event.title,
        instructor: user.full_name,
        progress: Math.floor(Math.random() * 100), // Placeholder
        totalLessons: 10, // Placeholder
        completedLessons: Math.floor(Math.random() * 10), // Placeholder
        thumbnail: event.image || '/api/placeholder/400/200',
        category: event.category,
        duration: 'Event',
        level: 'All Levels'
      }))
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch user courses:', error)
    throw error
  }
}

// Helper function to format time ago
const getTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) return interval + " years ago"
  
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) return interval + " months ago"
  
  interval = Math.floor(seconds / 86400)
  if (interval > 1) return interval + " days ago"
  
  interval = Math.floor(seconds / 3600)
  if (interval > 1) return interval + " hours ago"
  
  interval = Math.floor(seconds / 60)
  if (interval > 1) return interval + " minutes ago"
  
  return "Just now"
}
