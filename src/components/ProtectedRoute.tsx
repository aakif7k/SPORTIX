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
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <>{children}</>;
}