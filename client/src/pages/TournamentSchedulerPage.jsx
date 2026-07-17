import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'
import SchedulerCalendar from '../components/SchedulerCalendar'
import ScheduleGenerationModal from '../components/ScheduleGenerationModal'
import ConflictPanel from '../components/ConflictPanel'
import ConfirmationModal from '../components/ConfirmationModal'
import EventsListSidebar from '../components/EventsListSidebar'

const TournamentSchedulerPage = () => {
  const { tournamentId } = useParams()
  const navigate = useNavigate()

  // State management
  const [tournament, setTournament] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [config, setConfig] = useState(null) // Store scheduler config for saving
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // UI state
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showConflictPanel, setShowConflictPanel] = useState(true)

  // Confirmation modals state
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [pendingGeneration, setPendingGeneration] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    loadTournamentData()
    loadSchedule()
  }, [tournamentId])

  const loadTournamentData = async () => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}`)
      if (response.data.success) {
        setTournament(response.data.tournament)
      }
    } catch (err) {
      console.error('Error loading tournament:', err)
      alert('Failed to load tournament data')
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async () => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/schedule`)
      if (response.data.success) {
        setSchedule(response.data.schedule || [])
      }
    } catch (err) {
      console.error('Error loading schedule:', err)
    }
  }

  const handleGenerateSchedule = async (settings) => {
    // Store settings and show confirmation
    setPendingGeneration(settings)
    setShowGenerationModal(false)
  }

  const confirmGeneration = async () => {
    if (!pendingGeneration) return

    try {
      setGenerating(true)

      console.log('Generating schedule with settings:', pendingGeneration)

      const response = await api.post(`/tournaments/${tournamentId}/generate-schedule`, pendingGeneration)

      if (response.data.success) {
        setSchedule(response.data.schedule || [])
        setConflicts(response.data.conflicts || [])
        setAnalytics(response.data.analytics || null)
        setConfig(response.data.config || null) // Store config for saving

        // Show success message
        if (response.data.conflicts.length === 0) {
          alert('✅ Schedule generated successfully with no conflicts!')
        } else {
          alert(`⚠️ Schedule generated with ${response.data.conflicts.length} conflicts. Check the conflict panel to resolve them.`)
          setShowConflictPanel(true)
        }
      }
    } catch (err) {
      console.error('Error generating schedule:', err)
      alert(err.response?.data?.error || 'Failed to generate schedule')
    } finally {
      setGenerating(false)
      setPendingGeneration(null)
    }
  }

  const handleSaveSchedule = async (phase = null) => {
    setShowSaveConfirm(true)
  }

  const confirmSave = async () => {
    try {
      const response = await api.post(`/tournaments/${tournamentId}/save-schedule`, {
        schedule,
        config, // Pass config to save courtsBySport to tournament
        phase: null // Pass phase to mark as scheduled
      })

      if (response.data.success) {
        alert(`✅ Schedule saved! ${response.data.matchesUpdated} matches updated.`)
        loadTournamentData() // Reload to get updated phase flags
        loadSchedule()
      }
    } catch (err) {
      console.error('Error saving schedule:', err)
      alert(err.response?.data?.error || 'Failed to save schedule')
    }
  }

  const handleClearSchedule = async () => {
    setShowClearConfirm(true)
  }

  const confirmClear = async () => {
    try {
      const response = await api.delete(`/tournaments/${tournamentId}/schedule`)
      if (response.data.success) {
        alert(`✅ Schedule cleared! ${response.data.matchesCleared} matches reset.`)
        setSchedule([])
        setConflicts([])
        setAnalytics(null)
        loadTournamentData() // Reload to reset phase flags
      }
    } catch (err) {
      console.error('Error clearing schedule:', err)
      alert('Failed to clear schedule')
    }
  }

  const handleGeneratePhase = async (phase) => {
    // This schedules ALL events for the given phase
    try {
      setGenerating(true)

      const response = await api.post(`/tournaments/${tournamentId}/generate-schedule`, {
        phase: phase
      })

      if (response.data.success) {
        if (phase === 'league') {
          setSchedule(response.data.schedule || [])
        } else {
          setSchedule(prev => [...prev, ...(response.data.schedule || [])])
        }
        setConflicts(response.data.conflicts || [])
        setAnalytics(response.data.analytics || null)
        setConfig(response.data.config || config)

        const phaseName = phase === 'league' ? 'League' : 'Knockout'
        alert(`✅ ${phaseName} schedule generated successfully for all events!`)
        loadTournamentData()
        loadSchedule()
      }
    } catch (err) {
      console.error(`Error generating ${phase} schedule:`, err)
      alert(err.response?.data?.error || `Failed to generate ${phase} schedule`)
    } finally {
      setGenerating(false)
    }
  }

  const handleMatchMove = (matchId, newDate, newTime, newCourt) => {
    // Update schedule with new match position
    const updatedSchedule = schedule.map(item => {
      if (item.matchId === matchId) {
        return {
          ...item,
          date: newDate,
          startTime: newTime,
          courtNumber: newCourt
        }
      }
      return item
    })

    setSchedule(updatedSchedule)

    // TODO: Re-validate for conflicts
    console.log('Match moved:', matchId, newDate, newTime, newCourt)
  }

  const handleAutoFixConflicts = async () => {
    try {
      setGenerating(true)

      // Re-generate with autoFix enabled using existing config
      const response = await api.post(`/tournaments/${tournamentId}/generate-schedule`, {
        ...config, // Use existing configuration
        autoFix: true,
        strategy: 'hybrid'
      })

      if (response.data.success) {
        setSchedule(response.data.schedule || [])
        setConflicts(response.data.conflicts || [])
        setAnalytics(response.data.analytics || null)
        setConfig(response.data.config || config)

        if (response.data.conflicts.length === 0) {
          alert('✅ All conflicts fixed!')
        } else {
          alert(`⚠️ ${response.data.conflicts.length} conflicts remaining`)
        }
      }
    } catch (err) {
      console.error('Error auto-fixing conflicts:', err)
      alert('Failed to auto-fix conflicts')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4fffb0',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '1.5rem'
      }}>
        <Navbar />
        <div>Loading tournament...</div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Navbar />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '2rem',
            color: '#ec4899',
            marginBottom: '1rem'
          }}>
            Tournament not found
          </div>
          <button
            onClick={() => navigate('/manage')}
            style={{
              background: '#4fffb0',
              color: '#060d1f',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Manage
          </button>
        </div>
      </div>
    )
  }

  const hasSchedule = schedule.length > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        .scheduler-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 70px;
          font-family: 'Barlow Condensed', sans-serif;
        }

        .scheduler-header {
          background: rgba(6, 13, 31, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(79, 255, 176, 0.2);
          padding: 1rem 1.5rem;
          margin-bottom: 0.5rem;
        }

        .header-content {
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .tournament-info h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #4fffb0, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .tournament-meta {
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .tournament-meta span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.not-scheduled {
          background: rgba(236, 72, 153, 0.1);
          color: #ec4899;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .status-badge.scheduled {
          background: rgba(79, 255, 176, 0.1);
          color: #4fffb0;
          border: 1px solid rgba(79, 255, 176, 0.3);
        }

        .status-badge.conflicts {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .header-actions {
          display: flex;
          gap: 1rem;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4fffb0;
          color: #060d1f;
        }

        .btn-primary:hover:not(:disabled) {
          background: #6fffbd;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }

        .scheduler-layout {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem 0.5rem 1rem;
          display: flex;
          gap: 1rem;
          align-items: stretch;
          height: calc(100vh - 200px);
        }


        .empty-state {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 16px;
          padding: 4rem 2rem;
          text-align: center;
          margin: 2rem 0;
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 1rem;
        }

        .empty-state p {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .generating-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 13, 31, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(79, 255, 176, 0.2);
          border-top-color: #4fffb0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .generating-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #4fffb0;
          text-transform: uppercase;
        }
      `}</style>

      <div className="scheduler-page">
        <Navbar />

        {/* Header */}
        <div className="scheduler-header">
          <div className="header-content">
            <div className="tournament-info">
              <h1>{tournament.name}</h1>
              <div className="tournament-meta">
                <span>
                  📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </span>
                <span>🏟️ {tournament.courtsAvailable || 4} Courts</span>
                <span>⚡ {tournament.events?.length || 0} Events</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {hasSchedule ? (
                <div className={`status-badge ${conflicts.length > 0 ? 'conflicts' : 'scheduled'}`}>
                  {conflicts.length > 0 ? '⚠️' : '✓'}
                  {conflicts.length > 0
                    ? `${conflicts.length} Conflicts`
                    : 'Scheduled'}
                </div>
              ) : (
                <div className="status-badge not-scheduled">
                  ⚠️ Not Scheduled
                </div>
              )}

              <div className="header-actions">
                {/* Check if we have league-cum-knockout events */}
                {tournament.events?.some(e => e.bracketFormat === 'LEAGUE_CUM_KNOCKOUT') ? (
                  <>
                    {/* Show league button if not all leagues are scheduled */}
                    {tournament.events?.some(e => e.bracketFormat === 'LEAGUE_CUM_KNOCKOUT' && !e.leaguePhaseScheduled) && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowGenerationModal(true)}
                        disabled={generating}
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                      >
                        📅 Generate League Schedule
                      </button>
                    )}

                    {/* Show knockout button if leagues are done but knockouts aren't */}
                    {tournament.events?.some(e => e.bracketFormat === 'LEAGUE_CUM_KNOCKOUT' && e.leaguePhaseScheduled && !e.knockoutPhaseScheduled) && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleGeneratePhase('knockout')}
                        disabled={generating}
                      >
                        ⚡ Generate Knockout Schedule
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowGenerationModal(true)}
                    disabled={generating}
                  >
                    ⚡ Generate Schedule
                  </button>
                )}

                {hasSchedule && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={handleSaveSchedule}
                      disabled={generating}
                    >
                      💾 Save
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={handleClearSchedule}
                      disabled={generating}
                    >
                      🗑️ Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout - Events List + Calendar + Conflicts */}
        {hasSchedule || tournament.events.length > 0 ? (
          <div className="scheduler-layout">
            {/* Left Sidebar - Events List */}
            <div style={{ width: '300px', flexShrink: 0 }}>
              <EventsListSidebar
                events={tournament.events || []}
                schedule={schedule}
                selectedEvent={selectedEvent}
                onEventSelect={setSelectedEvent}
                onGenerateKnockout={handleGenerateKnockout}
              />
            </div>

            {/* Center - Day Calendar */}
            {hasSchedule ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <SchedulerCalendar
                  schedule={schedule}
                  tournament={tournament}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onMatchMove={handleMatchMove}
                  conflicts={conflicts}
                />
              </div>
            ) : (
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-state-icon">📅</div>
                <h2>No Schedule Generated Yet</h2>
                <p>
                  Click "Generate Schedule" above to create an intelligent<br/>
                  cross-event schedule for all tournament events.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowGenerationModal(true)}
                  style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                >
                  ⚡ Generate Schedule Now
                </button>
              </div>
            )}

            {/* Right Sidebar - Conflicts Panel */}
            {showConflictPanel && conflicts.length > 0 && (
              <ConflictPanel
                conflicts={conflicts}
                schedule={schedule}
                onAutoFix={handleAutoFixConflicts}
                onClose={() => setShowConflictPanel(false)}
              />
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h2>No Schedule Generated Yet</h2>
            <p>
              Click "Generate Schedule" above to create an intelligent<br/>
              cross-event schedule for all tournament events.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowGenerationModal(true)}
              style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
            >
              ⚡ Generate Schedule Now
            </button>
          </div>
        )}

        {/* Modals */}
        {showGenerationModal && (
          <ScheduleGenerationModal
            tournament={tournament}
            events={tournament.events || []}
            onGenerate={handleGenerateSchedule}
            onClose={() => setShowGenerationModal(false)}
          />
        )}

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={!!pendingGeneration}
          onClose={() => setPendingGeneration(null)}
          onConfirm={confirmGeneration}
          title="Generate Schedule?"
          message={`This will schedule matches across ${tournament?.events?.length || 0} events. League matches will be scheduled first, followed by knockout rounds.`}
          confirmText="Generate"
          cancelText="Cancel"
          type="info"
        />

        <ConfirmationModal
          isOpen={showSaveConfirm}
          onClose={() => setShowSaveConfirm(false)}
          onConfirm={confirmSave}
          title="Save Schedule?"
          message="This will save all scheduled match times and courts to the database. Players will be notified of their match schedules."
          confirmText="Save"
          cancelText="Cancel"
          type="success"
        />

        <ConfirmationModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={confirmClear}
          title="Clear Entire Schedule?"
          message="⚠️ This will remove ALL scheduled times and courts for this tournament. This action cannot be undone."
          confirmText="Clear"
          cancelText="Cancel"
          type="danger"
        />

        {/* Generating Overlay */}
        {generating && (
          <div className="generating-overlay">
            <div className="spinner"></div>
            <div className="generating-text">
              🧠 Generating Intelligent Schedule...
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '1rem',
              fontSize: '0.95rem'
            }}>
              Optimizing court usage & preventing conflicts
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default TournamentSchedulerPage
