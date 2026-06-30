import React, { useRef } from 'react'
import html2canvas from 'html2canvas'

/**
 * Badminton Scorecard Template
 * Optimized for OCR extraction with high contrast, clear labels, and structured layout
 */
const BadmintonScorecard = ({ match, eventName }) => {
  const scorecardRef = useRef(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    if (!scorecardRef.current) return

    try {
      // Convert the scorecard to canvas
      const canvas = await html2canvas(scorecardRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
        logging: false
      })

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `scorecard-match${match?.matchNumber || 'template'}.png`
        link.click()
        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error('Error downloading scorecard:', error)
      alert('Failed to download scorecard. Please try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Action Buttons (hidden in print) */}
      <div className="mb-4 print:hidden flex gap-3">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          🖨️ Print Scorecard
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
        >
          📥 Download as Image
        </button>
      </div>

      {/* Scorecard - Optimized for A4 printing and OCR */}
      <div ref={scorecardRef} className="bg-white border-4 border-black p-8 scorecard" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="text-center border-b-4 border-black pb-4 mb-6">
          <h1 className="text-4xl font-black mb-2">BADMINTON SCORECARD</h1>
          <p className="text-xl font-bold">{eventName}</p>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-2xl font-bold">
          <div className="border-4 border-black p-4">
            <div className="text-sm mb-1">MATCH NUMBER</div>
            <div className="text-5xl font-black text-center">{match?.matchNumber || '___'}</div>
          </div>
          <div className="border-4 border-black p-4">
            <div className="text-sm mb-1">ROUND</div>
            <div className="text-5xl font-black text-center">{match?.roundLabel || '___'}</div>
          </div>
        </div>

        {/* Player 1 */}
        <div className="border-4 border-black p-6 mb-4">
          <div className="text-xl font-bold mb-3">PLAYER 1 ID</div>
          <div className="grid grid-cols-5 gap-3">
            {(match?.player1Id || 'P___').split('').map((char, idx) => (
              <div key={idx} className="border-4 border-black p-4 text-center">
                <div className="text-6xl font-black">{char}</div>
              </div>
            ))}
          </div>
          {match?.player1Name && (
            <div className="text-lg mt-3 text-gray-600">{match.player1Name}</div>
          )}
        </div>

        {/* VS Divider */}
        <div className="text-center my-6">
          <div className="text-5xl font-black">VS</div>
        </div>

        {/* Player 2 */}
        <div className="border-4 border-black p-6 mb-8">
          <div className="text-xl font-bold mb-3">PLAYER 2 ID</div>
          <div className="grid grid-cols-5 gap-3">
            {(match?.player2Id || 'P___').split('').map((char, idx) => (
              <div key={idx} className="border-4 border-black p-4 text-center">
                <div className="text-6xl font-black">{char}</div>
              </div>
            ))}
          </div>
          {match?.player2Name && (
            <div className="text-lg mt-3 text-gray-600">{match.player2Name}</div>
          )}
        </div>

        {/* Scores Section */}
        <div className="border-4 border-black p-6 mb-8">
          <div className="text-2xl font-black mb-6 text-center">SCORES</div>

          {/* Set 1 */}
          <div className="mb-6">
            <div className="text-xl font-bold mb-3">SET 1</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 1</div>
                <div className="text-7xl font-black">__</div>
              </div>
              <div className="flex items-center justify-center text-4xl font-black">-</div>
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 2</div>
                <div className="text-7xl font-black">__</div>
              </div>
            </div>
          </div>

          {/* Set 2 */}
          <div className="mb-6">
            <div className="text-xl font-bold mb-3">SET 2</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 1</div>
                <div className="text-7xl font-black">__</div>
              </div>
              <div className="flex items-center justify-center text-4xl font-black">-</div>
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 2</div>
                <div className="text-7xl font-black">__</div>
              </div>
            </div>
          </div>

          {/* Set 3 */}
          <div>
            <div className="text-xl font-bold mb-3">SET 3 (IF REQUIRED)</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 1</div>
                <div className="text-7xl font-black">__</div>
              </div>
              <div className="flex items-center justify-center text-4xl font-black">-</div>
              <div className="border-4 border-black p-6 text-center">
                <div className="text-sm mb-2">PLAYER 2</div>
                <div className="text-7xl font-black">__</div>
              </div>
            </div>
          </div>
        </div>

        {/* Winner */}
        <div className="border-4 border-black p-6">
          <div className="text-2xl font-black mb-4">WINNER</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-4 border-black p-6 text-center">
              <div className="text-xl font-bold mb-3">☐ PLAYER 1</div>
              <div className="text-3xl font-black">{match?.player1Id || 'P___'}</div>
            </div>
            <div className="border-4 border-black p-6 text-center">
              <div className="text-xl font-bold mb-3">☐ PLAYER 2</div>
              <div className="text-3xl font-black">{match?.player2Id || 'P___'}</div>
            </div>
          </div>
        </div>

        {/* Footer Instructions */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>• Fill in scores using CLEAR NUMBERS</p>
          <p>• Check the winner box</p>
          <p>• Take a photo and upload for automatic processing</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .scorecard {
            page-break-after: always;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default BadmintonScorecard
