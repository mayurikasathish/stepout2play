import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RegistrationsView from '../components/RegistrationsView'
import BracketView from '../components/BracketView'
import MatchScheduler from '../components/MatchScheduler'
import Toast from '../components/Toast'
import api from '../services/api'
import { getAllSports } from '../services/sports'

const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const PlusIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const GridIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
  </svg>
)

const TournamentManagePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false)
  const [showDeleteTournamentModal, setShowDeleteTournamentModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    loadTournament()
    loadEvents()
  }, [id])

  const loadTournament = async () => {
    try {
      const response = await api.get(`/tournaments/${id}`)
      if (response.data.success) {
        setTournament(response.data.tournament)
      }
    } catch (err) {
      console.error('Error loading tournament:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await api.get(`/tournaments/${id}/events`)
      if (response.data.success) {
        setEvents(response.data.events)
      }
    } catch (err) {
      console.error('Error loading events:', err)
    }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      console.log('Creating event with data:', eventData)
      const response = await api.post(`/tournaments/${id}/events`, eventData)
      if (response.data.success) {
        setShowCreateEventModal(false)
        loadEvents()
      }
    } catch (err) {
      console.error('Error creating event:', err)
      console.error('Error response:', err.response?.data)
      const errorMsg = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to create event'
      alert(errorMsg)
    }
  }

  const handleUpdateTournament = async (updateData) => {
    try {
      const response = await api.patch(`/tournaments/${id}`, updateData)
      if (response.data.success) {
        setShowEditModal(false)
        loadTournament()

        // Show success toast
        setToastMessage('Tournament updated successfully!')
        setToastType('success')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Error updating tournament:', err)
      setToastMessage('Failed to update tournament')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      const response = await api.patch(`/tournaments/events/${editingEvent.id}`, eventData)
      if (response.data.success) {
        setShowEditEventModal(false)
        setEditingEvent(null)

        // Reload events to get fresh data
        await loadEvents()

        // Show success toast
        setToastMessage('Event updated successfully!')
        setToastType('success')
        setShowToast(true)

        // Force re-render of bracket by refreshing the page data
        // This ensures BracketView gets updated event data
        loadTournament()
      }
    } catch (err) {
      console.error('Error updating event:', err)
      const errorMsg = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to update event'
      setToastMessage(errorMsg)
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleDeleteEvent = async () => {
    try {
      const response = await api.delete(`/tournaments/events/${deletingEvent.id}`)
      if (response.data.success) {
        setShowDeleteEventModal(false)
        setDeletingEvent(null)
        loadEvents()
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Failed to delete event')
    }
  }

  const handleDeleteTournament = async () => {
    try {
      const response = await api.delete(`/tournaments/${id}`)
      if (response.data.success) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Error deleting tournament:', err)
      alert('Failed to delete tournament')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-danger-600">Tournament not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
              <p className="text-gray-600">{tournament.organization?.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center gap-2"
              >
                <EditIcon className="w-4 h-4" />
                Edit Details
              </button>
              <button
                onClick={() => setShowDeleteTournamentModal(true)}
                className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 font-medium rounded-lg border border-red-300 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => navigate(`/tournaments/${id}`)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
              >
                View Public Page
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{events.length}</div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600">{tournament.status}</div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div className="text-sm text-gray-600">Start Date</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'events' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'registrations' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
            }`}
          >
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('brackets')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'brackets' ? 'border-primary-600 text-primary-600 font-bold' : 'border-transparent text-gray-600'
            }`}
          >
            Brackets
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'schedule' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
            }`}
          >
            📅 Schedule
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Tournament Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600">Sport</label>
                <p className="font-semibold capitalize">{tournament.sport}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Format</label>
                <p className="font-semibold capitalize">{tournament.format?.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Venue</label>
                <p className="font-semibold">{tournament.venueName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">City</label>
                <p className="font-semibold">{tournament.city}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Registration Deadline</label>
                <p className="font-semibold">{new Date(tournament.registrationDeadline).toLocaleString()}</p>
              </div>
            </div>
            {tournament.description && (
              <div className="mt-6">
                <label className="text-sm text-gray-600">Description</label>
                <p className="mt-2 text-gray-700">{tournament.description}</p>
              </div>
            )}
            {tournament.rules && (
              <div className="mt-6">
                <label className="text-sm text-gray-600">Tournament Rules</label>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{tournament.rules}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="glass-card rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Events</h2>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create Event
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No events created yet</p>
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg"
                >
                  Create First Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{event.format.replace('_', ' ')}</span>
                          {event.category && <span>, {event.category}</span>}
                          {event.gender && <span>, {event.gender}</span>}
                          <span>, <UsersIcon className="w-4 h-4 inline" /> {event.participantCount}/{event.maxParticipants || 'unlimited'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event)
                            setShowEditEventModal(true)
                          }}
                          className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm flex items-center gap-1"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingEvent(event)
                            setShowDeleteEventModal(true)
                          }}
                          className="px-3 py-2 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-lg text-sm flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'registrations' && (
          <RegistrationsView tournamentId={id} />
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Event Selection for Scheduling */}
            <div className="glass-card rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select Event to Schedule Matches
              </label>
              {events.length === 0 ? (
                <p className="text-gray-600">No events created yet. Create events first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        const element = document.getElementById(`schedule-${event.id}`)
                        if (element) {
                          const yOffset = -100
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className="p-4 border-2 border-gray-200 hover:border-blue-400 rounded-xl text-left transition-all hover:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {event.format.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {event.bracketGenerated ? '✅ Bracket Generated' : '⚠️ Generate bracket first'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Views for Each Event */}
            {events.filter(e => e.bracketGenerated).map((event) => (
              <div key={event.id} id={`schedule-${event.id}`}>
                <MatchScheduler
                  eventId={event.id}
                  tournament={tournament}
                />
              </div>
            ))}

            {events.filter(e => !e.bracketGenerated).length > 0 && (
              <div className="glass-card rounded-xl p-6 bg-yellow-50 border-2 border-yellow-300">
                <p className="text-yellow-900 font-medium">
                  ⚠️ Some events don't have brackets yet. Generate brackets first in the "Brackets" tab.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'brackets' && (
          <div className="space-y-6">
            {/* Event Selection */}
            <div className="glass-card rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select Event to Generate Bracket
              </label>
              {events.length === 0 ? (
                <p className="text-gray-600">No events created yet. Create events first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        // Find the bracket view section and scroll to it with offset
                        const element = document.getElementById(`bracket-${event.id}`)
                        if (element) {
                          const yOffset = -100 // Adjust this value: negative = scroll higher, positive = scroll lower
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className="p-4 border-2 border-gray-200 hover:border-primary-400 rounded-xl text-left transition-all hover:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {event.format.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {event.participantCount || 0} participants
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bracket Views for Each Event */}
            {events.map((event) => (
              <div key={event.id} id={`bracket-${event.id}`}>
                <BracketView
                  key={`${event.id}-${event.bestOf}-${event.pointsPerSet}`}
                  eventId={event.id}
                  eventName={event.name}
                  eventFormat={event.format}
                  registrationCount={event.participantCount || 0}
                  isOrganizer={true}
                  tournament={tournament}
                />
              </div>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <CreateEventModal
            tournament={tournament}
            onClose={() => setShowCreateEventModal(false)}
            onSubmit={handleCreateEvent}
          />
        )}

        {/* Edit Tournament Modal */}
        {showEditModal && (
          <EditTournamentModal
            tournament={tournament}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateTournament}
          />
        )}

        {/* Edit Event Modal */}
        {showEditEventModal && editingEvent && (
          <EditEventModal
            event={editingEvent}
            tournament={tournament}
            onClose={() => { setShowEditEventModal(false); setEditingEvent(null) }}
            onSubmit={handleUpdateEvent}
          />
        )}

        {/* Delete Event Modal */}
        {showDeleteEventModal && deletingEvent && (
          <DeleteConfirmModal
            isOpen={showDeleteEventModal}
            onClose={() => { setShowDeleteEventModal(false); setDeletingEvent(null) }}
            onConfirm={handleDeleteEvent}
            title="Delete Event?"
            message={`Are you sure you want to delete "${deletingEvent.name}"? This will remove all registrations and matches for this event. This action cannot be undone.`}
          />
        )}

        {/* Toast Notification */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}

        {/* Delete Tournament Modal */}
        {showDeleteTournamentModal && (
          <DeleteConfirmModal
            isOpen={showDeleteTournamentModal}
            onClose={() => setShowDeleteTournamentModal(false)}
            onConfirm={handleDeleteTournament}
            title="Delete Tournament?"
            message={`Are you sure you want to delete "${tournament.name}"? This will permanently delete all events, registrations, and matches. This action cannot be undone.`}
            isDangerous={true}
          />
        )}
      </main>
    </div>
  )
}

// Create Event Modal Component
const CreateEventModal = ({ tournament, onClose, onSubmit }) => {
  const [sports, setSports] = useState([])
  const [selectedSport, setSelectedSport] = useState(null)
  const [showCustomRules, setShowCustomRules] = useState(false)
  const [allowedSports, setAllowedSports] = useState([])
  const [validationError, setValidationError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    format: 'SINGLES',
    category: '',
    gender: '',
    maxParticipants: '',
    registrationFee: '',
    rules: '',
    sportId: '',
    bestOf: '',
    pointsPerSet: '',
    goldenPoint: false
  })

  // Load sports on mount
  useEffect(() => {
    const loadSports = async () => {
      try {
        const response = await getAllSports()
        if (response.success) {
          const allSports = response.sports

          // Filter sports based on tournament settings
          let filteredSports = allSports
          if (tournament?.sportType === 'single') {
            filteredSports = allSports.filter(s => tournament.sports?.includes(s.id))
          } else if (tournament?.sportType === 'multi' && tournament?.sports?.length > 0) {
            filteredSports = allSports.filter(s => tournament.sports.includes(s.id))
          }

          setSports(allSports)
          setAllowedSports(filteredSports)

          // Auto-select first allowed sport
          if (filteredSports.length > 0) {
            const defaultSport = filteredSports[0]
            setSelectedSport(defaultSport)
            setFormData(prev => ({
              ...prev,
              sportId: defaultSport.id,
              bestOf: defaultSport.rules.bestOf,
              pointsPerSet: defaultSport.rules.pointsPerSet
            }))
          }
        }
      } catch (err) {
        console.error('Error loading sports:', err)
      }
    }
    loadSports()
  }, [])

  const handleSportChange = (sportId) => {
    const sport = sports.find(s => s.id === sportId)
    setSelectedSport(sport)

    if (sport) {
      setFormData({
        ...formData,
        sportId: sport.id,
        bestOf: sport.rules.bestOf,
        pointsPerSet: sport.rules.pointsPerSet
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    // Validate scoring configuration ONLY if custom rules
    if (showCustomRules) {
      if (!formData.bestOf) {
        setValidationError('Please specify the match format (Best of 3, 5, etc.)')
        return
      }
      const bestOfValue = parseInt(formData.bestOf)
      if (bestOfValue % 2 === 0) {
        setValidationError('Best of sets must be an odd number (3, 5, 7, etc.) to determine a clear winner')
        return
      }
      if (!formData.pointsPerSet) {
        setValidationError('Please specify points per set')
        return
      }
    }

    const cleanData = {
      name: formData.name.trim(),
      format: formData.format,
      category: formData.category.trim() || undefined,
      gender: formData.gender || undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
      rules: formData.rules.trim() || undefined
    }

    // Handle custom rules vs sport selection
    if (showCustomRules) {
      cleanData.sportId = ''
      cleanData.bestOf = parseInt(formData.bestOf)
      cleanData.pointsPerSet = parseInt(formData.pointsPerSet)
    } else {
      cleanData.sportId = formData.sportId
      // Include goldenPoint for Padel
      if (formData.sportId === 'padel') {
        cleanData.goldenPoint = formData.goldenPoint
      }
    }

    onSubmit(cleanData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Create Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Men's Singles, Women's Doubles"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Sport *
                {tournament?.sportType === 'single' && (
                  <span className="text-xs text-gray-500 ml-2">(Fixed by tournament)</span>
                )}
                {tournament?.sportType === 'multi' && (
                  <span className="text-xs text-gray-500 ml-2">(Tournament allows: {tournament.sports?.join(', ')})</span>
                )}
              </label>
              <select
                value={formData.sportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={showCustomRules || tournament?.sportType === 'single'}
              >
                {allowedSports.map(sport => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show selected sport rules */}
            {selectedSport && !showCustomRules && (
  <div className="bg-green-50 border border-green-300 rounded-xl p-4">
    <h4 className="font-semibold text-green-900 mb-2">
      ✅ {selectedSport.name} - Default Scoring Rules
    </h4>

    <div className="text-sm text-green-800 space-y-1">

      <p>
        • Best of <strong>{selectedSport.rules.bestOf}</strong> sets
      </p>

      {selectedSport.rules.scoringType === "POINTS" && (
        <>
          <p>
            • <strong>{selectedSport.rules.pointsPerSet}</strong> points per set
          </p>

          <p>
            • <strong>{selectedSport.rules.minimumLead}</strong>-point lead required
          </p>

          {selectedSport.rules.maxPoints && (
            <p>
              • Maximum <strong>{selectedSport.rules.maxPoints}</strong> points per set
            </p>
          )}
        </>
      )}

      {selectedSport.rules.scoringType === "TENNIS" && (
        <>
          <p>
            • First to <strong>{selectedSport.rules.gamesPerSet}</strong> games per set
          </p>

          <p>
            • Win set by <strong>2 games</strong>
          </p>

          {selectedSport.rules.tiebreakAt && (
            <p>
              • Tiebreak played at{" "}
              <strong>
                {selectedSport.rules.tiebreakAt}-
                {selectedSport.rules.tiebreakAt}
              </strong>
            </p>
          )}

          {selectedSport.rules.goldenPoint ? (
            <p>• Golden Point scoring at Deuce</p>
          ) : (
            <p>• Advantage scoring at Deuce</p>
          )}
        </>
      )}

      <p className="text-xs text-green-600 mt-2 italic">
        {selectedSport.description}
      </p>
    </div>
  </div>
)}

            {/* Golden Point Checkbox (Padel only) */}
            {selectedSport?.id === 'padel' && !showCustomRules && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-300">
                <input
                  type="checkbox"
                  id="goldenPointCreate"
                  checked={formData.goldenPoint}
                  onChange={(e) => setFormData({ ...formData, goldenPoint: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="goldenPointCreate" className="text-sm font-medium text-yellow-900 cursor-pointer">
                  🎯 Enable Golden Point (at 40-40, next point wins instead of deuce/advantage)
                </label>
              </div>
            )}

            {/* Custom Rules Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="customRulesCreate"
                checked={showCustomRules}
                onChange={(e) => {
                  const checked = e.target.checked
                  setShowCustomRules(checked)
                  if (checked) {
                    setFormData({
                      ...formData,
                      sportId: '',
                      bestOf: '',
                      pointsPerSet: ''
                    })
                    setSelectedSport(null)
                  } else {
                    const defaultSport = allowedSports[0]
                    if (defaultSport) {
                      setSelectedSport(defaultSport)
                      setFormData({
                        ...formData,
                        sportId: defaultSport.id,
                        bestOf: defaultSport.rules.bestOf,
                        pointsPerSet: defaultSport.rules.pointsPerSet
                      })
                    }
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="customRulesCreate" className="text-sm font-medium text-gray-700 cursor-pointer">
                ⚙️ Use custom match scoring configuration
              </label>
            </div>

            {/* Scoring Configuration - Only show when Custom is selected */}
            {showCustomRules && (
              <div className="rounded-xl p-4 border bg-orange-50 border-orange-300">
                <h3 className="font-semibold mb-3 text-orange-900">
                  ⚙️ Custom Match Scoring Configuration
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-orange-900">
                      Best of (sets) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={formData.bestOf}
                      onChange={(e) => setFormData({ ...formData, bestOf: e.target.value })}
                      placeholder="e.g., 3, 5, 7"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      required
                    />
                    <p className="text-xs text-orange-600 mt-1">Common: 3, 5, or 7 sets</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-orange-900">
                      Points Per Set <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.pointsPerSet}
                      onChange={(e) => setFormData({ ...formData, pointsPerSet: e.target.value })}
                      placeholder="e.g., 21 for badminton, 11 for table tennis"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  ⚠️ Using custom scoring rules - not standard format
                </p>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{validationError}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Format *</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="SINGLES">Singles</option>
                  <option value="DOUBLES">Doubles</option>
                  <option value="MIXED_DOUBLES">Mixed Doubles</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Open, U19, Veterans 40+"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Registration Fee (₹)</label>
              <input
                type="number"
                value={formData.registrationFee}
                onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                placeholder="Leave empty for free registration"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event-Specific Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                rows={4}
                placeholder="Enter any specific rules for this event (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Tournament Modal Component
const EditTournamentModal = ({ tournament, onClose, onSubmit }) => {
  const [sportType, setSportType] = useState(tournament.sportType || 'single')
  const [selectedSports, setSelectedSports] = useState(tournament.sports || [tournament.sport || 'badminton'])
  const [formData, setFormData] = useState({
    name: tournament.name || '',
    sport: tournament.sport || 'badminton',
    startDate: tournament.startDate ? tournament.startDate.split('T')[0] : '',
    endDate: tournament.endDate ? tournament.endDate.split('T')[0] : '',
    startTime: tournament.startTime || '',
    endTime: tournament.endTime || '',
    venueName: tournament.venueName || '',
    venueAddress: tournament.venueAddress || '',
    city: tournament.city || '',
    registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 16) : '',
    description: tournament.description || '',
    rules: tournament.rules || '',
    // Only allow DRAFT/OPEN - map computed statuses back to OPEN
    status: ['DRAFT', 'OPEN'].includes(tournament.status) ? tournament.status : 'OPEN',
    allowReplacement: tournament.replacementWindowHours !== null && tournament.replacementWindowHours !== undefined,
    replacementWindowHours: tournament.replacementWindowHours || 24
  })

  const availableSports = [
    { id: 'badminton', name: 'Badminton', icon: '🏸' },
    { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
    { id: 'squash', name: 'Squash', icon: '🎾' },
    { id: 'pickleball', name: 'Pickleball', icon: '🥒' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'padel', name: 'Padel', icon: '🎾' }
  ]

  const toggleSport = (sportId) => {
    if (sportType === 'single') {
      setSelectedSports([sportId])
    } else {
      if (selectedSports.includes(sportId)) {
        // Don't allow removing all sports
        if (selectedSports.length > 1) {
          setSelectedSports(selectedSports.filter(s => s !== sportId))
        }
      } else {
        setSelectedSports([...selectedSports, sportId])
      }
    }
  }

  const handleSportTypeChange = (type) => {
    setSportType(type)
    if (type === 'single' && selectedSports.length > 1) {
      // Keep only first sport when switching to single
      setSelectedSports([selectedSports[0]])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      sportType,
      sports: selectedSports,
      sport: selectedSports[0], // Legacy field - first sport
      replacementWindowHours: formData.allowReplacement ? formData.replacementWindowHours : null
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Edit Tournament</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Sport Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Tournament Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSportTypeChange('single')}
                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                    sportType === 'single'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏆 Single Sport
                </button>
                <button
                  type="button"
                  onClick={() => handleSportTypeChange('multi')}
                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                    sportType === 'multi'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎯 Multi Sport
                </button>
              </div>
            </div>

            {/* Sports Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Sport{sportType === 'multi' ? 's' : ''} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableSports.map(sport => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.id)}
                    className={`px-4 py-3 rounded-xl border-2 font-medium transition-all text-left ${
                      selectedSports.includes(sport.id)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg mr-2">{sport.icon}</span>
                    {sport.name}
                    {selectedSports.includes(sport.id) && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
              {sportType === 'single' && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Events in this tournament will use {availableSports.find(s => s.id === selectedSports[0])?.name} scoring rules
                </p>
              )}
              {sportType === 'multi' && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Events can choose from the selected sports above
                </p>
              )}
            </div>

            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Tournament Start *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Date</p>
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Time</p>
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Tournament End *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Date</p>
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Time</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Venue Name *</label>
              <input
                type="text"
                value={formData.venueName}
                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Venue Address</label>
              <input
                type="text"
                value={formData.venueAddress}
                onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Registration Deadline *</label>
              <input
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Replacement Window */}
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.allowReplacement}
                  onChange={(e) => setFormData({ ...formData, allowReplacement: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Allow standby players to replace withdrawals
                </span>
              </label>

              {formData.allowReplacement && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Replacement Deadline (hours before tournament start) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={formData.replacementWindowHours}
                    onChange={(e) => setFormData({ ...formData, replacementWindowHours: parseInt(e.target.value) || 24 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong>How it works:</strong> Replacement window closes {formData.replacementWindowHours} hours before tournament start time. If a confirmed player withdraws before this deadline, ALL standby players receive an email notification. The first standby player to accept (by clicking the link in the email) gets the spot. After the deadline, withdrawals are still allowed but standby players won't be notified (to avoid last-minute bracket changes).
                  </p>
                </div>
              )}

              {!formData.allowReplacement && (
                <p className="mt-2 text-xs text-gray-600">
                  Waitlist players will not be automatically promoted if someone withdraws
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Other statuses (Closed, Ongoing, Completed) are calculated automatically based on dates
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tournament Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                rows={6}
                placeholder="Enter tournament rules, regulations, and guidelines..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl"
              >
                Update Tournament
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Event Modal Component
const EditEventModal = ({ event, tournament, onClose, onSubmit }) => {
  const [sports, setSports] = useState([])
  const [selectedSport, setSelectedSport] = useState(null)
  const [showCustomRules, setShowCustomRules] = useState(false)
  const [allowedSports, setAllowedSports] = useState([]) // Sports allowed by tournament
  const [validationError, setValidationError] = useState('')
  const [formData, setFormData] = useState({
    name: event.name || '',
    format: event.format || 'SINGLES',
    category: event.category || '',
    gender: event.gender || '',
    maxParticipants: event.maxParticipants || '',
    registrationFee: event.registrationFee || '',
    rules: event.rules || '',
    sportId: event.sportId || 'badminton', // Default to badminton
    bestOf: event.bestOf || '',
    pointsPerSet: event.pointsPerSet || '',
    goldenPoint: event.goldenPoint || false
  })

  // Load sports on mount
  useEffect(() => {
    const loadSports = async () => {
      try {
        const response = await getAllSports()
        if (response.success) {
          const allSports = response.sports

          // Filter sports based on tournament settings
          let filteredSports = allSports
          if (tournament?.sportType === 'single') {
            // Single sport tournament - only show that sport, disable dropdown
            filteredSports = allSports.filter(s => tournament.sports?.includes(s.id))
          } else if (tournament?.sportType === 'multi' && tournament?.sports?.length > 0) {
            // Multi sport tournament - only show allowed sports
            filteredSports = allSports.filter(s => tournament.sports.includes(s.id))
          }

          setSports(allSports)
          setAllowedSports(filteredSports)

          // Check if event has custom rules (no sportId but has bestOf/pointsPerSet)
          if (!event.sportId && event.bestOf && event.pointsPerSet) {
            // Custom rules mode
            setShowCustomRules(true)
            setSelectedSport(null)
            setFormData(prev => ({
              ...prev,
              sportId: '',
              bestOf: event.bestOf,
              pointsPerSet: event.pointsPerSet
            }))
          } else {
            // Sport mode - use event's sport or first allowed sport
            let sportId = event.sportId
            if (!sportId && filteredSports.length > 0) {
              sportId = filteredSports[0].id
            }
            const sport = allSports.find(s => s.id === sportId)
            setSelectedSport(sport)

            // Auto-fill rules if sport is selected
            if (sport && !event.bestOf) {
              setFormData(prev => ({
                ...prev,
                sportId: sport.id,
                bestOf: sport.rules.bestOf,
                pointsPerSet: sport.rules.pointsPerSet
              }))
            }
          }
        }
      } catch (err) {
        console.error('Error loading sports:', err)
      }
    }
    loadSports()
  }, [])

  const handleSportChange = (sportId) => {
    const sport = sports.find(s => s.id === sportId)
    setSelectedSport(sport)

    if (sport) {
      // Auto-fill scoring rules from selected sport
      setFormData({
        ...formData,
        sportId: sport.id,
        bestOf: sport.rules.bestOf,
        pointsPerSet: sport.rules.pointsPerSet
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    // Validate scoring configuration ONLY if custom rules
    if (showCustomRules) {
      if (!formData.bestOf) {
        setValidationError('Please specify the match format (Best of 3, 5, etc.)')
        return
      }
      const bestOfValue = parseInt(formData.bestOf)
      if (bestOfValue % 2 === 0) {
        setValidationError('Best of sets must be an odd number (3, 5, 7, etc.) to determine a clear winner')
        return
      }
      if (!formData.pointsPerSet) {
        setValidationError('Please specify points per set')
        return
      }
    }

    const cleanData = {
      name: formData.name.trim(),
      format: formData.format,
      category: formData.category.trim() || undefined,
      gender: formData.gender || undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
      rules: formData.rules.trim() || undefined
    }

    // Handle custom rules vs sport selection
    if (showCustomRules) {
      // Custom rules mode - send empty sportId and custom values
      cleanData.sportId = ''
      cleanData.bestOf = parseInt(formData.bestOf)
      cleanData.pointsPerSet = parseInt(formData.pointsPerSet)
    } else {
      // Sport mode - send sportId (backend will auto-fill rules)
      cleanData.sportId = formData.sportId
      // Include goldenPoint for Padel
      if (formData.sportId === 'padel') {
        cleanData.goldenPoint = formData.goldenPoint
      }
    }

    onSubmit(cleanData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Edit Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Sport *
                {tournament?.sportType === 'single' && (
                  <span className="text-xs text-gray-500 ml-2">(Fixed by tournament)</span>
                )}
                {tournament?.sportType === 'multi' && (
                  <span className="text-xs text-gray-500 ml-2">(Tournament allows: {tournament.sports?.join(', ')})</span>
                )}
              </label>
              <select
                value={formData.sportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={showCustomRules || tournament?.sportType === 'single'}
              >
                {allowedSports.map(sport => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show selected sport rules */}
            {selectedSport && !showCustomRules && (
  <div className="bg-green-50 border border-green-300 rounded-xl p-4">
    <h4 className="font-semibold text-green-900 mb-2">
      ✅ {selectedSport.name} - Default Scoring Rules
    </h4>

    <div className="text-sm text-green-800 space-y-1">

      <p>
        • Best of <strong>{selectedSport.rules.bestOf}</strong> sets
      </p>

      {selectedSport.rules.scoringType === "POINTS" && (
        <>
          <p>
            • <strong>{selectedSport.rules.pointsPerSet}</strong> points per set
          </p>

          <p>
            • <strong>{selectedSport.rules.minimumLead}</strong>-point lead required
          </p>

          {selectedSport.rules.maxPoints && (
            <p>
              • Maximum <strong>{selectedSport.rules.maxPoints}</strong> points per set
            </p>
          )}
        </>
      )}

      {selectedSport.rules.scoringType === "TENNIS" && (
        <>
          <p>
            • First to <strong>{selectedSport.rules.gamesPerSet}</strong> games per set
          </p>

          <p>
            • Win set by <strong>2 games</strong>
          </p>

          {selectedSport.rules.tiebreakAt && (
            <p>
              • Tiebreak played at{" "}
              <strong>
                {selectedSport.rules.tiebreakAt}-
                {selectedSport.rules.tiebreakAt}
              </strong>
            </p>
          )}

          {selectedSport.rules.goldenPoint ? (
            <p>• Golden Point scoring at Deuce</p>
          ) : (
            <p>• Advantage scoring at Deuce</p>
          )}
        </>
      )}

      <p className="text-xs text-green-600 mt-2 italic">
        {selectedSport.description}
      </p>
    </div>
  </div>
)}

            {/* Golden Point Checkbox (Padel only) */}
            {selectedSport?.id === 'padel' && !showCustomRules && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-300">
                <input
                  type="checkbox"
                  id="goldenPointEdit"
                  checked={formData.goldenPoint}
                  onChange={(e) => setFormData({ ...formData, goldenPoint: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="goldenPointEdit" className="text-sm font-medium text-yellow-900 cursor-pointer">
                  🎯 Enable Golden Point (at 40-40, next point wins instead of deuce/advantage)
                </label>
              </div>
            )}

            {/* Custom Rules Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="customRules"
                checked={showCustomRules}
                onChange={(e) => {
                  const checked = e.target.checked
                  setShowCustomRules(checked)
                  if (checked) {
                    // Clear sport data and enable custom fields
                    setFormData({
                      ...formData,
                      sportId: '',
                      bestOf: '',
                      pointsPerSet: ''
                    })
                    setSelectedSport(null)
                  } else {
                    // Restore default sport (badminton)
                    const badminton = sports.find(s => s.id === 'badminton')
                    if (badminton) {
                      setSelectedSport(badminton)
                      setFormData({
                        ...formData,
                        sportId: 'badminton',
                        bestOf: badminton.rules.bestOf,
                        pointsPerSet: badminton.rules.pointsPerSet
                      })
                    }
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="customRules" className="text-sm font-medium text-gray-700 cursor-pointer">
                ⚙️ Use custom match scoring configuration
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Format *</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="SINGLES">Singles</option>
                  <option value="DOUBLES">Doubles</option>
                  <option value="MIXED_DOUBLES">Mixed Doubles</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Open, U19, Veterans 40+"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Registration Fee (₹)</label>
              <input
                type="number"
                value={formData.registrationFee}
                onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                placeholder="Leave empty for free registration"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Scoring Configuration - Only show when Custom is selected */}
            {showCustomRules && (
              <div className="rounded-xl p-4 border bg-orange-50 border-orange-300">
                <h3 className="font-semibold mb-3 text-orange-900">
                  ⚙️ Custom Match Scoring Configuration
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-orange-900">
                      Best of (sets) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={formData.bestOf}
                      onChange={(e) => setFormData({ ...formData, bestOf: e.target.value })}
                      placeholder="e.g., 3, 5, 7"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      required
                    />
                    <p className="text-xs text-orange-600 mt-1">Common: 3, 5, or 7 sets</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-orange-900">
                      Points Per Set <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.pointsPerSet}
                      onChange={(e) => setFormData({ ...formData, pointsPerSet: e.target.value })}
                      placeholder="e.g., 21 for badminton, 11 for table tennis"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  ⚠️ Using custom scoring rules - not standard format
                </p>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{validationError}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Event-Specific Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                rows={4}
                placeholder="Enter any specific rules for this event (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl"
              >
                Update Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDangerous = false }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {isDangerous && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This will delete ALL associated data including events, registrations, and matches.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default TournamentManagePage
