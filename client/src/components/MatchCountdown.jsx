import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const MatchCountdown = () => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextMatchTime, setNextMatchTime] = useState(null)
  const [matchDetails, setMatchDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch next match
  useEffect(() => {
    const fetchNextMatch = async () => {
      if (!user?.id) return

      try {
        const response = await api.get(`/users/${user.id}/next-match`)
        if (response.data.success && response.data.nextMatch) {
          const match = response.data.nextMatch
          setNextMatchTime(new Date(match.scheduledAt))
          setMatchDetails({
            tournament: match.tournamentName,
            event: match.eventName,
            opponent: match.opponent,
            court: match.courtName || 'TBD',
            scheduledAt: new Date(match.scheduledAt)
          })
        } else {
          setNextMatchTime(null)
          setMatchDetails(null)
        }
      } catch (err) {
        console.error('Error fetching next match:', err)
        setNextMatchTime(null)
        setMatchDetails(null)
      } finally {
        setLoading(false)
      }
    }

    fetchNextMatch()
  }, [user])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getTimeRemaining = () => {
    if (!nextMatchTime) return null

    const diff = nextMatchTime - currentTime
    if (diff <= 0) return { type: 'now', message: 'MATCH TIME!' }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // More than 24 hours: show days + hours
    if (diff > 24 * 60 * 60 * 1000) {
      return {
        type: 'days',
        days,
        hours,
        message: 'BUCKLE UP, your next match is in'
      }
    }

    // Less than 24 hours: show HH:MM:SS countdown
    return {
      type: 'countdown',
      hours,
      minutes,
      seconds,
      message: 'BUCKLE UP, your next match starts in'
    }
  }

  const timeData = getTimeRemaining()

  return (
    <>
      <style>{`
        .countdown-wrapper {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 0 30px rgba(236, 72, 153, 0.1);
        }

        .countdown-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .countdown-message {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .countdown-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 200px;
          height: 200px;
          border: 3px solid rgba(236, 72, 153, 0.3);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 30px rgba(236, 72, 153, 0.2), inset 0 0 30px rgba(236, 72, 153, 0.05);
          margin-bottom: 1rem;
        }

        .countdown-circle::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(45deg, rgba(236, 72, 153, 0.4), rgba(79, 255, 176, 0.2), rgba(236, 72, 153, 0.4));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.6;
        }

        .countdown-display {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 4rem;
          letter-spacing: -0.05em;
          color: #ec4899;
          text-shadow: 0 0 40px rgba(236, 72, 153, 0.4);
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
        }

        .digit {
          display: inline-block;
          overflow: hidden;
        }

        .digit-inner {
          display: inline-block;
          animation: flip-digit 0.6s ease-out;
        }

        @keyframes flip-digit {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .colon {
          font-size: 2.5rem;
          opacity: 0.7;
          margin: 0 0.1rem;
        }

        .match-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 400px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.4);
        }

        .detail-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .detail-value.highlight {
          color: #4fffb0;
        }


        .countdown-time {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 7rem;
          letter-spacing: -0.02em;
          color: #ec4899;
          text-shadow: 0 0 40px rgba(236, 72, 153, 0.4);
          line-height: 1;
        }

        .countdown-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .no-match-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .no-match-emoji {
          font-size: 4rem;
          margin-bottom: 0.75rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .no-match-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.8rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }

        .seconds-small {
          font-size: 3.5rem;
          opacity: 0.7;
        }
      `}</style>

      {loading ? (
        <div className="no-match-container">
          <div className="no-match-text">Loading...</div>
        </div>
      ) : !timeData ? (
        <div className="no-match-container">
          <div className="no-match-emoji">😌</div>
          <div className="no-match-text">No upcoming matches scheduled</div>
        </div>
      ) : timeData.type === 'days' ? (
        <div className="countdown-wrapper">
          <div className="countdown-container">
            <div className="countdown-message">{timeData.message}</div>
            <div className="countdown-circle">
              <div className="countdown-display">
                <span>{timeData.days}</span>
                <span className="colon" style={{ fontSize: '2rem', opacity: 0.5 }}>d</span>
                <span style={{ marginLeft: '0.5rem' }}>{timeData.hours}</span>
                <span className="colon" style={{ fontSize: '2rem', opacity: 0.5 }}>h</span>
              </div>
            </div>
            <div className="countdown-label">{timeData.days === 1 ? 'DAY' : 'DAYS'}</div>

            <div className="match-details">
              <div className="detail-item full-width">
                <div className="detail-label">Tournament</div>
                <div className="detail-value">{matchDetails.tournament}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-label">Event</div>
                <div className="detail-value">{matchDetails.event}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-label">Opponent</div>
                <div className="detail-value highlight">{matchDetails.opponent}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Court</div>
                <div className="detail-value">{matchDetails.court}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Match Time</div>
                <div className="detail-value">
                  {matchDetails.scheduledAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : timeData.type === 'countdown' ? (
        <div className="countdown-wrapper">
          <div className="countdown-container">
            <div className="countdown-message">{timeData.message}</div>
            <div className="countdown-circle">
              <div className="countdown-display" style={{ fontSize: '3rem' }}>
                <span className="digit">
                  <span key={timeData.hours} className="digit-inner">
                    {String(timeData.hours).padStart(2, '0')}
                  </span>
                </span>
                <span className="colon">:</span>
                <span className="digit">
                  <span key={timeData.minutes} className="digit-inner">
                    {String(timeData.minutes).padStart(2, '0')}
                  </span>
                </span>
                <span className="colon">:</span>
                <span className="digit">
                  <span key={timeData.seconds} className="digit-inner">
                    {String(timeData.seconds).padStart(2, '0')}
                  </span>
                </span>
              </div>
            </div>
            <div className="countdown-label">HH : MM : SS</div>

            <div className="match-details">
              <div className="detail-item full-width">
                <div className="detail-label">Tournament</div>
                <div className="detail-value">{matchDetails.tournament}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-label">Event</div>
                <div className="detail-value">{matchDetails.event}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-label">Opponent</div>
                <div className="detail-value highlight">{matchDetails.opponent}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Court</div>
                <div className="detail-value">{matchDetails.court}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Match Time</div>
                <div className="detail-value">
                  {matchDetails.scheduledAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="countdown-container">
          <div className="countdown-number">GO!</div>
          <div className="countdown-label">{timeData.message}</div>
        </div>
      )}
    </>
  )
}

export default MatchCountdown
