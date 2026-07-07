import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import PlayerRadarCard from '../components/PlayerRadarCard'
import LiveArena from '../components/LiveArena'
import MatchCountdown from '../components/MatchCountdown'

const DashboardPage = () => {
  const { user } = useAuth()

  const greetings = [
  
    "Let's build something competitive.",
    "The court is yours.",
   
    "Another tournament awaits.",
    "Time to crown a champion.",
   
    "Every match tells a story.",

    "Keep the game moving."
  ]

  const [currentGreeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&family=Playfair+Display:ital@1&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow Condensed', sans-serif;
        }

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 80px;
        }

        .empty-dashboard {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          text-align: center;
          padding: 2rem;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem 2rem 2rem;
        }

        .demo-section {
          display: grid;
          grid-template-columns: 1fr 0.8fr 1fr;
          gap: 2rem;
          min-height: calc(100vh - 140px);
          padding-top: 0.5rem;
          position: relative;
        }

        .left-section {
          position: relative;
        }

        .center-section {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
        }

        .right-section {
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }

        .greeting-text {
          position: absolute;
          top: 0;
          left: 0;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          line-height: 1.2;
          max-width: 500px;
        }

        .greeting-name {
          color: #4fffb0;
          display: block;
          margin-bottom: 0.5rem;
          font-size: 3.5rem;
          text-transform: uppercase;
        }

        .greeting-message {
          color: rgba(255,255,255,0.8);
          display: block;
          font-size: 2.5rem;
          text-transform: uppercase;
        }

        .chart-section {
          margin-top: 14rem;
        }

        .chart-wrapper {
          transform: scale(1.15);
        }
      `}</style>

      <div className="dashboard-container">
        <Navbar />
        <div className="content-wrapper">
          <div className="demo-section">
            <div className="left-section">
              <div className="greeting-text">
                <span className="greeting-name">{user?.firstName},</span>
                <span className="greeting-message">{currentGreeting}</span>
              </div>
              <div className="chart-section">
                <div className="chart-wrapper">
                  <PlayerRadarCard />
                </div>
              </div>
            </div>
            <div className="center-section">
              <MatchCountdown />
            </div>
            <div className="right-section">
              <LiveArena />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardPage
