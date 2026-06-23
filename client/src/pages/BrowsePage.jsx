import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'
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
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSport, setFilterSport] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

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
        setTournaments(response.data.tournaments || [])
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
    // Exclude DRAFT tournaments unless specifically filtered
    const matchesStatus = filterStatus === 'DRAFT' || t.status !== 'DRAFT'
    return matchesSearch && matchesSport && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Tournaments
          </h1>
          <p className="text-gray-600">
            Find and register for upcoming tournaments in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tournament name, organization, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white shadow-sm"
            />
          </div>

          {/* Sport Filter */}
          <div className="relative">
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="appearance-none h-full w-full sm:w-48 pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white font-semibold text-gray-700 cursor-pointer hover:border-gray-400 shadow-sm"
              style={{ backgroundImage: 'none' }}
            >
              <option value="all">All Sports</option>
              <option value="badminton">Badminton</option>
              <option value="tennis">Tennis</option>
              <option value="table-tennis">Table Tennis</option>
              <option value="squash">Squash</option>
              <option value="pickleball">Pickleball</option>
              <option value="padel">Padel</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none h-full w-full sm:w-48 pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white font-semibold text-gray-700 cursor-pointer hover:border-gray-400 shadow-sm"
              style={{ backgroundImage: 'none' }}
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Closed</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-500">Loading tournaments...</p>
            </div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12">
            <EmptyState
              icon={TrophyIcon}
              title={searchQuery ? 'No tournaments found' : 'No tournaments available'}
              description={
                searchQuery
                  ? 'Try adjusting your search or filters to find tournaments.'
                  : 'There are no tournaments available at the moment. Check back soon or create your own!'
              }
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </main>
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
      OPEN: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-100', label: 'Open' },
      DRAFT: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', label: 'Draft' },
      CLOSED: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-100', label: 'Closed' },
      ONGOING: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-100', label: 'Ongoing' },
      COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', label: 'Completed' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-full border ${badge.border}`}>
        {badge.label}
      </span>
    )
  }

  const handleClick = () => {
    navigate(`/tournaments/${tournament.id}`)
  }

  return (
    <div
      className="glass-card rounded-2xl p-6 hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {tournament.name}
          </h3>
          <p className="text-sm text-gray-600">{tournament.organization?.name || 'Unknown Organization'}</p>
        </div>
        {getStatusBadge(tournament.status)}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-5 flex-grow">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Date:</span> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Venue:</span> {tournament.venueName}, {tournament.city}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <span className="font-medium text-gray-700">Events:</span> {tournament.events.length}
            </span>
            {tournament.participantCount > 0 && (
              <span className="text-primary-600 font-medium">
                {tournament.participantCount} registered
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleClick}
        className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md mt-auto"
      >
        View Details
      </button>
    </div>
  )
}

export default BrowsePage
