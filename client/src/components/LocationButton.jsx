import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { hasGPSLocation } from '../utils/distance'

const LocationButton = ({ onLocationUpdate, compact = false, removeMode = false }) => {
  const { user, refreshContext } = useAuth()
  const [updating, setUpdating] = useState(false)

  const handleRemoveLocation = async () => {
    if (!confirm('Remove GPS location access? You will still see tournaments in your city.')) {
      return
    }

    setUpdating(true)

    try {
      // Keep city and state but remove GPS coordinates
      await api.patch('/auth/profile', {
        latitude: null,
        longitude: null,
        locality: null
      })

      await refreshContext()

      if (onLocationUpdate) {
        onLocationUpdate()
      }

      alert('✅ GPS location removed. Showing tournaments in your city.')
    } catch (error) {
      console.error('Error removing location:', error)
      alert('Error removing location. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setUpdating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocode to get city/state/locality
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
          )
          const data = await response.json()

          const detectedCity = data.address?.city ||
                              data.address?.town ||
                              data.address?.village ||
                              data.address?.state_district || ''

          const detectedState = data.address?.state || ''

          const detectedLocalityName = data.address?.neighbourhood ||
                                       data.address?.suburb ||
                                       data.address?.locality ||
                                       data.address?.hamlet ||
                                       data.address?.residential || ''

          // Update user profile
          await api.patch('/auth/profile', {
            city: detectedCity,
            state: detectedState,
            locality: detectedLocalityName,
            latitude,
            longitude
          })

          // Refresh user context
          await refreshContext()

          // Callback for any additional actions
          if (onLocationUpdate) {
            onLocationUpdate()
          }

          alert(`✅ Location updated!\n${detectedLocalityName ? `${detectedLocalityName}, ` : ''}${detectedCity}`)
        } catch (error) {
          console.error('Error updating location:', error)
          alert('Error updating location. Please try again.')
        } finally {
          setUpdating(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Could not get your location. Please check browser permissions.')
        setUpdating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (compact) {
    return (
      <button
        onClick={removeMode ? handleRemoveLocation : handleUseCurrentLocation}
        disabled={updating}
        style={{
          background: removeMode ? 'rgba(236, 72, 153, 0.1)' : 'rgba(79, 255, 176, 0.1)',
          border: removeMode ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(79, 255, 176, 0.3)',
          color: removeMode ? '#ec4899' : '#4fffb0',
          padding: '0.5rem 0.9rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: updating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: updating ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!updating) e.target.style.background = removeMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(79, 255, 176, 0.15)'
        }}
        onMouseLeave={(e) => {
          if (!updating) e.target.style.background = removeMode ? 'rgba(236, 72, 153, 0.1)' : 'rgba(79, 255, 176, 0.1)'
        }}
      >
        <svg style={{ width: '0.9rem', height: '0.9rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {removeMode ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </>
          )}
        </svg>
        {updating ? (removeMode ? 'Removing...' : 'Updating...') : (removeMode ? 'Remove' : 'Use Location')}
      </button>
    )
  }

  return (
    <button
      onClick={removeMode ? handleRemoveLocation : handleUseCurrentLocation}
      disabled={updating}
      style={{
        background: removeMode
          ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))'
          : 'linear-gradient(135deg, rgba(79, 255, 176, 0.1), rgba(0, 212, 255, 0.1))',
        border: removeMode
          ? '1px solid rgba(236, 72, 153, 0.3)'
          : '1px solid rgba(79, 255, 176, 0.3)',
        color: removeMode ? '#ec4899' : '#4fffb0',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: 700,
        cursor: updating ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: "'Barlow Condensed', sans-serif",
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: updating ? 0.6 : 1,
        boxShadow: removeMode
          ? '0 4px 15px rgba(236, 72, 153, 0.15)'
          : '0 4px 15px rgba(79, 255, 176, 0.15)'
      }}
      onMouseEnter={(e) => {
        if (!updating) {
          e.target.style.background = removeMode
            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(239, 68, 68, 0.15))'
            : 'linear-gradient(135deg, rgba(79, 255, 176, 0.15), rgba(0, 212, 255, 0.15))'
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = removeMode
            ? '0 6px 20px rgba(236, 72, 153, 0.25)'
            : '0 6px 20px rgba(79, 255, 176, 0.25)'
        }
      }}
      onMouseLeave={(e) => {
        if (!updating) {
          e.target.style.background = removeMode
            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))'
            : 'linear-gradient(135deg, rgba(79, 255, 176, 0.1), rgba(0, 212, 255, 0.1))'
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = removeMode
            ? '0 4px 15px rgba(236, 72, 153, 0.15)'
            : '0 4px 15px rgba(79, 255, 176, 0.15)'
        }
      }}
    >
      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {removeMode ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        )}
      </svg>
      {updating
        ? (removeMode ? 'Removing Location...' : 'Updating Location...')
        : (removeMode ? 'Remove My Current Location' : 'Update My Location')
      }
    </button>
  )
}

export default LocationButton
