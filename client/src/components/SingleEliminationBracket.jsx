const SingleEliminationBracket = ({ matches, onMatchClick }) => {
  // Group matches by round
  const roundsMap = {}
  matches.forEach(match => {
    if (!roundsMap[match.roundNumber]) {
      roundsMap[match.roundNumber] = []
    }
    roundsMap[match.roundNumber].push(match)
  })

  // Sort rounds in descending order (highest round number first = first round)
  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => b - a)
    .map(roundNum => ({
      roundNumber: roundNum,
      matches: roundsMap[roundNum].sort((a, b) => a.matchNumber - b.matchNumber)
    }))

  const getRoundName = (roundNumber, totalRounds) => {
    if (roundNumber === 1) return 'Final'
    if (roundNumber === 2) return 'Semifinals'
    if (roundNumber === 3) return 'Quarterfinals'
    return `Round ${totalRounds - roundNumber + 1}`
  }

  const getParticipantDisplay = (participant) => {
    if (!participant) return 'TBD'

    const userName = `${participant.user.firstName} ${participant.user.lastName}`
    if (participant.partner) {
      const partnerName = `${participant.partner.firstName} ${participant.partner.lastName}`
      return (
        <div className="space-y-1">
          <div className="font-medium">{userName}</div>
          <div className="font-medium text-success-600">+ {partnerName}</div>
        </div>
      )
    }
    return <div className="font-medium">{userName}</div>
  }

  const getMatchStatusBadge = (match) => {
    if (match.status === 'COMPLETED') {
      return <span className="text-xs text-success-600">✓ Complete</span>
    }
    if (match.status === 'BYE') {
      return <span className="text-xs text-gray-500">BYE</span>
    }
    if (match.status === 'IN_PROGRESS') {
      return <span className="text-xs text-warning-600">● Live</span>
    }
    if (!match.participant1 || !match.participant2) {
      return <span className="text-xs text-gray-400">TBD</span>
    }
    return <span className="text-xs text-gray-600">Pending</span>
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-8 min-w-full px-4">
        {rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex flex-col justify-around min-w-[300px]">
            {/* Round Header */}
            <div className="text-center mb-6 sticky top-0 bg-white z-10 py-2">
              <h3 className="font-bold text-lg text-gray-900">
                {getRoundName(round.roundNumber, rounds.length)}
              </h3>
              <p className="text-sm text-gray-500">
                {round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}
              </p>
            </div>

            {/* Matches */}
            <div className="flex flex-col justify-around gap-8 flex-1">
              {round.matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => onMatchClick && onMatchClick(match)}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    match.status === 'COMPLETED'
                      ? 'border-success-200 bg-success-50'
                      : match.status === 'BYE'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-primary-400 hover:shadow-md cursor-pointer'
                  }`}
                >
                  {/* Match Number */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">
                      M{match.matchNumber}
                    </span>
                    {getMatchStatusBadge(match)}
                  </div>

                  {/* Participant 1 */}
                  <div className={`p-3 rounded-lg mb-2 ${
                    match.winnerId === match.participant1Id
                      ? 'bg-warning-100 border-2 border-warning-400'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex-1">
                        {getParticipantDisplay(match.participant1)}
                      </div>
                      {match.winnerId === match.participant1Id && (
                        <span className="text-warning-600 ml-2">👑</span>
                      )}
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="text-center text-xs text-gray-400 my-1">vs</div>

                  {/* Participant 2 */}
                  <div className={`p-3 rounded-lg ${
                    match.winnerId === match.participant2Id
                      ? 'bg-warning-100 border-2 border-warning-400'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex-1">
                        {getParticipantDisplay(match.participant2)}
                      </div>
                      {match.winnerId === match.participant2Id && (
                        <span className="text-warning-600 ml-2">👑</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  {match.score && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 text-center font-medium">
                        {match.score}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SingleEliminationBracket
