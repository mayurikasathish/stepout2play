import React, { useState } from 'react'
import api from '../services/api'
import ScoreValidationModal from './ScoreValidationModal'

const ScorecardUploadModal = ({ isOpen, onClose, match, onScoreExtracted }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showValidation, setShowValidation] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualScores, setManualScores] = useState({
    player1Id: '',
    player2Id: '',
    sets: [
      { player1Score: '', player2Score: '' },
      { player1Score: '', player2Score: '' },
      { player1Score: '', player2Score: '' }
    ]
  })

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Clear ALL previous state
      setResult(null)
      setError(null)
      setExtracting(false)

      // Set new image
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleExtract = async () => {
    console.log('🚀 handleExtract called!')

    if (!selectedImage) {
      setError('Please select an image first')
      return
    }

    console.log('📸 Selected image:', selectedImage.name)
    setExtracting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('scorecard', selectedImage)

      console.log('📤 Uploading scorecard...')
      const response = await api.post(`/ocr/extract-score?t=${Date.now()}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ OCR Response:', response.data)
      console.log('📊 Parsed success?', response.data.parsed?.success)
      console.log('📄 Extracted text (first 1500 chars):', response.data.extracted?.substring(0, 1500))

      if (!response.data.parsed?.success) {
        console.log('❌ Parser error:', response.data.parsed?.error)
        console.log('🔍 Parsed data:', response.data.parsed)
      }

      setResult(response.data)

      // Show validation modal if parsing succeeded
      if (response.data.parsed?.success) {
        console.log('🎯 Setting showValidation to TRUE')
        setShowValidation(true)
      } else {
        console.log('⚠️ Not showing validation - parsed.success is false')

        // If we got player IDs but no scores, pre-fill manual entry
        if (response.data.parsed?.playerIds && response.data.parsed.playerIds.length >= 2) {
          setManualScores(prev => ({
            ...prev,
            player1Id: response.data.parsed.playerIds[0] || '',
            player2Id: response.data.parsed.playerIds[1] || ''
          }))
        }
      }
    } catch (err) {
      console.error('❌ OCR Error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to extract text')
    } finally {
      setExtracting(false)
    }
  }

  const handleClose = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setExtracting(false)
    setShowValidation(false)
    setShowManualEntry(false)
    setManualScores({
      player1Id: '',
      player2Id: '',
      sets: [
        { player1Score: '', player2Score: '' },
        { player1Score: '', player2Score: '' },
        { player1Score: '', player2Score: '' }
      ]
    })
    onClose()
  }

  const handleConfirmScores = (validatedData) => {
    // Pass validated scores to parent (BracketView) to update bracket
    if (onScoreExtracted) {
      onScoreExtracted(validatedData, match)
    }
    handleClose()
  }

  const handleRetake = () => {
    // Reset to allow retaking photo
    setShowValidation(false)
    setResult(null)
    setSelectedImage(null)
    setPreviewUrl(null)
    setShowManualEntry(false)
  }

  const handleManualEntry = () => {
    setShowManualEntry(true)
  }

  const handleManualScoreChange = (setIndex, player, value) => {
    setManualScores(prev => {
      const newSets = [...prev.sets]
      newSets[setIndex][player] = value
      return { ...prev, sets: newSets }
    })
  }

  const handleManualPlayerIdChange = (player, value) => {
    setManualScores(prev => ({
      ...prev,
      [player]: value.toUpperCase()
    }))
  }

  const handleManualSubmit = () => {
    // Validate inputs
    if (!manualScores.player1Id || !manualScores.player2Id) {
      setError('Please enter both player IDs')
      return
    }

    // Count non-empty sets
    const validSets = manualScores.sets.filter(
      set => set.player1Score !== '' && set.player2Score !== ''
    )

    if (validSets.length === 0) {
      setError('Please enter at least one set score')
      return
    }

    // Convert to parsed format
    const parsedData = {
      success: true,
      player1Id: manualScores.player1Id,
      player2Id: manualScores.player2Id,
      sets: validSets.map(set => ({
        player1Score: parseInt(set.player1Score),
        player2Score: parseInt(set.player2Score)
      }))
    }

    // Calculate winner
    let player1Wins = 0
    let player2Wins = 0
    parsedData.sets.forEach(set => {
      if (set.player1Score > set.player2Score) player1Wins++
      else if (set.player2Score > set.player1Score) player2Wins++
    })
    parsedData.winnerId = player1Wins > player2Wins ? parsedData.player1Id : parsedData.player2Id
    parsedData.player1Wins = player1Wins
    parsedData.player2Wins = player2Wins

    // Update result and show validation
    setResult({ ...result, parsed: parsedData })
    setShowManualEntry(false)
    setShowValidation(true)
  }

  if (!isOpen) return null

  // Hide upload modal when validation modal is showing
  if (showValidation) {
    console.log('🎨 Rendering ScoreValidationModal with:', result?.parsed)

    // Prepare match data with player names
    const enrichedMatchData = {
      ...match,
      player1Name: match?.participant1
        ? `${match.participant1.user.firstName} ${match.participant1.user.lastName}`
        : 'TBD',
      player2Name: match?.participant2
        ? `${match.participant2.user.firstName} ${match.participant2.user.lastName}`
        : 'TBD'
    }

    return (
      <ScoreValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        parsedData={result.parsed}
        matchData={enrichedMatchData}
        onConfirm={handleConfirmScores}
        onRetake={handleRetake}
      />
    )
  }

  console.log('📋 Rendering upload modal. showValidation:', showValidation, 'result:', result)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          maxWidth: '48rem',
          width: '100%'
        }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                📸 Upload Scorecard
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                Match {match?.matchNumber} - Upload a photo of the filled scorecard
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
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
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem' }}>
            {/* Upload Section */}
            {!previewUrl && (
              <div style={{
                border: '2px dashed rgba(0, 212, 255, 0.3)',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.currentTarget.style.background = 'transparent';
              }}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="scorecardUpload"
                />
                <label
                  htmlFor="scorecardUpload"
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <svg
                    style={{ width: '4rem', height: '4rem', color: '#00d4ff', marginBottom: '1rem' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
                    Click to upload scorecard photo
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    JPG, PNG, WEBP (Max 10MB)
                  </span>
                </label>
              </div>
            )}

            {/* Preview & Extract */}
            {previewUrl && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={previewUrl}
                    alt="Scorecard preview"
                    style={{ maxWidth: '100%', maxHeight: '24rem', margin: '0 auto', borderRadius: '12px', border: '2px solid rgba(0, 212, 255, 0.3)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setPreviewUrl(null)
                      setSelectedImage(null)
                      setResult(null)
                      setError(null)
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: '600',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={handleExtract}
                    disabled={extracting}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #4fffb0 0%, #00d4ff 100%)',
                      border: 'none',
                      color: '#000',
                      fontWeight: '700',
                      borderRadius: '8px',
                      cursor: extracting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      opacity: extracting ? 0.5 : 1,
                      boxShadow: '0 4px 15px rgba(79, 255, 176, 0.3)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase',
                      fontSize: '0.875rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!extracting) {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 255, 176, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {extracting ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          height: '1.25rem',
                          width: '1.25rem',
                          border: '2px solid #000',
                          borderTopColor: 'transparent',
                          borderRadius: '50%'
                        }}></div>
                        Extracting...
                      </div>
                    ) : (
                      '🤖 Extract Score with AI'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem' }}>
                <p style={{ color: '#ef4444', fontWeight: '700', fontFamily: "'Barlow Condensed', sans-serif" }}>❌ {error}</p>
              </div>
            )}

            {/* Results - Only show if validation modal is NOT open */}
            {result && !showValidation && (
              <div className="mt-4 space-y-4">
                {/* Parsed Data */}
                {result.parsed?.success ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="text-green-900 font-bold mb-3 flex items-center gap-2">
                      ✅ Scorecard Extracted Successfully
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        {result.processing_time_ms}ms
                      </span>
                    </h4>

                    <div className="space-y-3">
                      {/* Player IDs */}
                      <div className="bg-white rounded p-3 border border-green-200">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Players:</div>
                        <div className="flex gap-4">
                          <div className="text-lg font-bold text-blue-600">{result.parsed.player1Id}</div>
                          <div className="text-lg text-gray-400">vs</div>
                          <div className="text-lg font-bold text-blue-600">{result.parsed.player2Id}</div>
                        </div>
                      </div>

                      {/* Scores */}
                      {result.parsed.sets && result.parsed.sets.length > 0 && (
                        <div className="bg-white rounded p-3 border border-green-200">
                          <div className="text-sm font-semibold text-gray-700 mb-2">Scores:</div>
                          {result.parsed.sets.map((set, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 w-12">Set {idx + 1}:</span>
                              <span className="text-lg font-bold">{set.player1Score}</span>
                              <span className="text-gray-400">-</span>
                              <span className="text-lg font-bold">{set.player2Score}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Winner */}
                      <div className="bg-white rounded p-3 border border-green-200">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Winner:</div>
                        <div className="text-xl font-bold text-green-600">
                          🏆 {result.parsed.winnerId}
                        </div>
                      </div>

                      {/* Debug: All Numbers Found */}
                      {result.numbers && result.numbers.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500">Debug: Numbers Found</summary>
                          <div className="mt-2 bg-gray-50 p-2 rounded">
                            {result.numbers.join(', ')}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ) : showManualEntry ? (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="text-blue-900 font-bold mb-3">✏️ Manual Score Entry</h4>

                    {/* Player IDs */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Player 1 ID</label>
                        <input
                          type="text"
                          value={manualScores.player1Id}
                          onChange={(e) => handleManualPlayerIdChange('player1Id', e.target.value)}
                          placeholder="P001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Player 2 ID</label>
                        <input
                          type="text"
                          value={manualScores.player2Id}
                          onChange={(e) => handleManualPlayerIdChange('player2Id', e.target.value)}
                          placeholder="P002"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Sets */}
                    <div className="space-y-3 mb-4">
                      <label className="block text-sm font-semibold text-gray-700">Scores</label>
                      {manualScores.sets.map((set, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-16">Set {idx + 1}:</span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={set.player1Score}
                            onChange={(e) => handleManualScoreChange(idx, 'player1Score', e.target.value)}
                            placeholder="21"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={set.player2Score}
                            onChange={(e) => handleManualScoreChange(idx, 'player2Score', e.target.value)}
                            placeholder="19"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">Leave unused sets empty</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowManualEntry(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleManualSubmit}
                        className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg"
                      >
                        Continue with Manual Entry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <h4 className="text-yellow-900 font-bold mb-2">⚠️ Partial Extraction</h4>
                    <p className="text-sm text-yellow-800 mb-3">{result.parsed?.error || 'Could not parse scorecard format'}</p>

                    {result.parsed?.playerIds && result.parsed.playerIds.length > 0 && (
                      <div className="bg-white rounded p-3 border border-yellow-200 mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Player IDs Found:</div>
                        <div className="text-lg font-mono">{result.parsed.playerIds.join(', ')}</div>
                      </div>
                    )}

                    {result.parsed?.sets && result.parsed.sets.length > 0 && (
                      <div className="bg-white rounded p-3 border border-yellow-200 mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Sets Found:</div>
                        {result.parsed.sets.map((set, idx) => (
                          <div key={idx} className="text-sm">
                            Set {idx + 1}: {set.player1Score}-{set.player2Score}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Manual Entry Button */}
                    <button
                      onClick={handleManualEntry}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg mb-3"
                    >
                      ✏️ Enter Scores Manually
                    </button>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 font-semibold">🔍 View Raw OCR Text (for debugging)</summary>
                      <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto bg-white p-3 rounded border border-yellow-200 max-h-60 overflow-y-auto">
                        {result.extracted}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScorecardUploadModal
