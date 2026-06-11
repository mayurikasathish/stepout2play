import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const sportsList = ['Badminton', 'Tennis', 'Table Tennis', 'Squash', 'Pickleball', 'Padel']

export default function OnboardingPage() {
  const { user, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
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

  const finishOnboarding = async (withOrg = false, orgNameVal = '') => {
    setLoading(true)
    setError('')
    try {
      await saveProfile()

      if (withOrg) {
        if (!orgNameVal.trim()) { setError('Please enter an organization name'); setLoading(false); return }
        await api.post('/orgs', { name: orgNameVal.trim() })
      }

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

  // ── Step 1: Profile ────────────────────────────────────────────────────────
  if (step === 1) {
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
                setError('')
                setStep(2)
              }}
              className="w-full mt-6 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: What brings you here? (organic, not forcing a role) ────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">What brings you here?</h1>
            <p className="text-gray-500">Choose what you want to do first. You can always do both.</p>
          </div>

          <div className="space-y-4">
            {/* Organizer path */}
            <button
              onClick={() => setStep(3)}
              className="w-full p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-primary-400 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center text-2xl transition-all flex-shrink-0 font-bold text-primary-600">
                  O
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">Run a tournament</h3>
                  <p className="text-sm text-gray-500">Create an org, set up events, manage draws</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            {/* Player path */}
            <button
              onClick={() => finishOnboarding(false)}
              disabled={loading}
              className="w-full p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-primary-400 hover:shadow-md transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center text-2xl transition-all flex-shrink-0 font-bold text-green-600">
                  P
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">Play in tournaments</h3>
                  <p className="text-sm text-gray-500">Browse events, register, track your matches</p>
                </div>
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </div>
            </button>

            {/* Do both */}
            <p className="text-center text-xs text-gray-400 pt-2">
              Either way, you can switch between both roles anytime from your dashboard
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button onClick={() => setStep(1)} className="w-full mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Organization name ──────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Name your organization</h1>
            <p className="text-gray-500">This is what players will see when browsing your tournaments</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <label className="block text-sm font-medium text-gray-900 mb-2">Organization Name *</label>
            <input
              type="text"
              value={orgName}
              onChange={e => { setOrgName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && finishOnboarding(true, orgName)}
              placeholder="e.g. NBC Sports Academy"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-400 mb-6">You can add more details like logo and description later</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} disabled={loading}
                className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium transition-all disabled:opacity-50">
                Back
              </button>
              <button onClick={() => finishOnboarding(true, orgName)} disabled={loading}
                className="flex-1 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Setting up...
                  </>
                ) : 'Create and get started'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
