import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import Carousel from '../components/Carousel'
import api from '../services/api'

const colorSchemes = {
  'neon-arena': { primary: '#4fffb0', dark: '#3dd68f', light: '#6bffbe' },
  'cyber-court': { primary: '#00d4ff', dark: '#00a8cc', light: '#33ddff' },
  'power-surge': { primary: '#a855f7', dark: '#8b3dd6', light: '#ba6ff8' },
  'blaze-mode': { primary: '#fb923c', dark: '#e07420', light: '#fca55d' },
  'hot-streak': { primary: '#ec4899', dark: '#d1347a', light: '#f067ab' }
}

const OrgMiniSitePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinFormData, setJoinFormData] = useState({
    role: 'MEMBER',
    email: user?.email || '',
    reason: '',
    experience: ''
  })
  const [submittingJoin, setSubmittingJoin] = useState(false)

  useEffect(() => {
    loadOrg()
  }, [id])

  const loadOrg = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/orgs/${id}/public`)
      if (res.data.success) {
        setOrg(res.data.org || res.data.organization)
        setFollowersCount(0)
        setIsFollowing(false)
      }
    } catch (err) {
      console.error('Error loading org:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/orgs/${id}/follow`)
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        setToastMessage('Unfollowed')
        setToastType('success')
      } else {
        await api.post(`/orgs/${id}/follow`)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        setToastMessage('Following!')
        setToastType('success')
      }
      setShowToast(true)
    } catch (err) {
      console.error('Error following org:', err)
      setToastMessage(err.response?.data?.error || 'Failed to follow')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleJoin = () => {
    if (!user) {
      setToastMessage('Please login to join')
      setToastType('error')
      setShowToast(true)
      return
    }
    setJoinFormData({ ...joinFormData, email: user.email })
    setShowJoinModal(true)
  }

  const handleSubmitJoinRequest = async () => {
    if (!joinFormData.reason.trim()) {
      setToastMessage('Please explain why you want to join')
      setToastType('error')
      setShowToast(true)
      return
    }

    setSubmittingJoin(true)
    try {
      await api.post(`/orgs/${org.id}/join-request`, joinFormData)
      setShowJoinModal(false)
      setToastMessage('Request sent!')
      setToastType('success')
      setShowToast(true)
      setJoinFormData({ role: 'MEMBER', email: user?.email || '', reason: '', experience: '' })
    } catch (err) {
      console.error('Error submitting join request:', err)
      setToastMessage(err.response?.data?.error || 'Failed to send request')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSubmittingJoin(false)
    }
  }

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow', sans-serif;
          }

          .loading-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 80px;
          }

          .spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(79, 255, 176, 0.1);
            border-top: 3px solid #4fffb0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container">
          <Navbar />
          <div className="spinner"></div>
        </div>
      </>
    )
  }

  if (!org) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

          body {
            background: #060d1f;
            margin: 0;
            font-family: 'Barlow', sans-serif;
          }

          .not-found-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
            padding-top: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .not-found-card {
            background: linear-gradient(145deg, #0a1628, #060d1f);
            border: 2px solid rgba(236, 72, 153, 0.2);
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 500px;
          }

          .not-found-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 900;
            font-size: 2rem;
            color: #ec4899;
            margin-bottom: 1rem;
          }

          .not-found-btn {
            background: #4fffb0;
            color: #060d1f;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            text-transform: uppercase;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .not-found-btn:hover {
            transform: translateY(-4px) scale(1.05);
          }
        `}</style>
        <div className="not-found-container">
          <Navbar />
          <div className="not-found-card">
            <div className="not-found-title">404 • NOT FOUND</div>
            <button onClick={() => navigate('/discover')} className="not-found-btn">
              Browse Organizations
            </button>
          </div>
        </div>
      </>
    )
  }

  const scheme = colorSchemes[org.colorScheme] || colorSchemes['neon-arena']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          padding: 0;
          font-family: 'Barlow', sans-serif;
          overflow-x: hidden;
        }

        .org-site-container {
          min-height: 100vh;
          background: #060d1f;
          padding-top: 80px;
          padding-bottom: 0;
        }

        /* Banner Section */
        .banner-section {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
        }

        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .banner-section:hover .banner-image {
          transform: scale(1.08);
        }

        .banner-gradient {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${scheme.primary}, rgba(6, 13, 31, 0.6));
          opacity: 0.85;
        }

        .banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 0%, #060d1f 100%);
        }

        /* Header Card - BULGING DEPTH */
        .header-card {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          margin-top: -140px;
          position: relative;
          z-index: 10;
        }

        .header-content {
          background: linear-gradient(145deg, #0d1a2e, #060d1f);
          border: 2.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 3rem;
          transform: translateY(0);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 15px 50px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -3px 10px rgba(0, 0, 0, 0.3);
        }

        .header-content:hover {
          transform: translateY(-12px) scale(1.015);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -3px 10px rgba(0, 0, 0, 0.4);
        }

        .header-top {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 3rem;
        }

        /* Logo - POP OUT EFFECT */
        .org-logo-wrapper {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 4px solid ${scheme.primary};
          overflow: hidden;
          background: linear-gradient(145deg, #0d1a2e, #060d1f);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateZ(0);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.6),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
        }

        .org-logo-wrapper:hover {
          transform: scale(1.15) translateY(-8px);
          border-width: 5px;
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.8),
            inset 0 2px 4px rgba(255, 255, 255, 0.15);
        }

        .org-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .org-logo-fallback {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3.5rem;
          color: ${scheme.primary};
        }

        /* Name & Info */
        .org-info {
          flex: 1;
        }

        .org-name-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3.5rem;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #fff;
          margin: 0 0 0.75rem 0;
          line-height: 1;
        }

        .org-tagline {
          font-family: 'Barlow', sans-serif;
          font-size: 1.4rem;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 1.75rem;
          font-weight: 500;
        }

        .org-stats {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        /* Action Buttons - SIDE BY SIDE */
        .header-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
          min-width: 200px;
        }

        .role-badge {
          padding: 1rem 1.75rem;
          border-radius: 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          text-transform: uppercase;
          white-space: nowrap;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .role-owner {
          background: linear-gradient(145deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.08));
          border: 2px solid rgba(251, 191, 36, 0.5);
          color: #fbbf24;
        }

        .role-admin {
          background: linear-gradient(145deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.08));
          border: 2px solid rgba(168, 85, 247, 0.5);
          color: #a855f7;
        }

        .role-member {
          background: linear-gradient(145deg, rgba(79, 255, 176, 0.2), rgba(79, 255, 176, 0.08));
          border: 2px solid rgba(79, 255, 176, 0.5);
          color: #4fffb0;
        }

        .action-buttons-row {
          display: flex;
          gap: 1rem;
        }

        .btn-follow {
          flex: 1;
          padding: 0.9rem 1.5rem;
          border-radius: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid rgba(255, 255, 255, 0.25);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          letter-spacing: 0.05em;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .btn-follow:hover {
          transform: translateY(-4px) scale(1.05);
          border-color: rgba(255, 255, 255, 0.4);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .btn-join {
          flex: 1;
          padding: 0.9rem 1.5rem;
          border-radius: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: none;
          background: linear-gradient(145deg, ${scheme.light}, ${scheme.dark});
          color: #060d1f;
          letter-spacing: 0.05em;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .btn-join:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .btn-edit {
          padding: 0.9rem 1.75rem;
          border-radius: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid ${scheme.primary};
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.05));
          color: ${scheme.primary};
          letter-spacing: 0.05em;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .btn-edit:hover {
          transform: translateY(-4px) scale(1.05);
          border-color: ${scheme.light};
          color: ${scheme.light};
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        /* Main Content - DEPTH & HIERARCHY */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem 0 2rem;
        }

        .content-card {
          background: linear-gradient(145deg, #0d1a2e, #060d1f);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 3rem;
          margin-bottom: 2.5rem;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .content-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          text-transform: uppercase;
          color: ${scheme.primary};
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 3px solid rgba(255, 255, 255, 0.08);
          letter-spacing: 0.02em;
        }

        .section-text {
          font-family: 'Barlow', sans-serif;
          font-size: 1.1rem;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.8);
          white-space: pre-wrap;
        }

        .motto-card {
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
          border-left: 5px solid ${scheme.primary};
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2.5rem;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .motto-card:hover {
          transform: translateX(8px);
          border-left-width: 7px;
          box-shadow:
            0 12px 48px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .motto-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          text-transform: uppercase;
          color: ${scheme.primary};
          margin-bottom: 1.5rem;
          letter-spacing: 0.02em;
        }

        /* Contact Section - BULGE CARDS */
        .contact-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2));
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .contact-item:hover {
          transform: translateY(-6px) scale(1.03);
          border-color: ${scheme.primary};
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .contact-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 1.5rem;
        }

        .contact-info {
          flex: 1;
        }

        .contact-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
          font-weight: 600;
        }

        .contact-value {
          font-family: 'Barlow', sans-serif;
          font-size: 1.05rem;
          color: ${scheme.primary};
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .contact-value:hover {
          color: ${scheme.light};
        }

        /* Social Buttons - BULGE */
        .social-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.75rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .social-btn:hover {
          transform: translateY(-6px) scale(1.08);
          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(6, 13, 31, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .modal-content {
          background: linear-gradient(145deg, #0d1a2e, #060d1f);
          border: 3px solid ${scheme.primary};
          border-radius: 20px;
          padding: 3rem;
          max-width: 600px;
          width: 100%;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 2.25rem;
          text-transform: uppercase;
          color: ${scheme.primary};
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 2.5rem;
          font-size: 1.1rem;
        }

        .modal-form-group {
          margin-bottom: 1.75rem;
        }

        .modal-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .modal-input, .modal-textarea {
          width: 100%;
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .modal-input:focus, .modal-textarea:focus {
          outline: none;
          border-color: ${scheme.primary};
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .modal-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .modal-actions {
          display: flex;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .btn-modal-cancel {
          flex: 1;
          padding: 1rem;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          color: rgba(255, 255, 255, 0.75);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-modal-cancel:hover {
          transform: translateY(-3px);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
          color: #fff;
        }

        .btn-modal-submit {
          flex: 1;
          padding: 1rem;
          background: linear-gradient(145deg, ${scheme.light}, ${scheme.dark});
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .btn-modal-submit:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.03);
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .btn-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 968px) {
          .header-top {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
            gap: 2rem;
          }

          .org-name-title {
            font-size: 2.5rem;
          }

          .org-stats {
            justify-content: center;
          }

          .banner-section {
            height: 350px;
          }

          .header-card {
            margin-top: -100px;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            padding: 2rem 1.5rem;
          }

          .org-name-title {
            font-size: 2rem;
          }

          .action-buttons-row {
            flex-direction: column;
          }

          .main-content {
            padding: 3rem 1.5rem 0 1.5rem;
          }

          .content-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>

      <div className="org-site-container">
        <Navbar />

        {/* Banner */}
        <div className="banner-section">
          {org.bannerImageUrl ? (
            <>
              <img src={org.bannerImageUrl} alt={org.name} className="banner-image" />
              <div className="banner-overlay"></div>
            </>
          ) : (
            <>
              <div className="banner-gradient"></div>
              <div className="banner-overlay"></div>
            </>
          )}
        </div>

        {/* Header Card */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-top">
              {/* Logo */}
              <div className="org-logo-wrapper">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="org-logo" />
                ) : (
                  <div className="org-logo-fallback">{org.name.charAt(0).toUpperCase()}</div>
                )}
              </div>

              {/* Name & Info */}
              <div className="org-info">
                <h1 className="org-name-title">{org.name}</h1>
                {org.tagline && (
                  <p className="org-tagline">{org.tagline}</p>
                )}
                <div className="org-stats">
                  {(org.memberCount || 0) > 0 && (
                    <div className="stat-item">
                      <span className="stat-icon">👥</span>
                      <span>{org.memberCount} members</span>
                    </div>
                  )}
                  {(org.tournamentCount || 0) > 0 && (
                    <div className="stat-item">
                      <span className="stat-icon">🏆</span>
                      <span>{org.tournamentCount} tournaments</span>
                    </div>
                  )}
                  {followersCount > 0 && (
                    <div className="stat-item">
                      <span className="stat-icon">💚</span>
                      <span>{followersCount} followers</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="header-actions">
                {org.userRole ? (
                  <>
                    <div className={`role-badge role-${org.userRole.toLowerCase()}`}>
                      {org.userRole === 'OWNER' ? '👑 Owner' :
                       org.userRole === 'ADMIN' ? '⚡ Admin' :
                       '✓ Member'}
                    </div>
                    {(org.userRole === 'OWNER' || org.userRole === 'ADMIN') && (
                      <button
                        onClick={() => navigate('/orgs/edit')}
                        className="btn-edit"
                      >
                        ✏ Edit Website
                      </button>
                    )}
                  </>
                ) : (
                  <div className="action-buttons-row">
                    <button onClick={handleFollow} className="btn-follow">
                      <span>{isFollowing ? '💚' : '🤍'}</span>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={handleJoin} className="btn-join">
                      Join Us
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">

          {/* Photo Gallery */}
          {org.photoGallery && org.photoGallery.length > 0 && (
            <div className="content-card">
              <div className="section-title">📸 MOMENTS & MEMORIES</div>
              <Carousel
                images={org.photoGallery}
                autoPlayInterval={3000}
              />
            </div>
          )}

          {/* Motto */}
          {org.motto && (
            <div className="motto-card">
              <div className="motto-title">⚡ OUR MOTTO & CULTURE</div>
              <div className="section-text">{org.motto}</div>
            </div>
          )}

          {/* About Us */}
          {org.aboutUs && (
            <div className="content-card">
              <div className="section-title">📖 ABOUT US</div>
              <div className="section-text">{org.aboutUs}</div>
            </div>
          )}

          {/* What We Offer */}
          {org.whatWeOffer && (
            <div className="content-card">
              <div className="section-title">🎯 WHAT WE OFFER</div>
              <div className="section-text">{org.whatWeOffer}</div>
            </div>
          )}

          {/* Membership Benefits */}
          {org.membershipBenefits && (
            <div className="content-card">
              <div className="section-title">✨ MEMBERSHIP BENEFITS</div>
              <div className="section-text">{org.membershipBenefits}</div>
              {org.membershipFee && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(145deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                  borderRadius: '12px',
                  border: `2px solid rgba(255, 255, 255, 0.08)`
                }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.05em'
                  }}>Membership Fee: </span>
                  <span style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: '700',
                    color: scheme.primary,
                    fontSize: '1.3rem'
                  }}>{org.membershipFee}</span>
                </div>
              )}
            </div>
          )}

          {/* Join Us Info */}
          {org.joinUsInfo && (
            <div className="content-card">
              <div className="section-title">🚀 HOW TO JOIN</div>
              <div className="section-text">{org.joinUsInfo}</div>
              <button
                onClick={handleJoin}
                className="btn-join"
                style={{ marginTop: '2rem' }}
              >
                Request to Join
              </button>
            </div>
          )}

          {/* Contact */}
          {(org.contactEmail || org.contactPhone || org.location) && (
            <div className="content-card">
              <div className="section-title">📞 CONTACT US</div>
              <div className="contact-items">
                {org.contactEmail && (
                  <div className="contact-item">
                    <div className="contact-icon">✉</div>
                    <div className="contact-info">
                      <div className="contact-label">Email</div>
                      <a href={`mailto:${org.contactEmail}`} className="contact-value">
                        {org.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                {org.contactPhone && (
                  <div className="contact-item">
                    <div className="contact-icon">📞</div>
                    <div className="contact-info">
                      <div className="contact-label">Phone</div>
                      <a href={`tel:${org.contactPhone}`} className="contact-value">
                        {org.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
                {org.location && (
                  <div className="contact-item">
                    <div className="contact-icon">📍</div>
                    <div className="contact-info">
                      <div className="contact-label">Location</div>
                      <div className="contact-value">{org.location}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(org.instagramUrl || org.facebookUrl || org.twitterUrl || org.websiteUrl) && (
            <div className="content-card" style={{ marginBottom: 0 }}>
              <div className="section-title">🌐 CONNECT WITH US</div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {org.instagramUrl && (
                  <a
                    href={org.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={{
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      color: '#fff'
                    }}
                  >
                    Instagram
                  </a>
                )}
                {org.facebookUrl && (
                  <a
                    href={org.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={{ background: '#1877f2', color: '#fff' }}
                  >
                    Facebook
                  </a>
                )}
                {org.twitterUrl && (
                  <a
                    href={org.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={{ background: '#000', color: '#fff' }}
                  >
                    Twitter / X
                  </a>
                )}
                {org.websiteUrl && (
                  <a
                    href={org.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={{
                      background: `linear-gradient(145deg, ${scheme.light}, ${scheme.dark})`,
                      color: '#060d1f'
                    }}
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">REQUEST TO JOIN</div>
            <div className="modal-subtitle">{org.name}</div>

            <div>
              <div className="modal-form-group">
                <label className="modal-label">Role</label>
                <select
                  value={joinFormData.role}
                  onChange={(e) => setJoinFormData({ ...joinFormData, role: e.target.value })}
                  className="modal-input"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Email</label>
                <input
                  type="email"
                  value={joinFormData.email}
                  onChange={(e) => setJoinFormData({ ...joinFormData, email: e.target.value })}
                  className="modal-input"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Why do you want to join? *</label>
                <textarea
                  value={joinFormData.reason}
                  onChange={(e) => setJoinFormData({ ...joinFormData, reason: e.target.value })}
                  rows={4}
                  className="modal-textarea"
                  placeholder="Tell us why you're interested..."
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Prior experience (Optional)</label>
                <textarea
                  value={joinFormData.experience}
                  onChange={(e) => setJoinFormData({ ...joinFormData, experience: e.target.value })}
                  rows={3}
                  className="modal-textarea"
                  placeholder="Relevant experience, skills..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowJoinModal(false)}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJoinRequest}
                disabled={submittingJoin}
                className="btn-modal-submit"
              >
                {submittingJoin ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}

export default OrgMiniSitePage
