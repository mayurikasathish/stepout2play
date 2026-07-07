import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CreateOrganizationModal from '../components/CreateOrganizationModal'
import api from '../services/api'

// Scroll reveal hook
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

function BulgeSection({ children, style, delay = 0 }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div ref={ref} style={{
      transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(40px)',
      opacity: visible ? 1 : 0,
      transition: `transform 0.75s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.6s ease ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  )
}

const TrophyIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const PlusIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const TrashIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EditIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const OrganizationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { context } = useAuth()
  const [organization, setOrganization] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)

  const getRoleColor = (role) => {
    switch (role) {
      case 'OWNER': return '#ec4899'
      case 'ADMIN': return '#00d4ff'
      case 'MEMBER': return '#4fffb0'
      default: return '#4fffb0'
    }
  }

  useEffect(() => {
    console.log('OrganizationDetailPage mounted, org ID:', id)
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch organization
      console.log('Fetching org...')
      const orgResponse = await api.get(`/orgs/${id}`)
      console.log('Org response:', orgResponse.data)

      if (orgResponse.data.success) {
        setOrganization(orgResponse.data.org)
      }

      // Fetch tournaments
      console.log('Fetching tournaments...')
      const tournamentsResponse = await api.get(`/orgs/${id}/tournaments`)
      console.log('Tournaments response:', tournamentsResponse.data)

      if (tournamentsResponse.data.success) {
        console.log('Setting tournaments:', tournamentsResponse.data.tournaments)
        setTournaments(tournamentsResponse.data.tournaments)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      console.error('Error response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return

    try {
      await api.delete(`/tournaments/${tournamentId}`)
      loadData()
    } catch (err) {
      console.error('Error deleting tournament:', err)
      alert('Failed to delete tournament')
    }
  }

  const handleEditSuccess = () => {
    setShowEditOrgModal(false)
    loadData()
  }

  const handleDeleteOrg = async () => {
    try {
      await api.delete(`/orgs/${id}`)
      navigate('/manage')
      setDeleteConfirmModal(false)
    } catch (err) {
      console.error('Error deleting organization:', err)
      alert('Failed to delete organization')
    }
  }

  const handleCreateTournament = async (tournamentData) => {
    try {
      const response = await api.post(`/orgs/${id}/tournaments`, tournamentData)
      if (response.data.success) {
        setShowCreateTournamentModal(false)
        loadData()
      }
    } catch (err) {
      console.error('Error creating tournament:', err)
      alert('Failed to create tournament: ' + (err.response?.data?.errors?.join(', ') || err.message))
    }
  }

  const myRole = context?.orgs?.find(o => o.id === id)?.myRole
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'

  console.log('Render - tournaments count:', tournaments.length, 'loading:', loading)

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow Condensed', sans-serif;
          }
        `}</style>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)',
          paddingTop: '80px'
        }}>
          <Navbar />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(79, 255, 176, 0.2)',
              borderTopColor: '#4fffb0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </>
    )
  }

  if (!organization) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow Condensed', sans-serif;
          }
        `}</style>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%)',
          paddingTop: '80px'
        }}>
          <Navbar />
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>🏟️</div>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: '700',
              fontSize: '1.5rem',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '2rem'
            }}>Organization not found</p>
            <button
              onClick={() => navigate('/manage')}
              style={{
                background: 'linear-gradient(135deg, #1B4332, #2d6a4f)',
                color: '#4fffb0',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: '700',
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.9rem 2rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(27,67,50,0.5)'
              }}
            >
              Back to Manage
            </button>
          </div>
        </div>
      </>
    )
  }

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

        .org-detail-container {
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
          right: -150px;
          animation: drift1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #0a3d62 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
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

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }

        /* Header Card */
        .org-header-card {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .org-header-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4fffb0, #1B4332, #4fffb0);
        }

        .org-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .org-logo-section {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .org-logo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(79, 255, 176, 0.3);
        }

        .org-logo-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4fffb0;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3rem;
          border: 3px solid rgba(79, 255, 176, 0.3);
        }

        .org-info {
          flex: 1;
        }

        .org-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #fff;
          line-height: 1;
          margin-bottom: 1rem;
        }

        .org-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .org-stat-highlight {
          color: #4fffb0;
          font-weight: 700;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.1rem;
        }

        .role-ribbon {
          display: inline-block;
          background: var(--role-color);
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.4rem 1.2rem;
          clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);
          transform: skew(-5deg);
          margin-left: 1rem;
        }

        .org-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-tertiary:hover {
          color: #00d4ff;
        }

        .btn-delete {
          background: transparent;
          color: rgba(236, 72, 153, 0.7);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          padding: 0.4rem 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-delete:hover {
          color: #ec4899;
        }

        /* Delete Confirmation Modal */
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

        .delete-modal-org-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #fff;
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(236, 72, 153, 0.1);
          border-radius: 8px;
          border-left: 3px solid #ec4899;
        }

        .delete-modal-warning {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: #ec4899;
          margin-bottom: 2rem;
        }

        .delete-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-confirm-delete {
          background: #ec4899;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          text-transform: uppercase;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-confirm-delete:hover {
          background: #d81b60;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
        }

        .btn-cancel {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          padding: 0.75rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          border-color: #4fffb0;
          color: #4fffb0;
        }

        /* Tournaments Section */
        .tournaments-card {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.5rem;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 2rem;
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

        .tournaments-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tournament-card {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .tournament-card:hover {
          border-color: rgba(79, 255, 176, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(79, 255, 176, 0.15);
        }

        .tournament-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .tournament-info {
          flex: 1;
        }

        .tournament-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 1rem;
        }

        .tournament-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .detail-row {
          display: flex;
          gap: 0.5rem;
        }

        .detail-label {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .detail-value {
          color: rgba(255, 255, 255, 0.8);
          text-transform: capitalize;
        }

        .tournament-meta {
          color: #4fffb0;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        .tournament-actions {
          display: flex;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .org-header-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .org-actions {
            width: 100%;
          }
          .tournament-header {
            flex-direction: column;
          }
          .tournament-actions {
            width: 100%;
          }
        }
      `}</style>

      <div className="org-detail-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="grid-overlay"></div>

        <Navbar />

        <main className="content-wrapper">
          {/* Header */}
          <BulgeSection>
            <div className="org-header-card" style={{ '--role-color': getRoleColor(myRole) }}>
              <div className="org-header-content">
                <div className="org-logo-section">
                  {organization.logoUrl ? (
                    <img src={organization.logoUrl} alt={organization.name} className="org-logo" />
                  ) : (
                    <div className="org-logo-placeholder">
                      {organization.name[0]}
                    </div>
                  )}
                  <div className="org-info">
                    <h1 className="org-name">{organization.name}</h1>
                    <div className="org-stats">
                      <span className="org-stat-highlight">{tournaments.length}</span>
                      <span>Tournament{tournaments.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="role-ribbon" style={{ background: getRoleColor(myRole) }}>{myRole}</span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="org-actions">
                    <button onClick={() => setShowEditOrgModal(true)} className="btn-secondary">
                      <EditIcon className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                      Edit Org
                    </button>
                    {myRole === 'OWNER' && (
                      <button onClick={() => setDeleteConfirmModal(true)} className="btn-delete">
                        <TrashIcon className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                        Delete Org
                      </button>
                    )}
                    <button onClick={() => setShowCreateTournamentModal(true)} className="btn-primary">
                      <PlusIcon className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                      Create Tournament
                    </button>
                  </div>
                )}
              </div>
            </div>
          </BulgeSection>

          {/* Tournaments */}
          <BulgeSection delay={0.1}>
            <div className="tournaments-card">
              <h2 className="section-title">Tournaments</h2>

              {tournaments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏆</div>
                  <h3 className="empty-title">No tournaments yet</h3>
                  <p className="empty-text">Create your first tournament to get started!</p>
                </div>
              ) : (
                <div className="tournaments-grid">
                  {tournaments.map((tournament) => (
                    <div key={tournament.id} className="tournament-card">
                      <div className="tournament-header">
                        <div className="tournament-info">
                          <h3 className="tournament-name">{tournament.name}</h3>
                          <div className="tournament-details">
                            <div className="detail-row">
                              <span className="detail-label">Sport:</span>
                              <span className="detail-value">{tournament.sport}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Date:</span>
                              <span className="detail-value">
                                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">{tournament.venueName}, {tournament.city}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Status:</span>
                              <span className="detail-value">{tournament.status}</span>
                            </div>
                            <div className="tournament-meta">
                              {tournament.events?.length || 0} events • {tournament.participantCount || 0} participants
                            </div>
                          </div>
                        </div>

                        <div className="tournament-actions">
                          <button
                            onClick={() => navigate(`/tournaments/${tournament.id}/manage`)}
                            className="btn-primary"
                          >
                            Manage Tournament
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteTournament(tournament.id)}
                              className="btn-delete"
                            >
                              <TrashIcon className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BulgeSection>

          {/* Edit Organization Modal */}
          {showEditOrgModal && (
            <CreateOrganizationModal
              isOpen={showEditOrgModal}
              onClose={() => setShowEditOrgModal(false)}
              onSuccess={handleEditSuccess}
              editOrg={organization}
            />
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmModal && (
            <div className="delete-modal-overlay" onClick={() => setDeleteConfirmModal(false)}>
              <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-icon">🏟️</div>
                <div className="delete-modal-title">GAME OVER?</div>
                <div className="delete-modal-text">
                  You're about to bench this organization permanently.
                </div>
                <div className="delete-modal-org-name">{organization.name}</div>
                <div className="delete-modal-warning">
                  ⚠ This action can't be reversed. All tournaments, members, and data will be lost.
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setDeleteConfirmModal(false)}
                  >
                    Keep Playing
                  </button>
                  <button
                    className="btn-confirm-delete"
                    onClick={handleDeleteOrg}
                  >
                    Yes, Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Tournament Modal */}
          {showCreateTournamentModal && (
            <CreateTournamentModal
              onClose={() => setShowCreateTournamentModal(false)}
              onSubmit={handleCreateTournament}
            />
          )}
        </main>
      </div>
    </>
  )
}

// Validation Error Modal Component
const ValidationErrorModal = ({ message, onClose }) => {
  return (
    <>
      <style>{`
        .error-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 400;
          background: rgba(6, 13, 31, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .error-modal {
          background: linear-gradient(160deg, #0a1628 0%, #060d1f 100%);
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .error-message {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .btn-error-ok {
          width: 100%;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.9rem;
          background: linear-gradient(135deg, #1B4332, #2d6a4f);
          color: #4fffb0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(27,67,50,0.5);
        }

        .btn-error-ok:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(27,67,50,0.6);
        }
      `}</style>

      <div className="error-modal-overlay" onClick={onClose}>
        <div className="error-modal" onClick={(e) => e.stopPropagation()}>
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Invalid Date</h3>
          <p className="error-message">{message}</p>
          <button onClick={onClose} className="btn-error-ok">
            Got it
          </button>
        </div>
      </div>
    </>
  )
}

// Create Tournament Modal Component
const CreateTournamentModal = ({ onClose, onSubmit }) => {
  const [sportType, setSportType] = useState('single') // 'single' or 'multi'
  const [selectedSports, setSelectedSports] = useState(['badminton'])
  const [validationError, setValidationError] = useState(null)
  const [isOneDayTournament, setIsOneDayTournament] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sport: 'badminton', // Legacy field
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venueName: '',
    venueAddress: '',
    city: '',
    registrationDeadline: '',
    description: '',
    rules: '',
    status: 'DRAFT',
    allowReplacement: true,
    replacementWindowHours: 24
  })

  const availableSports = [
    { id: 'badminton', name: 'Badminton' },
    { id: 'table-tennis', name: 'Table Tennis' },
    { id: 'squash', name: 'Squash' },
    { id: 'pickleball', name: 'Pickleball' },
    { id: 'tennis', name: 'Tennis' },
    { id: 'padel', name: 'Padel' }
  ]

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
    'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
    'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad',
    'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
    'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
    'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Mysore', 'Bareilly'
  ].sort()

  const toggleSport = (sportId) => {
    if (sportType === 'single') {
      setSelectedSports([sportId])
    } else {
      if (selectedSports.includes(sportId)) {
        // Don't allow removing all sports
        if (selectedSports.length > 1) {
          setSelectedSports(selectedSports.filter(s => s !== sportId))
        }
      } else {
        setSelectedSports([...selectedSports, sportId])
      }
    }
  }

  const handleSportTypeChange = (type) => {
    setSportType(type)
    if (type === 'single' && selectedSports.length > 1) {
      // Keep only first sport when switching to single
      setSelectedSports([selectedSports[0]])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate registration deadline is before tournament start
    const regDeadline = new Date(formData.registrationDeadline)
    const tournamentStart = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`)
    const tournamentEnd = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`)

    if (regDeadline >= tournamentStart) {
      setValidationError('Registration deadline must be before the tournament start date and time.')
      return
    }

    if (tournamentEnd <= tournamentStart) {
      setValidationError('Tournament end date and time must be after the start date and time.')
      return
    }

    const submitData = {
      ...formData,
      sportType,
      sports: selectedSports,
      sport: selectedSports[0] // Legacy field - first sport
    }
    onSubmit(submitData)
  }

  return (
    <>
      <style>{`
        .tournament-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem 2rem 2rem;
          overflow-y: auto;
        }

        .tournament-modal-content {
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 13, 31, 0.98));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(79, 255, 176, 0.2);
          border-radius: 16px;
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 0 40px rgba(79, 255, 176, 0.15);
          margin: auto;
        }

        .tournament-modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          margin-bottom: 1.5rem;
        }

        .tournament-form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }

        .tournament-form-input {
          width: 100%;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .tournament-form-input:focus {
          border-color: #4fffb0;
          box-shadow: 0 0 0 3px rgba(79, 255, 176, 0.1);
        }

        .tournament-form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .tournament-form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        textarea.tournament-form-input {
          resize: vertical;
          min-height: 80px;
        }

        .tournament-btn {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .tournament-btn-primary {
          background: #4fffb0;
          color: #060d1f;
        }

        .tournament-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(79, 255, 176, 0.4);
        }

        .tournament-btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .tournament-btn-secondary:hover:not(:disabled) {
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .tournament-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tournament-type-btn {
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          background: rgba(6, 13, 31, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tournament-type-btn:hover {
          border-color: rgba(79, 255, 176, 0.4);
          color: #fff;
        }

        .tournament-type-btn.selected {
          background: rgba(79, 255, 176, 0.15);
          border-color: #4fffb0;
          color: #4fffb0;
        }

        .sport-btn {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: rgba(6, 13, 31, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .sport-btn:hover {
          border-color: rgba(79, 255, 176, 0.4);
          color: #fff;
        }

        .sport-btn.selected {
          background: rgba(79, 255, 176, 0.15);
          border-color: #4fffb0;
          color: #4fffb0;
        }
      `}</style>
      {validationError && (
        <ValidationErrorModal
          message={validationError}
          onClose={() => setValidationError(null)}
        />
      )}
      <div className="tournament-modal-overlay" onClick={onClose}>
        <div className="tournament-modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="tournament-modal-title">Create Tournament</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="tournament-form-label">Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Championship 2024"
                className="tournament-form-input"
                required
              />
            </div>

            {/* Sport Type Selection */}
            <div>
              <label className="tournament-form-label">Tournament Type *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSportTypeChange('single')}
                  className={`tournament-type-btn ${sportType === 'single' ? 'selected' : ''}`}
                >
                  🏆 Single Sport
                </button>
                <button
                  type="button"
                  onClick={() => handleSportTypeChange('multi')}
                  className={`tournament-type-btn ${sportType === 'multi' ? 'selected' : ''}`}
                >
                  🎯 Multi Sport
                </button>
              </div>
            </div>

            {/* Sports Selection */}
            <div>
              <label className="tournament-form-label">
                Select Sport{sportType === 'multi' ? 's' : ''} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableSports.map(sport => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.id)}
                    className={`sport-btn ${selectedSports.includes(sport.id) ? 'selected' : ''}`}
                  >
                    {sport.name}
                    {selectedSports.includes(sport.id) && (
                      <span style={{ marginLeft: '0.5rem', float: 'right' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              {sportType === 'single' && (
                <p className="text-xs text-gray-600 mt-2">
                  Events in this tournament will use {availableSports.find(s => s.id === selectedSports[0])?.name} scoring rules
                </p>
              )}
              {sportType === 'multi' && (
                <p className="text-xs text-gray-600 mt-2">
                  Events can choose from the selected sports above
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOneDayTournament}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setIsOneDayTournament(checked)
                    if (checked && formData.startDate) {
                      setFormData({ ...formData, endDate: formData.startDate })
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 font-medium">1-Day Tournament</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="tournament-form-label">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value
                    setFormData({
                      ...formData,
                      startDate: newStartDate,
                      endDate: isOneDayTournament ? newStartDate : formData.endDate
                    })
                  }}
                  className="tournament-form-input"
                  required
                />
              </div>

              <div>
                <label className="tournament-form-label">Start Time *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="tournament-form-input"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="tournament-form-label">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="tournament-form-input"
                  required
                  disabled={isOneDayTournament}
                  style={isOneDayTournament ? { background: 'rgba(0,0,0,0.05)', cursor: 'not-allowed' } : {}}
                />
              </div>

              <div>
                <label className="tournament-form-label">End Time *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="tournament-form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="tournament-form-label">Venue Name *</label>
              <input
                type="text"
                value={formData.venueName}
                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                placeholder="e.g., Sports Complex Arena"
                className="tournament-form-input"
                required
              />
            </div>

            <div>
              <label className="tournament-form-label">Venue Address</label>
              <input
                type="text"
                value={formData.venueAddress}
                onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                placeholder="Street address"
                className="tournament-form-input"
              />
            </div>

            <div>
              <label className="tournament-form-label">City *</label>
              <input
                type="text"
                list="cities"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Mumbai"
                className="tournament-form-input"
                required
              />
              <datalist id="cities">
                {indianCities.map(city => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="tournament-form-label">Registration Deadline *</label>
              <input
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="tournament-form-input"
                required
              />
              <p className="mt-2 text-xs text-gray-600">
                Must be before tournament start date and time
              </p>
            </div>

            {/* Replacement Window */}
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.allowReplacement}
                  onChange={(e) => setFormData({ ...formData, allowReplacement: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Allow standby players to replace withdrawals
                </span>
              </label>

              {formData.allowReplacement && (
                <div>
                  <label className="tournament-form-label">
                    Replacement Deadline (hours before tournament start) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={formData.replacementWindowHours}
                    onChange={(e) => setFormData({ ...formData, replacementWindowHours: parseInt(e.target.value) || 24 })}
                    className="tournament-form-input"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong>How it works:</strong> If a confirmed player withdraws before this deadline, ALL standby players receive an email notification. The first standby player to accept (by clicking the link in the email) gets the spot. After the deadline, withdrawals are still allowed but standby players won't be notified (to avoid last-minute bracket changes).
                  </p>
                </div>
              )}

              {!formData.allowReplacement && (
                <p className="mt-2 text-xs text-gray-600">
                  Waitlist players will not be automatically promoted if someone withdraws
                </p>
              )}
            </div>

            <div>
              <label className="tournament-form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="tournament-form-input"
              >
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
              </select>
              <p className="mt-2 text-xs text-gray-600">
                Other statuses (Closed, Ongoing, Completed) are calculated automatically based on dates
              </p>
            </div>

            <div>
              <label className="tournament-form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Tournament details..."
                className="tournament-form-input"
              />
            </div>

            <div>
              <label className="tournament-form-label">Tournament Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                rows={6}
                placeholder="Enter tournament rules, regulations, and guidelines..."
                className="tournament-form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="tournament-btn tournament-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tournament-btn tournament-btn-primary"
                style={{ flex: 1 }}
              >
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default OrganizationDetailPage
