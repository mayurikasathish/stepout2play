import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

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

const LiveMatchesPage = () => {
  const navigate = useNavigate()
  const [liveMatches, setLiveMatches] = useState([])
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetchLiveMatches()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveMatches, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchLiveMatches = async () => {
    try {
      setLoading(true)

      // Fetch IN_PROGRESS matches
      const liveResponse = await api.get('/matches/live')

      // Fetch upcoming matches (next 30 mins)
      const upcomingResponse = await api.get('/matches/upcoming')

      // Fetch recently completed (last 2 hours)
      const recentResponse = await api.get('/matches/recent')

      setLiveMatches(liveResponse.data.matches || [])
      setUpcomingMatches(upcomingResponse.data.matches || [])
      setRecentMatches(recentResponse.data.matches || [])
    } catch (err) {
      console.error('Error fetching live matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getPlayerName = (participant) => {
    if (!participant) return 'TBD'
    const userName = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) {
      return `${userName} / ${participant.partner.firstName} ${participant.partner.lastName}`
    }
    return userName
  }

  const nextSlide = () => {
    if (liveMatches.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % liveMatches.length)
    }
  }

  const prevSlide = () => {
    if (liveMatches.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + liveMatches.length) % liveMatches.length)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)' }}>
      <style>{`
        .live-matches-page *,
        .live-matches-page input,
        .live-matches-page select,
        .live-matches-page button,
        .live-matches-page h1,
        .live-matches-page h2,
        .live-matches-page h3,
        .live-matches-page p,
        .live-matches-page span,
        .live-matches-page div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(79, 255, 176, 0.4), 0 0 40px rgba(79, 255, 176, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(79, 255, 176, 0.6), 0 0 60px rgba(79, 255, 176, 0.4);
          }
        }

        .live-badge {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Navbar />
      <main className="live-matches-page" style={{ maxWidth: '80rem', margin: '0 auto', padding: '8rem 1.5rem 2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            color: '#4fffb0',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            LIVE MATCHES
          </h1>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}>
            REAL-TIME TOURNAMENT ACTION.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', border: '3px solid rgba(79, 255, 176, 0.2)', borderTop: '3px solid #4fffb0', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>Loading matches...</p>
            </div>
          </div>
        ) : (
          <>
            {/* LIVE NOW - Cover Flow Section */}
            {liveMatches.length > 0 ? (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#4fffb0',
                    borderRadius: '50%',
                    animation: 'pulse-glow 1.5s ease-in-out infinite'
                  }}></div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#4fffb0',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em'
                  }}>
                    LIVE NOW ({liveMatches.length})
                  </h2>
                </div>

                {/* Cover Flow Carousel */}
                <div style={{ position: 'relative', overflow: 'hidden', padding: '2rem 0' }}>
                  {/* Navigation Arrows */}
                  {liveMatches.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          background: 'rgba(79, 255, 176, 0.2)',
                          border: '1px solid rgba(79, 255, 176, 0.5)',
                          borderRadius: '50%',
                          width: '3rem',
                          height: '3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 255, 176, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 255, 176, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextSlide}
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          background: 'rgba(79, 255, 176, 0.2)',
                          border: '1px solid rgba(79, 255, 176, 0.5)',
                          borderRadius: '50%',
                          width: '3rem',
                          height: '3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 255, 176, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(79, 255, 176, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Live Match Cards */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '0 4rem' }}>
                    {liveMatches.map((match, index) => {
                      const isActive = index === currentSlide
                      const distance = Math.abs(index - currentSlide)

                      return (
                        <LiveMatchCard
                          key={match.id}
                          match={match}
                          isActive={isActive}
                          distance={distance}
                          getPlayerName={getPlayerName}
                          navigate={navigate}
                        />
                      )
                    })}
                  </div>

                  {/* Slide Indicators */}
                  {liveMatches.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                      {liveMatches.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          style={{
                            width: currentSlide === index ? '2rem' : '0.75rem',
                            height: '0.75rem',
                            background: currentSlide === index ? '#4fffb0' : 'rgba(255, 255, 255, 0.3)',
                            border: 'none',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(10, 22, 40, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '3rem',
                textAlign: 'center',
                marginBottom: '3rem'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'rgba(79, 255, 176, 0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <TrophyIcon style={{ width: '2rem', height: '2rem', color: '#4fffb0' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  No Live Matches
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No matches are currently in progress. Check back soon!
                </p>
              </div>
            )}

            {/* STARTING SOON Section */}
            {upcomingMatches.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#7fffd4' }} />
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '900',
                    color: '#7fffd4',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em'
                  }}>
                    STARTING SOON ({upcomingMatches.length})
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {upcomingMatches.map((match) => (
                    <SimpleMatchCard
                      key={match.id}
                      match={match}
                      badgeColor="#7fffd4"
                      badgeLabel="STARTING SOON"
                      getPlayerName={getPlayerName}
                      formatTime={formatTime}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* RECENTLY COMPLETED Section */}
            {recentMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'rgba(255, 255, 255, 0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '900',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em'
                  }}>
                    RECENTLY COMPLETED ({recentMatches.length})
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {recentMatches.map((match) => (
                    <SimpleMatchCard
                      key={match.id}
                      match={match}
                      badgeColor="rgba(255, 255, 255, 0.6)"
                      badgeLabel="COMPLETED"
                      getPlayerName={getPlayerName}
                      formatTime={formatTime}
                      navigate={navigate}
                      isCompleted={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Live Match Card Component (Cover Flow)
const LiveMatchCard = ({ match, isActive, distance, getPlayerName, navigate }) => {
  const opacity = distance === 0 ? 1 : distance === 1 ? 0.6 : 0.3
  const scale = distance === 0 ? 1 : distance === 1 ? 0.85 : 0.7
  const zIndex = distance === 0 ? 10 : distance === 1 ? 5 : 1

  return (
    <div
      onClick={() => navigate(`/tournaments/${match.event.tournament.id}`)}
      className="live-badge"
      style={{
        flex: '0 0 auto',
        width: '400px',
        background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95))',
        backdropFilter: 'blur(10px)',
        border: '2px solid #4fffb0',
        borderRadius: '24px',
        padding: '2rem',
        cursor: 'pointer',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity,
        transform: `scale(${scale})`,
        zIndex,
        display: distance > 1 ? 'none' : 'block'
      }}
    >
      {/* LIVE Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(79, 255, 176, 0.2)',
          border: '1px solid #4fffb0',
          borderRadius: '9999px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#4fffb0',
            borderRadius: '50%',
            animation: 'pulse-glow 1.5s ease-in-out infinite'
          }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: '900', color: '#4fffb0', textTransform: 'uppercase' }}>LIVE</span>
        </div>
        {match.courtName && (
          <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>
            Court {match.courtName}
          </span>
        )}
      </div>

      {/* Event Name */}
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '900',
        color: '#4fffb0',
        marginBottom: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '-0.02em'
      }}>
        {match.event.name}
      </h3>

      {/* Players & Score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Player 1 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: match.winnerId === match.participant1Id ? 'rgba(79, 255, 176, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: `1px solid ${match.winnerId === match.participant1Id ? 'rgba(79, 255, 176, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
        }}>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: match.winnerId === match.participant1Id ? '#4fffb0' : '#fff'
          }}>
            {getPlayerName(match.participant1)}
          </span>
          <span style={{
            fontSize: '2rem',
            fontWeight: '900',
            color: match.winnerId === match.participant1Id ? '#4fffb0' : '#fff'
          }}>
            {match.score ? match.score.split('-')[0] : '0'}
          </span>
        </div>

        {/* VS */}
        <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)' }}>VS</div>

        {/* Player 2 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: match.winnerId === match.participant2Id ? 'rgba(79, 255, 176, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: `1px solid ${match.winnerId === match.participant2Id ? 'rgba(79, 255, 176, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
        }}>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: match.winnerId === match.participant2Id ? '#4fffb0' : '#fff'
          }}>
            {getPlayerName(match.participant2)}
          </span>
          <span style={{
            fontSize: '2rem',
            fontWeight: '900',
            color: match.winnerId === match.participant2Id ? '#4fffb0' : '#fff'
          }}>
            {match.score ? match.score.split('-')[1] : '0'}
          </span>
        </div>
      </div>

      {/* Tournament Name */}
      <p style={{
        marginTop: '1.5rem',
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600'
      }}>
        {match.event.tournament.name}
      </p>
    </div>
  )
}

