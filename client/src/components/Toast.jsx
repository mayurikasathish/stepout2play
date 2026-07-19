import { useEffect } from 'react'

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'success'
    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
    : 'bg-gradient-to-r from-red-500 to-red-600'

  return (
    <div className="fixed right-4 z-[10000] animate-slide-up" style={{ top: '100px' }}>
      <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          {type === 'success' ? <CheckIcon /> : <ErrorIcon />}
        </div>
        <p className="font-semibold text-base">{message}</p>
      </div>
    </div>
  )
}

export default Toast
