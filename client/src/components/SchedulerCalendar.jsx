import React, { useState, useMemo } from 'react'

const SchedulerCalendar = ({
  schedule,
  tournament,
  selectedDate,
  onDateChange,
  onMatchMove,
  conflicts
}) => {

  const [draggedMatch, setDraggedMatch] = useState(null)
  const [hoveredSlot, setHoveredSlot] = useState(null)

  // Event colors mapping
  const eventColors = useMemo(() => {
    const colors = ['#3b82f6', '#a855f7', '#eab308', '#22c55e', '#f97316']
    const colorMap = {}

    if (tournament.events) {
      tournament.events.forEach((event, idx) => {
        colorMap[event.id] = colors[idx % colors.length]
      })
    }

    return colorMap
  }, [tournament.events])

  // Get conflicts for a specific match
  const getMatchConflicts = (matchId) => {
    return conflicts.filter(c =>
      c.matches?.some(m => m.matchId === matchId)
    )
  }

  // Check if any matches are scheduled
  const scheduledMatches = schedule.filter(m => m.scheduledAt !== null || m.date !== null)

  if (scheduledMatches.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Schedule Generated Yet</h3>
        <p className="text-gray-600">
          Click "Generate Schedule" to create an intelligent schedule for all events
        </p>
      </div>
    )
  }

  // Render Day View
  const renderDayView = () => {
    const daySchedule = schedule.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate.toDateString() === selectedDate.toDateString()
    })

    // Get unique time slots
    const timeSlots = []
    const startHour = 9
    const endHour = 18

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        timeSlots.push(timeStr)
      }
    }

    // Get courts from courtsBySport or fall back to courtsAvailable
    let courtsList = []
    if (tournament.courtsBySport && Object.keys(tournament.courtsBySport).length > 0) {
      // Multi-sport: flatten all courts with their custom names
      Object.entries(tournament.courtsBySport).forEach(([sportId, courts]) => {
        courts.forEach((courtName, idx) => {
          courtsList.push({
            number: courtsList.length + 1,
            name: courtName,
            sportId
          })
        })
      })
    } else {
      // Legacy: use numbered courts
      const courtCount = tournament.courtsAvailable || 4
      courtsList = Array.from({ length: courtCount }, (_, idx) => ({
        number: idx + 1,
        name: `Court ${idx + 1}`,
        sportId: null
      }))
    }

    return (
      <div className="calendar-container">
        {/* Date Navigation - ALWAYS SHOW */}
        <div className="date-navigator">
          <button onClick={() => changeDate(-1)} className="nav-btn">
            ← Prev Day
          </button>
          <div className="current-date">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <button onClick={() => changeDate(1)} className="nav-btn">
            Next Day →
          </button>
        </div>

        {/* Calendar Grid OR Empty Message */}
        {daySchedule.length === 0 ? (
          <div className="empty-day">
            <div className="empty-icon">📭</div>
            <div>No matches scheduled for {selectedDate.toLocaleDateString()}</div>
          </div>
        ) : (
          <div className="calendar-grid-wrapper">
            <div className="calendar-grid" style={{
              gridTemplateColumns: `80px repeat(${courtsList.length}, minmax(180px, 1fr))`
            }}>
              {/* Header Row - All courts in ONE row */}
              <div className="grid-header-sticky" style={{
                display: 'contents'
              }}>
                <div className="time-column-header">Time</div>
                {courtsList.map((court, idx) => (
                  <div key={idx} className="court-header" title={court.sportId || ''}>
                    {court.name}
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className="time-label">{time}</div>
                  {courtsList.map((court, courtIdx) => {
                    // Find match at this time/court
                    const match = daySchedule.find(item =>
                      item.startTime === time && item.courtNumber === court.number
                    )

                    return (
                      <div
                        key={courtIdx}
                        className={`time-slot ${hoveredSlot?.time === time && hoveredSlot?.court === court.number ? 'hovered' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setHoveredSlot({ time, court: court.number })
                        }}
                        onDrop={(e) => handleDrop(e, time, court.number)}
                      >
                        {match && renderMatchBlock(match, time, court.number)}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render match block
  const renderMatchBlock = (match, time, court) => {
    const eventColor = eventColors[match.eventId] || '#666'
    const matchConflicts = getMatchConflicts(match.matchId)
    const hasConflict = matchConflicts.length > 0

    // Calculate height based on duration
    const duration = calculateDuration(match.startTime, match.endTime)
    const height = (duration / 15) * 60 // 60px per 15min slot

    return (
      <div
        key={match.matchId}
        className={`match-block ${hasConflict ? 'conflict' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, match)}
        onDragEnd={handleDragEnd}
        style={{
          background: `linear-gradient(135deg, ${eventColor}dd, ${eventColor}aa)`,
          height: `${height}px`,
          borderLeft: `4px solid ${eventColor}`
        }}
        title={`${match.eventName} - Round ${match.roundNumber} Match ${match.matchNumber}`}
      >
        <div className="match-content">
          <div className="match-header">
            <span className="event-badge" style={{ background: eventColor }}>
              {match.eventName}
            </span>
            {hasConflict && <span className="conflict-icon">⚠️</span>}
          </div>
          <div className="match-details">
            <div className="match-round">R{match.roundNumber} M{match.matchNumber}</div>
            <div className="match-time">{match.startTime} - {match.endTime}</div>
          </div>
        </div>
      </div>
    )
  }

  // Helper functions
  const changeDate = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    onDateChange(newDate)
  }

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  // Drag and Drop handlers
  const handleDragStart = (e, match) => {
    setDraggedMatch(match)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedMatch(null)
    setHoveredSlot(null)
  }

  const handleDrop = (e, time, court) => {
    e.preventDefault()

    if (draggedMatch) {
      onMatchMove(draggedMatch.matchId, selectedDate, time, court)
      setDraggedMatch(null)
      setHoveredSlot(null)
    }
  }

  return (
    <>
      <style>{`
        .calendar-container {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          overflow: hidden;
        }

        .date-navigator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-btn {
          background: rgba(79, 255, 176, 0.1);
          color: #4fffb0;
          border: 1px solid rgba(79, 255, 176, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-btn:hover {
          background: rgba(79, 255, 176, 0.2);
          transform: translateY(-1px);
        }

        .current-date, .week-range {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          color: #fff;
          text-transform: uppercase;
        }

        .calendar-grid-wrapper {
          overflow-x: auto;
          overflow-y: auto;
          max-height: calc(100vh - 300px);
        }

        .calendar-grid {
          display: grid;
          gap: 1px;
          background: rgba(255, 255, 255, 0.05);
          min-width: min-content;
        }

        .grid-header-sticky {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .time-column-header, .court-header {
          background: rgba(6, 13, 31, 0.95);
          backdrop-filter: blur(10px);
          padding: 0.75rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: #4fffb0;
          text-align: center;
          border: 1px solid rgba(79, 255, 176, 0.2);
          white-space: nowrap;
        }

        .court-header {
          border-bottom: 2px solid #4fffb0;
        }

        .time-label {
          background: rgba(6, 13, 31, 0.6);
          padding: 0.5rem;
          font-family: 'Barlow', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-slot {
          background: rgba(6, 13, 31, 0.4);
          min-height: 60px;
          position: relative;
          transition: all 0.2s ease;
        }

        .time-slot:hover {
          background: rgba(79, 255, 176, 0.05);
        }

        .time-slot.hovered {
          background: rgba(79, 255, 176, 0.1);
          border: 2px dashed #4fffb0;
        }

        .match-block {
          padding: 0.5rem;
          border-radius: 6px;
          cursor: move;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .match-block:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .match-block.conflict {
          border: 2px solid #fbbf24 !important;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .match-content {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .match-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
        }

        .event-badge {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: white;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conflict-icon {
          font-size: 1rem;
        }

        .match-details {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .match-round {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
        }

        .match-time {
          font-family: 'Barlow', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .empty-day {
          padding: 4rem 2rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        /* Week View */
        .week-view {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .week-navigator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
        }

        .week-day {
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .week-day:hover {
          border-color: rgba(79, 255, 176, 0.5);
          transform: translateY(-2px);
        }

        .day-header {
          text-align: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .day-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          color: #4fffb0;
          text-transform: uppercase;
        }

        .day-date {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          color: white;
        }

        .day-matches {
          min-height: 80px;
        }

        .matches-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .mini-match {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }

        .no-matches {
          text-align: center;
          padding: 2rem 0;
          color: rgba(255, 255, 255, 0.3);
        }

        /* Event View */
        .event-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .event-schedule-card {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .event-schedule-header {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .event-schedule-header h3 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.2rem;
          text-transform: uppercase;
          color: white;
          margin: 0;
        }

        .matches-count {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .event-matches-list {
          padding: 1rem 1.5rem;
        }

        .event-match-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .event-match-item:last-child {
          border-bottom: none;
        }

        .match-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .match-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: white;
        }

        .match-datetime {
          font-family: 'Barlow', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .match-location {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          color: #4fffb0;
        }

        /* Court View */
        .court-view {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .court-schedule-card {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .court-schedule-header {
          padding: 1rem 1.5rem;
          background: rgba(79, 255, 176, 0.05);
          border-bottom: 1px solid rgba(79, 255, 176, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .court-schedule-header h3 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.2rem;
          text-transform: uppercase;
          color: #4fffb0;
          margin: 0;
        }

        .court-matches-list {
          padding: 1rem 1.5rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .court-match-item {
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: rgba(6, 13, 31, 0.6);
          border-radius: 6px;
          border-left-width: 4px;
          border-left-style: solid;
        }

        .match-time-range {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
          margin-bottom: 0.25rem;
        }

        .match-event-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          color: #4fffb0;
          margin-bottom: 0.25rem;
        }

        .match-details-text {
          font-family: 'Barlow', sans-serif;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Player View Placeholder */
        .view-placeholder {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 16px;
          padding: 4rem 2rem;
          text-align: center;
        }

        .placeholder-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .placeholder-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 0.5rem;
        }

        .placeholder-subtext {
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>

      {/* Always show day view - simplified UI */}
      {renderDayView()}
    </>
  )
}

export default SchedulerCalendar
