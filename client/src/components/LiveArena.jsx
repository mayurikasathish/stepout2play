import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { sortTournamentsByDistance, sortTournamentsByCity, formatDistance, hasGPSLocation } from '../utils/distance'

const LiveArena = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('circle') // circle, turf, spotlight
  const [spotlightMatches, setSpotlightMatches] = useState([])
  const [loadingSpotlight, setLoadingSpotlight] = useState(true)
  const [nearbyTournaments, setNearbyTournaments] = useState([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)

  // Placeholder data for circle
  const circleItems = [
    { id: 1, type: 'live', player1: 'Alex', player2: 'Jordan', score: '21-18' },
    { id: 2, type: 'result', player: 'Sam', result: 'Won Finals 21-19' },
  ]

  // Fetch spotlight matches
  useEffect(() => {
    loadSpotlightMatches()
    const interval = setInterval(loadSpotlightMatches, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Fetch nearby tournaments
  useEffect(() => {
    loadNearbyTournaments()
  }, [user])

  const loadSpotlightMatches = async () => {
    try {
      const response = await api.get('/matches/spotlight')
      if (response.data.success) {
        setSpotlightMatches(response.data.matches || [])
      }
      setLoadingSpotlight(false)
    } catch (err) {
      console.error('Error loading spotlight matches:', err)
      setLoadingSpotlight(false)
    }
  }

  const loadNearbyTournaments = async () => {
    try {
      setLoadingTournaments(true)
      const response = await api.get('/tournaments', {
        params: { status: 'OPEN' }
      })
      if (response.data.success) {
        let tournaments = response.data.tournaments || []

        // Filter out past tournaments
        tournaments = tournaments.filter(t => new Date(t.registrationDeadline) > new Date())

        // Sort by distance if user has GPS, otherwise filter by exact city match only
        if (hasGPSLocation(user)) {
          // Separate tournaments with and without GPS coordinates
          const tournamentsWithGPS = tournaments.filter(t => t.latitude != null && t.longitude != null)
          const tournamentsWithoutGPS = tournaments.filter(t => t.latitude == null || t.longitude == null)

          // Sort tournaments with GPS by distance
          const sortedWithGPS = sortTournamentsByDistance(tournamentsWithGPS, user)

          // Filter tournaments without GPS to same city only
          const sameCityWithoutGPS = user?.city
            ? tournamentsWithoutGPS.filter(t => t.city && t.city.toLowerCase() === user.city.toLowerCase())
            : []

          // Combine: GPS tournaments first (sorted by distance), then same-city tournaments without GPS
          tournaments = [...sortedWithGPS, ...sameCityWithoutGPS]
        } else if (user?.city) {
          // Only show tournaments in the SAME city - no other cities
          tournaments = tournaments.filter(t =>
            t.city && t.city.toLowerCase() === user.city.toLowerCase()
          )
        }

        // Take top 3
        setNearbyTournaments(tournaments.slice(0, 3))
      }
      setLoadingTournaments(false)
    } catch (err) {
      console.error('Error loading nearby tournaments:', err)
      setLoadingTournaments(false)
    }
  }

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const name = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) {
      return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`
    }
    return name
  }

  const parseCurrentScore = (match) => {
    if (match.pointHistory) {
      try {
        const history = JSON.parse(match.pointHistory)
        if (history.length > 0) {
          const lastPoint = history[history.length - 1]
          let p1Sets = 0, p2Sets = 0
          let set = 1
          let p1 = 0, p2 = 0

          history.forEach((entry) => {
            if (entry.set > set) {
              if (p1 > p2) p1Sets++
              else p2Sets++
              set = entry.set
              p1 = 0
              p2 = 0
            }
            p1 = entry.score.p1
            p2 = entry.score.p2
          })

          return { p1: lastPoint.score.p1, p2: lastPoint.score.p2, p1Sets, p2Sets }
        }
      } catch (err) {
        console.error('Error parsing point history:', err)
      }
    }
    return { p1: 0, p2: 0, p1Sets: 0, p2Sets: 0 }
  }

  const getRoundName = (roundNumber, eventName) => {
    if (eventName?.toLowerCase().includes('final')) return 'Finals'
    if (roundNumber === 1) return 'Finals'
    if (roundNumber === 2) return 'Semi-Finals'
    if (roundNumber === 3) return 'Quarter-Finals'
    return `Round ${roundNumber}`
  }

  const handleViewMatch = (matchId) => {
    navigate(`/live?matchId=${matchId}`)
  }

  const handleViewAllLive = () => {
    navigate('/live')
  }

  return (
    <>
      <style>{`
        .live-arena-container {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          height: fit-content;
          min-height: 500px;
          position: relative;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.1);
          max-width: 380px;
          width: 100%;
          margin-right: 1.5rem;
        }

        .arena-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #00d4ff;
          margin-bottom: 1.5rem;
          text-align: center;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .top-section {
          margin-bottom: 1.5rem;
        }

        .arena-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
        }

        .arena-tab {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
          white-space: nowrap;
          flex: 1;
        }

        .arena-tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
        }

        .arena-tab.active {
          color: #4fffb0;
          background: rgba(79, 255, 176, 0.08);
        }

        .arena-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 150px;
        }

        .spotlight-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent);
          margin: 2rem 0 1.5rem 0;
        }

        .spotlight-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .spotlight-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ec4899;
          text-align: center;
          text-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
        }

        /* Liquid glass cards for YOUR CIRCLE and HOME TURF */
        .liquid-card {
          background: rgba(10, 22, 40, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .liquid-card:hover {
          background: rgba(10, 22, 40, 0.7);
          border-color: rgba(79, 255, 176, 0.2);
          transform: translateY(-2px);
        }

        /* Aurora cards for THE SPOTLIGHT */
        .aurora-card {
          position: relative;
          background: rgba(10, 22, 40, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .aurora-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(236, 72, 153, 0.1) 50%,
            transparent 70%
          );
          animation: aurora-rotate 6s linear infinite;
        }

        .aurora-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(79, 255, 176, 0.3),
            rgba(236, 72, 153, 0.3),
            rgba(79, 255, 176, 0.3)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: aurora-border 3s ease-in-out infinite;
        }

        @keyframes aurora-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes aurora-border {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        .aurora-card:hover {
          transform: translateY(-2px);
        }

        .card-content {
          position: relative;
          z-index: 1;
        }

        .card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          margin-bottom: 0.3rem;
        }

        .card-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .live-indicator {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          margin-right: 0.5rem;
          animation: pulse-live 2s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
        }
      `}</style>

      <div className="live-arena-container">
        <div className="arena-header">LIVE ARENA</div>

        {/* Top Section - Your Circle & Home Turf */}
        <div className="top-section">
          <div className="arena-tabs">
            <button
              className={`arena-tab ${activeTab === 'circle' ? 'active' : ''}`}
              onClick={() => setActiveTab('circle')}
            >
              Your Circle
            </button>
            <button
              className={`arena-tab ${activeTab === 'turf' ? 'active' : ''}`}
              onClick={() => setActiveTab('turf')}
            >
              Home Turf
            </button>
          </div>

          <div className="arena-content">
            {activeTab === 'circle' && (
              <>
                {circleItems.map(item => (
                  <div key={item.id} className="liquid-card">
                    <div className="card-content">
                      {item.type === 'live' && (
                        <>
                          <div className="card-title">
                            <span className="live-indicator"></span>
                            {item.player1} vs {item.player2}
                          </div>
                          <div className="card-subtitle">{item.score}</div>
                        </>
                      )}
                      {item.type === 'result' && (
                        <>
                          <div className="card-title">{item.player}</div>
                          <div className="card-subtitle">{item.result}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'turf' && (
              <>
                {!hasGPSLocation(user) && (
                  <div style={{
                    fontFamily: 'Barlow, sans-serif',
                    fontSize: '0.7rem',
                    color: '#4fffb0',
                    textAlign: 'center',
                    marginBottom: '0.75rem',
                    padding: '0.5rem',
                    background: 'rgba(79, 255, 176, 0.08)',
                    borderRadius: '6px',
                    border: '1px solid rgba(79, 255, 176, 0.2)'
                  }}>
                    💡 Click "Use Location" above for accurate nearby results
                  </div>
                )}

                <div style={{
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  {hasGPSLocation(user) ? 'Tournaments near you (by distance)' : user?.city ? `Tournaments in ${user.city} only` : 'Tournaments near you'}
                </div>

                {loadingTournaments ? (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    Loading tournaments...
                  </div>
                ) : nearbyTournaments.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                    {user?.city ? (
                      <>
                        No tournaments in {user.city}.<br/>
                        <button
                          onClick={() => navigate('/browse')}
                          style={{
                            color: '#4fffb0',
                            textDecoration: 'underline',
                            marginTop: '0.75rem',
                            display: 'inline-block',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          View all tournaments →
                        </button>
                      </>
                    ) : (
                      <>
                        No location set.<br/>
                        Click "Use Location" above to see nearby tournaments.
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {nearbyTournaments.map(tournament => (
                      <div
                        key={tournament.id}
                        className="liquid-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      >
                        <div className="card-content">
                          <div className="card-title">{tournament.name}</div>
                          <div className="card-subtitle">
                            {tournament.distance != null
                              ? formatDistance(tournament.distance)
                              : `${tournament.city}${tournament.state ? `, ${tournament.state}` : ''}`
                            }
                          </div>
                          <div className="card-subtitle" style={{ color: '#4fffb0', marginTop: '0.25rem' }}>
                            Registration Open
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate('/browse')}
                      style={{
                        width: '100%',
                        background: 'rgba(79, 255, 176, 0.05)',
                        border: '1px solid rgba(79, 255, 176, 0.2)',
                        color: '#4fffb0',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        marginTop: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(79, 255, 176, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(79, 255, 176, 0.05)'
                      }}
                    >
                      View All →
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="spotlight-divider"></div>

        {/* Spotlight Section */}
        <div className="spotlight-section">
          <div className="spotlight-header">THE SPOTLIGHT</div>

          {loadingSpotlight ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              Loading live matches...
            </div>
          ) : spotlightMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              No live matches right now
            </div>
          ) : (
            <>
              {spotlightMatches.map(match => {
                const score = parseCurrentScore(match)
                const roundName = getRoundName(match.roundNumber, match.event?.name)
                const sportName = match.event?.sport?.name || 'Match'

                return (
                  <div key={match.id} className="aurora-card" style={{ cursor: 'pointer' }}>
                    <div className="card-content">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="live-indicator"></span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {sportName} • {roundName}
                          </span>
                        </div>
                      </div>

                      <div className="card-title" style={{ marginBottom: '0.25rem' }}>
                        {getParticipantName(match.participant1)}
                      </div>
                      <div className="card-title" style={{ marginBottom: '0.5rem' }}>
                        {getParticipantName(match.participant2)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="card-subtitle">
                          Score: {score.p1}-{score.p2} {score.p1Sets > 0 || score.p2Sets > 0 ? `(${score.p1Sets}-${score.p2Sets})` : ''}
                        </div>
                        <button
                          onClick={() => handleViewMatch(match.id)}
                          style={{
                            background: 'rgba(236, 72, 153, 0.2)',
                            border: '1px solid rgba(236, 72, 153, 0.4)',
                            color: '#ec4899',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            fontFamily: "'Barlow Condensed', sans-serif"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(236, 72, 153, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(236, 72, 153, 0.2)'
                          }}
                        >
                          View Live
                        </button>
                      </div>

                      <div className="card-subtitle" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                        {match.event?.tournament?.name}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* View All Live Matches Button */}
              <button
                onClick={handleViewAllLive}
                style={{
                  width: '100%',
                  background: 'rgba(79, 255, 176, 0.1)',
                  border: '1px solid rgba(79, 255, 176, 0.3)',
                  color: '#4fffb0',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  marginTop: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(79, 255, 176, 0.2)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(79, 255, 176, 0.1)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                View All Live Matches →
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default LiveArena
