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
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-2xl w-full max-w-md p-8" style={{
        background: 'rgba(10, 22, 40, 0.95)',
        border: '1px solid rgba(79, 255, 176, 0.3)'
      }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
            background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.2), rgba(0, 212, 255, 0.2))',
            border: '1px solid rgba(79, 255, 176, 0.4)'
          }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4fffb0" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            textTransform: 'uppercase',
            color: '#4fffb0',
            letterSpacing: '-0.02em'
          }}>Confirm Registration</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
            Are you sure you want to register for <strong style={{ color: '#fff' }}>{eventName}</strong>?
          </p>
          {eventFormat && (
            <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Format: {getFormatLabel(eventFormat)}
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl mb-6" style={{
          background: 'rgba(79, 255, 176, 0.1)',
          border: '1px solid rgba(79, 255, 176, 0.3)'
        }}>
          <p className="text-sm" style={{ color: 'rgba(79, 255, 176, 0.9)' }}>
            <strong>Note:</strong> Make sure you're available for the tournament dates before confirming.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))',
              color: '#060d1f',
              border: 'none',
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
            Yes, Register
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrationConfirmModal
