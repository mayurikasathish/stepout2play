import { useState } from 'react'
import React from 'react'
import api from '../services/api'
import ConfirmationModal from './ConfirmationModal'
import SuccessModal from './SuccessModal'
import ErrorModal from './ErrorModal'
import Toast from './Toast'

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MatchScheduler = ({ eventId, tournament }) => {
  // Fetch saved schedule on mount
  React.useEffect(() => {
    fetchSavedSchedule()
  }, [eventId])

  const fetchSavedSchedule = async () => {
    setLoadingSaved(true)
    try {
      const response = await api.get(`/events/${eventId}/saved-schedule`)
      if (response.data.success && response.data.hasSchedule) {
        setSchedule(response.data)
      }
    } catch (err) {
      console.error('Error fetching saved schedule:', err)
    } finally {
      setLoadingSaved(false)
    }
  }

  const [settings, setSettings] = useState({
    startDate: tournament?.startDate?.split('T')[0] || '',
    endDate: tournament?.endDate?.split('T')[0] || '',
    dailyStartTime: tournament?.dailyStartTime || '09:00',
    dailyEndTime: tournament?.dailyEndTime || '18:00',
    courtsAvailable: tournament?.courtsAvailable ?? 4,
    matchDuration: tournament?.matchDuration ?? 45,
    breakDuration: tournament?.breakDuration ?? 15,
    minRestTime: tournament?.minRestTime ?? 30
  })

  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSchedule, setEditedSchedule] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [exactMatch, setExactMatch] = useState(false)

  // Modal states
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({ title: '', message: '', details: [] })
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorData, setErrorData] = useState({ title: '', message: '', details: [] })
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [currentConflicts, setCurrentConflicts] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post(`/events/${eventId}/generate-schedule`, settings)
      if (response.data.success) {
        setSchedule(response.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClick = async () => {
    // STEP 1: Validate FIRST before showing confirmation
    const dataToValidate = isEditing ? editedSchedule : schedule.schedule.scheduledMatches
    if (!dataToValidate) return

    setSaving(true)
    setError('')

    try {
      // Call validate endpoint
      const validateResponse = await api.post(`/events/${eventId}/validate-schedule`, {
        schedule: dataToValidate
      })

      if (validateResponse.data.valid) {
        // STEP 2: If valid, NOW show confirmation modal
        setSaving(false)
        setShowSaveConfirm(true)
      }
    } catch (err) {
      // STEP 3: If invalid, show conflicts FIRST, then let user choose AI or manual
      setSaving(false)
      const responseData = err.response?.data

      // DEBUG: Log the full response to see what we're getting
      console.log('🔍 VALIDATION ERROR RESPONSE:', responseData)
      console.log('🔍 Suggestions:', responseData?.suggestions)
      console.log('🔍 Suggestions length:', responseData?.suggestions?.length)
      console.log('🔍 Has suggestions?', responseData?.suggestions && responseData.suggestions.length > 0)

      // Store conflicts and suggestions for later
      if (responseData?.conflicts) {
        setCurrentConflicts(responseData.conflicts)
        setSuggestions(responseData?.suggestions || [])

        // Show error modal with conflicts FIRST
        setErrorData({
          title: '⚠️ Scheduling Conflicts Found',
          message: `Found ${responseData.conflicts.length} conflict(s) in your schedule.`,
          details: responseData.conflicts.map(c => c.message),
          hasSmartSuggestions: responseData.suggestions && responseData.suggestions.length > 0
        })
        setShowErrorModal(true)
        return
      }

      // Otherwise show regular error modal
      if (responseData?.conflicts && responseData.conflicts.length > 0) {
        setErrorData({
          title: '⚠️ Schedule Validation Failed',
          message: `Found ${responseData.conflicts.length} scheduling conflict(s) that must be fixed before saving.`,
          details: responseData.conflicts
        })
        setShowErrorModal(true)
      } else {
        setErrorData({
          title: '❌ Validation Error',
          message: responseData?.error || err.message || 'An unknown error occurred',
          details: []
        })
        setShowErrorModal(true)
      }
    }
  }

  const confirmSave = async () => {
    // Validation already passed at this point, so just save directly
    const dataToSave = isEditing ? editedSchedule : schedule.schedule.scheduledMatches
    if (!dataToSave) return

    setSaving(true)
    setShowSaveConfirm(false)

    try {
      const response = await api.post(`/events/${eventId}/save-schedule`, {
        schedule: dataToSave
      })
      if (response.data.success) {
        setSuccessData({
          title: '✅ Schedule Saved!',
          message: 'Your match schedule has been successfully saved to the database.',
          details: [
            `${response.data.updatedMatches} matches scheduled`,
            'View schedule in Brackets tab',
            'All times and courts are now set'
          ]
        })
        setShowSuccessModal(true)
        setIsEditing(false)
        setEditedSchedule(null)
        await fetchSavedSchedule()
      }
    } catch (err) {
      // This shouldn't happen since we validated first, but handle just in case
      setErrorData({
        title: '❌ Save Failed',
        message: err.response?.data?.error || err.message || 'An unexpected error occurred',
        details: []
      })
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setSaving(true)
    setShowDeleteConfirm(false)

    try {
      const response = await api.delete(`/events/${eventId}/delete-schedule`)
      if (response.data.success) {
        setSuccessData({
          title: '🗑️ Schedule Deleted',
          message: 'The schedule has been completely removed from the database.',
          details: [
            `${response.data.clearedMatches} matches cleared`,
            'All times and courts removed',
            'You can generate a new schedule anytime'
          ]
        })
        setShowSuccessModal(true)
        setSchedule(null)
        setIsEditing(false)
        setEditedSchedule(null)
      }
    } catch (err) {
      alert('Failed to delete schedule: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = () => {
    setShowEditConfirm(true)
  }

  const confirmEdit = () => {
    setShowEditConfirm(false)
    setIsEditing(true)
    setEditedSchedule([...schedule.schedule.scheduledMatches])
  }

  const handleCancelClick = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = () => {
    // Discard all changes and revert to original
    setShowCancelConfirm(false)
    setIsEditing(false)
    setEditedSchedule(null)
    // Force re-render by fetching saved schedule again
    fetchSavedSchedule()
  }

  const updateMatchSchedule = (matchId, field, value) => {
    const updated = [...editedSchedule]
    const matchIndex = updated.findIndex(m => m.matchId === matchId)
    if (matchIndex !== -1) {
      updated[matchIndex][field] = value
      setEditedSchedule(updated)
    }
  }

  if (loadingSaved) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading schedule...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <CalendarIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Match Scheduling</h2>
            <p className="text-sm text-gray-500">Configure schedule settings</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Tournament Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={settings.endDate}
              onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Daily Time Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Start Time</label>
            <input
              type="time"
              value={settings.dailyStartTime}
              onChange={(e) => setSettings({ ...settings, dailyStartTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily End Time</label>
            <input
              type="time"
              value={settings.dailyEndTime}
              onChange={(e) => setSettings({ ...settings, dailyEndTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Courts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Courts</label>
            <input
              type="number"
              min="1"
              value={settings.courtsAvailable || 4}
              onChange={(e) => setSettings({ ...settings, courtsAvailable: parseInt(e.target.value) || 4 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Match Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Duration (mins)</label>
            <input
              type="number"
              min="1"
              value={settings.matchDuration || 45}
              onChange={(e) => setSettings({ ...settings, matchDuration: parseInt(e.target.value) || 45 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (mins)</label>
            <input
              type="number"
              min="0"
              value={settings.breakDuration || 15}
              onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 15 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Rest Time (mins)</label>
            <input
              type="number"
              min="0"
              value={settings.minRestTime || 30}
              onChange={(e) => setSettings({ ...settings, minRestTime: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? 'Generating...' : '🎯 Generate Schedule'}
        </button>
      </div>

      {/* Schedule Results */}
      {schedule && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? '✏️ Editing Schedule' : schedule.schedule.overflow ? '⚠️ Schedule Overflow' : '✅ Schedule Generated'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {schedule.metadata.scheduledMatches} / {schedule.metadata.totalMatches} matches scheduled
              </p>
            </div>
            <div className="flex gap-3">
              {!isEditing && !schedule.schedule.overflow && (
                <>
                  <button
                    onClick={handleEditClick}
                    disabled={saving}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleCancelClick}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Total Matches</p>
              <p className="text-2xl font-bold text-blue-900">{schedule.metadata.totalMatches}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Days Used</p>
              <p className="text-2xl font-bold text-green-900">{schedule.metadata.daysUsed} / {schedule.metadata.daysAvailable}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg relative group">
              <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                Daily Capacity
                <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </p>
              <p className="text-2xl font-bold text-purple-900">{schedule.metadata.dailyCapacity}</p>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                  Max matches per day with current settings<br/>
                  (Actual usage may be lower due to player<br/>
                  rest times & knockout dependencies)
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 font-medium">Courts</p>
              <p className="text-2xl font-bold text-orange-900">{schedule.metadata?.settings?.courtsAvailable || tournament?.courtsAvailable || 'N/A'}</p>
            </div>
          </div>

          {/* Suggestions if overflow */}
          {schedule.suggestions && schedule.suggestions.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
              <p className="font-semibold text-yellow-900 mb-3">💡 Suggestions to fit all matches:</p>
              <div className="space-y-2">
                {schedule.suggestions.map((sug, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="text-gray-900 font-medium">{sug.description}</span>
                    <span className="text-gray-600">→ {sug.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by match number, participant name, or court... (Press Enter for exact match)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setExactMatch(false) // Reset to fuzzy search when typing
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setExactMatch(true) // Enable exact match on Enter
                  }
                }}
                className="w-full px-4 py-3 pl-10 pr-24 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="absolute right-3 top-3 flex items-center gap-2">
                {exactMatch && searchQuery && (
                  <span className="px-2 py-1 bg-primary-600 text-white text-[10px] font-bold rounded uppercase">
                    Exact
                  </span>
                )}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setExactMatch(false)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {exactMatch && searchQuery && (
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Showing exact matches only. Start typing to search again.
              </p>
            )}
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Match</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Round</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Participants</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Court</th>
                </tr>
              </thead>
              <tbody>
                {(isEditing ? editedSchedule : schedule.schedule.scheduledMatches)
                  .filter(match => {
                    if (!searchQuery) return true
                    const query = searchQuery.toLowerCase().trim()
                    const roundLabel = match.bracketPosition?.split('-')[0] || ''
                    const matchLabel = `m${match.matchNumber} ${roundLabel}`.toLowerCase()
                    const participant1 = (match.participant1 || '').toLowerCase()
                    const participant2 = (match.participant2 || '').toLowerCase()
                    const court = (match.court || '').toLowerCase()
                    const bracketPos = (match.bracketPosition || '').toLowerCase()
                    const matchNum = `${match.matchNumber}`.toLowerCase()

                    if (exactMatch) {
                      // Exact match mode: check if any field EQUALS the query exactly
                      return matchLabel === query ||
                             participant1 === query ||
                             participant2 === query ||
                             court === query ||
                             bracketPos === query ||
                             matchNum === query ||
                             roundLabel.toLowerCase() === query
                    } else {
                      // Fuzzy match mode: check if any field INCLUDES the query
                      return matchLabel.includes(query) ||
                             participant1.includes(query) ||
                             participant2.includes(query) ||
                             court.includes(query) ||
                             bracketPos.includes(query) ||
                             matchNum.includes(query)
                    }
                  })
                  .map((match, idx) => {
                  // Extract round label from bracketPosition (e.g., "R3-M1" -> "R3")
                  const roundLabel = match.bracketPosition?.split('-')[0] || ''
                  const isLocked = match.isLocked || match.status === 'COMPLETED' || match.status === 'BYE'

                  return (
                  <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isLocked ? 'bg-green-50' : isEditing ? 'bg-amber-50' : ''
                  }`}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                      {isLocked && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      M{match.matchNumber} {roundLabel}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{match.bracketPosition}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {match.participant1} <span className="text-gray-400">vs</span> {match.participant2}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {isEditing && !isLocked ? (
                        <input
                          type="date"
                          value={match.date}
                          onChange={(e) => updateMatchSchedule(match.matchId, 'date', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        <span className={isLocked ? 'text-green-700 font-medium' : ''}>
                          {new Date(match.date).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {isEditing && !isLocked ? (
                        <input
                          type="time"
                          value={match.time}
                          onChange={(e) => updateMatchSchedule(match.matchId, 'time', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        <span className={isLocked ? 'text-green-700 font-medium' : ''}>
                          {match.time}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-blue-600">
                      {isEditing && !isLocked ? (
                        <input
                          type="text"
                          value={match.court}
                          onChange={(e) => updateMatchSchedule(match.matchId, 'court', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        <span className={isLocked ? 'text-green-700 font-medium' : ''}>
                          {match.court}
                        </span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend for locked matches */}
          <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-900">🔒 Locked Matches (Green)</p>
                <p className="text-sm text-green-800 mt-1">Completed or BYE matches are locked and cannot be rescheduled. They appear in green with a lock icon.</p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900">✏️ Edit Mode Active</p>
                  <p className="text-sm text-amber-800 mt-1">Modify the date, time, or court for unlocked matches. Locked (green) matches cannot be edited. Click "Save Changes" when done.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={confirmEdit}
        title="Edit Schedule?"
        message="You're about to enter edit mode. You can modify dates, times, and courts for all matches. Don't forget to save your changes when done!"
        confirmText="Start Editing"
        cancelText="Cancel"
        type="warning"
      />

      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={confirmSave}
        title="✅ Schedule is Valid!"
        message={isEditing
          ? "Your edited schedule has been validated successfully. No conflicts found! Ready to save to the database?"
          : "The generated schedule has been validated successfully. No conflicts found! Ready to save to the database?"}
        confirmText="Yes, Save Now"
        cancelText="Cancel"
        type="success"
        isLoading={saving}
      />

      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancel}
        title="Discard Changes?"
        message="Are you sure you want to cancel? All unsaved changes to the schedule will be lost and reverted to the last saved version."
        confirmText="Yes, Discard"
        cancelText="Keep Editing"
        type="warning"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Schedule?"
        message="Are you sure you want to delete the entire schedule? This will clear all match times and court assignments. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={saving}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successData.title}
        message={successData.message}
        details={successData.details}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorData.title}
        message={errorData.message}
        details={errorData.details}
        hasSmartSuggestions={errorData.hasSmartSuggestions}
        onShowSuggestions={() => setShowSuggestionsModal(true)}
      />

      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      {/* 🧠 Smart Suggestions Modal */}
      {showSuggestionsModal && suggestions.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSuggestionsModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-8 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowSuggestionsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">🧠 Smart Suggestions</h3>
                  <p className="text-sm text-gray-600">AI-powered conflict resolution</p>
                </div>
              </div>
              <p className="text-gray-700 mt-4">
                We found scheduling conflicts. Here are intelligent suggestions to fix them:
              </p>
            </div>

            <div className="space-y-4">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-500 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.confidence} confidence
                        </span>
                        {suggestion.action === 'swap' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            SWAP TIMES
                          </span>
                        )}
                        {suggestion.action === 'reschedule' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            RESCHEDULE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{suggestion.reason}</p>

                      {/* RESCHEDULE suggestion */}
                      {suggestion.action === 'reschedule' && suggestion.suggestedTime && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                          <div className="font-semibold text-gray-700 mb-1">Suggested Change:</div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 line-through">{suggestion.currentTime}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-bold">{suggestion.suggestedTime}</span>
                            {suggestion.suggestedDate && (
                              <span className="text-gray-500">on {new Date(suggestion.suggestedDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SWAP suggestion */}
                      {suggestion.action === 'swap' && suggestion.match1Time && suggestion.match2Time && (
                        <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 mt-2 border border-blue-200">
                          <div className="font-semibold text-blue-900 mb-2">Swap Details:</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Match {suggestion.match1Number}:</span>
                              <span className="text-red-600">{suggestion.match1Time}</span>
                              <span className="text-gray-400">↔</span>
                              <span className="text-green-600 font-bold">{suggestion.match2Time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Match {suggestion.match2Number}:</span>
                              <span className="text-red-600">{suggestion.match2Time}</span>
                              <span className="text-gray-400">↔</span>
                              <span className="text-green-600 font-bold">{suggestion.match1Time}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        // Apply the suggestion - use matchId for unique lookup
                        let updated = [...editedSchedule]
                        let applied = false

                        if (suggestion.action === 'reschedule') {
                          const matchIdx = updated.findIndex(m => m.matchId === suggestion.matchId)
                          if (matchIdx !== -1) {
                            console.log(`🔧 Rescheduling match ${suggestion.matchNumber} from ${updated[matchIdx].time} to ${suggestion.suggestedTime}`)
                            updated[matchIdx].time = suggestion.suggestedTime
                            if (suggestion.suggestedDate) {
                              updated[matchIdx].date = suggestion.suggestedDate
                            }
                            applied = true
                          } else {
                            console.error('❌ Match not found:', suggestion.matchId)
                            setToastMessage('Error: Match not found')
                            setToastType('error')
                            setShowToast(true)
                            return
                          }
                        } else if (suggestion.action === 'swap') {
                          // Swap BOTH time AND date between two matches
                          const match1Idx = updated.findIndex(m => m.matchId === suggestion.match1Id)
                          const match2Idx = updated.findIndex(m => m.matchId === suggestion.match2Id)

                          if (match1Idx !== -1 && match2Idx !== -1) {
                            console.log(`🔧 Swapping Match ${suggestion.match1Number} (${updated[match1Idx].time}) with Match ${suggestion.match2Number} (${updated[match2Idx].time})`)

                            // Swap times
                            const tempTime = updated[match1Idx].time
                            updated[match1Idx].time = updated[match2Idx].time
                            updated[match2Idx].time = tempTime

                            // Also swap dates in case they're different
                            const tempDate = updated[match1Idx].date
                            updated[match1Idx].date = updated[match2Idx].date
                            updated[match2Idx].date = tempDate

                            applied = true
                          } else {
                            console.error('❌ Matches not found:', suggestion.match1Id, suggestion.match2Id)
                            setToastMessage('Error: Matches not found')
                            setToastType('error')
                            setShowToast(true)
                            return
                          }
                        }

                        if (!applied) return

                        // Update schedule immediately
                        setEditedSchedule(updated)
                        setToastMessage(`Applied: ${suggestion.reason.split('-')[0].trim()}`)
                        setToastType('success')
                        setShowToast(true)

                        // Re-validate after applying to check if conflicts resolved
                        try {
                          const validateResponse = await api.post(`/events/${eventId}/validate-schedule`, {
                            schedule: updated
                          })

                          // If valid now, close modal and show success!
                          if (validateResponse.data.valid) {
                            setShowSuggestionsModal(false)
                            setToastMessage('✅ All conflicts resolved!')
                            setToastType('success')
                            setShowToast(true)
                          }
                        } catch (err) {
                          // Still has conflicts - update suggestions list
                          const responseData = err.response?.data
                          console.log('🔄 Still has conflicts after apply:', responseData?.conflicts)
                          if (responseData?.suggestions && responseData.suggestions.length > 0) {
                            setSuggestions(responseData.suggestions)
                            setCurrentConflicts(responseData.conflicts)
                            setToastMessage(`${responseData.conflicts.length} conflict(s) remaining - try another suggestion`)
                            setToastType('warning')
                            setShowToast(true)
                            // Keep modal open with updated suggestions
                          } else {
                            // No more suggestions but still has conflicts
                            setShowSuggestionsModal(false)
                            setToastMessage('Conflicts remain but no more AI suggestions available')
                            setToastType('warning')
                            setShowToast(true)
                          }
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowSuggestionsModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
              >
                I'll Fix Manually
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchScheduler
