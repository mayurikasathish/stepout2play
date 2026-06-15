import { useState } from 'react'
import api from '../services/api'
import Toast from './Toast'

const ScheduleConfig = ({ tournament, onSaved }) => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [config, setConfig] = useState({
    dailyStartTime: tournament.dailyStartTime || '09:00',
    dailyEndTime: tournament.dailyEndTime || '18:00',
    courtsAvailable: tournament.courtsAvailable || 4,
    matchDuration: tournament.matchDuration || 45,
    breakDuration: tournament.breakDuration || 15,
    minRestTime: tournament.minRestTime || 30,
    firstMatchDate: tournament.firstMatchDate
      ? new Date(tournament.firstMatchDate).toISOString().split('T')[0]
      : new Date(tournament.startDate).toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await api.patch(`/tournaments/${tournament.id}/schedule-config`, config)
      if (response.data.success) {
        setToastMessage('Schedule configuration saved successfully')
        setToastType('success')
        setShowToast(true)
        onSaved && onSaved(response.data.tournament)
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError(err.response?.data?.error || 'Failed to save configuration')
      setToastMessage('Failed to save configuration')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Scheduling Configuration</h3>
      <p className="text-sm text-gray-600 mb-6">
        Configure how matches should be scheduled for this tournament
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Time Window */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Daily Schedule
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Time</label>
              <input
                type="time"
                value={config.dailyStartTime}
                onChange={(e) => setConfig({ ...config, dailyStartTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                value={config.dailyEndTime}
                onChange={(e) => setConfig({ ...config, dailyEndTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* First Match Date */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            First Match Date
          </label>
          <input
            type="date"
            value={config.firstMatchDate}
            onChange={(e) => setConfig({ ...config, firstMatchDate: e.target.value })}
            min={new Date(tournament.startDate).toISOString().split('T')[0]}
            max={new Date(tournament.endDate).toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            When should the first matches start? (Tournament: {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()})
          </p>
        </div>

        {/* Courts */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Courts Available
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.courtsAvailable}
            onChange={(e) => setConfig({ ...config, courtsAvailable: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">How many courts can be used?</p>
        </div>

        {/* Match Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Match Duration (minutes)
          </label>
          <input
            type="number"
            min="15"
            max="180"
            step="5"
            value={config.matchDuration}
            onChange={(e) => setConfig({ ...config, matchDuration: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">How long is each match?</p>
        </div>

        {/* Break Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Break Between Matches (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="60"
            step="5"
            value={config.breakDuration}
            onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Court setup/cleanup time</p>
        </div>

        {/* Rest Time */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Player Rest Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="120"
            step="5"
            value={config.minRestTime}
            onChange={(e) => setConfig({ ...config, minRestTime: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum gap between player's matches</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

export default ScheduleConfig
