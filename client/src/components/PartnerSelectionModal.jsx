import { useState } from 'react'
import api from '../services/api'

const PartnerSelectionModal = ({ isOpen, onClose, eventId, eventName, eventFormat, onConfirm }) => {
  const [step, setStep] = useState(1) // 1: search, 2: verification result
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [partner, setPartner] = useState(null)
  const [verification, setVerification] = useState(null)

  if (!isOpen) return null

  const resetModal = () => {
    setStep(1)
    setEmail('')
    setSearching(false)
    setVerifying(false)
    setError('')
    setPartner(null)
    setVerification(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSearchPartner = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setSearching(true)
    setError('')

    try {
      // Search for partner
      const searchResponse = await api.post(`/events/${eventId}/search-partner`, {
        email: email.trim()
      })

      if (searchResponse.data.success) {
        const foundPartner = searchResponse.data.partner
        setPartner(foundPartner)

        // Immediately verify partner eligibility
        setVerifying(true)
        const verifyResponse = await api.post(`/events/${eventId}/verify-partner`, {
          partnerId: foundPartner.id
        })

        if (verifyResponse.data.success) {
          setVerification(verifyResponse.data)
          setStep(2)
        }
      }
    } catch (err) {
      console.error('Partner search error:', err)
      const errorMsg = err.response?.data?.error || 'Failed to find partner. Please check the email and try again.'
      setError(errorMsg)
    } finally {
      setSearching(false)
      setVerifying(false)
    }
  }

  const handleConfirm = () => {
    if (verification && verification.eligible) {
      onConfirm(partner.id, partner)
      handleClose()
    }
  }

  const getFormatLabel = () => {
    if (eventFormat === 'MIXED_DOUBLES') return 'Mixed Doubles'
    if (eventFormat === 'DOUBLES') return 'Doubles'
    return 'Doubles'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={handleClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-200">
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{getFormatLabel()} Registration</h2>
            <p className="text-gray-600 mt-1">{eventName}</p>
          </div>

          <div className="px-8 py-6">
            {step === 1 ? (
              // Step 1: Search for partner
              <div>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-900 font-medium mb-1">You are eligible for this event! ✓</p>
                      <p className="text-sm text-blue-800">
                        {eventFormat === 'MIXED_DOUBLES'
                          ? 'Enter your partner\'s email address. For Mixed Doubles, you need one male and one female player.'
                          : 'Enter your partner\'s email address. Your partner will also be verified for eligibility.'}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSearchPartner} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Partner's Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="partner@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                      autoFocus
                      disabled={searching || verifying}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-all"
                      disabled={searching || verifying}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={searching || verifying || !email.trim()}
                      className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {searching || verifying ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {searching ? 'Searching...' : 'Verifying...'}
                        </>
                      ) : 'Find Partner'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Step 2: Verification result
              <div>
                {verification && (
                  <>
                    {/* Partner Info Card */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          {verification.partner.profilePicture ? (
                            <img
                              src={verification.partner.profilePicture}
                              alt={verification.partner.firstName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-600 font-bold text-lg">
                              {verification.partner.firstName[0]}{verification.partner.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {verification.partner.firstName} {verification.partner.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{verification.partner.email}</p>
                          {verification.partner.age && (
                            <p className="text-sm text-gray-600 mt-1">
                              Age: {verification.partner.age} years
                              {verification.partner.gender && ` • ${verification.partner.gender}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Result */}
                    {verification.eligible ? (
                      <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-success-900 mb-1">Both Players Eligible</h4>
                            <p className="text-sm text-success-800">
                              You and {verification.partner.firstName} meet all requirements for this event.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-red-900 mb-2">Not Eligible</h4>
                            <ul className="text-sm text-red-800 space-y-1">
                              {verification.reasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setStep(1); setError('') }}
                        className="flex-1 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-all"
                      >
                        Try Different Partner
                      </button>
                      {verification.eligible && (
                        <button
                          onClick={handleConfirm}
                          className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          Confirm & Register
                        </button>
                      )}
                    </div>

                    {!verification.eligible && (
                      <button
                        onClick={handleClose}
                        className="w-full mt-3 px-4 py-3 text-gray-600 hover:text-gray-900 font-medium transition-all"
                      >
                        Close
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PartnerSelectionModal
