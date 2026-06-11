const AlertIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const UserIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const NotEligibleModal = ({ isOpen, onClose, reasons, userAge, eventCategory, eventGender }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
          {/* Icon Header */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-danger-100 mx-auto flex items-center justify-center mb-4">
              <AlertIcon className="w-10 h-10 text-danger-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Not Eligible
            </h2>
            <p className="text-gray-600 text-sm">
              Unfortunately, you don't meet the requirements for this event
            </p>
          </div>

          {/* Reasons */}
          <div className="px-6 pb-6">
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-4">
              <ul className="space-y-2">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-danger-700">
                    <span className="text-danger-500 mt-0.5 flex-shrink-0">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Event Details */}
            {(eventCategory || eventGender || userAge !== null) && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Event Requirements
                </h3>
                <div className="space-y-2 text-sm">
                  {eventCategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{eventCategory}</span>
                    </div>
                  )}
                  {eventGender && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium text-gray-900">{eventGender}</span>
                    </div>
                  )}
                  {userAge !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Age on Event Date:</span>
                      <span className="font-medium text-gray-900">{userAge} years</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Got it
            </button>

            {/* Help Text */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Need to update your profile?{' '}
              <a href="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
                Go to Profile
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotEligibleModal
