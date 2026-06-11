import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import OrganizationCard from '../components/OrganizationCard'
import CreateOrganizationModal from '../components/CreateOrganizationModal'
import { useNavigate } from 'react-router-dom'

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

const ManagePage = () => {
  const { context, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    // Set organizations from context
    setOrganizations(context?.orgs || [])
    setLoading(false)
  }, [context])

  const handleViewOrg = (org) => {
    navigate(`/manage/org/${org.id}`)
  }

  const handleCreateSuccess = async (newOrg) => {
    await refreshContext()
    setShowCreateModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Organizations
            </h1>
            <p className="text-gray-600">
              View and manage your tournaments, events, and teams
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
      </main>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default ManagePage
