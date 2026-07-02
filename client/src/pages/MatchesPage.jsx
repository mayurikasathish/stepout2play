import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming | past

  // Standby promotion modal state
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [promotionEventId, setPromotionEventId] = useState(null)
  const [promotionEvent, setPromotionEvent] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [promotionSuccess, setPromotionSuccess] = useState(false)

  useEffect(() => {
    fetchMyRegistrations()

    // Check for standby promotion query params
    const eventId = searchParams.get('eventId')
    const standbyPromotion = searchParams.get('standbyPromotion')

    if (eventId && standbyPromotion === 'true') {
      setPromotionEventId(eventId)
      setShowPromotionModal(true)
      // Clear query params to avoid showing modal again on refresh
      setSearchParams({})
    }
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

  // Fetch event details for promotion modal
  useEffect(() => {
    if (promotionEventId && registrations.length > 0) {
      const registration = registrations.find(r => r.eventId === promotionEventId && r.isStandby)
      if (registration) {
        setPromotionEvent(registration.event)
      }
    }
  }, [promotionEventId, registrations])

  const handleAcceptPromotion = async () => {
    if (!promotionEventId) return

    setAccepting(true)
    try {
      const response = await api.post(`/events/${promotionEventId}/accept-spot`)

      if (response.data.success) {
        setPromotionSuccess(true)
        // Refresh registrations to show updated status
        setTimeout(() => {
          fetchMyRegistrations()
          setShowPromotionModal(false)
          setPromotionSuccess(false)
        }, 3000)
      }
    } catch (err) {
      console.error('Error accepting spot:', err)
      const errorMsg = err.response?.data?.error || 'Failed to accept spot'

      if (errorMsg.includes('already full')) {
        alert('⚠️ Sorry, someone else accepted the spot first! The event is now full.')
      } else if (errorMsg.includes('not on the standby list')) {
        alert('⚠️ You are not on the standby list for this event.')
      } else {
        alert(errorMsg)
      }
      setShowPromotionModal(false)
    } finally {
      setAccepting(false)
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
                  <RegistrationCard
                    key={reg.id}
                    registration={reg}
                    navigate={navigate}
                    isUpcoming={activeTab === 'upcoming'}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Standby Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              {promotionSuccess ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    🎉 Congratulations!
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    You've been successfully promoted from the waitlist to a confirmed player!
                  </p>
                  {promotionEvent && (
                    <div className="bg-success-50 border border-success-200 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-1">You're now confirmed for:</p>
                      <p className="text-lg font-bold text-gray-900">{promotionEvent.name}</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Updating your registrations...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      🎾 A Spot Has Opened Up!
                    </h3>
                    <p className="text-gray-600">
                      You have the opportunity to be promoted from the waitlist to a confirmed player!
                    </p>
                  </div>

                  {promotionEvent && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Event:</p>
                      <p className="text-xl font-bold text-gray-900 mb-4">{promotionEvent.name}</p>
                      <p className="text-sm text-gray-600">
                        A confirmed player has withdrawn, and you're eligible to take their place!
                      </p>
                    </div>
                  )}

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-800 mb-1">⏰ Time Sensitive</p>
                        <p className="text-sm text-red-700">
                          All waitlist players have been notified. The first person to accept gets the spot!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPromotionModal(false)}
                      disabled={accepting}
                      className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors disabled:opacity-50"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={handleAcceptPromotion}
                      disabled={accepting}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                      {accepting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Accepting...
                        </span>
                      ) : (
                        '✓ Accept Spot'
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    If you're no longer interested, simply close this. No action needed.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Registration Card Component
const RegistrationCard = ({ registration, navigate, isUpcoming }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')

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

  const handleWithdraw = (e) => {
    e.stopPropagation()
    setShowWithdrawModal(true)
  }

  const confirmWithdraw = async () => {
    setWithdrawing(true)
    try {
      const response = await api.post(`/registrations/${registration.id}/withdraw`, {
        reason: withdrawalReason || null
      })

      if (response.data.success) {
        alert(response.data.message || 'Withdrawal successful. The organizer has been notified.')
        setShowWithdrawModal(false)
        // Reload the page to reflect the change
        window.location.reload()
      }
    } catch (err) {
      console.error('Error withdrawing:', err)
      alert(err.response?.data?.error || 'Failed to withdraw from event')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <>
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
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
            registration.status === 'STANDBY'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : registration.status === 'WITHDRAWN'
              ? 'bg-gray-50 text-gray-700 border-gray-200'
              : 'bg-success-50 text-success-700 border-success-100'
          }`}>
            {registration.status === 'STANDBY' ? `Waitlist ${registration.standbyPosition ? `#${registration.standbyPosition}` : ''}` : registration.status}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
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

        {registration.status === 'STANDBY' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">You're on the waitlist!</span> You'll be automatically confirmed if someone withdraws before the event.
            </p>
          </div>
        )}

        {isUpcoming && registration.status !== 'WITHDRAWN' && (
          <button
            onClick={handleWithdraw}
            className="w-full mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg border border-red-200 transition-colors"
          >
            {registration.status === 'STANDBY' ? 'Remove from Waitlist' : 'Withdraw from Event'}
          </button>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowWithdrawModal(false)}>
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Withdrawal</h3>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to withdraw from <span className="font-semibold">{registration.event.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  The tournament organizer will be notified of your withdrawal.
                </p>

                <div className="w-full mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Reason (optional)
                  </label>
                  <textarea
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    placeholder="e.g., Injury, Schedule conflict..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    disabled={withdrawing}
                    className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmWithdraw}
                    disabled={withdrawing}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {withdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MatchesPage
