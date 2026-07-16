import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import BrowsePage from './pages/BrowsePage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import MatchesPage from './pages/MatchesPage'
import ManagePage from './pages/ManagePage'
import ProfilePage from './pages/ProfilePage'
import OrganizationDetailPage from './pages/OrganizationDetailPage'
import TournamentManagePage from './pages/TournamentManagePage'
// ── New pages ──
import DiscoverPage from './pages/DiscoverPage'
import OrgMiniSitePage from './pages/OrgMiniSitePage'
import EditOrgPage from './pages/EditOrgPage'
import PlayersPage from './pages/PlayersPage'
import OCRTestPage from './pages/OCRTestPage'
import ScorecardPrintPage from './pages/ScorecardPrintPage'
import AcceptSpotPage from './pages/AcceptSpotPage'
import LiveMatchesPage3D from './pages/LiveMatchesPage3D'
import NotificationsPage from './pages/NotificationsPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import TournamentSchedulerPage from './pages/TournamentSchedulerPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />

          {/* Discover – public (works logged out too) */}
          <Route path="/discover" element={<DiscoverPage />} />

          {/* Org mini-site – public */}
          <Route path="/orgs/:id" element={<OrgMiniSitePage />} />

          {/* Players directory – public */}
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:userId" element={<PlayerProfilePage />} />

          {/* Accept standby spot – requires auth */}
          <Route path="/events/:eventId/accept-spot" element={<AcceptSpotPage />} />

          {/* Onboarding – auth required but no onboardingComplete check */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected routes – requires auth + onboardingComplete */}
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
            path="/tournaments/:tournamentId/scheduler"
            element={
              <ProtectedRoute>
                <TournamentSchedulerPage />
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
            path="/live"
            element={
              <ProtectedRoute>
                <LiveMatchesPage3D />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:tournamentId/live"
            element={
              <ProtectedRoute>
                <LiveMatchesPage3D />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          {/* My Organizations (previously /manage) — organizer only */}
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
          <Route
            path="/orgs/edit"
            element={
              <ProtectedRoute>
                <EditOrgPage />
              </ProtectedRoute>
            }
          />

          {/* OCR Test Page */}
          <Route
            path="/test-ocr"
            element={
              <ProtectedRoute>
                <OCRTestPage />
              </ProtectedRoute>
            }
          />

          {/* Scorecard Print Page */}
          <Route
            path="/events/:eventId/scorecards"
            element={
              <ProtectedRoute>
                <ScorecardPrintPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
