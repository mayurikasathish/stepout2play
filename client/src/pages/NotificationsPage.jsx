import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=50')
      if (response.data.success) {
        setNotifications(response.data.notifications)
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await api.patch(`/notifications/${notification.id}/read`)
      // Update local state
      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))
    } catch (err) {
      console.error('Error marking as read:', err)
    }

    // Navigate to action URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all as read:', err)
      alert('Failed to mark all as read')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
      return
    }

    try {
      await api.delete('/notifications/clear-all')
      setNotifications([])
    } catch (err) {
      console.error('Error clearing notifications:', err)
      alert('Failed to clear notifications')
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'STANDBY_SPOT_AVAILABLE':
        return '🎾'
      case 'STANDBY_ACCEPTED':
        return '✅'
      case 'WITHDRAWAL':
        return '⚠️'
      default:
        return '🔔'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your tournaments and matches</p>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
              >
                Mark all as read
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔔</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h2>
            <p className="text-gray-600">
              You'll see updates about your tournaments and matches here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`glass-card rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                  notif.read ? 'bg-white/50' : 'bg-white border-l-4 border-primary-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{notif.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      {notif.actionText && (
                        <span className="text-primary-600 font-medium">{notif.actionText} →</span>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
