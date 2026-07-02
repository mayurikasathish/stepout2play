import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const DashboardPage = () => {
  const { user, context } = useAuth()
  const navigate = useNavigate()
  const [myRegistrations, setMyRegistrations] = useState([])
  const [openTournaments, setOpenTournaments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [liveFeed, setLiveFeed] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const isOrganizer = context?.orgs?.length > 0
  const isPlayer = myRegistrations.length > 0

  useEffect(() => {
    loadData()

    // Poll notifications and feed every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
      loadLiveFeed()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [regRes, tourRes] = await Promise.all([
        api.get('/users/me/registrations').catch(() => ({ data: { registrations: [] } })),
        api.get('/tournaments').catch(() => ({ data: { tournaments: [] } })),
      ])
      setMyRegistrations(regRes.data.registrations || [])

      const all = tourRes.data.tournaments || []
      setOpenTournaments(all.filter(t => t.status === 'OPEN').slice(0, 6))

      // Load notifications and feed
      await Promise.all([loadNotifications(), loadLiveFeed()])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?limit=10'),
        api.get('/notifications/unread-count')
      ])
      setNotifications(notifRes.data.notifications || [])
      setUnreadCount(countRes.data.count || 0)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  const loadLiveFeed = async () => {
    try {
      const feedRes = await api.get('/live-feed?limit=15')
      setLiveFeed(feedRes.data.feed || [])
    } catch (err) {
      console.error('Error loading live feed:', err)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      const deletedNotif = notifications.find(n => n.id === notificationId)
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return
    try {
      // Delete all notifications one by one
      await Promise.all(notifications.map(n => api.delete(`/notifications/${n.id}`)))
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }

  // Tournaments user hasn't registered for yet
  const suggestedTournaments = openTournaments
    .filter(t => {
      const alreadyIn = myRegistrations.some(r => r.event?.tournament?.id === t.id)
      if (alreadyIn) return false
      const userSports = user?.sports || []
      const cityMatch = user?.city && t.city?.toLowerCase() === user.city.toLowerCase()
      const sportMatch = userSports.some(s => s.toLowerCase() === t.sport?.toLowerCase())
      return cityMatch || sportMatch || userSports.length === 0
    })
    .slice(0, 3)

  // Upcoming registrations
  const upcomingRegs = myRegistrations
    .filter(r => ['OPEN', 'ONGOING'].includes(r.event?.tournament?.status))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hey, {user?.firstName}
          </h1>
          <p className="text-gray-500">
            {isOrganizer && isPlayer && 'Managing tournaments and playing - you do it all.'}
            {isOrganizer && !isPlayer && 'Ready to run your next tournament?'}
            {!isOrganizer && isPlayer && `You're registered for ${myRegistrations.length} event${myRegistrations.length !== 1 ? 's' : ''}.`}
            {!isOrganizer && !isPlayer && 'Find a tournament to join, or create your own organization.'}
          </p>
        </div>

        {/* Main grid - 3 columns */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* Left column - Notifications (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <NotificationsSection
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
              onClearAll={clearAllNotifications}
              navigate={navigate}
            />
          </div>

          {/* Middle column - Main content (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/matches')}>
                <div className="text-2xl font-bold text-primary-600">{upcomingRegs.length}</div>
                <div className="text-sm text-gray-500 mt-0.5">Active Events</div>
              </div>
              <div className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/browse')}>
                <div className="text-2xl font-bold text-green-600">{openTournaments.length}</div>
                <div className="text-sm text-gray-500 mt-0.5">Open Tournaments</div>
              </div>
            </div>

            {/* My upcoming events */}
            {upcomingRegs.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">My Upcoming Events</h2>
                  <button onClick={() => navigate('/matches')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</button>
                </div>
                <div className="space-y-3">
                  {upcomingRegs.map(reg => (
                    <div key={reg.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/tournaments/${reg.event?.tournament?.id}`)}>
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-lg flex-shrink-0 font-bold text-primary-600">
                        E
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{reg.event?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{reg.event?.tournament?.name}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                        {reg.event?.tournament?.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tournament suggestions */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {suggestedTournaments.length > 0 ? 'Recommended for you' : 'Open Tournaments'}
                </h2>
                <button onClick={() => navigate('/browse')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium">Browse all</button>
              </div>

              {openTournaments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No open tournaments right now</p>
                  <button onClick={() => navigate('/browse')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
                    Browse all
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(suggestedTournaments.length > 0 ? suggestedTournaments : openTournaments.slice(0, 3)).map(t => (
                    <div key={t.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/tournaments/${t.id}`)}>
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-lg flex-shrink-0 font-bold text-yellow-600">
                        T
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                        <p className="text-sm text-gray-500">
                          {t.city}, {t.sport},{' '}
                          {new Date(t.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {t.participantCount || 0} registered
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Live Feed (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <LiveFeedSection liveFeed={liveFeed} navigate={navigate} />
          </div>
        </div>
      </main>
    </div>
  )
}

// Notifications Section Component
const NotificationsSection = ({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onDeleteNotification, onClearAll, navigate }) => {
  return (
    <div className="glass-card rounded-2xl p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDeleteNotification}
              navigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Individual Notification Card
const NotificationCard = ({ notification, onMarkAsRead, onDelete, navigate }) => {
  const handleClick = (e) => {
    // Don't trigger if clicking delete button
    if (e.target.closest('.delete-btn')) return

    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  const getIcon = (icon) => {
    const icons = {
      'user-group': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      'trophy': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      'clock': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'warning': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      default: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    }
    return icons[icon] || icons.default
  }

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    LOW: 'bg-gray-100 text-gray-700'
  }

  return (
    <div
      onClick={handleClick}
      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
        notification.read
          ? 'bg-white border-gray-100 hover:border-gray-200'
          : 'bg-primary-50 border-primary-200 hover:border-primary-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${priorityColors[notification.priority]}`}>
          {getIcon(notification.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 mb-0.5">{notification.title}</p>
          <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
          <p className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></div>
        )}
      </div>
      <button
        onClick={handleDelete}
        className="delete-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
        title="Delete notification"
      >
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Live Feed Section Component
const LiveFeedSection = ({ liveFeed, navigate }) => {
  return (
    <div className="glass-card rounded-2xl p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Live Feed</h2>
        <span className="text-xs text-gray-400">Real-time</span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {liveFeed.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-sm text-gray-400">No activity yet</p>
          </div>
        ) : (
          liveFeed.map(item => (
            <LiveFeedItem key={item.id} item={item} navigate={navigate} />
          ))
        )}
      </div>
    </div>
  )
}

// Individual Live Feed Item
const LiveFeedItem = ({ item, navigate }) => {
  const handleClick = () => {
    if (item.targetId && item.targetType) {
      if (item.targetType === 'tournament') {
        navigate(`/tournaments/${item.targetId}`)
      } else if (item.targetType === 'event') {
        navigate(`/events/${item.targetId}`)
      }
    }
  }

  return (
    <div
      onClick={handleClick}
      className="p-3 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {item.actor?.profilePicture ? (
          <img
            src={item.actor.profilePicture}
            alt={item.actor.firstName}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {item.actor?.firstName?.[0]}{item.actor?.lastName?.[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{item.actor?.firstName} {item.actor?.lastName}</span>
            {' '}{item.message}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
