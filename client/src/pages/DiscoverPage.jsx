import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

/* ─── Icons ─────────────────────────────────────────────── */
const SearchIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
  </svg>
)
const FilterIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
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
const LockIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const GlobeIcon = (p) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

/* ─── Gradient helper (same as OrganizationCard) ─────────── */
const getGradient = (name = '') => {
  const g = [
    'from-primary-500 to-primary-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-green-500 to-emerald-600',
  ]
  return g[name.charCodeAt(0) % g.length]
}

/* ─── Org Discover Card ───────────────────────────────────── */
const DiscoverOrgCard = ({ org, onClick }) => (
  <button
    onClick={onClick}
    className="glass-card rounded-xl text-left hover:shadow-glass-lg transition-all duration-300 w-full group hover:-translate-y-1 overflow-hidden"
  >
    {/* Banner / accent strip */}
    <div className={`h-2 w-full bg-gradient-to-r ${getGradient(org.name)}`} />

    <div className="p-6">
      {/* Header row */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 shrink-0 bg-gradient-to-br ${getGradient(org.name)} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
          <span className="text-white font-bold text-xl">
            {org.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {org.name}
            </h3>
            {org.isPrivate ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100 shrink-0">
                <LockIcon className="w-3 h-3" /> Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-50 text-success-700 text-xs font-medium rounded-full border border-success-100 shrink-0">
                <GlobeIcon className="w-3 h-3" /> Public
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {org.sport || 'Racket Sports'} · {org.location || 'India'}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">
        {org.description || 'No description provided'}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <TrophyIcon className="w-4 h-4 text-primary-500" />
          <span className="font-medium">{org.tournamentCount || 0}</span>
          <span className="text-gray-400">Tournaments</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <UsersIcon className="w-4 h-4 text-primary-500" />
          <span className="font-medium">{org.memberCount || 0}</span>
          <span className="text-gray-400">Members</span>
        </div>
      </div>
    </div>
  </button>
)

/* ─── Skeleton loader ─────────────────────────────────────── */
const OrgCardSkeleton = () => (
  <div className="glass-card rounded-xl overflow-hidden animate-pulse">
    <div className="h-2 bg-gray-200 w-full" />
    <div className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-5" />
      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  </div>
)

/* ─── Main Page ───────────────────────────────────────────── */
const DiscoverPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | public | private

  useEffect(() => {
    loadOrgs()
  }, [])

  const loadOrgs = async () => {
    try {
      setLoading(true)
      // Fetch all public orgs — adjust endpoint to match your backend
      const res = await api.get('/orgs/discover')
      if (res.data.success) {
        setOrgs(res.data.orgs)
      }
    } catch (err) {
      console.error('Error loading orgs:', err)
      // Fallback: empty list without crashing
      setOrgs([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = orgs.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && !o.isPrivate) ||
      (filter === 'private' && o.isPrivate)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Organizations</h1>
          <p className="text-gray-600">
            Find sports organizations to join, play with, and compete in tournaments
          </p>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-gray-400 shrink-0" />
            {['all', 'public', 'private'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-5">
            {filtered.length} organization{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <OrgCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="glass-card rounded-2xl p-12 max-w-md text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No organizations found</h2>
              <p className="text-gray-600 text-sm">
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'No organizations are available yet. Check back soon!'}
              </p>
              {search && (
                <button
                  onClick={() => { setSearch(''); setFilter('all') }}
                  className="mt-6 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((org) => (
              <DiscoverOrgCard
                key={org.id}
                org={org}
                onClick={() => navigate(`/orgs/${org.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default DiscoverPage
