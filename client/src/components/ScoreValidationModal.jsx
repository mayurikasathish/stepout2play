import React, { useState } from 'react'

/**
 * Score Validation Modal
 * Shows parsed OCR results in a beautiful UI
 * Allows user to edit scores or retake photo
 */
const ScoreValidationModal = ({
  isOpen,
  onClose,
  parsedData,
  matchData,
  onConfirm,
  onRetake
}) => {
  const [scores, setScores] = useState({
    player1Id: parsedData.player1Id,
    player2Id: parsedData.player2Id,
    sets: parsedData.sets || []
  })

  const handleScoreChange = (setIndex, player, value) => {
    const newSets = [...scores.sets]
    newSets[setIndex][`player${player}Score`] = parseInt(value) || 0
    setScores({ ...scores, sets: newSets })
  }

  const handleConfirm = () => {
    // Recalculate winner based on edited scores
    let player1Wins = 0
    let player2Wins = 0

    scores.sets.forEach(set => {
      if (set.player1Score > set.player2Score) player1Wins++
      else if (set.player2Score > set.player1Score) player2Wins++
    })

    const winnerId = player1Wins > player2Wins ? scores.player1Id : scores.player2Id

    onConfirm({
      ...scores,
      winnerId,
      player1Wins,
      player2Wins
    })
  }

  if (!isOpen) return null

  // Extract round label from bracketPosition (e.g., "R3-M1" -> "R3")
  const roundLabel = matchData?.bracketPosition?.split('-')[0] || matchData?.roundLabel || 'N/A'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              ✅ Score Extracted Successfully!
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Please verify the scores below. Edit if needed or retake photo.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Match Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-900 mb-2">Match Details</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-600">Match:</span>
                  <span className="ml-2 font-bold text-blue-900">#{matchData?.matchNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Round:</span>
                  <span className="ml-2 font-bold text-blue-900">{roundLabel}</span>
                </div>
              </div>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                <div className="text-xs text-blue-600 font-semibold mb-1">PLAYER 1</div>
                <div className="text-2xl font-black text-blue-900">{scores.player1Id}</div>
                <div className="text-sm text-gray-700 mt-1">{matchData?.player1Name || 'Player 1'}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4">
                <div className="text-xs text-purple-600 font-semibold mb-1">PLAYER 2</div>
                <div className="text-2xl font-black text-purple-900">{scores.player2Id}</div>
                <div className="text-sm text-gray-700 mt-1">{matchData?.player2Name || 'Player 2'}</div>
              </div>
            </div>

            {/* Scores - Editable */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📊 Scores
                <span className="text-xs text-gray-500 font-normal">(Click to edit)</span>
              </div>

              <div className="space-y-3">
                {scores.sets.map((set, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-300">
                    <span className="text-sm font-semibold text-gray-600 w-16">Set {idx + 1}:</span>

                    {/* Player 1 Score */}
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={set.player1Score}
                      onChange={(e) => handleScoreChange(idx, 1, e.target.value)}
                      className="w-16 text-center text-xl font-bold border-2 border-blue-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <span className="text-xl font-bold text-gray-400">-</span>

                    {/* Player 2 Score */}
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={set.player2Score}
                      onChange={(e) => handleScoreChange(idx, 2, e.target.value)}
                      className="w-16 text-center text-xl font-bold border-2 border-purple-300 rounded-lg py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />

                    {/* Winner indicator */}
                    <div className="ml-auto">
                      {set.player1Score > set.player2Score ? (
                        <span className="text-blue-600 font-bold text-sm">✓ P1</span>
                      ) : set.player2Score > set.player1Score ? (
                        <span className="text-purple-600 font-bold text-sm">✓ P2</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Tie</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Winner Display */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-yellow-900 mb-1">Match Winner</div>
                  <div className="text-2xl font-black text-yellow-900">
                    🏆 {scores.sets.filter((s, i) => s.player1Score > s.player2Score).length >
                         scores.sets.filter((s, i) => s.player2Score > s.player1Score).length
                         ? scores.player1Id : scores.player2Id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Sets Won</div>
                  <div className="text-xl font-bold text-gray-900">
                    {scores.sets.filter((s, i) => s.player1Score > s.player2Score).length} - {scores.sets.filter((s, i) => s.player2Score > s.player1Score).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={onRetake}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-bold rounded-lg transition-all"
            >
              📸 Retake Photo
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              ✓ Confirm & Update Bracket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreValidationModal
