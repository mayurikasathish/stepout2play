import api from './api'

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email: email.trim(),
      password
    })
    const { token, user } = response.data.data
    localStorage.setItem('authToken', token)
    return { token, user }
  },

  async register(userData) {
    const response = await api.post('/auth/register', {
      ...userData,
      email: userData.email.trim(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim()
    })
    const { token, user } = response.data.data
    localStorage.setItem('authToken', token)
    return { token, user }
  },

  // Returns { user, context } - context has orgs and isOrganizer
  async getMe() {
    const response = await api.get('/auth/me')
    return response.data  // { success, user, context }
  },

  async completeOnboarding() {
    await api.patch('/auth/onboarding')
  },

  logout() {
    localStorage.removeItem('authToken')
  },

  getToken() {
    return localStorage.getItem('authToken')
  },

  isAuthenticated() {
    return !!this.getToken()
  },
}

export default authService