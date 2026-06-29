import React from 'react'

const SuccessModal = ({ isOpen, onClose, title, message, details = [] }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-modal-in">
          {/* Success Animation */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-success-bounce">
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-gray-600 leading-relaxed mb-4">
              {message}
            </p>

            {/* Details */}
            {details.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4 text-left space-y-2">
                {details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
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
