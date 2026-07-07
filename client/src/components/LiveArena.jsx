import { useState } from 'react'

const LiveArena = () => {
  const [activeTab, setActiveTab] = useState('circle') // circle, turf, spotlight

  // Placeholder data
  const circleItems = [
    { id: 1, type: 'live', player1: 'Alex', player2: 'Jordan', score: '21-18' },
    { id: 2, type: 'result', player: 'Sam', result: 'Won Finals 21-19' },
  ]

  const turfItems = [
    { id: 1, name: 'City Championships', location: '2.3 km away', status: 'Registration Open' },
  ]

  const spotlightItems = [
    { id: 1, title: 'National Finals Live', subtitle: 'Championship Match' },
    { id: 2, title: 'Record Breaking Performance', subtitle: '5 consecutive wins' },
  ]

  return (
    <>
      <style>{`
        .live-arena-container {
          background: rgba(6, 13, 31, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          height: fit-content;
          min-height: 500px;
          position: relative;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.1);
          max-width: 380px;
          width: 100%;
          margin-right: 1.5rem;
        }

        .arena-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #00d4ff;
          margin-bottom: 1.5rem;
          text-align: center;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .top-section {
          margin-bottom: 1.5rem;
        }

        .arena-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
        }

        .arena-tab {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
          white-space: nowrap;
          flex: 1;
        }

        .arena-tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
        }

        .arena-tab.active {
          color: #4fffb0;
          background: rgba(79, 255, 176, 0.08);
        }

        .arena-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 150px;
        }

        .spotlight-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent);
          margin: 2rem 0 1.5rem 0;
        }

        .spotlight-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .spotlight-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ec4899;
          text-align: center;
          text-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
        }

        /* Liquid glass cards for YOUR CIRCLE and HOME TURF */
        .liquid-card {
          background: rgba(10, 22, 40, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .liquid-card:hover {
          background: rgba(10, 22, 40, 0.7);
          border-color: rgba(79, 255, 176, 0.2);
          transform: translateY(-2px);
        }

        /* Aurora cards for THE SPOTLIGHT */
        .aurora-card {
          position: relative;
          background: rgba(10, 22, 40, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .aurora-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(236, 72, 153, 0.1) 50%,
            transparent 70%
          );
          animation: aurora-rotate 6s linear infinite;
        }

        .aurora-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(79, 255, 176, 0.3),
            rgba(236, 72, 153, 0.3),
            rgba(79, 255, 176, 0.3)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: aurora-border 3s ease-in-out infinite;
        }

        @keyframes aurora-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes aurora-border {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        .aurora-card:hover {
          transform: translateY(-2px);
        }

        .card-content {
          position: relative;
          z-index: 1;
        }

        .card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          margin-bottom: 0.3rem;
        }

        .card-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .live-indicator {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          margin-right: 0.5rem;
          animation: pulse-live 2s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
        }
      `}</style>

      <div className="live-arena-container">
        <div className="arena-header">LIVE ARENA</div>

        {/* Top Section - Your Circle & Home Turf */}
        <div className="top-section">
          <div className="arena-tabs">
            <button
              className={`arena-tab ${activeTab === 'circle' ? 'active' : ''}`}
              onClick={() => setActiveTab('circle')}
            >
              Your Circle
            </button>
            <button
              className={`arena-tab ${activeTab === 'turf' ? 'active' : ''}`}
              onClick={() => setActiveTab('turf')}
            >
              Home Turf
            </button>
          </div>

          <div className="arena-content">
            {activeTab === 'circle' && (
              <>
                {circleItems.map(item => (
                  <div key={item.id} className="liquid-card">
                    <div className="card-content">
                      {item.type === 'live' && (
                        <>
                          <div className="card-title">
                            <span className="live-indicator"></span>
                            {item.player1} vs {item.player2}
                          </div>
                          <div className="card-subtitle">{item.score}</div>
                        </>
                      )}
                      {item.type === 'result' && (
                        <>
                          <div className="card-title">{item.player}</div>
                          <div className="card-subtitle">{item.result}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'turf' && (
              <>
                <div style={{
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  Tournaments near you
                </div>
                {turfItems.map(item => (
                  <div key={item.id} className="liquid-card">
                    <div className="card-content">
                      <div className="card-title">{item.name}</div>
                      <div className="card-subtitle">{item.location}</div>
                      <div className="card-subtitle">{item.status}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="spotlight-divider"></div>

        {/* Spotlight Section */}
        <div className="spotlight-section">
          <div className="spotlight-header">THE SPOTLIGHT</div>
          {spotlightItems.map(item => (
            <div key={item.id} className="aurora-card">
              <div className="card-content">
                <div className="card-title">{item.title}</div>
                <div className="card-subtitle">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default LiveArena
