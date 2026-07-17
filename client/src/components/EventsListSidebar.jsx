const EventsListSidebar = ({ events, schedule, selectedEvent, onEventSelect, onGenerateKnockout }) => {

  const eventColors = {
    0: '#3b82f6', // Blue
    1: '#a855f7', // Purple
    2: '#eab308', // Yellow
    3: '#22c55e', // Green
    4: '#f97316'  // Orange
  }

  const getEventScheduleInfo = (eventId) => {
    const eventMatches = schedule.filter(m => m.eventId === eventId)

    if (eventMatches.length === 0) {
      return { scheduled: 0, total: 0, status: 'not-scheduled' }
    }

    // Get total matches for this event
    const event = events.find(e => e.id === eventId)
    const total = event?.matchCount || event?.matches?.length || 0

    return {
      scheduled: eventMatches.length,
      total,
      status: total > 0 && eventMatches.length === total ? 'complete' : eventMatches.length > 0 ? 'partial' : 'not-scheduled'
    }
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { text: 'HIGH', color: '#ef4444' },
      medium: { text: 'MED', color: '#eab308' },
      low: { text: 'LOW', color: '#6b7280' }
    }

    const badge = badges[priority] || badges.medium

    return (
      <span
        style={{
          background: `${badge.color}22`,
          color: badge.color,
          border: `1px solid ${badge.color}44`,
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}
      >
        {badge.text}
      </span>
    )
  }

  return (
    <>
      <style>{`
        .events-sidebar {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .sidebar-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.3rem;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .event-card {
          background: rgba(6, 13, 31, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .event-card:hover {
          border-color: rgba(79, 255, 176, 0.5);
          transform: translateX(4px);
        }

        .event-card.selected {
          border-color: #4fffb0;
          background: rgba(79, 255, 176, 0.05);
        }

        .event-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .event-color-badge {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .event-name {
          flex: 1;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
          line-height: 1.3;
        }

        .event-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .event-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .stat-value {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.95rem;
        }

        .knockout-btn {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.6rem 1rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .knockout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }

        .knockout-btn:active {
          transform: translateY(0);
        }

        .knockout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .knockout-helper {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Barlow', sans-serif;
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.not-scheduled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-badge.partial {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .status-badge.complete {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .sidebar-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .summary-value {
          font-weight: 700;
          color: #4fffb0;
          font-size: 1.1rem;
        }
      `}</style>

      <div className="events-sidebar">
        <div className="sidebar-header">
          Events ({events.length})
        </div>

        <div className="events-list">
          {events.map((event, index) => {
            const scheduleInfo = getEventScheduleInfo(event.id)
            const eventColor = eventColors[index % 5]
            const progressPercent = scheduleInfo.total > 0
              ? (scheduleInfo.scheduled / scheduleInfo.total) * 100
              : 0

            return (
              <div
                key={event.id}
                className={`event-card ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                onClick={() => onEventSelect(event)}
              >
                <div className="event-header">
                  <div
                    className="event-color-badge"
                    style={{ background: eventColor }}
                  />
                  <div className="event-name">{event.name}</div>
                  {event.priority && getPriorityBadge(event.priority)}
                </div>

                <div className="event-details">
                  <div className="event-stat">
                    <span className="stat-label">Players:</span>
                    <span className="stat-value">
                      {event.participantCount || 0} / {event.maxParticipants || '∞'}
                    </span>
                  </div>

                  <div className="event-stat">
                    <span className="stat-label">Matches:</span>
                    <span className="stat-value">
                      {scheduleInfo.scheduled} / {scheduleInfo.total} scheduled
                    </span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progressPercent}%`,
                        background: eventColor
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`status-badge ${scheduleInfo.status}`}>
                      {scheduleInfo.status === 'not-scheduled' && 'Not Scheduled'}
                      {scheduleInfo.status === 'partial' && 'Partially Scheduled'}
                      {scheduleInfo.status === 'complete' && '✓ Complete'}
                    </span>
                  </div>

                  {/* Show phase status for LEAGUE_CUM_KNOCKOUT events */}
                  {event.bracketFormat === 'LEAGUE_CUM_KNOCKOUT' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {!event.leaguePhaseScheduled && '📋 League phase pending'}
                      {event.leaguePhaseScheduled && !event.knockoutPhaseScheduled && '✅ League done • Knockout pending'}
                      {event.leaguePhaseScheduled && event.knockoutPhaseScheduled && '✅ All phases complete'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="summary-stat">
            <span className="summary-label">Total Matches:</span>
            <span className="summary-value">
              {schedule.length}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Total Events:</span>
            <span className="summary-value">
              {events.length}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default EventsListSidebar
