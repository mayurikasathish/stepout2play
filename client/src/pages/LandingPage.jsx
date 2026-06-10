import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)
const GridIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
  </svg>
)
const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const CalendarIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const ChartIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const LightningIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const CheckIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const EyeIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const EyeOffIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const LandingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  // showAuthModal can be 'login' | 'signup' | null
  const [showAuthModal, setShowAuthModal] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-card border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-2xl font-black text-white">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">StepOut2Play</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <button onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all">
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button onClick={() => setShowAuthModal('login')}
                    className="px-5 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors">
                    Log In
                  </button>
                  <button onClick={() => setShowAuthModal('signup')}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-success-50/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-slide-up leading-tight">
              Tournament Management
              <span className="block text-primary-600 mt-3">Made Simple</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto animate-slide-up font-medium" style={{ animationDelay: '0.1s' }}>
              Badminton · Tennis · Table Tennis · Squash · Pickleball · Padel
            </p>
            <p className="text-base text-gray-500 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.15s' }}>
              Powered by automatic bracket generation
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {user ? (
                <button onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
                  Go to Dashboard
                </button>
              ) : (
                <button onClick={() => setShowAuthModal('signup')}
                  className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
                  Get Started Free
                </button>
              )}
              <button onClick={() => navigate('/browse')}
                className="w-full sm:w-auto px-10 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
                Browse Tournaments
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* USP — Bracket Generation */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Automatic Bracket Generation</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-medium">
              Stop spending hours creating tournament brackets manually. Our intelligent system generates perfect brackets in seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: LightningIcon, title: 'Instant Generation', desc: 'Create brackets for 4, 8, 16, 32, or any number of players in milliseconds.' },
              { icon: GridIcon, title: 'Smart Seeding', desc: 'Automatic seeding based on rankings or random draws. Fair matchups every time.' },
              { icon: ChartIcon, title: 'Live Updates', desc: 'Brackets update in real-time as matches are played. Everyone stays informed.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                <div className="w-14 h-14 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-gray-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Journeys */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">For Players & Organizers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">Compete in tournaments, organize them, or do both.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {[
              {
                title: 'Players', cta: user ? 'Go to Dashboard' : 'Start Playing', dark: false,
                desc: 'Find tournaments, register, and track your progress.',
                items: ['Browse tournaments by sport, location, and date', 'Register for singles, doubles, or mixed events', 'Track your matches and view live brackets', 'Build your profile with tournament history'],
              },
              {
                title: 'Organizers', cta: user ? 'Go to Dashboard' : 'Start Organizing', dark: true,
                desc: 'Create tournaments and generate brackets automatically.',
                items: ['Create tournaments with custom formats and rules', 'Manage registrations and participant details', 'Generate brackets automatically — no manual work', 'Real-time scoring and live bracket updates'],
              },
            ].map(({ title, cta, dark, desc, items }) => (
              <div key={title} className="glass-card rounded-2xl p-10 hover:shadow-xl transition-all border border-gray-200 flex flex-col">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 mb-8 text-lg">{desc}</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckIcon className="w-4 h-4 text-success-600" />
                      </div>
                      <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => user ? navigate('/dashboard') : setShowAuthModal('signup')}
                  className={`w-full px-6 py-3 font-semibold rounded-lg transition-all uppercase tracking-wide mt-auto ${dark ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}>
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Everything You Need</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { Icon: CalendarIcon, bg: 'bg-primary-100', ic: 'text-primary-600', title: 'Event Categories', desc: 'Open Men\'s, U19 Boys, Women\'s, Veterans 40+, and custom categories.' },
              { Icon: UsersIcon, bg: 'bg-success-100', ic: 'text-success-600', title: 'Doubles Support', desc: 'Singles, Doubles, and Mixed Doubles. Manage pairs and team registrations.' },
              { Icon: ChartIcon, bg: 'bg-warning-100', ic: 'text-warning-600', title: 'Live Scoring', desc: 'Real-time match scores and bracket updates. Everyone stays informed.' },
              { Icon: TrophyIcon, bg: 'bg-danger-100', ic: 'text-danger-600', title: 'Multiple Formats', desc: 'Knockout Bracket and Round Robin formats. Choose what fits your event.' },
              { Icon: GridIcon, bg: 'bg-primary-100', ic: 'text-primary-600', title: '6 Sports', desc: 'Badminton, Tennis, Table Tennis, Squash, Pickleball, and Padel.' },
              { Icon: LightningIcon, bg: 'bg-success-100', ic: 'text-success-600', title: 'Quick Setup', desc: 'Create a tournament in under 5 minutes. Simple forms, smart defaults.' },
            ].map(({ Icon, bg, ic, title, desc }) => (
              <div key={title} className="glass-card rounded-2xl p-8">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${ic}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">Ready to Get Started?</h2>
          <p className="text-xl text-primary-50 mb-10 max-w-2xl mx-auto font-medium">Join players and organizers using StepOut2Play.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-gray-50 text-primary-700 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => setShowAuthModal('signup')}
                className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-gray-50 text-primary-700 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
                Get Started Free
              </button>
            )}
            <button onClick={() => navigate('/browse')}
              className="w-full sm:w-auto px-10 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg uppercase tracking-wider">
              Browse Tournaments
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-xl font-black text-white">S</span>
              </div>
              <span className="text-lg font-bold text-white">StepOut2Play</span>
            </div>
            <p className="text-sm">© 2026 StepOut2Play. Making tournament management effortless.</p>
          </div>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md" onClick={() => setShowAuthModal(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
              {/* ✕ close button */}
              <button onClick={() => setShowAuthModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {showAuthModal === 'login' ? (
                <LoginForm
                  onClose={() => setShowAuthModal(null)}
                  onSwitchToSignup={() => setShowAuthModal('signup')}
                />
              ) : (
                <SignupForm
                  onClose={() => setShowAuthModal(null)}
                  onSwitchToLogin={() => setShowAuthModal('login')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Login Form ────────────────────────────────────────────────────────────────
const LoginForm = ({ onClose, onSwitchToSignup }) => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      onClose()
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || err.response?.data?.error || 'Invalid email or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-gray-500 text-sm mb-6">Sign in to your StepOut2Play account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="you@example.com" autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter your password"
              className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Signing in...</>
          ) : 'Sign in'}
        </button>
      </form>

      {/* Switch to signup */}
      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Create one — it's free
          </button>
        </p>
      </div>
    </>
  )
}

// ── Signup Form ───────────────────────────────────────────────────────────────
const SignupForm = ({ onClose, onSwitchToLogin }) => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (f) => (e) => { setFormData(p => ({ ...p, [f]: e.target.value })); setError('') }

  const validate = () => {
    if (!formData.firstName.trim()) return 'First name is required'
    if (!formData.lastName.trim()) return 'Last name is required'
    if (!formData.email) return 'Email is required'
    if (!formData.password) return 'Password is required'
    if (formData.password.length < 8) return 'Password must be at least 8 characters'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password))
      return 'Password needs uppercase, lowercase, number & special character'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })
      onClose()
      navigate('/onboarding')
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      const msg = Array.isArray(serverErrors)
        ? serverErrors.join('. ')
        : err.response?.data?.error || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white'

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
      <p className="text-gray-500 text-sm mb-6">Join StepOut2Play — it's free</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">First name</label>
            <input type="text" value={formData.firstName} onChange={set('firstName')}
              placeholder="Mayurika" className={inputCls} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Last name</label>
            <input type="text" value={formData.lastName} onChange={set('lastName')}
              placeholder="Sharma" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Email</label>
          <input type="email" value={formData.email} onChange={set('email')}
            placeholder="you@example.com" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={formData.password} onChange={set('password')}
              placeholder="Min 8 chars, uppercase, number & symbol"
              className={inputCls + ' pr-11'} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Creating account...</>
          ) : 'Create account'}
        </button>
      </form>

      {/* Switch to login */}
      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </>
  )
}

export default LandingPage
