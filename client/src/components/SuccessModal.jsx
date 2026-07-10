import React from 'react'

const SuccessModal = ({ isOpen, onClose, title, message, details = [] }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-modal-in" style={{
          background: 'rgba(10, 22, 40, 0.95)',
          border: '1px solid rgba(79, 255, 176, 0.3)'
        }}>
          {/* Success Animation */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-success-bounce" style={{
              background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.2), rgba(0, 212, 255, 0.2))',
              border: '2px solid rgba(79, 255, 176, 0.5)'
            }}>
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="#4fffb0" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-3" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              color: '#4fffb0',
              letterSpacing: '-0.02em'
            }}>
              {title}
            </h3>

            {/* Message */}
            <p className="leading-relaxed mb-4" style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.95rem'
            }}>
              {message}
            </p>

            {/* Details */}
            {details.length > 0 && (
              <div className="rounded-xl p-4 text-left space-y-2" style={{
                background: 'rgba(79, 255, 176, 0.1)',
                border: '1px solid rgba(79, 255, 176, 0.3)'
              }}>
                {details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#4fffb0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))',
                color: '#060d1f',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(79, 255, 176, 1), rgba(16, 185, 129, 1))'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes success-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
        .animate-success-bounce {
          animation: success-bounce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default SuccessModal
