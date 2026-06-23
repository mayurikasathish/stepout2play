import { useState, useRef, useEffect } from 'react'

const SingleEliminationBracket = ({ matches, onMatchClick, eventName, tournamentName }) => {
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

  // Sort rounds in descending order (highest round number first = first round)
  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => b - a)
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
          // Get positions relative to the container (before scale)
          const sourceRect = sourceCard.getBoundingClientRect()
          const targetRect = targetCard.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Calculate positions accounting for zoom scale
          const scale = zoom / 100

          const x1 = (sourceRect.right - containerRect.left) / scale
          const y1 = (sourceRect.top + sourceRect.height / 2 - containerRect.top) / scale
          const x2 = (targetRect.left - containerRect.left) / scale
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
    return () => clearTimeout(timeout)
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

  const getParticipantLabel = (participant, match, position) => {
    // If participant exists, show their name
    if (participant && participant.user) {
      const userName = `${participant.user.firstName} ${participant.user.lastName}`
      if (participant.partner) {
        return `${userName} / ${participant.partner.firstName} ${participant.partner.lastName}`
      }
      return userName
    }

    // Find source match
    const sourceMatch = matches.find(m => m.nextMatchId === match.id && m.feedsPosition === position)

    if (sourceMatch) {
      if (sourceMatch.status === 'COMPLETED' || sourceMatch.status === 'BYE') {
        if (sourceMatch.winnerId && sourceMatch.winner && sourceMatch.winner.user) {
          const winnerName = `${sourceMatch.winner.user.firstName} ${sourceMatch.winner.user.lastName}`
          if (sourceMatch.winner.partner) {
            return `${winnerName} / ${sourceMatch.winner.partner.firstName} ${sourceMatch.winner.partner.lastName}`
          }
          return winnerName
        }
        return 'Advancing...'
      }
      return `Winner of M${sourceMatch.matchNumber}`
    }

    return 'Awaiting'
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
      IN_PROGRESS: { dot: 'bg-blue-500 animate-pulse', text: 'Live', textColor: 'text-blue-700' },
      BYE: { dot: 'bg-green-400', text: 'Auto', textColor: 'text-green-700' },
      READY: { dot: 'bg-amber-500', text: 'Ready', textColor: 'text-amber-700' },
      PENDING: { dot: 'bg-yellow-400', text: 'Wait', textColor: 'text-yellow-700' }
    }

    const status = match.status === 'PENDING' && (!match.participant1 || !match.participant2)
      ? 'PENDING'
      : match.status

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
    const availableWidth = container.clientWidth
    const bracketWidth = bracket.scrollWidth
    const fitZoom = Math.floor((availableWidth / bracketWidth) * 100)
    setZoom(Math.min(100, Math.max(50, fitZoom)))
  }
  const handlePrint = () => {
    // Trigger browser print dialog
    setTimeout(() => {
      window.print()
    }, 100)
  }

  // Compact BYE match card
  const renderByeMatch = (match) => {
    const participant = match.participant1 || match.participant2

    return (
      <div
        key={match.id}
        data-match-id={match.id}
        className={`compact-match-card border-2 rounded-lg p-2 transition-all ${getStatusColor(match)}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-500">M{match.matchNumber}</span>
          {getStatusIndicator(match)}
        </div>
        <div className="bg-white border border-green-400 rounded px-2 py-1">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide">Auto Advanced</span>
          </div>
          <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
            {participant ? (
              participant.partner ? (
                <>{participant.user.firstName} {participant.user.lastName} / {participant.partner.firstName} {participant.partner.lastName}</>
              ) : (
                <>{participant.user.firstName} {participant.user.lastName}</>
              )
            ) : 'Unknown'}
          </div>
        </div>
      </div>
    )
  }

  // Compact normal match card
  const renderMatch = (match) => {
    const isClickable = onMatchClick && match.status !== 'BYE' && (match.participant1 && match.participant2)
    const p1Name = getParticipantLabel(match.participant1, match, 1)
    const p2Name = getParticipantLabel(match.participant2, match, 2)
    const isP1Winner = match.winnerId === match.participant1Id
    const isP2Winner = match.winnerId === match.participant2Id

    return (
      <div
        key={match.id}
        data-match-id={match.id}
        onClick={() => isClickable && onMatchClick(match)}
        className={`compact-match-card border-2 rounded-lg p-2 transition-all ${getStatusColor(match)} ${
          isClickable ? 'hover:border-primary-500 hover:shadow-md cursor-pointer' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-600">M{match.matchNumber}</span>
          {getStatusIndicator(match)}
        </div>

        {/* Participants - Compact */}
        <div className="space-y-1">
          {/* Participant 1 */}
          <div className={`rounded px-2 py-0.5 flex items-center justify-between ${
            isP1Winner && match.status === 'COMPLETED'
              ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-400'
              : 'bg-white border border-gray-200'
          }`}>
            <span className={`text-xs truncate flex-1 ${
              match.participant1 ? 'font-medium text-gray-900' : 'italic text-gray-400 text-[11px]'
            }`}>
              {p1Name}
            </span>
            {isP1Winner && match.status === 'COMPLETED' && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded font-bold ml-1 flex-shrink-0">W</span>
            )}
          </div>

          {/* Participant 2 */}
          <div className={`rounded px-2 py-0.5 flex items-center justify-between ${
            isP2Winner && match.status === 'COMPLETED'
              ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-400'
              : 'bg-white border border-gray-200'
          }`}>
            <span className={`text-xs truncate flex-1 ${
              match.participant2 ? 'font-medium text-gray-900' : 'italic text-gray-400 text-[11px]'
            }`}>
              {p2Name}
            </span>
            {isP2Winner && match.status === 'COMPLETED' && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded font-bold ml-1 flex-shrink-0">W</span>
            )}
          </div>
        </div>

        {/* Score and Edit Button */}
        {match.score && match.status === 'COMPLETED' && (
          <div className="mt-1 pt-1 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[10px] text-gray-600 font-medium">{match.score}</span>
            {onMatchClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMatchClick(match)
                }}
                className="text-[9px] px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-all"
              >
                Edit
              </button>
            )}
          </div>
        )}
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
      <div className="print-only hidden">
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
          {/* SVG Connector Lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none overflow-visible"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 0
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
            <div key={round.roundNumber} className="flex flex-col min-w-[240px] relative z-10">
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
