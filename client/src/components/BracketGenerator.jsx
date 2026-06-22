import { useState } from 'react'
import api from '../services/api'

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const FORMATS = [
  {
    value: 'SINGLE_ELIMINATION',
    label: 'Knockout',
    icon: '⚡',
    description: 'Lose once, you\'re out. Fast, exciting. Great for large fields.'
  },
  {
    value: 'ROUND_ROBIN',
    label: 'Round Robin (League)',
    icon: '🔄',
    description: 'Everyone plays everyone in their group. More matches, fairer results.'
  },
  {
    value: 'LEAGUE_CUM_KNOCKOUT',
    label: 'League-cum-Knockout',
    icon: '🏆',
    description: 'Group stage followed by knockout rounds. Best of both formats — fair groups, exciting playoffs.'
  }
]

const SEEDING_METHODS = [
  {
    value: 'REGISTRATION_ORDER',
    label: 'Registration Order',
    description: 'First registered = top seed. Simple, fair, encourages early sign-up.',
    warning: null
  },
  {
    value: 'RANDOM',
    label: 'Random',
    description: 'Random shuffle. No bias. Great when skill levels are unknown.',
    warning: null
  },
  {
    value: 'MANUAL',
    label: 'Manual',
    description: 'Use custom seed numbers you set in the Registrations tab.',
    warning: '⚠️ Set seed numbers in Registrations tab first'
  },
  {
    value: 'SNAKE',
    label: 'Snake Seeding',
    description: 'Zigzag distribution across groups — strongest seeds don\'t cluster together.',
    warning: null,
    rrOnly: true  // Only shown for Round Robin
  }
]

const GROUP_SIZE_OPTIONS = [3, 4, 5, 6, 8]

const BracketGenerator = ({ eventId, eventName, eventFormat, registrationCount, onGenerated }) => {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [bracketFormat, setBracketFormat] = useState('SINGLE_ELIMINATION')
  const [seedingMethod, setSeedingMethod] = useState('REGISTRATION_ORDER')
  const [groupSize, setGroupSize] = useState(4)
  const [groupCount, setGroupCount] = useState(4)
  const [advanceCount, setAdvanceCount] = useState(2)
  const [hasBronzeMatch, setHasBronzeMatch] = useState(true)

  const isTeamEvent = eventFormat === 'DOUBLES' || eventFormat === 'MIXED_DOUBLES'
  const entityLabelPlural = isTeamEvent ? 'teams' : 'participants'
  const isRoundRobin = bracketFormat === 'ROUND_ROBIN'
  const isHybrid = bracketFormat === 'LEAGUE_CUM_KNOCKOUT'

  // Calculate estimates
  const estimatedGroups = isRoundRobin ? Math.ceil(registrationCount / groupSize) : null
  const estimatedGroupSize = isHybrid ? Math.ceil(registrationCount / groupCount) : null
  const knockoutParticipants = isHybrid ? groupCount * advanceCount : null

  // Filter seeding methods for current format
  const availableSeedingMethods = SEEDING_METHODS.filter(m => !m.rrOnly || isRoundRobin || isHybrid)

  // Reset seeding method when format changes (snake only valid for RR/Hybrid)
  const handleFormatChange = (fmt) => {
    setBracketFormat(fmt)
    if (fmt === 'SINGLE_ELIMINATION' && seedingMethod === 'SNAKE') {
      setSeedingMethod('REGISTRATION_ORDER')
    }
    // Set sensible defaults for hybrid format
    if (fmt === 'LEAGUE_CUM_KNOCKOUT') {
      const defaultGroups = Math.min(8, Math.max(2, Math.ceil(registrationCount / 4)))
      setGroupCount(defaultGroups)
      setAdvanceCount(2)
      setHasBronzeMatch(true)
    }
  }

  const handleGenerate = async () => {
    if (registrationCount < 2) {
      setError(`At least 2 ${entityLabelPlural} required to generate bracket`)
      return
    }

    // Hybrid format validation
    if (isHybrid) {
      const minParticipants = groupCount * 2 // At least 2 per group
      if (registrationCount < minParticipants) {
        setError(`Need at least ${minParticipants} ${entityLabelPlural} for ${groupCount} groups (minimum 2 per group)`)
        return
      }
      const knockoutSize = groupCount * advanceCount
      if (!Number.isInteger(Math.log2(knockoutSize))) {
        setError(`Knockout participants (${knockoutSize}) must be a power of 2. Try different group count or qualifiers.`)
        return
      }
    }

    setGenerating(true)
    setError('')

    try {
      const payload = { bracketFormat, seedingMethod }
      if (isRoundRobin) {
        payload.groupSize = groupSize
      }
      if (isHybrid) {
        payload.groupCount = groupCount
        payload.advanceCount = advanceCount
        payload.hasBronzeMatch = hasBronzeMatch
      }

      const response = await api.post(`/events/${eventId}/generate-bracket`, payload)
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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <TrophyIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Generate Tournament Bracket</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Automatically create your bracket from registered {entityLabelPlural}. Choose a format and seeding method.
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
            <p className="text-sm text-gray-600 mb-1">{isTeamEvent ? 'Teams' : 'Participants'}</p>
            <p className="text-3xl font-bold text-primary-600">{registrationCount}</p>
            <p className="text-sm text-gray-600">{entityLabelPlural} registered</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-8 mb-8">
        {/* ── Step 1: Tournament Format ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Tournament Format *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORMATS.map((fmt) => (
              <label
                key={fmt.value}
                className={`relative flex items-start p-6 cursor-pointer rounded-xl border-2 transition-all ${
                  bracketFormat === fmt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="bracketFormat"
                  value={fmt.value}
                  checked={bracketFormat === fmt.value}
                  onChange={() => handleFormatChange(fmt.value)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{fmt.icon}</span>
                    <span className="font-semibold text-gray-900">{fmt.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{fmt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Step 2A: Group Size (Round Robin only) ── */}
        {isRoundRobin && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Participants per Group
            </label>
            <div className="flex flex-wrap gap-3 mb-4">
              {GROUP_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => setGroupSize(size)}
                  className={`px-5 py-2 rounded-lg font-semibold border-2 transition-all text-sm ${
                    groupSize === size
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                  }`}
                >
                  {size} per group
                </button>
              ))}
            </div>
            <p className="text-sm text-amber-800">
              With <strong>{registrationCount}</strong> {entityLabelPlural} and groups of <strong>{groupSize}</strong>:{' '}
              <strong>{estimatedGroups} group{estimatedGroups !== 1 ? 's' : ''}</strong> will be created.
            </p>
          </div>
        )}

        {/* ── Step 2B: Hybrid Configuration (League-cum-Knockout only) ── */}
        {isHybrid && (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">League-cum-Knockout Configuration</h3>
                <p className="text-sm text-gray-600">
                  Group stage winners advance to single-elimination knockout rounds
                </p>
              </div>
            </div>

            {/* Number of Groups */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Number of Groups
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                  className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold focus:border-primary-500 focus:outline-none"
                />
                <span className="text-sm text-gray-600">groups</span>
              </div>
            </div>

            {/* Qualifiers per Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Qualifiers per Group
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={advanceCount}
                  onChange={(e) => setAdvanceCount(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                  className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold focus:border-primary-500 focus:outline-none"
                />
                <span className="text-sm text-gray-600">advance from each group</span>
              </div>
            </div>

            {/* Bronze Match Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBronzeMatch}
                  onChange={(e) => setHasBronzeMatch(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="font-semibold text-gray-900">Include Bronze Match (3rd Place)</span>
                  <p className="text-sm text-gray-600">
                    Losing semifinalists play for 3rd place
                  </p>
                </div>
              </label>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-purple-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/70 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Group Stage</p>
                  <p className="font-bold text-gray-900">
                    {groupCount} groups × ~{estimatedGroupSize} {entityLabelPlural}
                  </p>
                </div>
                <div className="bg-white/70 p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Knockout Stage</p>
                  <p className="font-bold text-gray-900">
                    {knockoutParticipants} {entityLabelPlural} advance
                  </p>
                </div>
              </div>
              {knockoutParticipants && !Number.isInteger(Math.log2(knockoutParticipants)) && (
                <p className="text-sm text-orange-700 font-medium mt-3 bg-orange-50 p-2 rounded">
                  ⚠️ Knockout size must be power of 2 (4, 8, 16, 32...). Current: {knockoutParticipants}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Seeding Method ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Seeding Method *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSeedingMethods.map((method) => (
              <label
                key={method.value}
                className={`relative flex items-start p-5 cursor-pointer rounded-xl border-2 transition-all ${
                  seedingMethod === method.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="seedingMethod"
                  value={method.value}
                  checked={seedingMethod === method.value}
                  onChange={(e) => setSeedingMethod(e.target.value)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {method.label}
                    {method.rrOnly && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        Round Robin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {method.warning && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">{method.warning}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
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
            Generate {isHybrid ? 'League-cum-Knockout' : isRoundRobin ? 'Round Robin' : 'Knockout'} Bracket
          </>
        )}
      </button>

      {registrationCount < 2 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Need at least 2 {entityLabelPlural} to generate bracket
        </p>
      )}
    </div>
  )
}

export default BracketGenerator
