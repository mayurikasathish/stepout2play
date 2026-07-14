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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))',
              border: '1px solid rgba(79, 255, 176, 0.3)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '28rem',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="edit-score-modal-header" style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Edit Score</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.25rem',
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
                <svg className="w-5 h-5" style={{ color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Manual Entry */}
              <button
                onClick={handleManualEntry}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(79, 255, 176, 0.1)',
                  border: '2px solid rgba(79, 255, 176, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.15)';
                  e.currentTarget.style.borderColor = '#4fffb0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 255, 176, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(79, 255, 176, 0.3)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(79, 255, 176, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', color: '#fff', fontSize: '0.875rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Manual Entry</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Enter score manually</p>
                  </div>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#4fffb0', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Capture Score */}
              <button
                onClick={handleCaptureScore}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '2px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.15)';
                  e.currentTarget.style.borderColor = '#00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(0, 212, 255, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: '#00d4ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', color: '#fff', fontSize: '0.875rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Capture Score</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Upload scorecard image</p>
                  </div>
                  <span style={{ fontSize: '0.625rem', background: '#00d4ff', color: '#000', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontWeight: '700', flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>OCR</span>
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
      <style>{`
        .edit-score-btn-custom {
          color: #fff !important;
        }
        .edit-score-btn-custom:hover {
          color: #fff !important;
        }
        .edit-score-btn-custom * {
          color: #fff !important;
        }
        .edit-score-modal-header {
          color: #fff !important;
        }
      `}</style>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
        className="edit-score-btn-custom"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          background: '#fff',
          color: '#000',
          fontSize: '0.75rem',
          fontWeight: '700',
          borderRadius: '8px',
          border: '2px solid #000',
          cursor: 'pointer',
          transition: 'all 0.3s',
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: 'uppercase'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f0f0f0';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.color = '#000';
        }}
      >
        <span style={{ color: '#000' }}>Edit Score</span>
      </button>
      {modal}
    </>
  )
}

export default EditScoreButton
