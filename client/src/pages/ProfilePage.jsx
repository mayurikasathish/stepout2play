import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import CancelRegistrationModal from '../components/CancelRegistrationModal'
import ImageUpload from '../components/ImageUpload'
import SportRatingCard from '../components/profile/SportRatingCard'
import MatchHistoryTable from '../components/profile/MatchHistoryTable'
import CareerStatsCard from '../components/profile/CareerStatsCard'
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
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancellingRegistration, setCancellingRegistration] = useState(null)
  const [sportsStats, setSportsStats] = useState([])
  const [careerStats, setCareerStats] = useState(null)
  const [matchHistory, setMatchHistory] = useState([])
  const [selectedSport, setSelectedSport] = useState('all')

  useEffect(() => {
    console.log('🔄 ProfilePage useEffect running, authUser:', authUser)
    fetchProfile()
    fetchRegistrations()
    fetchRatings()
    if (authUser?.id) {
      console.log('✅ authUser.id exists, fetching player stats...')
      fetchPlayerStats()
      fetchMatchHistory()
    } else {
      console.log('❌ authUser.id not available yet')
    }
  }, [authUser?.id])

  // Debug log when state changes
  useEffect(() => {
    console.log('📊 State updated - careerStats:', careerStats)
    console.log('📊 State updated - sportsStats:', sportsStats)
    console.log('📊 State updated - matchHistory:', matchHistory)
  }, [careerStats, sportsStats, matchHistory])

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

  const fetchRatings = async () => {
    try {
      if (!authUser?.id) return

      // Fetch all available sports
      const sportsResponse = await api.get('/sports')
      const allSports = sportsResponse.data.sports || []

      // Fetch user's ratings
      const response = await api.get(`/ratings/${authUser.id}`)
      let userRatings = response.data.ratings || []

      // If user has no ratings, create initial ratings for all sports
      if (userRatings.length === 0 && allSports.length > 0) {
        // Create initial ratings for all sports
        const initPromises = allSports.map(sport =>
          api.get(`/ratings/${authUser.id}/${sport.id}`).catch(err => {
            console.error(`Error creating rating for ${sport.id}:`, err)
            return null
          })
        )

        await Promise.all(initPromises)

        // Fetch ratings again after creation
        const refreshResponse = await api.get(`/ratings/${authUser.id}`)
        userRatings = refreshResponse.data.ratings || []
      }

      setRatings(userRatings)
    } catch (err) {
      console.error('Error fetching ratings:', err)
    }
  }

  const fetchPlayerStats = async () => {
    try {
      console.log('🔍 Fetching player stats for user:', authUser?.id)
      const response = await api.get(`/users/${authUser.id}/profile-stats`)
      console.log('✅ Player stats response:', response.data)
      if (response.data.success) {
        setSportsStats(response.data.sportsStats)
        setCareerStats(response.data.careerStats)
        console.log('✅ Set sportsStats:', response.data.sportsStats)
        console.log('✅ Set careerStats:', response.data.careerStats)
      }
    } catch (err) {
      console.error('❌ Error fetching player stats:', err)
      console.error('❌ Error details:', err.response?.data)
    }
  }

  const fetchMatchHistory = async (sportId = 'all') => {
    try {
      console.log('🔍 Fetching match history for user:', authUser?.id)
      const query = sportId === 'all' ? '' : `?sportId=${sportId}`
      const response = await api.get(`/users/${authUser.id}/match-history${query}`)
      console.log('✅ Match history response:', response.data)
      if (response.data.success) {
        setMatchHistory(response.data.matchHistory)
        console.log('✅ Set matchHistory:', response.data.matchHistory)
      }
    } catch (err) {
      console.error('❌ Error fetching match history:', err)
      console.error('❌ Error details:', err.response?.data)
    }
  }

  const handleSportFilter = (sportId) => {
    setSelectedSport(sportId)
    fetchMatchHistory(sportId)
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

        {/* Player Ratings */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-primary-600" />
            Player Ratings
          </h2>

          {ratings.length === 0 ? (
            <div className="text-center py-12">
              <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No ratings yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Register and play in tournaments to build your rating!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ratings.map((rating) => {
                const sportName = rating.sportId
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')

                // Rating color based on value
                let ratingColor = 'text-gray-900'
                let bgColor = 'bg-gray-100'
                if (rating.rating >= 1400) {
                  ratingColor = 'text-yellow-700'
                  bgColor = 'bg-yellow-100'
                } else if (rating.rating >= 1300) {
                  ratingColor = 'text-blue-700'
                  bgColor = 'bg-blue-100'
                } else if (rating.rating >= 1200) {
                  ratingColor = 'text-green-700'
                  bgColor = 'bg-green-100'
                }

                return (
                  <div
                    key={rating.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{sportName}</h3>
                      <div className={`px-3 py-1 rounded-full ${bgColor}`}>
                        <span className={`text-xl font-bold ${ratingColor}`}>
                          {Math.round(rating.rating)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Matches Played:</span>
                        <span className="font-medium text-gray-900">{rating.matchCount}</span>
                      </div>

                      {rating.matchCount > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Uncertainty:</span>
                            <span className="font-medium text-gray-900">
                              ±{Math.round(rating.rd)}
                            </span>
                          </div>

                          {rating.lastMatchDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Match:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(rating.lastMatchDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {rating.matchCount === 0 && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          Base rating - Play matches to establish your rank!
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Career Statistics */}
        {careerStats && <CareerStatsCard stats={careerStats} />}

        {/* Performance by Sport */}
        {sportsStats && sportsStats.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance by Sport
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sportsStats.map((sport) => (
                <SportRatingCard key={sport.sportId} sport={sport} userId={authUser?.id} />
              ))}
            </div>
          </div>
        )}

        {/* Match History */}
        {matchHistory && matchHistory.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Match History
              </h2>
              <select
                value={selectedSport}
                onChange={(e) => handleSportFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all font-medium"
              >
                <option value="all">All Sports</option>
                {sportsStats.map((sport) => (
                  <option key={sport.sportId} value={sport.sportId}>
                    {sport.sportId.charAt(0).toUpperCase() + sport.sportId.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <MatchHistoryTable matches={matchHistory} />
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
