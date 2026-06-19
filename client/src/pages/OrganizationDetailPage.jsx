import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

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

const TrashIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EditIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const OrganizationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { context } = useAuth()
  const [organization, setOrganization] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false)

  useEffect(() => {
    console.log('OrganizationDetailPage mounted, org ID:', id)
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch organization
      console.log('Fetching org...')
      const orgResponse = await api.get(`/orgs/${id}`)
      console.log('Org response:', orgResponse.data)

      if (orgResponse.data.success) {
        setOrganization(orgResponse.data.org)
      }

      // Fetch tournaments
      console.log('Fetching tournaments...')
      const tournamentsResponse = await api.get(`/orgs/${id}/tournaments`)
      console.log('Tournaments response:', tournamentsResponse.data)

      if (tournamentsResponse.data.success) {
        console.log('Setting tournaments:', tournamentsResponse.data.tournaments)
        setTournaments(tournamentsResponse.data.tournaments)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      console.error('Error response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return

    try {
      await api.delete(`/tournaments/${tournamentId}`)
      loadData()
    } catch (err) {
      console.error('Error deleting tournament:', err)
      alert('Failed to delete tournament')
    }
  }

  const handleUpdateOrg = async (updateData) => {
    try {
      const response = await api.patch(`/orgs/${id}`, updateData)
      if (response.data.success) {
        setShowEditOrgModal(false)
        loadData()
      }
    } catch (err) {
      console.error('Error updating organization:', err)
      alert('Failed to update organization')
    }
  }

  const handleDeleteOrg = async () => {
    if (!window.confirm('Are you sure you want to delete this organization? This will also delete all tournaments, events, and registrations.')) return

    try {
      await api.delete(`/orgs/${id}`)
      navigate('/manage')
    } catch (err) {
      console.error('Error deleting organization:', err)
      alert('Failed to delete organization')
    }
  }

  const handleCreateTournament = async (tournamentData) => {
    try {
      const response = await api.post(`/orgs/${id}/tournaments`, tournamentData)
      if (response.data.success) {
        setShowCreateTournamentModal(false)
        loadData()
      }
    } catch (err) {
      console.error('Error creating tournament:', err)
      alert('Failed to create tournament: ' + (err.response?.data?.errors?.join(', ') || err.message))
    }
  }

  const myRole = context?.orgs?.find(o => o.id === id)?.myRole
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'

  console.log('Render - tournaments count:', tournaments.length, 'loading:', loading)

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

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-danger-600 mb-4">Organization not found</p>
            <button
              onClick={() => navigate('/manage')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Back to Manage
            </button>
          </div>
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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {organization.logoUrl ? (
                <img src={organization.logoUrl} alt={organization.name} className="w-20 h-20 rounded-xl" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                  {organization.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-semibold text-primary-600">
                    {tournaments.length} Tournament{tournaments.length !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>Role: {myRole}</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditOrgModal(true)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit Org
                </button>
                {myRole === 'OWNER' && (
                  <button
                    onClick={handleDeleteOrg}
                    className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowCreateTournamentModal(true)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Tournament
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tournaments */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournaments</h2>

          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments yet</h3>
              <p className="text-gray-600">Create your first tournament to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{tournament.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Sport: <span className="capitalize">{tournament.sport}</span></div>
                        <div>Format: <span className="capitalize">{tournament.format?.replace('_', ' ')}</span></div>
                        <div>Date: {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</div>
                        <div>Location: {tournament.venueName}, {tournament.city}</div>
                        <div>Status: <span className="font-medium">{tournament.status}</span></div>
                        <div className="text-primary-600 font-medium">
                          {tournament.events?.length || 0} events • {tournament.participantCount || 0} participants
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/tournaments/${tournament.id}/manage`)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                      >
                        Manage
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg flex items-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Organization Modal */}
        {showEditOrgModal && (
          <EditOrgModal
            organization={organization}
            onClose={() => setShowEditOrgModal(false)}
            onSubmit={handleUpdateOrg}
          />
        )}

        {/* Create Tournament Modal */}
        {showCreateTournamentModal && (
          <CreateTournamentModal
            onClose={() => setShowCreateTournamentModal(false)}
            onSubmit={handleCreateTournament}
          />
        )}
      </main>
    </div>
  )
}

// Edit Organization Modal Component
const EditOrgModal = ({ organization, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    logoUrl: organization.logoUrl || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-6">Edit Organization</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Logo URL</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
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
                Update Organization
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Create Tournament Modal Component
const CreateTournamentModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    sport: 'badminton',
    format: 'ROUND_ROBIN',
    startDate: '',
    endDate: '',
    venueName: '',
    venueAddress: '',
    city: '',
    registrationDeadline: '',
    description: '',
    rules: '',
    status: 'DRAFT'
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
          <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Championship 2024"
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
                placeholder="e.g., Sports Complex Arena"
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
                placeholder="Street address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Mumbai"
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
                rows={3}
                placeholder="Tournament details..."
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
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrganizationDetailPage
