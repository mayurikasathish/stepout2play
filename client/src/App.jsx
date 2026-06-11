import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import BrowsePage from './pages/BrowsePage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import MatchesPage from './pages/MatchesPage'
import ManagePage from './pages/ManagePage'
import ProfilePage from './pages/ProfilePage'
import OrganizationDetailPage from './pages/OrganizationDetailPage'
import TournamentManagePage from './pages/TournamentManagePage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />

          {/* Onboarding - auth required but no onboardingComplete check */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected routes - requires auth + onboardingComplete */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/manage"
            element={
              <ProtectedRoute>
                <TournamentManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <ManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage/org/:id"
            element={
              <ProtectedRoute>
                <OrganizationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App