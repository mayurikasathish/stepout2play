import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

const AcceptSpotPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [event, setEvent] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${eventId}/accept-spot` } })
      return
    }

    fetchEventDetails()
  }, [eventId, user])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${eventId}`)
      if (response.data.success) {
        setEvent(response.data.event)
      }
    } catch (err) {
      console.error('Error fetching event:', err)
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)
    setError('')

    try {
      const response = await api.post(`/events/${eventId}/accept-spot`)

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/matches')
        }, 3000)
      }
    } catch (err) {
      console.error('Error accepting spot:', err)
      const errorMsg = err.response?.data?.error || 'Failed to accept spot'

      if (errorMsg.includes('already full')) {
        setError('⚠️ Sorry, someone else accepted the spot first! The event is now full.')
      } else if (errorMsg.includes('not on the standby list')) {
        setError('⚠️ You are not on the standby list for this event.')
      } else {
        setError(errorMsg)
      }
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Congratulations!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              You've been successfully promoted from the waitlist!
            </p>
            {event && (
              <div className="bg-success-50 border border-success-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">You're now confirmed for:</p>
                <p className="text-xl font-bold text-gray-900">{event.name}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to My Matches...
            </p>
            <button
              onClick={() => navigate('/matches')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              View My Matches
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card rounded-2xl p-8">
          {error ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Unable to Accept Spot
              </h1>
              <p className="text-lg text-gray-600 mb-8">{error}</p>
              <button
                onClick={() => navigate('/browse')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Browse Other Tournaments
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  A Spot Has Opened Up!
                </h1>
                <p className="text-lg text-gray-600">
                  A confirmed player has withdrawn, and you're eligible to take their place.
                </p>
              </div>

              {event && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Event:</p>
                  <p className="text-xl font-bold text-gray-900 mb-4">{event.name}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span>{event.format || 'Singles'}</span>
                    {event.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{event.category}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">⏰ Time Sensitive</p>
                    <p className="text-sm text-red-700">
                      All standby players have been notified. The first person to accept gets the spot!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {accepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Accepting...
                  </span>
                ) : (
                  '✓ Accept Spot Now'
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                If you're no longer interested, simply close this page. No action needed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcceptSpotPage
