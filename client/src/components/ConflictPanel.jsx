const ConflictPanel = ({ conflicts, schedule, onAutoFix, onClose }) => {

  const getConflictIcon = (type) => {
    switch (type) {
      case 'COURT_CONFLICT':
        return '🔴'
      case 'PLAYER_CONFLICT':
        return '🟠'
      default:
        return '⚠️'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':
        return '#ef4444'
      case 'MEDIUM':
        return '#fbbf24'
      case 'LOW':
        return '#6b7280'
      default:
        return '#fbbf24'
    }
  }

  return (
    <>
      <style>{`
        .conflict-panel {
          background: rgba(6, 13, 31, 0.8);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(251, 191, 36, 0.5);
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.3rem;
          text-transform: uppercase;
          color: #fbbf24;
        }

        .close-panel-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.25rem;
          transition: all 0.2s ease;
        }

        .close-panel-btn:hover {
          color: #ef4444;
        }

        .conflicts-count {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .auto-fix-btn {
          width: 100%;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          color: #060d1f;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .auto-fix-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.3);
        }

        .conflicts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .conflict-card {
          background: rgba(6, 13, 31, 0.6);
          border-radius: 8px;
          padding: 1rem;
          border-left: 4px solid;
        }

        .conflict-card.HIGH {
          border-left-color: #ef4444;
        }

        .conflict-card.MEDIUM {
          border-left-color: #fbbf24;
        }

        .conflict-card.LOW {
          border-left-color: #6b7280;
        }

        .conflict-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .conflict-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
          text-transform: uppercase;
        }

        .severity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .conflict-message {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .conflict-details {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          padding: 0.75rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.8rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.5);
        }

        .match-list {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .match-item {
          padding: 0.25rem 0;
          color: rgba(255, 255, 255, 0.8);
        }

        .no-conflicts {
          text-align: center;
          padding: 3rem 1rem;
        }

        .no-conflicts-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .no-conflicts-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          color: #22c55e;
          text-transform: uppercase;
        }
      `}</style>

      <div className="conflict-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>⚠️</span>
            <span>Conflicts</span>
          </div>
          <button className="close-panel-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {conflicts.length > 0 ? (
          <>
            <div className="conflicts-count">
              {conflicts.length} {conflicts.length === 1 ? 'Conflict' : 'Conflicts'} Detected
            </div>

            <button className="auto-fix-btn" onClick={onAutoFix}>
              <span>🔧</span>
              Auto-Fix All Conflicts
            </button>

            <div className="conflicts-list">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className={`conflict-card ${conflict.severity || 'MEDIUM'}`}
                >
                  <div className="conflict-header">
                    <div className="conflict-type">
                      <span>{getConflictIcon(conflict.type)}</span>
                      <span>
                        {conflict.type === 'COURT_CONFLICT' ? 'Court Conflict' : 'Player Rest Violation'}
                      </span>
                    </div>
                    <span
                      className="severity-badge"
                      style={{
                        background: `${getSeverityColor(conflict.severity)}22`,
                        color: getSeverityColor(conflict.severity),
                        border: `1px solid ${getSeverityColor(conflict.severity)}44`
                      }}
                    >
                      {conflict.severity || 'MEDIUM'}
                    </span>
                  </div>

                  <div className="conflict-message">
                    {conflict.message}
                  </div>

                  <div className="conflict-details">
                    {conflict.date && (
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span>{new Date(conflict.date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {conflict.time && (
                      <div className="detail-row">
                        <span className="detail-label">Time:</span>
                        <span>{conflict.time}</span>
                      </div>
                    )}

                    {conflict.court && (
                      <div className="detail-row">
                        <span className="detail-label">Court:</span>
                        <span>{conflict.court}</span>
                      </div>
                    )}

                    {conflict.restMinutes !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">Rest Time:</span>
                        <span>{conflict.restMinutes} mins (needs {conflict.requiredRest} mins)</span>
                      </div>
                    )}

                    {conflict.matches && conflict.matches.length > 0 && (
                      <div className="match-list">
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                          Affected Matches:
                        </div>
                        {conflict.matches.map((match, idx) => (
                          <div key={idx} className="match-item">
                            {match.eventName ? (
                              `• ${match.eventName} - R${match.roundNumber} M${match.matchNumber}`
                            ) : (
                              `• Match at ${match.time}`
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-conflicts">
            <div className="no-conflicts-icon">✅</div>
            <div className="no-conflicts-text">
              No Conflicts Detected
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ConflictPanel
