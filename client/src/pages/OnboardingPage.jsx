import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const sportsList = ['Badminton', 'Tennis', 'Table Tennis', 'Squash', 'Pickleball', 'Padel']

export default function OnboardingPage() {
  const { user, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState({
    dob: '', gender: '', city: '', phone: '', bio: '', sports: []
  })

  const setP = (field) => (e) => setProfile(p => ({ ...p, [field]: e.target.value }))
  const toggleSport = (sport) => setProfile(p => ({
    ...p,
    sports: p.sports.includes(sport) ? p.sports.filter(s => s !== sport) : [...p.sports, sport]
  }))

  const saveProfile = async () => {
    const payload = { ...profile }
    if (payload.dob) payload.dob = new Date(payload.dob).toISOString()
    await api.patch('/auth/profile', payload)
  }

  const finishOnboarding = async () => {
    setLoading(true)
    setError('')
    try {
      await saveProfile()

      // Mark onboarding complete
      await api.patch('/auth/onboarding', { onboardingComplete: true })
      await refreshContext()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0] || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all'

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.firstName}</h1>
            <p className="text-gray-500">Let's set up your profile - takes 30 seconds</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Date of Birth *</label>
                  <input type="date" value={profile.dob} onChange={setP('dob')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Gender *</label>
                  <select value={profile.gender} onChange={setP('gender')} className={inputCls}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">City *</label>
                <input type="text" value={profile.city} onChange={setP('city')}
                  placeholder="e.g. Bangalore" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone (optional)</label>
                <input type="tel" value={profile.phone} onChange={setP('phone')}
                  placeholder="+91 98765 43210" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Sports you play <span className="text-gray-400 font-normal">(select any)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sportsList.map(sport => (
                    <button key={sport} type="button" onClick={() => toggleSport(sport)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        profile.sports.includes(sport)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}>
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Bio (optional)</label>
                <textarea value={profile.bio} onChange={setP('bio')} rows={3}
                  placeholder="A few words about yourself and your sports journey..."
                  className={inputCls + ' resize-none'} />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={() => {
                if (!profile.dob || !profile.gender || !profile.city) {
                  setError('Date of birth, gender and city are required')
                  return
                }
                if (profile.sports.length === 0) {
                  setError('Please select at least one sport')
                  return
                }
                setError('')
                finishOnboarding()
              }}
              disabled={loading}
              className="w-full mt-6 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing...' : 'Complete Setup'}
              {!loading && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    )
}
