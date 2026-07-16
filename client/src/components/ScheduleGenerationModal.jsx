import { useState, useEffect } from 'react'

const ScheduleGenerationModal = ({ tournament, events, onGenerate, onClose }) => {
  const [settings, setSettings] = useState({
    startDate: tournament?.startDate?.split('T')[0] || '',
    endDate: tournament?.endDate?.split('T')[0] || '',
    dailyStartTime: tournament?.dailyStartTime || '09:00',
    dailyEndTime: tournament?.dailyEndTime || '18:00',
    courtsAvailable: Number(tournament?.courtsAvailable) || 4,
    matchDuration: Number(tournament?.matchDuration) || 45,
    breakDuration: Number(tournament?.breakDuration) || 15,
    minRestTime: Number(tournament?.minRestTime) || 30,
    strategy: 'hybrid',
    autoFix: true,
    advancedOptions: {
      avoidEarlyFinals: true,
      reserveCourt1ForFinals: false,
      separatePartnerMatches: true
    }
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [estimatedCapacity, setEstimatedCapacity] = useState(null)

  useEffect(() => {
    calculateCapacity()
  }, [settings.startDate, settings.endDate, settings.dailyStartTime, settings.dailyEndTime, settings.courtsAvailable, settings.matchDuration, settings.breakDuration])

  const calculateCapacity = () => {
    if (!settings.startDate || !settings.endDate || !settings.dailyStartTime || !settings.dailyEndTime) return

    try {
      const start = new Date(settings.startDate)
      const end = new Date(settings.endDate)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

      const [startHour, startMin] = (settings.dailyStartTime || '09:00').split(':').map(Number)
      const [endHour, endMin] = (settings.dailyEndTime || '18:00').split(':').map(Number)
      const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

      const slotDuration = (settings.matchDuration || 45) + (settings.breakDuration || 15)
      const slotsPerCourt = Math.floor(dailyMinutes / slotDuration)
      const slotsPerDay = slotsPerCourt * (settings.courtsAvailable || 4)
      const totalSlots = slotsPerDay * days

      setEstimatedCapacity({
        days,
        slotsPerDay,
        totalSlots,
        dailyMinutes
      })
    } catch (err) {
      console.error('Error calculating capacity:', err)
      setEstimatedCapacity(null)
    }
  }

  const handleChange = (field, value) => {
    // Ensure numeric fields are always valid numbers
    const numericFields = ['courtsAvailable', 'matchDuration', 'breakDuration', 'minRestTime']
    const processedValue = numericFields.includes(field)
      ? (Number(value) || 0)
      : value

    setSettings(prev => ({
      ...prev,
      [field]: processedValue
    }))
  }

  const handleAdvancedChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        [field]: value
      }
    }))
  }

  const handleSubmit = () => {
    // Validate
    if (!settings.startDate || !settings.endDate) {
      alert('Please select start and end dates')
      return
    }

    if (new Date(settings.endDate) < new Date(settings.startDate)) {
      alert('End date must be after start date')
      return
    }

    if (settings.courtsAvailable < 1) {
      alert('At least 1 court is required')
      return
    }

    onGenerate(settings)
  }

  // Use events prop which has matchCount from API
  const totalMatches = events?.reduce((sum, event) =>
    sum + (event.matchCount || 0), 0
  ) || 0

  const utilizationPercent = estimatedCapacity?.totalSlots > 0
    ? Math.round((totalMatches / estimatedCapacity.totalSlots) * 100)
    : 0

  // Safely get display values
  const slotsPerDay = estimatedCapacity?.slotsPerDay || 0
  const totalSlots = estimatedCapacity?.totalSlots || 0

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 13, 31, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 2rem;
        }

        .modal-container {
          background: linear-gradient(180deg, #0a1628 0%, #060d1f 100%);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 16px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.8rem;
          text-transform: uppercase;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          color: #ec4899;
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: #4fffb0;
          text-transform: uppercase;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          background: rgba(6, 13, 31, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
          color: white;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #4fffb0;
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .strategy-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .strategy-option {
          background: rgba(6, 13, 31, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .strategy-option:hover {
          border-color: rgba(79, 255, 176, 0.5);
          background: rgba(6, 13, 31, 0.8);
        }

        .strategy-option.selected {
          border-color: #4fffb0;
          background: rgba(79, 255, 176, 0.1);
        }

        .strategy-option input[type="radio"] {
          margin-right: 0.75rem;
        }

        .strategy-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .strategy-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: white;
          text-transform: uppercase;
        }

        .strategy-description {
          font-family: 'Barlow', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .checkbox-group:hover {
          border-color: rgba(79, 255, 176, 0.5);
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
        }

        .advanced-toggle {
          width: 100%;
          background: rgba(79, 255, 176, 0.05);
          border: 1px solid rgba(79, 255, 176, 0.3);
          color: #4fffb0;
          padding: 0.75rem;
          border-radius: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .advanced-toggle:hover {
          background: rgba(79, 255, 176, 0.1);
        }

        .capacity-summary {
          background: rgba(79, 255, 176, 0.05);
          border: 1px solid rgba(79, 255, 176, 0.3);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .capacity-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #4fffb0;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .capacity-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .capacity-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          color: white;
        }

        .stat-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .utilization-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .utilization-fill {
          height: 100%;
          background: linear-gradient(90deg, #4fffb0, #00d4ff);
          transition: width 0.3s ease;
        }

        .utilization-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: white;
          margin-top: 0.5rem;
          text-align: center;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-generate {
          background: #4fffb0;
          color: #060d1f;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-generate:hover {
          background: #6fffbd;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.3);
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Generate Tournament Schedule</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Date Range */}
            <div className="form-section">
              <div className="section-title">📅 Date Range</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={settings.startDate}
                    onChange={e => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={settings.endDate}
                    onChange={e => handleChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Daily Schedule */}
            <div className="form-section">
              <div className="section-title">⏰ Daily Schedule</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.dailyStartTime}
                    onChange={e => handleChange('dailyStartTime', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.dailyEndTime}
                    onChange={e => handleChange('dailyEndTime', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Courts & Duration */}
            <div className="form-section">
              <div className="section-title">🏟️ Courts & Duration</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Courts Available</label>
                  <input
                    type="number"
                    className="form-input"
                    value={String(settings.courtsAvailable || 4)}
                    onChange={e => handleChange('courtsAvailable', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Duration (mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={String(settings.matchDuration || 45)}
                    onChange={e => handleChange('matchDuration', parseInt(e.target.value))}
                    min="15"
                    step="15"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Break Duration (mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={String(settings.breakDuration || 15)}
                    onChange={e => handleChange('breakDuration', parseInt(e.target.value))}
                    min="0"
                    step="5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Rest for Players (mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={String(settings.minRestTime || 30)}
                    onChange={e => handleChange('minRestTime', parseInt(e.target.value))}
                    min="0"
                    step="15"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling Strategy */}
            <div className="form-section">
              <div className="section-title">🎯 Scheduling Strategy</div>
              <div className="strategy-options">
                <div
                  className={`strategy-option ${settings.strategy === 'sequential' ? 'selected' : ''}`}
                  onClick={() => handleChange('strategy', 'sequential')}
                >
                  <div className="strategy-header">
                    <input
                      type="radio"
                      checked={settings.strategy === 'sequential'}
                      onChange={() => {}}
                    />
                    <span className="strategy-name">Sequential</span>
                  </div>
                  <div className="strategy-description">
                    Complete each event before starting the next. Clean separation, easier to manage.
                  </div>
                </div>

                <div
                  className={`strategy-option ${settings.strategy === 'interleaved' ? 'selected' : ''}`}
                  onClick={() => handleChange('strategy', 'interleaved')}
                >
                  <div className="strategy-header">
                    <input
                      type="radio"
                      checked={settings.strategy === 'interleaved'}
                      onChange={() => {}}
                    />
                    <span className="strategy-name">Interleaved</span>
                  </div>
                  <div className="strategy-description">
                    Mix all events to maximize court usage. Fastest tournament, but events are mixed.
                  </div>
                </div>

                <div
                  className={`strategy-option ${settings.strategy === 'hybrid' ? 'selected' : ''}`}
                  onClick={() => handleChange('strategy', 'hybrid')}
                >
                  <div className="strategy-header">
                    <input
                      type="radio"
                      checked={settings.strategy === 'hybrid'}
                      onChange={() => {}}
                    />
                    <span className="strategy-name">Hybrid (Recommended)</span>
                  </div>
                  <div className="strategy-description">
                    Priority events first, then fill gaps with others. Best of both worlds!
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="form-section">
              <button
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                🔧 Advanced Options
                <span>{showAdvanced ? '▲' : '▼'}</span>
              </button>

              {showAdvanced && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="autoFix"
                      checked={settings.autoFix}
                      onChange={e => handleChange('autoFix', e.target.checked)}
                    />
                    <label htmlFor="autoFix" className="checkbox-label">
                      ✓ Automatically fix conflicts
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="avoidEarlyFinals"
                      checked={settings.advancedOptions.avoidEarlyFinals}
                      onChange={e => handleAdvancedChange('avoidEarlyFinals', e.target.checked)}
                    />
                    <label htmlFor="avoidEarlyFinals" className="checkbox-label">
                      ✓ Avoid scheduling finals early in the day
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="reserveCourt1"
                      checked={settings.advancedOptions.reserveCourt1ForFinals}
                      onChange={e => handleAdvancedChange('reserveCourt1ForFinals', e.target.checked)}
                    />
                    <label htmlFor="reserveCourt1" className="checkbox-label">
                      ✓ Reserve Court 1 for finals/semis
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="separatePartner"
                      checked={settings.advancedOptions.separatePartnerMatches}
                      onChange={e => handleAdvancedChange('separatePartnerMatches', e.target.checked)}
                    />
                    <label htmlFor="separatePartner" className="checkbox-label">
                      ✓ Keep partner matches separate (30 min gap)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Capacity Summary */}
            {estimatedCapacity && (
              <div className="form-section">
                <div className="capacity-summary">
                  <div className="capacity-title">⚠️ Estimated Capacity</div>
                  <div className="capacity-stats">
                    <div className="capacity-stat">
                      <div className="stat-value">{totalMatches}</div>
                      <div className="stat-label">Total Matches</div>
                    </div>
                    <div className="capacity-stat">
                      <div className="stat-value">{estimatedCapacity?.days || 0}</div>
                      <div className="stat-label">Days Required</div>
                    </div>
                    <div className="capacity-stat">
                      <div className="stat-value">{slotsPerDay}</div>
                      <div className="stat-label">Slots Per Day</div>
                    </div>
                    <div className="capacity-stat">
                      <div className="stat-value">{totalSlots}</div>
                      <div className="stat-label">Total Slots</div>
                    </div>
                  </div>

                  <div className="utilization-bar">
                    <div
                      className="utilization-fill"
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                  <div className="utilization-text">
                    {utilizationPercent}% Utilization
                    {utilizationPercent > 100 && ' ⚠️ Not enough capacity!'}
                    {utilizationPercent >= 90 && utilizationPercent <= 100 && ' ✓ Good utilization'}
                    {utilizationPercent < 90 && ' Low utilization'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-generate" onClick={handleSubmit}>
              <span>⚡</span>
              Generate Schedule
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScheduleGenerationModal
