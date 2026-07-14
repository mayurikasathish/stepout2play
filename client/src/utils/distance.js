/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

const toRad = (degrees) => {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`
  } else {
    return `${Math.round(distanceKm)} km away`
  }
}

/**
 * Check if user has GPS coordinates
 * @param {object} user - User object with latitude and longitude
 * @returns {boolean} True if user has valid GPS coordinates
 */
export const hasGPSLocation = (user) => {
  return user && user.latitude != null && user.longitude != null
}

/**
 * Sort tournaments by distance from user
 * @param {array} tournaments - Array of tournament objects with latitude/longitude
 * @param {object} user - User object with latitude/longitude
 * @returns {array} Sorted tournaments with distance property added
 */
export const sortTournamentsByDistance = (tournaments, user) => {
  if (!hasGPSLocation(user)) {
    return tournaments
  }

  return tournaments
    .filter(t => t.latitude != null && t.longitude != null)
    .map(t => ({
      ...t,
      distance: calculateDistance(
        parseFloat(user.latitude),
        parseFloat(user.longitude),
        parseFloat(t.latitude),
        parseFloat(t.longitude)
      )
    }))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Group tournaments by city (for users without GPS)
 * @param {array} tournaments - Array of tournament objects
 * @param {string} userCity - User's city
 * @returns {array} Tournaments with same city first
 */
export const sortTournamentsByCity = (tournaments, userCity) => {
  if (!userCity) return tournaments

  return tournaments.sort((a, b) => {
    const aInCity = a.city?.toLowerCase() === userCity.toLowerCase()
    const bInCity = b.city?.toLowerCase() === userCity.toLowerCase()

    if (aInCity && !bInCity) return -1
    if (!aInCity && bInCity) return 1
    return 0
  })
}
