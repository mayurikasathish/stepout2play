import { useState } from 'react'
import api from '../services/api'
import Toast from './Toast'

const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const CancelRegistrationModal = ({ registration, onClose, onCancelled }) => {
  const [cancelling, setCancelling] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')

  const handleCancel = async () => {
    setCancelling(true)

    try {
      // Use withdrawal endpoint instead of delete
      const response = await api.post(`/registrations/${registration.id}/withdraw`, {
        reason: withdrawalReason || null
      })

      if (response.data.success) {
        setToastMessage(response.data.message || 'Withdrawal successful. The organizer has been notified.')
        setToastType('success')
        setShowToast(true)
        setTimeout(() => {
          onCancelled && onCancelled()
          onClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Error withdrawing:', err)

      // Check if it's a specific error
      if (err.response?.status === 400 && err.response?.data?.error?.includes('after event has started')) {
        setDeadlinePassed(true)
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to withdraw from event'
        setToastMessage(errorMessage)
        setToastType('error')
        setShowToast(true)
      }
    } finally {
      setCancelling(false)
    }
  }

  if (deadlinePassed) {
    return (
      <>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
          <div className="relative rounded-2xl w-full max-w-md p-8" style={{
            background: 'rgba(10, 22, 40, 0.95)',
            border: '1px solid rgba(255, 165, 0, 0.4)'
          }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 68, 68, 0.2))',
                border: '2px solid rgba(255, 165, 0, 0.5)'
              }}>
                <AlertIcon style={{ color: '#ffa500' }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                color: '#ffa500',
                letterSpacing: '-0.02em'
              }}>Cannot Withdraw</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
                The event has already started. You can no longer withdraw online.
              </p>
            </div>

            <div className="p-4 rounded-xl mb-6" style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)'
            }}>
              <p className="text-sm" style={{ color: 'rgba(0, 212, 255, 0.9)' }}>
                <strong>Need to withdraw?</strong><br/>
                Please contact the tournament organizer directly for assistance with cancellation.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 font-semibold rounded-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))',
                color: '#060d1f',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Got it
            </button>
          </div>
        </div>

        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        <div className="relative rounded-2xl w-full max-w-md p-8" style={{
          background: 'rgba(10, 22, 40, 0.95)',
          border: '1px solid rgba(236, 72, 153, 0.4)'
        }}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.2))',
              border: '2px solid rgba(236, 72, 153, 0.5)'
            }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              color: '#ec4899',
              letterSpacing: '-0.02em'
            }}>Withdraw from Event?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
              Are you sure you want to withdraw from <strong style={{ color: '#fff' }}>{registration.event.name}</strong>?
            </p>
          </div>

          <div className="p-4 rounded-xl mb-4" style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <p className="text-sm" style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
              The tournament organizer will be notified of your withdrawal.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-left" style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Reason (optional)
            </label>
            <textarea
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="e.g., Injury, Schedule conflict..."
              className="w-full px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                background: 'rgba(10, 22, 40, 0.6)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Keep Registration
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-6 py-3 font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(219, 39, 119, 0.9))',
                color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {cancelling ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Withdrawing...
                </>
              ) : (
                'Yes, Withdraw'
              )}
            </button>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}

export default CancelRegistrationModal
