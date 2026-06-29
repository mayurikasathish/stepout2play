import React from 'react'

const ErrorModal = ({ isOpen, onClose, title, message, details = [] }) => {
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
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all animate-modal-in">
          {/* Error Icon */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-shake">
              <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

            {/* Conflict Details */}
            {details.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 text-left max-h-96 overflow-y-auto">
                <h4 className="text-sm font-bold text-red-900 mb-3">Conflicts Found:</h4>
                <div className="space-y-3">
                  {details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm bg-white rounded-lg p-3 border border-red-200">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700 flex-1">{detail.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Close
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
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default ErrorModal
