import { useState } from 'react'
import api from '../services/api'

const CalendarIcon = (p) => (<svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>)
const ClockIcon = (p) => (<svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)
const AlertIcon = (p) => (<svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>)
const CheckIcon = (p) => (<svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)
const XIcon = (p) => (<svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>)

// ── Shared modal shell ────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    {/* backdrop with blur */}
    <div
      className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    />
    {/* card */}
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden">
      {children}
    </div>
  </div>
)

const AutoScheduleButton = ({ eventId, onScheduled }) => {
  const [scheduling, setScheduling] = useState(false)
  const [errorDetails, setErrorDetails] = useState(null)
  const [successDetails, setSuccessDetails] = useState(null)

  const handleAutoSchedule = async () => {
    setScheduling(true)
    setErrorDetails(null)
    setSuccessDetails(null)
    try {
      const res = await api.post(`/events/${eventId}/auto-schedule`, {})
      if (res.data.success) {
        setSuccessDetails(res.data.summary)
        onScheduled && onScheduled(res.data)
      }
    } catch (err) {
      const data = err.response?.data
      // Surface the real error — could be missing config, no matches, etc.
      setErrorDetails(data || {
        error: err.message || 'Scheduling failed',
        canFit: 0,
        total: 0,
        suggestion: 'Make sure tournament scheduling config is saved first (courts, times, first match date).'
      })
    } finally {
      setScheduling(false)
    }
  }

  return (
    <>
      <button
        onClick={handleAutoSchedule}
        disabled={scheduling}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
      >
        <CalendarIcon className="w-5 h-5" />
        {scheduling ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scheduling...
          </span>
        ) : 'Auto-Schedule Matches'}
      </button>

      {/* ── Error Modal ── */}
      {errorDetails && (
        <Modal onClose={() => setErrorDetails(null)}>
          {/* top accent bar */}
          <div className="h-1.5 w-full bg-red-500" />
          <div className="p-7">
            {/* close */}
            <button
              onClick={() => setErrorDetails(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Scheduling Failed</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {errorDetails.error || 'Could not schedule all matches'}
                </p>
              </div>
            </div>

            {/* progress — only shown when we have canFit/total */}
            {errorDetails.total > 0 && (
              <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Matches scheduled</span>
                  <span className="text-sm font-bold text-gray-900">
                    {errorDetails.canFit} / {errorDetails.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(2, (errorDetails.canFit / errorDetails.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* suggestion */}
            {errorDetails.suggestion && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">What to do</p>
                <p className="text-sm text-amber-700">{errorDetails.suggestion}</p>
              </div>
            )}

            {/* hint about config */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Open the <em>Schedule Config</em> tab, save your settings
                (courts, daily times, first match date), then try again.
              </p>
            </div>

            <button
  onClick={() => setErrorDetails(null)}
  className="w-full px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all"
>
  Got it
</button>
          </div>
        </Modal>
      )}

      {/* ── Success Modal ── */}
      {successDetails && (
        <Modal onClose={() => setSuccessDetails(null)}>
          {/* top accent bar */}
          <div className="h-1.5 w-full bg-green-500" />
          <div className="p-7">
            <button
              onClick={() => setSuccessDetails(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Schedule Complete</h3>
                <p className="text-sm text-gray-500 mt-0.5">All matches have been scheduled</p>
              </div>
            </div>

            {/* stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: CalendarIcon, label: 'Matches', value: successDetails.scheduledMatches },
                { icon: ClockIcon, label: 'Days used', value: successDetails.daysUsed },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <Icon className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* date range */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 space-y-2">
              {[
                ['First match', successDetails.firstMatchDate],
                ['Last match', successDetails.lastMatchDate],
              ].map(([label, iso]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSuccessDetails(null)}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all"
            >
              View Schedule
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default AutoScheduleButton
