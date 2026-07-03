import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SingleEliminationBracket from './SingleEliminationBracket'
import RoundRobinBracket from './RoundRobinBracket'
import HybridBracket from './HybridBracket'

const BracketViewModal = ({ eventId, onClose }) => {
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSchedule, setShowSchedule] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadBracketData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshBracketData()
    }, 30000)
    return () => clearInterval(interval)
  }, [eventId])

  const loadBracketData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${eventId}/bracket`)

      if (response.data.success) {
        setEvent(response.data.event)
        setMatches(response.data.matches || [])
      }
    } catch (err) {
      console.error('Error loading bracket:', err)
      alert('Failed to load bracket')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const refreshBracketData = async () => {
    try {
      setRefreshing(true)
      const response = await api.get(`/events/${eventId}/bracket`)

      if (response.data.success) {
        setEvent(response.data.event)
        const newMatches = response.data.matches || []
        // Check if anything changed
        if (JSON.stringify(newMatches) !== JSON.stringify(matches)) {
          setMatches(newMatches)
          showUpdateToast()
        }
      }
    } catch (err) {
      console.error('Error refreshing bracket:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const showUpdateToast = () => {
    const toast = document.createElement('div')
    toast.className = 'fixed top-20 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce'
    toast.textContent = '🔄 Bracket updated!'
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
  }

  const getPlayerName = (participant) => {
    if (!participant || !participant.user) return 'TBD'
    return `${participant.user.firstName} ${participant.user.lastName}`
  }

  // Get user's matches
  const userMatches = matches.filter(match => {
    if (!user) return false
    const p1 = match.participant1?.userId
    const p2 = match.participant2?.userId
    return p1 === user.id || p2 === user.id
  })

  // Get live matches
  const liveMatches = matches.filter(m => m.status === 'IN_PROGRESS')

  // Get upcoming matches
  const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED')

  // Get completed matches
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')

  // Find user's next match
  const nextUserMatch = userMatches.find(m => m.status === 'SCHEDULED')

  const formatMatchTime = (dateString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeUntilMatch = (dateString) => {
    if (!dateString) return null
    const now = new Date()
    const matchTime = new Date(dateString)
    const diff = matchTime - now

    if (diff < 0) return 'Started'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const MatchItem = ({ match, showTime = true }) => {
    const p1 = match.participant1
    const p2 = match.participant2

    return (
      <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-600">
            {match.roundNumber ? `Round ${match.roundNumber}` : 'Match'}
            {match.matchNumber ? ` #${match.matchNumber}` : ''}
          </span>
          {showTime && match.scheduledTime && (
            <span className="text-xs text-gray-500">
              {formatMatchTime(match.scheduledTime)}
            </span>
          )}
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between items-center">
            <span className={match.winnerId === p1?.id ? 'font-bold text-gray-900' : 'text-gray-700'}>
              {getPlayerName(p1)}
            </span>
            {match.participant1Score !== null && (
              <span className="font-mono font-semibold text-gray-900">{match.participant1Score}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className={match.winnerId === p2?.id ? 'font-bold text-gray-900' : 'text-gray-700'}>
              {getPlayerName(p2)}
            </span>
            {match.participant2Score !== null && (
              <span className="font-mono font-semibold text-gray-900">{match.participant2Score}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading || !event) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading bracket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/90 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[calc(100%-2rem)] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
            <p className="text-sm text-gray-600">{event.tournament?.name || 'Tournament'}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <button
                onClick={handleZoomOut}
                className="text-gray-600 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center"
                title="Zoom out"
              >
                −
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="text-gray-600 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={handleZoomReset}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>

            {/* Schedule Toggle */}
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              {showSchedule ? 'Hide Schedule' : 'Show Schedule'}
            </button>

            {/* Refresh */}
            <button
              onClick={refreshBracketData}
              disabled={refreshing}
              className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-5rem)] flex">
        {/* Bracket View */}
        <div
          className={`${showSchedule ? 'w-[70%]' : 'w-full'} overflow-auto p-6 transition-all duration-300 bg-gray-50`}
        >
          <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
            {event.bracketType === 'SINGLE_ELIMINATION' && (
              <SingleEliminationBracket
                matches={matches}
                eventFormat={event.format}
                readOnly={true}
              />
            )}
            {event.bracketType === 'ROUND_ROBIN' && (
              <RoundRobinBracket
                matches={matches}
                eventFormat={event.format}
                readOnly={true}
              />
            )}
            {event.bracketType === 'HYBRID' && (
              <HybridBracket
                matches={matches}
                eventFormat={event.format}
                readOnly={true}
              />
            )}
          </div>
        </div>

        {/* Schedule Sidebar */}
        {showSchedule && (
          <div className="w-[30%] border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* User's Next Match */}
              {nextUserMatch && (
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-xl p-4">
                  <h3 className="text-base font-bold text-primary-900 mb-3 flex items-center gap-2">
                    ⏱️ Your Next Match
                  </h3>
                  <MatchItem match={nextUserMatch} />
                  {nextUserMatch.scheduledTime && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-primary-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-700">
                          {getTimeUntilMatch(nextUserMatch.scheduledTime)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">until match starts</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Matches */}
              {liveMatches.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    Live Now
                  </h3>
                  <div className="space-y-2">
                    {liveMatches.slice(0, 3).map(match => (
                      <MatchItem key={match.id} match={match} showTime={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    Upcoming
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {upcomingMatches.slice(0, 5).map(match => (
                      <MatchItem key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Matches */}
              {completedMatches.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    Completed
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {completedMatches.slice(0, 5).map(match => (
                      <MatchItem key={match.id} match={match} showTime={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BracketViewModal
