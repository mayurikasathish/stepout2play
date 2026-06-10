import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'
import api from '../services/api'

const CalendarIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const ClockIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MatchesPage = () => {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming | past

  useEffect(() => {
    fetchMyRegistrations()
  }, [])

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/users/me/registrations')

      if (response.data.success) {
        setRegistrations(response.data.registrations || [])
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
      setError('Failed to load your registrations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Separate registrations by tournament date
  const now = new Date()
  const upcomingRegistrations = registrations.filter(r =>
    new Date(r.event.tournament.startDate) >= now
  )
  const pastRegistrations = registrations.filter(r =>
    new Date(r.event.tournament.startDate) < now
  )

  const displayRegistrations = activeTab === 'upcoming' ? upcomingRegistrations : pastRegistrations

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Matches
          </h1>
          <p className="text-gray-600">
            Track your tournament registrations and match schedule
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-500">Loading your matches...</p>
            </div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12">
            <EmptyState
              icon={TrophyIcon}
              title="No tournament registrations"
              description="You haven't registered for any tournaments yet. Browse tournaments to get started!"
              action={() => navigate('/browse')}
              actionText="Browse Tournaments"
            />
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
                <p className="text-sm text-danger-700 font-medium">{error}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'upcoming'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming ({upcomingRegistrations.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'past'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Past ({pastRegistrations.length})
              </button>
            </div>

            {/* Registrations Grid */}
            {displayRegistrations.length === 0 ? (
              <div className="glass-card rounded-2xl p-12">
                <EmptyState
                  icon={TrophyIcon}
                  title={`No ${activeTab} registrations`}
                  description={
                    activeTab === 'upcoming'
                      ? 'Your tournament registrations will appear here. Browse tournaments to get started!'
                      : 'No past tournament registrations to show yet.'
                  }
                  action={activeTab === 'upcoming' ? () => navigate('/browse') : undefined}
                  actionText={activeTab === 'upcoming' ? 'Browse Tournaments' : undefined}
                />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRegistrations.map((reg) => (
                  <RegistrationCard key={reg.id} registration={reg} navigate={navigate} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Registration Card Component
const RegistrationCard = ({ registration, navigate }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
  }

  return (
    <div
      onClick={() => navigate(`/tournaments/${registration.event.tournament.id}`)}
      className="glass-card rounded-xl p-5 hover:shadow-glass-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {registration.event.name}
          </h3>
          <p className="text-sm text-gray-600">{registration.event.tournament.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            {getFormatLabel(registration.event.format)}
          </span>
        </div>
        <span className="px-2 py-1 bg-success-50 text-success-700 text-xs font-medium rounded-full border border-success-100">
          {registration.status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarIcon className="w-4 h-4" />
          <span>{formatDate(registration.event.tournament.startDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{registration.event.tournament.venueName}</span>
        </div>
        {registration.partner && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Partner: {registration.partner.firstName} {registration.partner.lastName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchesPage
