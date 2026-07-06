import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

// Helper to get role color
const getRoleColor = (role) => {
  switch (role) {
    case 'OWNER': return '#ec4899'
    case 'ADMIN': return '#00d4ff'
    case 'MEMBER': return '#4fffb0'
    default: return '#4fffb0'
  }
}

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
const PlayerCard = ({ player, onClick, onInvite, playerOrgInfo }) => {
  const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player'
  const initials = `${player.firstName?.charAt(0) || ''}${player.lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <div className="player-card">
      <div className="player-card-body">
        {/* Header row */}
        <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start'}}>
          {/* Avatar */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1B4332, #2d6a4f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4fffb0',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: '1.5rem',
            flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {fullName}
            </h3>
            <p style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.25rem'
            }}>
              {player.email}
            </p>
            {player.city && (
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                📍 {player.city}
              </p>
            )}
            {/* Show org badge if player is in one of user's orgs */}
            {playerOrgInfo && (
              <div
                style={{
                  display: 'inline-block',
                  background: getRoleColor(playerOrgInfo.role),
                  color: '#060d1f',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  marginTop: '0.5rem'
                }}
              >
                {playerOrgInfo.role} in {playerOrgInfo.orgName}
              </div>
            )}
          </div>
        </div>

        {/* Bio or placeholder */}
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.65)',
          lineHeight: 1.5,
          marginBottom: '1rem'
        }}>
          {player.bio || 'No bio provided yet.'}
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontFamily: "'Barlow', sans-serif",
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '1rem'
        }}>
          <div>
            <span style={{
              color: '#4fffb0',
              fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>
              {player.matchesPlayed || 0}
            </span> Matches
          </div>
          {player.skillLevel && (
            <>
              <div>•</div>
              <div>
                <span style={{
                  color: '#4fffb0',
                  fontWeight: 700,
                  fontFamily: "'Barlow Condensed', sans-serif"
                }}>
                  {player.skillLevel}
                </span> Level
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{display: 'flex', gap: '0.75rem'}}>
          <button
            onClick={onClick}
            style={{
              flex: 1,
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              padding: '0.65rem 1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#4fffb0'
              e.target.style.color = '#4fffb0'
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.target.style.color = 'rgba(255, 255, 255, 0.8)'
            }}
          >
            View Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onInvite(player)
            }}
            style={{
              flex: 1,
              background: '#4fffb0',
              color: '#060d1f',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              padding: '0.65rem 1.25rem',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 25px rgba(79, 255, 176, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
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
  const [inviteConfirmModal, setInviteConfirmModal] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [myOrgs, setMyOrgs] = useState([])
  const [allMyOrgs, setAllMyOrgs] = useState([]) // All orgs (including as MEMBER)
  const [inviteData, setInviteData] = useState({
    orgId: '',
    role: 'MEMBER',
    message: ''
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    loadMyOrgs()
  }, [])

  useEffect(() => {
    // Load players only after orgs are loaded
    if (allMyOrgs.length >= 0) {
      loadPlayers()
    }
  }, [allMyOrgs])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      console.log('Fetching players from /users/players...')
      const res = await api.get('/users/players')
      console.log('Players response:', res.data)
      if (res.data.success) {
        console.log('Setting players:', res.data.players.length)
        // Filter out current user only
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
        // Store ALL orgs (to check membership badges)
        setAllMyOrgs(res.data.orgs)
        // Filter to only orgs where user is OWNER or ADMIN (for invite dropdown)
        const adminOrgs = res.data.orgs.filter(
          org => org.myRole === 'OWNER' || org.myRole === 'ADMIN'
        )
        setMyOrgs(adminOrgs)
      }
    } catch (err) {
      console.error('Error loading orgs:', err)
      setMyOrgs([])
      setAllMyOrgs([])
    }
  }

  // Helper to get player's org info
  const getPlayerOrgInfo = (player) => {
    // Check if player is a member of any of current user's orgs
    for (const org of allMyOrgs) {
      // Get org members
      if (org.members && Array.isArray(org.members)) {
        const member = org.members.find(m => m.userId === player.id)
        if (member) {
          return {
            orgName: org.name,
            role: member.role
          }
        }
      }
    }
    return null
  }

  const handleInviteClick = (player) => {
    setSelectedPlayer(player)
    setInviteData({ orgId: '', role: 'MEMBER', message: '' })
    setShowInviteModal(true)
  }

  const handleSendInvite = () => {
    if (!inviteData.orgId) {
      alert('Please select an organization')
      return
    }

    const selectedOrg = myOrgs.find(o => o.id === inviteData.orgId)
    setInviteConfirmModal({
      player: selectedPlayer,
      org: selectedOrg,
      role: inviteData.role
    })
  }

  const executeSendInvite = async () => {
    setSendingInvite(true)
    try {
      await api.post(`/orgs/${inviteData.orgId}/invite`, {
        userId: selectedPlayer.id,
        role: inviteData.role,
        message: inviteData.message
      })
      setInviteConfirmModal(null)
      setShowInviteModal(false)
      alert('Invitation sent successfully! 🎉')
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow', sans-serif;
          overflow-x: hidden;
        }

        .players-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 80px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.3;
          z-index: 0;
        }
        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #1B4332 0%, transparent 70%);
          top: -150px;
          right: -150px;
          animation: drift1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #0a3d62 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          animation: drift2 22s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(40px,-30px); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(-50px,40px); }
        }

        /* Grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 55px 55px;
          pointer-events: none;
          z-index: 0;
        }

        .players-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 6vw, 4rem);
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #4fffb0;
          line-height: 0.9;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 2rem;
        }

        .search-input {
          width: 100%;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #4fffb0;
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.4);
        }

        .results-count {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .player-card {
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }

        .player-card:hover {
          border-color: #4fffb0;
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 30px rgba(79, 255, 176, 0.25);
        }

        .player-card-body {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          position: relative;
          padding: 1.5rem;
          padding-left: 2rem;
        }

        .player-card-body::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: linear-gradient(180deg, #4fffb0, rgba(79, 255, 176, 0.5));
        }

        @media (max-width: 768px) {
          .players-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="players-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="grid-overlay"></div>

        <Navbar />

        <main className="players-content">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">Explore Players</h1>
            <p className="page-subtitle">
              Browse player profiles and invite them to your organizations.
            </p>
          </div>

          {/* Search bar */}
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search players by name, email, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Results count */}
          {!loading && (
            <p className="results-count">
              {filtered.length} player{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '1.5rem',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem'
            }}>
              <div style={{fontSize: '4rem', marginBottom: '1rem', opacity: 0.5}}>👤</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem'
              }}>
                No players found
              </div>
              <div style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'No players are available yet. Check back soon!'}
              </div>
            </div>
          ) : (
            <div className="players-grid">
              {filtered.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => navigate(`/players/${player.id}`)}
                  onInvite={handleInviteClick}
                  playerOrgInfo={getPlayerOrgInfo(player)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(6, 13, 31, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setShowInviteModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(79, 255, 176, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 0 40px rgba(79, 255, 176, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
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

      {/* Invite Confirmation Modal */}
      {inviteConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(6, 13, 31, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setInviteConfirmModal(null)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(79, 255, 176, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 0 40px rgba(79, 255, 176, 0.2)',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: '2rem',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#4fffb0',
              marginBottom: '1rem'
            }}>
              RECRUIT THIS PLAYER?
            </div>
            <div style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              You're about to invite <strong style={{ color: '#fff' }}>
                {inviteConfirmModal.player.firstName} {inviteConfirmModal.player.lastName}
              </strong> to join <strong style={{ color: '#4fffb0' }}>
                {inviteConfirmModal.org?.name}
              </strong> as a <strong style={{ color: '#00d4ff' }}>
                {inviteConfirmModal.role}
              </strong>!
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setInviteConfirmModal(null)}
                disabled={sendingInvite}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: sendingInvite ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: sendingInvite ? 0.5 : 1
                }}
              >
                Hold On
              </button>
              <button
                onClick={executeSendInvite}
                disabled={sendingInvite}
                style={{
                  flex: 1,
                  background: '#4fffb0',
                  color: '#060d1f',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: sendingInvite ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: sendingInvite ? 0.5 : 1
                }}
              >
                {sendingInvite ? 'Sending...' : 'Yes, Send Invite!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlayersPage
