import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SingleEliminationBracket from './SingleEliminationBracket'
import RoundRobinBracket from './RoundRobinBracket'
import HybridBracket from './HybridBracket'

const BracketViewModal = ({ eventId, onClose }) => {
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSchedule, setShowSchedule] = useState(true)
  const [showMyMatches, setShowMyMatches] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadBracketData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshBracketData()
    }, 30000)
    return () => clearInterval(interval)
  }, [eventId])

  const loadBracketData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${eventId}/bracket`)

      if (response.data.success) {
        setEvent(response.data.event)
        setMatches(response.data.matches || [])
      }
    } catch (err) {
      console.error('Error loading bracket:', err)
      alert('Failed to load bracket')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const refreshBracketData = async () => {
    try {
      setRefreshing(true)
      const response = await api.get(`/events/${eventId}/bracket`)

      if (response.data.success) {
        setEvent(response.data.event)
        const newMatches = response.data.matches || []
        // Silently update matches without showing toast
        setMatches(newMatches)
      }
    } catch (err) {
      console.error('Error refreshing bracket:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
  }

  const getPlayerName = (participant) => {
    if (!participant || !participant.user) return 'TBD'
    return `${participant.user.firstName} ${participant.user.lastName}`
  }

  // Get user's matches
  const userMatches = matches.filter(match => {
    if (!user) return false
    const p1 = match.participant1?.userId
    const p2 = match.participant2?.userId
    return p1 === user.id || p2 === user.id
  })

  // Get live matches
  const liveMatches = matches.filter(m => m.status === 'IN_PROGRESS')

  // Get upcoming matches
  const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED')

  // Get completed matches
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')

  // Find user's next match
  const nextUserMatch = userMatches.find(m => m.status === 'SCHEDULED')

  const formatMatchTime = (dateString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeUntilMatch = (dateString) => {
    if (!dateString) return null
    const now = new Date()
    const matchTime = new Date(dateString)
    const diff = matchTime - now

    if (diff < 0) return 'Started'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const MatchItem = ({ match, showTime = true }) => {
    const p1 = match.participant1
    const p2 = match.participant2

    return (
      <div style={{ padding: '0.75rem', background: 'rgba(10, 22, 40, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.3s' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.background = 'rgba(10, 22, 40, 0.6)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4fffb0', textTransform: 'uppercase' }}>
            {match.roundNumber ? `Round ${match.roundNumber}` : 'Match'}
            {match.matchNumber ? ` #${match.matchNumber}` : ''}
          </span>
          {showTime && match.scheduledTime && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {formatMatchTime(match.scheduledTime)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: match.winnerId === p1?.id ? '700' : '600', color: match.winnerId === p1?.id ? '#4fffb0' : 'rgba(255, 255, 255, 0.8)' }}>
              {getPlayerName(p1)}
            </span>
            {match.participant1Score !== null && (
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#fff' }}>{match.participant1Score}</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: match.winnerId === p2?.id ? '700' : '600', color: match.winnerId === p2?.id ? '#4fffb0' : 'rgba(255, 255, 255, 0.8)' }}>
              {getPlayerName(p2)}
            </span>
            {match.participant2Score !== null && (
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#fff' }}>{match.participant2Score}</span>
            )}
          </div>
        </div>

        {/* Detailed Score for Completed Matches */}
        {match.status === 'COMPLETED' && match.score && (
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(79, 255, 176, 0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(79, 255, 176, 0.8)', fontWeight: '600', marginBottom: '0.25rem' }}>
              FINAL
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4fffb0', fontWeight: '700', fontFamily: 'monospace' }}>
              {match.score}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading || !event) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(79, 255, 176, 0.3)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95rem' }}>Loading bracket...</p>
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)' }}>
      <style>{`
        .bracket-modal *,
        .bracket-modal button,
        .bracket-modal h1,
        .bracket-modal h2,
        .bracket-modal h3,
        .bracket-modal p,
        .bracket-modal span,
        .bracket-modal div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }
      `}</style>
      {/* Header */}
      <div className="bracket-modal" style={{ background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))', borderBottom: '1px solid rgba(79, 255, 176, 0.2)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)', paddingTop: '5rem' }}>
        <div style={{ maxWidth: 'calc(100% - 2rem)', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#4fffb0', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>{event.name}</h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginTop: '0.25rem' }}>{event.tournament?.name || ''}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '0.5rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={handleZoomOut}
                style={{ color: '#fff', fontWeight: '700', fontSize: '1.125rem', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                title="Zoom out"
                onMouseEnter={(e) => e.currentTarget.style.color = '#4fffb0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
              >
                −
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', minWidth: '3rem', textAlign: 'center' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                style={{ color: '#fff', fontWeight: '700', fontSize: '1.125rem', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                title="Zoom in"
                onMouseEnter={(e) => e.currentTarget.style.color = '#4fffb0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
              >
                +
              </button>
              <button
                onClick={handleZoomReset}
                style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', textTransform: 'uppercase' }}
                title="Reset zoom"
                onMouseEnter={(e) => e.currentTarget.style.color = '#4fffb0'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
              >
                Reset
              </button>
            </div>

            {/* My Matches Toggle */}
            {userMatches.length > 0 && (
              <button
                onClick={() => setShowMyMatches(!showMyMatches)}
                style={{
                  padding: '0.5rem 1rem',
                  background: showMyMatches ? 'rgba(79, 255, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: showMyMatches ? '#4fffb0' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: `1px solid ${showMyMatches ? 'rgba(79, 255, 176, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = showMyMatches ? 'rgba(79, 255, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = showMyMatches ? 'rgba(79, 255, 176, 0.4)' : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {showMyMatches ? 'Hide My Matches' : 'Show My Matches'}
              </button>
            )}

            {/* Schedule Toggle */}
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              style={{
                padding: '0.5rem 1rem',
                background: showSchedule ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: showSchedule ? '#00d4ff' : 'rgba(255, 255, 255, 0.8)',
                fontWeight: '700',
                borderRadius: '12px',
                border: `1px solid ${showSchedule ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.875rem',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showSchedule ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = showSchedule ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {showSchedule ? 'Hide Schedule' : 'Show Schedule'}
            </button>

            {/* Refresh */}
            <button
              onClick={refreshBracketData}
              disabled={refreshing}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(79, 255, 176, 0.15)',
                color: '#4fffb0',
                fontWeight: '700',
                borderRadius: '12px',
                border: '1px solid rgba(79, 255, 176, 0.3)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                opacity: refreshing ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.15)';
                }
              }}
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <svg style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' }}>
        {/* Your Upcoming Matches */}
        {showMyMatches && userMatches.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.95))', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(79, 255, 176, 0.2)', borderTop: '1px solid rgba(79, 255, 176, 0.1)' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h3 style={{ color: '#fff', fontWeight: '900', fontSize: '1.125rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                🎾 Your Confirmed Matches
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 280px))', gap: '0.75rem', justifyContent: 'start' }}>
                {userMatches.map((match) => {
                  const isScheduled = match.status === 'SCHEDULED'
                  const isCompleted = match.status === 'COMPLETED'
                  const isLive = match.status === 'IN_PROGRESS'
                  const opponent = match.participant1?.userId === user.id ? match.participant2 : match.participant1
                  const isBye = !opponent || (!match.participant1 || !match.participant2)

                  return (
                    <div key={match.id} style={{ background: 'rgba(10, 22, 40, 0.8)', borderRadius: '10px', padding: '0.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(79, 255, 176, 0.2)' }}>
                      {/* Header Row: Round + Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4fffb0', textTransform: 'uppercase' }}>
                          {match.roundNumber ? `Round ${match.roundNumber}` : 'Match'} {match.matchNumber ? `#${match.matchNumber}` : ''}
                        </span>
                        {isBye ? (
                          <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', fontSize: '0.7rem', fontWeight: '700', borderRadius: '6px', border: '1px solid rgba(251, 146, 60, 0.3)' }}>BYE</span>
                        ) : (
                          <>
                            {isLive && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: '700', color: '#ef4444', padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <span style={{ width: '0.5rem', height: '0.5rem', background: '#ef4444', borderRadius: '50%' }}></span>
                                LIVE
                              </span>
                            )}
                            {isCompleted && (
                              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4fffb0', padding: '0.25rem 0.5rem', background: 'rgba(79, 255, 176, 0.15)', borderRadius: '6px' }}>✓ DONE</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Match Info: ALWAYS SHOW - Date, Time, Court */}
                      {!isBye && (
                        <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(0, 212, 255, 0.12)', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#00d4ff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>📅</span>
                            <span>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date: TBD'}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#00d4ff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>⏰</span>
                            <span>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Time: TBD'}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#4fffb0', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>🏟️</span>
                            <span>{match.court ? `Court ${match.court}` : 'Court: TBD'}</span>
                          </div>
                        </div>
                      )}

                      {/* Players */}
                      <div style={{ fontSize: '0.85rem' }}>
                        {isBye ? (
                          <div style={{ textAlign: 'center', padding: '0.5rem 0', color: '#fb923c', fontWeight: '700', fontSize: '0.8rem' }}>
                            Auto-advance (BYE)
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                              <span style={{ fontWeight: '700', color: '#4fffb0', fontSize: '0.85rem' }}>You</span>
                              {match.participant1Score !== null && (
                                <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem' }}>{match.participant1?.userId === user.id ? match.participant1Score : match.participant2Score}</span>
                              )}
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.15)', margin: '0.15rem 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', fontWeight: '600' }}>{getPlayerName(opponent)}</span>
                              {match.participant2Score !== null && (
                                <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem' }}>{match.participant1?.userId === user.id ? match.participant2Score : match.participant1Score}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Score for Completed Matches */}
                      {isCompleted && match.score && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(79, 255, 176, 0.1)', borderRadius: '6px', border: '1px solid rgba(79, 255, 176, 0.2)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                            Final Score
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#4fffb0', fontWeight: '700', fontFamily: 'monospace' }}>
                            {match.score}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bracket and Schedule Container */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Bracket View */}
        <div
          style={{ width: showSchedule ? '70%' : '100%', overflow: 'auto', padding: '1.5rem', transition: 'all 0.3s', background: 'rgba(6, 13, 31, 0.6)' }}
        >
          <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
            {event.bracketFormat === 'SINGLE_ELIMINATION' && (
              <SingleEliminationBracket
                matches={matches}
                onMatchClick={null}
                onCaptureScorecard={null}
                eventName={event.name}
                tournamentName={event.tournament?.name}
              />
            )}
            {event.bracketFormat === 'ROUND_ROBIN' && (
              <RoundRobinBracket
                matches={matches}
                onMatchClick={null}
                onCaptureScorecard={null}
                eventName={event.name}
                tournamentName={event.tournament?.name}
              />
            )}
            {event.bracketFormat === 'HYBRID' && (
              <HybridBracket
                bracket={{ event, matches }}
                onMatchClick={null}
                onCaptureScorecard={null}
                isOrganizer={false}
              />
            )}
          </div>
        </div>

        {/* Schedule Sidebar */}
        {showSchedule && (
          <div style={{ width: '30%', borderLeft: '1px solid rgba(79, 255, 176, 0.2)', background: 'rgba(10, 22, 40, 0.8)', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* User's Next Match */}
              {nextUserMatch && (
                <div style={{ background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.15), rgba(0, 212, 255, 0.15))', border: '2px solid rgba(79, 255, 176, 0.3)', borderRadius: '16px', padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                    ⏱️ Your Next Match
                  </h3>
                  <MatchItem match={nextUserMatch} />
                  {nextUserMatch.scheduledTime && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(10, 22, 40, 0.8)', borderRadius: '12px', border: '1px solid rgba(79, 255, 176, 0.2)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#4fffb0' }}>
                          {getTimeUntilMatch(nextUserMatch.scheduledTime)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>until match starts</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Matches */}
              {liveMatches.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                    <span style={{ position: 'relative', display: 'flex', height: '0.625rem', width: '0.625rem' }}>
                      <span style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#f87171', opacity: 0.75 }}></span>
                      <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '0.625rem', width: '0.625rem', background: '#ef4444' }}></span>
                    </span>
                    Live Now
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {liveMatches.slice(0, 3).map(match => (
                      <MatchItem key={match.id} match={match} showTime={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Upcoming
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '16rem', overflowY: 'auto' }}>
                    {upcomingMatches.slice(0, 5).map(match => (
                      <MatchItem key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Matches */}
              {completedMatches.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Completed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '12rem', overflowY: 'auto' }}>
                    {completedMatches.slice(0, 5).map(match => (
                      <MatchItem key={match.id} match={match} showTime={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default BracketViewModal
