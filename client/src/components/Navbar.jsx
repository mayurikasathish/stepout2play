import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'

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

const Navbar = () => {
  const { user, context, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const exploreRef = useRef(null)
  const userMenuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Browse', path: '/browse' },
    { name: 'My Matches', path: '/matches' },
    { name: 'My Organizations', path: '/manage' },
  ] : [
    { name: 'Browse', path: '/browse' },
  ]

  const exploreItems = [
    {
      label: 'Discover Organizations',
      description: 'Find and join sports organizations',
      path: '/discover',
      Icon: DiscoverIcon,
    },
    {
      label: 'Players',
      description: 'Browse player profiles and invite them',
      path: '/players',
      Icon: PlayersIcon,
    },
  ]

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-lg font-bold text-gray-900">StepOut2Play</span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-all whitespace-nowrap ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            ))}

            {/* Explore dropdown */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setIsExploreOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
                  isExploreActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Explore
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isExploreOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  {exploreItems.map(({ label, description, path, Icon }) => (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isActive(path) ? 'bg-primary-50' : 'hover:bg-green-50'
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive(path)
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive(path) ? 'text-primary-700' : 'text-gray-900'}`}>
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((o) => !o)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar
