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
  const [filterEventType, setFilterEventType] = useState('all')
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
        // Create a map of eventId -> registration for easy lookup (include both CONFIRMED and STANDBY)
        const eventRegistrationMap = new Map(
          response.data.registrations
            .filter(reg => reg.status === 'CONFIRMED' || reg.status === 'STANDBY')
            .map(reg => [reg.eventId, reg])
        )
        // Include both CONFIRMED and STANDBY in registeredEvents (for isRegistered check)
        const eventIds = new Set(
          response.data.registrations
            .filter(reg => reg.status === 'CONFIRMED' || reg.status === 'STANDBY')
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

    // Check eligibility FIRST before showing any modal
    try {
      setRegistering(true)
      const eligibilityCheck = await api.get(`/events/${eventId}/check-eligibility`)

      if (!eligibilityCheck.data.eligible) {
        // Show not eligible modal - don't proceed to confirmation
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

      // User is eligible, now show confirmation modal
      setRegistering(false)
      setPendingRegistration({ eventId, eventName, eventFormat })
      setShowRegistrationConfirm(true)
    } catch (err) {
      console.error('Error checking eligibility:', err)
      setRegistering(false)

      // Show error
      setSuccessMessage({
        title: 'Error',
        message: 'Failed to verify eligibility. Please try again.'
      })
      setShowSuccessModal(true)
    }
  }

  const handleRegistrationConfirmed = async () => {
    setShowRegistrationConfirm(false)

    if (!pendingRegistration) return

    const { eventId, eventName, eventFormat } = pendingRegistration

    // For doubles/mixed doubles, show partner selection modal (eligibility already checked)
    if (eventFormat === 'DOUBLES' || eventFormat === 'MIXED_DOUBLES') {
      setCurrentEvent({ id: eventId, name: eventName, format: eventFormat })
      setShowPartnerModal(true)
      setPendingRegistration(null)
      return
    }

    // For singles, proceed directly (eligibility already checked)
    registerForEvent(eventId, eventName, null)
    setPendingRegistration(null)
  }

  const registerForEvent = async (eventId, eventName, partnerId, teamName) => {
    try {
      setRegistering(true)

      // Eligibility already checked in handleRegister, so proceed with registration
      const response = await api.post(`/events/${eventId}/register`, {
        partnerId: partnerId || undefined,
        teamName: teamName || undefined
      })

      if (response.data.success) {
        // Get the registration from response
        const registration = response.data.registration
        const isWaitlisted = registration?.status === 'STANDBY' || registration?.isStandby

        // Mark event as registered
        setRegisteredEvents(prev => new Set([...prev, eventId]))

        // IMPORTANT: Also update userRegistrations map with the new registration
        setUserRegistrations(prev => {
          const newMap = new Map(prev)
          newMap.set(eventId, registration)
          return newMap
        })

        // Show success modal with appropriate message
        setSuccessMessage({
          title: isWaitlisted ? 'Added to Waitlist!' : 'Registration Successful!',
          message: isWaitlisted
            ? `You've been added to the waitlist for ${eventName}${registration?.standbyPosition ? ` (Position: ${registration.standbyPosition})` : ''}. You'll be notified if a spot opens up due to a withdrawal.`
            : partnerId
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

  const handlePartnerConfirm = (partnerId, partnerInfo, teamName) => {
    if (currentEvent) {
      registerForEvent(currentEvent.id, currentEvent.name, partnerId, teamName)
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
      OPEN: { bg: 'rgba(79, 255, 176, 0.15)', text: '#4fffb0', border: 'rgba(79, 255, 176, 0.3)', label: 'Registration Open' },
      DRAFT: { bg: 'rgba(255, 255, 255, 0.05)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.1)', label: 'Draft' },
      CLOSED: { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)', label: 'Registration Closed' },
      ONGOING: { bg: 'rgba(127, 255, 212, 0.15)', text: '#7fffd4', border: 'rgba(127, 255, 212, 0.3)', label: 'Ongoing' },
      COMPLETED: { bg: 'rgba(255, 255, 255, 0.05)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.1)', label: 'Completed' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: badge.bg,
        color: badge.text,
        fontSize: '0.875rem',
        fontWeight: '700',
        borderRadius: '12px',
        border: `1px solid ${badge.border}`,
        textTransform: 'uppercase'
      }}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
        <style>{`
          .tournament-detail *,
          .tournament-detail input,
          .tournament-detail select,
          .tournament-detail button,
          .tournament-detail h1,
          .tournament-detail h2,
          .tournament-detail h3,
          .tournament-detail p,
          .tournament-detail span,
          .tournament-detail div {
            font-family: 'Barlow Condensed', sans-serif !important;
          }
        `}</style>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontFamily: "'Barlow Condensed', sans-serif" }}>Loading tournament...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
        <style>{`
          .tournament-detail *,
          .tournament-detail input,
          .tournament-detail select,
          .tournament-detail button,
          .tournament-detail h1,
          .tournament-detail h2,
          .tournament-detail h3,
          .tournament-detail p,
          .tournament-detail span,
          .tournament-detail div {
            font-family: 'Barlow Condensed', sans-serif !important;
          }
        `}</style>
        <Navbar />
        <div className="tournament-detail" style={{ maxWidth: '80rem', margin: '0 auto', padding: '8rem 1.5rem 2rem 1.5rem' }}>
          <div style={{
            background: 'rgba(10, 22, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ec4899', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '700', fontFamily: "'Barlow Condensed', sans-serif" }}>{error || 'Tournament not found'}</p>
            <button
              onClick={() => navigate('/browse')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                color: '#000',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                fontFamily: "'Barlow Condensed', sans-serif",
                boxShadow: '0 4px 15px rgba(79, 255, 176, 0.3)'
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
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    )
  }

  const registrationDeadlinePassed = new Date(tournament.registrationDeadline) < new Date()
  // Allow registration for OPEN and ONGOING tournaments (as long as deadline hasn't passed)
  const canRegister = (tournament.status === 'OPEN' || tournament.status === 'ONGOING') && !registrationDeadlinePassed

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
      <style>{`
        .tournament-detail *,
        .tournament-detail input,
        .tournament-detail select,
        .tournament-detail button,
        .tournament-detail h1,
        .tournament-detail h2,
        .tournament-detail h3,
        .tournament-detail p,
        .tournament-detail span,
        .tournament-detail div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }
      `}</style>
      <Navbar />
      <main className="tournament-detail" style={{ maxWidth: '80rem', margin: '0 auto', padding: '8rem 1.5rem 2rem 1.5rem' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/browse')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: '600',
            textTransform: 'uppercase',
            fontSize: '0.875rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(79, 255, 176, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Browse
        </button>

        {/* Header */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: '#4fffb0',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  {tournament.name}
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Organized by {tournament.organization?.name}
                </p>
              </div>
              <div>
                {getStatusBadge(tournament.status)}
              </div>
            </div>
          </div>

          {/* Tournament Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', background: 'rgba(79, 255, 176, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#4fffb0' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Tournament Dates</p>
                <p style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{formatDate(tournament.startDate)}</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>to {formatDate(tournament.endDate)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LocationIcon style={{ width: '1.25rem', height: '1.25rem', color: '#00d4ff' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Venue</p>
                <p style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{tournament.venueName}</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {tournament.venueAddress && <>{tournament.venueAddress}<br /></>}
                  {tournament.city}{tournament.state && `, ${tournament.state}`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ec4899' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Registration Deadline</p>
                <p style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{formatDateTime(tournament.registrationDeadline)}</p>
                {registrationDeadlinePassed && (
                  <p style={{ fontSize: '0.875rem', color: '#ec4899' }}>Deadline passed</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {(tournament.organization?.contactEmail || tournament.organization?.contactPhone) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', background: 'rgba(127, 255, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#7fffd4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Contact</p>
                  {tournament.organization?.contactEmail && (
                    <a
                      href={`mailto:${tournament.organization.contactEmail}`}
                      style={{ display: 'block', fontSize: '0.875rem', color: '#00d4ff', fontWeight: '600', textDecoration: 'none' }}
                    >
                      {tournament.organization.contactEmail}
                    </a>
                  )}
                  {tournament.organization?.contactPhone && (
                    <a
                      href={`tel:${tournament.organization.contactPhone}`}
                      style={{ display: 'block', fontSize: '0.875rem', color: '#fff', fontWeight: '700', textDecoration: 'none' }}
                    >
                      {tournament.organization.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Description */}
          {tournament.description && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontWeight: '700', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '1rem' }}>About This Tournament</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>{tournament.description}</p>
            </div>
          )}

          {/* Entry Fee */}
          {tournament.entryFee && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontWeight: '700', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '1rem' }}>Entry Fee</h3>
              <p style={{ fontSize: '2rem', fontWeight: '900', color: '#fff' }}>₹{tournament.entryFee}</p>
            </div>
          )}
        </div>

        {/* Events Section */}
        <div style={{
          background: 'rgba(10, 22, 40, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#4fffb0',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em'
            }}>Events</h2>

            {/* Event Type Filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                style={{
                  appearance: 'none',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  minWidth: '180px'
                }}
              >
                <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Event Types</option>
                <option value="SINGLES" style={{ background: '#0a1628', color: '#fff' }}>Singles</option>
                <option value="DOUBLES" style={{ background: '#0a1628', color: '#fff' }}>Doubles</option>
                <option value="MIXED_DOUBLES" style={{ background: '#0a1628', color: '#fff' }}>Mixed Doubles</option>
              </select>
              <div style={{ pointerEvents: 'none', position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {tournament.events && tournament.events.length > 0 ? (
            <div className="space-y-4">
              {tournament.events
                .filter(event => filterEventType === 'all' || event.format === filterEventType)
                .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  tournament={tournament}
                  canRegister={canRegister}
                  onRegister={(eventId, eventName) => handleRegister(eventId, eventName, event.format)}
                  onCancelRegistration={handleCancelRegistration}
                  registering={registering}
                  isRegistered={registeredEvents.has(event.id)}
                  registration={userRegistrations.get(event.id)}
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
const EventCard = ({ event, tournament, canRegister, onRegister, onCancelRegistration, registering, isRegistered, registration }) => {
  const [showDetails, setShowDetails] = useState(false)

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
  }

  const isFull = event.maxParticipants && (event.confirmedCount || 0) >= event.maxParticipants
  const registrationDeadline = tournament ? new Date(tournament.registrationDeadline) : null
  const isDeadlinePassed = registrationDeadline ? registrationDeadline < new Date() : false

  const hasDetails = event.rules || tournament?.rules

  // Check if registration is on standby
  const isOnStandby = registration && (registration.status === 'STANDBY' || registration.isStandby)

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header with Event Name and Format */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#4fffb0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{event.name}</h3>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(0, 212, 255, 0.15)',
                color: '#00d4ff',
                fontSize: '0.75rem',
                fontWeight: '700',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                textTransform: 'uppercase'
              }}>
                {getFormatLabel(event.format)}
              </span>
            </div>

            {/* Event Details Grid - ALWAYS show these fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Age Category - Always show */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <svg style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Age: <span style={{ fontWeight: '700', color: '#4fffb0' }}>{event.category || 'Open'}</span>
                </span>
              </div>

              {/* Gender - Always show */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <svg style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Gender: <span style={{ fontWeight: '700', color: '#4fffb0' }}>{event.gender || 'Any'}</span>
                </span>
              </div>

              {/* Max Participants - Only show if set */}
              {event.maxParticipants ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <UsersIcon style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} />
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Limit: <span style={{ fontWeight: '700', color: '#4fffb0' }}>{event.maxParticipants} players</span>
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <UsersIcon style={{ width: '1rem', height: '1rem', color: '#4fffb0' }} />
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Limit: <span style={{ fontWeight: '700', color: '#4fffb0' }}>Unlimited</span>
                  </span>
                </div>
              )}
            </div>

            {/* Registration Info Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                <UsersIcon style={{ width: '1rem', height: '1rem' }} />
                {event.maxParticipants ? (
                  <span>
                    <span style={{ fontWeight: '700', color: '#4fffb0' }}>{event.confirmedCount || 0}/{event.maxParticipants}</span> full
                    {event.standbyCount > 0 && (
                      <span style={{ marginLeft: '0.5rem', color: '#fb923c' }}>
                        and <span style={{ fontWeight: '700' }}>{event.standbyCount}</span> on stand-by
                      </span>
                    )}
                  </span>
                ) : (
                  <span>
                    <span style={{ fontWeight: '700', color: '#4fffb0' }}>{event.confirmedCount || 0}</span> registered
                  </span>
                )}
              </div>

              {event.spotsRemaining > 0 && !isFull && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(79, 255, 176, 0.15)',
                  color: '#4fffb0',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid rgba(79, 255, 176, 0.3)'
                }}>
                  {event.spotsRemaining} spots left
                </span>
              )}

              {isFull && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid rgba(236, 72, 153, 0.3)'
                }}>
                  Event Full
                </span>
              )}

              {event.registrationFee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Fee: <span style={{ fontWeight: '700', color: '#4fffb0' }}>₹{event.registrationFee}</span></span>
                </div>
              )}
            </div>

            {/* Warning for deadline passed */}
            {isRegistered && isDeadlinePassed && (
              <div style={{ marginTop: '0.75rem', display: 'inline-block' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: '1rem', height: '1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Registration deadline passed - Contact organizer if you want to cancel the registration.</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ flexShrink: 0 }}>
            {isRegistered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: isOnStandby ? 'rgba(251, 146, 60, 0.15)' : 'rgba(79, 255, 176, 0.15)',
                  color: isOnStandby ? '#fb923c' : '#4fffb0',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: isOnStandby ? '1px solid rgba(251, 146, 60, 0.3)' : '1px solid rgba(79, 255, 176, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}>
                  {isOnStandby ? (
                    <>
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      On Standby {registration?.standbyPosition ? `(#${registration.standbyPosition})` : ''}
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Registered
                    </>
                  )}
                </div>
                <button
                  onClick={() => !isDeadlinePassed && onCancelRegistration(event.id)}
                  disabled={isDeadlinePassed}
                  style={{
                    padding: '0.5rem 1rem',
                    background: isDeadlinePassed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(236, 72, 153, 0.1)',
                    color: isDeadlinePassed ? 'rgba(255, 255, 255, 0.3)' : '#ec4899',
                    fontWeight: '700',
                    borderRadius: '12px',
                    border: isDeadlinePassed ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(236, 72, 153, 0.3)',
                    cursor: isDeadlinePassed ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase'
                  }}
                  title={isDeadlinePassed ? 'Registration deadline has passed' : 'Withdraw from event'}
                  onMouseEnter={(e) => {
                    if (!isDeadlinePassed) {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeadlinePassed) {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                    }
                  }}
                >
                  Withdraw from Event
                </button>
              </div>
            ) : isFull ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase'
                }}>
                  Event Full
                </div>
                <button
                  onClick={() => onRegister(event.id, event.name)}
                  disabled={!canRegister || registering}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fb923c',
                    color: '#000',
                    fontWeight: '700',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    opacity: (!canRegister || registering) ? 0.5 : 1,
                    cursor: (!canRegister || registering) ? 'not-allowed' : 'pointer',
                    border: 'none',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    if (canRegister && !registering) {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(251, 146, 60, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {registering ? 'Joining...' : 'Join Waitlist'}
                </button>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                  You'll be notified if a spot opens up
                </p>
              </div>
            ) : (
              <button
                onClick={() => onRegister(event.id, event.name)}
                disabled={!canRegister || registering}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !canRegister ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                  color: !canRegister ? 'rgba(255, 255, 255, 0.3)' : '#000',
                  fontWeight: '700',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  cursor: !canRegister ? 'not-allowed' : 'pointer',
                  border: 'none',
                  textTransform: 'uppercase',
                  boxShadow: !canRegister ? 'none' : '0 4px 15px rgba(79, 255, 176, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (canRegister && !registering) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 255, 176, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canRegister) {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {registering ? 'Registering...' : 'Register'}
              </button>
            )}
          </div>
        </div>

        {/* View Details Button and Expandable Section */}
        {hasDetails && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
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
