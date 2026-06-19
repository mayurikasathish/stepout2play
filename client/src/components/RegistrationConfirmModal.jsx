const RegistrationConfirmModal = ({ isOpen, onClose, onConfirm, eventName, eventFormat }) => {
  if (!isOpen) return null

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Registration</h3>
          <p className="text-gray-600">
            Are you sure you want to register for <strong>{eventName}</strong>?
          </p>
          {eventFormat && (
            <p className="text-sm text-gray-500 mt-2">
              Format: {getFormatLabel(eventFormat)}
            </p>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Make sure you're available for the tournament dates before confirming.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            Yes, Register
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrationConfirmModal
