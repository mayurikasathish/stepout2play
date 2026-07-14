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
      case 'FOLLOW_REQUEST':
        return '👤'
      case 'NEW_FOLLOWER':
        return '✨'
      case 'FOLLOW_ACCEPTED':
        return '🎉'
      default:
        return '🔔'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
      <style>{`
        .notifications-page *,
        .notifications-page input,
        .notifications-page select,
        .notifications-page button,
        .notifications-page h1,
        .notifications-page h2,
        .notifications-page h3,
        .notifications-page p,
        .notifications-page span,
        .notifications-page div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }
      `}</style>
      <Navbar />

      <div className="notifications-page" style={{ maxWidth: '60rem', margin: '0 auto', padding: '8rem 1.5rem 2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '900',
              color: '#4fffb0',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              NOTIFICATIONS
            </h1>
            <p style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em'
            }}>
              Stay updated with your tournaments and matches
            </p>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(79, 255, 176, 0.15)',
                  color: '#4fffb0',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(79, 255, 176, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.15)';
                }}
              >
                Mark all as read
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)';
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>Loading notifications...</p>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            background: 'rgba(10, 22, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ width: '5rem', height: '5rem', background: 'rgba(79, 255, 176, 0.15)', border: '2px solid rgba(79, 255, 176, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>🔔</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>No notifications yet</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              You'll see updates about your tournaments and matches here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  background: notif.read ? 'rgba(10, 22, 40, 0.4)' : 'rgba(10, 22, 40, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: notif.read ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(79, 255, 176, 0.3)',
                  borderLeft: notif.read ? '1px solid rgba(255, 255, 255, 0.05)' : '4px solid #4fffb0',
                  borderRadius: '16px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notif.read ? 'rgba(10, 22, 40, 0.4)' : 'rgba(10, 22, 40, 0.6)';
                  if (notif.read) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{getIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '700', color: '#fff', marginBottom: '0.25rem', fontSize: '1rem' }}>{notif.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>{notif.message}</p>

                    {/* Accept/Reject buttons for follow requests */}
                    {notif.type === 'FOLLOW_REQUEST' && notif.data?.followId && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await api.patch(`/follows/${notif.data.followId}/accept`)
                              setNotifications(notifications.filter(n => n.id !== notif.id))
                              alert('Follow request accepted! 🎉')
                            } catch (err) {
                              console.error('Error accepting follow:', err)
                              alert('Failed to accept request')
                            }
                          }}
                          style={{
                            background: '#4fffb0',
                            color: '#060d1f',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await api.patch(`/follows/${notif.data.followId}/reject`)
                              setNotifications(notifications.filter(n => n.id !== notif.id))
                            } catch (err) {
                              console.error('Error rejecting follow:', err)
                              alert('Failed to reject request')
                            }
                          }}
                          style={{
                            background: 'transparent',
                            color: '#ec4899',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            padding: '0.5rem 1rem',
                            border: '1px solid #ec4899',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(236, 72, 153, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: notif.type === 'FOLLOW_REQUEST' ? '0.5rem' : '0' }}>
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      {notif.actionText && notif.type !== 'FOLLOW_REQUEST' && (
                        <span style={{ color: '#4fffb0', fontWeight: '600' }}>{notif.actionText} →</span>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{ width: '0.5rem', height: '0.5rem', background: '#4fffb0', borderRadius: '50%', flexShrink: 0, marginTop: '0.25rem' }}></div>
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
