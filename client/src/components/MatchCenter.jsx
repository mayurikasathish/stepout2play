const MatchCenter = () => {
  // Placeholder data - you'll fetch this from backend
  const upcomingMatches = [
    {
      id: 1,
      opponent: 'Alex Martinez',
      sport: 'Tennis',
      court: 'Court 3',
      date: 'Tomorrow',
      time: '02:30 PM'
    },
    {
      id: 2,
      opponent: 'Jordan Lee',
      sport: 'Badminton',
      court: 'Court 1',
      date: 'July 10',
      time: '04:00 PM'
    },
    {
      id: 3,
      opponent: 'Sarah Kim',
      sport: 'Table Tennis',
      court: 'Court 5',
      date: 'July 12',
      time: '11:00 AM'
    }
  ]

  const recentResults = [
    {
      id: 1,
      opponent: 'Sam Chen',
      result: 'WON',
      score: '21-19',
      round: 'Semifinals',
      date: '2 days ago'
    },
    {
      id: 2,
      opponent: 'Jay Patel',
      result: 'LOST',
      score: '18-21',
      round: 'Quarterfinals',
      date: '5 days ago'
    },
    {
      id: 3,
      opponent: 'Mike Johnson',
      result: 'WON',
      score: '21-15',
      round: 'Round of 16',
      date: '1 week ago'
    }
  ]

  return (
    <>
      <style>{`
        .match-center-container {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(236, 72, 153, 0.15);
          border-radius: 16px;
          padding: 2rem;
          margin-top: 3rem;
          box-shadow: 0 0 30px rgba(236, 72, 153, 0.1);
        }

        .match-center-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #00d4ff;
          text-align: center;
          margin-bottom: 2rem;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .match-center-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-title.upcoming {
          color: #4fffb0;
        }

        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Ticket style for upcoming matches */
        .match-card.upcoming {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 8px;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }

        .match-card.upcoming::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: linear-gradient(180deg, #4fffb0, #ec4899);
        }

        .match-card.upcoming::after {
          content: '';
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(79, 255, 176, 0.1);
          border: 2px solid rgba(79, 255, 176, 0.3);
        }

        .match-card.upcoming:hover {
          border-color: rgba(79, 255, 176, 0.6);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 30px rgba(79, 255, 176, 0.25);
        }

        .ticket-content {
          padding: 1.25rem;
          padding-left: 1.75rem;
        }

        /* Clay aurora for results */
        .match-card.won,
        .match-card.lost {
          background: linear-gradient(
            135deg,
            rgba(139, 90, 60, 0.15) 0%,
            rgba(236, 72, 153, 0.12) 50%,
            rgba(160, 100, 70, 0.15) 100%
          );
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(236, 72, 153, 0.2);
          border-radius: 12px;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .match-card.won::before,
        .match-card.lost::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 20% 50%,
            rgba(236, 72, 153, 0.08) 0%,
            transparent 50%
          );
          pointer-events: none;
        }

        .match-card.won {
          border-left: 3px solid #4fffb0;
        }

        .match-card.won:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.2);
          background: linear-gradient(
            135deg,
            rgba(139, 90, 60, 0.2) 0%,
            rgba(79, 255, 176, 0.15) 50%,
            rgba(160, 100, 70, 0.2) 100%
          );
        }

        .match-card.lost {
          border-left: 3px solid rgba(236, 72, 153, 0.4);
        }

        .match-card.lost:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(236, 72, 153, 0.15);
        }

        .match-opponent {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .match-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .match-info {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .match-info.highlight {
          color: #4fffb0;
          font-weight: 600;
        }

        .match-result {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .match-result.won {
          color: #4fffb0;
        }

        .match-result.lost {
          color: rgba(255, 255, 255, 0.4);
        }

        .match-score {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .match-center-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="match-center-container">
        <div className="match-center-header">MATCH CENTER</div>

        <div className="match-center-grid">
          {/* Upcoming Matches */}
          <div>
            <div className="section-title upcoming">UPCOMING</div>
            <div className="matches-list">
              {upcomingMatches.map(match => (
                <div key={match.id} className="match-card upcoming">
                  <div className="ticket-content">
                    <div className="match-opponent">vs {match.opponent}</div>
                    <div className="match-details">
                      <div className="match-info">{match.sport} • {match.court}</div>
                      <div className="match-info highlight">{match.date} • {match.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <div className="section-title">RECENT RESULTS</div>
            <div className="matches-list">
              {recentResults.map(match => (
                <div key={match.id} className={`match-card ${match.result.toLowerCase()}`}>
                  <div className="match-opponent">vs {match.opponent}</div>
                  <div className="match-details">
                    <div className={`match-result ${match.result.toLowerCase()}`}>
                      {match.result === 'WON' ? '✓' : '✗'} {match.result} {match.score}
                    </div>
                    <div className="match-info">{match.round}</div>
                    <div className="match-info">{match.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MatchCenter
