import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const LiveMatchesPage3D = () => {
  const { tournamentId } = useParams()
  const [searchParams] = useSearchParams()
  const matchIdFromUrl = searchParams.get('matchId')

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

  // Auto-focus on specific match when matchId is provided
  useEffect(() => {
    if (matchIdFromUrl && liveMatches.length > 0) {
      const matchIndex = liveMatches.findIndex(m => m.id === matchIdFromUrl)
      if (matchIndex !== -1) {
        setActiveIndex(matchIndex)
      }
    }
  }, [matchIdFromUrl, liveMatches])

  const loadAllMatches = async () => {
    try {
      let liveResponse
      if (tournamentId) {
        liveResponse = await api.get(`/tournaments/${tournamentId}/live-matches`)
      } else {
        liveResponse = await api.get('/matches/live')
      }

      if (liveResponse.data.success) {
        const matches = liveResponse.data.matches || []
        setLiveMatches(matches)
        if (matches.length > 0 && !liveResponse.data.tournament) {
          setTournament(matches[0].event?.tournament || null)
        } else {
          setTournament(liveResponse.data.tournament || null)
        }
      }

      const recentResponse = await api.get('/matches/recent')
      if (recentResponse.data.success) {
        const thirtyMinsAgo = Date.now() - (30 * 60 * 1000)
        const recent30 = (recentResponse.data.matches || [])
          .filter(m => m.completedAt && new Date(m.completedAt) >= thirtyMinsAgo)
          .slice(0, 6)
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
          const lastPoint = history[history.length - 1]
          let set = 1
          let p1 = 0, p2 = 0
          let p1Sets = 0, p2Sets = 0
          let completedSets = []

          history.forEach((entry) => {
            if (entry.set > set) {
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

          return { p1: lastPoint.score.p1, p2: lastPoint.score.p2, set: lastPoint.set, p1Sets, p2Sets, completedSets }
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

  const goToNext = () => setActiveIndex((prev) => (prev + 1) % liveMatches.length)
  const goToPrev = () => setActiveIndex((prev) => (prev - 1 + liveMatches.length) % liveMatches.length)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060d1f 0%,#0a1628 50%,#071a2e 100%)' }}>
        <Navbar />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'10rem' }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.2rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>Loading live matches...</div>
        </div>
      </div>
    )
  }

  if (liveMatches.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060d1f 0%,#0a1628 50%,#071a2e 100%)' }}>
        <Navbar />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:'10rem' }}>
          <div style={{ color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'2rem', fontWeight:900, textTransform:'uppercase', marginBottom:'0.5rem' }}>No Live Matches</div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontFamily:"'Barlow',sans-serif" }}>All matches are pending or completed</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060d1f 0%,#0a1628 50%,#071a2e 100%)', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,25px)} }
      `}</style>

      {/* Ambient bg orbs — same as landing page */}
      <div style={{ position:'fixed', width:600,height:600, borderRadius:'50%', background:'radial-gradient(circle,#1B4332 0%,transparent 70%)', filter:'blur(90px)', opacity:0.35, top:-150, left:-150, animation:'drift1 20s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', width:450,height:450, borderRadius:'50%', background:'radial-gradient(circle,#0a3d62 0%,transparent 70%)', filter:'blur(90px)', opacity:0.25, bottom:-100, right:-100, animation:'drift2 25s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', width:300,height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,255,176,0.12) 0%,transparent 70%)', filter:'blur(60px)', top:'35%', right:'12%', animation:'drift1 18s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }}/>

      {/* Grid overlay */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)', backgroundSize:'55px 55px', pointerEvents:'none', zIndex:0 }}/>

      <Navbar />

      {/* Header */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', paddingTop:'6rem', marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(2.5rem,6vw,4rem)', color:'#4fffb0', margin:'0 0 0.25rem', textTransform:'uppercase', letterSpacing:'-0.03em', lineHeight:1, textShadow:'0 0 40px rgba(79,255,176,0.3)' }}>
          Live Matches
        </h1>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'clamp(1.1rem,2.5vw,1.6rem)', color:'rgba(255,255,255,0.55)', margin:'0 0 0.75rem', textTransform:'uppercase', letterSpacing:'-0.01em' }}>
          Real-time tournament action.
        </p>
        {tournament && (
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            {tournament.name}
          </div>
        )}
        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.8rem', color:'rgba(255,255,255,0.25)', marginTop:'0.3rem' }}>
          {liveMatches.length} {liveMatches.length === 1 ? 'match' : 'matches'} in progress
        </div>
      </div>

      {/* ── COVER FLOW ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        perspective: '1800px',
        perspectiveOrigin: '50% 50%',
        height: '520px',
        marginBottom: '2.5rem',
        overflow: 'visible',
      }}>

        {/* Subtle floor line */}
        <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(79,255,176,0.1),transparent)', pointerEvents:'none' }}/>

        {/* Cards */}
        <div style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {liveMatches.map((match, index) => {
            const offset = index - activeIndex
            const absOffset = Math.abs(offset)
            const isActive = offset === 0

            // Cover flow transforms
            let rotateY, translateX, translateZ, translateY, scale, opacity, zIndex

            if (offset === 0) {
              rotateY = 0; translateX = 0; translateZ = 80; translateY = 0
              scale = 1; opacity = 1; zIndex = 100
            } else if (absOffset === 1) {
              rotateY = offset > 0 ? -55 : 55
              translateX = offset * 380; translateZ = -120; translateY = 20
              scale = 0.78; opacity = 0.7; zIndex = 50
            } else if (absOffset === 2) {
              rotateY = offset > 0 ? -62 : 62
              translateX = offset * 580; translateZ = -280; translateY = 40
              scale = 0.58; opacity = 0.3; zIndex = 25
            } else {
              rotateY = offset > 0 ? -68 : 68
              translateX = offset * 750; translateZ = -400; translateY = 55
              scale = 0.4; opacity = 0; zIndex = 1
            }

            const score = parseCurrentScore(match)
            const p1Name = getParticipantName(match.participant1)
            const p2Name = getParticipantName(match.participant2)

            return (
              <div
                key={match.id}
                onClick={() => !isActive && setActiveIndex(index)}
                style={{
                  position: 'absolute',
                  width: 440,
                  transformStyle: 'preserve-3d',
                  transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: 'all 0.6s cubic-bezier(0.34,1.2,0.64,1)',
                  opacity,
                  zIndex,
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {/* ── Card ── */}
                <div style={{
                  padding: '2rem',
                  borderRadius: 20,
                  background: isActive
                    ? 'rgba(10,22,44,0.72)'
                    : 'rgba(6,14,30,0.55)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: isActive
                    ? '1px solid rgba(79,255,176,0.35)'
                    : `1px solid rgba(79,255,176,${absOffset === 1 ? 0.1 : 0.04})`,
                  boxShadow: isActive
                    ? '0 0 0 1px rgba(79,255,176,0.08), 0 30px 70px rgba(0,0,0,0.5), 0 0 80px rgba(79,255,176,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}>

                  {/* Live badge + set */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation: isActive ? 'pulse-dot 1.3s ease-in-out infinite' : 'none', boxShadow: isActive ? '0 0 8px rgba(239,68,68,0.6)' : 'none' }}/>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.72rem', color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.1em' }}>Live</span>
                    </div>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      Set {score.set} · {score.p1Sets}–{score.p2Sets}
                    </span>
                  </div>

                  {/* Event + court */}
                  <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      {match.event?.name}
                    </div>
                    {match.courtName && (
                      <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', marginTop:'0.2rem' }}>
                        {match.courtName} · Match {match.matchNumber}
                      </div>
                    )}
                  </div>

                  {/* Player 1 */}
                  <div style={{
                    padding:'1.1rem 1.25rem', borderRadius:12, marginBottom:'0.6rem',
                    background:'rgba(79,255,176,0.06)',
                    border:'1px solid rgba(79,255,176,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textTransform:'uppercase', letterSpacing:'-0.01em' }}>{p1Name}</div>
                      <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.68rem', color:'rgba(79,255,176,0.5)', marginTop:'0.1rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Player 1</div>
                    </div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'3rem', color:'#4fffb0', lineHeight:1, marginLeft:'1rem', textShadow:'0 0 20px rgba(79,255,176,0.4)' }}>
                      {score.p1}
                    </div>
                  </div>

                  {/* VS */}
                  <div style={{ textAlign:'center', margin:'0.4rem 0', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'0.75rem', color:'rgba(255,255,255,0.2)', letterSpacing:'0.12em' }}>VS</div>

                  {/* Player 2 */}
                  <div style={{
                    padding:'1.1rem 1.25rem', borderRadius:12, marginTop:'0.6rem',
                    background:'rgba(236,72,153,0.06)',
                    border:'1px solid rgba(236,72,153,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textTransform:'uppercase', letterSpacing:'-0.01em' }}>{p2Name}</div>
                      <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.68rem', color:'rgba(236,72,153,0.5)', marginTop:'0.1rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Player 2</div>
                    </div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'3rem', color:'#ec4899', lineHeight:1, marginLeft:'1rem', textShadow:'0 0 20px rgba(236,72,153,0.35)' }}>
                      {score.p2}
                    </div>
                  </div>

                  {/* Completed sets */}
                  {score.completedSets?.length > 0 && (
                    <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
                      {score.completedSets.map((s, i) => (
                        <span key={i} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'0.2rem 0.6rem' }}>
                          {s.p1}–{s.p2}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sport */}
                  <div style={{ marginTop:'1.25rem', textAlign:'center' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                      {match.event?.sport?.name?.replace('-',' ') || match.event?.name || '—'}
                    </span>
                  </div>
                </div>

                {/* Card reflection */}
                {isActive && (
                  <div style={{
                    position:'absolute', left:20, right:20, top:'100%', height:60,
                    background:'linear-gradient(to bottom, rgba(10,22,44,0.25), transparent)',
                    borderRadius:'0 0 20px 20px',
                    transform:'scaleY(-1)',
                    filter:'blur(2px)',
                    opacity:0.4,
                    pointerEvents:'none',
                  }}/>
                )}
              </div>
            )
          })}
        </div>

        {/* Nav arrows */}
        {liveMatches.length > 1 && (
          <>
            {[['left', goToPrev, 'M15 19l-7-7 7-7'], ['right', goToNext, 'M9 5l7 7-7 7']].map(([side, fn, path]) => (
              <button key={side} onClick={fn} style={{
                position:'absolute', [side]: '1.5rem', top:'50%',
                transform:'translateY(-50%)',
                width:48, height:48, borderRadius:'50%',
                background:'rgba(255,255,255,0.06)',
                backdropFilter:'blur(12px)',
                border:'1px solid rgba(255,255,255,0.12)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:200, transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(79,255,176,0.12)'; e.currentTarget.style.borderColor='rgba(79,255,176,0.3)'; e.currentTarget.style.transform='translateY(-50%) scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.transform='translateY(-50%) scale(1)' }}
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.75)" strokeWidth={2.5} style={{pointerEvents:'none'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={path}/>
                </svg>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Pagination dots */}
      {liveMatches.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginBottom:'3rem', position:'relative', zIndex:1 }}>
          {liveMatches.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)} style={{
              width: activeIndex === i ? 28 : 8, height:8,
              borderRadius:999, border:'none', cursor:'pointer',
              background: activeIndex === i ? '#4fffb0' : 'rgba(255,255,255,0.2)',
              transition:'all 0.3s', padding:0,
            }}/>
          ))}
        </div>
      )}

      {/* Recently Completed */}
      {recentMatches.length > 0 && (
        <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#4fffb0',display:'inline-block' }}/>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'1.4rem', color:'#4fffb0', margin:0, textTransform:'uppercase', letterSpacing:'-0.02em' }}>Recently Completed</h2>
            <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>Last 30 mins</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'0.75rem' }}>
            {recentMatches.map((match) => {
              const p1Name = getParticipantName(match.participant1)
              const p2Name = getParticipantName(match.participant2)
              const isP1Winner = match.winnerId === match.participant1Id
              const isP2Winner = match.winnerId === match.participant2Id

              return (
                <div key={match.id} style={{
                  padding:'1rem 1.25rem',
                  background:'rgba(8,18,42,0.6)',
                  backdropFilter:'blur(20px)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:14,
                  transition:'border-color 0.2s',
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(79,255,176,0.2)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.68rem', color:'#4fffb0', textTransform:'uppercase', letterSpacing:'0.08em' }}>✓ Done</span>
                    <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>{getTimeAgo(match.completedAt)}</span>
                  </div>

                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {match.event?.tournament?.name || 'Tournament'} · {match.event?.name}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginTop:'0.6rem' }}>
                    {[[p1Name, isP1Winner], [p2Name, isP2Winner]].map(([name, isWinner], i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'0.5rem 0.75rem', borderRadius:8,
                        background: isWinner ? 'rgba(79,255,176,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isWinner ? 'rgba(79,255,176,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.9rem', color: isWinner ? '#4fffb0' : 'rgba(255,255,255,0.55)', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{name}</span>
                        {isWinner && <span style={{ color:'#4fffb0', fontSize:'0.75rem', marginLeft:'0.5rem', flexShrink:0 }}>🏆</span>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.75rem' }}>
                    <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', fontWeight:600 }}>{match.score || '—'}</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.68rem', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {match.event?.sportId?.replace('-',' ') || match.event?.sport?.name?.replace('-',' ') || ''}
                    </span>
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
