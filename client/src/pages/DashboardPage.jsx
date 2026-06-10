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
  const [loading, setLoading] = useState(true)

  const isOrganizer = context?.orgs?.length > 0
  const isPlayer = myRegistrations.length > 0

  useEffect(() => { loadData() }, [])

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
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Tournaments user hasn't registered for yet
  const myEventIds = new Set(myRegistrations.map(r => r.eventId))
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
            Hey, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500">
            {isOrganizer && isPlayer && 'Managing tournaments and playing — you do it all.'}
            {isOrganizer && !isPlayer && 'Ready to run your next tournament?'}
            {!isOrganizer && isPlayer && `You're registered for ${myRegistrations.length} event${myRegistrations.length !== 1 ? 's' : ''}.`}
            {!isOrganizer && !isPlayer && 'Find a tournament to join, or create your own organization.'}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/matches')}>
            <div className="text-2xl font-bold text-primary-600">{upcomingRegs.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">Active registrations</div>
          </div>
          <div className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/browse')}>
            <div className="text-2xl font-bold text-green-600">{openTournaments.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">Open tournaments</div>
          </div>
          {isOrganizer && (
            <div className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/manage')}>
              <div className="text-2xl font-bold text-yellow-600">{context.orgs.length}</div>
              <div className="text-sm text-gray-500 mt-0.5">Your organizations</div>
            </div>
          )}
          <div className="glass-card rounded-xl p-5">
            <div className="text-2xl font-bold text-gray-800">{myRegistrations.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">Total registrations</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left column — spans 2 on lg */}
          <div className="lg:col-span-2 space-y-6">

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
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">
                        🎾
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
                  {suggestedTournaments.length > 0 ? '✨ Recommended for you' : 'Open Tournaments'}
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
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-lg flex-shrink-0">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                        <p className="text-sm text-gray-500">
                          {t.city} · {t.sport} ·{' '}
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

            {/* Org quick actions — only if organizer */}
            {isOrganizer && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Your Organizations</h2>
                  <button onClick={() => navigate('/manage')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium">Manage all</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {context.orgs.slice(0, 4).map(org => (
                    <button key={org.id}
                      onClick={() => navigate(`/manage/org/${org.id}`)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {org.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{org.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{org.myRole.toLowerCase()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — quick actions */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</h2>

            {[
              { icon: '🔍', label: 'Browse Tournaments', sub: 'Find & register for events', path: '/browse', color: 'from-primary-500 to-primary-600' },
              { icon: '📅', label: 'My Matches', sub: 'View your schedule', path: '/matches', color: 'from-green-500 to-green-600' },
              ...(isOrganizer ? [{ icon: '🏢', label: 'Manage Orgs', sub: 'Run your tournaments', path: '/manage', color: 'from-yellow-500 to-yellow-600' }] : []),
              { icon: '👤', label: 'My Profile', sub: 'Update your details', path: '/profile', color: 'from-gray-600 to-gray-700' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="w-full p-5 rounded-2xl text-left hover:shadow-lg transition-all bg-gradient-to-r text-white"
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
              >
                <div className={`w-full p-5 rounded-2xl text-left bg-gradient-to-br ${item.color} hover:shadow-md transition-all`}>
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-bold text-white">{item.label}</div>
                  <div className="text-sm text-white/80">{item.sub}</div>
                </div>
              </button>
            ))}

            {/* If not an organizer yet, suggest it */}
            {!isOrganizer && (
              <div className="p-5 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <p className="font-semibold text-gray-700 text-sm mb-1">Run your own tournament?</p>
                <p className="text-xs text-gray-400 mb-3">Create an organization to get started</p>
                <button onClick={() => navigate('/manage')}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all">
                  Create org
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
