import { useState } from 'react'
import React from 'react'
import api from '../services/api'
import ConfirmationModal from './ConfirmationModal'
import SuccessModal from './SuccessModal'
import ErrorModal from './ErrorModal'

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

  // Modal states
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({ title: '', message: '', details: [] })
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorData, setErrorData] = useState({ title: '', message: '', details: [] })

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
      // STEP 3: If invalid, show error modal immediately (no confirmation needed)
      setSaving(false)
      const responseData = err.response?.data
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

  const updateMatchSchedule = (index, field, value) => {
    const updated = [...editedSchedule]
    updated[index][field] = value
    setEditedSchedule(updated)
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
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Daily Capacity</p>
              <p className="text-2xl font-bold text-purple-900">{schedule.metadata.dailyCapacity}</p>
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
                {(isEditing ? editedSchedule : schedule.schedule.scheduledMatches).map((match, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${isEditing ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">M{match.matchNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{match.bracketPosition}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {match.participant1} <span className="text-gray-400">vs</span> {match.participant2}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {isEditing ? (
                        <input
                          type="date"
                          value={match.date}
                          onChange={(e) => updateMatchSchedule(idx, 'date', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        new Date(match.date).toLocaleDateString()
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="time"
                          value={match.time}
                          onChange={(e) => updateMatchSchedule(idx, 'time', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        match.time
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-blue-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={match.court}
                          onChange={(e) => updateMatchSchedule(idx, 'court', e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      ) : (
                        match.court
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Edit Mode Active</p>
                  <p className="text-sm text-amber-800 mt-1">Modify the date, time, or court for any match. Click "Save Changes" when done or "Cancel" to discard changes.</p>
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
      />
    </div>
  )
}

export default MatchScheduler
