import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    if (token) {
      localStorage.setItem('authToken', token)

      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.user) {
            localStorage.setItem('user', JSON.stringify(data.data.user))
            setUser(data.data.user)
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/login?error=oauth_failed', { replace: true })
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error)
          navigate('/login?error=oauth_failed', { replace: true })
        })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, setUser])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
