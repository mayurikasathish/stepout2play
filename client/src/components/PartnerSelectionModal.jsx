import { useState } from 'react'
import api from '../services/api'

const PartnerSelectionModal = ({ isOpen, onClose, eventId, eventName, eventFormat, onConfirm }) => {
  const [step, setStep] = useState(1) // 1: search, 2: verification result
  const [email, setEmail] = useState('')
  const [teamName, setTeamName] = useState('')
  const [checkingTeamName, setCheckingTeamName] = useState(false)
  const [teamNameAvailable, setTeamNameAvailable] = useState(null)
  const [teamNameError, setTeamNameError] = useState('')
  const [searching, setSearching] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [partner, setPartner] = useState(null)
  const [verification, setVerification] = useState(null)

  if (!isOpen) return null

  const resetModal = () => {
    setStep(1)
    setEmail('')
    setTeamName('')
    setCheckingTeamName(false)
    setTeamNameAvailable(null)
    setTeamNameError('')
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

  const handleCheckTeamName = async () => {
    if (!teamName.trim()) {
      setTeamNameError('Please enter a team name')
      return
    }

    if (teamName.trim().length < 3) {
      setTeamNameError('Team name must be at least 3 characters')
      return
    }

    setCheckingTeamName(true)
    setTeamNameError('')

    try {
      const response = await api.post(`/events/${eventId}/check-team-name`, {
        teamName: teamName.trim()
      })

      if (response.data.available) {
        setTeamNameAvailable(true)
        setTeamNameError('')
      } else {
        setTeamNameAvailable(false)
        setTeamNameError('This team name is already taken for this event')
      }
    } catch (err) {
      console.error('Team name check error:', err)
      setTeamNameError(err.response?.data?.error || 'Failed to check team name availability')
    } finally {
      setCheckingTeamName(false)
    }
  }

  const handleSearchPartner = async (e) => {
    e.preventDefault()

    if (!teamName.trim()) {
      setError('Please enter a team name')
      return
    }

    if (!teamNameAvailable) {
      setError('Please check team name availability first')
      return
    }

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
    if (verification && verification.eligible && teamNameAvailable) {
      onConfirm(partner.id, partner, teamName.trim())
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
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative rounded-2xl shadow-2xl w-full max-w-lg" style={{
          background: 'rgba(10, 22, 40, 0.95)',
          border: '1px solid rgba(79, 255, 176, 0.3)'
        }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              onMouseEnter={(e) => e.target.style.color = '#4fffb0'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold" style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              color: '#4fffb0',
              letterSpacing: '-0.02em'
            }}>{getFormatLabel()} Registration</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>{eventName}</p>
          </div>

          <div className="px-8 py-6">
            {step === 1 ? (
              // Step 1: Team name and partner search
              <div>
                <div className="mb-6 p-4 rounded-xl" style={{
                  background: 'rgba(79, 255, 176, 0.1)',
                  border: '1px solid rgba(79, 255, 176, 0.3)'
                }}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#4fffb0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4fffb0' }}>You are eligible for this event! ✓</p>
                      <p className="text-sm" style={{ color: 'rgba(79, 255, 176, 0.9)' }}>
                        {eventFormat === 'MIXED_DOUBLES'
                          ? 'Choose a team name and enter your partner\'s email. For Mixed Doubles, you need one male and one female player.'
                          : 'Choose a team name and enter your partner\'s email. Your partner will also be verified for eligibility.'}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSearchPartner} className="space-y-5">
                  {/* Team Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Team Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => {
                          setTeamName(e.target.value)
                          setTeamNameAvailable(null)
                          setTeamNameError('')
                        }}
                        placeholder="Enter your team name"
                        className="flex-1 px-4 py-3 rounded-xl outline-none transition-all"
                        style={{
                          background: 'rgba(10, 22, 40, 0.6)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        disabled={searching || verifying}
                      />
                      <button
                        type="button"
                        onClick={handleCheckTeamName}
                        disabled={checkingTeamName || !teamName.trim() || searching || verifying}
                        className="px-4 py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
                        style={{
                          background: 'rgba(79, 255, 176, 0.1)',
                          color: '#4fffb0',
                          border: '1px solid rgba(79, 255, 176, 0.3)',
                          fontFamily: "'Barlow Condensed', sans-serif",
                          textTransform: 'uppercase',
                          fontSize: '0.875rem',
                          letterSpacing: '0.05em',
                          minWidth: '80px'
                        }}
                      >
                        {checkingTeamName ? '...' : 'Check'}
                      </button>
                    </div>
                    {teamNameAvailable === true && (
                      <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#4fffb0' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Team name is available!
                      </p>
                    )}
                    {teamNameError && (
                      <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{teamNameError}</p>
                    )}
                  </div>

                  {/* Partner Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Partner's Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="partner@example.com"
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        background: 'rgba(10, 22, 40, 0.6)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      disabled={searching || verifying}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                      disabled={searching || verifying}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={searching || verifying || !email.trim() || !teamNameAvailable}
                      className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))',
                        color: '#060d1f',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
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
                    {/* Team Name Display */}
                    <div className="mb-4 p-3 rounded-xl" style={{
                      background: 'rgba(79, 255, 176, 0.1)',
                      border: '1px solid rgba(79, 255, 176, 0.3)'
                    }}>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Team Name</p>
                      <p className="font-bold" style={{
                        color: '#4fffb0',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '1.125rem',
                        letterSpacing: '-0.02em'
                      }}>{teamName}</p>
                    </div>

                    {/* Partner Info Card */}
                    <div className="mb-6 p-4 rounded-xl" style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                          background: 'rgba(79, 255, 176, 0.2)',
                          border: '1px solid rgba(79, 255, 176, 0.4)'
                        }}>
                          {verification.partner.profilePicture ? (
                            <img
                              src={verification.partner.profilePicture}
                              alt={verification.partner.firstName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-lg" style={{ color: '#4fffb0' }}>
                              {verification.partner.firstName[0]}{verification.partner.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: '#fff' }}>
                            {verification.partner.firstName} {verification.partner.lastName}
                          </h3>
                          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{verification.partner.email}</p>
                          {verification.partner.age && (
                            <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Age: {verification.partner.age} years
                              {verification.partner.gender && ` • ${verification.partner.gender}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Result */}
                    {verification.eligible ? (
                      <div className="mb-6 p-4 rounded-xl" style={{
                        background: 'rgba(79, 255, 176, 0.1)',
                        border: '1px solid rgba(79, 255, 176, 0.3)'
                      }}>
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#4fffb0">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold mb-1" style={{ color: '#4fffb0' }}>Both Players Eligible</h4>
                            <p className="text-sm" style={{ color: 'rgba(79, 255, 176, 0.9)' }}>
                              You and {verification.partner.firstName} meet all requirements for this event.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 rounded-xl" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold mb-2" style={{ color: '#ef4444' }}>Not Eligible</h4>
                            <ul className="text-sm space-y-1" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>
                              {verification.reasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
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
                        className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          fontFamily: "'Barlow Condensed', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Try Different Partner
                      </button>
                      {verification.eligible && (
                        <button
                          onClick={handleConfirm}
                          className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9))',
                            color: '#060d1f',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          Confirm & Register
                        </button>
                      )}
                    </div>

                    {!verification.eligible && (
                      <button
                        onClick={handleClose}
                        className="w-full mt-3 px-4 py-3 font-medium transition-all"
                        style={{ color: 'rgba(255, 255, 255, 0.6)' }}
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
