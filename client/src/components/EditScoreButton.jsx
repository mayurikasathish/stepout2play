import { useState } from 'react'
import { createPortal } from 'react-dom'

const EditScoreButton = ({ onManualEntry, onCaptureScore }) => {
  const [showModal, setShowModal] = useState(false)

  const handleManualEntry = () => {
    setShowModal(false)
    onManualEntry()
  }

  const handleCaptureScore = () => {
    setShowModal(false)
    onCaptureScore?.()
  }

  const modal = showModal
    ? createPortal(
        // Backdrop — stopPropagation here so clicks don't reach ANY card underneath
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setShowModal(false) }}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Edit Score</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Manual Entry */}
              <button
                onClick={handleManualEntry}
                className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Manual Entry</p>
                    <p className="text-xs text-gray-500">Enter score manually</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Capture Score */}
              <button
                onClick={handleCaptureScore}
                className="w-full p-4 border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Capture Score</p>
                    <p className="text-xs text-gray-500">Upload scorecard image</p>
                  </div>
                  <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">OCR</span>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
      >
        Edit Score
      </button>
      {modal}
    </>
  )
}

export default EditScoreButton
