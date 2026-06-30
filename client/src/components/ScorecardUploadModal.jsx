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
      setResult(response.data)

      // Show validation modal if parsing succeeded
      if (response.data.parsed?.success) {
        console.log('🎯 Setting showValidation to TRUE')
        setShowValidation(true)
      } else {
        console.log('⚠️ Not showing validation - parsed.success is false')
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
  }

  if (!isOpen) return null

  // Hide upload modal when validation modal is showing
  if (showValidation) {
    console.log('🎨 Rendering ScoreValidationModal with:', result?.parsed)
    return (
      <ScoreValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        parsedData={result.parsed}
        matchData={match}
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
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                📸 Upload Scorecard
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Match {match?.matchNumber} - Upload a photo of the filled scorecard
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Upload Section */}
            {!previewUrl && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-all">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="scorecardUpload"
                />
                <label
                  htmlFor="scorecardUpload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-16 h-16 text-gray-400 mb-4"
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
                  <span className="text-lg font-semibold text-gray-700 mb-2">
                    Click to upload scorecard photo
                  </span>
                  <span className="text-sm text-gray-500">
                    JPG, PNG, WEBP (Max 10MB)
                  </span>
                </label>
              </div>
            )}

            {/* Preview & Extract */}
            {previewUrl && (
              <div>
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Scorecard preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg border-2 border-gray-200"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPreviewUrl(null)
                      setSelectedImage(null)
                      setResult(null)
                      setError(null)
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extracting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
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
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-semibold">❌ {error}</p>
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
                ) : (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <h4 className="text-yellow-900 font-bold mb-2">⚠️ Partial Extraction</h4>
                    <p className="text-sm text-yellow-800 mb-2">{result.parsed?.error || 'Could not parse scorecard format'}</p>

                    {result.numbers && result.numbers.length > 0 && (
                      <div className="bg-white rounded p-3 border border-yellow-200 mt-2">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Numbers Found:</div>
                        <div className="text-lg font-mono">{result.numbers.join(', ')}</div>
                      </div>
                    )}

                    <details className="text-xs mt-3">
                      <summary className="cursor-pointer text-gray-600">View Raw Extracted Text</summary>
                      <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto bg-white p-3 rounded border border-yellow-200">
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
