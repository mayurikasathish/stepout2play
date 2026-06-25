import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

/* ─── Icons ─────────────────────────────────────────────── */
const ChevronLeftIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)
const ChevronRightIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)
const BackIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)
const LockIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const UsersIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const TrophyIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)
const CalendarIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const CheckIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const XIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ─── Gradient helper ─────────────────────────────────────── */
const getGradient = (name = '') => {
  const g = [
    'from-primary-500 to-primary-700',
    'from-blue-500 to-indigo-700',
    'from-purple-500 to-pink-700',
    'from-orange-500 to-red-700',
    'from-green-500 to-emerald-700',
  ]
  return g[(name.charCodeAt(0) || 0) % g.length]
}

/* ─── Image Carousel ─────────────────────────────────────── */
const Carousel = ({ images }) => {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  const go = (dir) => {
    clearInterval(timerRef.current)
    setIdx((i) => (i + dir + images.length) % images.length)
    startTimer()
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, 4000)
  }

  useEffect(() => {
    if (images.length > 1) startTimer()
    return () => clearInterval(timerRef.current)
  }, [images.length])

  if (!images || images.length === 0) {
    return (
      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
        <p className="text-gray-400 text-sm">No images uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden group shadow-xl">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`slide ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
          >
            <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-700" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); clearInterval(timerRef.current); startTimer() }}
                className={`rounded-full transition-all ${
                  i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Join Request Modal (for private orgs) ──────────────── */
const JoinRequestModal = ({ org, role, onClose, onSubmit }) => {
  const [form, setForm] = useState({ reason: '', experience: '', availability: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({ ...form, role })
      setSubmitted(true)
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-in">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-success-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
          <p className="text-gray-600 text-sm mb-6">
            Your request to join <strong>{org.name}</strong> as a <strong>{role}</strong> has been submitted.
            The organization admin will review and respond to you.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 max-w-lg w-full animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Request to Join</h3>
            <p className="text-sm text-gray-500">
              Applying as <span className="font-medium text-primary-600">{role}</span> · {org.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Why do you want to join? <span className="text-danger-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Tell the organization what excites you about joining…"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your sports experience
            </label>
            <input
              type="text"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="e.g. 3 years of badminton, state-level doubles player"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Availability
            </label>
            <input
              type="text"
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              placeholder="e.g. Weekends, evenings after 6pm"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.reason.trim() || submitting}
            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm"
          >
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Tournament Card (compact) ──────────────────────────── */
const TournamentCard = ({ t, onClick }) => (
  <button
    onClick={onClick}
    className="glass-card rounded-xl p-4 text-left hover:shadow-glass-lg transition-all hover:-translate-y-0.5 w-full"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate text-sm">{t.name}</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {t.sport} · {t.eventType || 'Open'}
        </p>
      </div>
      <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
        t.status === 'ACTIVE' || t.status === 'ONGOING'
          ? 'bg-success-50 text-success-700 border border-success-100'
          : t.status === 'REGISTRATION_OPEN'
          ? 'bg-blue-50 text-blue-700 border border-blue-100'
          : 'bg-gray-50 text-gray-500 border border-gray-100'
      }`}>
        {t.status?.replace(/_/g, ' ') || 'Upcoming'}
      </span>
    </div>
    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
      <CalendarIcon className="w-3.5 h-3.5" />
      {t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
    </div>
  </button>
)

/* ─── Role privileges config ─────────────────────────────── */
const ROLE_PRIVILEGES = {
  MEMBER: [
    'Register for tournaments run by this organization',
    'View all match schedules and brackets',
    'Receive notifications for new events',
    'Access organization member directory',
  ],
  ADMIN: [
    'Everything a Member can do',
    'Create and manage tournaments',
    'Manage registrations and brackets',
    'Enter and update match scores',
    'Invite new members to the organization',
  ],
}

/* ─── Main Page ───────────────────────────────────────────── */
const OrgMiniSitePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, context } = useAuth()

  const [org, setOrg] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [joinRole, setJoinRole] = useState(null)   // 'MEMBER' | 'ADMIN' | null
  const [joinModal, setJoinModal] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Check if the logged-in user is already in this org
  const myMembership = context?.orgs?.find((o) => o.id === id)
  const isOwner = myMembership?.role === 'OWNER'
  const isAdmin = myMembership?.role === 'ADMIN' || isOwner
  const isMember = !!myMembership

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [orgRes, tourRes, memRes] = await Promise.allSettled([
        api.get(`/orgs/${id}`),
        api.get(`/orgs/${id}/tournaments`),
        api.get(`/orgs/${id}/members`),
      ])
      if (orgRes.status === 'fulfilled' && orgRes.value.data.success) {
        setOrg(orgRes.value.data.org)
      }
      if (tourRes.status === 'fulfilled' && tourRes.value.data.success) {
        setTournaments(tourRes.value.data.tournaments || [])
      }
      if (memRes.status === 'fulfilled' && memRes.value.data.success) {
        setMembers(memRes.value.data.members || [])
      }
    } catch (err) {
      console.error('Error loading org minisite:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Join handlers ── */
  const handleJoinClick = (role) => {
    if (!user) { navigate('/login'); return }
    setJoinRole(role)
    if (org?.isPrivate) {
      setJoinModal(true)
    } else {
      handlePublicJoin(role)
    }
  }

  const handlePublicJoin = async (role) => {
    try {
      setJoinLoading(true)
      await api.post(`/orgs/${id}/join`, { role })
      setJoinSuccess(true)
    } catch (err) {
      console.error('Join error:', err)
      alert(err.response?.data?.message || 'Failed to join. Please try again.')
    } finally {
      setJoinLoading(false)
    }
  }

  const handlePrivateJoinSubmit = async (formData) => {
    await api.post(`/orgs/${id}/join-request`, formData)
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </main>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Organization not found.</p>
          <button onClick={() => navigate('/discover')} className="mt-4 text-primary-600 font-medium">
            ← Back to Discover
          </button>
        </main>
      </div>
    )
  }

  const carouselImages = org.carouselImages || []
  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'tournaments', label: `Tournaments (${tournaments.length})` },
    ...(org.showMembers !== false ? [{ key: 'members', label: `Members (${members.length})` }] : []),
    { key: 'join', label: 'Join' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Back link ── */}
        <button
          onClick={() => navigate('/discover')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6 group"
        >
          <BackIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Discover
        </button>

        {/* ── Hero: Carousel + Org identity ── */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          {/* Carousel */}
          <div className="p-4 pb-0">
            <Carousel images={carouselImages} />
          </div>

          {/* Identity bar */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getGradient(org.name)} rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                <span className="text-white font-bold text-2xl">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                  {org.isPrivate ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                      <LockIcon className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-success-50 text-success-700 text-xs font-medium rounded-full border border-success-100">
                      Public
                    </span>
                  )}
                  {/* Admin badge if logged in user manages this org */}
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
                      {isOwner ? 'Owner' : 'Admin'}
                    </span>
                  )}
                  {isMember && !isAdmin && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                      Member
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {org.sport || 'Racket Sports'} · {org.location || 'India'}
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-5 sm:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{tournaments.length}</p>
                  <p className="text-xs text-gray-500">Tournaments</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Admin: Manage Page Link ── */}
        {isAdmin && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
            <p className="text-sm text-primary-700 font-medium">
              You manage this organization.
            </p>
            <button
              onClick={() => navigate(`/manage/org/${id}`)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Go to Admin Dashboard →
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'about' && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {org.description || 'No description has been provided for this organization yet.'}
              </p>
            </div>
            {org.contactEmail && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Contact</p>
                <a href={`mailto:${org.contactEmail}`} className="text-sm text-primary-600 hover:underline">
                  {org.contactEmail}
                </a>
              </div>
            )}
            {org.foundedYear && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Founded</p>
                <p className="text-sm text-gray-700">{org.foundedYear}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div>
            {tournaments.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No tournaments organized yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {tournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    t={t}
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            {members.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Member list is private or empty.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {members.map((m) => (
                  <div key={m.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{m.role || 'Member'}</p>
                    </div>
                    {/* View profile — visible to anyone */}
                    <button
                      onClick={() => navigate(`/players/${m.userId || m.id}`)}
                      className="shrink-0 text-xs text-primary-600 font-medium hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'join' && (
          <div className="space-y-4">
            {/* Already a member */}
            {isMember ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-7 h-7 text-success-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">You're already in!</h3>
                <p className="text-sm text-gray-500">
                  You are a <strong>{myMembership.role}</strong> of {org.name}.
                </p>
              </div>
            ) : joinSuccess ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-7 h-7 text-success-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Joined Successfully!</h3>
                <p className="text-sm text-gray-500">
                  You are now a member of {org.name}.
                </p>
              </div>
            ) : (
              <>
                {/* Role cards */}
                {['MEMBER', 'ADMIN'].map((role) => (
                  <div key={role} className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Join as {role === 'MEMBER' ? 'Member' : 'Admin'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {role === 'MEMBER'
                            ? 'Participate in tournaments and events'
                            : 'Help organize and manage tournaments'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinClick(role)}
                        disabled={joinLoading}
                        className={`shrink-0 px-5 py-2 font-medium rounded-xl text-sm transition-all disabled:opacity-50 ${
                          role === 'ADMIN'
                            ? 'bg-gray-900 hover:bg-gray-700 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {org.isPrivate ? 'Request to Join' : 'Join Now'}
                      </button>
                    </div>

                    {/* Privileges list */}
                    <ul className="space-y-2">
                      {ROLE_PRIVILEGES[role].map((priv, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckIcon className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                          {priv}
                        </li>
                      ))}
                    </ul>

                    {/* Private org note */}
                    {org.isPrivate && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-amber-600">
                        <LockIcon className="w-3.5 h-3.5 shrink-0" />
                        This is a private organization. Your request will be reviewed by an admin before approval.
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Join Request Modal (private orgs) ── */}
      {joinModal && (
        <JoinRequestModal
          org={org}
          role={joinRole}
          onClose={() => setJoinModal(false)}
          onSubmit={handlePrivateJoinSubmit}
        />
      )}
    </div>
  )
}

export default OrgMiniSitePage
