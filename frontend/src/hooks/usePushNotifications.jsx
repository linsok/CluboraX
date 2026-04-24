import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { getUnreadNotifications } from '../api/notifications'

/**
 * Hook to poll for new push notifications and display as dismissible toasts
 * Fetches unread notifications every 5 seconds when enabled
 * Users can dismiss notifications by clicking the X button or they auto-dismiss after 7 seconds
 */
export const usePushNotifications = (enabled = true) => {
  const seenNotificationsRef = useRef(new Set())
  const pollingIntervalRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const pollForNotifications = async () => {
      try {
        // Fetch unread notifications
        const unreadNotifications = await getUnreadNotifications()
        
        if (!Array.isArray(unreadNotifications)) return

        unreadNotifications.forEach(notif => {
          const notifId = notif.id
          
          // Only show toast if we haven't seen this notification yet
          if (!seenNotificationsRef.current.has(notifId)) {
            seenNotificationsRef.current.add(notifId)

            // Determine toast style based on priority/type
            const getToastStyle = () => {
              if (notif.priority === 'high') {
                return {
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  icon: '🔴'
                }
              } else if (notif.priority === 'medium') {
                return {
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  icon: '🟡'
                }
              } else {
                return {
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  icon: '🟢'
                }
              }
            }

            const style = getToastStyle()

            // Display dismissible toast with action button
            toast(
              (t) => (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-800 break-words">
                            {notif.title}
                          </h3>
                          {notif.message && (
                            <p className="text-xs text-gray-600 mt-1 break-words line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          {notif.action_url && (
                            <a 
                              href={notif.action_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                            >
                              View Details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
                      aria-label="Close notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ),
              {
                duration: 7000, // Auto-dismiss after 7 seconds
                position: 'top-right',
                style: {
                  ...style,
                  color: '#1f2937',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                },
              }
            )
          }
        })
      } catch (error) {
        console.error('Error polling for push notifications:', error)
      }
    }

    // Initial check immediately
    pollForNotifications()

    // Poll every 5 seconds for new notifications
    pollingIntervalRef.current = setInterval(pollForNotifications, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [enabled])
}
