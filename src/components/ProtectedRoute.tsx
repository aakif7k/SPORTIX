import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function LoadingScreen() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px',
    }}>
      <div style={{
        fontFamily: 'Urbanist, sans-serif',
        fontSize: '32px',
        color: '#fff',
        letterSpacing: '4px',
      }}>
        SPORT<span style={{ color: '#CCFF00' }}>iX</span>
      </div>
      <div style={{
        width: '180px', height: '2px',
        background: '#1A2200', borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: '#CCFF00',
          animation: 'loadBar 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loadBar {
          0% { width: 0%; marginLeft: 0% }
          50% { width: 60%; marginLeft: 20% }
          100% { width: 0%; marginLeft: 100% }
        }
      `}</style>
    </div>
  );
}

/** Where a signed-in user belongs. */
const HOME = '/app/feed';

export function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function PublicRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  // Straight to the feed. This used to send users to /home, which is itself only
  // a <Navigate> to /app/feed — two redirects and a wasted render for every
  // signed-in visitor who hit a public route.
  if (isAuthenticated) return <Navigate to={HOME} replace />;
  return <>{children}</>;
}

/**
 * The onboarding step, which needs its own gate.
 *
 * It was wrapped in PublicRoute, which redirects anyone authenticated away — and
 * a user who has just signed up IS authenticated. Onboarding was therefore
 * unreachable: signup pushed you to /onboarding and PublicRoute immediately
 * bounced you to the feed with an incomplete profile.
 *
 * So: sign-in required, but only while onboarding is still outstanding. Once
 * is_onboarding_complete is true the route sends you on, which also stops a user
 * re-running it from the URL.
 */
export function OnboardingRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Absent on a provisional profile, so treat "unknown" as not yet done rather
  // than skipping onboarding for someone whose profile has not loaded.
  const complete = user?.is_onboarding_complete === true;
  if (complete) return <Navigate to={HOME} replace />;

  return <>{children}</>;
}