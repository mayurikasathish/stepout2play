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

  // Build a map of matches by ID for looking up source matches
  const matchesById = {}
  matches.forEach(match => {
    matchesById[match.id] = match
  })

  // Find source matches (matches that feed into this match)
  const findSourceMatches = (match) => {
    return matches.filter(m => m.nextMatchId === match.id)
  }

  const getRoundName = (roundNumber, totalRounds) => {
    const totalMatches = Math.pow(2, roundNumber - 1)

    if (roundNumber === 1) return 'Final'
    if (roundNumber === 2) return 'Semi Finals'
    if (roundNumber === 3) return 'Quarter Finals'
    if (roundNumber === 4) return 'Round of 16'
    if (roundNumber === 5) return 'Round of 32'
    if (roundNumber === 6) return 'Round of 64'
    if (roundNumber === 7) return 'Round of 128'

    return `Round of ${totalMatches * 2}`
  }

  const getParticipantLabel = (participant, match, position) => {
    // PRIORITY 1: If participant exists, ALWAYS show their name
    if (participant) {
      // Handle case where participant might not have user loaded
      if (!participant.user) {
        console.warn('Participant missing user data:', participant)
        return <div className="text-xs text-gray-400 italic">Participant data missing</div>
      }

      const userName = `${participant.user.firstName} ${participant.user.lastName}`
      if (participant.partner) {
        const partnerName = `${participant.partner.firstName} ${participant.partner.lastName}`
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-sm">{userName}</div>
            <div className="font-medium text-sm text-success-700">+ {partnerName}</div>
          </div>
        )
      }
      return <div className="font-medium text-sm">{userName}</div>
    }

    // PRIORITY 2: No participant in this slot - find source match
    const sourceMatches = findSourceMatches(match)
    const sourceMatch = sourceMatches.find(m => m.feedsPosition === position)

    if (sourceMatch) {
      // Source match exists - check if it has a winner
      if (sourceMatch.status === 'COMPLETED' || sourceMatch.status === 'BYE') {
        // Match is complete - show winner info or indicate it should be advanced
        if (sourceMatch.winnerId && sourceMatch.winner && sourceMatch.winner.user) {
          const winnerName = `${sourceMatch.winner.user.firstName} ${sourceMatch.winner.user.lastName}`
          if (sourceMatch.winner.partner) {
            return (
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-primary-600">{winnerName}</div>
                <div className="font-medium text-sm text-success-700">+ {sourceMatch.winner.partner.firstName} {sourceMatch.winner.partner.lastName}</div>
              </div>
            )
          }
          return <div className="font-medium text-sm text-primary-600">{winnerName}</div>
        }
        // Winner exists but data not loaded - show as pending
        return (
          <div className="text-xs text-amber-600 italic font-medium">
            Winner advancing...
          </div>
        )
      }

      // Match not complete yet - show which match to wait for
      return (
        <div className="text-xs text-gray-500 italic">
          Winner of Match {sourceMatch.matchNumber}
        </div>
      )
    }

    // PRIORITY 3: No participant and no source match found
    return <div className="text-xs text-gray-400 italic">Awaiting participant</div>
  }

  const getMatchBorderColor = (match) => {
    if (match.status === 'COMPLETED') return 'border-green-400'
    if (match.status === 'IN_PROGRESS') return 'border-blue-400'
    if (match.status === 'BYE') return 'border-green-300'
    if (match.status === 'READY') return 'border-yellow-400'
    if (!match.participant1 || !match.participant2) return 'border-yellow-300'
    return 'border-gray-300'
  }

  const getMatchBackgroundColor = (match) => {
    if (match.status === 'COMPLETED') return 'bg-green-50'
    if (match.status === 'IN_PROGRESS') return 'bg-blue-50'
    if (match.status === 'BYE') return 'bg-green-50/50'
    if (match.status === 'READY') return 'bg-yellow-50'
    if (!match.participant1 || !match.participant2) return 'bg-yellow-50/50'
    return 'bg-white'
  }

  const getMatchStatusBadge = (match) => {
    if (match.status === 'COMPLETED') {
      return <span className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-full font-semibold">Completed</span>
    }
    if (match.status === 'BYE') {
      return <span className="text-xs px-2.5 py-1 bg-green-400 text-white rounded-full font-semibold">Auto Advanced</span>
    }
    if (match.status === 'IN_PROGRESS') {
      return <span className="text-xs px-2.5 py-1 bg-blue-500 text-white rounded-full font-semibold animate-pulse">Live</span>
    }
    if (match.status === 'READY') {
      return <span className="text-xs px-2.5 py-1 bg-yellow-500 text-white rounded-full font-semibold">Ready to Play</span>
    }
    if (!match.participant1 || !match.participant2) {
      return <span className="text-xs px-2.5 py-1 bg-yellow-400 text-yellow-900 rounded-full font-semibold">Waiting</span>
    }
    return <span className="text-xs px-2.5 py-1 bg-gray-400 text-white rounded-full font-semibold">Upcoming</span>
  }

  // Render BYE match differently - show single participant auto-advancing
  const renderByeMatch = (match) => {
    const participant = match.participant1 || match.participant2

    return (
      <div
        key={match.id}
        className={`border-2 ${getMatchBorderColor(match)} ${getMatchBackgroundColor(match)} rounded-xl p-4 transition-all relative`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-600">
            Match {match.matchNumber}
          </span>
          {getMatchStatusBadge(match)}
        </div>

        {/* Auto Advanced Participant */}
        <div className="bg-white border-2 border-green-400 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-semibold text-green-700">AUTO ADVANCED</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {participant ? (
              participant.partner ? (
                <div className="space-y-0.5">
                  <div>{participant.user.firstName} {participant.user.lastName}</div>
                  <div className="text-success-700">+ {participant.partner.firstName} {participant.partner.lastName}</div>
                </div>
              ) : (
                <div>{participant.user.firstName} {participant.user.lastName}</div>
              )
            ) : (
              <div className="text-gray-400 italic">Unknown</div>
            )}
          </div>
        </div>

      </div>
    )
  }

  // Render normal match
  const renderMatch = (match) => {
    const isClickable = onMatchClick && match.status !== 'BYE' && (match.participant1 && match.participant2)

    return (
      <div
        key={match.id}
        onClick={() => isClickable && onMatchClick(match)}
        className={`border-2 ${getMatchBorderColor(match)} ${getMatchBackgroundColor(match)} rounded-xl p-4 transition-all relative ${
          isClickable ? 'hover:border-primary-500 hover:shadow-lg cursor-pointer' : ''
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-600">
            Match {match.matchNumber}
          </span>
          {getMatchStatusBadge(match)}
        </div>

        {/* Participant 1 */}
        <div className={`p-3 rounded-lg mb-2 transition-all ${
          match.winnerId === match.participant1Id
            ? 'bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-400 shadow-sm'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {getParticipantLabel(match.participant1, match, 1)}
            </div>
            {match.status === 'COMPLETED' && match.winnerId === match.participant1Id && (
              <div className="flex-shrink-0">
                <span className="text-xs px-2 py-1 bg-amber-500 text-white rounded-full font-bold shadow-sm">
                  WINNER
                </span>
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-center text-xs font-semibold text-gray-400 my-1.5">VS</div>

        {/* Participant 2 */}
        <div className={`p-3 rounded-lg transition-all ${
          match.winnerId === match.participant2Id
            ? 'bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-400 shadow-sm'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {getParticipantLabel(match.participant2, match, 2)}
            </div>
            {match.status === 'COMPLETED' && match.winnerId === match.participant2Id && (
              <div className="flex-shrink-0">
                <span className="text-xs px-2 py-1 bg-amber-500 text-white rounded-full font-bold shadow-sm">
                  WINNER
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        {match.score && match.status === 'COMPLETED' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Score:</span>
              <span className="text-sm text-gray-900 font-bold">{match.score}</span>
            </div>
          </div>
        )}

      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-12 min-w-full px-4">
        {rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex flex-col min-w-[320px] relative">
            {/* Round Header */}
            <div className="text-center mb-8 sticky top-0 bg-white z-10 pb-4 border-b-2 border-gray-200">
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-lg mb-2">
                <h3 className="font-bold text-lg text-white">
                  {getRoundName(round.roundNumber, rounds.length)}
                </h3>
              </div>
              <p className="text-sm text-gray-600 font-medium mt-2">
                {round.matches.filter(m => m.status !== 'BYE').length} {round.matches.filter(m => m.status !== 'BYE').length === 1 ? 'match' : 'matches'}
                {round.matches.filter(m => m.status === 'BYE').length > 0 && (
                  <span className="text-green-600 ml-2">
                    • {round.matches.filter(m => m.status === 'BYE').length} auto-advanced
                  </span>
                )}
              </p>
            </div>

            {/* Matches */}
            <div className="flex flex-col justify-around gap-8 flex-1">
              {round.matches.map((match) => (
                match.status === 'BYE' ? renderByeMatch(match) : renderMatch(match)
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default SingleEliminationBracket
