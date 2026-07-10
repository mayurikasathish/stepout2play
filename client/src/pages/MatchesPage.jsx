import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'
import BracketViewModal from '../components/BracketViewModal'
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
  const [highlightedEventId, setHighlightedEventId] = useState(null)
  const [showBracketModal, setShowBracketModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Standby promotion modal state
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [promotionEventId, setPromotionEventId] = useState(null)
  const [promotionEvent, setPromotionEvent] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [promotionSuccess, setPromotionSuccess] = useState(false)

  useEffect(() => {
    fetchMyRegistrations()

    // Check for standby promotion query params
    const standbyPromotionModal = searchParams.get('standbyPromotionModal')
    const highlightEvent = searchParams.get('highlightEvent')

    if (standbyPromotionModal) {
      // standbyPromotionModal contains registrationId
      // We'll get eventId from the registration when registrations load
      setShowPromotionModal(true)
      // Clear query params to avoid showing modal again on refresh
      setSearchParams({})
    }

    if (highlightEvent) {
      setHighlightedEventId(highlightEvent)
      // Clear after 10 seconds
      setTimeout(() => {
        setHighlightedEventId(null)
      }, 10000)
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

  // Auto-detect standby promotion opportunity when registrations load
  useEffect(() => {
    if (showPromotionModal && registrations.length > 0 && !promotionEvent) {
      // Find the first standby registration (assuming notification brings them here)
      const standbyReg = registrations.find(r => r.isStandby && r.status === 'STANDBY')
      if (standbyReg) {
        setPromotionEventId(standbyReg.eventId)
        setPromotionEvent(standbyReg.event)
      }
    }
  }, [showPromotionModal, registrations, promotionEvent])

  // Scroll to highlighted event
  useEffect(() => {
    if (highlightedEventId && registrations.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`event-${highlightedEventId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }, [highlightedEventId, registrations])

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
      } else if (errorMsg.includes('replacement window has closed')) {
        alert('⏰ The replacement deadline has passed. Replacements are no longer being accepted for this event.')
      } else {
        alert(errorMsg)
      }
      setShowPromotionModal(false)
    } finally {
      setAccepting(false)
    }
  }

  const handleRejectPromotion = async () => {
    if (!promotionEventId) return

    setAccepting(true)
    try {
      const response = await api.post(`/events/${promotionEventId}/reject-spot`)

      if (response.data.success) {
        alert('You have declined this promotion. You will remain on the standby list.')
        setShowPromotionModal(false)
        fetchMyRegistrations()
      }
    } catch (err) {
      console.error('Error rejecting spot:', err)
      alert(err.response?.data?.error || 'Failed to reject spot')
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
      <style>{`
        .matches-page *,
        .matches-page input,
        .matches-page select,
        .matches-page button,
        .matches-page h1,
        .matches-page h2,
        .matches-page h3,
        .matches-page p,
        .matches-page span,
        .matches-page div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }
      `}</style>
      <Navbar />
      <main className="matches-page" style={{ maxWidth: '80rem', margin: '0 auto', padding: '8rem 1.5rem 2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            color: '#4fffb0',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            MY MATCHES
          </h1>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}>
            TRACK YOUR TOURNAMENT REGISTRATIONS.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>Loading your matches...</p>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : registrations.length === 0 ? (
          <div style={{
            background: 'rgba(10, 22, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <TrophyIcon style={{ width: '3rem', height: '3rem', color: '#4fffb0', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>No tournament registrations</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>You haven't registered for any tournaments yet. Browse tournaments to get started!</p>
            <button
              onClick={() => navigate('/browse')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                color: '#000',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(79, 255, 176, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 255, 176, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.875rem', color: '#ec4899', fontWeight: '700' }}>{error}</p>
              </div>
            )}

            {/* Tabs */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={() => setActiveTab('upcoming')}
                style={{
                  padding: '0.75rem 1rem',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'upcoming' ? '2px solid #4fffb0' : '2px solid transparent',
                  color: activeTab === 'upcoming' ? '#4fffb0' : 'rgba(255, 255, 255, 0.6)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'upcoming') {
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'upcoming') {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
              >
                Upcoming ({upcomingRegistrations.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                style={{
                  padding: '0.75rem 1rem',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'past' ? '2px solid #4fffb0' : '2px solid transparent',
                  color: activeTab === 'past' ? '#4fffb0' : 'rgba(255, 255, 255, 0.6)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'past') {
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'past') {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
              >
                Past ({pastRegistrations.length})
              </button>
            </div>

            {/* Registrations Grid */}
            {displayRegistrations.length === 0 ? (
              <div style={{
                background: 'rgba(10, 22, 40, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <TrophyIcon style={{ width: '3rem', height: '3rem', color: '#4fffb0', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  No {activeTab} registrations
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
                  {activeTab === 'upcoming'
                    ? 'Your upcoming tournament registrations will appear here. Browse tournaments to register!'
                    : 'No past tournament registrations to show yet.'}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/browse')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                      color: '#000',
                      fontWeight: '700',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 15px rgba(79, 255, 176, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 255, 176, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Browse Tournaments
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {displayRegistrations.map((reg) => (
                  <RegistrationCard
                    key={reg.id}
                    registration={reg}
                    navigate={navigate}
                    isUpcoming={activeTab === 'upcoming'}
                    highlightedEventId={highlightedEventId}
                    onViewBracket={() => {
                      setSelectedEvent(reg.event)
                      setShowBracketModal(true)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bracket View Modal */}
      {showBracketModal && selectedEvent && (
        <BracketViewModal
          eventId={selectedEvent.id}
          onClose={() => {
            setShowBracketModal(false)
            setSelectedEvent(null)
          }}
        />
      )}

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
                      onClick={handleRejectPromotion}
                      disabled={accepting}
                      className="flex-1 px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-semibold rounded-xl border-2 border-red-300 transition-colors disabled:opacity-50"
                    >
                      {accepting ? 'Processing...' : '✗ Decline'}
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
                        '✓ Accept Promotion'
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Choose wisely! The first person to accept gets confirmed.
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
const RegistrationCard = ({ registration, navigate, isUpcoming, highlightedEventId, onViewBracket }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')
  const [hasViewedBracket, setHasViewedBracket] = useState(false)

  // Check localStorage for viewed state
  useEffect(() => {
    const viewedKey = `bracket_viewed_${registration.eventId}`
    const viewed = localStorage.getItem(viewedKey) === 'true'
    setHasViewedBracket(viewed)
  }, [registration.eventId])

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

  const hasBracket = registration.event.bracketGenerated

  const handleViewBracket = (e) => {
    e.stopPropagation()
    // Mark as viewed in localStorage
    const viewedKey = `bracket_viewed_${registration.eventId}`
    localStorage.setItem(viewedKey, 'true')
    setHasViewedBracket(true)
    // Open bracket modal
    onViewBracket()
  }

  const isHighlighted = highlightedEventId === registration.eventId

  return (
    <>
      <div
        id={`event-${registration.eventId}`}
        onClick={() => navigate(`/tournaments/${registration.event.tournament.id}`)}
        style={{
          background: isHighlighted ? 'rgba(79, 255, 176, 0.05)' : 'rgba(10, 22, 40, 0.6)',
          backdropFilter: 'blur(10px)',
          border: isHighlighted ? '1px solid rgba(79, 255, 176, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.25rem',
          transition: 'all 0.3s',
          cursor: 'pointer',
          boxShadow: isHighlighted ? '0 0 15px rgba(79, 255, 176, 0.3), 0 0 30px rgba(79, 255, 176, 0.15)' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          if (!isHighlighted) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.background = 'rgba(10, 22, 40, 0.6)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontWeight: '900',
              color: '#4fffb0',
              marginBottom: '0.25rem',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em'
            }}>
              {registration.event.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>{registration.event.tournament.name}</p>
            <span style={{
              display: 'inline-block',
              marginTop: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(0, 212, 255, 0.15)',
              color: '#00d4ff',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              {getFormatLabel(registration.event.format)}
            </span>
          </div>
          <span style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: '700',
            borderRadius: '9999px',
            border: registration.status === 'STANDBY'
              ? '1px solid rgba(251, 146, 60, 0.3)'
              : registration.status === 'WITHDRAWN'
              ? '1px solid rgba(255, 255, 255, 0.2)'
              : '1px solid rgba(79, 255, 176, 0.3)',
            background: registration.status === 'STANDBY'
              ? 'rgba(251, 146, 60, 0.15)'
              : registration.status === 'WITHDRAWN'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(79, 255, 176, 0.15)',
            color: registration.status === 'STANDBY'
              ? '#fb923c'
              : registration.status === 'WITHDRAWN'
              ? 'rgba(255, 255, 255, 0.6)'
              : '#4fffb0',
            textTransform: 'uppercase'
          }}>
            {registration.status === 'STANDBY' ? `Waitlist ${registration.standbyPosition ? `#${registration.standbyPosition}` : ''}` : registration.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} />
            <span style={{ fontWeight: '600' }}>{formatDate(registration.event.tournament.startDate)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <svg style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ fontWeight: '600' }}>{registration.event.tournament.venueName}</span>
          </div>
          {registration.partner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              <svg style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span style={{ fontWeight: '600' }}>Partner: {registration.partner.firstName} {registration.partner.lastName}</span>
            </div>
          )}
        </div>

        {registration.status === 'STANDBY' && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: '#fb923c' }}>
              <span style={{ fontWeight: '700' }}>You're on the waitlist!</span> You'll be automatically confirmed if someone withdraws before the event.
            </p>
          </div>
        )}

        {hasBracket && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <button
              onClick={handleViewBracket}
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                color: '#000',
                fontWeight: '700',
                fontSize: '1.5rem',
                boxShadow: !hasViewedBracket ? '0 0 10px rgba(79, 255, 176, 0.4), 0 0 20px rgba(79, 255, 176, 0.2)' : '0 4px 15px rgba(79, 255, 176, 0.3)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                animation: !hasViewedBracket ? 'glowPulse 2s ease-in-out infinite' : 'none'
              }}
              title="View Bracket"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 255, 176, 0.6), 0 0 40px rgba(79, 255, 176, 0.4)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = !hasViewedBracket ? '0 0 10px rgba(79, 255, 176, 0.4), 0 0 20px rgba(79, 255, 176, 0.2)' : '0 4px 15px rgba(79, 255, 176, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🏆
            </button>
            <style>{`
              @keyframes glowPulse {
                0%, 100% {
                  box-shadow: 0 0 10px rgba(79, 255, 176, 0.4), 0 0 20px rgba(79, 255, 176, 0.2);
                }
                50% {
                  box-shadow: 0 0 20px rgba(79, 255, 176, 0.6), 0 0 40px rgba(79, 255, 176, 0.4);
                }
              }
              .view-bracket-pulse {
                animation: glowPulse 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}

        {isUpcoming && registration.status !== 'WITHDRAWN' && (
          <button
            onClick={handleWithdraw}
            className="w-full mt-3 px-4 py-2 font-semibold text-sm rounded-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.15))',
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.25))'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.15))'
            }}
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
              className="relative rounded-2xl shadow-2xl w-full max-w-md p-8"
              style={{
                background: 'rgba(10, 22, 40, 0.95)',
                border: '1px solid rgba(236, 72, 153, 0.4)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.2))',
                  border: '2px solid rgba(236, 72, 153, 0.5)'
                }}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: 'uppercase',
                  color: '#ec4899',
                  letterSpacing: '-0.02em'
                }}>Confirm Withdrawal</h3>
                <p className="mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
                  Are you sure you want to withdraw from <span style={{ fontWeight: '600', color: '#fff' }}>{registration.event.name}</span>?
                </p>
                <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  The tournament organizer will be notified of your withdrawal.
                </p>

                <div className="w-full mb-6">
                  <label className="block text-sm font-medium mb-2 text-left" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Reason (optional)
                  </label>
                  <textarea
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    placeholder="e.g., Injury, Schedule conflict..."
                    className="w-full px-3 py-2 rounded-lg outline-none resize-none"
                    style={{
                      background: 'rgba(10, 22, 40, 0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    disabled={withdrawing}
                    className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmWithdraw}
                    disabled={withdrawing}
                    className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(219, 39, 119, 0.9))',
                      color: '#fff',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
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
