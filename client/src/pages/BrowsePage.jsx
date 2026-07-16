import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'
import LocationButton from '../components/LocationButton'
import { useAuth } from '../context/AuthContext'
import { sortTournamentsByDistance } from '../utils/distance'
import api from '../services/api'

const SearchIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const CalendarIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LocationIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const BrowsePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSport, setFilterSport] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDistance, setFilterDistance] = useState('all')

  useEffect(() => {
    fetchTournaments()
  }, [filterSport, filterStatus])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {}
      if (filterSport !== 'all') params.sport = filterSport
      if (filterStatus !== 'all') params.status = filterStatus

      const response = await api.get('/tournaments', { params })

      if (response.data.success) {
        let tournamentsList = response.data.tournaments || []

        // Sort by distance if user has GPS location
        if (user?.latitude && user?.longitude) {
          tournamentsList = sortTournamentsByDistance(tournamentsList, user)
        }

        setTournaments(tournamentsList)
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err)
      setError('Failed to load tournaments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredTournaments = tournaments.filter(t => {
    const query = searchQuery.toLowerCase()

    // Get sport names for searching
    const sportNames = {
      'badminton': 'badminton',
      'table-tennis': 'table tennis tabletennis',
      'squash': 'squash',
      'pickleball': 'pickleball pickle ball',
      'tennis': 'tennis',
      'padel': 'padel'
    }

    // Build searchable sport string from tournament's sports array
    const tournamentSports = t.sports && t.sports.length > 0
      ? t.sports.map(sportId => sportNames[sportId] || sportId).join(' ')
      : sportNames[t.sport] || t.sport || ''

    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      (t.organization?.name || '').toLowerCase().includes(query) ||
      t.city.toLowerCase().includes(query) ||
      tournamentSports.toLowerCase().includes(query)

    const matchesSport = filterSport === 'all' || t.sport === filterSport

    // Distance filter
    let matchesDistance = true
    if (filterDistance !== 'all' && t.distance != null) {
      if (filterDistance === '10') matchesDistance = t.distance <= 10
      else if (filterDistance === '25') matchesDistance = t.distance <= 25
      else if (filterDistance === '50') matchesDistance = t.distance <= 50
      else if (filterDistance === '100') matchesDistance = t.distance <= 100
    }

    return matchesSearch && matchesSport && matchesDistance
  })

  return (
    <div className="browse-page" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
      <style>{`
        .browse-page,
        .browse-page *,
        .browse-page input,
        .browse-page select,
        .browse-page button,
        .browse-page h1,
        .browse-page h2,
        .browse-page h3,
        .browse-page p,
        .browse-page span,
        .browse-page div,
        .browse-page label,
        .browse-page option,
        .browse-page textarea {
          font-family: 'Barlow Condensed', sans-serif !important;
        }

        .browse-page .tournament-name {
          color: #fff !important;
        }

        .content-wrapper {
          max-width: 80rem;
          margin: 0 auto;
          padding: 8rem 1.5rem 2rem 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
          gap: 2rem;
        }

        .page-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          line-height: 1;
        }

        .page-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 2.5rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }
      `}</style>
      <Navbar />
      <div className="content-wrapper browse-page">
        <div className="page-header browse-page">
          <div className="header-left browse-page">
            <div className="page-title browse-page">TOURNAMENTS</div>
            <div className="page-subtitle browse-page">FIND AND REGISTER FOR UPCOMING TOURNAMENTS.</div>
          </div>
        </div>

        {/* Location Buttons */}
        <div className="mb-6" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {!user?.latitude || !user?.longitude ? (
            <LocationButton onLocationUpdate={fetchTournaments} />
          ) : (
            <>
              <LocationButton onLocationUpdate={fetchTournaments} compact={false} />
              <LocationButton onLocationUpdate={fetchTournaments} compact={false} removeMode={true} />
            </>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch browse-page">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#fff', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search by tournament name, organization, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#fff'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(79, 255, 176, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          {/* Sport Filter */}
          <div className="relative">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              style={{
                appearance: 'none',
                height: '100%',
                width: '100%',
                paddingLeft: '1rem',
                paddingRight: '2.5rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundImage: 'none',
                minWidth: '12rem'
              }}
            >
              <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Sports</option>
              <option value="badminton" style={{ background: '#0a1628', color: '#fff' }}>Badminton</option>
              <option value="tennis" style={{ background: '#0a1628', color: '#fff' }}>Tennis</option>
              <option value="table-tennis" style={{ background: '#0a1628', color: '#fff' }}>Table Tennis</option>
              <option value="squash" style={{ background: '#0a1628', color: '#fff' }}>Squash</option>
              <option value="pickleball" style={{ background: '#0a1628', color: '#fff' }}>Pickleball</option>
              <option value="padel" style={{ background: '#0a1628', color: '#fff' }}>Padel</option>
            </select>
            <div style={{ pointerEvents: 'none', position: 'absolute', insetY: 0, right: 0, display: 'flex', alignItems: 'center', paddingRight: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                appearance: 'none',
                height: '100%',
                width: '100%',
                paddingLeft: '1rem',
                paddingRight: '2.5rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundImage: 'none',
                minWidth: '12rem'
              }}
            >
              <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Status</option>
              <option value="OPEN" style={{ background: '#0a1628', color: '#fff' }}>Open</option>
              <option value="CLOSED" style={{ background: '#0a1628', color: '#fff' }}>Closed</option>
              <option value="ONGOING" style={{ background: '#0a1628', color: '#fff' }}>Ongoing</option>
            </select>
            <div style={{ pointerEvents: 'none', position: 'absolute', insetY: 0, right: 0, display: 'flex', alignItems: 'center', paddingRight: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Distance Filter - Only show if user has location */}
          {user?.latitude && user?.longitude && (
            <div className="relative">
              <select
                value={filterDistance}
                onChange={(e) => setFilterDistance(e.target.value)}
                style={{
                  appearance: 'none',
                  height: '100%',
                  width: '100%',
                  paddingLeft: '1rem',
                  paddingRight: '2.5rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundImage: 'none',
                  minWidth: '12rem'
                }}
              >
                <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Distances</option>
                <option value="10" style={{ background: '#0a1628', color: '#fff' }}>Within 10 km</option>
                <option value="25" style={{ background: '#0a1628', color: '#fff' }}>Within 25 km</option>
                <option value="50" style={{ background: '#0a1628', color: '#fff' }}>Within 50 km</option>
                <option value="100" style={{ background: '#0a1628', color: '#fff' }}>Within 100 km</option>
              </select>
              <div style={{ pointerEvents: 'none', position: 'absolute', insetY: 0, right: 0, display: 'flex', alignItems: 'center', paddingRight: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontFamily: "'Barlow Condensed', sans-serif" }}>Loading tournaments...</p>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div style={{
            background: 'rgba(10, 22, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <TrophyIcon style={{ width: '3rem', height: '3rem', color: '#4fffb0', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
              {searchQuery ? 'No tournaments found' : 'No tournaments available'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Barlow Condensed', sans-serif" }}>
              {searchQuery
                ? 'Try adjusting your search or filters to find tournaments.'
                : 'There are no tournaments available at the moment. Check back soon or create your own!'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Tournament Card Component
const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: { bg: 'rgba(79, 255, 176, 0.15)', text: '#4fffb0', border: 'rgba(79, 255, 176, 0.3)', label: 'Open' },
      DRAFT: { bg: 'rgba(255, 255, 255, 0.05)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.1)', label: 'Draft' },
      CLOSED: { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)', label: 'Closed' },
      ONGOING: { bg: 'rgba(127, 255, 212, 0.15)', text: '#7fffd4', border: 'rgba(127, 255, 212, 0.3)', label: 'Ongoing' },
      COMPLETED: { bg: 'rgba(255, 255, 255, 0.05)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.1)', label: 'Completed' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        background: badge.bg,
        color: badge.text,
        fontSize: '0.75rem',
        fontWeight: '700',
        borderRadius: '9999px',
        border: `1px solid ${badge.border}`,
        textTransform: 'uppercase',
        fontFamily: "'Barlow Condensed', sans-serif"
      }}>
        {badge.label}
      </span>
    )
  }

  const handleClick = () => {
    navigate(`/tournaments/${tournament.id}`)
  }

  return (
    <div
      className="browse-page"
      onClick={handleClick}
      style={{
        background: 'rgba(10, 22, 40, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Barlow Condensed', sans-serif"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(10, 22, 40, 0.8)';
        e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(10, 22, 40, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 className="tournament-name" style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {tournament.name}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', fontFamily: "'Barlow Condensed', sans-serif" }}>{tournament.organization?.name || 'Unknown Organization'}</p>
        </div>
        {getStatusBadge(tournament.status)}
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Barlow Condensed', sans-serif" }}>
          <span style={{ fontWeight: '700', color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif" }}>Date:</span> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Barlow Condensed', sans-serif" }}>
          <span style={{ fontWeight: '700', color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif" }}>Venue:</span> {tournament.venueName}
          {tournament.venueAddress && `, ${tournament.venueAddress}`}
          {`, ${tournament.city}`}
          {tournament.state && `, ${tournament.state}`}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Barlow Condensed', sans-serif" }}>
          <span style={{ fontWeight: '700', color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {tournament.sportType === 'multi' ? 'Sports:' : 'Sport:'}
          </span>{' '}
          {tournament.sports && tournament.sports.length > 0 ? (
            <span className="inline-flex gap-1 flex-wrap">
              {tournament.sports.map(sportId => {
                const sportIcons = {
                  'badminton': '🏸',
                  'table-tennis': '🏓',
                  'squash': '🎾',
                  'pickleball': '🥒',
                  'tennis': '🎾',
                  'padel': '🎾'
                }
                const sportNames = {
                  'badminton': 'Badminton',
                  'table-tennis': 'Table Tennis',
                  'squash': 'Squash',
                  'pickleball': 'Pickleball',
                  'tennis': 'Tennis',
                  'padel': 'Padel'
                }
                return (
                  <span key={sportId} className="inline-flex items-center gap-1">
                    <span>{sportIcons[sportId]}</span>
                    <span>{sportNames[sportId]}</span>
                  </span>
                )
              }).reduce((prev, curr) => [prev, ', ', curr])}
            </span>
          ) : (
            <span className="capitalize">{tournament.sport?.replace('-', ' ')}</span>
          )}
        </div>
        {tournament.events && tournament.events.length > 0 && (
          <div style={{ fontSize: '0.875rem', fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span style={{ fontWeight: '700', color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif" }}>Events:</span>{' '}
            <span style={{ color: '#fff', fontFamily: "'Barlow Condensed', sans-serif" }}>{tournament.events.map(e => e.name).join(', ')}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleClick}
        style={{
          width: '100%',
          padding: '0.625rem 1rem',
          background: '#00d4ff',
          color: '#000',
          fontWeight: '700',
          borderRadius: '12px',
          transition: 'all 0.3s',
          border: 'none',
          cursor: 'pointer',
          marginTop: 'auto',
          textTransform: 'uppercase',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          fontFamily: "'Barlow Condensed', sans-serif"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.8)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.5)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00d4ff';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        View Details
      </button>
    </div>
  )
}

export default BrowsePage
