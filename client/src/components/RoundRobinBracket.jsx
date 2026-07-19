// RoundRobinBracket.jsx
// Renders all groups side-by-side with zoom/fit controls, matching the
// SingleEliminationBracket UI conventions already in the app.

import { useState, useRef } from 'react'
import GroupCard from './GroupCard'

const RoundRobinBracket = ({ groups, isOrganizer, onMatchClick, onCaptureScorecard, onWalkover, eventName, tournamentName }) => {
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef(null)

  const handleZoomIn  = () => setZoom(z => Math.min(z + 10, 150))
  const handleZoomOut = () => setZoom(z => Math.max(z - 10, 40))
  const handleFit     = () => setZoom(100)

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `${tournamentName} - ${eventName} - Round Robin Bracket`
    window.print()
    document.title = originalTitle
  }

  const totalMatches    = groups.reduce((sum, g) => sum + g.matches.length, 0)
  const completedMatches = groups.reduce((sum, g) => sum + g.matches.filter(m => m.status === 'COMPLETED').length, 0)
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* ── Controls Bar ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            {completedMatches}/{totalMatches} matches complete
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1B4332] rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[#1B4332]">{progressPct}%</span>
        </div>

        {/* Zoom controls — same style as SingleEliminationBracket */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-1 py-1">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-700 w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={handleFit}
              className="px-3 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors"
              title="Reset zoom"
            >
              Fit
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] hover:bg-[#15372a] text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* ── Groups Grid ── */}
      <div
        ref={containerRef}
        className="overflow-auto flex-1"
        style={{ minHeight: '400px' }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
            // Expand container so scrollbar appears at correct position
            width: `${100 / (zoom / 100)}%`
          }}
        >
          <div
            className="grid gap-6 pb-6"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(340px, 1fr))`
            }}
          >
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isOrganizer={isOrganizer}
                onMatchClick={onMatchClick}
                onCaptureScorecard={onCaptureScorecard}
                onWalkover={onWalkover}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          No groups found.
        </div>
      )}
    </div>
  )
}

export default RoundRobinBracket
