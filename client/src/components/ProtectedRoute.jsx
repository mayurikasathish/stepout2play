import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#F8F9FA',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #D8F3DC',
          borderTop: '3px solid #1B4332',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />

  // Logged in but hasn't completed onboarding → go to onboarding
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />

  return children
}

export default ProtectedRoute