// Simple Match Card Component
const SimpleMatchCard = ({ match, badgeColor, badgeLabel, getPlayerName, formatTime, navigate, isCompleted = false }) => {
  return (
    <div
      onClick={() => navigate(`/tournaments/${match.event.tournament.id}`)}
      style={{
        background: 'rgba(10, 22, 40, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#4fffb0', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            {match.event.name}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {match.event.tournament.name}
          </p>
        </div>
        <span style={{
          padding: '0.25rem 0.75rem',
          background: `${badgeColor}20`,
          color: badgeColor,
          fontSize: '0.75rem',
          fontWeight: '700',
          borderRadius: '9999px',
          border: `1px solid ${badgeColor}`,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          {badgeLabel}
        </span>
      </div>

      {/* Players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: match.winnerId === match.participant1Id ? '#4fffb0' : '#fff',
          fontWeight: match.winnerId === match.participant1Id ? '700' : '600'
        }}>
          <span>{getPlayerName(match.participant1)}</span>
          {isCompleted && match.score && <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>{match.score.split('-')[0]}</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontWeight: '700' }}>VS</div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: match.winnerId === match.participant2Id ? '#4fffb0' : '#fff',
          fontWeight: match.winnerId === match.participant2Id ? '700' : '600'
        }}>
          <span>{getPlayerName(match.participant2)}</span>
          {isCompleted && match.score && <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>{match.score.split('-')[1]}</span>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
        <span>{formatTime(match.scheduledAt)}</span>
        {match.courtName && <span>Court {match.courtName}</span>}
      </div>
    </div>
  )
}

export default LiveMatchesPage
