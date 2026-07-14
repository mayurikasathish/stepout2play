import { useState, useEffect } from 'react'
import api from '../services/api'

const SeedingModal = ({ event, registrations, onClose, onSaved }) => {
  const [seeds, setSeeds] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    // Initialize seed numbers from existing registrations
    const initialSeeds = {}
    registrations.forEach((reg, index) => {
      initialSeeds[reg.id] = reg.seedNumber !== null ? reg.seedNumber : index + 1
    })
    setSeeds(initialSeeds)
  }, [registrations])

  const handleSeedChange = (registrationId, value) => {
    const seedNumber = value === '' ? null : parseInt(value, 10)
    setSeeds(prev => ({
      ...prev,
      [registrationId]: seedNumber
    }))
  }

  const handleAutoNumber = () => {
    const autoSeeds = {}
    registrations.forEach((reg, index) => {
      autoSeeds[reg.id] = index + 1
    })
    setSeeds(autoSeeds)
  }

  const validateSeeds = () => {
    const seedValues = Object.values(seeds).filter(s => s !== null)

    // Check for duplicates
    const uniqueSeeds = new Set(seedValues)
    if (uniqueSeeds.size !== seedValues.length) {
      return 'Duplicate seed numbers found. Each seed must be unique.'
    }

    // Check if all registrations have seeds
    if (seedValues.length !== registrations.length) {
      return 'All participants must have a seed number.'
    }

    // Check range
    const maxSeed = Math.max(...seedValues)
    const minSeed = Math.min(...seedValues)
    if (minSeed < 1 || maxSeed > registrations.length) {
      return `Seed numbers must be between 1 and ${registrations.length}.`
    }

    return null
  }

  const handleSave = async () => {
    const validationError = validateSeeds()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      // Update all seed numbers
      const updates = registrations.map(reg => ({
        registrationId: reg.id,
        seedNumber: seeds[reg.id]
      }))

      await api.patch(`/events/${event.id}/seed-numbers`, { seeds: updates })

      onSaved && onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving seed numbers:', err)
      setError(err.response?.data?.error || 'Failed to save seed numbers')
    } finally {
      setSaving(false)
    }
  }

  const getParticipantName = (reg) => {
    const userName = `${reg.user.firstName} ${reg.user.lastName}`
    if (reg.partner) {
      return `${userName} / ${reg.partner.firstName} ${reg.partner.lastName}`
    }
    return userName
  }

  // Sort by current seed number for display
  const sortedRegistrations = [...registrations].sort((a, b) => {
    const seedA = seeds[a.id] !== null ? seeds[a.id] : 999
    const seedB = seeds[b.id] !== null ? seeds[b.id] : 999
    return seedA - seedB
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto" style={{
          background: 'rgba(10, 22, 40, 0.98)',
          border: '1px solid rgba(79, 255, 176, 0.3)'
        }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold mb-2" style={{ color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Manual Seeding</h2>
          <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Assign seed numbers to participants for {event.name}. Lower numbers indicate stronger seeds.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleAutoNumber}
              style={{
                padding: '0.5rem 1rem',
                background: '#4fffb0',
                color: '#000',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(79, 255, 176, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4fffb0'
              }}
            >
              Auto-Number (1, 2, 3...)
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                padding: '0.5rem 1rem',
                background: '#ec4899',
                color: '#000',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ec4899'
              }}
            >
              Clear All
            </button>
          </div>

          {/* Seeding Table */}
          <div className="border rounded-xl overflow-hidden mb-6" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <table className="w-full">
              <thead style={{ background: 'rgba(6, 13, 31, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-24" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Seed #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Participant
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: 'transparent' }}>
                {sortedRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="1"
                        max={registrations.length}
                        value={seeds[reg.id] !== null ? seeds[reg.id] : ''}
                        onChange={(e) => handleSeedChange(reg.id, e.target.value)}
                        placeholder="#"
                        style={{
                          width: '4rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(6, 13, 31, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          outline: 'none',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#fff',
                          fontFamily: "'Barlow Condensed', sans-serif"
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#4fffb0'
                          e.target.style.boxShadow = '0 0 0 3px rgba(79, 255, 176, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79, 255, 176, 0.2)' }}>
                          <span style={{ color: '#4fffb0', fontWeight: '600', fontSize: '0.875rem', fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {reg.user.firstName[0]}{reg.user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#fff', fontFamily: "'Barlow Condensed', sans-serif" }}>{getParticipantName(reg)}</p>
                          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'Barlow Condensed', sans-serif" }}>{reg.user.email}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 rounded-xl" style={{
            background: 'rgba(6, 13, 31, 0.6)',
            border: '1px solid rgba(79, 255, 176, 0.2)'
          }}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#4fffb0' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium mb-1" style={{ color: '#4fffb0', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: '700', textTransform: 'uppercase' }}>Seeding Tips:</p>
                <ul className="list-disc list-inside space-y-1" style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <li>Seed #1 is the strongest player/team</li>
                  <li>Seeds are used to balance the bracket</li>
                  <li>Top seeds won't meet until later rounds</li>
                  <li>All participants must have a unique seed number</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                textTransform: 'uppercase',
                borderRadius: '50px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4fffb0'
                e.currentTarget.style.color = '#4fffb0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: '#4fffb0',
                color: '#060d1f',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                textTransform: 'uppercase',
                borderRadius: '50px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: saving ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 255, 176, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {saving ? 'Saving...' : 'Save Seed Numbers'}
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(6, 13, 31, 0.99))',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.2)'
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: '900',
              fontSize: '1.5rem',
              color: '#ec4899',
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              Clear All Seeding?
            </h3>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to clear all seed numbers? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  borderRadius: '50px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4fffb0'
                  e.currentTarget.style.color = '#4fffb0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cleared = {}
                  registrations.forEach(reg => {
                    cleared[reg.id] = null
                  })
                  setSeeds(cleared)
                  setShowClearConfirm(false)
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#ec4899',
                  color: '#000',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeedingModal
