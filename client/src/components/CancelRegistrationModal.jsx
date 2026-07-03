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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-8 border-2 border-gray-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Cannot Withdraw</h3>
              <p className="text-gray-600 leading-relaxed">
                The event has already started. You can no longer withdraw online.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <p className="text-sm text-blue-800">
                <strong>Need to withdraw?</strong><br/>
                Please contact the tournament organizer directly for assistance with cancellation.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-md p-8 border-2 border-gray-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Withdraw from Event?</h3>
            <p className="text-gray-600">
              Are you sure you want to withdraw from <strong>{registration.event.name}</strong>?
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <p className="text-sm text-amber-800">
              The tournament organizer will be notified of your withdrawal.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Reason (optional)
            </label>
            <textarea
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="e.g., Injury, Schedule conflict..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              Keep Registration
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
