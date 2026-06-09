import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import CTACard from '../components/CTACard'
import OrganizationCard from '../components/OrganizationCard'

const DashboardPage = () => {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock data - replace with actual API call
      setOrganizations([])
      setLoading(false)
    }, 500)
  }, [])

  const handleCreateOrganization = () => {
    // TODO: Open create organization modal
    alert('Create Organization modal - To be implemented')
  }

  const handleCreateTournament = () => {
    // TODO: Open create tournament modal
    alert('Create Tournament modal - To be implemented')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  // First-time user - No organizations
  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome, {user?.firstName}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Let's get started by creating your first organization.
            </p>
          </div>

          {/* Primary CTA - Create Organization */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 animate-slide-up">
            <div className="md:col-span-2">
              <CTACard
                icon="🏢"
                title="Create Your Organization"
                description="Start by setting up your organization. This will be the home for all your tournaments, teams, and events."
                buttonText="Create Organization"
                onClick={handleCreateOrganization}
                variant="primary"
              />
            </div>
            <div>
              <CTACard
                icon="📚"
                title="Learn More"
                description="New to tournament management? Check out our quick start guide."
                buttonText="View Guide"
                onClick={() => alert('Guide - To be implemented')}
                variant="secondary"
              />
            </div>
          </div>

          {/* How It Works */}
          <div className="glass-card rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '1',
                  icon: '🏢',
                  title: 'Create Organization',
                  description: 'Set up your sports organization or club'
                },
                {
                  step: '2',
                  icon: '🏆',
                  title: 'Setup Tournament',
                  description: 'Create tournaments with custom formats'
                },
                {
                  step: '3',
                  icon: '📝',
                  title: 'Manage Registration',
                  description: 'Accept and manage player registrations'
                },
                {
                  step: '4',
                  icon: '🎯',
                  title: 'Run Events',
                  description: 'Generate brackets and schedule matches'
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-indigo-600 font-bold">{item.step}</span>
                  </div>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Do</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Quick Setup',
                  description: 'Get your tournaments running in minutes'
                },
                {
                  icon: '🎨',
                  title: 'Flexible Formats',
                  description: 'Singles, doubles, and mixed doubles support'
                },
                {
                  icon: '📊',
                  title: 'Real-time Updates',
                  description: 'Live bracket updates and match results'
                },
                {
                  icon: '📱',
                  title: 'Mobile Ready',
                  description: 'Manage tournaments from any device'
                },
                {
                  icon: '👥',
                  title: 'Team Management',
                  description: 'Organize players and teams efficiently'
                },
                {
                  icon: '🔔',
                  title: 'Notifications',
                  description: 'Keep everyone informed automatically'
                },
              ].map((feature, index) => (
                <div key={index} className="glass-card rounded-xl p-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // User has organizations - Show dashboard with stats
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-gray-600">Here's what's happening with your tournaments</p>
          </div>
          <button
            onClick={handleCreateTournament}
            className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>New Tournament</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon="🏢" label="Organizations" value={organizations.length} />
          <StatCard icon="🏆" label="Active Tournaments" value="0" />
          <StatCard icon="👥" label="Total Players" value="0" />
          <StatCard icon="📅" label="Upcoming Matches" value="0" />
        </div>

        {/* Organizations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Organizations</h2>
            <button
              onClick={handleCreateOrganization}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              + New Organization
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onClick={() => alert(`View ${org.name} - To be implemented`)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Tournament</p>
                <p className="text-xs text-gray-600">Start a new tournament</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Team</p>
                <p className="text-xs text-gray-600">Register a new team</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Schedule Match</p>
                <p className="text-xs text-gray-600">Set up a match time</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
