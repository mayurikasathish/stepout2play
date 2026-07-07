import { useState, useEffect } from 'react'

// Tennis/Padel Live Scoring Modal - Point by Point
const TennisScoreModal = ({ match, event, isRoundRobin, onClose, onSubmit }) => {
  const scoringRules = event?.scoringRules || {
    bestOf: 3,
    gamesPerSet: 6,
    pointsPerGame: ["0", "15", "30", "40"],
    deuce: true,
    advantage: true,
    tiebreak: {
      enabled: true,
      atGames: "6-6",
      pointsToWin: 7,
      minimumLead: 2
    }
  }

  const bestOf = scoringRules.bestOf
  const setsNeededToWin = Math.ceil(bestOf / 2)
  const goldenPoint = event?.goldenPoint || false // Padel only

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const name = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`
    return name
  }

  // Parse existing score if match is completed or in progress
  const parseExistingScore = () => {
    if (!match.score || match.score === '') {
      return {
        p1Sets: 0, p2Sets: 0, p1Games: 0, p2Games: 0,
        completedSets: [], matchWinner: null
      }
    }

    // Score format: "6-4, 7-5" or "6-4, 7-6(3)"
    const sets = match.score.split(',').map(s => s.trim())
    let p1SetsWon = 0
    let p2SetsWon = 0
    const completedSetsList = []

    sets.forEach(set => {
      completedSetsList.push(set)
      // Parse "6-4" or "7-6(3)"
      const tiebreakMatch = set.match(/(\d+)-(\d+)\((\d+)\)/)
      if (tiebreakMatch) {
        const p1 = parseInt(tiebreakMatch[1])
        const p2 = parseInt(tiebreakMatch[2])
        if (p1 > p2) p1SetsWon++
        else p2SetsWon++
      } else {
        const [p1, p2] = set.split('-').map(g => parseInt(g.trim()))
        if (p1 > p2) p1SetsWon++
        else p2SetsWon++
      }
    })

    let winner = null
    if (p1SetsWon >= setsNeededToWin) {
      winner = getParticipantName(match.participant1)
    } else if (p2SetsWon >= setsNeededToWin) {
      winner = getParticipantName(match.participant2)
    }

    return {
      p1Sets: p1SetsWon,
      p2Sets: p2SetsWon,
      p1Games: 0,
      p2Games: 0,
      completedSets: completedSetsList,
      matchWinner: winner
    }
  }

  const existingScore = parseExistingScore()

  // Live scoring state
  const [p1Sets, setP1Sets] = useState(existingScore.p1Sets)
  const [p2Sets, setP2Sets] = useState(existingScore.p2Sets)
  const [p1Games, setP1Games] = useState(existingScore.p1Games)
  const [p2Games, setP2Games] = useState(existingScore.p2Games)
  const [p1Points, setP1Points] = useState(0)
  const [p2Points, setP2Points] = useState(0)

  // Tiebreak mode
  const [isTiebreak, setIsTiebreak] = useState(false)
  const [tiebreakP1, setTiebreakP1] = useState(0)
  const [tiebreakP2, setTiebreakP2] = useState(0)

  // Deuce/Advantage tracking (for non-golden point)
  const [isDeuce, setIsDeuce] = useState(false)
  const [advantage, setAdvantage] = useState(null) // null, 'p1', or 'p2'

  // Match state
  const [matchWinner, setMatchWinner] = useState(existingScore.matchWinner)
  const [matchFinalized, setMatchFinalized] = useState(match.status === 'COMPLETED')
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showResetWarning, setShowResetWarning] = useState(false)

  // History for undo functionality
  const [history, setHistory] = useState([])

  // Score display history (completed sets)
  const [completedSets, setCompletedSets] = useState(existingScore.completedSets)

  const pointLabels = ["0", "15", "30", "40"]

  const getCurrentPointLabel = (points, opponentPoints) => {
    if (isTiebreak) return points // Tiebreak shows numeric points

    if (points <= 2) return pointLabels[points]
    if (points === 3 && opponentPoints < 3) return "40"

    // Deuce/Advantage logic
    if (points >= 3 && opponentPoints >= 3) {
      if (points === opponentPoints) return "Deuce"
      if (points > opponentPoints) return "Ad"
      return "40"
    }

    return "40"
  }

  const saveToHistory = () => {
    setHistory([...history, {
      p1Sets, p2Sets, p1Games, p2Games, p1Points, p2Points,
      isTiebreak, tiebreakP1, tiebreakP2, isDeuce, advantage,
      completedSets: [...completedSets]
    }])
  }

  const handlePointWon = (player) => {
    if (matchWinner) return // Match already over

    saveToHistory()

    if (isTiebreak) {
      handleTiebreakPoint(player)
    } else {
      handleRegularPoint(player)
    }
  }

  const handleRegularPoint = (player) => {
    const isP1 = player === 'p1'
    const myPoints = isP1 ? p1Points : p2Points
    const oppPoints = isP1 ? p2Points : p1Points
    const setMyPoints = isP1 ? setP1Points : setP2Points
    const setOppPoints = isP1 ? setP2Points : setP1Points

    // Golden Point logic (Padel only)
    if (goldenPoint && myPoints >= 3 && oppPoints >= 3) {
      // At 40-40, next point wins the game
      wonGame(player)
      return
    }

    // Standard Tennis Deuce/Advantage logic
    if (myPoints >= 3 && oppPoints >= 3) {
      // Already at deuce or advantage
      if (myPoints === oppPoints) {
        // Currently deuce → now this player has advantage
        setMyPoints(myPoints + 1)
        setAdvantage(player)
        setIsDeuce(false)
      } else if (myPoints > oppPoints) {
        // This player had advantage → wins game
        wonGame(player)
      } else {
        // Opponent had advantage → back to deuce
        setMyPoints(myPoints + 1)
        setAdvantage(null)
        setIsDeuce(true)
      }
      return
    }

    // Regular point progression: 0 → 15 → 30 → 40
    const newPoints = myPoints + 1
    setMyPoints(newPoints)

    // Check if game won
    if (newPoints >= 4 && newPoints >= oppPoints + 2) {
      wonGame(player)
    } else if (newPoints >= 3 && oppPoints >= 3) {
      setIsDeuce(true)
    }
  }

  const handleTiebreakPoint = (player) => {
    const isP1 = player === 'p1'
    const myScore = isP1 ? tiebreakP1 : tiebreakP2
    const oppScore = isP1 ? tiebreakP2 : tiebreakP1
    const setMyScore = isP1 ? setTiebreakP1 : setTiebreakP2

    const newScore = myScore + 1
    setMyScore(newScore)

    // Tiebreak: first to 7 by 2
    if (newScore >= 7 && newScore >= oppScore + 2) {
      wonTiebreak(player)
    }
  }

  const wonGame = (player) => {
    const isP1 = player === 'p1'
    const myGames = isP1 ? p1Games : p2Games
    const oppGames = isP1 ? p2Games : p1Games
    const setMyGames = isP1 ? setP1Games : setP2Games

    // Reset points
    setP1Points(0)
    setP2Points(0)
    setIsDeuce(false)
    setAdvantage(null)

    // Increment games
    const newGames = myGames + 1
    setMyGames(newGames)

    // Check for set win
    if (newGames >= scoringRules.gamesPerSet && newGames >= oppGames + 2) {
      wonSet(player)
    } else if (newGames === 6 && oppGames === 6) {
      // Enter tiebreak at 6-6
      setIsTiebreak(true)
      setTiebreakP1(0)
      setTiebreakP2(0)
    }
  }

  const wonTiebreak = (player) => {
    const isP1 = player === 'p1'

    // Record tiebreak score in completed sets
    const tiebreakScore = isP1 ? `7-6(${tiebreakP2})` : `6-7(${tiebreakP1})`

    // Exit tiebreak
    setIsTiebreak(false)
    setTiebreakP1(0)
    setTiebreakP2(0)

    wonSet(player, tiebreakScore)
  }

  const wonSet = (player, customScore = null) => {
    const isP1 = player === 'p1'
    const mySets = isP1 ? p1Sets : p2Sets
    const setMySets = isP1 ? setP1Sets : setP2Sets

    // Record completed set
    const setScore = customScore || `${p1Games}-${p2Games}`
    setCompletedSets([...completedSets, setScore])

    // Reset games and points
    setP1Games(0)
    setP2Games(0)
    setP1Points(0)
    setP2Points(0)
    setIsDeuce(false)
    setAdvantage(null)

    // Increment sets
    const newSets = mySets + 1
    setMySets(newSets)

    // Check for match win
    if (newSets >= setsNeededToWin) {
      setMatchWinner(isP1 ? getParticipantName(match.participant1) : getParticipantName(match.participant2))
      setShowFinalizeModal(true)
    }
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const lastState = history[history.length - 1]
    setP1Sets(lastState.p1Sets)
    setP2Sets(lastState.p2Sets)
    setP1Games(lastState.p1Games)
    setP2Games(lastState.p2Games)
    setP1Points(lastState.p1Points)
    setP2Points(lastState.p2Points)
    setIsTiebreak(lastState.isTiebreak)
    setTiebreakP1(lastState.tiebreakP1)
    setTiebreakP2(lastState.tiebreakP2)
    setIsDeuce(lastState.isDeuce)
    setAdvantage(lastState.advantage)
    setCompletedSets(lastState.completedSets)
    setMatchWinner(null)
    setShowFinalizeModal(false)

    setHistory(history.slice(0, -1))
  }

  const handleFinalizeMatch = () => {
    const scoreString = completedSets.join(', ')
    const winnerId = matchWinner === getParticipantName(match.participant1)
      ? match.participant1Id
      : match.participant2Id

    setMatchFinalized(true)
    setShowFinalizeModal(false)
    onSubmit(winnerId, scoreString)
  }

  const handleResetScore = () => {
    // Reset all state to initial values
    setP1Sets(0)
    setP2Sets(0)
    setP1Games(0)
    setP2Games(0)
    setP1Points(0)
    setP2Points(0)
    setIsTiebreak(false)
    setTiebreakP1(0)
    setTiebreakP2(0)
    setIsDeuce(false)
    setAdvantage(null)
    setMatchWinner(null)
    setMatchFinalized(false)
    setCompletedSets([])
    setHistory([])
    setShowResetWarning(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))',
            border: '1px solid rgba(79, 255, 176, 0.3)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '48rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))',
              zIndex: 10,
              padding: '2rem 2rem 1rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Live Match Scoring</h2>
                  {event?.sportId && (
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                      {event.sportId === 'tennis' && '🎾 Tennis'}
                      {event.sportId === 'padel' && '🎾 Padel'}
                      {goldenPoint && ' • Golden Point Enabled'}
                    </p>
                  )}
                </div>
                {matchFinalized && (
                  <button
                    onClick={() => setShowResetWarning(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Score
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>

              {/* Match Info */}
              <div style={{ background: 'rgba(79, 255, 176, 0.1)', border: '1px solid rgba(79, 255, 176, 0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4fffb0', marginBottom: '0.25rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Match Format</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                    Best of {bestOf} Sets
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>
                    {isTiebreak ? '🔥 Tiebreak in progress' : '✨ Click point buttons to score'}
                  </p>
                </div>
              </div>

              {/* Live Scoreboard */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-6 text-white">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-left text-xs font-semibold text-gray-400 uppercase">Player</div>
                  <div className="text-center text-xs font-semibold text-gray-400 uppercase">Sets</div>
                  <div className="text-center text-xs font-semibold text-gray-400 uppercase">Games</div>
                  <div className="text-center text-xs font-semibold text-gray-400 uppercase">
                    {isTiebreak ? 'TB Points' : 'Points'}
                  </div>
                </div>

                {/* Player 1 */}
                <div className="grid grid-cols-4 gap-4 mb-3 p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">P1</span>
                    <span className="text-sm font-semibold truncate">{getParticipantName(match.participant1)}</span>
                  </div>
                  <div className="text-center text-2xl font-bold">{p1Sets}</div>
                  <div className="text-center text-2xl font-bold">{p1Games}</div>
                  <div className="text-center text-2xl font-bold text-green-400">
                    {isTiebreak ? tiebreakP1 : getCurrentPointLabel(p1Points, p2Points)}
                  </div>
                </div>

                {/* Player 2 */}
                <div className="grid grid-cols-4 gap-4 p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">P2</span>
                    <span className="text-sm font-semibold truncate">{getParticipantName(match.participant2)}</span>
                  </div>
                  <div className="text-center text-2xl font-bold">{p2Sets}</div>
                  <div className="text-center text-2xl font-bold">{p2Games}</div>
                  <div className="text-center text-2xl font-bold text-green-400">
                    {isTiebreak ? tiebreakP2 : getCurrentPointLabel(p2Points, p1Points)}
                  </div>
                </div>

                {/* Deuce/Advantage Indicator */}
                {!isTiebreak && isDeuce && !advantage && (
                  <div className="mt-3 text-center text-sm font-semibold text-yellow-400">
                    ⚡ DEUCE
                  </div>
                )}
                {!isTiebreak && advantage && (
                  <div className="mt-3 text-center text-sm font-semibold text-yellow-400">
                    🎯 ADVANTAGE: {advantage === 'p1' ? getParticipantName(match.participant1) : getParticipantName(match.participant2)}
                  </div>
                )}
              </div>

              {/* Completed Sets */}
              {completedSets.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-2">COMPLETED SETS</p>
                  <p className="text-lg font-bold text-gray-900">{completedSets.join(', ')}</p>
                </div>
              )}

              {/* Point Buttons */}
              {!matchWinner && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handlePointWon('p1')}
                    className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    + Point P1
                  </button>
                  <button
                    onClick={() => handlePointWon('p2')}
                    className="px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    + Point P2
                  </button>
                </div>
              )}

              {/* Undo Button */}
              {history.length > 0 && !matchWinner && (
                <button
                  onClick={handleUndo}
                  className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all mb-6"
                >
                  ↩️ Undo Last Point
                </button>
              )}

              {/* Match Winner Display */}
              {matchWinner && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">🏆 Match Winner</p>
                      <p className="text-2xl font-bold text-green-700">{matchWinner}</p>
                      <p className="text-sm text-green-600 mt-1">Final Score: {completedSets.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300"
                >
                  {matchWinner ? 'Close' : 'Cancel'}
                </button>
                {matchWinner && (
                  <button
                    onClick={handleFinalizeMatch}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all shadow-lg"
                  >
                    Save Result
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowFinalizeModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Match Complete!</h3>
                <p className="text-gray-600">Confirm the final result</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Winner</p>
                <p className="text-xl font-bold text-gray-900 mb-4">{matchWinner}</p>
                <p className="text-sm font-medium text-gray-700 mb-2">Final Score</p>
                <p className="text-lg font-semibold text-gray-900">{completedSets.join(', ')}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeMatch}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Score Warning Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowResetWarning(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">⚠️ Reset Match Score?</h3>
                <p className="text-gray-600">This will clear the current result</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> Resetting will:
                </p>
                <ul className="text-sm text-orange-800 mt-2 ml-4 list-disc space-y-1">
                  <li>Clear the final score: <strong>{completedSets.join(', ')}</strong></li>
                  <li>Remove the winner: <strong>{matchWinner}</strong></li>
                  <li>Reset to 0-0 (you can score from scratch)</li>
                  <li>This may affect bracket progression</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetWarning(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetScore}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Reset Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TennisScoreModal
