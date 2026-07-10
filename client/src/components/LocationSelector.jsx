import { useState, useEffect, useRef } from 'react'
import indianCities from '../data/indianCities.json'

const LocationSelector = ({ city, state, locality, onLocationChange, darkMode = false }) => {
  const [searchTerm, setSearchTerm] = useState(city || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredCities, setFilteredCities] = useState([])
  const [gettingLocation, setGettingLocation] = useState(false)
  const [detectedLocality, setDetectedLocality] = useState(locality || '')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (city) {
      setSearchTerm(city)
    }
  }, [city])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySearch = (value) => {
    setSearchTerm(value)

    if (value.trim().length === 0) {
      setFilteredCities([])
      setShowDropdown(false)
      onLocationChange({ city: '', state: '' })
      return
    }

    const filtered = indianCities
      .filter(item =>
        item.city.toLowerCase().includes(value.toLowerCase()) ||
        item.state.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 10) // Show max 10 results

    setFilteredCities(filtered)
    setShowDropdown(true)
  }

  const handleCitySelect = (selectedCity) => {
    setSearchTerm(selectedCity.city)
    setShowDropdown(false)
    setDetectedLocality('')
    onLocationChange({
      city: selectedCity.city,
      state: selectedCity.state,
      locality: '',
      latitude: null,
      longitude: null
    })
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Reverse geocode to get city name
        try {
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

          // Try to match with our cities list
          const matchedCity = indianCities.find(
            item => item.city.toLowerCase() === detectedCity.toLowerCase()
          )

          if (matchedCity) {
            setSearchTerm(matchedCity.city)
            setDetectedLocality(detectedLocalityName)
            onLocationChange({
              city: matchedCity.city,
              state: matchedCity.state,
              locality: detectedLocalityName,
              latitude,
              longitude
            })
          } else {
            // Use detected city/state even if not in our list
            setSearchTerm(detectedCity)
            setDetectedLocality(detectedLocalityName)
            onLocationChange({
              city: detectedCity,
              state: detectedState,
              locality: detectedLocalityName,
              latitude,
              longitude
            })
          }

          const locationString = detectedLocalityName
            ? `${detectedLocalityName}, ${detectedCity}`
            : detectedCity
          alert(`✅ Location detected: ${locationString}`)
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          // Still save coordinates even if city detection fails
          onLocationChange({
            city: searchTerm || '',
            state: state || '',
            locality: detectedLocality,
            latitude,
            longitude
          })
          alert('✅ GPS coordinates saved! We can now show you exact distances to tournaments.')
        } finally {
          setGettingLocation(false)
        }
      },
      (error) => {
        setGettingLocation(false)
        console.error('Geolocation error:', error)

        let errorMessage = 'Could not get your location. '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'An unknown error occurred.'
        }

        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const inputStyle = darkMode ? {
    background: 'rgba(10, 22, 40, 0.6)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  } : {}

  const labelStyle = darkMode ? {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: "'Barlow Condensed', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  } : {}

  return (
    <div className="space-y-4">
      {/* City Input with Autocomplete */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          City *
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleCitySearch(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim().length > 0) {
              handleCitySearch(searchTerm)
            }
          }}
          placeholder="Start typing city name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          style={inputStyle}
          required
        />

        {/* Dropdown */}
        {showDropdown && filteredCities.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
            style={{
              background: darkMode ? 'rgba(10, 22, 40, 0.98)' : '#fff',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {filteredCities.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleCitySelect(item)}
                className="w-full px-4 py-3 text-left transition-all"
                style={{
                  color: darkMode ? '#fff' : '#000',
                  borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = darkMode ? 'rgba(79, 255, 176, 0.1)' : '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                <div className="font-medium">{item.city}</div>
                <div className="text-xs" style={{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280' }}>
                  {item.state}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* State (Auto-populated, Read-only) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          State
        </label>
        <input
          type="text"
          value={state || ''}
          readOnly
          placeholder="Auto-filled from city"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none cursor-not-allowed opacity-75"
          style={{
            ...(darkMode ? {
              background: 'rgba(10, 22, 40, 0.4)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            } : {
              background: '#f9fafb'
            })
          }}
        />
      </div>

      {/* Locality (Auto-populated from GPS, Read-only) */}
      {detectedLocality && (
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>
            Locality/Area
          </label>
          <input
            type="text"
            value={detectedLocality}
            readOnly
            placeholder="Detected from GPS"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none cursor-not-allowed opacity-75"
            style={{
              ...(darkMode ? {
                background: 'rgba(10, 22, 40, 0.4)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              } : {
                background: '#f9fafb'
              })
            }}
          />
        </div>
      )}

      {/* Use Current Location Button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={gettingLocation}
        className="w-full px-4 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(79, 255, 176, 0.1), rgba(0, 212, 255, 0.1))'
            : 'linear-gradient(135deg, rgba(79, 255, 176, 0.2), rgba(0, 212, 255, 0.2))',
          border: darkMode
            ? '1px solid rgba(79, 255, 176, 0.3)'
            : '1px solid rgba(79, 255, 176, 0.4)',
          color: darkMode ? '#4fffb0' : '#059669',
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {gettingLocation ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Getting Location...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use Current Location
          </>
        )}
      </button>

      {darkMode && (
        <p className="text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Enable GPS to see exact distances to tournaments
        </p>
      )}
    </div>
  )
}

export default LocationSelector
