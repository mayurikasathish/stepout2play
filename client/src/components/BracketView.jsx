import { useState, useEffect } from 'react'
import api from '../services/api'
import BracketGenerator from './BracketGenerator'
import SingleEliminationBracket from './SingleEliminationBracket'
import RoundRobinBracket from './RoundRobinBracket'
import HybridBracket from './HybridBracket'
import Toast from './Toast'

const BracketView = ({ eventId, eventName, eventFormat, registrationCount, isOrganizer, tournament }) => {
  const [bracket, setBracket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    loadBracket()
  }, [eventId])

  const loadBracket = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/events/${eventId}/bracket`)
      if (response.data.success) {
        setBracket(response.data)
      }
    } catch (err) {
      console.error('Error loading bracket:', err)
      if (err.response?.status !== 404) {
        setError('Failed to load bracket')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBracketGenerated = (result) => {
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    setShowToast(false)
    loadBracket().then(() => {
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY))
    })
  }

  const handleDeleteBracket = async () => {
    try {
      await api.delete(`/events/${eventId}/bracket`)
      setBracket(null)
      setError('')
      setShowDeleteConfirm(false)
      setToastMessage('Bracket deleted successfully')
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      console.error('Error deleting bracket:', err)
      setShowDeleteConfirm(false)
      setToastMessage('Failed to delete bracket')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleMatchClick = (match) => {
    setSelectedMatch(match)
    setShowMatchModal(true)
  }

  const handleMatchUpdate = async (winnerId, score) => {
    try {
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      await api.patch(`/matches/${selectedMatch.id}/result`, { winnerId, score })

      setShowMatchModal(false)
      setSelectedMatch(null)
      await loadBracket()

      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY))

      setToastMessage('Match result updated successfully')
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      console.error('Error updating match:', err)
      setShowMatchModal(false)
      setToastMessage('Failed to update match result')
      setToastType('error')
      setShowToast(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // ── Hard API error — show delete button so organizer can recover ──
  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 font-medium mb-1">Failed to load bracket data</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        {isOrganizer && (
          <>
            <div className="glass-card rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">There may be a corrupted bracket.</p>
                <p className="text-sm text-gray-500 mt-1">Delete it to start fresh.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
              >
                Delete Bracket
              </button>
            </div>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Delete Bracket?</h3>
                  <p className="text-gray-600 text-center mb-6">This will permanently delete all match data for this event.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all">Cancel</button>
                    <button onClick={handleDeleteBracket} className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── No bracket yet ──
  if (!bracket || !bracket.event?.bracketGenerated) {
    if (!isOrganizer) {
      return (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-gray-600">Bracket not generated yet. Check back later!</p>
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900">{eventName}</h3>
          <p className="text-sm text-gray-600 mt-1">Generate your tournament bracket below</p>
        </div>
        <BracketGenerator
          eventId={eventId}
          eventName={eventName}
          eventFormat={eventFormat}
          registrationCount={registrationCount}
          onGenerated={handleBracketGenerated}
        />
      </div>
    )
  }

  // ── Bracket exists ──
  const isRoundRobin = bracket.event.bracketFormat === 'ROUND_ROBIN'
  const isHybrid = bracket.event.bracketFormat === 'LEAGUE_CUM_KNOCKOUT'
  const formatLabel  = isHybrid ? 'League-cum-Knockout' : isRoundRobin ? 'Round Robin' : 'Single Elimination'

  const seedingLabel = {
    REGISTRATION_ORDER: 'Registration Order',
    RANDOM: 'Random Draw',
    MANUAL: 'Manual Seeding',
    SNAKE: 'Snake Seeding'
  }[bracket.event.seedingMethod] || bracket.event.seedingMethod

  return (
    <div className="space-y-6">
      {/* Header */}
      {isOrganizer && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{eventName}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                  {formatLabel}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {seedingLabel}
                </span>
                {(isRoundRobin || isHybrid) && bracket.event.groupCount && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                    {bracket.event.groupCount} Group{bracket.event.groupCount !== 1 ? 's' : ''}
                  </span>
                )}
                {isHybrid && bracket.event.advanceCount && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    Top {bracket.event.advanceCount} Qualify
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
            >
              Delete Bracket
            </button>
          </div>
        </div>
      )}

      {/* Bracket Display */}
      {isHybrid ? (
        <HybridBracket
          bracket={bracket}
          onMatchClick={isOrganizer ? handleMatchClick : null}
          isOrganizer={isOrganizer}
        />
      ) : (
        <div className="glass-card rounded-xl p-6">
          {isRoundRobin ? (
            <RoundRobinBracket
              groups={bracket.groups || []}
              isOrganizer={isOrganizer}
              onMatchClick={isOrganizer ? handleMatchClick : null}
              eventName={eventName}
              tournamentName={tournament?.name || 'Tournament'}
            />
          ) : (
            <SingleEliminationBracket
              matches={bracket.matches}
              onMatchClick={isOrganizer ? handleMatchClick : null}
              eventName={eventName}
              tournamentName={tournament?.name || 'Tournament'}
            />
          )}
        </div>
      )}

      {/* Match Result Modal */}
      {showMatchModal && selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          isRoundRobin={isRoundRobin || (isHybrid && selectedMatch.groupId !== null)}
          onClose={() => setShowMatchModal(false)}
          onSubmit={handleMatchUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Bracket?</h3>
              <p className="text-gray-600">
                This will permanently delete this bracket and all match data. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBracket}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
    </div>
  )
}

// ── Match Result Modal ──
// Supports both single-elim (must pick winner) and round-robin (draw allowed)
const MatchResultModal = ({ match, isRoundRobin, onClose, onSubmit }) => {
  const [winnerId, setWinnerId] = useState(match.winnerId || '')
  const [score, setScore]       = useState(match.score || '')
  const [isDraw, setIsDraw]     = useState(false)
  const [errors, setErrors]     = useState({})

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const name = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`
    return name
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validate: winner must be selected (unless draw in round robin)
    if (!isDraw && !winnerId) {
      newErrors.winner = 'Please select a winner'
    }

    // Validate: score is mandatory for round robin
    if (isRoundRobin && (!score || score.trim() === '')) {
      newErrors.score = 'Score is required for round robin matches (needed for tie-breaking)'
    }

    // Validate score format if provided
    if (score && score.trim() !== '') {
      const scorePattern = /^\d+-\d+([,\s]+\d+-\d+)*$/
      if (!scorePattern.test(score.trim())) {
        newErrors.score = 'Invalid format. Use: "6-4, 6-3" or "21-19, 21-18"'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Clear errors and submit
    setErrors({})
    onSubmit(isDraw ? null : winnerId, score)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Match Result</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                {isRoundRobin ? 'Result' : 'Winner *'}
              </label>
              <div className="space-y-2">
                {/* Player 1 */}
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  !isDraw && winnerId === match.participant1Id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="winner"
                    value={match.participant1Id}
                    checked={!isDraw && winnerId === match.participant1Id}
                    onChange={(e) => {
                      setIsDraw(false);
                      setWinnerId(e.target.value);
                      if (errors.winner) setErrors({ ...errors, winner: null })
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">{getParticipantName(match.participant1)}</span>
                </label>

                {/* Player 2 */}
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  !isDraw && winnerId === match.participant2Id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="winner"
                    value={match.participant2Id}
                    checked={!isDraw && winnerId === match.participant2Id}
                    onChange={(e) => {
                      setIsDraw(false);
                      setWinnerId(e.target.value);
                      if (errors.winner) setErrors({ ...errors, winner: null })
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">{getParticipantName(match.participant2)}</span>
                </label>

                {/* Draw option (Round Robin only) */}
                {isRoundRobin && (
                  <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isDraw ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="winner"
                      checked={isDraw}
                      onChange={() => { setIsDraw(true); setWinnerId(''); if (errors.winner) setErrors({ ...errors, winner: null }) }}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-700">Draw (1 point each)</span>
                  </label>
                )}
              </div>
              {errors.winner && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.winner}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Score
                {isRoundRobin && (
                  <>
                    <span className="text-red-600 text-base ml-1">*</span>
                    <span className="text-xs text-gray-600 ml-2 font-normal">(required for tie-breaking)</span>
                  </>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g., 6-4, 6-3 or 21-15, 21-18"
                value={score}
                onChange={(e) => {
                  setScore(e.target.value)
                  if (errors.score) setErrors({ ...errors, score: null })
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                  errors.score ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required={isRoundRobin}
              />
              {errors.score && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.score}
                </p>
              )}
              {!errors.score && isRoundRobin && (
                <p className="mt-2 text-xs text-gray-600">
                  Format: "6-4, 6-3" or "21-19, 21-18" (sets/games separated by comma or space)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isDraw && !winnerId}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Result
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BracketView
