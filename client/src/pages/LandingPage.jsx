import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function BulgeSection({ children, style }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div ref={ref} style={{
      transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(40px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.75s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease',
      ...style
    }}>
      {children}
    </div>
  )
}

function CyclingText() {
  const phrases = ["Organizer?", "Player?", "Oh! both?", "We've got you covered :)"]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIsVisible(true)
          setCurrentIndex(0) // Reset to start when entering viewport
        } else {
          setIsVisible(false)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || currentIndex >= phrases.length - 1) return

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentIndex, isVisible, phrases.length])

  return (
    <div ref={ref} style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h2 className="cycling-text" key={currentIndex}>
        {phrases[currentIndex]}
      </h2>
    </div>
  )
}

function FeaturesBento() {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const cubeRef = useRef(null)

  const faceRotations = [
    { x: 0, y: 0 },      // front
    { x: 0, y: -90 },    // right
    { x: 0, y: 180 },    // back
    { x: 0, y: 90 },     // left
    { x: -90, y: 0 },    // top
    { x: 90, y: 0 },     // bottom
  ]

  const faces = [
    {
      name: 'front',
      title: 'Glicko-2 Ratings',
      desc: 'Math-backed skill tracking that evolves with every match. Auto-seeding? Check. Real-time rank updates? Double check.'
    },
    {
      name: 'right',
      title: 'Live Match Updates',
      desc: 'Follow every point as it happens. Real-time stuff.'
    },
    {
      name: 'back',
      title: 'OCR Score Extraction',
      desc: 'Snap a scorecard, auto-extract the data.'
    },
    {
      name: 'left',
      title: '3 Formats',
      desc: 'Knockout, Round Robin, League-cum-Knockout. Win or go home. Everyone plays everyone. Or both. Your call.'
    },
    {
      name: 'top',
      title: 'Auto Everything',
      desc: 'Bracket generation, auto-scheduling, standby management. We do the math, you just show up. Like magic, but real.'
    },
    {
      name: 'bottom',
      title: 'No website? No problem.',
      desc: 'Every organization on StepOut2Play gets a beautiful public home - complete with tournaments, galleries, achievements, and a shareable link.'
    },
  ]

  const navigateFace = (direction) => {
    let newIndex
    if (direction === 'next') {
      newIndex = (currentFaceIndex + 1) % 6
    } else {
      newIndex = (currentFaceIndex - 1 + 6) % 6
    }
    setCurrentFaceIndex(newIndex)
    setIsLocked(true)
    setTimeout(() => setIsLocked(false), 2000)
  }

  const currentRotation = faceRotations[currentFaceIndex]

  return (
    <div className="cube-container" ref={cubeRef}>
      {/* Navigation Arrows - Only Left & Right */}
      <button className="cube-arrow cube-arrow-left" onClick={() => navigateFace('prev')}>←</button>
      <button className="cube-arrow cube-arrow-right" onClick={() => navigateFace('next')}>→</button>

      <div
        className="cube-exploded"
        style={{
          transform: `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)'
        }}
      >
        {faces.map((face, i) => (
          <div key={i} className={`cube-face cube-face-${face.name}`}>
            <div className="cube-feature">{face.title}</div>
            <div className="cube-desc">{face.desc}</div>
          </div>
        ))}
      </div>

      {/* Face indicator */}
      <div className="cube-indicator">
        {currentFaceIndex + 1} / 6
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Scroll to top on mount/reload
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const [phase, setPhase] = useState('intro')
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)

  useEffect(() => {
    // Set body to white on mount
    document.body.style.background = '#ffffff'

    const t1 = setTimeout(() => setPhase('exit'), 2000)
    const t2 = setTimeout(() => {
      setPhase('done')
      document.body.style.background = '#060d1f'
    }, 3200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Check if user came from /login or /signup and open respective modal
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'login') {
      setShowLogin(true)
    } else if (params.get('action') === 'signup') {
      setShowSignup(true)
    }
  }, [location])

  // Handle logo click
  const handleLogoClick = () => {
    if (location.pathname === '/') {
      // Already on landing page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Navigate to landing page
      navigate('/')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLoading(true)

    try {
      const user = await login(loginData.email, loginData.password)
      setShowLogin(false)

      // Navigate based on onboarding status
      if (!user.onboardingComplete) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.log('Login error:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0] || 'Something went wrong'

      // Cute error messages with proper capitalization
      if (errorMsg.toLowerCase().includes('credentials') || errorMsg.toLowerCase().includes('invalid')) {
        // Invalid credentials (email or password wrong - backend doesn't specify for security)
        setError(`Swing and a miss! Recheck your creds ⚾`)
      } else if (errorMsg.toLowerCase().includes('google')) {
        // Account created with Google
        setError(`Oops! This account uses Google sign-in 🔐`)
      } else {
        setError(`Oops! ${errorMsg} 😅`)
      }

      console.log('Error set to:', error)

      // Auto-clear error after 4 seconds
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLoading(true)

    try {
      const user = await register(signupData)
      setShowSignup(false)

      // Navigate to onboarding for new users
      navigate('/onboarding')
    } catch (err) {
      console.log('Signup error:', err)
      const errors = err.response?.data?.errors
      const errorMsg = err.response?.data?.error

      // Cute error messages with proper capitalization
      if (Array.isArray(errors)) {
        setError(`Oops! ${errors[0]} 🙈`)
      } else if (errorMsg?.toLowerCase().includes('already exists') || errorMsg?.toLowerCase().includes('duplicate')) {
        setError(`Oops! Looks like you're already with us! Try logging in 😊`)
      } else {
        setError(`Oops! ${errorMsg || 'Something went wrong'} 😅`)
      }

      console.log('Error set to:', error)

      // Auto-clear error after 4 seconds
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        body {
          background: #ffffff;
          font-family: 'Barlow Condensed', sans-serif;
          overflow-x: hidden;
        }
        body.intro-done {
          background: #060d1f;
        }

        /* ── INTRO ── */
        .intro {
          position: fixed;
          inset: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: none;
        }
        .intro.done {
          display: none;
        }

        /* Growing blob that reveals content */
        .intro-blob {
          position: absolute;
          width: 100px;
          height: 100px;
          background: #060d1f;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(0px);
          opacity: 0;
        }
        .intro.exit .intro-blob {
          animation: blob-grow 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes blob-grow {
          0% {
            width: 100px;
            height: 100px;
            filter: blur(80px);
            opacity: 0.3;
          }
          50% {
            filter: blur(40px);
            opacity: 0.8;
          }
          100% {
            width: 300vmax;
            height: 300vmax;
            filter: blur(0px);
            opacity: 1;
          }
        }

        .intro-text {
          position: relative;
          z-index: 2;
          font-family: 'Barlow Condensed', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 8vw, 6rem);
          letter-spacing: -0.02em;
          color: #060d1f;
          text-transform: uppercase;
          animation: text-appear 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .intro.exit .intro-text {
          animation: text-stretch 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
        @keyframes text-appear {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes text-stretch {
          0% {
            opacity: 1;
            transform: scaleX(1) scaleY(1);
            letter-spacing: -0.02em;
          }
          60% {
            opacity: 0.7;
            transform: scaleX(1.4) scaleY(0.6);
            letter-spacing: 0.15em;
          }
          100% {
            opacity: 0;
            transform: scaleX(2) scaleY(0.3);
            letter-spacing: 0.3em;
          }
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          height: 64px;
          background: rgba(6, 13, 31, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nav-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
          color: #fff;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .nav-logo:hover {
          opacity: 0.8;
        }
        .nav-logo span { color: #4fffb0; }

        .nav-btns {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .btn-nav {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.65rem 1.8rem;
          border-radius: 5px;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-nav.login {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .btn-nav.login:hover {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
          transform: translateY(-2px);
        }

        .btn-nav.signup {
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          color: #4fffb0;
          box-shadow: 0 2px 12px rgba(27,67,50,0.4);
        }
        .btn-nav.signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(27,67,50,0.6);
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8rem 2rem 10rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 70%, #071a2e 100%);
        }

        /* Ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.5;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #1B4332 0%, transparent 70%);
          top: -150px; left: -150px;
          animation: drift1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, #0a3d62 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation: drift2 22s ease-in-out infinite;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #4fffb022 0%, transparent 70%);
          top: 40%; right: 15%;
          animation: drift1 15s ease-in-out infinite reverse;
        }
        @keyframes drift1 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(40px,-30px); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(-50px,40px); }
        }

        /* Grid overlay */
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 55px 55px;
          pointer-events: none;
        }

        .hero-content { position: relative; z-index: 2; max-width: 1000px; }

        .hero-h1 {
          font-family: 'Barlow Condensed', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: clamp(4rem, 10vw, 9.5rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeInLeft 1s cubic-bezier(0.34,1.56,0.64,1) 3.2s forwards;
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .hero-h1 .accent {
          display: block;
          background: linear-gradient(135deg, #4fffb0 0%, #00c9a7 50%, #1B9e77 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(1rem, 2vw, 1.25rem);
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          max-width: 620px;
          margin: 0 auto 3rem;
          line-height: 1.7;
          animation: fadeInUp 1s cubic-bezier(0.34,1.56,0.64,1) 3.5s forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-ctas {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hero-ctas button {
          animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
          opacity: 0;
        }

        .hero-ctas button:nth-child(1) {
          animation-delay: 3.8s;
        }

        .hero-ctas button:nth-child(2) {
          animation-delay: 3.95s;
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .btn-main {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.9rem 3rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          color: #4fffb0;
          box-shadow: 0 4px 24px rgba(27,67,50,0.5);
          transition: all 0.2s ease;
        }
        .btn-main:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(27,67,50,0.6);
        }

        .btn-sec {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.9rem 3rem;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.2s ease;
        }
        .btn-sec:hover {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
          transform: translateY(-3px);
        }

        /* ── PLACEHOLDER SECTION ── */
        .section {
          padding: 8rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-wrapper {
          background: linear-gradient(180deg, #060d1f 0%, #071a2e 100%);
        }

        .section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 1.5rem;
        }

        .section-h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 6vw, 6rem);
          letter-spacing: -0.03em;
          line-height: 0.92;
          text-transform: uppercase;
          color: #fff;
        }

        /* ── CYCLING TEXT SECTION ── */
        .cycling-section {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #071a2e 0%, #0a1628 50%, #060d1f 100%);
          position: relative;
          overflow: hidden;
        }

        .cycling-text {
          font-family: 'Barlow Condensed', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: clamp(4rem, 10vw, 9.5rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #fff 0%, #4fffb0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textFadeIn 0.6s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes textFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── FEATURES BENTO GRID ── */
        .features-section {
          padding: 10rem 2rem;
          background: linear-gradient(160deg, #060d1f 0%, #0a1628 100%);
          position: relative;
          overflow: hidden;
        }

        .features-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .features-headline {
          font-family: 'Barlow Condensed', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 8vw, 7rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 1.5rem;
        }

        .features-subhead {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: rgba(255,255,255,0.5);
          max-width: 700px;
          margin: 0 auto;
        }

        /* 3D EXPLODED CUBE */
        .cube-container {
          width: 100%;
          height: 700px;
          perspective: 1200px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        }

        .cube-container:active {
          cursor: grabbing;
        }

        /* Navigation Arrows */
        .cube-arrow {
          position: absolute;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, rgba(27,67,50,0.3) 0%, rgba(10,22,40,0.5) 100%);
          border: 2px solid rgba(79,255,176,0.3);
          border-radius: 12px;
          color: #4fffb0;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .cube-arrow:hover {
          background: linear-gradient(135deg, rgba(27,67,50,0.5) 0%, rgba(10,22,40,0.7) 100%);
          border-color: rgba(79,255,176,0.6);
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(79,255,176,0.4);
        }

        .cube-arrow:active {
          transform: scale(0.95);
        }

        .cube-arrow-up {
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
        }

        .cube-arrow-down {
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
        }

        .cube-arrow-left {
          top: 50%;
          left: 2%;
          transform: translateY(-50%);
        }

        .cube-arrow-right {
          top: 50%;
          right: 2%;
          transform: translateY(-50%);
        }

        .cube-arrow:hover {
          transform: scale(1.1) !important;
        }

        .cube-arrow-up:hover {
          transform: translateX(-50%) scale(1.1);
        }

        .cube-arrow-down:hover {
          transform: translateX(-50%) scale(1.1);
        }

        .cube-arrow-left:hover {
          transform: translateY(-50%) scale(1.1);
        }

        .cube-arrow-right:hover {
          transform: translateY(-50%) scale(1.1);
        }

        /* Face indicator */
        .cube-indicator {
          position: absolute;
          bottom: 8%;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: rgba(79,255,176,0.6);
          background: rgba(10,22,40,0.5);
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(79,255,176,0.2);
          backdrop-filter: blur(10px);
        }

        .cube-exploded {
          position: relative;
          width: 300px;
          height: 300px;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }

        .cube-face {
          position: absolute;
          width: 280px;
          height: 280px;
          background: linear-gradient(135deg, rgba(27,67,50,0.12) 0%, rgba(10,22,40,0.3) 100%);
          border: 2px solid rgba(79,255,176,0.15);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
          transition: all 0.4s ease;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .cube-face:hover {
          background: linear-gradient(135deg, rgba(27,67,50,0.3) 0%, rgba(10,22,40,0.5) 100%);
          border-color: rgba(79,255,176,0.6);
          box-shadow: 0 0 80px rgba(79,255,176,0.4);
        }

        .cube-feature {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #4fffb0;
          text-align: center;
          line-height: 1;
          transition: all 0.3s ease;
        }

        .cube-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(255,255,255,0.7);
          text-align: center;
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .cube-face:hover .cube-feature {
          transform: scale(1.05);
          text-shadow: 0 0 40px rgba(79,255,176,0.7);
        }

        .cube-face:hover .cube-desc {
          opacity: 1;
          max-height: 200px;
        }

        /* Face positions - CLOSER (220px apart) */
        .cube-face-front {
          transform: translateZ(220px);
        }

        .cube-face-back {
          transform: rotateY(180deg) translateZ(220px);
        }

        .cube-face-right {
          transform: rotateY(90deg) translateZ(220px);
        }

        .cube-face-left {
          transform: rotateY(-90deg) translateZ(220px);
        }

        .cube-face-top {
          transform: rotateX(90deg) translateZ(220px);
        }

        .cube-face-bottom {
          transform: rotateX(-90deg) translateZ(220px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cube-container {
            height: 500px;
            perspective: 1000px;
          }
          .cube-exploded {
            width: 200px;
            height: 200px;
          }
          .cube-face {
            width: 200px;
            height: 200px;
            padding: 1.5rem;
          }
          .cube-feature {
            font-size: 1.2rem;
          }
          .cube-face-front,
          .cube-face-back,
          .cube-face-right,
          .cube-face-left,
          .cube-face-top,
          .cube-face-bottom {
            transform: translateZ(150px);
          }
          .cube-face-back { transform: rotateY(180deg) translateZ(150px); }
          .cube-face-right { transform: rotateY(90deg) translateZ(150px); }
          .cube-face-left { transform: rotateY(-90deg) translateZ(150px); }
          .cube-face-top { transform: rotateX(90deg) translateZ(150px); }
          .cube-face-bottom { transform: rotateX(-90deg) translateZ(150px); }
        }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 13, 31, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: linear-gradient(160deg, #0a1628 0%, #060d1f 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 2.5rem 2rem;
          max-width: 480px;
          width: 100%;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: modalSlide 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 1.5rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .modal-close:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.45);
          margin-bottom: 2.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }
        .form-row .form-group {
          flex: 1;
        }

        .form-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          display: block;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.85rem 1.2rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #4fffb0;
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 3px rgba(79,255,176,0.1);
        }
        .form-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .password-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #4fffb0;
        }

        .btn-modal {
          width: 100%;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          color: #4fffb0;
          box-shadow: 0 4px 20px rgba(27,67,50,0.5);
          transition: all 0.2s ease;
          margin-top: 1rem;
        }
        .btn-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(27,67,50,0.6);
        }

        .modal-footer {
          margin-top: 2rem;
          text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.45);
        }
        .modal-footer button {
          background: none;
          border: none;
          color: #4fffb0;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        .modal-footer button:hover {
          color: #00c9a7;
        }

        .form-error {
          background: linear-gradient(135deg, rgba(27,67,50,0.95) 0%, rgba(10,22,40,0.98) 100%);
          border: 1.5px solid rgba(79,255,176,0.5);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: #4fffb0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: jitterIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
          text-align: center;
          backdrop-filter: blur(10px);
        }

        @keyframes jitterIn {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          25% {
            transform: translateX(5px);
          }
          50% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(3px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ── STATS SECTION ── */
        .stats-section {
          padding: 8rem 2rem;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 100%);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .stat-card {
          text-align: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(27,67,50,0.1) 0%, rgba(10,22,40,0.2) 100%);
          border: 1px solid rgba(79,255,176,0.15);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: linear-gradient(135deg, rgba(27,67,50,0.2) 0%, rgba(10,22,40,0.3) 100%);
          border-color: rgba(79,255,176,0.4);
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(79,255,176,0.2);
        }

        .stat-number {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 5vw, 4.5rem);
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #4fffb0 0%, #00c9a7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── FINAL CTA SECTION ── */
        .cta-section {
          padding: 10rem 2rem;
          background: linear-gradient(180deg, #0a1628 0%, #060d1f 100%);
          text-align: center;
        }

        .cta-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(3.5rem, 8vw, 7rem);
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 1.5rem;
          line-height: 0.95;
        }

        .cta-subhead {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: rgba(255,255,255,0.5);
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        .footer {
          background: linear-gradient(180deg, #060d1f 0%, #030711 100%);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 5rem 2rem 2rem;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr repeat(4, 1fr);
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          color: #fff;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .footer-logo span {
          color: #4fffb0;
        }

        .footer-tagline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.4);
        }

        .footer-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 1.5rem;
        }

        .footer-link {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }

        .footer-link:hover {
          color: #4fffb0;
          padding-left: 5px;
        }

        .footer-socials {
          display: flex;
          gap: 1rem;
        }

        .social-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(79,255,176,0.08);
          border: 1px solid rgba(79,255,176,0.2);
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .social-icon:hover {
          background: rgba(79,255,176,0.15);
          border-color: rgba(79,255,176,0.5);
          color: #4fffb0;
          transform: translateY(-3px);
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 2rem;
          text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.3);
        }

        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .hero {
            padding: 6rem 1.5rem 8rem;
          }

          .hero-h1 {
            font-size: clamp(3rem, 10vw, 6rem);
          }

          .cube-arrow-left {
            left: 1%;
          }

          .cube-arrow-right {
            right: 1%;
          }
        }

        @media (max-width: 768px) {
          .nav { padding: 0 1rem; }
          .section { padding: 4rem 1.5rem; }
          .modal { padding: 1.5rem; max-width: 95%; }
          .nav-btns { gap: 0.5rem; }
          .btn-nav { padding: 0.6rem 1rem; font-size: 0.85rem; }

          .hero {
            padding: 5rem 1rem 6rem;
            min-height: 85vh;
          }

          .hero-h1 {
            font-size: clamp(2.5rem, 12vw, 5rem);
            margin-bottom: 1.5rem;
          }

          .hero-sub {
            font-size: clamp(0.9rem, 3vw, 1.1rem);
            margin-bottom: 2rem;
          }

          .hero-ctas {
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
          }

          .hero-ctas button {
            width: 100%;
            max-width: 300px;
          }

          .btn-main, .btn-sec {
            padding: 0.85rem 2rem;
            font-size: 1rem;
          }

          .features-section {
            padding: 6rem 1rem;
          }

          .features-headline {
            font-size: clamp(2.5rem, 10vw, 4rem);
          }

          .features-subhead {
            font-size: clamp(0.9rem, 3vw, 1rem);
          }

          .cycling-section {
            min-height: 40vh;
            padding: 2rem 1rem;
          }

          .cycling-text {
            font-size: clamp(2.5rem, 10vw, 5rem);
            text-align: center;
          }

          .stats-section {
            padding: 5rem 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .stat-card {
            padding: 1.5rem 1rem;
          }

          .stat-number {
            font-size: clamp(2rem, 8vw, 3rem);
          }

          .stat-label {
            font-size: 0.85rem;
          }

          .cta-section {
            padding: 6rem 1rem;
          }

          .cta-headline {
            font-size: clamp(2.5rem, 10vw, 4rem);
          }

          .cta-subhead {
            font-size: clamp(0.9rem, 3vw, 1rem);
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
          }

          .cta-buttons button {
            width: 100%;
            max-width: 300px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
          }

          .footer-socials {
            justify-content: center;
          }

          .footer {
            padding: 3rem 1rem 1.5rem;
          }

          .cube-arrow {
            width: 40px;
            height: 40px;
            font-size: 1.5rem;
          }

          .cube-arrow-left {
            left: 0.5%;
          }

          .cube-arrow-right {
            right: 0.5%;
          }

          .modal-title {
            font-size: 2rem;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }

        @media (max-width: 480px) {
          .nav-logo {
            font-size: 1.1rem;
          }

          .btn-nav {
            padding: 0.5rem 0.8rem;
            font-size: 0.75rem;
          }

          .hero-h1 {
            font-size: clamp(2rem, 12vw, 3.5rem);
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── INTRO ── */}
      <div className={`intro ${phase}`}>
        <div className="intro-blob" />
        <div className="intro-text">StepOut2Play</div>
      </div>

      {/* ── PAGE ── */}
      <div style={{ opacity: phase === 'done' ? 1 : 0, transition: 'opacity 0.6s ease' }}>

        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo" onClick={handleLogoClick}>
            Step<span>Out</span>2Play
          </div>
          <div className="nav-btns">
            <button className="btn-nav login" onClick={() => setShowLogin(true)}>Login</button>
            <button className="btn-nav signup" onClick={() => setShowSignup(true)}>Sign Up</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="hero-grid" />

          <BulgeSection>
            <div className="hero-content">
              <h1 className="hero-h1">
                Where Every
                <span className="accent">Match Matters.</span>
              </h1>
              <p className="hero-sub">
                From discovering tournaments to competing, organizing, climbing rankings, and following live matches - all in one platform.
              </p>
              <div className="hero-ctas">
                <button className="btn-main" onClick={() => setShowSignup(true)}>Get Started</button>
                <button className="btn-sec" onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  navigate('/browse')
                }}>Browse Tournaments</button>
              </div>
            </div>
          </BulgeSection>
        </section>

        {/* CYCLING TEXT SECTION */}
        <section className="cycling-section">
          <CyclingText />
        </section>

        {/* FEATURES SECTION */}
        <section className="features-section">
          <BulgeSection>
            <div className="features-header">
              <h2 className="features-headline">
                Loaded With<br/>Features.
              </h2>
              <p className="features-subhead">
                We didn't hold back. Here's everything we packed in.
              </p>
            </div>
          </BulgeSection>
          <BulgeSection style={{ marginTop: '3rem' }}>
            <FeaturesBento />
          </BulgeSection>
        </section>

        {/* SOCIAL PROOF SECTION */}
        <section className="stats-section">
          <BulgeSection>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Tournaments Hosted</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Players</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Matches Played</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Live Updates</div>
              </div>
            </div>
          </BulgeSection>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="cta-section">
          <BulgeSection>
            <div className="cta-content">
              <h2 className="cta-headline">Ready to Play?</h2>
              <p className="cta-subhead">Join thousands competing, organizing, and following tournaments worldwide.</p>
              <div className="cta-buttons">
                <button className="btn-main" onClick={() => setShowSignup(true)}>Create Account</button>
                <button className="btn-sec" onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  navigate('/browse')
                }}>Explore Tournaments</button>
              </div>
            </div>
          </BulgeSection>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">Step<span>Out</span>2Play</div>
              <p className="footer-tagline">Where Every Match Matters.</p>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Platform</h4>
              <a href="/browse" className="footer-link">Browse Tournaments</a>
              <a href="/dashboard" className="footer-link">Dashboard</a>
              <a href="/discover" className="footer-link">Discover</a>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Company</h4>
              <a href="#" className="footer-link">About Us</a>
              <a href="#" className="footer-link">Contact</a>
              <a href="#" className="footer-link">Careers</a>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Legal</h4>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Cookie Policy</a>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Connect</h4>
              <div className="footer-socials">
                <a href="#" className="social-icon">𝕏</a>
                <a href="#" className="social-icon">in</a>
                <a href="#" className="social-icon">IG</a>
                <a href="#" className="social-icon">FB</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 StepOut2Play. All rights reserved.</p>
          </div>
        </footer>

      </div>

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowLogin(false); setError(''); }}>×</button>
            <h2 className="modal-title">Game on!</h2>
            <p className="modal-subtitle">Everything you need, one login away.</p>

            <form onSubmit={handleLogin}>
              {error && showLogin && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-modal" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="modal-footer">
              Don't have an account?{' '}
              <button onClick={() => { setShowLogin(false); setShowSignup(true); setError(''); }}>
                Sign up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIGNUP MODAL ── */}
      {showSignup && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowSignup(false); setError(''); }}>×</button>
            <h2 className="modal-title">The game begins here!</h2>
            <p className="modal-subtitle">Sign up and make every match count.</p>

            <form onSubmit={handleSignup}>
              {error && showSignup && <div className="form-error">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                  >
                    {showSignupPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-modal" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="modal-footer">
              Already have an account?{' '}
              <button onClick={() => { setShowSignup(false); setShowLogin(true); setError(''); }}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
