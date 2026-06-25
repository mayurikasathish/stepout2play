import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import CancelRegistrationModal from '../components/CancelRegistrationModal'
import ImageUpload from '../components/ImageUpload'
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
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancellingRegistration, setCancellingRegistration] = useState(null)

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
    setSaving(true)
    try {
      console.log('Updating profile with data:', formData)
      const response = await api.patch('/auth/profile', formData)
      console.log('Profile update response:', response.data)
      if (response.data.success) {
        setProfile(response.data.user)
        setFormData(response.data.user)
        setIsEditing(false)
        setToastMessage('Profile updated successfully')
        setToastType('success')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      console.error('Error response:', err.response?.data)
      const errorMessage = err.response?.data?.error || 'Failed to update profile'
      setToastMessage(errorMessage)
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
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
                <ImageUpload
                  type="profile"
                  entityId={profile?.id}
                  currentImage={formData.profilePicture}
                  onImageUploaded={(data) => {
                    setFormData({ ...formData, profilePicture: data.user.profilePicture })
                    setProfile({ ...profile, profilePicture: data.user.profilePicture })
                    setToastMessage('Profile picture uploaded successfully!')
                    setToastType('success')
                    setShowToast(true)
                  }}
                  label="Upload Profile Picture"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Settings */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

          <div className="space-y-6">

            {/* Delete Account */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
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
              {registrations.map((reg) => {
                const registrationDeadline = new Date(reg.event.tournament.registrationDeadline)
                const isDeadlinePassed = registrationDeadline < new Date()

                return (
                  <div key={reg.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reg.event.tournament.name}</h3>
                        <p className="text-sm text-gray-600">{reg.event.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(reg.event.tournament.startDate).toLocaleDateString()}
                        </p>
                        {isDeadlinePassed && reg.status === 'CONFIRMED' && (
                          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Registration deadline closed - Contact organizer to cancel
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          reg.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : reg.status === 'CANCELLED'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {reg.status === 'CONFIRMED' ? 'Registered' : reg.status === 'CANCELLED' ? 'Cancelled' : reg.status}
                        </span>
                        {reg.status === 'CONFIRMED' && (
                          <button
                            onClick={() => !isDeadlinePassed && setCancellingRegistration(reg)}
                            disabled={isDeadlinePassed}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                              isDeadlinePassed
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={isDeadlinePassed ? 'Registration deadline has passed' : 'Cancel registration'}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Account?</h3>
                <p className="text-gray-600">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.delete('/auth/profile')
                      window.location.href = '/'
                    } catch (err) {
                      setShowDeleteConfirm(false)
                      setToastMessage('Failed to delete account')
                      setToastType('error')
                      setShowToast(true)
                    }
                  }}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Registration Modal */}
        {cancellingRegistration && (
          <CancelRegistrationModal
            registration={cancellingRegistration}
            onClose={() => setCancellingRegistration(null)}
            onCancelled={() => {
              fetchRegistrations()
            }}
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
      </main>
    </div>
  )
}

export default ProfilePage
