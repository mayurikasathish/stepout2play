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
          event={bracket.event}
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
// Automatic winner detection based on set scores
const MatchResultModal = ({ match, event, isRoundRobin, onClose, onSubmit }) => {
  const bestOf = event?.bestOf || 3
  const pointsPerSet = event?.pointsPerSet || 21

  // Initialize set scores from existing score string if available
  const initializeSetScores = () => {
    if (!match.score) {
      return Array(bestOf).fill({ p1: '', p2: '' })
    }
    // Parse existing score like "21-19, 21-18"
    const sets = match.score.split(/[,\s]+/).filter(s => s.trim())
    return sets.map(set => {
      const [p1, p2] = set.split('-').map(s => s.trim())
      return { p1: p1 || '', p2: p2 || '' }
    }).concat(Array(Math.max(0, bestOf - sets.length)).fill({ p1: '', p2: '' }))
  }

  // Initialize saved sets and winners from existing scores
  const initializeSavedSets = () => {
    if (!match.score) return []
    const sets = match.score.split(/[,\s]+/).filter(s => s.trim())
    return sets.map((_, idx) => idx) // Mark all existing sets as saved
  }

  const initializeSetWinners = () => {
    if (!match.score) return []
    const sets = match.score.split(/[,\s]+/).filter(s => s.trim())
    return sets.map(set => {
      const [p1, p2] = set.split('-').map(s => parseInt(s.trim()))
      return p1 > p2 ? 'p1' : 'p2'
    })
  }

  const [setScores, setSetScores] = useState(initializeSetScores())
  const [isDraw, setIsDraw]     = useState(false)
  const [drawReason, setDrawReason] = useState('')
  const [errors, setErrors]     = useState({})
  const [savedSets, setSavedSets] = useState(initializeSavedSets()) // Track which sets are saved
  const [setWinners, setSetWinners] = useState(initializeSetWinners()) // Track winner of each set
  const [pendingSetIndex, setPendingSetIndex] = useState(null) // Set waiting for confirmation
  const [showSetConfirmModal, setShowSetConfirmModal] = useState(false)
  const [showMatchWonModal, setShowMatchWonModal] = useState(false)
  const [matchWinner, setMatchWinner] = useState(null)
  const [matchFinalized, setMatchFinalized] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showEditWarningModal, setShowEditWarningModal] = useState(false)
  const [editingSetIndex, setEditingSetIndex] = useState(null)

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const name = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`
    return name
  }

  // Calculate who won each set and overall winner
  const calculateWinner = () => {
    let p1Sets = 0
    let p2Sets = 0
    const setsNeededToWin = Math.ceil(bestOf / 2)

    for (const set of setScores) {
      const p1Score = parseInt(set.p1)
      const p2Score = parseInt(set.p2)

      if (!isNaN(p1Score) && !isNaN(p2Score) && p1Score !== p2Score) {
        if (p1Score > p2Score) p1Sets++
        else p2Sets++
      }
    }

    if (p1Sets >= setsNeededToWin) return match.participant1Id
    if (p2Sets >= setsNeededToWin) return match.participant2Id
    return null
  }

  const updateSetScore = (setIndex, player, value) => {
    const newScores = [...setScores]
    newScores[setIndex] = { ...newScores[setIndex], [player]: value }
    setSetScores(newScores)
    if (errors.sets) setErrors({ ...errors, sets: null })
    if (errors[`set${setIndex}`]) {
      const newErrors = { ...errors }
      delete newErrors[`set${setIndex}`]
      setErrors(newErrors)
    }
  }

  // Validate individual set score
  const validateSetScore = (p1Score, p2Score, setIndex) => {
    const p1 = parseInt(p1Score)
    const p2 = parseInt(p2Score)

    if (isNaN(p1) || isNaN(p2)) {
      return 'Both scores must be entered'
    }

    // At least one player must reach pointsPerSet
    if (p1 < pointsPerSet && p2 < pointsPerSet) {
      return `At least one player must score ${pointsPerSet} or more points`
    }

    // Must have 2-point difference
    const diff = Math.abs(p1 - p2)
    if (diff < 2) {
      return 'Winner must have at least 2-point lead'
    }

    // The player with lower score must not exceed pointsPerSet unless in deuce
    const maxScore = Math.max(p1, p2)
    const minScore = Math.min(p1, p2)

    if (minScore < pointsPerSet - 1) {
      // Normal case: winner must be at pointsPerSet, loser below
      if (maxScore !== pointsPerSet) {
        return `Winner must score exactly ${pointsPerSet} when opponent is below ${pointsPerSet - 1}`
      }
    }

    return null // Valid
  }

  const saveSet = (setIndex) => {
    const set = setScores[setIndex]
    const error = validateSetScore(set.p1, set.p2, setIndex)

    if (error) {
      setErrors({ ...errors, [`set${setIndex}`]: error })
      return
    }

    // Show confirmation modal
    setPendingSetIndex(setIndex)
    setShowSetConfirmModal(true)
  }

  const confirmSaveSet = () => {
    const setIndex = pendingSetIndex
    const set = setScores[setIndex]
    const p1 = parseInt(set.p1)
    const p2 = parseInt(set.p2)

    // Determine winner of this set
    const setWinner = p1 > p2 ? 'p1' : 'p2'
    const newSetWinners = [...setWinners]
    newSetWinners[setIndex] = setWinner

    // Mark set as saved
    const newSavedSets = [...savedSets, setIndex]
    setSavedSets(newSavedSets)
    setSetWinners(newSetWinners)
    setErrors({ ...errors, [`set${setIndex}`]: null })
    setShowSetConfirmModal(false)
    setPendingSetIndex(null)

    // Check if match is won
    const setsNeededToWin = Math.ceil(bestOf / 2)
    const p1Wins = newSetWinners.filter(w => w === 'p1').length
    const p2Wins = newSetWinners.filter(w => w === 'p2').length

    if (p1Wins >= setsNeededToWin || p2Wins >= setsNeededToWin) {
      const winner = p1Wins >= setsNeededToWin ? 'p1' : 'p2'
      const winnerName = winner === 'p1' ? getParticipantName(match.participant1) : getParticipantName(match.participant2)
      setMatchWinner(winnerName)
      setShowMatchWonModal(true)
    }
  }

  const editSet = (setIndex) => {
    if (matchFinalized) {
      setEditingSetIndex(setIndex)
      setShowEditWarningModal(true)
    } else {
      // Allow edit without warning if not finalized
      const newSavedSets = savedSets.filter(idx => idx !== setIndex)
      const newSetWinners = [...setWinners]
      newSetWinners[setIndex] = null
      setSavedSets(newSavedSets)
      setSetWinners(newSetWinners)
      setMatchWinner(null) // Clear match winner since we're editing
    }
  }

  const confirmEdit = () => {
    const setIndex = editingSetIndex
    const newSavedSets = savedSets.filter(idx => idx !== setIndex)
    const newSetWinners = [...setWinners]
    newSetWinners[setIndex] = null
    setSavedSets(newSavedSets)
    setSetWinners(newSetWinners)
    setMatchWinner(null)
    setShowEditWarningModal(false)
    setEditingSetIndex(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    // Check if scoring configuration is set
    if (!event?.bestOf || !event?.pointsPerSet) {
      newErrors.config = 'This event needs scoring configuration before you can enter match results.'
      setErrors(newErrors)
      return
    }

    // If draw, require reason
    if (isDraw) {
      if (!drawReason.trim()) {
        newErrors.draw = 'Please specify reason for draw'
        setErrors(newErrors)
        return
      }
      // Submit draw with reason
      onSubmit(null, `Draw: ${drawReason.trim()}`)
      return
    }

    // Validate: match must be won
    if (!matchWinner) {
      newErrors.winner = 'Match not yet complete. A player must win the required number of sets.'
      setErrors(newErrors)
      return
    }

    // Show finalize confirmation
    setShowFinalizeModal(true)
  }

  const confirmFinalize = () => {
    // Calculate winner based on saved sets only
    let p1Sets = 0
    let p2Sets = 0

    savedSets.forEach(setIndex => {
      const set = setScores[setIndex]
      const p1Score = parseInt(set.p1)
      const p2Score = parseInt(set.p2)
      if (p1Score > p2Score) p1Sets++
      else p2Sets++
    })

    const winnerId = p1Sets > p2Sets ? match.participant1Id : match.participant2Id

    // Build score string from saved sets only
    const scoreString = savedSets
      .sort((a, b) => a - b)
      .map(idx => `${setScores[idx].p1}-${setScores[idx].p2}`)
      .join(', ')

    // Mark as finalized and submit
    setMatchFinalized(true)
    setShowFinalizeModal(false)
    setErrors({})
    onSubmit(winnerId, scoreString)
  }

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-gray-100">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Update Match Result</h2>
          </div>

          <div className="px-8 pb-8 pt-4">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuration Error */}
            {errors.config && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-900 mb-1">⚠️ Scoring Configuration Missing</p>
                    <p className="text-sm text-red-700 mb-3">{errors.config}</p>
                    <div className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">How to fix:</p>
                      <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                        <li>Close this modal</li>
                        <li>Click "Edit" on this event</li>
                        <li>Set "Best of" (e.g., 3, 5, 7)</li>
                        <li>Set "Points Per Set" (e.g., 21)</li>
                        <li>Save the event</li>
                        <li>Come back and enter match scores</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Match Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-900 mb-1">Match Format</p>
                <p className="text-base font-semibold text-blue-700">
                  Best of {bestOf} • {pointsPerSet} points per set
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-3 text-center">
                ✨ Winner will be automatically determined based on sets won
              </p>
            </div>

            {/* Players */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">{getParticipantName(match.participant1)}</span>
                <span className="text-xs text-gray-500">Player 1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">{getParticipantName(match.participant2)}</span>
                <span className="text-xs text-gray-500">Player 2</span>
              </div>
            </div>

            {/* Set Scores */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Enter Set Scores <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                {setScores.map((set, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${savedSets.includes(idx) ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700 w-16">Set {idx + 1}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="P1"
                        value={set.p1}
                        onChange={(e) => updateSetScore(idx, 'p1', e.target.value)}
                        disabled={savedSets.includes(idx)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-400 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="P2"
                        value={set.p2}
                        onChange={(e) => updateSetScore(idx, 'p2', e.target.value)}
                        disabled={savedSets.includes(idx)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <div className="flex gap-2 w-32 justify-end">
                        {!savedSets.includes(idx) && (set.p1 || set.p2) && (
                          <button
                            type="button"
                            onClick={() => saveSet(idx)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap"
                          >
                            Save
                          </button>
                        )}
                        {savedSets.includes(idx) && (
                          <>
                            <span className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg flex items-center gap-1 whitespace-nowrap">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Saved
                            </span>
                            <button
                              type="button"
                              onClick={() => editSet(idx)}
                              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-all whitespace-nowrap"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {savedSets.includes(idx) && setWinners[idx] && (
                      <div className="mt-2 text-sm font-medium text-green-700 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Winner: {setWinners[idx] === 'p1' ? getParticipantName(match.participant1) : getParticipantName(match.participant2)}
                      </div>
                    )}
                    {errors[`set${idx}`] && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors[`set${idx}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {errors.sets && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.sets}
                </p>
              )}
              {errors.winner && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.winner}
                </p>
              )}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">💡 How scoring works:</span><br />
                  • Click "Save" after entering each set to validate and lock it<br />
                  • At least one player must score {pointsPerSet}+ points<br />
                  • Winner must have 2-point lead minimum<br />
                  • Match winner determined when one player wins {Math.ceil(bestOf / 2)} sets
                </p>
              </div>
            </div>

            {/* Draw option (Round Robin only) */}
            {isRoundRobin && (
              <div className="space-y-3">
                <label className="flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all bg-gray-50 border-gray-300">
                  <input
                    type="checkbox"
                    checked={isDraw}
                    onChange={(e) => setIsDraw(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-700">Mark as Draw (1 point each)</span>
                </label>

                {isDraw && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Reason for Draw <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={drawReason}
                      onChange={(e) => {
                        setDrawReason(e.target.value)
                        if (errors.draw) setErrors({ ...errors, draw: null })
                      }}
                      placeholder="e.g., Rain, Player injury, Time constraint"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    {errors.draw && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.draw}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-600">
                      Specify why this match is being marked as a draw
                    </p>
                  </div>
                )}
              </div>
            )}

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
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
              >
                Save Result
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>

    {/* Set Confirmation Modal */}
    {showSetConfirmModal && pendingSetIndex !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSetConfirmModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Set Score</h3>
          <p className="text-gray-600 mb-1">
            Set {pendingSetIndex + 1}: <span className="font-bold">{setScores[pendingSetIndex].p1} - {setScores[pendingSetIndex].p2}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to finalize this score?
          </p>
          <div className="space-y-3">
            <button
              onClick={confirmSaveSet}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowSetConfirmModal(false)}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Match Won Modal */}
    {showMatchWonModal && matchWinner && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowMatchWonModal(false)} />
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center animate-slide-up">
          <div className="mb-4">
            <svg className="w-20 h-20 text-white mx-auto animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">🎉 Match Won!</h2>
          <p className="text-xl font-semibold text-white/90 mb-6">{matchWinner} wins the match!</p>
          <p className="text-sm text-white/80 mb-6">
            You can still edit scores if needed, or click "Save Result" to finalize.
          </p>
          <button
            onClick={() => setShowMatchWonModal(false)}
            className="px-8 py-3 bg-white hover:bg-gray-50 text-green-600 font-bold rounded-xl transition-all shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    )}

    {/* Finalize Match Modal */}
    {showFinalizeModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFinalizeModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Finalize Match Result</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to save this match result? You can still edit it later if needed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFinalizeModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmFinalize}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
            >
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Warning Modal */}
    {showEditWarningModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditWarningModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Finalized Score?</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-2">
            This match has been finalized. Editing scores may affect:
          </p>
          <ul className="text-sm text-gray-600 mb-6 space-y-1 list-disc list-inside">
            <li>Tournament standings</li>
            <li>Future match pairings</li>
            <li>Player statistics</li>
          </ul>
          <p className="text-gray-700 font-medium mb-6">Continue with editing?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditWarningModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmEdit}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all"
            >
              Yes, Edit
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

export default BracketView
