import { useState, useEffect } from 'react'
import api from '../services/api'

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
  const [groupBy, setGroupBy] = useState('event') // 'event' or 'format'

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

  // Group registrations
  const groupedRegistrations = {}
  if (groupBy === 'event') {
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
  } else {
    filteredRegistrations.forEach(reg => {
      const format = getFormatLabel(reg.event.format)
      if (!groupedRegistrations[format]) {
        groupedRegistrations[format] = {
          format: reg.event.format,
          registrations: []
        }
      }
      groupedRegistrations[format].registrations.push(reg)
    })
  }

  const getFormatLabel = (format) => {
    const labels = {
      SINGLES: 'Singles',
      DOUBLES: 'Doubles',
      MIXED_DOUBLES: 'Mixed Doubles'
    }
    return labels[format] || format
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
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Participants</p>
              <p className="text-3xl font-bold text-gray-900">{totalParticipants}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-success-600" />
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
              <p className="text-sm text-gray-600 mb-1">Doubles/Mixed</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatBreakdown.DOUBLES + formatBreakdown.MIXED_DOUBLES}
              </p>
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
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="all">All Formats</option>
            <option value="SINGLES">Singles</option>
            <option value="DOUBLES">Doubles</option>
            <option value="MIXED_DOUBLES">Mixed Doubles</option>
          </select>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="event">Group by Event</option>
            <option value="format">Group by Format</option>
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
            const isEventGroup = groupBy === 'event'

            return (
              <div key={groupKey} className="glass-card rounded-xl overflow-hidden">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 px-6 py-4 border-b border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {isEventGroup ? group.event.name : groupKey}
                      </h3>
                      {isEventGroup && (
                        <p className="text-sm text-gray-600 mt-1">
                          {getFormatLabel(group.event.format)}
                          {group.event.category && ` • ${group.event.category}`}
                          {group.event.gender && ` • ${group.event.gender}`}
                        </p>
                      )}
                    </div>
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

                {/* Registrations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.registrations.map((reg, idx) => (
                        <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
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
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              reg.status === 'CONFIRMED'
                                ? 'bg-success-100 text-success-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {reg.status === 'CONFIRMED' ? '✓ Confirmed' : reg.status}
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
    </div>
  )
}

export default RegistrationsView
