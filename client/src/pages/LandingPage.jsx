import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'

/* ─── Live match data cycling in the hero ticker ─── */
const LIVE = [
  { p1: 'Ravi K.', p2: 'Arjun M.', s1: 21, s2: 17, sport: '🏸' },
  { p1: 'Priya S.', p2: 'Neha R.', s1: 7, s2: 5, sport: '🎾' },
  { p1: 'Sam T.', p2: 'Chris P.', s1: 11, s2: 9, sport: '🏓' },
  { p1: 'Anjali V.', p2: 'Meera K.', s1: 15, s2: 21, sport: '🏸' },
]

/* ─── Ripple hook ─── */
function useRipple() {
  const [ripples, setRipples] = useState([])
  const fire = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { id, x, y }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
  }, [])
  return [ripples, fire]
}

function RippleButton({ children, onClick, style, className }) {
  const [ripples, fire] = useRipple()
  return (
    <button
      onClick={(e) => { fire(e); onClick?.(e) }}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
    >
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute', left: r.x, top: r.y,
          width: 4, height: 4, borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          transform: 'translate(-50%,-50%) scale(0)',
          animation: 'ripple-expand 0.7s ease-out forwards',
          pointerEvents: 'none'
        }} />
      ))}
      {children}
    </button>
  )
}

/* ─── Animated aurora blob ─── */
function AuroraBlob({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.55, pointerEvents: 'none', ...style }} />
}

/* ─── Clay sport chip ─── */
function ClayChip({ emoji, label, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      background: color,
      borderRadius: '999px',
      padding: '0.55rem 1.1rem',
      boxShadow: `0 8px 20px ${color}88, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)`,
      fontSize: '0.85rem', fontWeight: 700, color: '#fff',
      letterSpacing: '-0.01em',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      {label}
    </div>
  )
}

/* ─── Glass card ─── */
function GlassCard({ children, style, tilt = 0 }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '24px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
      transform: `rotate(${tilt}deg)`,
      transition: 'transform 0.3s ease',
      ...style
    }}>
      {children}
    </div>
  )
}

