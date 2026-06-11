import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  // context holds org memberships and derived flags like isOrganizer
  const [context, setContext] = useState({ orgs: [], isOrganizer: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken()
      if (token) {
        try {
          const data = await authService.getMe()
          if (data.success) {
            setUser(data.user)
            setContext(data.context)
          }
        } catch (error) {
          // Token invalid or expired - clear it
          authService.logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const { user } = await authService.login(email, password)
    // After login, fetch full context (orgs etc.)
    const data = await authService.getMe()
    if (data.success) {
      setUser(data.user)
      setContext(data.context)
      return data.user // Return the user data so caller can check onboarding status
    } else {
      setUser(user)
      return user
    }
  }

  const register = async (userData) => {
    const { user } = await authService.register(userData)
    const data = await authService.getMe()
    if (data.success) {
      setUser(data.user)
      setContext(data.context)
      return data.user
    } else {
      setUser(user)
      return user
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setContext({ orgs: [], isOrganizer: false })
  }

  // Call this after any action that might change the user's org memberships
  // e.g. after creating an org, after accepting an invite
  const refreshContext = async () => {
    const data = await authService.getMe()
    if (data.success) {
      setUser(data.user)
      setContext(data.context)
    }
  }

  const value = {
    user,
    context,
    loading,
    login,
    register,
    logout,
    refreshContext,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}