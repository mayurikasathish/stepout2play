import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CreateOrganizationModal from '../components/CreateOrganizationModal'
import api from '../services/api'

const ManagePage = () => {
  const { context, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('organizations')
  const [organizations, setOrganizations] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)
  const [readMoreModal, setReadMoreModal] = useState(null)
  const [confirmActionModal, setConfirmActionModal] = useState(null)
  const [leaveConfirmModal, setLeaveConfirmModal] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const [upgradeConfirmModal, setUpgradeConfirmModal] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [copyToastMessage, setCopyToastMessage] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [context])

  const loadOrganizations = () => {
    if (context?.orgs) {
      setOrganizations(context.orgs)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizations.length > 0) {
      loadJoinRequests()
    }
  }, [organizations])

  useEffect(() => {
    if (activeTab === 'requests') {
      loadJoinRequests()
    } else if (activeTab === 'invitations') {
      loadInvitations()
    }
  }, [activeTab])

  const loadJoinRequests = async () => {
    try {
      const ownerAdminOrgs = organizations.filter(o => o.myRole === 'OWNER' || o.myRole === 'ADMIN')
      let allRequests = []

      for (const org of ownerAdminOrgs) {
        const res = await api.get(`/orgs/${org.id}/join-requests`)
        if (res.data.success) {
          allRequests = [...allRequests, ...res.data.requests.map(r => ({ ...r, orgName: org.name }))]
        }
      }

      setJoinRequests(allRequests)
    } catch (err) {
      console.error('Error loading join requests:', err)
    }
  }

  const loadInvitations = async () => {
    try {
      const res = await api.get('/orgs/invitations/received')
      if (res.data.success) {
        setInvitations(res.data.invitations)
      }
    } catch (err) {
      console.error('Error loading invitations:', err)
    }
  }

  const handleAcceptInvitation = async (inv) => {
    try {
      await api.post(`/orgs/invitations/${inv.id}/accept`)
      loadInvitations()
      refreshContext()
    } catch (err) {
      console.error('Error accepting invitation:', err)
      alert(err.response?.data?.error || 'Failed to accept invitation')
    }
  }

  const handleDeclineInvitation = async (inv) => {
    try {
      await api.post(`/orgs/invitations/${inv.id}/decline`)
      loadInvitations()
    } catch (err) {
      console.error('Error declining invitation:', err)
      alert(err.response?.data?.error || 'Failed to decline invitation')
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'OWNER': return '#ec4899'
      case 'ADMIN': return '#00d4ff'
      case 'MEMBER': return '#4fffb0'
      default: return '#4fffb0'
    }
  }

  const getSocialIcon = (platform) => {
    const lowerPlatform = platform.toLowerCase()
    if (lowerPlatform.includes('instagram') || lowerPlatform.includes('insta')) return '📷'
    if (lowerPlatform.includes('facebook') || lowerPlatform.includes('fb')) return '👥'
    if (lowerPlatform.includes('twitter') || lowerPlatform.includes('x')) return '🐦'
    if (lowerPlatform.includes('linkedin')) return '💼'
    if (lowerPlatform.includes('youtube')) return '📺'
    if (lowerPlatform.includes('whatsapp')) return '💬'
    return '🔗'
  }

  const calculateProfileCompletion = (org) => {
    let completed = 0
    const total = 10

    if (org.name) completed++
    if (org.logoUrl) completed++
    if (org.description) completed++
    if (org.contactPerson) completed++
    if (org.contactEmail) completed++
    if (org.contactPhone) completed++
    if (org.location) completed++
    if (org.sports && org.sports.length > 0) completed++
    if (org.socialLinks && org.socialLinks.length > 0) completed++
    // Extra point if they have all 3 social links
    if (org.socialLinks && org.socialLinks.length >= 3) completed++

    return Math.round((completed / total) * 100)
  }

  const handleCreateSuccess = (newOrg) => {
    refreshContext()
    setShowCreateModal(false)
    setEditingOrg(null)
  }

  const handleAcceptRequest = (req) => {
    setConfirmActionModal({
      type: 'accept',
      request: req,
      title: 'WELCOME TO THE TEAM!',
      icon: '🎉',
      message: `Ready to draft ${req.user ? `${req.user.firstName} ${req.user.lastName}` : 'this player'} to ${req.orgName}?`,
      confirmText: 'Yes, Draft Them!',
      cancelText: 'Hold On'
    })
  }

  const handleRejectRequest = (req) => {
    setConfirmActionModal({
      type: 'reject',
      request: req,
      title: 'BENCH THIS ONE?',
      icon: '🚫',
      message: `You're about to reject ${req.user ? `${req.user.firstName} ${req.user.lastName}` : 'this player'}'s request to join ${req.orgName}.`,
      confirmText: 'Yes, Reject',
      cancelText: 'Wait, No'
    })
  }

  const executeRequestAction = async () => {
    if (!confirmActionModal) return

    try {
      const { type, request } = confirmActionModal
      const orgId = organizations.find(o => o.name === request.orgName)?.id
      if (!orgId) return

      if (type === 'accept') {
        await api.post(`/orgs/${orgId}/join-requests/${request.id}/accept`)
      } else {
        await api.post(`/orgs/${orgId}/join-requests/${request.id}/reject`)
      }

      setConfirmActionModal(null)
      loadJoinRequests()
    } catch (err) {
      console.error(`Error ${confirmActionModal.type}ing request:`, err)
      alert(err.response?.data?.error || `Failed to ${confirmActionModal.type} request`)
    }
  }

  const handleLeaveOrg = async (org) => {
    try {
      setLeaving(true)
      const res = await api.delete(`/orgs/${org.id}/leave`)

      if (res.data.success) {
        setLeaveConfirmModal(null)
        // Refresh context to update org list
        refreshContext()
        // Refresh organizations
        loadOrganizations()
      }
    } catch (err) {
      console.error('Error leaving organization:', err)
      alert(err.response?.data?.error || 'Failed to leave organization')
    } finally {
      setLeaving(false)
    }
  }

  const handleCopyMinisiteLink = (org) => {
    const baseUrl = window.location.origin
    const minisiteUrl = `${baseUrl}/orgs/${org.slug || org.id}`

    navigator.clipboard.writeText(minisiteUrl).then(() => {
      setCopyToastMessage('Minisite link copied to clipboard! ✓')
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 3000)
    }).catch(err => {
      console.error('Failed to copy:', err)
      setCopyToastMessage('Failed to copy link')
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 3000)
    })
  }

  const handleRequestUpgrade = async (org) => {
    try {
      setUpgrading(true)
      const res = await api.post(`/orgs/${org.id}/request-upgrade`)

      if (res.data.success) {
        setUpgradeConfirmModal(null)
        alert('Upgrade request sent to admins! You\'ll be notified when they respond.')
      }
    } catch (err) {
      console.error('Error requesting upgrade:', err)
      alert(err.response?.data?.error || 'Failed to send upgrade request')
    } finally {
      setUpgrading(false)
    }
  }

  const handleDeleteOrg = async (orgId) => {
    try {
      await api.delete(`/orgs/${orgId}`)
      refreshContext()
      setDeleteConfirmModal(null)
    } catch (err) {
      console.error('Error deleting organization:', err)
      alert('Failed to delete organization')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');

        body {
          background: #060d1f;
          margin: 0;
          font-family: 'Barlow Condensed', sans-serif;
        }

        .manage-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #071a2e 100%);
          padding-top: 80px;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .page-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 3.5rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #4fffb0;
          line-height: 1;
        }

        .page-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 2.5rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.4);
        }

        .tabs-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .tab {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
          position: relative;
        }

        .tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
        }

        .tab.active {
          color: #4fffb0;
          background: rgba(79, 255, 176, 0.08);
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -0.5rem;
          left: 0;
          right: 0;
          height: 2px;
          background: #4fffb0;
          box-shadow: 0 0 10px rgba(79, 255, 176, 0.5);
        }

        .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          margin-left: 0.5rem;
          background: #ec4899;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
        }

        .tab-dot {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 8px;
          height: 8px;
          background: #ec4899;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.6);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        .orgs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 1.5rem;
        }

        .requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .request-card {
          border: 2px dashed rgba(79, 255, 176, 0.3);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.9), rgba(6, 13, 31, 0.95));
        }

        .request-card:hover {
          border-color: #4fffb0;
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(79, 255, 176, 0.25);
        }

        .request-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .request-org-badge {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          color: #4fffb0;
          letter-spacing: 0.05em;
        }

        .request-status {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }

        .request-status.pending {
          background: rgba(255, 200, 0, 0.2);
          color: #ffc800;
          border: 1px solid rgba(255, 200, 0, 0.4);
        }

        .request-status.accepted {
          background: rgba(79, 255, 176, 0.2);
          color: #4fffb0;
          border: 1px solid rgba(79, 255, 176, 0.4);
        }

        .request-status.rejected {
          background: rgba(236, 72, 153, 0.2);
          color: #ec4899;
          border: 1px solid rgba(236, 72, 153, 0.4);
        }

        .request-user-info {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .request-user-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          text-transform: uppercase;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .request-user-email {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .request-role-badge {
          margin: 0 1.5rem;
          padding: 0.5rem 1rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: #060d1f;
          border-radius: 8px;
          letter-spacing: 0.05em;
          display: inline-block;
          width: fit-content;
        }

        .request-field {
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .request-field-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
        }

        .request-field-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .request-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-accept {
          flex: 1;
          background: #4fffb0;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.4);
        }

        .btn-reject {
          flex: 1;
          background: transparent;
          color: #ec4899;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          border: 1px solid #ec4899;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-reject:hover {
          background: rgba(236, 72, 153, 0.1);
          border-color: #f472b6;
          color: #f472b6;
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
          height: 100%;
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
          background: linear-gradient(180deg, var(--role-color), rgba(236, 72, 153, 0.5));
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

        .org-card:hover {
          border-color: var(--role-color);
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 30px rgba(79, 255, 176, 0.25);
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
          margin-bottom: 0.75rem;
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
        }

        .profile-completion {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(6, 13, 31, 0.6);
          border: 1px solid;
          border-radius: 8px;
          padding: 0.15rem 0.4rem;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 400;
          font-size: 0.55rem;
          text-transform: none;
          letter-spacing: 0.01em;
          z-index: 10;
          opacity: 0.6;
        }

        .profile-completion.complete {
          border-color: rgba(79, 255, 176, 0.3);
          color: rgba(79, 255, 176, 0.8);
        }

        .profile-completion.incomplete {
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.5);
        }

        .org-description {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
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

        .btn-primary {
          background: #4fffb0;
          color: #060d1f;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(79, 255, 176, 0.4);
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
          display: flex;
          align-items: center;
          gap: 0.35rem;
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

        .btn-leave {
          background: transparent;
          color: rgba(251, 146, 60, 0.7);
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

        .btn-leave:hover {
          color: #fb923c;
        }

        .btn-upgrade {
          background: transparent;
          color: rgba(0, 212, 255, 0.7);
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

        .btn-upgrade:hover {
          color: #00d4ff;
        }

        .btn-share {
          background: transparent;
          color: rgba(79, 255, 176, 0.7);
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

        .btn-share:hover {
          color: #4fffb0;
        }

        .btn-tertiary:hover {
          color: #00d4ff;
        }

        .copy-toast {
          position: fixed;
          top: 100px;
          right: 2rem;
          background: linear-gradient(135deg, rgba(79, 255, 176, 0.95), rgba(0, 212, 255, 0.95));
          color: #060d1f;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: 0 8px 25px rgba(79, 255, 176, 0.4);
          z-index: 10000;
          animation: slideInDown 0.3s ease;
        }

        @keyframes slideInDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
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

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .empty-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .orgs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="manage-container">
        <Navbar />
        <div className="content-wrapper">
          <div className="page-header">
            <div className="header-left">
              <div className="page-title">YOUR ORGANIZATIONS</div>
              <div className="page-subtitle">THE HOME OF EVERY COMPETITION.</div>
            </div>
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              + CREATE ORGANIZATION
            </button>
          </div>

          <CreateOrganizationModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setEditingOrg(null)
            }}
            onSuccess={handleCreateSuccess}
            editOrg={editingOrg}
          />

          <div className="tabs-container">
            <button
              className={`tab ${activeTab === 'organizations' ? 'active' : ''}`}
              onClick={() => setActiveTab('organizations')}
            >
              My Organizations
            </button>
            <button
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Join Requests
              {joinRequests.length > 0 && (
                <span className="tab-badge">{joinRequests.length}</span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
              onClick={() => setActiveTab('invitations')}
            >
              Join Invitations
            </button>
          </div>

          {activeTab === 'organizations' && (
            <>
              {loading ? (
                <div className="empty-state">
                  <div className="empty-text">Loading...</div>
                </div>
              ) : organizations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-emoji">🏟️</div>
                  <div className="empty-text">You're not in any organizations yet</div>
                </div>
              ) : (
                <div className="orgs-grid">
                  {organizations.map(org => (
                    <div
                      key={org.id}
                      className="org-card"
                      style={{ '--role-color': getRoleColor(org.myRole) }}
                    >
                      <div className="org-card-body">
                        {/* Profile Completion Badge - Only for OWNER/ADMIN */}
                        {(org.myRole === 'OWNER' || org.myRole === 'ADMIN') && (
                          <div className={`profile-completion ${calculateProfileCompletion(org) === 100 ? 'complete' : 'incomplete'}`}>
                            Org profile {calculateProfileCompletion(org)}% complete
                          </div>
                        )}

                        <div className="org-card-content">
                          <div className="org-header">
                            <div className="org-title-section">
                              {org.logoUrl && (
                                <img src={org.logoUrl} alt={org.name} className="org-logo" />
                              )}
                              <div>
                                <div className="org-name">{org.name}</div>
                                <div className="role-ribbon" style={{ background: getRoleColor(org.myRole) }}>
                                  {org.myRole}
                                </div>
                                {(org.city || org.state) && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    marginTop: '0.5rem',
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
                          <div>
                            <div className="org-description">{org.description}</div>
                            {org.description.length > 150 && (
                              <button
                                className="btn-tertiary"
                                onClick={() => setReadMoreModal(org)}
                                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              >
                                Read more
                              </button>
                            )}
                          </div>
                        )}

                        <div className="org-stats">
                          <span>
                            <span className="org-stat-value">{org.memberCount || 0}</span> Members
                          </span>
                          <span>•</span>
                          <span>
                            <span className="org-stat-value">{org.tournamentCount || 0}</span> Tournaments
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
                            className="btn-primary"
                            onClick={() => navigate(`/manage/org/${org.id}`)}
                          >
                            Manage Org
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => navigate(`/orgs/${org.id}`)}
                          >
                            Website
                          </button>
                          {(org.myRole === 'OWNER' || org.myRole === 'ADMIN') && (
                            <>
                              <button
                                className="btn-tertiary"
                                onClick={() => navigate(`/orgs/edit?id=${org.id}`)}
                              >
                                ⚙ Edit Website
                              </button>
                              <button
                                className="btn-tertiary"
                                onClick={() => {
                                  setEditingOrg(org)
                                  setShowCreateModal(true)
                                }}
                              >
                                ✏ Edit Org
                              </button>
                              <button
                                className="btn-share"
                                onClick={() => handleCopyMinisiteLink(org)}
                              >
                                🔗 Share Minisite
                              </button>
                            </>
                          )}
                          {org.myRole === 'OWNER' && (
                            <button
                              className="btn-delete"
                              onClick={() => setDeleteConfirmModal(org)}
                            >
                              🗑 Delete Org
                            </button>
                          )}
                          {org.myRole === 'MEMBER' && (
                            <button
                              className="btn-upgrade"
                              onClick={() => setUpgradeConfirmModal(org)}
                            >
                              ⬆️ Request Admin
                            </button>
                          )}
                          {org.myRole !== 'OWNER' && (
                            <button
                              className="btn-leave"
                              onClick={() => setLeaveConfirmModal(org)}
                            >
                              🚪 Leave Org
                            </button>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {joinRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-text">✓ All caught up! No pending requests.</div>
                </div>
              ) : (
                <div className="requests-grid">
                  {joinRequests.map(req => (
                    <div key={req.id} className="request-card">
                      <div className="request-card-header">
                        <div className="request-org-badge">{req.orgName}</div>
                        <div className={`request-status ${req.status.toLowerCase()}`}>
                          {req.status}
                        </div>
                      </div>

                      <div className="request-user-info">
                        <div className="request-user-name">
                          {req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown User'}
                        </div>
                        <div className="request-user-email">✉ {req.email}</div>
                      </div>

                      <div className="request-role-badge" style={{ background: getRoleColor(req.role) }}>
                        Requesting: {req.role}
                      </div>

                      <div className="request-field">
                        <div className="request-field-label">Reason</div>
                        <div className="request-field-value">{req.reason}</div>
                      </div>

                      {req.experience && (
                        <div className="request-field">
                          <div className="request-field-label">Experience</div>
                          <div className="request-field-value">{req.experience}</div>
                        </div>
                      )}

                      {req.status === 'PENDING' && (
                        <div className="request-actions">
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptRequest(req)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectRequest(req)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'invitations' && (
            <>
              {invitations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-text">📬 No invitations yet.</div>
                </div>
              ) : (
                <div className="requests-grid">
                  {invitations.map(inv => (
                    <div key={inv.id} className="request-card">
                      <div className="request-card-header">
                        <div className="request-org-badge">{inv.organization?.name || 'Organization'}</div>
                        <div className={`request-status ${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </div>
                      </div>

                      <div className="request-user-info">
                        <div className="request-user-name">You've been invited!</div>
                        <div className="request-user-email">
                          From: {inv.inviter ? `${inv.inviter.firstName} ${inv.inviter.lastName}` : 'Unknown'}
                        </div>
                      </div>

                      <div className="request-role-badge" style={{ background: getRoleColor(inv.role) }}>
                        Role: {inv.role}
                      </div>

                      {inv.message && (
                        <div className="request-field">
                          <div className="request-field-label">Message</div>
                          <div className="request-field-value">{inv.message}</div>
                        </div>
                      )}

                      {inv.status === 'PENDING' && (
                        <div className="request-actions">
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptInvitation(inv)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleDeclineInvitation(inv)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {deleteConfirmModal && (
            <div className="delete-modal-overlay" onClick={() => setDeleteConfirmModal(null)}>
              <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-icon">🏟️</div>
                <div className="delete-modal-title">GAME OVER?</div>
                <div className="delete-modal-text">
                  You're about to bench this organization permanently.
                </div>
                <div className="delete-modal-org-name">{deleteConfirmModal.name}</div>
                <div className="delete-modal-warning">
                  ⚠ This action can't be reversed. All tournaments, members, and data will be lost.
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setDeleteConfirmModal(null)}
                  >
                    Keep Playing
                  </button>
                  <button
                    className="btn-confirm-delete"
                    onClick={() => handleDeleteOrg(deleteConfirmModal.id)}
                  >
                    Yes, Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {confirmActionModal && (
            <div className="delete-modal-overlay" onClick={() => setConfirmActionModal(null)}>
              <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-icon">{confirmActionModal.icon}</div>
                <div className="delete-modal-title">{confirmActionModal.title}</div>
                <div className="delete-modal-text">
                  {confirmActionModal.message}
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setConfirmActionModal(null)}
                  >
                    {confirmActionModal.cancelText}
                  </button>
                  <button
                    className={confirmActionModal.type === 'accept' ? 'btn-primary' : 'btn-confirm-delete'}
                    onClick={executeRequestAction}
                  >
                    {confirmActionModal.confirmText}
                  </button>
                </div>
              </div>
            </div>
          )}

          {upgradeConfirmModal && (
            <div className="delete-modal-overlay" onClick={() => !upgrading && setUpgradeConfirmModal(null)}>
              <div className="delete-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderColor: 'rgba(0, 212, 255, 0.3)', boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)' }}>
                <div className="delete-modal-icon" style={{ fontSize: '4rem' }}>⬆️</div>
                <div className="delete-modal-title" style={{ color: '#00d4ff' }}>REQUEST ADMIN ROLE?</div>
                <div className="delete-modal-text" style={{ marginBottom: '1rem' }}>
                  You're requesting to be upgraded to Admin in this organization.
                </div>
                <div className="delete-modal-org-name" style={{ color: '#00d4ff', marginBottom: '1.5rem' }}>
                  {upgradeConfirmModal.name}
                </div>
                <div style={{
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem', fontWeight: '600' }}>
                    As an Admin, you'll be able to:
                  </div>
                  <ul style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    paddingLeft: '1.5rem',
                    marginBottom: '0',
                    lineHeight: '1.8'
                  }}>
                    <li>Create and manage tournaments</li>
                    <li>Invite and manage members</li>
                    <li>Edit organization profile</li>
                    <li>Accept join requests</li>
                  </ul>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1.5rem' }}>
                  Your request will be sent to all Owners and Admins. The first one to accept will upgrade you!
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setUpgradeConfirmModal(null)}
                    disabled={upgrading}
                    style={{ opacity: upgrading ? 0.5 : 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRequestUpgrade(upgradeConfirmModal)}
                    disabled={upgrading}
                    style={{
                      flex: 1,
                      background: upgrading ? 'rgba(0, 212, 255, 0.5)' : '#00d4ff',
                      color: '#060d1f',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.875rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: upgrading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: upgrading ? 0.5 : 1
                    }}
                  >
                    {upgrading ? 'Sending Request...' : 'Yes, Request Admin Role'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {leaveConfirmModal && (
            <div className="delete-modal-overlay" onClick={() => !leaving && setLeaveConfirmModal(null)}>
              <div className="delete-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderColor: 'rgba(251, 146, 60, 0.3)', boxShadow: '0 0 40px rgba(251, 146, 60, 0.2)' }}>
                <div className="delete-modal-icon" style={{ fontSize: '4rem' }}>🚪</div>
                <div className="delete-modal-title" style={{ color: '#fb923c' }}>LEAVING THE TEAM?</div>
                <div className="delete-modal-text" style={{ marginBottom: '1rem' }}>
                  You're about to step away from this organization.
                </div>
                <div className="delete-modal-org-name" style={{ color: '#fb923c', marginBottom: '1rem' }}>
                  {leaveConfirmModal.name}
                </div>
                <div style={{
                  background: 'rgba(251, 146, 60, 0.1)',
                  border: '1px solid rgba(251, 146, 60, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem', fontWeight: '600' }}>
                    You will lose access to:
                  </div>
                  <ul style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    paddingLeft: '1.5rem',
                    marginBottom: '0',
                    lineHeight: '1.8'
                  }}>
                    <li>Organization management & tournaments</li>
                    <li>Member directory & communications</li>
                    <li>Event scheduling & registration</li>
                    <li>All organization data & history</li>
                  </ul>
                </div>
                {leaveConfirmModal.myRole === 'OWNER' && (
                  <div className="delete-modal-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                    ⚠ As OWNER, you must transfer ownership or remove all members before leaving.
                  </div>
                )}
                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem', marginBottom: '1.5rem' }}>
                  You can rejoin anytime if invited again by an admin.
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setLeaveConfirmModal(null)}
                    disabled={leaving}
                    style={{ opacity: leaving ? 0.5 : 1 }}
                  >
                    Stay in Team
                  </button>
                  <button
                    onClick={() => handleLeaveOrg(leaveConfirmModal)}
                    disabled={leaving}
                    style={{
                      flex: 1,
                      background: leaving ? 'rgba(251, 146, 60, 0.5)' : '#fb923c',
                      color: '#fff',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.875rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: leaving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: leaving ? 0.5 : 1
                    }}
                  >
                    {leaving ? 'Leaving...' : 'Yes, Leave Organization'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="copy-toast">
          {copyToastMessage}
        </div>
      )}
    </>
  )
}

export default ManagePage
