import { useState } from 'react'

const HybridBracket = ({ bracket, onMatchClick, isOrganizer }) => {
  const { event, groups, matches } = bracket
  const [activeTab, setActiveTab] = useState('groups')

  // Separate group matches and knockout matches
  const groupMatches = matches.filter(m => m.groupId !== null)
  const knockoutMatches = matches.filter(m => m.groupId === null)

  // Group knockout matches by round
  const knockoutRoundGroups = knockoutMatches.reduce((acc, match) => {
    const roundNum = match.roundNumber
    if (!acc[roundNum]) acc[roundNum] = []
    acc[roundNum].push(match)
    return acc
  }, {})

  const knockoutRounds = Object.keys(knockoutRoundGroups).sort((a, b) => a - b) // Sort ascending
  const bronzeMatch = knockoutMatches.find(m => m.bracketPosition === 'Bronze')
  const knockoutRoundsWithoutBronze = knockoutRounds.filter(r =>
    !knockoutRoundGroups[r].some(m => m.bracketPosition === 'Bronze')
  )

  const getRoundName = (roundNum, totalRounds) => {
    const roundIndex = knockoutRoundsWithoutBronze.indexOf(roundNum.toString()) + 1
    const matchesInRound = knockoutRoundGroups[roundNum].filter(m => m.bracketPosition !== 'Bronze').length

    if (roundIndex === totalRounds) return 'Final'
    if (roundIndex === totalRounds - 1) return 'Semifinals'
    if (roundIndex === totalRounds - 2) return 'Quarterfinals'
    if (roundIndex === totalRounds - 3) return 'Round of 16'
    return `Round of ${matchesInRound * 2}`
  }

  const getParticipantDisplay = (participant) => {
    if (!participant) return { name: 'TBD', subtext: 'To be determined' }

    const user = participant.user
    const partner = participant.partner

    if (event.format === 'SINGLES') {
      return {
        name: `${user.firstName} ${user.lastName}`,
        subtext: null
      }
    } else {
      const partnerName = partner ? `${partner.firstName} ${partner.lastName}` : 'No Partner'
      return {
        name: `${user.firstName} ${user.lastName}`,
        subtext: partnerName
      }
    }
  }

  const getMatchStatusColor = (match) => {
    if (match.status === 'COMPLETED') return 'bg-green-50 border-green-200'
    if (match.status === 'READY') return 'bg-blue-50 border-blue-200'
    return 'bg-gray-50 border-gray-200'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🏆 League-cum-Knockout Tournament
            </h2>
            <p className="text-gray-600">
              {event.groupCount} groups • Top {event.advanceCount} advance to knockout
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Progress</div>
            <div className="text-2xl font-bold text-primary-600">
              {matches.filter(m => m.status === 'COMPLETED').length}/{matches.length}
            </div>
            <div className="text-xs text-gray-500">matches complete</div>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'groups'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Group Stage
          </button>
          <button
            onClick={() => setActiveTab('knockout')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'knockout'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Knockout Stage
          </button>
        </div>
      </div>

      {/* Group Stage View */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => {
            const groupStandings = [...group.standings].sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points
              if (b.wins !== a.wins) return b.wins - a.wins
              return a.losses - b.losses
            })

            const completedMatches = group.matches.filter(m => m.status === 'COMPLETED').length
            const totalMatches = group.matches.length
            const isGroupComplete = completedMatches === totalMatches

            // Determine if qualifiers are locked in
            // Show Q badge only if: group complete OR team has mathematically qualified
            const canStillChange = !isGroupComplete
            const showQualifiers = isGroupComplete || (
              groupStandings.length > event.advanceCount &&
              groupStandings[event.advanceCount - 1].points -
              groupStandings[event.advanceCount].points >= 3 // At least 1 win difference
            )

            return (
              <div key={group.id} className="glass-card rounded-xl overflow-hidden">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">{group.name}</h3>
                      <p className="text-sm text-primary-100">
                        {completedMatches}/{totalMatches} matches complete
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-primary-100">Qualifiers</div>
                      <div className="text-2xl font-bold">Top {event.advanceCount}</div>
                    </div>
                  </div>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Team
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          P
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          W
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          L
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          D
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupStandings.map((standing, idx) => {
                        const { name, subtext } = getParticipantDisplay(standing.registration)
                        const isQualifier = idx < event.advanceCount

                        return (
                          <tr
                            key={standing.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              isQualifier && showQualifiers ? 'bg-green-50/30' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{idx + 1}</span>
                                {isQualifier && showQualifiers && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                                    Q
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 text-sm">{name}</div>
                              {subtext && (
                                <div className="text-xs text-gray-600">{subtext}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {standing.matchesPlayed}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                              {standing.wins}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                              {standing.losses}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {standing.draws}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-primary-600 text-base">
                                {standing.points}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Group Matches */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Matches</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {group.matches.map((match) => {
                      const p1 = getParticipantDisplay(match.participant1)
                      const p2 = getParticipantDisplay(match.participant2)

                      return (
                        <div
                          key={match.id}
                          onClick={() => isOrganizer && match.status === 'READY' && onMatchClick(match)}
                          className={`p-3 rounded-lg border-2 transition-all ${getMatchStatusColor(match)} ${
                            isOrganizer && match.status === 'READY' ? 'cursor-pointer hover:shadow-md' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <div className={`font-medium ${match.winnerId === match.participant1Id ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                                {p1.name}
                              </div>
                            </div>
                            <div className="px-4 text-xs font-semibold text-gray-500">
                              {match.status === 'COMPLETED' ? match.score || 'vs' : 'vs'}
                            </div>
                            <div className="flex-1 text-right">
                              <div className={`font-medium ${match.winnerId === match.participant2Id ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                                {p2.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Knockout Stage View */}
      {activeTab === 'knockout' && (
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Knockout Rounds</h3>
            <p className="text-gray-600">
              Single elimination • {knockoutMatches.length - (bronzeMatch ? 1 : 0)} matches
              {bronzeMatch && ' + bronze match'}
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {knockoutRoundsWithoutBronze.map((roundNum, roundIdx) => {
                const roundMatches = knockoutRoundGroups[roundNum].filter(m => m.bracketPosition !== 'Bronze')
                const roundName = getRoundName(roundNum, knockoutRoundsWithoutBronze.length)

                return (
                  <div key={roundNum} className="flex-shrink-0" style={{ width: '280px' }}>
                    <div className="mb-4 text-center">
                      <h4 className="font-bold text-gray-900 text-lg">{roundName}</h4>
                      <p className="text-sm text-gray-600">{roundMatches.length} matches</p>
                    </div>

                    <div className="space-y-6">
                      {roundMatches.map((match) => {
                        const p1 = getParticipantDisplay(match.participant1)
                        const p2 = getParticipantDisplay(match.participant2)

                        return (
                          <div
                            key={match.id}
                            onClick={() => isOrganizer && match.status === 'READY' && onMatchClick(match)}
                            className={`rounded-xl border-2 overflow-hidden transition-all ${getMatchStatusColor(match)} ${
                              isOrganizer && match.status === 'READY' ? 'cursor-pointer hover:shadow-lg' : ''
                            }`}
                          >
                            <div className="p-3 space-y-1">
                              <div className={`p-3 rounded-lg ${
                                match.winnerId === match.participant1Id
                                  ? 'bg-green-100 border-2 border-green-400'
                                  : 'bg-white'
                              }`}>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {p1.name}
                                </div>
                                {p1.subtext && (
                                  <div className="text-xs text-gray-600">{p1.subtext}</div>
                                )}
                              </div>

                              <div className="text-center text-xs font-semibold text-gray-500 py-1">
                                {match.status === 'COMPLETED' ? match.score || 'vs' : 'vs'}
                              </div>

                              <div className={`p-3 rounded-lg ${
                                match.winnerId === match.participant2Id
                                  ? 'bg-green-100 border-2 border-green-400'
                                  : 'bg-white'
                              }`}>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {p2.name}
                                </div>
                                {p2.subtext && (
                                  <div className="text-xs text-gray-600">{p2.subtext}</div>
                                )}
                              </div>
                            </div>

                            {match.status === 'PENDING' && (
                              <div className="bg-yellow-50 px-3 py-2 border-t border-yellow-200">
                                <p className="text-xs text-yellow-800 font-medium">
                                  Awaiting group stage results
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bronze Match */}
          {bronzeMatch && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-gray-900 text-lg mb-4 text-center">
                🥉 Bronze Match (3rd Place)
              </h4>
              <div className="max-w-md mx-auto">
                <div
                  onClick={() => isOrganizer && bronzeMatch.status === 'READY' && onMatchClick(bronzeMatch)}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${getMatchStatusColor(bronzeMatch)} ${
                    isOrganizer && bronzeMatch.status === 'READY' ? 'cursor-pointer hover:shadow-lg' : ''
                  }`}
                >
                  <div className="p-4 space-y-2">
                    {[bronzeMatch.participant1, bronzeMatch.participant2].map((participant, idx) => {
                      const display = getParticipantDisplay(participant)
                      const isWinner = bronzeMatch.winnerId === (idx === 0 ? bronzeMatch.participant1Id : bronzeMatch.participant2Id)

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            isWinner ? 'bg-amber-100 border-2 border-amber-400' : 'bg-white'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{display.name}</div>
                          {display.subtext && (
                            <div className="text-sm text-gray-600">{display.subtext}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {bronzeMatch.status === 'COMPLETED' && bronzeMatch.score && (
                    <div className="bg-gray-100 px-4 py-2 text-center border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">{bronzeMatch.score}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HybridBracket
