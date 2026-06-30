import { useState, useRef, useEffect } from 'react'
import EditScoreButton from './EditScoreButton'

const SingleEliminationBracket = ({ matches, onMatchClick, onCaptureScorecard, eventName, tournamentName }) => {
  const [zoom, setZoom] = useState(100)
  const bracketRef = useRef(null)
  const [connectorLines, setConnectorLines] = useState([])

  // Group matches by round
  const roundsMap = {}
  matches.forEach(match => {
    if (!roundsMap[match.roundNumber]) {
      roundsMap[match.roundNumber] = []
    }
    roundsMap[match.roundNumber].push(match)
  })

  // Sort rounds in ascending order (lowest round number first = final on right)
  // Database stores: higher roundNumber = earlier round, so reverse for display
  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => b - a) // Keep descending to show early rounds first
    .map(roundNum => ({
      roundNumber: roundNum,
      matches: roundsMap[roundNum].sort((a, b) => a.matchNumber - b.matchNumber)
    }))

  // Build a map of matches by ID for looking up connections
  const matchesById = {}
  matches.forEach(match => {
    matchesById[match.id] = match
  })

  // Calculate connector lines after render
  useEffect(() => {
    const calculateLines = () => {
      if (!bracketRef.current) return

      const lines = []
      const container = bracketRef.current

      matches.forEach(match => {
        if (!match.nextMatchId) return

        const sourceCard = container.querySelector(`[data-match-id="${match.id}"]`)
        const targetCard = container.querySelector(`[data-match-id="${match.nextMatchId}"]`)

        if (sourceCard && targetCard) {
          const containerRect = container.getBoundingClientRect()
          const scale = zoom / 100

          // Find the participants container inside each card (the anchor point)
          const sourceParticipants = sourceCard.querySelector('[data-participants-container]')
          const targetParticipants = targetCard.querySelector('[data-participants-container]')

          // Use participants container if available, otherwise fallback to card center
          const sourceRect = sourceParticipants ? sourceParticipants.getBoundingClientRect() : sourceCard.getBoundingClientRect()
          const targetRect = targetParticipants ? targetParticipants.getBoundingClientRect() : targetCard.getBoundingClientRect()

          // Start at right edge of source card, but vertical center of participants area
          const x1 = (sourceCard.getBoundingClientRect().right - containerRect.left) / scale
          const y1 = (sourceRect.top + sourceRect.height / 2 - containerRect.top) / scale

          // End at left edge of target card, but vertical center of participants area
          const x2 = (targetCard.getBoundingClientRect().left - containerRect.left) / scale
          const y2 = (targetRect.top + targetRect.height / 2 - containerRect.top) / scale

          // Create elbow connector: horizontal, then vertical, then horizontal
          const midX = x1 + (x2 - x1) / 2

          lines.push({
            id: match.id,
            path: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`,
            status: match.status
          })
        }
      })

      setConnectorLines(lines)
    }

    // Delay calculation to ensure DOM is ready after zoom
    const timeout = setTimeout(calculateLines, 50)

    window.addEventListener('resize', calculateLines)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', calculateLines)
    }
  }, [matches, zoom])

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

  const getRoundLabel = (roundNumber) => {
    // Simple and consistent: just show R{roundNumber}
    return `R${roundNumber}`
  }

  const getParticipantLabel = (participant, match, position) => {
    // If participant exists, show their player ID and name
    if (participant) {
      if (participant.user) {
        const playerId = participant.playerId ? `${participant.playerId}: ` : ''
        const userName = `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim()
        if (participant.partner && participant.partner.firstName) {
          const partnerName = `${participant.partner.firstName} ${participant.partner.lastName || ''}`.trim()
          return `${playerId}${userName ? `${userName} / ${partnerName}` : partnerName}`
        }
        return `${playerId}${userName || 'Unknown Player'}`
      }
      // Fallback if user object is missing but participant exists
      return participant.playerId ? `${participant.playerId}: Player TBD` : 'Player TBD'
    }

    // Find source match that feeds into this position
    const sourceMatch = matches.find(m => m.nextMatchId === match.id && m.feedsPosition === position)

    if (sourceMatch) {
      // If source match is completed or auto-advanced (BYE)
      if (sourceMatch.status === 'COMPLETED' || sourceMatch.status === 'BYE') {
        // Try to get winner from winnerId by finding the participant
        if (sourceMatch.winnerId) {
          // Check participant1 or participant2 based on winnerId
          const winnerParticipant = sourceMatch.winnerId === sourceMatch.participant1Id
            ? sourceMatch.participant1
            : sourceMatch.participant2

          if (winnerParticipant && winnerParticipant.user) {
            const winnerName = `${winnerParticipant.user.firstName || ''} ${winnerParticipant.user.lastName || ''}`.trim()
            if (winnerParticipant.partner && winnerParticipant.partner.firstName) {
              const partnerName = `${winnerParticipant.partner.firstName} ${winnerParticipant.partner.lastName || ''}`.trim()
              return winnerName ? `${winnerName} / ${partnerName}` : partnerName
            }
            return winnerName || 'Winner Advancing'
          }

          // Fallback to winner object if participant lookup fails
          if (sourceMatch.winner && sourceMatch.winner.user) {
            const winnerName = `${sourceMatch.winner.user.firstName || ''} ${sourceMatch.winner.user.lastName || ''}`.trim()
            if (sourceMatch.winner.partner) {
              return `${winnerName} / ${sourceMatch.winner.partner.firstName} ${sourceMatch.winner.partner.lastName || ''}`.trim()
            }
            return winnerName || 'Winner Advancing'
          }
        }
        return 'Winner Advancing'
      }

      // Source match is still pending or ready
      return `Winner of M${sourceMatch.matchNumber || '?'}`
    }

    // No source match found
    return 'TBD'
  }

  const getStatusColor = (match) => {
    if (match.status === 'COMPLETED') return 'border-green-500 bg-green-50'
    if (match.status === 'IN_PROGRESS') return 'border-blue-500 bg-blue-50'
    if (match.status === 'BYE') return 'border-green-400 bg-green-50/50'
    if (match.status === 'READY') return 'border-amber-500 bg-amber-50'
    if (!match.participant1 || !match.participant2) return 'border-yellow-400 bg-yellow-50/50'
    return 'border-gray-300 bg-white'
  }

  const getStatusIndicator = (match) => {
    const indicators = {
      COMPLETED: { dot: 'bg-green-500', text: 'Done', textColor: 'text-green-700' },
      BYE: { dot: 'bg-green-400', text: 'Auto', textColor: 'text-green-700' },
      READY: { dot: 'bg-amber-500', text: 'Ready', textColor: 'text-amber-700' },
      PENDING: { dot: 'bg-gray-400', text: 'Wait', textColor: 'text-gray-600' }
    }

    const status = match.status || 'PENDING'
    const indicator = indicators[status] || indicators.PENDING

    return (
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${indicator.dot}`}></div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${indicator.textColor}`}>
          {indicator.text}
        </span>
      </div>
    )
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(150, prev + 10))
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 10))
  const handleFitToScreen = () => {
    if (!bracketRef.current) return
    const container = bracketRef.current.parentElement
    const bracket = bracketRef.current
    const availableWidth = container?.clientWidth || 0
    const bracketWidth = bracket.scrollWidth || 1

    // Prevent division by zero
    if (bracketWidth === 0) return

    const fitZoom = Math.floor((availableWidth / bracketWidth) * 100)
    setZoom(Math.min(100, Math.max(50, fitZoom)))
  }
  const handlePrint = () => {
    // Trigger browser print dialog
    setTimeout(() => {
      window.print()
    }, 100)
  }

  // BYE/Auto-Advanced match card - Consistent size with regular matches
  const renderByeMatch = (match) => {
    const participant = match.participant1 || match.participant2

    return (
      <div
        key={match.id}
        data-match-id={match.id}
        data-bye-match="true"
        className={`compact-match-card border-2 rounded-xl transition-all relative z-10 flex flex-col overflow-hidden ${getStatusColor(match)}`}
        style={{ width: '260px', minHeight: '280px' }}
      >
        {/* Schedule strip */}
        <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 text-center flex-shrink-0">
          {match.scheduledAt ? (
            <span className="text-[10px] font-semibold text-blue-700">
              {new Date(match.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' • '}
              {new Date(match.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              {match.courtName && <> • {match.courtName}</>}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-gray-400">Not Scheduled</span>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-800">M{match.matchNumber} {getRoundLabel(match.roundNumber)}</span>
          {getStatusIndicator(match)}
        </div>

        {/* Auto-Advanced player */}
        <div className="px-3 py-3 flex-shrink-0" data-participants-container>
          <div className="bg-white border border-green-400 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Auto Advanced</span>
            </div>
            <div className="text-xs font-medium text-gray-900 truncate">
              {participant ? (
                participant.partner
                  ? <>{participant.user.firstName} {participant.user.lastName} / {participant.partner.firstName} {participant.partner.lastName}</>
                  : <>{participant.user.firstName} {participant.user.lastName}</>
              ) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Match card
  const renderMatch = (match) => {
    const isClickable = onMatchClick && match.status !== 'BYE' && (match.participant1 && match.participant2)
    const p1Name = getParticipantLabel(match.participant1, match, 1)
    const p2Name = getParticipantLabel(match.participant2, match, 2)
    const isP1Winner = match.winnerId === match.participant1Id
    const isP2Winner = match.winnerId === match.participant2Id
    const showButton = (match.status === 'COMPLETED' || match.status === 'READY') && onMatchClick

    return (
      <div
        key={match.id}
        data-match-id={match.id}
        onClick={() => isClickable && onMatchClick(match)}
        className={`compact-match-card border-2 rounded-xl transition-all relative z-10 flex flex-col overflow-hidden ${getStatusColor(match)} ${
          isClickable ? 'hover:border-primary-500 hover:shadow-md cursor-pointer' : ''
        }`}
        style={{ width: '260px', minHeight: '280px' }}
      >
        {/* Schedule strip */}
        <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 text-center flex-shrink-0">
          {match.scheduledAt ? (
            <span className="text-[10px] font-semibold text-blue-700">
              {new Date(match.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' • '}
              {new Date(match.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              {match.courtName && <> • {match.courtName}</>}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-gray-400">Not Scheduled</span>
          )}
        </div>

        {/* Match number + status */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-800">M{match.matchNumber} {getRoundLabel(match.roundNumber)}</span>
          {getStatusIndicator(match)}
        </div>

        {/* Players */}
        <div className="px-3 pt-3 pb-2 space-y-2 flex-shrink-0" data-participants-container>
          <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between min-h-[38px] ${
            isP1Winner && match.status === 'COMPLETED'
              ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-400'
              : 'bg-white border border-gray-200'
          }`}>
            <span className={`text-xs truncate flex-1 min-w-0 ${
              match.participant1 ? 'font-medium text-gray-900' : 'italic text-gray-400'
            }`}>{p1Name}</span>
            {isP1Winner && match.status === 'COMPLETED' && (
              <span className="text-[9px] px-2 py-0.5 bg-amber-500 text-white rounded font-bold ml-2 flex-shrink-0">W</span>
            )}
          </div>

          <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between min-h-[38px] ${
            isP2Winner && match.status === 'COMPLETED'
              ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-400'
              : 'bg-white border border-gray-200'
          }`}>
            <span className={`text-xs truncate flex-1 min-w-0 ${
              match.participant2 ? 'font-medium text-gray-900' : 'italic text-gray-400'
            }`}>{p2Name}</span>
            {isP2Winner && match.status === 'COMPLETED' && (
              <span className="text-[9px] px-2 py-0.5 bg-amber-500 text-white rounded font-bold ml-2 flex-shrink-0">W</span>
            )}
          </div>
        </div>

        {/* Score display and Edit button - consistent spacing */}
        <div className="px-3 pb-3 pt-1 flex-shrink-0">
          {match.score && match.status === 'COMPLETED' && (
            <div className="text-[10px] text-gray-500 font-medium text-center mb-1">{match.score}</div>
          )}
          {showButton && (
            <EditScoreButton
              onManualEntry={() => onMatchClick(match)}
              onCaptureScore={() => onCaptureScorecard?.(match)}
            />
          )}
          {/* Maintain consistent card height even without button */}
          {!showButton && <div className="h-8"></div>}
        </div>
      </div>
    )
  }

  return (
    <div className="bracket-container relative">
      {/* Zoom Controls - Hidden in print */}
      <div className="no-print sticky top-4 right-4 z-20 flex justify-end mb-4">
        <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 shadow-lg">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
          >
            −
          </button>
          <span className="text-sm font-semibold text-gray-700 w-12 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 150}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
          >
            +
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            onClick={handleFitToScreen}
            className="px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Fit
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Print Header - Only visible in print */}
      <style>{`
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="print-only" style={{ display: 'none' }}>
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
          <h1 className="text-2xl font-bold text-gray-900">{tournamentName}</h1>
          <h2 className="text-lg font-semibold text-gray-700 mt-1">{eventName}</h2>
          <p className="text-sm text-gray-600 mt-2">Single Elimination Bracket</p>
        </div>
      </div>

      {/* Bracket with Zoom Transform */}
      <div className="overflow-x-auto pb-8 bracket-scroll-container">
        <div
          ref={bracketRef}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left'
          }}
          className="relative inline-flex gap-16 px-4 bracket-inner"
        >
          {/* SVG Connector Lines - Always behind cards */}
          <svg
            className="absolute top-0 left-0 pointer-events-none overflow-visible"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 1
            }}
            preserveAspectRatio="none"
          >
            {connectorLines.map((line) => (
              <path
                key={line.id}
                d={line.path}
                stroke={line.status === 'COMPLETED' || line.status === 'BYE' ? '#10b981' : '#d1d5db'}
                strokeWidth={2 / (zoom / 100)}
                fill="none"
                opacity="0.6"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Rounds */}
          {rounds.map((round, roundIndex) => (
            <div key={round.roundNumber} className="flex flex-col min-w-[260px] relative z-10 isolate">
              {/* Round Header - Compact */}
              <div className="text-center mb-6 sticky top-0 bg-white z-10 pb-3 border-b-2 border-gray-200">
                <div className="inline-block px-4 py-1.5 bg-primary-600 rounded-full">
                  <h3 className="font-bold text-sm text-white">
                    {getRoundName(round.roundNumber, rounds.length)}
                  </h3>
                </div>
                <p className="text-[10px] text-gray-600 font-medium mt-1.5">
                  {round.matches.filter(m => m.status !== 'BYE').length} match{round.matches.filter(m => m.status !== 'BYE').length !== 1 ? 'es' : ''}
                  {round.matches.filter(m => m.status === 'BYE').length > 0 && (
                    <span className="text-green-600 ml-1">• {round.matches.filter(m => m.status === 'BYE').length} auto</span>
                  )}
                </p>
              </div>

              {/* Matches - Compact Layout */}
              <div className="flex flex-col justify-around gap-6 flex-1">
                {round.matches.map((match) => (
                  match.status === 'BYE' ? renderByeMatch(match) : renderMatch(match)
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SingleEliminationBracket
