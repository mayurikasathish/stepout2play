import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

const UserIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const EditIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const ProfilePage = () => {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    fetchProfile()
    fetchRegistrations()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setProfile(response.data.user)
        setFormData(response.data.user)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/users/me/registrations')
      if (response.data.success) {
        setRegistrations(response.data.registrations)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const response = await api.patch('/auth/profile', formData)
      if (response.data.success) {
        setProfile(response.data.user)
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Failed to update profile')
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
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

  const stats = {
    tournaments: registrations.length,
    wins: 0, // TODO: Calculate from match results
    losses: 0 // TODO: Calculate from match results
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                  {getInitials(profile?.firstName, profile?.lastName)}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  {profile?.city && (
                    <p className="text-gray-600">{profile.city}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-all flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {profile?.bio && (
                <p className="text-gray-600 mb-6 leading-relaxed">{profile.bio}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {stats.tournaments}
                  </div>
                  <div className="text-sm text-gray-600">Tournaments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success-600 mb-1">
                    {stats.wins}
                  </div>
                  <div className="text-sm text-gray-600">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-danger-600 mb-1">
                    {stats.losses}
                  </div>
                  <div className="text-sm text-gray-600">Losses</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Modal */}
        {isEditing && (
          <div className="glass-card rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Bio</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={formData.profilePicture || ''}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Settings */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

          <div className="space-y-6">
            {/* Change Role */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Primary Role</h3>
              <p className="text-sm text-gray-600 mb-4">
                Current role: <span className="font-medium text-primary-600">{profile?.primaryRole || 'Not set'}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await api.patch('/auth/profile', { primaryRole: 'PLAYER' })
                      await fetchProfile()
                    } catch (err) {
                      alert('Failed to update role')
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
                >
                  Set as Player
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.patch('/auth/profile', { primaryRole: 'ORGANIZER' })
                      await fetchProfile()
                    } catch (err) {
                      alert('Failed to update role')
                    }
                  }}
                  className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white font-medium rounded-lg transition-all"
                >
                  Set as Organizer
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    try {
                      await api.delete('/auth/profile')
                      window.location.href = '/'
                    } catch (err) {
                      alert('Failed to delete account')
                    }
                  }
                }}
                className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Tournament History */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-primary-600" />
            Tournament History
          </h2>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tournament history yet.</p>
              <p className="text-sm text-gray-500 mt-2">Register for tournaments to start building your record!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{reg.event.tournament.name}</h3>
                      <p className="text-sm text-gray-600">{reg.event.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(reg.event.tournament.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                      {reg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
