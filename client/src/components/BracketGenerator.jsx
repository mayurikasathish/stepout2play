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
    value: 'AUTOMATIC',
    label: 'Automatic (By Rating) 🎯',
    description: 'Players seeded by their Glicko-2 rating. Highest rating = Seed #1. Most fair!',
    warning: null,
    requiresRating: true
  },
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
  const [showSeedPreview, setShowSeedPreview] = useState(false)
  const [generatedSeeds, setGeneratedSeeds] = useState(null)
  const [loadingSeeds, setLoadingSeeds] = useState(false)

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

  const handleGenerateSeeds = async () => {
    setLoadingSeeds(true)
    setError('')
    try {
      const response = await api.get(`/events/${eventId}/generate-seeds`)
      if (response.data.success) {
        setGeneratedSeeds(response.data)
        setShowSeedPreview(true)
      }
    } catch (err) {
      console.error('Error generating seeds:', err)
      const errorMsg = err.response?.data?.error || 'Failed to generate seeds'
      setError(errorMsg)
    } finally {
      setLoadingSeeds(false)
    }
  }

  const handleApplySeeds = async () => {
    if (!generatedSeeds) return

    setGenerating(true)
    try {
      // Apply seeds
      const seeds = generatedSeeds.seeds.map(s => ({
        registrationId: s.registrationId,
        seedNumber: s.suggestedSeedNumber
      }))

      await api.post(`/events/${eventId}/apply-seeds`, { seeds })

      // Close modal and generate bracket
      setShowSeedPreview(false)
      handleGenerateWithAppliedSeeds()
    } catch (err) {
      console.error('Error applying seeds:', err)
      setError(err.response?.data?.error || 'Failed to apply seeds')
      setGenerating(false)
    }
  }

  const handleGenerateWithAppliedSeeds = async () => {
    try {
      const payload = { bracketFormat, seedingMethod: 'MANUAL' } // Use manual since we just set seed numbers
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
      setError(err.response?.data?.error || 'Failed to generate bracket')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (registrationCount < 2) {
      setError(`At least 2 ${entityLabelPlural} required to generate bracket`)
      return
    }

    // If automatic seeding, generate and show preview first
    if (seedingMethod === 'AUTOMATIC') {
      handleGenerateSeeds()
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
    <>
      <style>{`
        .bracket-generator * {
          font-family: 'Barlow', sans-serif !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .bracket-generator .stats-card *,
        .bracket-generator .light-blue-section *,
        .bracket-generator .light-blue-section label,
        .bracket-generator .light-blue-section span,
        .bracket-generator .light-blue-section p,
        .bracket-generator .light-blue-section h3 {
          color: #000 !important;
        }
        .bracket-generator h2, .bracket-generator label, .bracket-generator .font-semibold, .bracket-generator .font-bold {
          font-family: 'Barlow Condensed', sans-serif !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          color: #fff !important;
        }
        .bracket-generator .text-gray-900, .bracket-generator .text-gray-800 {
          color: #fff !important;
        }
        .bracket-generator .text-gray-600, .bracket-generator .text-gray-700 {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .bracket-generator .bg-primary-50, .bracket-generator .bg-primary-100 {
          background: rgba(0, 212, 255, 0.1) !important;
        }
        .bracket-generator .border-primary-500, .bracket-generator .border-primary-600 {
          border-color: #00d4ff !important;
        }
        .bracket-generator .text-primary-600 {
          color: #00d4ff !important;
        }
        .bracket-generator .bg-primary-600 {
          background: #00d4ff !important;
          color: #000 !important;
        }
        .bracket-generator button {
          font-family: 'Barlow Condensed', sans-serif !important;
          text-transform: uppercase !important;
        }
        .bracket-generator button[style*="background: rgb(0, 212, 255)"],
        .bracket-generator button[style*="background: #00d4ff"] {
          color: #000 !important;
        }
        .bracket-generator button[style*="background: rgb(0, 212, 255)"] *,
        .bracket-generator button[style*="background: #00d4ff"] * {
          color: #000 !important;
        }
        .bracket-generator .bg-white {
          background: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .bracket-generator .border-gray-200, .bracket-generator .border-gray-300 {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
      <div className="bracket-generator glass-card" style={{
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
      {/* Stats */}
      <div className="mb-8 p-6 stats-card" style={{
        background: '#fda4c8',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p style={{ fontSize: '0.875rem', color: '#000', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Event</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>{eventName}</p>
            <p style={{ fontSize: '0.875rem', color: '#000', textTransform: 'uppercase' }}>{eventFormat}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#000', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>{isTeamEvent ? 'Teams' : 'Participants'}</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>{registrationCount}</p>
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
              <div
                key={fmt.value}
                onClick={() => handleFormatChange(fmt.value)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: bracketFormat === fmt.value ? '3px solid #4fffb0' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: bracketFormat === fmt.value ? 'rgba(79, 255, 176, 0.1)' : 'transparent',
                  boxShadow: bracketFormat === fmt.value ? '0 0 20px rgba(79, 255, 176, 0.3)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{fmt.icon}</span>
                    <span className="font-semibold text-gray-900">{fmt.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{fmt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 2A: Group Size (Round Robin only) ── */}
        {isRoundRobin && (
          <div className="p-8 rounded-xl" style={{
            background: 'rgba(10, 22, 40, 0.6)',
            border: '2px solid rgba(79, 255, 176, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <label className="block mb-4" style={{
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase',
              fontSize: '1.25rem',
              fontWeight: '700'
            }}>
              Participants per Group
            </label>
            <div className="flex items-center gap-6 mb-4">
              <input
                type="number"
                min="2"
                max="16"
                value={groupSize}
                onChange={(e) => setGroupSize(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                style={{
                  width: '8rem',
                  padding: '1.5rem 2rem',
                  background: 'rgba(6, 13, 31, 0.8)',
                  border: '3px solid #4fffb0',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '4rem',
                  textAlign: 'center',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 30px rgba(79, 255, 176, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none'
                }}
              />
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.5rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>per group</span>
            </div>
            <p className="text-sm" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1rem'
            }}>
              With <strong style={{ color: '#4fffb0' }}>{registrationCount}</strong> {entityLabelPlural} and groups of <strong style={{ color: '#4fffb0' }}>{groupSize}</strong>:{' '}
              <strong style={{ color: '#4fffb0' }}>{estimatedGroups} group{estimatedGroups !== 1 ? 's' : ''}</strong> will be created.
            </p>
          </div>
        )}

        {/* ── Step 2B: Hybrid Configuration (League-cum-Knockout only) ── */}
        {isHybrid && (
          <div className="p-8 rounded-xl space-y-8" style={{
            background: 'rgba(10, 22, 40, 0.6)',
            border: '2px solid rgba(79, 255, 176, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              <h3 className="mb-2" style={{
                color: '#4fffb0',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                fontSize: '1.75rem',
                fontWeight: '900',
                letterSpacing: '-0.02em'
              }}>League-cum-Knockout Configuration</h3>
              <p className="text-sm" style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem'
              }}>
                Group stage winners advance to single-elimination knockout rounds
              </p>
            </div>

            {/* Number of Groups */}
            <div>
              <label className="block mb-4" style={{
                color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                Number of Groups
              </label>
              <div className="flex items-center gap-6">
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                  style={{
                    width: '8rem',
                    padding: '1.5rem 2rem',
                    background: 'rgba(6, 13, 31, 0.8)',
                    border: '3px solid #4fffb0',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '4rem',
                    textAlign: 'center',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 30px rgba(79, 255, 176, 0.5)'
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>groups</span>
              </div>
            </div>

            {/* Qualifiers per Group */}
            <div>
              <label className="block mb-4" style={{
                color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: 'uppercase',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                Qualifiers per Group
              </label>
              <div className="flex items-center gap-6">
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={advanceCount}
                  onChange={(e) => setAdvanceCount(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                  style={{
                    width: '8rem',
                    padding: '1.5rem 2rem',
                    background: 'rgba(6, 13, 31, 0.8)',
                    border: '3px solid #4fffb0',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '4rem',
                    textAlign: 'center',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 30px rgba(79, 255, 176, 0.5)'
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>advance from each group</span>
              </div>
            </div>

            {/* Bronze Match Toggle */}
            <div>
              <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl" style={{
                background: 'rgba(6, 13, 31, 0.6)',
                border: hasBronzeMatch ? '2px solid #4fffb0' : '2px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s'
              }}>
                <input
                  type="checkbox"
                  checked={hasBronzeMatch}
                  onChange={(e) => setHasBronzeMatch(e.target.checked)}
                  className="w-6 h-6 accent-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="font-semibold" style={{
                    color: hasBronzeMatch ? '#4fffb0' : '#fff',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    textTransform: 'uppercase',
                    fontSize: '1.125rem',
                    fontWeight: '700'
                  }}>Include Bronze Match (3rd Place)</span>
                  <p className="text-sm" style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: "'Barlow Condensed', sans-serif"
                  }}>
                    Losing semifinalists play for 3rd place
                  </p>
                </div>
              </label>
            </div>

            {knockoutParticipants && !Number.isInteger(Math.log2(knockoutParticipants)) && (
              <p style={{
                color: '#ff6b6b',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '1rem',
                padding: '1rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '2px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                marginTop: '1.5rem'
              }}>
                ⚠️ Knockout size must be power of 2 (4, 8, 16, 32...). Current: {knockoutParticipants}
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Seeding Method ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Seeding Method *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSeedingMethods.map((method) => (
              <div
                key={method.value}
                onClick={() => setSeedingMethod(method.value)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: seedingMethod === method.value ? '3px solid #4fffb0' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: seedingMethod === method.value ? 'rgba(79, 255, 176, 0.1)' : 'transparent',
                  boxShadow: seedingMethod === method.value ? '0 0 20px rgba(79, 255, 176, 0.3)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || registrationCount < 2}
        style={{
          width: '100%',
          padding: '1rem 2rem',
          background: '#00d4ff',
          color: '#000',
          fontWeight: '700',
          borderRadius: '12px',
          fontSize: '1.125rem',
          boxShadow: '0 10px 25px rgba(0, 212, 255, 0.3)',
          transition: 'all 0.3s',
          border: 'none',
          cursor: generating || registrationCount < 2 ? 'not-allowed' : 'pointer',
          opacity: generating || registrationCount < 2 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
        onMouseEnter={(e) => {
          if (!generating && registrationCount >= 2) {
            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.8)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 212, 255, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00d4ff';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 212, 255, 0.3)';
        }}
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

      {/* Seed Preview Modal */}
      {showSeedPreview && generatedSeeds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                🎯 Automatic Seeding Preview
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Players sorted by rating (highest → lowest). Review and apply seeds.
              </p>
            </div>

            {/* Seed List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {generatedSeeds.seeds.map((seed, index) => (
                  <div
                    key={seed.registrationId}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        #{seed.suggestedSeedNumber}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{seed.playerName}</div>
                        <div className="text-sm text-gray-600">Rating: {seed.rating}</div>
                      </div>
                    </div>
                    {seed.currentSeedNumber && (
                      <div className="text-xs text-gray-500">
                        Current: #{seed.currentSeedNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowSeedPreview(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleApplySeeds}
                disabled={generating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Applying & Generating...' : 'Apply Seeds & Generate Bracket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default BracketGenerator
