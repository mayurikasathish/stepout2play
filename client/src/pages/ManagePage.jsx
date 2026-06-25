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
  const [activeTab, setActiveTab] = useState('organizations') // organizations | requests
  const [joinRequests, setJoinRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  useEffect(() => {
    setOrganizations(context?.orgs || [])
    setLoading(false)
    loadJoinRequests()
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

  const handleViewOrg = (org) => {
    navigate(`/manage/org/${org.id}`)
  }

  const handleCreateSuccess = async (newOrg) => {
    await refreshContext()
    setShowCreateModal(false)
  }

  const pendingRequestsCount = joinRequests.length

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
                  <OrganizationCard
                    key={org.id}
                    organization={org}
                    onClick={() => handleViewOrg(org)}
                  />
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
