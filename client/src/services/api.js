import axios from 'axios'

// All backend routes are under /api
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if user is already logged in (has a token)
    // Don't redirect on login/signup failures
    if (error.response?.status === 401 && localStorage.getItem('authToken')) {
      // Token expired or invalid - only redirect if not on login/signup
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('authToken')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
