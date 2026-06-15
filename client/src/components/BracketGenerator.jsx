import { useState } from 'react'
import api from '../services/api'

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const BracketGenerator = ({ eventId, eventName, eventFormat, registrationCount, onGenerated }) => {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [bracketFormat, setBracketFormat] = useState('SINGLE_ELIMINATION')
  const [seedingMethod, setSeedingMethod] = useState('RANDOM')

  const handleGenerate = async () => {
    if (registrationCount < 2) {
      setError('At least 2 participants required to generate bracket')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await api.post(`/events/${eventId}/generate-bracket`, {
        bracketFormat,
        seedingMethod
      })

      if (response.data.success) {
        onGenerated && onGenerated(response.data)
      }
    } catch (err) {
      console.error('Error generating bracket:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0] || 'Failed to generate bracket'
      setError(errorMsg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <TrophyIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Generate Tournament Bracket</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Automatically create your tournament bracket from registered participants.
          Choose your bracket format and seeding method below.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-200">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Event</p>
            <p className="text-lg font-semibold text-gray-900">{eventName}</p>
            <p className="text-sm text-gray-600">{eventFormat}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Participants</p>
            <p className="text-3xl font-bold text-primary-600">{registrationCount}</p>
            <p className="text-sm text-gray-600">
              {registrationCount === 1 ? 'participant' : 'participants'} registered
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-6 mb-8">
        {/* Bracket Format */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Bracket Format *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-start p-6 cursor-pointer rounded-xl border-2 transition-all ${
              bracketFormat === 'SINGLE_ELIMINATION'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}>
              <input
                type="radio"
                name="bracketFormat"
                value="SINGLE_ELIMINATION"
                checked={bracketFormat === 'SINGLE_ELIMINATION'}
                onChange={(e) => setBracketFormat(e.target.value)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">Single Elimination (Knockout)</div>
                <p className="text-sm text-gray-600">
                  Traditional bracket. Lose once, you're out. Fast and exciting. Best for limited time or space.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Example: 8 players → 7 matches (QF, SF, F)
                </p>
              </div>
            </label>

            <label className={`relative flex items-start p-6 cursor-pointer rounded-xl border-2 transition-all ${
              bracketFormat === 'ROUND_ROBIN'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}>
              <input
                type="radio"
                name="bracketFormat"
                value="ROUND_ROBIN"
                checked={bracketFormat === 'ROUND_ROBIN'}
                onChange={(e) => setBracketFormat(e.target.value)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">Round Robin</div>
                <p className="text-sm text-gray-600">
                  Everyone plays everyone. Fair ranking. More matches. Best for league play or small groups.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Example: 8 players → 28 matches total
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Seeding Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Seeding Method *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-start p-6 cursor-pointer rounded-xl border-2 transition-all ${
              seedingMethod === 'RANDOM'
                ? 'border-success-500 bg-success-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}>
              <input
                type="radio"
                name="seedingMethod"
                value="RANDOM"
                checked={seedingMethod === 'RANDOM'}
                onChange={(e) => setSeedingMethod(e.target.value)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">Random Draw</div>
                <p className="text-sm text-gray-600">
                  Fair random shuffle. No bias. Great for first-time tournaments or when skills are unknown.
                </p>
              </div>
            </label>

            <label className={`relative flex items-start p-6 cursor-pointer rounded-xl border-2 transition-all ${
              seedingMethod === 'MANUAL'
                ? 'border-success-500 bg-success-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}>
              <input
                type="radio"
                name="seedingMethod"
                value="MANUAL"
                checked={seedingMethod === 'MANUAL'}
                onChange={(e) => setSeedingMethod(e.target.value)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">Manual Seeding</div>
                <p className="text-sm text-gray-600">
                  Use pre-assigned seed numbers. Stronger players seeded apart. Best when you know player skills.
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Note: Requires seed numbers set in registrations
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || registrationCount < 2}
        className="w-full px-8 py-4 bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 text-white font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {generating ? (
          <>
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Bracket...
          </>
        ) : (
          <>
            <TrophyIcon className="w-6 h-6" />
            Generate Bracket
          </>
        )}
      </button>

      {registrationCount < 2 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Need at least 2 participants to generate bracket
        </p>
      )}
    </div>
  )
}

export default BracketGenerator
