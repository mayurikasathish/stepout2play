import { useState, useEffect } from 'react'

const MatchCountdown = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Placeholder: next match time - SET ONCE on component mount (you'll fetch this from backend)
  // const nextMatchTime = null // Set to null for "no matches" state
  const [nextMatchTime] = useState(() => new Date(Date.now() + 28 * 60 * 1000)) // Fixed: 28 mins from mount time

  // Placeholder match details (you'll fetch this from backend)
  const matchDetails = {
    tournament: 'City Championships',
    event: 'Men\'s Singles Quarterfinals',
    opponent: 'Alex Martinez',
    venue: 'Central Sports Complex',
    court: 'Court 3',
    time: '03:46 PM' // Fixed match time - doesn't change
  }

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

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // Less than 60 mins: show countdown
    if (hours === 0 && minutes < 60) {
      return {
        type: 'countdown',
        minutes,
        seconds,
        message: 'BUCKLE UP, your next match is in'
      }
    }

    // More than 60 mins: show time
    return {
      type: 'scheduled',
      time: nextMatchTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      message: 'NEXT MATCH AT'
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
          font-family: 'Barlow', sans-serif;
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
          font-family: 'Barlow', sans-serif;
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

      {!timeData ? (
        <div className="no-match-container">
          <div className="no-match-emoji">😌</div>
          <div className="no-match-text">You've got no matches today!</div>
        </div>
      ) : timeData.type === 'countdown' ? (
        <div className="countdown-wrapper">
          <div className="countdown-container">
            <div className="countdown-message">Buckle Up, your next match starts in</div>
            <div className="countdown-circle">
              <div className="countdown-display">
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
            <div className="countdown-label">MINUTES</div>

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
                <div className="detail-label">Venue</div>
                <div className="detail-value">{matchDetails.venue}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Court</div>
                <div className="detail-value">{matchDetails.court}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Match Time</div>
                <div className="detail-value">{matchDetails.time}</div>
              </div>
            </div>
          </div>
        </div>
      ) : timeData.type === 'scheduled' ? (
        <div className="countdown-container">
          <div className="countdown-message">{timeData.message}</div>
          <div className="countdown-time">{timeData.time}</div>
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
