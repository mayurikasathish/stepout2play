import { useMemo } from 'react'

const RoundRobinBracket = ({ matches, onMatchClick }) => {
  // Calculate standings
  const standings = useMemo(() => {
    const participantsMap = {}

    // Initialize participants
    matches.forEach(match => {
      [match.participant1, match.participant2].forEach(p => {
        if (p && !participantsMap[p.id]) {
          participantsMap[p.id] = {
            id: p.id,
            participant: p,
            played: 0,
            won: 0,
            lost: 0,
            points: 0
          }
        }
      })
    })

    // Calculate stats from completed matches
    matches.forEach(match => {
      if (match.status === 'COMPLETED' && match.winnerId) {
        const p1Stats = participantsMap[match.participant1Id]
        const p2Stats = participantsMap[match.participant2Id]

        if (p1Stats && p2Stats) {
          p1Stats.played++
          p2Stats.played++

          if (match.winnerId === match.participant1Id) {
            p1Stats.won++
            p1Stats.points += 2 // 2 points for win
            p2Stats.lost++
          } else {
            p2Stats.won++
            p2Stats.points += 2
            p1Stats.lost++
          }
        }
      }
    })

    // Sort by points (desc), then wins (desc), then alphabetically
    return Object.values(participantsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      const aName = `${a.participant.user.firstName} ${a.participant.user.lastName}`
      const bName = `${b.participant.user.firstName} ${b.participant.user.lastName}`
      return aName.localeCompare(bName)
    })
  }, [matches])

  const getParticipantDisplay = (participant) => {
    if (!participant) return 'TBD'

    const userName = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) {
      const partnerName = `${participant.partner.firstName} ${participant.partner.lastName}`
      return `${userName} / ${partnerName}`
    }
    return userName
  }

  const getMatchStatusBadge = (match) => {
    if (match.status === 'COMPLETED') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
    }
    if (match.status === 'IN_PROGRESS') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Live</span>
    }
    if (match.scheduledAt) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Scheduled</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Pending</span>
  }

  const formatScheduleInfo = (match) => {
    if (!match.scheduledAt) return null

    const date = new Date(match.scheduledAt)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    return (
      <div className="text-xs text-gray-600">
        <div>{dateStr}, {timeStr}</div>
        {match.courtNumber && <div className="font-medium text-indigo-600">Court {match.courtNumber}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Standings Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Standings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player(s)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Played</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Won</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lost</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((entry, index) => (
                <tr key={entry.id} className={index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-xs px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full font-bold">1ST</span>}
                      {index === 1 && <span className="text-xs px-2 py-1 bg-gray-300 text-gray-800 rounded-full font-bold">2ND</span>}
                      {index === 2 && <span className="text-xs px-2 py-1 bg-orange-300 text-orange-900 rounded-full font-bold">3RD</span>}
                      {index > 2 && (
                        <span className="text-sm font-semibold text-gray-700">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {getParticipantDisplay(entry.participant)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{entry.played}</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-success-600">{entry.won}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{entry.lost}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-bold rounded-full">
                      {entry.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">All Matches</h3>
          <p className="text-sm text-indigo-100 mt-1">
            {matches.filter(m => m.status === 'COMPLETED').length} of {matches.length} completed
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => onMatchClick && onMatchClick(match)}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Match Number */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">#{match.matchNumber}</span>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Participant 1 */}
                  <div className={`p-4 rounded-lg ${
                    match.winnerId === match.participant1Id
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400'
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getParticipantDisplay(match.participant1)}
                        </span>
                        {match.winnerId === match.participant1Id && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full font-bold">WIN</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VS / Score */}
                  <div className="text-center">
                    {match.score ? (
                      <div className="font-medium text-gray-900">{match.score}</div>
                    ) : (
                      <div className="text-gray-400 text-sm">vs</div>
                    )}
                  </div>

                  {/* Participant 2 */}
                  <div className={`p-4 rounded-lg ${
                    match.winnerId === match.participant2Id
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400'
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getParticipantDisplay(match.participant2)}
                        </span>
                        {match.winnerId === match.participant2Id && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full font-bold">WIN</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Schedule */}
                <div className="flex-shrink-0 text-right space-y-1">
                  {getMatchStatusBadge(match)}
                  {formatScheduleInfo(match)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoundRobinBracket
