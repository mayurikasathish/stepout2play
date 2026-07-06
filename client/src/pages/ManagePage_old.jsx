import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import OrganizationCard from '../components/OrganizationCard'
import CreateOrganizationModal from '../components/CreateOrganizationModal'
import Toast from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const BuildingIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const PlusIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const UsersIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CheckIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ManagePage = () => {
  const { context, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('organizations') // organizations | requests | invitations
  const [joinRequests, setJoinRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    setOrganizations(context?.orgs || [])
    setLoading(false)
    loadJoinRequests()
    loadInvitations()
  }, [context])

  const loadJoinRequests = async () => {
    setLoadingRequests(true)
    try {
      const orgs = context?.orgs || []
      const ownerAdminOrgs = orgs.filter(o => o.myRole === 'OWNER' || o.myRole === 'ADMIN')

      const allRequests = []
      for (const org of ownerAdminOrgs) {
        try {
          const res = await api.get(`/orgs/${org.id}/join-requests`)
          if (res.data.success && res.data.requests.length > 0) {
            allRequests.push(...res.data.requests)
          }
        } catch (err) {
          console.error(`Error loading requests for org ${org.id}:`, err)
        }
      }
      setJoinRequests(allRequests)
    } catch (err) {
      console.error('Error loading join requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleAcceptRequest = async (request) => {
    try {
      await api.post(`/orgs/${request.orgId}/join-requests/${request.id}/accept`)
      setToastMessage(`Accepted ${request.user.firstName} ${request.user.lastName}`)
      setToastType('success')
      setShowToast(true)
      loadJoinRequests()
      refreshContext()
    } catch (err) {
      console.error('Error accepting request:', err)
      setToastMessage('Failed to accept request')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleRejectRequest = async (request) => {
    try {
      await api.post(`/orgs/${request.orgId}/join-requests/${request.id}/reject`)
      setToastMessage(`Rejected ${request.user.firstName} ${request.user.lastName}`)
      setToastType('success')
      setShowToast(true)
      loadJoinRequests()
    } catch (err) {
      console.error('Error rejecting request:', err)
      setToastMessage('Failed to reject request')
      setToastType('error')
      setShowToast(true)
    }
  }

  const loadInvitations = async () => {
    setLoadingInvitations(true)
    try {
      const res = await api.get('/orgs/invitations/received')
      if (res.data.success) {
        setInvitations(res.data.invitations || [])
      }
    } catch (err) {
      console.error('Error loading invitations:', err)
      setInvitations([])
    } finally {
      setLoadingInvitations(false)
    }
  }

  const handleAcceptInvitation = async (invitation) => {
    try {
      await api.post(`/orgs/invitations/${invitation.id}/accept`)
      setToastMessage(`Joined ${invitation.organization.name}!`)
      setToastType('success')
      setShowToast(true)
      loadInvitations()
      refreshContext()
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setToastMessage(err.response?.data?.error || 'Failed to accept invitation')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleDeclineInvitation = async (invitation) => {
    try {
      await api.post(`/orgs/invitations/${invitation.id}/decline`)
      setToastMessage('Invitation declined')
      setToastType('success')
      setShowToast(true)
      loadInvitations()
    } catch (err) {
      console.error('Error declining invitation:', err)
      setToastMessage('Failed to decline invitation')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleViewOrg = (org) => {
    navigate(`/manage/org/${org.id}`)
  }

  const handleCreateSuccess = async (newOrg) => {
    await refreshContext()
    setShowCreateModal(false)
  }

  const pendingRequestsCount = joinRequests.length
  const pendingInvitationsCount = invitations.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Organizations
            </h1>
            <p className="text-gray-600">
              Manage your organizations and member requests
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Create Organization
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'organizations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Organizations ({organizations.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium transition-all border-b-2 relative ${
              activeTab === 'requests'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Member Requests ({pendingRequestsCount})
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-6 py-3 font-medium transition-all border-b-2 relative ${
              activeTab === 'invitations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Invitations ({pendingInvitationsCount})
            {pendingInvitationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingInvitationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="text-sm text-gray-500">Loading organizations...</p>
                </div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="glass-card rounded-2xl p-12 max-w-lg text-center">
                  <BuildingIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">No organizations yet</h2>
                  <p className="text-gray-600 mb-8">
                    Create your first organization to start managing tournaments and events
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Your First Organization
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                  <div key={org.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition-all">
                    {/* Org Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md text-white text-xl font-bold">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {org.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          org.myRole === 'OWNER'
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : org.myRole === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {org.myRole === 'OWNER' ? '👑 Owner' : org.myRole === 'ADMIN' ? '⚡ Admin' : '✓ Member'}
                        </span>
                      </div>
                    </div>

                    {/* Tagline */}
                    {org.tagline && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{org.tagline}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4 text-primary-500" />
                        <span>{org.memberCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span>{org.tournamentCount || 0} tournaments</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/manage/org/${org.id}`)}
                        className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all text-sm"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => navigate(`/orgs/${org.slug}`)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
                      >
                        Minisite
                      </button>
                    </div>

                    {/* Edit Minisite Button (for OWNER/ADMIN only) */}
                    {(org.myRole === 'OWNER' || org.myRole === 'ADMIN') && (
                      <button
                        onClick={() => navigate('/orgs/edit')}
                        className="w-full mt-2 px-4 py-2 border-2 border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-600 font-medium rounded-lg transition-all text-sm"
                      >
                        ✏️ Edit Minisite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Member Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="text-sm text-gray-500">Loading requests...</p>
                </div>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="glass-card rounded-2xl p-12 max-w-lg text-center">
                  <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">No pending requests</h2>
                  <p className="text-gray-600">
                    You don't have any pending member requests at the moment
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div key={request.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {request.user.firstName.charAt(0)}{request.user.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {request.user.firstName} {request.user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">{request.user.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Organization</p>
                            <p className="text-sm font-medium text-gray-900">{request.organization.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Applying for</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              request.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {request.role}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Why they want to join</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{request.reason}</p>
                          </div>
                          {request.experience && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Experience</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{request.experience}</p>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-3">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-3 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          className="flex-1 md:w-32 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <CheckIcon className="w-5 h-5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request)}
                          className="flex-1 md:w-32 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <XIcon className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="text-sm text-gray-500">Loading invitations...</p>
                </div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="glass-card rounded-2xl p-12 max-w-lg text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">No invitations</h2>
                  <p className="text-gray-600">
                    You don't have any pending invitations at the moment
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Org Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {invitation.organization.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {invitation.organization.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Invited by {invitation.inviter?.firstName} {invitation.inviter?.lastName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Role:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              invitation.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {invitation.role === 'ADMIN' ? '⚡ Admin' : '✓ Member'}
                            </span>
                          </div>

                          {invitation.message && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-sm font-medium text-blue-900 mb-1">Message:</p>
                              <p className="text-sm text-blue-700 leading-relaxed">{invitation.message}</p>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-3">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()}
                          {invitation.expiresAt && (
                            <span className="ml-2">
                              • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-3 shrink-0">
                        <button
                          onClick={() => handleAcceptInvitation(invitation)}
                          className="flex-1 md:w-32 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <CheckIcon className="w-5 h-5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation)}
                          className="flex-1 md:w-32 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <XIcon className="w-5 h-5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

export default ManagePage
