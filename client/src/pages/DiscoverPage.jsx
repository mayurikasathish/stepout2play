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
const DiscoverOrgCard = ({ org, onClick, setReadMoreModal, setJoinModal }) => {
  return (
    <div className="org-card">
      <div className="org-card-body">
        <div className="org-card-content">
          <div className="org-header">
            <div className="org-title-section">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="org-logo" />
              ) : (
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1B4332, #2d6a4f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4fffb0',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  border: '2px solid rgba(79, 255, 176, 0.3)'
                }}>
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="org-name">{org.name}</div>
                {(org.city || org.state) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginTop: '0.25rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: "'Barlow Condensed', sans-serif"
                  }}>
                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{org.city}{org.state ? `, ${org.state}` : ''}</span>
                  </div>
                )}
                {org.owners && org.owners.length > 0 && (
                  <div className="org-owners">
                    {org.owners.map((owner, idx) => (
                      <span key={owner.id}>
                        <a
                          href={`/players/${owner.id}`}
                          className="owner-link"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          {owner.fullName}
                        </a>
                        {idx < org.owners.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {org.sports && org.sports.length > 0 && (
            <div className="org-sports">
              {org.sports.map((sport, idx) => (
                <span key={idx} className="sport-tag">{sport}</span>
              ))}
            </div>
          )}

          {org.description && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="org-description">{org.description}</span>
              {org.description.length > 150 && (
                <>
                  {' '}
                  <button
                    className="btn-tertiary"
                    onClick={(e) => {
                      e.stopPropagation()
                      setReadMoreModal(org)
                    }}
                  >
                    Read more
                  </button>
                </>
              )}
            </div>
          )}

          <div className="org-stats">
            <span>
              <span className="org-stat-value">{org.memberCount || 0}</span> {org.memberCount === 1 ? 'Member' : 'Members'}
            </span>
            <span>•</span>
            <span>
              <span className="org-stat-value">{org.tournamentCount || 0}</span> {org.tournamentCount === 1 ? 'Tournament' : 'Tournaments'}
            </span>
          </div>

          <div className="org-contact">
            {org.contactPerson && <div className="contact-item">👤 {org.contactPerson}</div>}
            {org.contactPhone && <div className="contact-item">📞 {org.contactPhone}</div>}
            {org.contactEmail && (
              <div className="contact-item">
                ✉ <a href={`mailto:${org.contactEmail}`} className="email-link">{org.contactEmail}</a>
              </div>
            )}
            {org.location && <div className="contact-item">📍 {org.location}</div>}
            {org.socialLinks && Array.isArray(org.socialLinks) && org.socialLinks.length > 0 && (
              <div className="contact-item social-links">
                {org.socialLinks.map((link, idx) => {
                  const platform = link.platform.toLowerCase()
                  let iconText = ''
                  let iconClass = ''
                  if (platform.includes('instagram') || platform.includes('insta')) {
                    iconText = 'IG'
                    iconClass = 'social-instagram'
                  } else if (platform.includes('facebook') || platform.includes('fb')) {
                    iconText = 'FB'
                    iconClass = 'social-facebook'
                  } else if (platform.includes('twitter') || platform.includes('x')) {
                    iconText = 'X'
                    iconClass = 'social-twitter'
                  }
                  return iconText ? (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.platform}
                      className={`social-icon ${iconClass}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {iconText}
                    </a>
                  ) : null
                })}
              </div>
            )}
          </div>

          <div className="org-actions">
            <button
              className="btn-follow"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Handle follow
                alert('Follow functionality coming soon!')
              }}
            >
              Follow
            </button>
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                setJoinModal(org)
              }}
            >
              Join Us
            </button>
            <button
              className="btn-secondary"
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
            >
              View Website
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [readMoreModal, setReadMoreModal] = useState(null)
  const [joinModal, setJoinModal] = useState(null)
  const [successToast, setSuccessToast] = useState(null)
  const [joinForm, setJoinForm] = useState({ role: 'MEMBER', email: '', reason: '', experience: '' })

  useEffect(() => {
    loadOrgs()
  }, [])

  const loadOrgs = async () => {
    try {
      setLoading(true)
      // Fetch all public orgs — adjust endpoint to match your backend
      const res = await api.get('/orgs/discover')
      if (res.data.success) {
        // Filter out orgs where user is already a member/admin/owner
        const filteredOrgs = res.data.orgs.filter(org => !org.userRole)
        setOrgs(filteredOrgs)
      }
    } catch (err) {
      console.error('Error loading orgs:', err)
      // Fallback: empty list without crashing
      setOrgs([])
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRequest = async (orgId, orgName) => {
    try {
      const res = await api.post(`/orgs/${orgId}/join-request`, joinForm)
      if (res.data.success) {
        setJoinModal(null)
        setJoinForm({ role: 'MEMBER', email: '', reason: '', experience: '' })
        setSuccessToast(`Join request sent to ${orgName}! 🚀`)
        setTimeout(() => setSuccessToast(null), 3000)
      }
    } catch (err) {
      console.error('Error sending join request:', err)
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to send join request')
    }
  }

  const filtered = orgs.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.description || '').toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow Condensed', sans-serif;
          overflow-x: hidden;
        }

        .discover-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 80px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.3;
          z-index: 0;
        }
        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #1B4332 0%, transparent 70%);
          top: -150px;
          left: -150px;
          animation: drift1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #0a3d62 0%, transparent 70%);
          bottom: -100px;
          right: -100px;
          animation: drift2 22s ease-in-out infinite;
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
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 55px 55px;
          pointer-events: none;
          z-index: 0;
        }

        .discover-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 6vw, 4rem);
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #4fffb0;
          line-height: 0.9;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .search-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .search-input {
          width: 100%;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #4fffb0;
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.4);
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .filter-btn {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: rgba(79, 255, 176, 0.4);
          color: rgba(255, 255, 255, 0.9);
        }

        .filter-btn.active {
          background: rgba(79, 255, 176, 0.15);
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .results-count {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }

        .orgs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 1.5rem;
          align-items: stretch;
        }

        .org-card {
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          min-height: 480px;
        }

        .org-card:hover {
          border-color: #ec4899;
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 30px rgba(236, 72, 153, 0.25);
        }

        .org-card-body {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .org-card-body::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: linear-gradient(180deg, #ec4899, rgba(236, 72, 153, 0.5));
        }

        .org-card-body::after {
          content: '';
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(79, 255, 176, 0.05);
          border: 2px solid rgba(79, 255, 176, 0.2);
        }

        .org-card-content {
          padding: 1.5rem;
          padding-left: 2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .org-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .org-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .org-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(79, 255, 176, 0.3);
          background: rgba(6, 13, 31, 0.8);
        }

        .org-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .org-owners {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.75rem;
        }

        .owner-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
        }

        .owner-link:hover {
          color: #4fffb0;
          border-bottom-color: #4fffb0;
        }

        .org-sports {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .sport-tag {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          padding: 0.4rem 1rem;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.15), rgba(79, 255, 176, 0.08));
          border: 1.5px solid rgba(79, 255, 176, 0.4);
          border-radius: 16px;
          color: #4fffb0;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(79, 255, 176, 0.1);
        }

        .org-description {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
        }

        .org-description {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.5;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .org-stats {
          display: flex;
          gap: 1.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .org-stat-value {
          color: #4fffb0;
          font-weight: 700;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.1rem;
        }

        .org-contact {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .email-link {
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .email-link:hover {
          color: #4fffb0;
          text-decoration: underline;
        }

        .social-links {
          display: flex;
          gap: 0.5rem;
        }

        .social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          text-decoration: none;
          color: #fff;
          transition: all 0.2s ease;
        }

        .social-instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .social-instagram:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(188, 24, 136, 0.4);
        }

        .social-facebook {
          background: #1877f2;
        }

        .social-facebook:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.4);
        }

        .social-twitter {
          background: #000;
        }

        .social-twitter:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
        }

        .org-actions {
          margin-top: auto;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-follow {
          background: #ec4899;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-follow:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(236, 72, 153, 0.5);
          background: #f472b6;
        }

        .btn-primary {
          background: #4fffb0;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.4);
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          padding: 0.65rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .btn-tertiary {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          padding: 0.4rem 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-tertiary:hover {
          color: #00d4ff;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }

        .empty-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (max-width: 768px) {
          .orgs-grid {
            grid-template-columns: 1fr;
          }
          .search-bar {
            flex-direction: column;
          }
        }

        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .delete-modal-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(236, 72, 153, 0.3);
          border-radius: 16px;
          padding: 2.5rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 0 40px rgba(236, 72, 153, 0.2);
          text-align: center;
        }

        .delete-modal-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .delete-modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ec4899;
          margin-bottom: 1rem;
        }

        .delete-modal-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .delete-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .join-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .join-modal-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 2px solid rgba(79, 255, 176, 0.3);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 0 40px rgba(79, 255, 176, 0.2);
          text-align: center;
        }

        .join-modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .join-modal-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .join-modal-content::-webkit-scrollbar-thumb {
          background: rgba(79, 255, 176, 0.3);
          border-radius: 4px;
        }

        .join-modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 255, 176, 0.5);
        }

        .join-modal-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .join-modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 0.75rem;
        }

        .join-modal-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        .join-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          text-align: left;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 0.05em;
        }

        .form-input {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          padding: 0.65rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #4fffb0;
          background: rgba(255, 255, 255, 0.08);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        textarea.form-input {
          resize: vertical;
          min-height: 60px;
        }

        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%234fffb0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }

        select.form-input option {
          background: #0a1628;
          color: #fff;
          padding: 0.5rem;
        }

        .join-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-cancel {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          border-color: #ec4899;
          color: #ec4899;
        }

        .btn-join {
          background: #4fffb0;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-join:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.4);
        }

        .btn-join:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-join:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .success-toast {
          position: fixed;
          top: 5rem;
          right: 2rem;
          z-index: 9999;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .success-toast-content {
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.95), rgba(79, 255, 176, 0.85));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(79, 255, 176, 0.3);
          border: 2px solid rgba(79, 255, 176, 1);
        }
      `}</style>

      <div className="discover-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="grid-overlay"></div>

        <Navbar />

        <main className="discover-content">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">Discover Organizations</h1>
            <p className="page-subtitle">
              Find new sports organizations to join and run tournaments with!
            </p>
          </div>

          {/* Search bar */}
          <div className="search-bar">
            <div className="search-input-wrapper">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="results-count">
              {filtered.length} organization{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="empty-state">
              <div className="empty-title">Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <div className="empty-title">No organizations found</div>
              <div className="empty-text">
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'No organizations are available yet. Check back soon!'}
              </div>
            </div>
          ) : (
            <div className="orgs-grid">
              {filtered.map((org) => (
                <DiscoverOrgCard
                  key={org.id}
                  org={org}
                  onClick={() => navigate(`/orgs/${org.id}`)}
                  setReadMoreModal={setReadMoreModal}
                  setJoinModal={setJoinModal}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Read More Modal */}
      {readMoreModal && (
        <div className="delete-modal-overlay" onClick={() => setReadMoreModal(null)}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">📖</div>
            <div className="delete-modal-title">{readMoreModal.name}</div>
            <div className="delete-modal-text" style={{
              maxHeight: '400px',
              overflowY: 'auto',
              textAlign: 'left',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {readMoreModal.description}
            </div>
            <div className="delete-modal-actions" style={{ justifyContent: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => setReadMoreModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Us Modal */}
      {joinModal && (
        <div className="join-modal-overlay">
          <div className="join-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="join-modal-icon">🚀</div>
            <div className="join-modal-title">Join {joinModal.name}</div>
            <div className="join-modal-text">
              Fill out the form below to send a join request. Organization admins will review your application.
            </div>

            <div className="join-form">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={joinForm.role}
                  onChange={(e) => setJoinForm({ ...joinForm, role: e.target.value })}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your.email@example.com"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea
                  className="form-input"
                  placeholder="Why do you want to join this organization?"
                  rows={3}
                  value={joinForm.reason}
                  onChange={(e) => setJoinForm({ ...joinForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience (Optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Share your relevant experience..."
                  rows={2}
                  value={joinForm.experience}
                  onChange={(e) => setJoinForm({ ...joinForm, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="join-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setJoinModal(null)
                  setJoinForm({ role: 'MEMBER', email: '', reason: '', experience: '' })
                }}
              >
                Cancel
              </button>
              <button
                className="btn-join"
                onClick={() => handleJoinRequest(joinModal.id, joinModal.name)}
                disabled={!joinForm.email || !joinForm.reason}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="success-toast">
          <div className="success-toast-content">
            ✨ {successToast}
          </div>
        </div>
      )}
    </>
  )
}

export default DiscoverPage
