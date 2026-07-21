import { useState, useEffect, useRef } from 'react'
import indianCities from '../data/indianCities.json'

const VenueLocationSelector = ({
  city,
  state,
  venueName,
  venueAddress,
  latitude,
  longitude,
  onLocationChange,
  darkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState(city || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredCities, setFilteredCities] = useState([])
  const [geocoding, setGeocoding] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [geocodeResults, setGeocodeResults] = useState([])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showManualCoords, setShowManualCoords] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [showMap, setShowMap] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (city) setSearchTerm(city)
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
      onLocationChange({ city: '', state: '', venueName, venueAddress, latitude: null, longitude: null })
      return
    }

    const filtered = indianCities
      .filter(item =>
        item.city.toLowerCase().includes(value.toLowerCase()) ||
        item.state.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 10)

    setFilteredCities(filtered)
    setShowDropdown(true)
  }

  const handleCitySelect = (selectedCity) => {
    setSearchTerm(selectedCity.city)
    setShowDropdown(false)
    onLocationChange({
      city: selectedCity.city,
      state: selectedCity.state,
      venueName,
      venueAddress,
      latitude: null,
      longitude: null
    })
  }

  const handleGeocodeAddress = async () => {
    if (!city) {
      alert('Please select city first')
      return
    }

    if (!venueAddress && !venueName) {
      alert('Please enter venue name or address')
      return
    }

    setGeocoding(true)
    setGeocodeResults([])

    try {
      let allResults = []

      // Strategy 1: Try full address if provided (most specific)
      if (venueAddress) {
        const fullQuery = `${venueAddress}, ${city}, ${state || ''}, India`.replace(', ,', ',')
        console.log('🔍 Trying full address:', fullQuery)

        const response1 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=5&accept-language=en&addressdetails=1`
        )
        const data1 = await response1.json()
        if (data1.length > 0) {
          allResults = [...allResults, ...data1]
        }
      }

      // Strategy 2: Try venue name + city (if venue name provided)
      if (venueName && allResults.length < 3) {
        const venueQuery = `${venueName}, ${city}, ${state || ''}, India`.replace(', ,', ',')
        console.log('🔍 Trying venue name:', venueQuery)

        const response2 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venueQuery)}&limit=5&accept-language=en&addressdetails=1`
        )
        const data2 = await response2.json()
        if (data2.length > 0) {
          allResults = [...allResults, ...data2]
        }
      }

      // Strategy 3: Try just address/locality + city (broader search)
      if (venueAddress && allResults.length < 3) {
        const addressQuery = `${venueAddress}, ${city}, India`
        console.log('🔍 Trying address only:', addressQuery)

        const response3 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5&accept-language=en&addressdetails=1`
        )
        const data3 = await response3.json()
        if (data3.length > 0) {
          allResults = [...allResults, ...data3]
        }
      }

      if (allResults.length === 0) {
        alert('❌ No results found. Try:\n\n• Use just the area/locality name (e.g., "Koramangala", "Andheri West")\n• Remove building/complex names\n• Use "Current Location" if at venue\n• Or use manual coordinates')
        setGeocoding(false)
        return
      }

      // Remove duplicates based on lat/lon
      const uniqueResults = []
      const seen = new Set()
      for (const result of allResults) {
        const key = `${result.lat},${result.lon}`
        if (!seen.has(key)) {
          seen.add(key)
          uniqueResults.push(result)
        }
      }

      // Filter results within selected city
      const filteredResults = uniqueResults.filter(result => {
        const addressParts = result.display_name.toLowerCase()
        return addressParts.includes(city.toLowerCase())
      })

      if (filteredResults.length === 0) {
        // Show all results if city filter too strict
        console.log('⚠️ City filter removed some results, showing all')
        if (uniqueResults.length === 1) {
          confirmGeocodeResult(uniqueResults[0])
        } else {
          setGeocodeResults(uniqueResults.slice(0, 5))
          setShowResultsModal(true)
        }
        setGeocoding(false)
        return
      }

      if (filteredResults.length === 1) {
        // Single clear match - show confirmation
        confirmGeocodeResult(filteredResults[0])
      } else {
        // Multiple matches - let user choose
        setGeocodeResults(filteredResults.slice(0, 5))
        setShowResultsModal(true)
      }

    } catch (error) {
      console.error('Geocoding error:', error)
      alert('Error geocoding address. Please try again or use manual coordinates.')
    } finally {
      setGeocoding(false)
    }
  }

  const confirmGeocodeResult = (result) => {
    // Auto-populate venue address from the chosen result
    const addressParts = result.display_name.split(',').map(s => s.trim())
    // Take the first 2-3 parts (usually street, area) before city
    const cityIndex = addressParts.findIndex(part => part.toLowerCase().includes(city.toLowerCase()))
    const relevantAddress = cityIndex > 0
      ? addressParts.slice(0, cityIndex).join(', ')
      : addressParts.slice(0, 2).join(', ')

    onLocationChange({
      city,
      state,
      venueName,
      venueAddress: relevantAddress || venueAddress, // Auto-populate or keep existing
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    })
    setShowResultsModal(false)
    setShowMap(true)
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords
        onLocationChange({
          city,
          state,
          venueName,
          venueAddress,
          latitude: lat,
          longitude: lon
        })
        setGettingLocation(false)
        setShowMap(true)
        alert('✅ Current location saved as venue coordinates!')
      },
      (error) => {
        setGettingLocation(false)
        alert('Could not get your location. Please check browser permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat)
    const lon = parseFloat(manualLon)

    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid numbers for latitude and longitude')
      return
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180')
      return
    }

    onLocationChange({
      city,
      state,
      venueName,
      venueAddress,
      latitude: lat,
      longitude: lon
    })
    setShowManualCoords(false)
    setShowMap(true)
    alert('✅ Manual coordinates saved!')
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

      {/* State (Read-only) */}
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

      {/* Coordinates Display & Map */}
      {latitude && longitude && (
        <div className="p-4 rounded-xl" style={{
          background: darkMode ? 'rgba(79, 255, 176, 0.1)' : 'rgba(79, 255, 176, 0.2)',
          border: darkMode ? '1px solid rgba(79, 255, 176, 0.3)' : '1px solid rgba(79, 255, 176, 0.4)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: darkMode ? '#4fffb0' : '#059669' }}>
              ✅ Coordinates Saved
            </span>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-xs underline"
              style={{ color: darkMode ? '#4fffb0' : '#059669' }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
          <div className="text-xs" style={{ color: darkMode ? 'rgba(79, 255, 176, 0.8)' : '#059669' }}>
            Lat: {latitude ? parseFloat(latitude).toFixed(6) : 'N/A'}, Lon: {longitude ? parseFloat(longitude).toFixed(6) : 'N/A'}
          </div>

          {showMap && (
            <div className="mt-3">
              <iframe
                width="100%"
                height="200"
                frameBorder="0"
                style={{ borderRadius: '8px' }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude)-0.01},${parseFloat(latitude)-0.01},${parseFloat(longitude)+0.01},${parseFloat(latitude)+0.01}&layer=mapnik&marker=${parseFloat(latitude)},${parseFloat(longitude)}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Geocoding Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGeocodeAddress}
          disabled={geocoding || !city || !venueName}
          className="w-full px-4 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          {geocoding ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Geocoding...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Geocode This Address
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={gettingLocation}
          className="w-full px-4 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          style={{
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151',
            fontFamily: "'Barlow Condensed', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {gettingLocation ? 'Getting Location...' : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use Current Location (if at venue)
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowManualCoords(!showManualCoords)}
          className="w-full px-4 py-2 text-sm underline"
          style={{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280' }}
        >
          {showManualCoords ? 'Hide' : 'Enter'} Manual Coordinates
        </button>

        {showManualCoords && (
          <div className="p-4 rounded-xl space-y-3" style={{
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Latitude (e.g., 19.076090)"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={inputStyle}
            />
            <input
              type="number"
              step="0.000001"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="Longitude (e.g., 72.877426)"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleManualCoordinates}
              className="w-full px-3 py-2 rounded-lg font-medium"
              style={{
                background: darkMode ? 'rgba(79, 255, 176, 0.2)' : 'rgba(79, 255, 176, 0.3)',
                color: darkMode ? '#4fffb0' : '#059669'
              }}
            >
              Save Coordinates
            </button>
          </div>
        )}

        {/* Multiple Results Selection - Inline */}
        {showResultsModal && geocodeResults.length > 0 && (
          <div className="mt-4 p-4 rounded-xl" style={{
            background: darkMode ? 'rgba(79, 255, 176, 0.05)' : 'rgba(79, 255, 176, 0.1)',
            border: darkMode ? '1px solid rgba(79, 255, 176, 0.3)' : '1px solid rgba(79, 255, 176, 0.4)'
          }}>
            <h4 className="text-sm font-bold mb-3" style={{
              color: darkMode ? '#4fffb0' : '#059669',
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: 'uppercase'
            }}>
              📍 Multiple Locations Found - Select Correct One
            </h4>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {geocodeResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => confirmGeocodeResult(result)}
                  className="w-full p-3 rounded-lg text-left transition-all text-sm"
                  style={{
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(79, 255, 176, 0.15)' : 'rgba(79, 255, 176, 0.2)'
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(79, 255, 176, 0.4)' : 'rgba(79, 255, 176, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
                  }}
                >
                  <div className="font-medium" style={{ color: darkMode ? '#fff' : '#000' }}>
                    {result.display_name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280' }}>
                    Lat: {parseFloat(result.lat).toFixed(6)}, Lon: {parseFloat(result.lon).toFixed(6)}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowResultsModal(false)
                setGeocodeResults([])
              }}
              className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: darkMode ? '#fff' : '#000'
              }}
            >
              None of These - Try Different Address
            </button>
          </div>
        )}
      </div>

      {darkMode && (
        <p className="text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Geocoding helps users see exact distance to your venue
        </p>
      )}
    </div>
  )
}

export default VenueLocationSelector
