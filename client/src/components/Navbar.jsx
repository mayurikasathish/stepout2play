import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

const ChevronDownIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)
const DiscoverIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const PlayersIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const BellIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const Navbar = () => {
  const { user, context, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const exploreRef = useRef(null)
  const userMenuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Load pending notifications count
  useEffect(() => {
    if (!user) return

    const loadPendingCount = async () => {
      try {
        // Get join requests count
        let requestsCount = 0
        const orgs = context?.orgs || []
        const ownerAdminOrgs = orgs.filter(o => o.myRole === 'OWNER' || o.myRole === 'ADMIN')

        for (const org of ownerAdminOrgs) {
          try {
            const res = await api.get(`/orgs/${org.id}/join-requests`)
            if (res.data.success) {
              requestsCount += res.data.requests.length
            }
          } catch (err) {
            // Ignore errors
          }
        }

        // Only show dot for join requests (not invitations)
        setPendingCount(requestsCount)

        // Get unread notifications count
        try {
          const notifRes = await api.get('/notifications/unread-count')
          if (notifRes.data.success) {
            setUnreadNotifications(notifRes.data.count)
          }
        } catch (err) {
          // Ignore errors
        }
      } catch (err) {
        console.error('Error loading pending count:', err)
      }
    }

    loadPendingCount()
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingCount, 30000)
    return () => clearInterval(interval)
  }, [user, context])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target)) {
        setIsExploreOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close explore dropdown on route change
  useEffect(() => {
    setIsExploreOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path

  // "Explore" is active when on /discover, /players, or any /orgs/:id minisite
  const isExploreActive =
    location.pathname === '/discover' ||
    location.pathname === '/players' ||
    location.pathname.startsWith('/orgs/')

  const navItems = user ? [
    { name: 'Home', path: '/dashboard' },
    { name: 'Tournaments', path: '/browse' },
    { name: 'Explore', isDropdown: true },
    { name: 'Live', path: '/live', isLive: true },
    { name: 'My Matches', path: '/matches' },
    { name: 'My Orgs', path: '/manage', showDot: pendingCount > 0 },
  ] : [
    { name: 'Tournaments', path: '/browse' },
  ]

  const exploreItems = [
    {
      label: 'Organizations',
      description: 'Find and join sports organizations',
      path: '/discover',
      Icon: DiscoverIcon,
    },
    {
      label: 'Players',
      description: 'Browse and invite to your org',
      path: '/players',
      Icon: PlayersIcon,
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        .dark-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          background: rgba(6, 13, 31, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          height: 64px;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
          color: #fff;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .nav-logo:hover {
          opacity: 0.8;
        }

        .nav-logo span {
          color: #4fffb0;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        .nav-link.active {
          color: #4fffb0;
          background: rgba(79,255,176,0.1);
        }

        .nav-link.live-btn {
          background: linear-gradient(135deg, #1e40af, #1e3a8a);
          color: #fff;
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          box-shadow: 0 0 20px rgba(30, 64, 175, 0.4);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link.live-btn:hover {
          box-shadow: 0 0 30px rgba(30, 64, 175, 0.6);
          transform: translateY(-1px);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .nav-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ec4899;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.15);
          }
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bell-btn {
          position: relative;
          background: transparent;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: color 0.2s ease;
        }

        .bell-btn:hover {
          color: #fff;
        }

        .bell-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.35rem;
          border-radius: 8px;
          min-width: 16px;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .user-menu-btn:hover {
          background: rgba(255,255,255,0.05);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4fffb0;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .user-info {
          text-align: right;
        }

        .user-name {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }

        .user-email {
          font-family: 'Barlow', sans-serif;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: linear-gradient(160deg, #0a1628 0%, #060d1f 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.5rem;
          min-width: 200px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
        }

        .dropdown-item {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          width: 100%;
          text-align: left;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        .dropdown-item.danger {
          color: #ef4444;
        }

        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 0.5rem 0;
        }

        /* Explore Dropdown */
        .explore-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          background: linear-gradient(160deg, #0a1628 0%, #060d1f 100%);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 12px;
          padding: 0.75rem;
          min-width: 280px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(79, 255, 176, 0.1);
          backdrop-filter: blur(20px);
        }

        .explore-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          border: 1px solid transparent;
        }

        .explore-item:hover {
          background: rgba(79, 255, 176, 0.08);
          border-color: rgba(79, 255, 176, 0.3);
        }

        .explore-item:not(:last-child) {
          margin-bottom: 0.5rem;
        }

        .explore-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(79, 255, 176, 0.1);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .explore-icon svg {
          width: 20px;
          height: 20px;
          color: #4fffb0;
        }

        .explore-content {
          flex: 1;
        }

        .explore-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 0.25rem;
          letter-spacing: 0.02em;
        }

        .explore-description {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 1rem;
          }
          .nav-center {
            display: none;
          }
          .user-info {
            display: none;
          }
        }
      `}</style>

      <nav className="dark-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')}>
            Step<span>Out</span>2Play
          </div>

          <div className="nav-center">
            {navItems.map((item) => (
              item.isDropdown ? (
                <div key={item.name} style={{ position: 'relative' }} ref={exploreRef}>
                  <button
                    onClick={() => setIsExploreOpen((o) => !o)}
                    className={`nav-link ${isExploreActive ? 'active' : ''}`}
                  >
                    {item.name}
                    <ChevronDownIcon style={{ width: '16px', height: '16px', marginLeft: '4px' }} />
                  </button>

                  {isExploreOpen && (
                    <div className="explore-dropdown">
                      {exploreItems.map((exploreItem) => (
                        <div
                          key={exploreItem.path}
                          className="explore-item"
                          onClick={() => navigate(exploreItem.path)}
                        >
                          <div className="explore-icon">
                            <exploreItem.Icon />
                          </div>
                          <div className="explore-content">
                            <div className="explore-label">{exploreItem.label}</div>
                            <div className="explore-description">{exploreItem.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={item.isLive ? 'nav-link live-btn' : `nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.isLive && <span className="live-dot"></span>}
                  {item.name}
                  {item.showDot && <span className="notification-dot"></span>}
                </button>
              )
            ))}

          </div>

          <div className="nav-right">
            {user ? (
              <>
                <button onClick={() => navigate('/notifications')} className="bell-btn">
                  <BellIcon className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="bell-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                  )}
                </button>

                <div style={{ position: 'relative' }} ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen((o) => !o)} className="user-menu-btn">
                    <div className="user-info">
                      <div className="user-name">{user?.firstName} {user?.lastName}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                    <div className="user-avatar">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="dropdown">
                      <button onClick={() => navigate('/profile')} className="dropdown-item">
                        My Profile
                      </button>
                      <button onClick={() => navigate('/settings')} className="dropdown-item">
                        Settings
                      </button>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-item danger">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
