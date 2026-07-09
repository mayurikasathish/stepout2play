import { useState, useEffect } from 'react'
import api from '../services/api'

// Universal Point-by-Point Scoring Modal - Dark Glassmorphism
// Supports: Badminton, Table Tennis, Pickleball, Squash
const UniversalScoreModal = ({ match, event, isRoundRobin, onClose, onSubmit, onCancelMatch }) => {
  const sportId = event?.sportId || 'badminton'
  const scoringRules = getSportRules(sportId, event)

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const name = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`
    return name
  }

  const p1Name = getParticipantName(match.participant1)
  const p2Name = getParticipantName(match.participant2)

  // State
  const [currentSet, setCurrentSet] = useState(1)
  const [p1Score, setP1Score] = useState(0)
  const [p2Score, setP2Score] = useState(0)
  const [p1SetsWon, setP1SetsWon] = useState(0)
  const [p2SetsWon, setP2SetsWon] = useState(0)
  const [completedSets, setCompletedSets] = useState([])
  const [pointHistory, setPointHistory] = useState([])
  const [matchWinner, setMatchWinner] = useState(null)
  const [showWalkoverModal, setShowWalkoverModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // 🔥 LOAD EXISTING POINTS ON MODAL OPEN
  useEffect(() => {
    if (match.pointHistory) {
      try {
        const history = JSON.parse(match.pointHistory)
        if (history.length > 0) {
          rebuildStateFromHistory(history)
        }
      } catch (err) {
        console.error('Failed to parse point history:', err)
      }
    }
  }, [match.id])

  // Check if set is won
  const checkSetWinner = (p1, p2, rules) => {
    const { pointsToWin, minimumLead, maxScore } = rules

    if (p1 < pointsToWin && p2 < pointsToWin) return null

    const lead = Math.abs(p1 - p2)
    if (lead >= minimumLead) {
      return p1 > p2 ? 'p1' : 'p2'
    }

    if (maxScore) {
      if (p1 === maxScore) return 'p1'
      if (p2 === maxScore) return 'p2'
    }

    return null
  }

  // Add point to player
  const addPoint = async (player) => {
    // 🔥 PREVENT ADDING POINTS IF MATCH ALREADY WON
    if (matchWinner) {
      alert('Match is already won! Please finalize the match.')
      return
    }

    const newP1 = player === 'p1' ? p1Score + 1 : p1Score
    const newP2 = player === 'p2' ? p2Score + 1 : p2Score

    const historyEntry = {
      timestamp: new Date().toISOString(),
      set: currentSet,
      player,
      score: { p1: newP1, p2: newP2 }
    }
    const newHistory = [...pointHistory, historyEntry]
    setPointHistory(newHistory)

    setP1Score(newP1)
    setP2Score(newP2)

    // 🔥 AUTO-SAVE TO DATABASE AFTER EVERY POINT
    try {
      await api.patch(`/matches/${match.id}/live-score`, {
        pointHistory: JSON.stringify(newHistory),
        currentScore: `${newP1}-${newP2}`,
        currentSet
      })
    } catch (err) {
      console.error('Failed to save live score:', err)
      // Don't block UI if save fails
    }

    const setWinner = checkSetWinner(newP1, newP2, scoringRules)
    if (setWinner) {
      handleSetWon(setWinner, newP1, newP2)
    }
  }

  // Handle set completion
  const handleSetWon = (winner, p1Final, p2Final) => {
    const newCompletedSets = [...completedSets, { p1: p1Final, p2: p2Final }]
    setCompletedSets(newCompletedSets)

    const newP1Sets = winner === 'p1' ? p1SetsWon + 1 : p1SetsWon
    const newP2Sets = winner === 'p2' ? p2SetsWon + 1 : p2SetsWon
    setP1SetsWon(newP1Sets)
    setP2SetsWon(newP2Sets)

    const setsToWin = Math.ceil(scoringRules.bestOf / 2)
    if (newP1Sets >= setsToWin) {
      setMatchWinner('p1')
      // 🔥 RESET SCORES when match is won to prevent duplicate in finalize
      setP1Score(0)
      setP2Score(0)
    } else if (newP2Sets >= setsToWin) {
      setMatchWinner('p2')
      // 🔥 RESET SCORES when match is won to prevent duplicate in finalize
      setP1Score(0)
      setP2Score(0)
    } else {
      setCurrentSet(currentSet + 1)
      setP1Score(0)
      setP2Score(0)
    }
  }

  // Undo last point
  const undoLastPoint = () => {
    if (pointHistory.length === 0) return

    const newHistory = [...pointHistory]
    newHistory.pop()
    setPointHistory(newHistory)
    rebuildStateFromHistory(newHistory)
  }

  const rebuildStateFromHistory = (history) => {
    if (history.length === 0) {
      setCurrentSet(1)
      setP1Score(0)
      setP2Score(0)
      setP1SetsWon(0)
      setP2SetsWon(0)
      setCompletedSets([])
      setMatchWinner(null)
      return
    }

    let set = 1
    let p1 = 0, p2 = 0
    let p1Sets = 0, p2Sets = 0
    let sets = []

    history.forEach((entry) => {
      if (entry.set > set) {
        // Previous set was completed, add it to history
        sets.push({ p1, p2 })
        if (p1 > p2) p1Sets++
        else p2Sets++
        set = entry.set
        p1 = 0
        p2 = 0
      }
      p1 = entry.score.p1
      p2 = entry.score.p2
    })

    // 🔥 CHECK IF CURRENT SET IS WON (not yet in history's next set)
    const currentSetWinner = checkSetWinner(p1, p2, scoringRules)
    let finalP1Sets = p1Sets
    let finalP2Sets = p2Sets

    if (currentSetWinner === 'p1') {
      finalP1Sets++
    } else if (currentSetWinner === 'p2') {
      finalP2Sets++
    }

    setCurrentSet(set)
    setP1Score(p1)
    setP2Score(p2)
    setP1SetsWon(finalP1Sets)
    setP2SetsWon(finalP2Sets)
    setCompletedSets(sets)

    // 🔥 CHECK IF MATCH IS ALREADY WON
    const setsToWin = Math.ceil(scoringRules.bestOf / 2)
    if (finalP1Sets >= setsToWin) {
      setMatchWinner('p1')
    } else if (finalP2Sets >= setsToWin) {
      setMatchWinner('p2')
    } else {
      setMatchWinner(null)
    }
  }

  // Finalize match
  const handleFinalize = () => {
    // Include current set if match ended mid-set (should not happen but safety check)
    let allSets = [...completedSets]
    if (p1Score > 0 || p2Score > 0) {
      allSets.push({ p1: p1Score, p2: p2Score })
    }

    const scoreString = allSets.map(s => `${s.p1}-${s.p2}`).join(', ')
    const winnerId = matchWinner === 'p1' ? match.participant1?.id : match.participant2?.id

    if (!winnerId) {
      alert('Error: No winner determined. Please complete the match properly.')
      return
    }

    console.log('🔥 UniversalScoreModal - Finalizing match:')
    console.log('  Match ID:', match.id)
    console.log('  Match Winner (internal):', matchWinner)
    console.log('  Winner ID (registration):', winnerId)
    console.log('  Participant 1 ID:', match.participant1?.id, '- Name:', match.participant1?.user?.firstName)
    console.log('  Participant 2 ID:', match.participant2?.id, '- Name:', match.participant2?.user?.firstName)
    console.log('  Score string:', scoreString)
    console.log('  Sets won:', p1SetsWon, '-', p2SetsWon)
    console.log('  Point history length:', pointHistory.length)

    // Call onSubmit with winnerId, score, and pointHistory as separate parameters
    onSubmit(winnerId, scoreString, JSON.stringify(pointHistory))
  }

  // Handle walkover
  const handleWalkover = (winnerId) => {
    onSubmit({
      winnerId,
      score: 'W.O.',
      pointHistory: JSON.stringify([])
    })
  }

  // Handle cancel match (back to READY)
  const handleCancelMatch = () => {
    if (onCancelMatch) {
      onCancelMatch(match.id)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Live Scoring</h2>
            <div className="flex items-center gap-2">
              {/* Walkover Button */}
              <button
                onClick={() => setShowWalkoverModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-yellow-400"
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(251, 191, 36, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(251, 191, 36, 0.1)'
                }}
              >
                Walkover
              </button>
              {/* Cancel Button */}
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-gray-400"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                Cancel Match
              </button>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
          <div className="text-sm text-white/60">
            {event?.tournament?.name} • {event?.name}
          </div>
          <div className="text-sm text-white/60 capitalize mt-1">
            {sportId.replace('-', ' ')} • Best of {scoringRules.bestOf}
          </div>
        </div>

        {/* Match Winner Banner */}
        {matchWinner && (
          <div
            className="m-6 p-4 rounded-xl"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <div className="font-bold text-green-400">Match Winner: {matchWinner === 'p1' ? p1Name : p2Name}</div>
                <div className="text-sm text-green-400/70">Click "Finalize Match" to save</div>
              </div>
            </div>
          </div>
        )}

        {/* Sets Won & Current Set */}
        <div
          className="mx-6 mt-6 p-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-center gap-6 text-sm text-white/70">
            <div className="font-semibold">Sets: <span className="text-white text-lg">{p1SetsWon} - {p2SetsWon}</span></div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="font-semibold text-primary-400">Set {currentSet}</div>
          </div>
        </div>

        {/* Main Scoring Area */}
        <div className="p-6 space-y-4">
          {/* Player 1 */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold text-white">{p1Name}</div>
                <div className="text-sm text-white/50">Player 1</div>
              </div>
              <div className="text-6xl font-bold text-blue-400">{p1Score}</div>
            </div>
            <button
              onClick={() => addPoint('p1')}
              disabled={matchWinner}
              className="w-full py-4 rounded-lg font-bold text-lg transition-all"
              style={{
                background: matchWinner ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.8)',
                color: matchWinner ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                cursor: matchWinner ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!matchWinner) e.target.style.background = 'rgba(59, 130, 246, 1)'
              }}
              onMouseLeave={(e) => {
                if (!matchWinner) e.target.style.background = 'rgba(59, 130, 246, 0.8)'
              }}
            >
              + Point
            </button>
          </div>

          {/* Current Score Display */}
          <div
            className="py-6 rounded-xl text-center"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '2px solid rgba(168, 85, 247, 0.3)'
            }}
          >
            <div className="text-sm text-white/50 mb-2">Current Score</div>
            <div className="text-5xl font-bold text-purple-400">
              {p1Score} - {p2Score}
            </div>
          </div>

          {/* Player 2 */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold text-white">{p2Name}</div>
                <div className="text-sm text-white/50">Player 2</div>
              </div>
              <div className="text-6xl font-bold text-red-400">{p2Score}</div>
            </div>
            <button
              onClick={() => addPoint('p2')}
              disabled={matchWinner}
              className="w-full py-4 rounded-lg font-bold text-lg transition-all"
              style={{
                background: matchWinner ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.8)',
                color: matchWinner ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                cursor: matchWinner ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!matchWinner) e.target.style.background = 'rgba(239, 68, 68, 1)'
              }}
              onMouseLeave={(e) => {
                if (!matchWinner) e.target.style.background = 'rgba(239, 68, 68, 0.8)'
              }}
            >
              + Point
            </button>
          </div>

          {/* Completed Sets */}
          {completedSets.length > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="text-sm font-semibold text-white/60 mb-2">Completed Sets:</div>
              <div className="flex flex-wrap gap-2">
                {completedSets.map((set, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg text-sm font-mono font-semibold text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Set {idx + 1}: {set.p1}-{set.p2}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Undo Button */}
          {pointHistory.length > 0 && !matchWinner && (
            <button
              onClick={undoLastPoint}
              className="w-full py-3 rounded-lg font-semibold transition-all text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              ↶ Undo Last Point
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all text-white"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            Cancel
          </button>
          {matchWinner && (
            <button
              onClick={handleFinalize}
              className="flex-1 px-6 py-3 rounded-lg font-bold transition-all shadow-lg text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8))'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(5, 150, 105, 1))'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8))'
              }}
            >
              ✓ Finalize Match
            </button>
          )}
        </div>
      </div>

      {/* Walkover Modal */}
      {showWalkoverModal && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div
            className="w-full max-w-md p-6 rounded-xl"
            style={{
              background: 'rgba(10, 22, 40, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Walkover</h3>
            <p className="text-white/70 text-sm mb-6">
              Select the player who won by walkover (the opponent didn't show up or withdrew).
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleWalkover(match.participant1?.id)}
                className="w-full py-3 px-4 rounded-lg font-semibold text-left transition-all text-white"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.2)'
                }}
              >
                {p1Name} Won
              </button>
              <button
                onClick={() => handleWalkover(match.participant2?.id)}
                className="w-full py-3 px-4 rounded-lg font-semibold text-left transition-all text-white"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                }}
              >
                {p2Name} Won
              </button>
            </div>
            <button
              onClick={() => setShowWalkoverModal(false)}
              className="w-full py-2 rounded-lg font-semibold transition-all text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cancel Match Confirmation */}
      {showCancelConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div
            className="w-full max-w-md p-6 rounded-xl"
            style={{
              background: 'rgba(10, 22, 40, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Cancel Match?</h3>
            <p className="text-white/70 text-sm mb-6">
              This will reset the match back to READY status and discard any points scored. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 rounded-lg font-semibold transition-all text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                No, Keep Scoring
              </button>
              <button
                onClick={handleCancelMatch}
                className="flex-1 py-2 rounded-lg font-semibold transition-all text-white"
                style={{
                  background: 'rgba(239, 68, 68, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 1)'
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sport-specific rules
function getSportRules(sportId, event) {
  const rules = {
    badminton: {
      name: 'Badminton',
      bestOf: 3,
      pointsToWin: 21,
      minimumLead: 2,
      maxScore: 30,
      usePoints: false
    },
    'table-tennis': {
      name: 'Table Tennis',
      bestOf: event?.scoringRules?.bestOf || 5,
      pointsToWin: 11,
      minimumLead: 2,
      maxScore: null,
      usePoints: false
    },
    pickleball: {
      name: 'Pickleball',
      bestOf: 3,
      pointsToWin: 11,
      minimumLead: 2,
      maxScore: null,
      usePoints: false
    },
    squash: {
      name: 'Squash',
      bestOf: 5,
      pointsToWin: 11,
      minimumLead: 2,
      maxScore: null,
      usePoints: false
    }
  }

  return rules[sportId] || rules.badminton
}

export default UniversalScoreModal
