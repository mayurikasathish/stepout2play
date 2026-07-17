// GroupCard.jsx
// Displays one Round Robin group: standings table + fixture list
import EditScoreButton from './EditScoreButton'
import { formatMatchScore } from '../utils/scoreFormatter'

// Helper to get rating change for a participant (registration)
const getRatingChange = (match, participant) => {
  if (!match.ratingChanges || match.ratingChanges.length === 0 || !participant) return null

  // participant is a Registration object with userId
  const userId = participant.userId
  if (!userId) return null

  // Find the rating change for this user
  const change = match.ratingChanges.find(rc => rc.userId === userId)
  if (!change) return null

  const delta = Math.round(change.ratingChange)
  return {
    delta,
    newRating: Math.round(change.newRating),
    oldRating: Math.round(change.oldRating)
  }
}

const STATUS_CONFIG = {
  PENDING:     { label: 'Upcoming', dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50'   },
  READY:       { label: 'Ready',    dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
  IN_PROGRESS: { label: 'Live',     dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
  COMPLETED:   { label: 'Done',     dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  }
}

const getParticipantName = (reg) => {
  if (!reg) return 'TBD'
  const teamName = reg.teamName ? `${reg.teamName} - ` : ''
  const name = `${reg.user.firstName} ${reg.user.lastName}`
  if (reg.partner) return `${teamName}${name} / ${reg.partner.firstName} ${reg.partner.lastName}`
  return name
}

const getInitials = (reg) => {
  if (!reg) return '?'
  return `${reg.user.firstName[0]}${reg.user.lastName[0]}`
}

const GroupCard = ({ group, isOrganizer, onMatchClick, onCaptureScorecard }) => {
  const groupStatus = STATUS_CONFIG[group.status] || STATUS_CONFIG.PENDING

  // Standings sorted by points desc, wins desc (backend already sorts, but just in case)
  const standings = [...group.standings].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : b.wins - a.wins
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Group Header */}
      <div className="bg-[#1B4332] px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg tracking-wide">{group.name}</h3>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${groupStatus.bg} ${groupStatus.text}`}>
          <span className={`w-2 h-2 rounded-full ${groupStatus.dot}`} />
          {groupStatus.label}
        </span>
      </div>

      {/* Standings Table */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Standings</p>
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium w-6">#</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">Player</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium w-8">W</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium w-8">D</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium w-8">L</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium w-10">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {standings.map((standing, idx) => (
                <tr
                  key={standing.id}
                  className={idx === 0 && group.status === 'COMPLETED' ? 'bg-green-50' : ''}
                >
                  <td className="px-3 py-2.5 text-gray-400 text-xs font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">
                          {getInitials(standing.registration)}
                        </span>
                      </div>
                      <span className={`font-medium truncate max-w-[120px] ${idx === 0 && group.status === 'COMPLETED' ? 'text-green-800' : 'text-gray-900'}`}>
                        {getParticipantName(standing.registration)}
                      </span>
                      {idx === 0 && group.status === 'COMPLETED' && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-700 font-medium">{standing.wins}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{standing.draws}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{standing.losses}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-bold text-[#1B4332]">{standing.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 px-1">Win=3pts · Draw=1pt · Loss=0pts</p>
      </div>

      {/* Fixtures */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Fixtures</p>
        <div className="space-y-2">
          {group.matches.map((match) => {
            const statusCfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.PENDING
            const isClickable = isOrganizer && match.status === 'READY'
            const isCompleted = match.status === 'COMPLETED'

            return (
              <div
                key={match.id}
                onClick={() => isClickable && onMatchClick && onMatchClick(match)}
                className={`rounded-xl border transition-all relative ${
                  isClickable
                    ? 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 hover:border-orange-300'
                    : isCompleted
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                {/* Scheduled Time Strip - Thin bar at top */}
                {match.scheduledAt && (
                  <div className="bg-blue-50 border-b border-blue-100 px-2 py-0.5 text-center">
                    <span className="text-[9px] font-medium text-blue-700">
                      {new Date(match.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' • '}
                      {new Date(match.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {match.courtName && <> • {match.courtName}</>}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3">
                  {/* Match ID */}
                  <span className="text-xs text-gray-400 font-mono w-14 shrink-0">
                    {match.bracketPosition?.split('-').slice(1).join('-') || `M${match.matchNumber}`}
                  </span>

                {/* Players */}
                <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                  <div className="flex flex-col items-end max-w-[100px]">
                    <span className={`text-sm font-medium truncate ${
                      isCompleted && match.winnerId === match.participant1Id ? 'text-green-700 font-bold' : 'text-gray-800'
                    }`}>
                      {getParticipantName(match.participant1)}
                    </span>
                    {isCompleted && match.participant1 && (() => {
                      const ratingChange = getRatingChange(match, match.participant1)
                      if (!ratingChange) return null
                      const isPositive = ratingChange.delta > 0
                      return (
                        <span className={`text-[9px] font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{ratingChange.delta}
                        </span>
                      )
                    })()}
                  </div>

                  <span className="text-xs text-gray-400 shrink-0 font-medium">
                    {isCompleted && match.score ? formatMatchScore(match.score) : 'vs'}
                  </span>

                  <div className="flex flex-col items-start max-w-[100px]">
                    <span className={`text-sm font-medium truncate ${
                      isCompleted && match.winnerId === match.participant2Id ? 'text-green-700 font-bold' : 'text-gray-800'
                    }`}>
                      {getParticipantName(match.participant2)}
                    </span>
                    {isCompleted && match.participant2 && (() => {
                      const ratingChange = getRatingChange(match, match.participant2)
                      if (!ratingChange) return null
                      const isPositive = ratingChange.delta > 0
                      return (
                        <span className={`text-[9px] font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{ratingChange.delta}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                  {/* Status badge or Edit button */}
                  <div className="flex items-center gap-2 shrink-0 justify-end min-w-[120px]">
                    {(isCompleted || match.status === 'READY') && isOrganizer ? (
                      <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <EditScoreButton
                          onManualEntry={() => onMatchClick && onMatchClick(match)}
                          onCaptureScore={() => onCaptureScorecard?.(match)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span className={`text-xs font-medium ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GroupCard