/* ─── Skeuomorphic ticket card (bracket showcase) ─── */
function TicketCard() {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #fffef7, #f5f0e8)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.1)',
      border: '1px solid rgba(0,0,0,0.08)',
      overflow: 'hidden',
      width: '340px',
      fontFamily: 'inherit',
      position: 'relative',
    }}>
      {/* Ticket header strip */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332, #0d2b20)',
        padding: '1rem 1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#52b788', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>StepOut2Play</div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Badminton Open 2026</div>
        </div>
        <div style={{
          background: '#c8f135', color: '#0d1117',
          fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase',
          letterSpacing: '0.08em', padding: '0.3rem 0.7rem', borderRadius: '6px'
        }}>LIVE</div>
      </div>

      {/* Perforated divider */}
      <div style={{ position: 'relative', height: '0', overflow: 'visible', margin: '0 -1px' }}>
        <svg width="100%" height="20" viewBox="0 0 340 20" preserveAspectRatio="none">
          <rect width="340" height="20" fill="#fffef7"/>
          {Array.from({length: 22}).map((_, i) => (
            <circle key={i} cx={8 + i * 15} cy="10" r="6" fill="#1B4332"/>
          ))}
        </svg>
      </div>

      {/* Match rows */}
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Semifinal · Court 2 · Jun 24 9:00 AM
        </div>

        {/* Match 1 */}
        <div style={{
          background: '#fff', borderRadius: '12px', overflow: 'hidden',
          border: '1.5px solid #f97316',
          boxShadow: '0 2px 8px rgba(249,115,22,0.15)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ background: '#fff7ed', padding: '0.25rem 0.75rem', borderBottom: '1px solid #fed7aa' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>● READY · Match #2</span>
          </div>
          {[['Ravi K.', '21', true], ['Arjun M.', '17', false]].map(([name, score, win]) => (
            <div key={name} style={{
              padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between',
              borderBottom: '1px solid #f8fafc', alignItems: 'center',
              background: win ? 'linear-gradient(90deg, #fefce8, #fff)' : '#fff'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: win ? 800 : 600, color: win ? '#1B4332' : '#374151' }}>{name}</span>
              <span style={{
                fontSize: '0.88rem', fontWeight: 900,
                color: win ? '#1B4332' : '#9ca3af',
                background: win ? '#dcfce7' : '#f9fafb',
                padding: '0.1rem 0.5rem', borderRadius: '6px'
              }}>{score}</span>
            </div>
          ))}
        </div>

        {/* Match 2 — Auto */}
        <div style={{
          background: '#fff', borderRadius: '12px', overflow: 'hidden',
          border: '1.5px solid #22c55e',
          boxShadow: '0 2px 8px rgba(34,197,94,0.15)',
        }}>
          <div style={{ background: '#f0fdf4', padding: '0.25rem 0.75rem', borderBottom: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>● AUTO ADVANCED · Match #1</span>
          </div>
          <div style={{ padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1B4332' }}>Priya S.</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic' }}>Bye round</span>
          </div>
        </div>
      </div>

      {/* Ticket footer */}
      <div style={{
        borderTop: '1px dashed #d1d5db', margin: '0 1.25rem',
        padding: '0.75rem 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        {[['8', 'Players'], ['4', 'Courts'], ['3', 'Rounds']].map(([v, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1B4332' }}>{v}</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
          </div>
        ))}
        <div style={{
          background: '#1B4332', color: '#c8f135',
          fontWeight: 900, fontSize: '0.65rem', padding: '0.3rem 0.7rem',
          borderRadius: '8px', letterSpacing: '0.04em'
        }}>AUTO SEEDED</div>
      </div>
      <div style={{ height: '0.75rem', background: 'linear-gradient(145deg, #fffef7, #f5f0e8)' }} />
    </div>
  )
}

/* ─── Live ticker pill ─── */
function LivePill() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LIVE.length), 2500)
    return () => clearInterval(t)
  }, [])
  const m = LIVE[idx]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '999px', padding: '0.5rem 1.25rem',
    }}>
      <span style={{ width: 8, height: 8, background: '#c8f135', borderRadius: '50%', display: 'block', animation: 'blink 1.3s ease-in-out infinite' }} />
      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live now</span>
      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{m.sport} {m.p1}</span>
      <span style={{ background: '#c8f135', color: '#0d1117', fontWeight: 900, fontSize: '0.82rem', padding: '0.15rem 0.5rem', borderRadius: '5px', minWidth: '28px', textAlign: 'center' }}>{m.s1}</span>
      <span style={{ color: '#475569', fontSize: '0.75rem' }}>vs</span>
      <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>{m.p2}</span>
      <span style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', fontWeight: 700, fontSize: '0.82rem', padding: '0.15rem 0.5rem', borderRadius: '5px', minWidth: '28px', textAlign: 'center' }}>{m.s2}</span>
    </div>
  )
}

