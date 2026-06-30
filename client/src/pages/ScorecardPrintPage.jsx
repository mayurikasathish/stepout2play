import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import BadmintonScorecard from '../components/BadmintonScorecard'

const ScorecardPrintPage = () => {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      // Fetch bracket data (includes matches)
      const bracketResponse = await api.get(`/events/${eventId}/bracket`)
      const bracket = bracketResponse.data

      setEvent(bracket.event)

      // Format matches for scorecard display
      const allMatches = bracket.matches || []
      const formattedMatches = allMatches.map(match => ({
        matchNumber: match.matchNumber,
        roundLabel: `R${match.roundNumber}`,
        player1Id: match.participant1?.playerId || 'P___',
        player1Name: match.participant1 ?
          `${match.participant1.user?.firstName || ''} ${match.participant1.user?.lastName || ''}`.trim() :
          'TBD',
        player2Id: match.participant2?.playerId || 'P___',
        player2Name: match.participant2 ?
          `${match.participant2.user?.firstName || ''} ${match.participant2.user?.lastName || ''}`.trim() :
          'TBD'
      }))

      setMatches(formattedMatches)
    } catch (error) {
      console.error('Error fetching bracket data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scorecards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 print:px-0">
        {/* Header - Hidden in print */}
        <div className="mb-8 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Print Scorecards
          </h1>
          <p className="text-gray-600">
            {event?.name} - {matches.length} matches
          </p>
          <button
            onClick={() => window.print()}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            🖨️ Print All Scorecards
          </button>
        </div>

        {/* Scorecards */}
        <div className="space-y-8 print:space-y-0">
          {matches.map((match, index) => (
            <BadmintonScorecard
              key={index}
              match={match}
              eventName={event?.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScorecardPrintPage
