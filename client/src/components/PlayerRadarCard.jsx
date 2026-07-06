import { useState, useEffect } from 'react'

const PlayerRadarCard = () => {
  const [isAnimated, setIsAnimated] = useState(false)
  const [activeVertex, setActiveVertex] = useState(0)

  // Stats data
  const stats = {
    winRate: 72,
    clutchIndex: 65,
    form: 80,
    experience: 45,
    availability: 85, // Calculated: matches played without walkover/disqual / matches registered
    versatility: 50,  // 3 sports out of max 6 sports → (3/6) * 100 = 50%
  }

  const playerName = "SAM"

  const greetings = [
    "Ready for today's matches?",
    "Let's build something competitive.",
    "The court is yours.",
    "One platform. Every tournament.",
    "Another tournament awaits.",
    "Time to crown a champion.",
    "What're you playing today?",
    "Every match tells a story.",
    "Where champions are made.",
    "Keep the game moving."
  ]

  const [currentGreeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)])

  // Chart config
  const cx = 175 // center x
  const cy = 175 // center y
  const maxRadius = 100
  const numPoints = 6

  // Metrics in clockwise order from top
  const metrics = [
    { key: 'winRate', label: 'Win Rate', value: stats.winRate },
    { key: 'clutchIndex', label: 'Clutch Index', value: stats.clutchIndex },
    { key: 'form', label: 'Form', value: stats.form },
    { key: 'experience', label: 'Experience', value: stats.experience },
    { key: 'availability', label: 'Availability', value: stats.availability },
    { key: 'versatility', label: 'Versatility', value: stats.versatility },
  ]

  // Calculate point position with bulge effect
  const getPoint = (index, radiusPercent, isBulging = false) => {
    const angle = (index * 360 / numPoints) * (Math.PI / 180)
    const bulgeAmount = isBulging ? 1.15 : 1 // 15% bulge
    const r = maxRadius * (radiusPercent / 100) * bulgeAmount
    return {
      x: cx + r * Math.sin(angle),
      y: cy - r * Math.cos(angle),
    }
  }

  // Generate rounded polygon path (smooth curves at vertices)
  const getRoundedPolygonPath = (values) => {
    const points = values.map((value, i) => getPoint(i, value, i === activeVertex))
    const cornerRadius = 8 // Small rounding

    let path = ''
    for (let i = 0; i < points.length; i++) {
      const current = points[i]
      const next = points[(i + 1) % points.length]
      const prev = points[(i - 1 + points.length) % points.length]

      // Calculate direction vectors
      const dx1 = current.x - prev.x
      const dy1 = current.y - prev.y
      const dx2 = next.x - current.x
      const dy2 = next.y - current.y

      // Normalize
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

      const ndx1 = dx1 / len1
      const ndy1 = dy1 / len1
      const ndx2 = dx2 / len2
      const ndy2 = dy2 / len2

      // Control points for smooth curve
      const cp1x = current.x - ndx1 * cornerRadius
      const cp1y = current.y - ndy1 * cornerRadius
      const cp2x = current.x + ndx2 * cornerRadius
      const cp2y = current.y + ndy2 * cornerRadius

      if (i === 0) {
        path += `M ${cp1x} ${cp1y} `
      }

      path += `Q ${current.x} ${current.y} ${cp2x} ${cp2y} `

      if (i < points.length - 1) {
        path += `L ${points[(i + 1) % points.length].x - ndx2 * cornerRadius} ${points[(i + 1) % points.length].y - ndy2 * cornerRadius} `
      }
    }
    path += 'Z'
    return path
  }

  // Background hexagon rings (simple polygons)
  const backgroundRings = [33, 66, 100].map(percent => ({
    percent,
    path: getRoundedPolygonPath(Array(numPoints).fill(percent))
  }))

  // Data polygon path
  const dataPoints = metrics.map(m => m.value)
  const dataPolygonPath = getRoundedPolygonPath(dataPoints)

  // Trigger animation on mount
  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100)
  }, [])

  // Bulge animation - cycle through vertices
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVertex(prev => (prev + 1) % numPoints)
    }, 1000) // Each vertex bulges for 1 second
    return () => clearInterval(interval)
  }, [])

  // Overall rating (average)
  const overallRating = Math.round(dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }

        .radar-container {
          display: inline-block;
        }

        .chart-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .player-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.8rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ec4899;
        }

        .rating-badge {
          background: rgba(236, 72, 153, 0.15);
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: #ec4899;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .vertex-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .data-polygon {
          transition: all 0.5s ease-out;
        }

        .metric-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.7rem;
          fill: rgba(255,255,255,0.6);
          text-anchor: middle;
          text-transform: capitalize;
        }

        .metric-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          fill: #ec4899;
          text-anchor: middle;
        }

        .center-rank {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 4rem;
          fill: #fff;
          opacity: 0.12;
          text-anchor: middle;
          dominant-baseline: middle;
        }

        .center-label {
          font-family: 'Barlow', sans-serif;
          font-size: 0.65rem;
          fill: rgba(255,255,255,0.3);
          text-anchor: middle;
          letter-spacing: 0.1em;
        }

      `}</style>

      <div className="radar-container">
        {/* Radar Chart */}
        <svg width="350" height="350" viewBox="0 0 350 350">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background hexagon rings */}
            {backgroundRings.map((ring, i) => (
              <path
                key={i}
                d={ring.path}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            ))}

            {/* Spokes from center to vertices */}
            {metrics.map((_, i) => {
              const point = getPoint(i, 100)
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={point.x}
                  y2={point.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              )
            })}

            {/* Data polygon - NEON PINK */}
            <path
              d={dataPolygonPath}
              fill="rgba(236, 72, 153, 0.15)"
              stroke="#ec4899"
              strokeWidth="3"
              filter="url(#glow)"
              className="data-polygon"
            />

            {/* Labels - All at same fixed distance from center */}
            {metrics.map((metric, i) => {
              const angle = (i * 360 / numPoints) * (Math.PI / 180)

              // ALL labels at same fixed radius from center - far from the star
              const labelRadius = 135 // Same distance for all labels

              // Calculate group position
              let groupX = cx + labelRadius * Math.sin(angle)
              const groupY = cy - labelRadius * Math.cos(angle)

              // Adjust Clutch Index (index 1) to the right
              if (i === 1) groupX += 8

              return (
                <g key={i} transform={`translate(${groupX}, ${groupY})`}>
                  {/* Number at origin (0,0) */}
                  <text x="0" y="0" className="metric-value">
                    {metric.value}
                  </text>
                  {/* Label offset down by fixed amount */}
                  <text x="0" y="14" className="metric-label">
                    {metric.label}
                  </text>
                </g>
              )
            })}
        </svg>
      </div>
    </>
  )
}

export default PlayerRadarCard
