import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';

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
import { AITeamBuilder } from './pages/events/AITeamBuilder';
import { MessagesPage } from './pages/messages/MessagesPage';
import { SearchPage } from './pages/discover/SearchPage';
import { NotificationCenter } from './pages/notifications/NotificationCenter';

// Auth Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
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
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="events/:id/ai-team" element={<AITeamBuilder />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="discover" element={<SearchPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
