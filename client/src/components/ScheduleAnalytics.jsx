const ScheduleAnalytics = ({ analytics, tournament }) => {

  if (!analytics) return null

  const getUtilizationColor = (utilization) => {
    if (utilization >= 85) return '#22c55e' // Green - great
    if (utilization >= 70) return '#4fffb0' // Teal - good
    if (utilization >= 50) return '#eab308' // Yellow - okay
    return '#ef4444' // Red - low
  }

  return (
    <>
      <style>{`
        .analytics-container {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .analytics-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          text-transform: uppercase;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: rgba(79, 255, 176, 0.5);
          transform: translateY(-2px);
        }

        .stat-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          color: white;
          line-height: 1;
        }

        .court-utilization-section {
          margin-top: 1.5rem;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          color: #4fffb0;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .court-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .court-bar-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .court-bar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .court-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
        }

        .court-stats {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .utilization-bar {
          width: 100%;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .utilization-fill {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.5rem;
          transition: width 0.5s ease;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .event-distribution-section {
          margin-top: 1.5rem;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .event-distribution-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .event-distribution-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(6, 13, 31, 0.6);
          border-radius: 6px;
          border-left: 4px solid;
        }

        .event-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
        }

        .event-count {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .event-percentage {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #4fffb0;
        }
      `}</style>

      <div className="analytics-container">
        <div className="analytics-header">
          <span>📊</span>
          <span>Schedule Analytics</span>
        </div>

        {/* Key Metrics */}
        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{analytics.totalMatches}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Days Used</div>
            <div className="stat-value">{analytics.daysUsed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Matches Per Day</div>
            <div className="stat-value">
              {analytics.daysUsed > 0
                ? Math.round(analytics.totalMatches / analytics.daysUsed)
                : 0}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Events Scheduled</div>
            <div className="stat-value">
              {Object.keys(analytics.eventDistribution || {}).length}
            </div>
          </div>
        </div>

        {/* Court Utilization */}
        {analytics.courtUtilization && analytics.courtUtilization.length > 0 && (
          <div className="court-utilization-section">
            <div className="section-title">🏟️ Court Utilization</div>
            <div className="court-bars">
              {analytics.courtUtilization.map((court) => {
                const color = getUtilizationColor(court.utilization)

                return (
                  <div key={court.court} className="court-bar-item">
                    <div className="court-bar-header">
                      <div className="court-label">Court {court.court}</div>
                      <div className="court-stats">
                        {court.matches} matches • {court.utilization}%
                      </div>
                    </div>
                    <div className="utilization-bar">
                      <div
                        className="utilization-fill"
                        style={{
                          width: `${court.utilization}%`,
                          background: `linear-gradient(90deg, ${color}dd, ${color})`
                        }}
                      >
                        {court.utilization}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Event Distribution */}
        {analytics.eventDistribution && Object.keys(analytics.eventDistribution).length > 0 && (
          <div className="event-distribution-section">
            <div className="section-title">⚡ Event Distribution</div>
            <div className="event-distribution-list">
              {Object.entries(analytics.eventDistribution).map(([eventName, data], index) => {
                const colors = ['#3b82f6', '#a855f7', '#eab308', '#22c55e', '#f97316']
                const color = colors[index % colors.length]

                return (
                  <div
                    key={eventName}
                    className="event-distribution-item"
                    style={{ borderLeftColor: color }}
                  >
                    <div>
                      <div className="event-name">{eventName}</div>
                      <div className="event-count">{data.total} matches</div>
                    </div>
                    <div className="event-percentage">{data.percentage}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ScheduleAnalytics
