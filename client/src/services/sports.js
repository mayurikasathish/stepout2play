import api from './api'

export const getAllSports = async () => {
  const response = await api.get('/sports')
  return response.data
}

export const getSportById = async (sportId) => {
  const response = await api.get(`/sports/${sportId}`)
  return response.data
}

export const getScoringRules = async (sportId) => {
  const response = await api.get(`/sports/${sportId}/rules`)
  return response.data
}