/* ─── Wave divider ─── */
function Wave({ flip = false, topColor, bottomColor }) {
  return (
    <div style={{ lineHeight: 0, background: bottomColor, transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={topColor} />
      </svg>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes aurora-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-40px) scale(1.1); }
          66% { transform: translate(-40px,30px) scale(0.95); }
        }
        @keyframes aurora-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-80px,50px) scale(1.05); }
          66% { transform: translate(50px,-60px) scale(1.12); }
        }
        @keyframes aurora-3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px,40px) scale(1.08); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(200,241,53,0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(200,241,53,0); }
        }
        @keyframes ripple-expand {
          to { transform: translate(-50%,-50%) scale(80); opacity: 0; }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-y {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes float-y2 {
          0%,100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pop-in {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }

        .land { font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; }

        /* NAV */
        .lnav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 3.5rem;
          background: rgba(8,18,14,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .lnav-logo { display: flex; align-items: center; gap: 0.65rem; text-decoration: none; }
        .lnav-mark {
          width: 36px; height: 36px; border-radius: '10px';
          background: linear-gradient(135deg, #1B4332, #52b788);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 900; color: #c8f135;
          box-shadow: 0 4px 14px rgba(27,67,50,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .lnav-name { font-size: 1.05rem; font-weight: 800; color: #fff; letter-spacing: '-0.02em'; }
        .lnav-links { display: flex; align-items: center; gap: 2rem; }
        .lnav-link {
          background: none; border: none; cursor: pointer;
          font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.55);
          font-family: inherit; transition: color 0.2s;
          padding: 0;
        }
        .lnav-link:hover { color: #fff; }
        .lnav-cta {
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          color: #c8f135; font-weight: 700; font-size: 0.875rem;
          padding: 0.6rem 1.4rem; border-radius: 10px; border: none;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 16px rgba(27,67,50,0.4);
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .lnav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(27,67,50,0.5); }

        /* HERO */
        .hero {
          min-height: 100vh;
          background: #06100c;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 8rem 2rem 5rem;
        }
        .hero-content { position: relative; z-index: 5; text-align: center; max-width: 900px; }
        .hero-h1 {
          font-size: clamp(4rem, 10vw, 9rem);
          font-weight: 900; line-height: 0.88;
          letter-spacing: '-0.05em';
          margin: 1.5rem 0;
        }
        .hero-h1-line1 { display: block; color: #fff; }
        .hero-h1-line2 {
          display: block;
          background: linear-gradient(135deg, #00d4aa 0%, #52b788 40%, #c8f135 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 40px rgba(0,212,170,0.3));
        }
        .hero-sub {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: rgba(255,255,255,0.5); max-width: 480px;
          margin: 1.5rem auto 2.5rem; line-height: 1.75;
        }
        .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 4rem; }
        .btn-aurora {
          background: linear-gradient(135deg, #1B4332 0%, #00d4aa 100%);
          color: #fff; font-weight: 800; font-size: 1rem;
          padding: 1rem 2.5rem; border-radius: 14px; border: none;
          cursor: pointer; font-family: inherit; letter-spacing: '-0.01em';
          box-shadow: 0 8px 32px rgba(0,212,170,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.25s;
        }
        .btn-aurora:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 16px 40px rgba(0,212,170,0.4); }
        .btn-ghost {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.85); font-weight: 600; font-size: 1rem;
          padding: 1rem 2.5rem; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer; font-family: inherit;
          transition: all 0.25s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }

        /* Floating glass stat chips */
        .stat-chips { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .stat-chip {
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 16px; padding: 1rem 1.75rem;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .stat-val { font-size: 2rem; font-weight: 900; color: #c8f135; letter-spacing: '-0.03em'; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.3rem; }

        /* SPORTS TICKER */
        .sports-ticker { background: #0a1a12; padding: 1.5rem 0; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ticker-inner { display: flex; animation: ticker-scroll 20s linear infinite; width: max-content; }
        .ticker-item { display: flex; align-items: center; gap: 0.75rem; padding: 0 2.5rem; white-space: nowrap; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: '-0.01em'; }
        .ticker-sep { width: 4px; height: 4px; background: #1B4332; border-radius: '50%'; border-radius: 50%; }

        /* BRACKET SECTION */
        .bracket-sec {
          background: linear-gradient(180deg, #0a1a12 0%, #071410 100%);
          padding: 7rem 4rem;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 5rem; align-items: center;
        }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(200,241,53,0.1); border: 1px solid rgba(200,241,53,0.25);
          border-radius: 999px; padding: 0.35rem 1rem;
          font-size: 0.72rem; font-weight: 700; color: #c8f135;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem;
        }
        .sec-h2-light {
          font-size: clamp(2.5rem, 4vw, 3.8rem); font-weight: 900;
          color: #fff; line-height: 0.95; letter-spacing: '-0.04em';
          margin-bottom: 1.25rem;
        }
        .sec-body-muted { font-size: 1.05rem; color: rgba(255,255,255,0.45); line-height: 1.75; margin-bottom: 2rem; }
        .feat-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .feat-item {
          display: flex; align-items: center; gap: 0.85rem;
          font-size: 0.95rem; color: rgba(255,255,255,0.75); font-weight: 500;
        }
        .feat-check {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #1B4332, #00d4aa);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,212,170,0.3);
        }

        /* EVERYONE SECTION */
        .everyone-sec {
          background: linear-gradient(160deg, #f0fdf8 0%, #ecfdf5 40%, #f0f9ff 100%);
          padding: 7rem 4rem; position: relative;
        }
        .everyone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 880px; margin: 3.5rem auto 0; }

        /* Player card — glassmorphic on light */
        .player-glass {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(27,67,50,0.15);
          border-radius: 28px; padding: 2.5rem;
          box-shadow: 0 8px 40px rgba(27,67,50,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
          transition: all 0.3s ease;
          animation: pop-in 0.6s ease forwards;
        }
        .player-glass:hover { transform: translateY(-8px) rotate(-1deg); box-shadow: 0 24px 60px rgba(27,67,50,0.2); }

        /* Organizer card — brutalist dark */
        .org-brutalist {
          background: #1B4332;
          border: 3px solid #0d2b20;
          border-radius: 28px; padding: 2.5rem;
          box-shadow: 8px 8px 0px #0d2b20;
          transition: all 0.25s ease;
          animation: pop-in 0.6s 0.15s ease both;
          position: relative; overflow: hidden;
        }
        .org-brutalist::before {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 140px; height: 140px; border-radius: '50%'; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,241,53,0.15), transparent 70%);
        }
        .org-brutalist:hover { transform: translateY(-8px) rotate(1deg); box-shadow: 12px 12px 0px #0d2b20; }

        .card-emoji-clay {
          width: 60px; height: 60px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem; margin-bottom: 1.5rem;
        }
        .card-h3-dark { font-size: 1.75rem; font-weight: 900; color: #0d1117; letter-spacing: '-0.03em'; margin-bottom: 1.25rem; }
        .card-h3-light { font-size: 1.75rem; font-weight: 900; color: #fff; letter-spacing: '-0.03em'; margin-bottom: 1.25rem; }
        .card-feats { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .card-feat-dark { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.9rem; color: #374151; font-weight: 500; line-height: 1.4; }
        .card-feat-light { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.9rem; color: rgba(255,255,255,0.75); font-weight: 500; line-height: 1.4; }

        .btn-dark-green {
          width: 100%; padding: 1rem; border-radius: 14px;
          background: linear-gradient(135deg, #1B4332, #0d2b20);
          color: #c8f135; font-weight: 800; font-size: 0.95rem;
          border: none; cursor: pointer; font-family: inherit;
          letter-spacing: '-0.01em';
          box-shadow: 0 4px 16px rgba(27,67,50,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
          transition: all 0.25s;
        }
        .btn-dark-green:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(27,67,50,0.4); }
        .btn-lime-filled {
          width: 100%; padding: 1rem; border-radius: 14px;
          background: #c8f135; color: #0d1117;
          font-weight: 800; font-size: 0.95rem;
          border: none; cursor: pointer; font-family: inherit;
          letter-spacing: '-0.01em'; position: relative; overflow: hidden;
          transition: all 0.25s;
        }
        .btn-lime-filled:hover { transform: scale(1.02); background: #d4f76b; }

        /* FEATURES */
        .features-sec {
          background: #06100c; padding: 7rem 4rem; position: relative; overflow: hidden;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; max-width: 960px; margin: 3rem auto 0; }
        .feat-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 2rem;
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
        }
        .feat-glass-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(0,212,170,0.3);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,212,170,0.1);
        }
        .feat-glass-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }
        .feat-icon-clay {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; margin-bottom: 1.25rem;
          box-shadow: 0 6px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .feat-card-title { font-size: 1rem; font-weight: 800; color: #fff; letter-spacing: '-0.02em'; margin-bottom: 0.5rem; }
        .feat-card-desc { font-size: 0.83rem; color: rgba(255,255,255,0.4); line-height: 1.65; }

        /* HOW IT WORKS */
        .hiw-sec {
          background: linear-gradient(135deg, #f0fdf8, #ecfdf5 50%, #f0f9ff);
          padding: 7rem 4rem;
        }
        .hiw-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; max-width: 900px; margin: 3.5rem auto 0; }
        .hiw-step-card {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(27,67,50,0.1);
          border-radius: 24px; padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 4px 24px rgba(27,67,50,0.07);
          transition: all 0.3s ease;
        }
        .hiw-step-card:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(27,67,50,0.15); }
        .hiw-num {
          font-size: 4rem; font-weight: 900; letter-spacing: '-0.05em'; line-height: 1;
          background: linear-gradient(135deg, #1B4332, #00d4aa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: 1rem;
        }
        .hiw-step-title { font-size: 1.1rem; font-weight: 800; color: #0d1117; margin-bottom: 0.5rem; letter-spacing: '-0.02em'; }
        .hiw-step-desc { font-size: 0.85rem; color: #64748b; line-height: 1.65; }

        /* CTA */
        .cta-sec {
          background: #06100c; padding: 7rem 4rem; text-align: center; position: relative; overflow: hidden;
        }
        .cta-h2 {
          font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 900;
          color: #fff; letter-spacing: '-0.04em'; line-height: 0.95;
          margin-bottom: 1.25rem; position: relative; z-index: 2;
        }
        .cta-h2 em { font-style: normal; color: #c8f135; }
        .cta-sub { font-size: 1.05rem; color: rgba(255,255,255,0.4); margin-bottom: 2.5rem; position: relative; z-index: 2; }
        .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; z-index: 2; }

        /* FOOTER */
        .footer {
          background: #030a06; padding: 1.75rem 3.5rem;
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-copy { font-size: 0.78rem; color: rgba(255,255,255,0.25); }

        /* SECTION HEADINGS */
        .sec-h2-dark {
          font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 900;
          color: #0d1117; letter-spacing: '-0.04em'; text-align: center;
        }
        .sec-h2-white {
          font-size: clamp(2.2rem, 4vw, 3.5rem); font-weight: 900;
          color: #fff; letter-spacing: '-0.04em'; text-align: center;
        }
        .sec-sub { font-size: 1rem; text-align: center; margin-top: 0.75rem; color: #64748b; }
        .sec-sub-light { font-size: 1rem; text-align: center; margin-top: 0.75rem; color: rgba(255,255,255,0.4); }

        @media (max-width: 768px) {
          .lnav { padding: 1rem 1.5rem; }
          .lnav-links { display: none; }
          .bracket-sec { grid-template-columns: 1fr; padding: 4rem 1.5rem; gap: 3rem; }
          .everyone-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .hiw-steps { grid-template-columns: 1fr; }
          .everyone-sec, .hiw-sec { padding: 4rem 1.5rem; }
          .features-sec, .cta-sec { padding: 4rem 1.5rem; }
          .footer { flex-direction: column; gap: 0.75rem; text-align: center; padding: 1.5rem; }
        }
      `}</style>

      <div className="land">

        {/* ── NAV ── */}
        <nav className="lnav">
          <div className="lnav-logo">
            <div className="lnav-mark">S</div>
            <span className="lnav-name">StepOut2Play</span>
          </div>
          <div className="lnav-links">
            <button className="lnav-link" onClick={() => navigate('/tournaments')}>Tournaments</button>
            <button className="lnav-link" onClick={() => navigate('/explore')}>Explore</button>
            <button className="lnav-link">How it works</button>
          </div>
          <RippleButton
            className="lnav-cta"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
          >
            {isLoggedIn ? 'Dashboard →' : 'Get started free'}
          </RippleButton>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          {/* Aurora blobs */}
          <AuroraBlob style={{ width: 700, height: 700, background: 'radial-gradient(circle, #1B4332 0%, transparent 70%)', top: -200, left: -200, animation: 'aurora-1 18s ease-in-out infinite' }} />
          <AuroraBlob style={{ width: 500, height: 500, background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)', opacity: 0.2, bottom: -100, right: -100, animation: 'aurora-2 22s ease-in-out infinite' }} />
          <AuroraBlob style={{ width: 350, height: 350, background: 'radial-gradient(circle, #0891b2 0%, transparent 70%)', opacity: 0.18, top: '30%', right: '15%', animation: 'aurora-3 15s ease-in-out infinite' }} />
          <AuroraBlob style={{ width: 250, height: 250, background: 'radial-gradient(circle, #92400e 0%, transparent 70%)', opacity: 0.12, bottom: '20%', left: '20%', animation: 'aurora-2 25s ease-in-out infinite reverse' }} />

          {/* Mesh grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />

          <div className="hero-content">
            <LivePill />
            <h1 className="hero-h1">
              <span className="hero-h1-line1">Tournament</span>
              <span className="hero-h1-line2">Unlocked.</span>
            </h1>
            <p className="hero-sub">
              Run racket sports tournaments that actually feel professional. Brackets that build themselves. Scores that update live. Players who come back every season.
            </p>
            <div className="hero-ctas">
              <RippleButton className="btn-aurora" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}>
                {isLoggedIn ? 'Go to Dashboard →' : 'Start for free →'}
              </RippleButton>
              <RippleButton className="btn-ghost" onClick={() => navigate('/tournaments')}>
                Browse tournaments
              </RippleButton>
            </div>
            <div className="stat-chips">
              {[['1200+', 'Matches Played'], ['64+', 'Tournaments'], ['6', 'Sports'], ['< 60s', 'Bracket Time']].map(([v, l]) => (
                <div key={l} className="stat-chip">
                  <div className="stat-val">{v}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SPORTS TICKER ── */}
        <div className="sports-ticker">
          <div className="ticker-inner">
            {[...Array(4)].flatMap(() => [
              { emoji: '🏸', name: 'Badminton' }, { emoji: '🎾', name: 'Tennis' },
              { emoji: '🏓', name: 'Table Tennis' }, { emoji: '🥊', name: 'Squash' },
              { emoji: '🏐', name: 'Pickleball' }, { emoji: '🏏', name: 'Padel' },
            ]).map((s, i) => (
              <div key={i} className="ticker-item">
                <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
                <span>{s.name}</span>
                <span className="ticker-sep" />
              </div>
            ))}
          </div>
        </div>

        {/* ── BRACKET SHOWCASE ── */}
        <section className="bracket-sec">
          {/* Aurora behind */}
          <AuroraBlob style={{ width: 400, height: 400, background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)', opacity: 0.08, top: '50%', right: '10%' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="eyebrow">⚡ Smart bracket engine</div>
            <h2 className="sec-h2-light">Brackets that<br/>build<br/>themselves.</h2>
            <p className="sec-body-muted">
              Pick your format, hit generate. The engine seeds players, assigns courts, handles byes — and the whole thing updates live as matches finish.
            </p>
            <div className="feat-list">
              {['Knockout & Round Robin formats', 'Snake, random, or manual seeding', 'Bye auto-advance & court assignment', 'Live score propagation across rounds'].map(f => (
                <div key={f} className="feat-item">
                  <div className="feat-check">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Ticket + floating glass accent */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ animation: 'float-y 5s ease-in-out infinite' }}>
              <TicketCard />
            </div>
            {/* Floating glass badge */}
            <GlassCard tilt={-3} style={{
              position: 'absolute', top: -20, right: -20,
              padding: '0.75rem 1rem', animation: 'float-y2 4s ease-in-out infinite',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#c8f135', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Auto seeded</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>100%</div>
            </GlassCard>
          </div>
        </section>

        <Wave topColor="#071410" bottomColor="#f0fdf8" />

        {/* ── FOR EVERYONE ── */}
        <section className="everyone-sec">
          {/* Ambient aurora on light bg */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(0,212,170,0.07), transparent), radial-gradient(ellipse 50% 60% at 70% 50%, rgba(8,145,178,0.06), transparent)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 className="sec-h2-dark">Built for everyone<br/>on the court.</h2>
            <p className="sec-sub">Whether you're sweating it out or running the show.</p>

            <div className="everyone-grid">
              {/* Players */}
              <div className="player-glass">
                <div className="card-emoji-clay" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', boxShadow: '0 8px 20px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.7)' }}>🎾</div>
                <h3 className="card-h3-dark">For Players</h3>
                <ul className="card-feats">
                  {['Register for tournaments in seconds', 'Track your schedule & court assignments', 'Follow live brackets as matches unfold', 'Build your competitive history'].map(f => (
                    <li key={f} className="card-feat-dark">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="8" cy="8" r="7" stroke="#22c55e" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <RippleButton className="btn-dark-green" onClick={() => navigate('/tournaments')}>
                  Find Tournaments →
                </RippleButton>
              </div>

              {/* Organizers */}
              <div className="org-brutalist">
                <div className="card-emoji-clay" style={{ background: 'linear-gradient(135deg, rgba(200,241,53,0.2), rgba(200,241,53,0.1))', boxShadow: '0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>🏆</div>
                <h3 className="card-h3-light">For Organizers</h3>
                <ul className="card-feats">
                  {['Create unlimited tournaments & events', 'Auto-generate brackets from registrations', 'Manage courts, timing & match scheduling', 'Track live scores & publish standings'].map(f => (
                    <li key={f} className="card-feat-light">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="8" cy="8" r="7" stroke="#52b788" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <RippleButton className="btn-lime-filled" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}>
                  Create a Tournament →
                </RippleButton>
              </div>
            </div>

            {/* Clay sport chips row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '3rem' }}>
              <ClayChip emoji="🏸" label="Badminton" color="#1B4332" />
              <ClayChip emoji="🎾" label="Tennis" color="#0891b2" />
              <ClayChip emoji="🏓" label="Table Tennis" color="#7c3aed" />
              <ClayChip emoji="🥊" label="Squash" color="#b45309" />
              <ClayChip emoji="🏐" label="Pickleball" color="#0d9488" />
              <ClayChip emoji="🏏" label="Padel" color="#be185d" />
            </div>
          </div>
        </section>

        <Wave topColor="#f0fdf8" bottomColor="#06100c" />

        {/* ── FEATURES ── */}
        <section className="features-sec">
          <AuroraBlob style={{ width: 500, height: 500, background: 'radial-gradient(circle, #1B4332 0%, transparent 70%)', opacity: 0.4, top: -100, left: -100 }} />
          <AuroraBlob style={{ width: 400, height: 400, background: 'radial-gradient(circle, #0891b2 0%, transparent 70%)', opacity: 0.15, bottom: 0, right: -100 }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 className="sec-h2-white">Everything you need.</h2>
            <p className="sec-sub-light">No spreadsheets. No WhatsApp groups. No chaos.</p>
            <div className="features-grid">
              {[
                { emoji: '📅', label: 'Event Categories', desc: "Men's, Women's, U19, Veterans 40+ — any category your tournament needs.", bg: 'linear-gradient(135deg,#1B4332,#2d6a4f)' },
                { emoji: '👥', label: 'Doubles Support', desc: 'Singles, doubles, mixed doubles. Partner management and team brackets built in.', bg: 'linear-gradient(135deg,#0891b2,#0e7490)' },
                { emoji: '📊', label: 'Live Scoring', desc: 'Score updates hit every screen instantly. No refresh, no lag, no confusion.', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
                { emoji: '⚡', label: 'Multiple Formats', desc: 'Knockout, Round Robin, hybrid. Choose your format and generate instantly.', bg: 'linear-gradient(135deg,#b45309,#92400e)' },
                { emoji: '🎯', label: '6 Sports', desc: 'Badminton, Tennis, Table Tennis, Squash, Pickleball, Padel — all supported.', bg: 'linear-gradient(135deg,#be185d,#9d174d)' },
                { emoji: '🚀', label: 'Quick Setup', desc: 'From idea to live tournament in under 5 minutes. Smart defaults, zero friction.', bg: 'linear-gradient(135deg,#0d9488,#0f766e)' },
              ].map(f => (
                <div key={f.label} className="feat-glass-card">
                  <div className="feat-icon-clay" style={{ background: f.bg }}>
                    <span style={{ fontSize: '1.4rem' }}>{f.emoji}</span>
                  </div>
                  <div className="feat-card-title">{f.label}</div>
                  <div className="feat-card-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Wave topColor="#06100c" bottomColor="#f0fdf8" />

        {/* ── HOW IT WORKS ── */}
        <section className="hiw-sec">
          <h2 className="sec-h2-dark">Up and running<br/>in 3 steps.</h2>
          <p className="sec-sub">Seriously, that's it.</p>
          <div className="hiw-steps">
            {[
              { n: '1', title: 'Create your tournament', desc: 'Name it, set your sport, dates, and events. Under 5 minutes, no training required.' },
              { n: '2', title: 'Players register', desc: 'Share a link. Players sign up, pick events, pay if needed. All tracked automatically.' },
              { n: '3', title: 'Generate & play', desc: 'Hit generate. Brackets built, courts assigned, matches scheduled. You just watch the game.' },
            ].map(s => (
              <div key={s.n} className="hiw-step-card">
                <div className="hiw-num">{s.n}</div>
                <div className="hiw-step-title">{s.title}</div>
                <div className="hiw-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <Wave topColor="#f0fdf8" bottomColor="#06100c" />

        {/* ── CTA ── */}
        <section className="cta-sec">
          <AuroraBlob style={{ width: 600, height: 600, background: 'radial-gradient(circle, #1B4332 0%, transparent 65%)', opacity: 0.6, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <AuroraBlob style={{ width: 300, height: 300, background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)', opacity: 0.2, top: 0, right: '15%' }} />
          <AuroraBlob style={{ width: 200, height: 200, background: 'radial-gradient(circle, #92400e 0%, transparent 70%)', opacity: 0.15, bottom: '10%', left: '10%' }} />

          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(200,241,53,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

          <h2 className="cta-h2" style={{ position: 'relative', zIndex: 2 }}>
            Your next tournament<br/>starts <em>right here.</em>
          </h2>
          <p className="cta-sub">Free to use. No credit card. Just great tournaments.</p>
          <div className="cta-btns">
            <RippleButton
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
              style={{
                background: '#c8f135', color: '#0d1117',
                fontWeight: 800, fontSize: '1rem',
                padding: '1rem 2.5rem', borderRadius: '14px', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                boxShadow: '0 8px 32px rgba(200,241,53,0.35)',
                transition: 'all 0.25s',
              }}
            >
              {isLoggedIn ? 'Go to Dashboard →' : 'Get started free →'}
            </RippleButton>
            <RippleButton
              onClick={() => navigate('/tournaments')}
              style={{
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '1rem',
                padding: '1rem 2.5rem', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.25s',
              }}
            >
              Browse tournaments
            </RippleButton>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="lnav-logo" style={{ gap: '0.6rem' }}>
            <div className="lnav-mark" style={{ width: 30, height: 30, fontSize: '0.85rem' }}>S</div>
            <span className="lnav-name" style={{ fontSize: '0.95rem' }}>StepOut2Play</span>
          </div>
          <span className="footer-copy">© 2026 StepOut2Play · Making tournament management effortless.</span>
        </footer>
      </div>
    </>
  )
}
