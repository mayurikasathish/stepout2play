import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import Carousel from '../components/Carousel'
import api from '../services/api'

const HeartIcon = ({ filled, ...props }) => (
  <svg {...props} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const UsersIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const TrophyIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const MailIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const colorSchemes = {
  blue: { primary: 'from-blue-500 to-blue-700', accent: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  green: { primary: 'from-green-500 to-green-700', accent: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  purple: { primary: 'from-purple-500 to-purple-700', accent: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  orange: { primary: 'from-orange-500 to-orange-700', accent: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  pink: { primary: 'from-pink-500 to-pink-700', accent: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  teal: { primary: 'from-teal-500 to-teal-700', accent: 'bg-teal-600', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' }
}

const OrgMiniSitePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinFormData, setJoinFormData] = useState({
    role: 'MEMBER',
    email: user?.email || '',
    reason: '',
    experience: ''
  })
  const [submittingJoin, setSubmittingJoin] = useState(false)

  useEffect(() => {
    loadOrg()
  }, [id])

  const loadOrg = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/orgs/${id}/public`)
      if (res.data.success) {
        setOrg(res.data.org || res.data.organization)
        // TODO: Add follower count and isFollowing from backend
        setFollowersCount(0)
        setIsFollowing(false)
      }
    } catch (err) {
      console.error('Error loading org:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/orgs/${id}/follow`)
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        setToastMessage('Unfollowed organization')
        setToastType('success')
      } else {
        await api.post(`/orgs/${id}/follow`)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        setToastMessage('Following organization!')
        setToastType('success')
      }
      setShowToast(true)
    } catch (err) {
      console.error('Error following org:', err)
      setToastMessage(err.response?.data?.error || 'Failed to follow organization')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleJoin = () => {
    if (!user) {
      setToastMessage('Please login to join this organization')
      setToastType('error')
      setShowToast(true)
      return
    }
    setJoinFormData({ ...joinFormData, email: user.email })
    setShowJoinModal(true)
  }

  const handleSubmitJoinRequest = async () => {
    if (!joinFormData.reason.trim()) {
      setToastMessage('Please explain why you want to join')
      setToastType('error')
      setShowToast(true)
      return
    }

    setSubmittingJoin(true)
    try {
      await api.post(`/orgs/${org.id}/join-request`, joinFormData)
      setShowJoinModal(false)
      setToastMessage('Join request sent successfully!')
      setToastType('success')
      setShowToast(true)
      setJoinFormData({ role: 'MEMBER', email: user?.email || '', reason: '', experience: '' })
    } catch (err) {
      console.error('Error submitting join request:', err)
      setToastMessage(err.response?.data?.error || 'Failed to send join request')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSubmittingJoin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="glass-card rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h2>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
            >
              Browse Organizations
            </button>
          </div>
        </div>
      </div>
    )
  }

  const scheme = colorSchemes[org.colorScheme || 'blue']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />

      {/* Banner */}
      {org.bannerImageUrl ? (
        <div className="w-full h-64 md:h-96 relative">
          <img src={org.bannerImageUrl} alt={org.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      ) : (
        <div className={`w-full h-64 md:h-96 bg-gradient-to-br ${scheme.primary}`}></div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Header Card with Half-Out Logo (LinkedIn style) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl -mt-12 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 relative">
            {/* Logo - Positioned to sit half above the card */}
            <div className={`w-20 h-20 shrink-0 bg-gradient-to-br ${scheme.primary} rounded-full flex items-center justify-center shadow-2xl text-white text-3xl font-bold border-4 border-white -mt-16 md:-mt-20`}>
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                org.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Name & Tagline */}
            <div className="flex-1 pt-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{org.name}</h1>
              {org.tagline && (
                <p className="text-lg text-gray-600 mb-4">{org.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {(org.memberCount || 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4" />
                    <span>{org.memberCount} members</span>
                  </div>
                )}
                {(org.tournamentCount || 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrophyIcon className="w-4 h-4" />
                    <span>{org.tournamentCount} tournaments</span>
                  </div>
                )}
                {followersCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <HeartIcon className="w-4 h-4" filled={false} />
                    <span>{followersCount} followers</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions or Role Badge */}
            {org.userRole ? (
              <div className="shrink-0 flex items-center gap-3">
                <div className={`px-6 py-3 rounded-xl font-semibold text-center ${
                  org.userRole === 'OWNER' ? 'bg-primary-100 text-primary-700' :
                  org.userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {org.userRole === 'OWNER' ? '👑 Owner' :
                   org.userRole === 'ADMIN' ? '⚡ Admin' :
                   '✓ Member'}
                </div>
                {(org.userRole === 'OWNER' || org.userRole === 'ADMIN') && (
                  <button
                    onClick={() => navigate('/orgs/edit')}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
                  >
                    ✏️ Edit Minisite
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border-2 ${
                    isFollowing
                      ? 'border-gray-400 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      : 'border-gray-400 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <HeartIcon className="w-5 h-5" filled={isFollowing} />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleJoin}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
                >
                  Join Us
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Photo Gallery Carousel */}
        {org.photoGallery && org.photoGallery.length > 0 && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Moments & Memories</h2>
            <Carousel
              images={org.photoGallery}
              autoPlayInterval={3000}
            />
          </div>
        )}

        {/* Motto / Culture */}
        {org.motto && (
          <div className={`${scheme.light} rounded-2xl p-8 mb-8 border-l-4 ${scheme.border}`}>
            <h2 className={`text-xl font-bold ${scheme.text} mb-3`}>Our Motto & Culture</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{org.motto}</p>
          </div>
        )}

        {/* About Us */}
        {org.aboutUs && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{org.aboutUs}</p>
          </div>
        )}

        {/* Join Us Info */}
        {org.joinUsInfo && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Us</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{org.joinUsInfo}</p>
            <button
              onClick={handleJoin}
              className={`px-6 py-3 ${scheme.accent} text-white font-medium rounded-xl hover:opacity-90 transition-all`}
            >
              Request to Join
            </button>
          </div>
        )}

        {/* Contact */}
        {(org.contactEmail || org.contactPhone) && (
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <div className="space-y-4">
              {org.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${scheme.light} rounded-lg flex items-center justify-center`}>
                    <MailIcon className={`w-5 h-5 ${scheme.text}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${org.contactEmail}`} className={`font-medium ${scheme.text} hover:underline`}>
                      {org.contactEmail}
                    </a>
                  </div>
                </div>
              )}
              {org.contactPhone && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${scheme.light} rounded-lg flex items-center justify-center`}>
                    <PhoneIcon className={`w-5 h-5 ${scheme.text}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${org.contactPhone}`} className={`font-medium ${scheme.text} hover:underline`}>
                      {org.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Request to Join</h3>
            <p className="text-gray-600 mb-6">{org.name}</p>

            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role you're applying for
                </label>
                <select
                  value={joinFormData.role}
                  onChange={(e) => setJoinFormData({ ...joinFormData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={joinFormData.email}
                  onChange={(e) => setJoinFormData({ ...joinFormData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join? *
                </label>
                <textarea
                  value={joinFormData.reason}
                  onChange={(e) => setJoinFormData({ ...joinFormData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Tell us why you're interested in joining this organization..."
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any prior experience? (Optional)
                </label>
                <textarea
                  value={joinFormData.experience}
                  onChange={(e) => setJoinFormData({ ...joinFormData, experience: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Relevant sports experience, previous organizations, skills..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJoinRequest}
                disabled={submittingJoin}
                className={`flex-1 px-6 py-3 ${scheme.accent} text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submittingJoin ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default OrgMiniSitePage
