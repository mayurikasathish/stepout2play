import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const LiveMatchesPage3D = () => {
  const { tournamentId } = useParams()
  const [liveMatches, setLiveMatches] = useState([])
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadAllMatches()
    const interval = setInterval(loadAllMatches, 5000)
    return () => clearInterval(interval)
  }, [tournamentId])

  const loadAllMatches = async () => {
    try {
      // Load live matches
      let liveResponse
      if (tournamentId) {
        liveResponse = await api.get(`/tournaments/${tournamentId}/live-matches`)
      } else {
        liveResponse = await api.get('/matches/live')
      }

      console.log('Live matches response:', liveResponse.data)

      if (liveResponse.data.success) {
        const matches = liveResponse.data.matches || []
        setLiveMatches(matches)

        // Get tournament from first match if not provided
        if (matches.length > 0 && !liveResponse.data.tournament) {
          setTournament(matches[0].event?.tournament || null)
        } else {
          setTournament(liveResponse.data.tournament || null)
        }
      }

      // Load recent completed matches
      const recentResponse = await api.get('/matches/recent')
      if (recentResponse.data.success) {
        // Filter for last 30 minutes only
        const thirtyMinsAgo = Date.now() - (30 * 60 * 1000)
        const recent30 = (recentResponse.data.matches || [])
          .filter(m => m.completedAt && new Date(m.completedAt) >= thirtyMinsAgo)
          .slice(0, 6) // Limit to 6 most recent

        setRecentMatches(recent30)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading matches:', err)
      setLoading(false)
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
          // Get current point score
          const lastPoint = history[history.length - 1]

          // Calculate sets won
          let set = 1
          let p1 = 0, p2 = 0
          let p1Sets = 0, p2Sets = 0
          let completedSets = []

          history.forEach((entry) => {
            if (entry.set > set) {
              // Set changed - previous set was completed
              completedSets.push({ p1, p2 })
              if (p1 > p2) p1Sets++
              else p2Sets++
              set = entry.set
              p1 = 0
              p2 = 0
            }
            p1 = entry.score.p1
            p2 = entry.score.p2
          })

          return {
            p1: lastPoint.score.p1,
            p2: lastPoint.score.p2,
            set: lastPoint.set,
            p1Sets,
            p2Sets,
            completedSets
          }
        }
      } catch (err) {
        console.error('Error parsing point history:', err)
      }
    }
    return { p1: 0, p2: 0, set: 1, p1Sets: 0, p2Sets: 0, completedSets: [] }
  }

  const getTimeAgo = (completedAt) => {
    const mins = Math.floor((Date.now() - new Date(completedAt)) / 60000)

    if (mins < 1) return 'Just now'
    if (mins === 1) return '1 min ago'
    return `${mins} mins ago`
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % liveMatches.length)
  }

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + liveMatches.length) % liveMatches.length)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628' }}>
        <Navbar />
        <div className="flex items-center justify-center" style={{ paddingTop: '10rem' }}>
          <div className="text-white text-xl">Loading live matches...</div>
        </div>
      </div>
    )
  }

  if (liveMatches.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: '10rem' }}>
          <div className="text-white text-2xl font-bold mb-2">No Live Matches</div>
          <div className="text-white/60">All matches are either pending or completed</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)', overflow: 'hidden' }}>
      <style>{`
        .live-matches-3d *,
        .live-matches-3d h1,
        .live-matches-3d h2,
        .live-matches-3d h3,
        .live-matches-3d p,
        .live-matches-3d span,
        .live-matches-3d div {
          font-family: 'Barlow Condensed', sans-serif !important;
        }
      `}</style>
      <Navbar />

      {/* Header */}
      <div className="live-matches-3d text-center" style={{ paddingTop: '8rem', marginBottom: '3rem' }}>
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
          letterSpacing: '-0.02em',
          marginBottom: '1rem'
        }}>
          REAL-TIME TOURNAMENT ACTION.
        </p>

        {tournament && (
          <h2 className="text-2xl font-bold text-white mb-1">
            {tournament.name}
          </h2>
        )}
        <p className="text-white/60 text-base">
          {liveMatches.length} {liveMatches.length === 1 ? 'match' : 'matches'} in progress
        </p>
      </div>

      {/* 3D Cover Flow Container */}
      <div style={{
        perspective: '2000px',
        perspectiveOrigin: '50% 50%',
        height: '700px',
        position: 'relative',
        marginBottom: '4rem'
      }}>
        {/* Card Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {liveMatches.map((match, index) => {
            const offset = index - activeIndex
            const absOffset = Math.abs(offset)

            // Center card
            const isActive = offset === 0

            // Calculate transforms
            let rotateY = 0
            let translateX = 0
            let translateZ = 0
            let scale = 1
            let opacity = 1
            let zIndex = 0

            if (offset === 0) {
              // Center card - front facing
              rotateY = 0
              translateX = 0
              translateZ = 0
              scale = 1
              opacity = 1
              zIndex = 10
            } else if (absOffset === 1) {
              // Immediate neighbors - rotate OUTWARDS (reversed)
              rotateY = offset > 0 ? 50 : -50
              translateX = offset * 350
              translateZ = -150
              scale = 0.82
              opacity = 0.7
              zIndex = 5
            } else if (absOffset === 2) {
              // Second level - rotate OUTWARDS (reversed)
              rotateY = offset > 0 ? 60 : -60
              translateX = offset * 500
              translateZ = -250
              scale = 0.65
              opacity = 0.4
              zIndex = 2
            } else {
              // Far away - hidden
              rotateY = offset > 0 ? 70 : -70
              translateX = offset * 600
              translateZ = -350
              scale = 0.5
              opacity = 0
              zIndex = 1
            }

            const score = parseCurrentScore(match)
            const p1Name = getParticipantName(match.participant1)
            const p2Name = getParticipantName(match.participant2)

            return (
              <div
                key={match.id}
                style={{
                  position: 'absolute',
                  width: '500px',
                  height: '650px',
                  transformStyle: 'preserve-3d',
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  opacity,
                  zIndex,
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
              >
                <div
                  className="p-8 rounded-2xl h-full flex flex-col relative"
                  style={{
                    background: isActive
                      ? '#0a1628'
                      : 'rgba(5, 11, 20, 0.65)',
                    backdropFilter: isActive ? 'none' : 'blur(20px)',
                    border: isActive ? '2px solid rgba(79, 255, 176, 0.4)' : 'none',
                    boxShadow: isActive
                      ? '0 20px 50px rgba(79, 255, 176, 0.15), 0 0 30px rgba(79, 255, 176, 0.1)'
                      : '0 10px 40px rgba(0, 0, 0, 0.5)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {/* Live Indicator & Match Score */}
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 bg-red-500 rounded-full ${isActive ? 'animate-pulse' : ''}`}></span>
                      <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
                        Live • Set {score.set}
                      </span>
                    </div>
                    {/* Overall Match Score (Sets) */}
                    <div className="text-white/70 text-xs font-semibold">
                      Match Score: {score.p1Sets} - {score.p2Sets}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="text-center mb-6">
                    <div className="text-white/80 text-base font-semibold">{match.event?.name}</div>
                    <div className="text-white/40 text-xs mt-1">
                      {match.courtName && `Court: ${match.courtName}`}
                      {match.courtName && ' • '}
                      Match {match.matchNumber}
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    {/* Player 1 */}
                    <div
                      className="p-6 rounded-xl flex items-center justify-between"
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '2px solid rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-lg truncate">{p1Name}</div>
                        <div className="text-blue-400/60 text-xs">Player 1</div>
                      </div>
                      <div className="text-5xl font-bold text-blue-400 ml-4">{score.p1}</div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center justify-center">
                      <div className="px-4 py-1 rounded-full text-white/40 text-xs font-bold"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        VS
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div
                      className="p-6 rounded-xl flex items-center justify-between"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '2px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-lg truncate">{p2Name}</div>
                        <div className="text-red-400/60 text-xs">Player 2</div>
                      </div>
                      <div className="text-5xl font-bold text-red-400 ml-4">{score.p2}</div>
                    </div>
                  </div>

                  {/* Completed Sets */}
                  {score.completedSets && score.completedSets.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-white/50 text-center mb-2">Completed Sets:</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {score.completedSets.map((set, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded text-xs font-mono font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255, 255, 255, 0.7)'
                            }}
                          >
                            {set.p1}-{set.p2}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sport Badge */}
                  <div className="flex justify-center mt-6">
                    <div
                      className="px-4 py-2 rounded-lg text-white/70 text-sm font-semibold capitalize"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {match.event?.sport?.name?.replace('-', ' ') || match.event?.name || 'Unknown Sport'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Arrows */}
        {liveMatches.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-20"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                e.target.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                e.target.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-20"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                e.target.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                e.target.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {liveMatches.length > 1 && (
        <div className="flex justify-center gap-2 mb-8">
          {liveMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              style={{
                width: activeIndex === index ? '32px' : '10px',
                height: '10px',
                background: activeIndex === index ? '#dc2626' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Recently Completed Section */}
      {recentMatches.length > 0 && (
        <div className="px-4 max-w-6xl mx-auto mb-12">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-bold text-green-400 uppercase tracking-wide">
              Recently Completed
            </h2>
            <span className="text-white/50 text-sm">(Last 30 mins)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMatches.map((match) => {
              const p1Name = getParticipantName(match.participant1)
              const p2Name = getParticipantName(match.participant2)
              const isP1Winner = match.winnerId === match.participant1Id
              const isP2Winner = match.winnerId === match.participant2Id

              return (
                <div
                  key={match.id}
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(10, 22, 40, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-400 text-xs font-bold uppercase">Completed</span>
                    </div>
                    <span className="text-white/50 text-xs">{getTimeAgo(match.completedAt)}</span>
                  </div>

                  {/* Tournament & Event Name */}
                  <div className="mb-3">
                    <div className="text-white/50 text-xs mb-1 truncate">
                      {match.event?.tournament?.name || 'Tournament'}
                    </div>
                    <div className="text-white/70 text-sm truncate">{match.event?.name}</div>
                  </div>

                  {/* Players */}
                  <div className="space-y-2 mb-3">
                    {/* Winner */}
                    <div
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{
                        background: isP1Winner ? 'rgba(16, 185, 129, 0.15)' : isP2Winner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isP1Winner || isP2Winner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate ${isP1Winner ? 'text-green-400' : 'text-white'}`}>
                          {p1Name}
                        </div>
                      </div>
                      {isP1Winner && (
                        <svg className="w-5 h-5 text-green-400 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </div>

                    {/* Loser */}
                    <div
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{
                        background: isP2Winner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isP2Winner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate ${isP2Winner ? 'text-green-400' : 'text-white'}`}>
                          {p2Name}
                        </div>
                      </div>
                      {isP2Winner && (
                        <svg className="w-5 h-5 text-green-400 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Score & Sport */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/60 font-mono">
                      {match.score || 'N/A'}
                    </div>
                    <div className="text-xs text-white/50 capitalize">
                      {match.event?.sportId ? match.event.sportId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : match.event?.sport?.name?.replace('-', ' ') || 'Unknown'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMatchesPage3D
