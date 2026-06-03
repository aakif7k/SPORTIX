import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { AppLoadingScreen } from './components/layout/AppLoadingScreen';

// Layouts
import { AppLayout } from './layouts/AppLayout';

// Auth Pages
import { LandingPage } from './pages/auth/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

// App Pages
import { HomeFeed } from './pages/feed/HomeFeed';
import { AthleteProfile } from './pages/profile/AthleteProfile';
import { EventBrowse } from './pages/events/EventBrowse';
import { EventDetail } from './pages/events/EventDetail';
import { CreateEvent } from './pages/events/CreateEvent';
import { ManageEventsDashboard } from './pages/events/ManageEventsDashboard';
import { AITeamBuilder } from './pages/events/AITeamBuilder';
import { EventCrewPage } from './pages/events/EventCrewPage';
import { EventDiscussion } from './pages/events/EventDiscussion';
import { ManageEvent } from './pages/events/ManageEvent';
import { MessagesPage } from './pages/messages/MessagesPage';
import { SearchPage } from './pages/discover/SearchPage';
import { NotificationCenter } from './pages/notifications/NotificationCenter';
import { SettingsPage } from './pages/settings/SettingsPage';

// ClashHub Performance Pages
import { MatchReport } from './pages/clashhub/MatchReport';
import { MatchHistory as ClashMatchHistory } from './pages/clashhub/MatchHistory';
import { PerformanceTracker } from './pages/clashhub/PerformanceTracker';

// Pulse Pages
import { PulseLobby } from './pages/pulse/PulseLobby';
import { SquadFormation } from './pages/pulse/SquadFormation';
import { SquadOverview } from './pages/pulse/SquadOverview';
import { SquadAnalytics } from './pages/pulse/SquadAnalytics';
import { SquadChat } from './pages/pulse/SquadChat';
import { MatchHistory } from './pages/pulse/MatchHistory';
import { SquadSettings } from './pages/pulse/SquadSettings';
import { LeadershipApproval } from './pages/pulse/LeadershipApproval';
import { PostMatchReview } from './pages/pulse/PostMatchReview';
import { ChemistryDashboard } from './pages/pulse/ChemistryDashboard';
import { TournamentHub } from './pages/pulse/TournamentHub';

// Auth Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuthStore();
  if (authLoading) return <AppLoadingScreen />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected App */}
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/feed" replace />} />
            <Route path="feed" element={<HomeFeed />} />
            <Route path="profile/:uid" element={<AthleteProfile />} />
            <Route path="events" element={<EventBrowse />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/manage" element={<ManageEventsDashboard />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="events/:id/manage" element={<ManageEvent />} />
            <Route path="events/:id/ai-team" element={<AITeamBuilder />} />
            <Route path="events/:id/crew" element={<EventCrewPage />} />
            <Route path="events/:id/discussion" element={<EventDiscussion />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="discover" element={<SearchPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* ── ClashHub Performance Tracking ── */}
            <Route path="clashhub/report/:matchId" element={<MatchReport />} />
            <Route path="clashhub/history" element={<ClashMatchHistory />} />
            <Route path="clashhub/performance" element={<PerformanceTracker />} />
          </Route>

          {/* Protected Pulse */}
          <Route path="/pulse" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<PulseLobby />} />
            <Route path="matchmaking" element={<SquadFormation />} />
            <Route path="squad/:id" element={<SquadOverview />} />
            <Route path="squad/:id/analytics" element={<SquadAnalytics />} />
            <Route path="squad/:id/chat" element={<SquadChat />} />
            <Route path="squad/:id/history" element={<MatchHistory />} />
            <Route path="squad/:id/settings" element={<SquadSettings />} />
            <Route path="leadership" element={<LeadershipApproval />} />
            <Route path="post-match" element={<PostMatchReview />} />
            <Route path="chemistry" element={<ChemistryDashboard />} />
            <Route path="tournaments" element={<TournamentHub />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
