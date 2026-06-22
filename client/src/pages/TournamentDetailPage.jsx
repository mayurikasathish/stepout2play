import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SuccessModal from '../components/SuccessModal'
import NotEligibleModal from '../components/NotEligibleModal'
import PartnerSelectionModal from '../components/PartnerSelectionModal'
import CancelRegistrationModal from '../components/CancelRegistrationModal'
import RegistrationConfirmModal from '../components/RegistrationConfirmModal'
import api from '../services/api'

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

const ClockIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ArrowLeftIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const TournamentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registeredEvents, setRegisteredEvents] = useState(new Set())
  const [userRegistrations, setUserRegistrations] = useState(new Map())
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showNotEligibleModal, setShowNotEligibleModal] = useState(false)
  const [eligibilityData, setEligibilityData] = useState({ reasons: [], userAge: null, eventCategory: null, eventGender: null })
  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingRegistration, setCancellingRegistration] = useState(null)
  const [showRegistrationConfirm, setShowRegistrationConfirm] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState(null)

  useEffect(() => {
    fetchTournamentDetails()
    if (user) {
      fetchMyRegistrations()
    }
  }, [id, user])

  const fetchMyRegistrations = async () => {
    try {
      const response = await api.get('/users/me/registrations')
      if (response.data.success) {
        // Create a map of eventId -> registration for easy lookup
        const eventRegistrationMap = new Map(
          response.data.registrations
            .filter(reg => reg.status === 'CONFIRMED')
            .map(reg => [reg.eventId, reg])
        )
        // Also maintain the set for backward compatibility
        const eventIds = new Set(
          response.data.registrations
            .filter(reg => reg.status === 'CONFIRMED')
            .map(reg => reg.eventId)
        )
        setRegisteredEvents(eventIds)
        setUserRegistrations(eventRegistrationMap)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
    }
  }

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(`/tournaments/${id}`)

      if (response.data.success) {
        setTournament(response.data.tournament)
      }
    } catch (err) {
      console.error('Error fetching tournament:', err)
      setError('Failed to load tournament details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId, eventName, eventFormat) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Show confirmation modal first
    setPendingRegistration({ eventId, eventName, eventFormat })
    setShowRegistrationConfirm(true)
  }

  const handleRegistrationConfirmed = async () => {
    setShowRegistrationConfirm(false)

    if (!pendingRegistration) return

    const { eventId, eventName, eventFormat } = pendingRegistration

    // For doubles/mixed doubles, check user's eligibility first
    if (eventFormat === 'DOUBLES' || eventFormat === 'MIXED_DOUBLES') {
      try {
        setRegistering(true)

        // Check if the user themselves is eligible
        const eligibilityCheck = await api.get(`/events/${eventId}/check-eligibility`)

        if (!eligibilityCheck.data.eligible) {
          // Show not eligible modal - don't proceed to partner selection
          setEligibilityData({
            reasons: eligibilityCheck.data.reasons || [],
            userAge: eligibilityCheck.data.userAge,
            eventCategory: eligibilityCheck.data.eventCategory,
            eventGender: eligibilityCheck.data.eventGender
          })
          setShowNotEligibleModal(true)
          setRegistering(false)
          setPendingRegistration(null)
          return
        }

        // User is eligible, now show partner selection modal
        setRegistering(false)
        setCurrentEvent({ id: eventId, name: eventName, format: eventFormat })
        setShowPartnerModal(true)
        setPendingRegistration(null)
        return
      } catch (err) {
        console.error('Error checking eligibility:', err)
        setRegistering(false)

        // Show error
        setSuccessMessage({
          title: 'Error',
          message: 'Failed to verify eligibility. Please try again.'
        })
        setShowSuccessModal(true)
        setPendingRegistration(null)
        return
      }
    }

    // For singles, proceed directly
    registerForEvent(eventId, eventName, null)
    setPendingRegistration(null)
  }

  const registerForEvent = async (eventId, eventName, partnerId) => {
    try {
      setRegistering(true)

      // First check eligibility for singles
      if (!partnerId) {
        const eligibilityCheck = await api.get(`/events/${eventId}/check-eligibility`)

        if (!eligibilityCheck.data.eligible) {
          // Show not eligible modal
          setEligibilityData({
            reasons: eligibilityCheck.data.reasons || [],
            userAge: eligibilityCheck.data.userAge,
            eventCategory: eligibilityCheck.data.eventCategory,
            eventGender: eligibilityCheck.data.eventGender
          })
          setShowNotEligibleModal(true)
          setRegistering(false)
          return
        }
      }

      // Proceed with registration (with or without partner)
      const response = await api.post(`/events/${eventId}/register`, {
        partnerId: partnerId || undefined
      })

      if (response.data.success) {
        // Mark event as registered
        setRegisteredEvents(prev => new Set([...prev, eventId]))

        // Show success modal
        setSuccessMessage({
          title: 'Registration Successful!',
          message: partnerId
            ? `You've successfully registered for ${eventName} with your partner. Check "My Matches" to see all your registrations and match schedules.`
            : `You've successfully registered for ${eventName}. Check "My Matches" to see all your registrations and match schedules.`
        })
        setShowSuccessModal(true)

        // Refresh tournament data to update participant counts
        fetchTournamentDetails()
      }
    } catch (err) {
      console.error('Error registering:', err)

      // Check if it's an eligibility error (403)
      if (err.response?.status === 403) {
        setEligibilityData({
          reasons: err.response.data.reasons || [err.response.data.error || 'You are not eligible for this event'],
          userAge: err.response.data.userAge,
          eventCategory: err.response.data.eventCategory,
          eventGender: err.response.data.eventGender
        })
        setShowNotEligibleModal(true)
      } else {
        // Show other errors in success modal (acts as generic modal)
        const errorMessage = err.response?.data?.error || 'Failed to register. Please try again.'
        setSuccessMessage({
          title: 'Registration Failed',
          message: errorMessage
        })
        setShowSuccessModal(true)
      }
    } finally {
      setRegistering(false)
    }
  }

  const handlePartnerConfirm = (partnerId, partnerInfo) => {
    if (currentEvent) {
      registerForEvent(currentEvent.id, currentEvent.name, partnerId)
    }
  }

  const handleCancelRegistration = (eventId) => {
    const registration = userRegistrations.get(eventId)
    if (registration) {
      setCancellingRegistration(registration)
      setShowCancelModal(true)
    }
  }

  const handleCancelConfirmed = () => {
    setShowCancelModal(false)
    setCancellingRegistration(null)
    // Refresh both registrations and tournament data
    fetchMyRegistrations()
    fetchTournamentDetails()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-100', label: 'Registration Open' },
      DRAFT: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', label: 'Draft' },
      CLOSED: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-100', label: 'Registration Closed' },
      ONGOING: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-100', label: 'Ongoing' },
      COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', label: 'Completed' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span className={`inline-flex items-center px-4 py-2 ${badge.bg} ${badge.text} text-sm font-medium rounded-lg border ${badge.border}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-500">Loading tournament...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-danger-600 mb-4">{error || 'Tournament not found'}</p>
            <button
              onClick={() => navigate('/browse')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    )
  }

  const registrationDeadlinePassed = new Date(tournament.registrationDeadline) < new Date()
  const canRegister = tournament.status === 'OPEN' && !registrationDeadlinePassed

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/browse')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Browse
        </button>

        {/* Header */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {tournament.name}
              </h1>
              <p className="text-lg text-gray-600">
                Organized by {tournament.organization?.name}
              </p>
            </div>
            <div>
              {getStatusBadge(tournament.status)}
            </div>
          </div>

          {/* Tournament Details Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tournament Dates</p>
                <p className="font-semibold text-gray-900">{formatDate(tournament.startDate)}</p>
                <p className="text-sm text-gray-600">to {formatDate(tournament.endDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <LocationIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Venue</p>
                <p className="font-semibold text-gray-900">{tournament.venueName}</p>
                <p className="text-sm text-gray-600">{tournament.city}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Registration Deadline</p>
                <p className="font-semibold text-gray-900">{formatDateTime(tournament.registrationDeadline)}</p>
                {registrationDeadlinePassed && (
                  <p className="text-sm text-danger-600">Deadline passed</p>
                )}
              </div>
            </div>

          </div>

          {/* Description */}
          {tournament.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">About This Tournament</h3>
              <p className="text-gray-600 leading-relaxed">{tournament.description}</p>
            </div>
          )}

          {/* Entry Fee */}
          {tournament.entryFee && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Entry Fee</h3>
              <p className="text-2xl font-bold text-gray-900">₹{tournament.entryFee}</p>
            </div>
          )}
        </div>

        {/* Events Section */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Events</h2>

          {tournament.events && tournament.events.length > 0 ? (
            <div className="space-y-4">
              {tournament.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  tournament={tournament}
                  canRegister={canRegister}
                  onRegister={(eventId, eventName) => handleRegister(eventId, eventName, event.format)}
                  onCancelRegistration={handleCancelRegistration}
                  registering={registering}
                  isRegistered={registeredEvents.has(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No events have been created yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        actionText="View My Matches"
        onAction={() => navigate('/matches')}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to Register</h2>
              <p className="text-gray-600 mb-8">
                You need to be logged in to register for tournaments. Sign in to your account or create a new one to get started.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-all"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Not Eligible Modal */}
      <NotEligibleModal
        isOpen={showNotEligibleModal}
        onClose={() => setShowNotEligibleModal(false)}
        reasons={eligibilityData.reasons}
        userAge={eligibilityData.userAge}
        eventCategory={eligibilityData.eventCategory}
        eventGender={eligibilityData.eventGender}
      />

      {/* Partner Selection Modal */}
      <PartnerSelectionModal
        isOpen={showPartnerModal}
        onClose={() => { setShowPartnerModal(false); setCurrentEvent(null) }}
        eventId={currentEvent?.id}
        eventName={currentEvent?.name}
        eventFormat={currentEvent?.format}
        onConfirm={handlePartnerConfirm}
      />

      {/* Cancel Registration Modal */}
      {showCancelModal && cancellingRegistration && (
        <CancelRegistrationModal
          registration={cancellingRegistration}
          onClose={() => { setShowCancelModal(false); setCancellingRegistration(null) }}
          onCancelled={handleCancelConfirmed}
        />
      )}

      {/* Registration Confirmation Modal */}
      <RegistrationConfirmModal
        isOpen={showRegistrationConfirm}
        onClose={() => { setShowRegistrationConfirm(false); setPendingRegistration(null) }}
        onConfirm={handleRegistrationConfirmed}
        eventName={pendingRegistration?.eventName}
        eventFormat={pendingRegistration?.eventFormat}
      />
    </div>
  )
}

// Event Card Component
const EventCard = ({ event, tournament, canRegister, onRegister, onCancelRegistration, registering, isRegistered }) => {
  const [showDetails, setShowDetails] = useState(false)

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
  }

  const isFull = event.maxParticipants && event.participantCount >= event.maxParticipants
  const registrationDeadline = tournament ? new Date(tournament.registrationDeadline) : null
  const isDeadlinePassed = registrationDeadline ? registrationDeadline < new Date() : false

  const hasDetails = event.rules || tournament?.rules

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-all">
      <div className="flex flex-col gap-4">
        {/* Header with Event Name and Format */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {getFormatLabel(event.format)}
              </span>
            </div>

            {/* Event Details Grid - ALWAYS show these fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Age Category - Always show */}
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  Age: <span className="font-semibold text-gray-900">{event.category || 'Open'}</span>
                </span>
              </div>

              {/* Gender - Always show */}
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-600">
                  Gender: <span className="font-semibold text-gray-900">{event.gender || 'Any'}</span>
                </span>
              </div>

              {/* Max Participants - Only show if set */}
              {event.maxParticipants ? (
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Limit: <span className="font-semibold text-gray-900">{event.maxParticipants} players</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Limit: <span className="font-semibold text-gray-900">Unlimited</span>
                  </span>
                </div>
              )}
            </div>

            {/* Registration Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <UsersIcon className="w-4 h-4" />
                <span>
                  <span className="font-semibold text-gray-900">{event.participantCount || 0}</span>
                  {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} registered
                </span>
              </div>

              {event.spotsRemaining > 0 && (
                <span className="px-2 py-1 bg-success-50 text-success-700 text-xs font-medium rounded-md border border-success-200">
                  {event.spotsRemaining} spots left
                </span>
              )}

              {isFull && (
                <span className="px-2 py-1 bg-danger-50 text-danger-700 text-xs font-medium rounded-md border border-danger-200">
                  Event Full
                </span>
              )}

              {event.registrationFee && (
                <div className="flex items-center gap-1 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Fee: <span className="font-semibold text-gray-900">₹{event.registrationFee}</span></span>
                </div>
              )}
            </div>

            {/* Warning for deadline passed */}
            {isRegistered && isDeadlinePassed && (
              <div className="mt-3 inline-block">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Registration deadline passed - Contact organizer if you want to cancel the registration.</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0">
            {isRegistered ? (
              <div className="flex flex-col gap-2">
                <div className="px-6 py-3 bg-success-50 text-success-700 font-medium rounded-lg border border-success-200 flex items-center gap-2 justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Registered
                </div>
                <button
                  onClick={() => !isDeadlinePassed && onCancelRegistration(event.id)}
                  disabled={isDeadlinePassed}
                  className={`px-4 py-2 font-medium rounded-lg transition-all text-sm ${
                    isDeadlinePassed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-300'
                  }`}
                  title={isDeadlinePassed ? 'Registration deadline has passed' : 'Cancel registration'}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRegister(event.id, event.name)}
                disabled={!canRegister || isFull || registering}
                className={`px-6 py-3 font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap ${
                  !canRegister || isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {registering ? 'Registering...' : isFull ? 'Full' : 'Register'}
              </button>
            )}
          </div>
        </div>

        {/* View Details Button and Expandable Section */}
        {hasDetails && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDetails ? 'Hide Details' : 'View Details & Rules'}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-4">
                {/* Event-Specific Rules */}
                {event.rules && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Event Rules
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.rules}</p>
                  </div>
                )}

                {/* Tournament-Wide Rules */}
                {tournament?.rules && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tournament Rules
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{tournament.rules}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TournamentDetailPage
