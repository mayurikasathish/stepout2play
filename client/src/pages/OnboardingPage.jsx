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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .onboarding-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .ambient-orb-1 {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, #1B4332 0%, transparent 70%);
          filter: blur(90px);
          opacity: 0.35;
          top: -150px;
          left: -150px;
          animation: drift1 20s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .ambient-orb-2 {
          position: fixed;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, #0a3d62 0%, transparent 70%);
          filter: blur(90px);
          opacity: 0.25;
          bottom: -100px;
          right: -100px;
          animation: drift2 25s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }

        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-25px, 25px); }
        }

        .onboarding-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 640px;
          background: rgba(10, 22, 40, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.15);
          border-radius: 20px;
          padding: 3rem 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        .onboarding-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .welcome-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(2rem, 5vw, 3rem);
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          margin: 0 0 0.5rem;
          line-height: 1.1;
        }

        .welcome-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem;
          background: rgba(10, 22, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: rgba(79, 255, 176, 0.4);
          background: rgba(10, 22, 40, 0.8);
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-textarea {
          resize: none;
        }

        .sports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .sport-button {
          padding: 0.85rem;
          background: rgba(10, 22, 40, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sport-button:hover {
          border-color: rgba(79, 255, 176, 0.3);
          background: rgba(79, 255, 176, 0.05);
        }

        .sport-button.active {
          border-color: rgba(79, 255, 176, 0.6);
          background: rgba(79, 255, 176, 0.15);
          color: #4fffb0;
        }

        .grid-cols-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .error-box {
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          margin-top: 1.5rem;
        }

        .error-text {
          color: #f87171;
          font-size: 0.9rem;
          font-family: 'Barlow', sans-serif;
        }

        .submit-button {
          width: 100%;
          padding: 1.1rem;
          margin-top: 2rem;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.9), rgba(16, 185, 129, 0.9));
          border: none;
          border-radius: 12px;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(79, 255, 176, 1), rgba(16, 185, 129, 1));
          transform: translateY(-2px);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .optional-label {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          text-transform: none;
          font-size: 0.85rem;
        }

        @media (max-width: 640px) {
          .onboarding-card {
            padding: 2rem 1.5rem;
          }

          .grid-cols-2 {
            grid-template-columns: 1fr;
          }

          .sports-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="onboarding-container">
        {/* Ambient orbs */}
        <div className="ambient-orb-1"></div>
        <div className="ambient-orb-2"></div>

        <div className="onboarding-card">
          <div className="onboarding-header">
            <h1 className="welcome-title">Welcome, {user?.firstName}</h1>
            <p className="welcome-subtitle">Let's set up your profile - takes 30 seconds</p>
          </div>

          <div className="grid-cols-2">
            <div className="form-section">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                value={profile.dob}
                onChange={setP('dob')}
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Gender *</label>
              <select value={profile.gender} onChange={setP('gender')} className="form-input">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">City *</label>
            <input
              type="text"
              value={profile.city}
              onChange={setP('city')}
              placeholder="e.g. Bangalore"
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label className="form-label">Phone <span className="optional-label">(optional)</span></label>
            <input
              type="tel"
              value={profile.phone}
              onChange={setP('phone')}
              placeholder="+91 98765 43210"
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label className="form-label">
              Sports you play <span className="optional-label">(select any)</span>
            </label>
            <div className="sports-grid">
              {sportsList.map(sport => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`sport-button ${profile.sports.includes(sport) ? 'active' : ''}`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">
              Bio <span className="optional-label">(optional)</span>
              <span style={{
                float: 'right',
                fontSize: '0.85rem',
                color: profile.bio?.length > 500 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: 600,
                textTransform: 'none'
              }}>
                {profile.bio?.length || 0}/500
              </span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setProfile(p => ({ ...p, bio: e.target.value }))
                }
              }}
              rows={3}
              placeholder="A few words about yourself and your sports journey..."
              className="form-input form-textarea"
              maxLength={500}
            />
          </div>

          {error && (
            <div className="error-box">
              <p className="error-text">{error}</p>
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
            className="submit-button"
          >
            {loading ? 'Completing...' : 'Complete Setup'}
            {!loading && (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
