import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RegistrationsView from '../components/RegistrationsView'
import BracketView from '../components/BracketView'
import api from '../services/api'

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
      }
    } catch (err) {
      console.error('Error updating tournament:', err)
      alert('Failed to update tournament')
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
                onClick={() => navigate(`/tournaments/${id}`)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
              >
                View Public Page
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{events.length}</div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">{tournament.participantCount || 0}</div>
              <div className="text-sm text-gray-600">Participants</div>
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
              <div>
                <label className="text-sm text-gray-600">Entry Fee</label>
                <p className="font-semibold">₹{tournament.entryFee || 'Free'}</p>
              </div>
            </div>
            {tournament.description && (
              <div className="mt-6">
                <label className="text-sm text-gray-600">Description</label>
                <p className="mt-2 text-gray-700">{tournament.description}</p>
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
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="capitalize">{event.format.replace('_', ' ')}</span>
                          {event.category && <span>, {event.category}</span>}
                          {event.gender && <span>, {event.gender}</span>}
                          <span>, <UsersIcon className="w-4 h-4 inline" /> {event.participantCount}/{event.maxParticipants || 'unlimited'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('View registrations for this event')}
                        className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm"
                      >
                        View Registrations
                      </button>
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
                        // Find the bracket view section and scroll to it
                        document.getElementById(`bracket-${event.id}`)?.scrollIntoView({ behavior: 'smooth' })
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
                  eventId={event.id}
                  eventName={event.name}
                  eventFormat={event.format}
                  registrationCount={event.participantCount || 0}
                  isOrganizer={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <CreateEventModal
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
      </main>
    </div>
  )
}

// Create Event Modal Component
const CreateEventModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    format: 'SINGLES',
    category: '',
    gender: '',
    maxParticipants: '',
    registrationFee: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Clean up empty strings and convert to proper types
    const cleanData = {
      name: formData.name.trim(),
      format: formData.format,
      category: formData.category.trim() || undefined,
      gender: formData.gender || undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined
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
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Any</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Mixed">Mixed</option>
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
                placeholder="Leave empty if using tournament fee"
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
  const [formData, setFormData] = useState({
    name: tournament.name || '',
    sport: tournament.sport || 'badminton',
    format: tournament.format || 'ROUND_ROBIN',
    startDate: tournament.startDate ? tournament.startDate.split('T')[0] : '',
    endDate: tournament.endDate ? tournament.endDate.split('T')[0] : '',
    venueName: tournament.venueName || '',
    venueAddress: tournament.venueAddress || '',
    city: tournament.city || '',
    registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 16) : '',
    entryFee: tournament.entryFee || '',
    description: tournament.description || '',
    maxParticipants: tournament.maxParticipants || '',
    status: tournament.status || 'DRAFT'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sport *</label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="badminton">Badminton</option>
                  <option value="tennis">Tennis</option>
                  <option value="table-tennis">Table Tennis</option>
                  <option value="squash">Squash</option>
                  <option value="pickleball">Pickleball</option>
                  <option value="padel">Padel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Format *</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="KNOCKOUT">Knockout</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Entry Fee (₹)</label>
                <input
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  placeholder="Leave empty for free"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
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
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
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

export default TournamentManagePage
