import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

/* ─── Icons ─────────────────────────────────────────────── */
const SearchIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
  </svg>
)
const UserIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const TrophyIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)
const LocationIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

/* ─── Gradient helper (for placeholder avatars) ─────────── */
const getGradient = (name = '') => {
  const g = [
    'from-primary-500 to-primary-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-green-500 to-emerald-600',
    'from-teal-500 to-cyan-600',
  ]
  return g[name.charCodeAt(0) % g.length]
}

/* ─── Player Card ───────────────────────────────────── */
const PlayerCard = ({ player, onClick, onInvite }) => {
  const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player'
  const initials = `${player.firstName?.charAt(0) || ''}${player.lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <div className="glass-card rounded-xl hover:shadow-glass-lg transition-all duration-300 w-full group hover:-translate-y-1 overflow-hidden">
      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar - placeholder for now */}
          <div className={`w-16 h-16 shrink-0 bg-gradient-to-br ${getGradient(fullName)} rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
            <span className="text-white font-bold text-xl">
              {initials || <UserIcon className="w-8 h-8" />}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {fullName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {player.email}
            </p>
            {player.city && (
              <div className="flex items-center gap-1 mt-1">
                <LocationIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{player.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio or placeholder */}
        <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">
          {player.bio || 'No bio provided yet.'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <TrophyIcon className="w-4 h-4 text-primary-500" />
            <span className="font-medium">{player.matchesPlayed || 0}</span>
            <span className="text-gray-400">Matches</span>
          </div>
          {player.skillLevel && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="font-medium">{player.skillLevel}</span>
              <span className="text-gray-400">Level</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
          <button
            onClick={onClick}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
          >
            View Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onInvite(player)
            }}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all text-sm"
          >
            Invite to Org
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton loader ─────────────────────────────────────── */
const PlayerCardSkeleton = () => (
  <div className="glass-card rounded-xl overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-5" />
      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  </div>
)

/* ─── Main Page ───────────────────────────────────────────── */
const PlayersPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [myOrgs, setMyOrgs] = useState([])
  const [inviteData, setInviteData] = useState({
    orgId: '',
    role: 'MEMBER',
    message: ''
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    loadPlayers()
    loadMyOrgs()
  }, [])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      console.log('Fetching players from /users/players...')
      const res = await api.get('/users/players')
      console.log('Players response:', res.data)
      if (res.data.success) {
        console.log('Setting players:', res.data.players.length)
        // Filter out current user
        const filteredPlayers = res.data.players.filter(p => p.id !== user?.id)
        setPlayers(filteredPlayers)
      }
    } catch (err) {
      console.error('Error loading players:', err)
      console.error('Error details:', err.response?.data)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const loadMyOrgs = async () => {
    try {
      const res = await api.get('/orgs')
      if (res.data.success) {
        // Filter to only orgs where user is OWNER or ADMIN
        const adminOrgs = res.data.orgs.filter(
          org => org.myRole === 'OWNER' || org.myRole === 'ADMIN'
        )
        setMyOrgs(adminOrgs)
      }
    } catch (err) {
      console.error('Error loading orgs:', err)
      setMyOrgs([])
    }
  }

  const handleInviteClick = (player) => {
    setSelectedPlayer(player)
    setInviteData({ orgId: '', role: 'MEMBER', message: '' })
    setShowInviteModal(true)
  }

  const handleSendInvite = async () => {
    if (!inviteData.orgId) {
      alert('Please select an organization')
      return
    }

    setSendingInvite(true)
    try {
      await api.post(`/orgs/${inviteData.orgId}/invite`, {
        userId: selectedPlayer.id,
        role: inviteData.role,
        message: inviteData.message
      })
      alert('Invitation sent successfully!')
      setShowInviteModal(false)
    } catch (err) {
      console.error('Error sending invite:', err)
      alert(err.response?.data?.error || 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  const filtered = players.filter((p) => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase()
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Players</h1>
          <p className="text-gray-600">
            Browse player profiles, connect with others, and invite them to your tournaments
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players by name, email, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-5">
            {filtered.length} player{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="glass-card rounded-2xl p-12 max-w-md text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No players found</h2>
              <p className="text-gray-600 text-sm">
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'No players are available yet. Check back soon!'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-6 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => navigate(`/players/${player.id}`)}
                onInvite={handleInviteClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Invite {selectedPlayer?.firstName} to Organization
            </h2>

            {myOrgs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No Organizations Found
                </h3>
                <p className="text-gray-600 mb-6">
                  You need to be an owner or admin of an organization to invite players.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      navigate('/manage')
                    }}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
                  >
                    Go to My Orgs
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Organization Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Organization *
                  </label>
                  <select
                    value={inviteData.orgId}
                    onChange={(e) => setInviteData({ ...inviteData, orgId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">Choose an organization...</option>
                    {myOrgs.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.myRole})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Optional Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={inviteData.message}
                    onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    disabled={sendingInvite}
                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sendingInvite || !inviteData.orgId}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayersPage
