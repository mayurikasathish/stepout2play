import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function OnboardingPage() {
  const { user, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [choice, setChoice] = useState(null) // 'org' | 'player'
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return setError('Please enter an organization name')
    setLoading(true)
    setError('')
    try {
      await api.post('/orgs', { name: orgName })
      await refreshContext()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinAsPlayer = async () => {
    setLoading(true)
    try {
      // Just mark onboarding complete — they'll find tournaments from dashboard
      await api.patch('/auth/onboarding', { onboardingComplete: true })
      await refreshContext()
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 24px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Welcome, {user?.firstName}
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
          What would you like to do first? You can always do both.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Create Org card */}
          <button
            onClick={() => setChoice('org')}
            style={{
              padding: '20px 24px',
              border: `2px solid ${choice === 'org' ? '#1B4332' : '#E5E7EB'}`,
              borderRadius: 12,
              background: choice === 'org' ? '#D8F3DC' : '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
              🏆 Create an organization
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Run tournaments, manage events, and bring your players together
            </div>
          </button>

          {/* Join as player card */}
          <button
            onClick={() => setChoice('player')}
            style={{
              padding: '20px 24px',
              border: `2px solid ${choice === 'player' ? '#1B4332' : '#E5E7EB'}`,
              borderRadius: 12,
              background: choice === 'player' ? '#D8F3DC' : '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
              🎾 Join tournaments as a player
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Register for events, track your matches, and build your sports profile
            </div>
          </button>
        </div>

        {/* Org name input — only shows when org is chosen */}
        {choice === 'org' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Organization name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. NBC Sports Academy"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
              onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
              autoFocus
            />
          </div>
        )}

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        {choice && (
          <button
            onClick={choice === 'org' ? handleCreateOrg : handleJoinAsPlayer}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1B4332',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Setting up...' : 'Continue →'}
          </button>
        )}

        {choice && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
            You can do both — this just sets up your first view
          </p>
        )}
      </div>
    </div>
  )
}