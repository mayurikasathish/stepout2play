import { useState, useEffect } from 'react'
import api from '../services/api'

const SeedingModal = ({ event, registrations, onClose, onSaved }) => {
  const [seeds, setSeeds] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Manual Seeding</h2>
          <p className="text-gray-600 mb-6">
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
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
            >
              Auto-Number (1, 2, 3...)
            </button>
            <button
              onClick={() => {
                const cleared = {}
                registrations.forEach(reg => {
                  cleared[reg.id] = null
                })
                setSeeds(cleared)
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
            >
              Clear All
            </button>
          </div>

          {/* Seeding Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Seed #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="1"
                        max={registrations.length}
                        value={seeds[reg.id] !== null ? seeds[reg.id] : ''}
                        onChange={(e) => handleSeedChange(reg.id, e.target.value)}
                        placeholder="#"
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-center font-semibold"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-semibold text-sm">
                            {reg.user.firstName[0]}{reg.user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getParticipantName(reg)}</p>
                          <p className="text-sm text-gray-500">{reg.user.email}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Seeding Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
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
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Seed Numbers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeedingModal
