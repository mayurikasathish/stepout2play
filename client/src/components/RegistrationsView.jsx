import { useState, useEffect } from 'react'
import api from '../services/api'
import SeedingModal from './SeedingModal'
import Toast from './Toast'

const SearchIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const DownloadIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const FilterIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CheckIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const RegistrationsView = ({ tournamentId }) => {
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [showSeedingModal, setShowSeedingModal] = useState(false)
  const [selectedEventForSeeding, setSelectedEventForSeeding] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    loadData()
  }, [tournamentId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load events
      const eventsResponse = await api.get(`/tournaments/${tournamentId}/events`)
      if (eventsResponse.data.success) {
        setEvents(eventsResponse.data.events)
      }

      // Load all registrations for this tournament
      const regsResponse = await api.get(`/tournaments/${tournamentId}/registrations`)
      if (regsResponse.data.success) {
        setRegistrations(regsResponse.data.registrations)
      }
    } catch (err) {
      console.error('Error loading registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  const filteredRegistrations = registrations.filter(reg => {
    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      reg.user.firstName.toLowerCase().includes(searchLower) ||
      reg.user.lastName.toLowerCase().includes(searchLower) ||
      reg.user.email.toLowerCase().includes(searchLower) ||
      (reg.partner && (
        reg.partner.firstName.toLowerCase().includes(searchLower) ||
        reg.partner.lastName.toLowerCase().includes(searchLower) ||
        reg.partner.email.toLowerCase().includes(searchLower)
      ))

    // Event filter
    const matchesEvent = selectedEvent === 'all' || reg.eventId === selectedEvent

    // Format filter
    const matchesFormat = selectedFormat === 'all' || reg.event.format === selectedFormat

    return matchesSearch && matchesEvent && matchesFormat
  })

  // Group registrations by event
  const groupedRegistrations = {}
  filteredRegistrations.forEach(reg => {
    const eventName = reg.event.name
    if (!groupedRegistrations[eventName]) {
      groupedRegistrations[eventName] = {
        event: reg.event,
        registrations: []
      }
    }
    groupedRegistrations[eventName].registrations.push(reg)
  })

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
  }

  const handleSetSeeding = (event, eventRegistrations) => {
    setSelectedEventForSeeding({ event, registrations: eventRegistrations })
    setShowSeedingModal(true)
  }

  const handleSeedingSaved = () => {
    loadData() // Reload to show updated seed numbers
    setToastMessage('Seed numbers updated successfully')
    setToastType('success')
    setShowToast(true)
  }

  const handleNotifyStandby = async (eventId) => {
    if (!confirm('Send email notifications to all standby players for this event?')) {
      return
    }

    try {
      const response = await api.post(`/events/${eventId}/notify-standby`)
      if (response.data.success) {
        setToastMessage(`✉️ ${response.data.notifiedCount} standby player(s) have been notified via email!`)
        setToastType('success')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Error notifying standby players:', err)
      setToastMessage(err.response?.data?.error || 'Failed to notify standby players')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleExportCSV = () => {
    const csvData = []

    // Headers
    csvData.push([
      'Event Name',
      'Event Format',
      'Player Name',
      'Player Email',
      'Partner Name',
      'Partner Email',
      'Registration Date',
      'Status'
    ])

    // Data rows
    filteredRegistrations.forEach(reg => {
      csvData.push([
        reg.event.name,
        getFormatLabel(reg.event.format),
        `${reg.user.firstName} ${reg.user.lastName}`,
        reg.user.email,
        reg.partner ? `${reg.partner.firstName} ${reg.partner.lastName}` : '',
        reg.partner?.email || '',
        new Date(reg.createdAt).toLocaleDateString(),
        reg.status
      ])
    })

    // Convert to CSV string
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tournament-registrations-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const totalRegistrations = registrations.length
  const totalParticipants = registrations.reduce((acc, reg) => {
    return acc + (reg.partner ? 2 : 1)
  }, 0)

  const formatBreakdown = {
    SINGLES: registrations.filter(r => r.event.format === 'SINGLES').length,
    DOUBLES: registrations.filter(r => r.event.format === 'DOUBLES').length,
    MIXED_DOUBLES: registrations.filter(r => r.event.format === 'MIXED_DOUBLES').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{totalRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Singles</p>
              <p className="text-3xl font-bold text-gray-900">{formatBreakdown.SINGLES}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Doubles</p>
              <p className="text-3xl font-bold text-gray-900">{formatBreakdown.DOUBLES}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mixed Doubles</p>
              <p className="text-3xl font-bold text-gray-900">{formatBreakdown.MIXED_DOUBLES}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by player name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Event Filter */}
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0',
              color: '#fff',
              padding: '0.65rem 3.5rem 0.65rem 1rem',
              fontFamily: "'Barlow', sans-serif",
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id} style={{ background: '#0a1628', color: '#fff' }}>{event.name}</option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0',
              color: '#fff',
              padding: '0.65rem 3.5rem 0.65rem 1rem',
              fontFamily: "'Barlow', sans-serif",
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#0a1628', color: '#fff' }}>All Formats</option>
            <option value="SINGLES" style={{ background: '#0a1628', color: '#fff' }}>Singles</option>
            <option value="DOUBLES" style={{ background: '#0a1628', color: '#fff' }}>Doubles</option>
            <option value="MIXED_DOUBLES" style={{ background: '#0a1628', color: '#fff' }}>Mixed Doubles</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <DownloadIcon className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Registrations Found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedEvent !== 'all' || selectedFormat !== 'all'
              ? 'Try adjusting your filters or search term.'
              : 'No one has registered yet. Share your tournament to get participants!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedRegistrations).map(groupKey => {
            const group = groupedRegistrations[groupKey]

            return (
              <div key={groupKey} id={`event-${group.event.id}`} className="glass-card scroll-mt-6" style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {/* Group Header */}
                <div className="px-6 py-4 border-b" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottomColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#000',
                        textTransform: 'uppercase',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: '-0.02em'
                      }}>
                        {group.event.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getFormatLabel(group.event.format)}
                        {group.event.category && ` • ${group.event.category}`}
                        {group.event.gender && ` • ${group.event.gender}`}
                        {!group.event.bracketGenerated && (
                          <span className="ml-2 px-2 py-0.5 bg-warning-100 text-warning-700 text-xs font-medium rounded">
                            Bracket not generated
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Show Notify Standby button if there are standby players */}
                      {group.registrations.some(r => r.status === 'STANDBY') && (
                        <button
                          onClick={() => handleNotifyStandby(group.event.id)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Notify Standby Players
                        </button>
                      )}
                      {!group.event.bracketGenerated && (
                        <button
                          onClick={() => handleSetSeeding(group.event, group.registrations)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#00d4ff',
                            color: '#000',
                            fontWeight: '700',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            textTransform: 'uppercase'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.8)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#00d4ff'
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          Set Seeding
                        </button>
                      )}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          {group.registrations.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          {group.registrations.length === 1 ? 'registration' : 'registrations'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registrations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player(s)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered On
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ background: 'transparent' }}>
                      {group.registrations.map((reg, idx) => (
                        <tr
                          key={reg.id}
                          style={{
                            opacity: (reg.status === 'CANCELLED' || reg.status === 'WITHDRAWN') ? 0.4 : 1,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {reg.seedNumber !== null ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-warning-100 text-warning-700 font-bold text-sm rounded-full">
                                {reg.seedNumber}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {/* Team Name for Doubles/Mixed */}
                              {reg.teamName && (
                                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg" style={{
                                  background: 'rgba(79, 255, 176, 0.1)',
                                  border: '1px solid rgba(79, 255, 176, 0.3)'
                                }}>
                                  <svg className="w-4 h-4" style={{ color: '#4fffb0' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span className="font-bold text-sm" style={{
                                    color: '#4fffb0',
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}>
                                    {reg.teamName}
                                  </span>
                                </div>
                              )}

                              {/* Primary Player */}
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary-600 font-semibold text-sm">
                                    {reg.user.firstName[0]}{reg.user.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {reg.user.firstName} {reg.user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500">{reg.user.email}</p>
                                </div>
                              </div>

                              {/* Partner */}
                              {reg.partner && (
                                <div className="flex items-center gap-3 ml-13">
                                  <span className="text-gray-400 text-xs">+</span>
                                  <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-success-600 font-semibold text-sm">
                                      {reg.partner.firstName[0]}{reg.partner.lastName[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {reg.partner.firstName} {reg.partner.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">{reg.partner.email}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <a href={`mailto:${reg.user.email}`} className="text-primary-600 hover:text-primary-700">
                              {reg.user.email}
                            </a>
                            {reg.partner && (
                              <>
                                <br />
                                <a href={`mailto:${reg.partner.email}`} className="text-primary-600 hover:text-primary-700">
                                  {reg.partner.email}
                                </a>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(reg.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              fontFamily: "'Barlow Condensed', sans-serif",
                              background: reg.status === 'CONFIRMED' ? 'rgba(79, 255, 176, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color: reg.status === 'CONFIRMED' ? '#4fffb0' : 'rgba(255, 255, 255, 0.7)'
                            }}>
                              {reg.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Seeding Modal */}
      {showSeedingModal && selectedEventForSeeding && (
        <SeedingModal
          event={selectedEventForSeeding.event}
          registrations={selectedEventForSeeding.registrations}
          onClose={() => {
            setShowSeedingModal(false)
            setSelectedEventForSeeding(null)
          }}
          onSaved={handleSeedingSaved}
        />
      )}

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

export default RegistrationsView
