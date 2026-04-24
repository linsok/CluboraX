import { apiClient } from './client'

// ── Notifications CRUD ─────────────────────────────────────────────────────────

export const getNotifications = async (params = {}) => {
  const res = await apiClient.get('/api/notifications/', { params })
  return res.data?.results ?? res.data ?? []
}

// Get unread notifications (for push notification display)
export const getUnreadNotifications = async () => {
  try {
    const res = await apiClient.get('/api/notifications/?is_read=false', {})
    return res.data?.results ?? res.data ?? []
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error)
    return []
  }
}

export const getNotificationStats = async () => {
  const res = await apiClient.get('/api/notifications/stats/')
  return res.data
}

export const markNotificationRead = async (notificationId) => {
  const res = await apiClient.post(
    `/api/notifications/${notificationId}/mark-read/`
  )
  return res.data
}

export const markAllNotificationsRead = async () => {
  const res = await apiClient.post('/api/notifications/mark-all-read/')
  return res.data
}

export const deleteNotification = async (notificationId) => {
  await apiClient.delete(`/api/notifications/${notificationId}/`)
}

export const deleteAllNotifications = async () => {
  // Delete all notifications by fetching all and deleting individually
  // Or use a batch endpoint if available
  const res = await apiClient.get('/api/notifications/?is_read=true')
  const notifications = res.data?.results ?? res.data ?? []
  
  for (const notif of notifications) {
    try {
      await apiClient.delete(`/api/notifications/${notif.id}/`)
    } catch (error) {
      console.error(`Failed to delete notification ${notif.id}:`, error)
    }
  }
  
  return { deleted: notifications.length }
}

// ── Notification Preferences ───────────────────────────────────────────────────

export const getNotificationPreferences = async () => {
  const res = await apiClient.get('/api/notifications/preferences/')
  return res.data
}

export const updateNotificationPreferences = async (data) => {
  const res = await apiClient.post('/api/notifications/preferences/', data)
  return res.data
}
