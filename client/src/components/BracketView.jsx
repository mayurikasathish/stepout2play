import { useState, useEffect } from 'react'
import api from '../services/api'
import BracketGenerator from './BracketGenerator'
import SingleEliminationBracket from './SingleEliminationBracket'
import Toast from './Toast'

const BracketView = ({ eventId, eventName, eventFormat, registrationCount, isOrganizer }) => {
  const [bracket, setBracket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    loadBracket()
  }, [eventId])

  const loadBracket = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(`/events/${eventId}/bracket`)
      if (response.data.success) {
        setBracket(response.data)
      }
    } catch (err) {
      console.error('Error loading bracket:', err)
      // If bracket doesn't exist yet, that's okay
      if (err.response?.status !== 404) {
        setError('Failed to load bracket')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBracketGenerated = (result) => {
    console.log('Bracket generated:', result)
    setShowToast(false) // Clear any previous toasts
    loadBracket() // Reload to show the new bracket
  }

  const handleDeleteBracket = async () => {
    try {
      await api.delete(`/events/${eventId}/bracket`)
      setBracket(null)
      setShowDeleteConfirm(false)
      setToastMessage('Bracket deleted successfully')
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      console.error('Error deleting bracket:', err)
      setShowDeleteConfirm(false)
      setToastMessage('Failed to delete bracket')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleMatchClick = (match) => {
    setSelectedMatch(match)
    setShowMatchModal(true)
  }

  const handleMatchUpdate = async (winnerId, score) => {
    try {
      await api.patch(`/matches/${selectedMatch.id}/result`, {
        winnerId,
        score
      })

      setShowMatchModal(false)
      setSelectedMatch(null)
      loadBracket() // Reload to show updated bracket
      setToastMessage('Match result updated successfully')
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      console.error('Error updating match:', err)
      setShowMatchModal(false)
      setToastMessage('Failed to update match result')
      setToastType('error')
      setShowToast(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show generator if no bracket exists
  if (!bracket || !bracket.event.bracketGenerated) {
    if (!isOrganizer) {
      return (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-gray-600">Bracket not generated yet. Check back later!</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Event Title - Scroll Target */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900">{eventName}</h3>
          <p className="text-sm text-gray-600 mt-1">Generate your tournament bracket below</p>
        </div>

        <BracketGenerator
          eventId={eventId}
          eventName={eventName}
          eventFormat={eventFormat}
          registrationCount={registrationCount}
          onGenerated={handleBracketGenerated}
        />
      </div>
    )
  }

  // Show bracket
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      {isOrganizer && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{eventName}</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                  Single Elimination
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {bracket.event.seedingMethod === 'REGISTRATION_ORDER'
                    ? 'Registration Order'
                    : bracket.event.seedingMethod === 'RANDOM'
                    ? 'Random Draw'
                    : 'Manual Seeding'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
              >
                Delete Bracket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Display */}
      <div className="glass-card rounded-xl p-6">
        <SingleEliminationBracket
          matches={bracket.matches}
          onMatchClick={isOrganizer ? handleMatchClick : null}
        />
      </div>

      {/* Match Result Modal */}
      {showMatchModal && selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          onClose={() => setShowMatchModal(false)}
          onSubmit={handleMatchUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Bracket?</h3>
              <p className="text-gray-600">
                This will permanently delete this bracket and all match data. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBracket}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

// Match Result Modal Component
const MatchResultModal = ({ match, onClose, onSubmit }) => {
  const [winnerId, setWinnerId] = useState(match.winnerId || '')
  const [score, setScore] = useState(match.score || '')

  const getParticipantName = (participant) => {
    if (!participant) return 'TBD'
    const userName = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) {
      return `${userName} / ${participant.partner.firstName} ${participant.partner.lastName}`
    }
    return userName
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!winnerId) {
      return
    }
    onSubmit(winnerId, score)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Match Result</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Winner *</label>
              <div className="space-y-2">
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  winnerId === match.participant1Id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="winner"
                    value={match.participant1Id}
                    checked={winnerId === match.participant1Id}
                    onChange={(e) => setWinnerId(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">{getParticipantName(match.participant1)}</span>
                </label>

                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  winnerId === match.participant2Id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="winner"
                    value={match.participant2Id}
                    checked={winnerId === match.participant2Id}
                    onChange={(e) => setWinnerId(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">{getParticipantName(match.participant2)}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Score (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 21-15, 21-18"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
              >
                Save Result
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BracketView
