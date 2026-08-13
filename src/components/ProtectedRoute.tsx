/**
 * src/components/ProtectedRoute.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Route guards for SPORTiX.
 *
 * Exports:
 *   ProtectedRoute   — requires auth + completed onboarding. Saves intended
 *                      destination in location.state.from so login can redirect back.
 *   OnboardingRoute  — requires auth; redirects to feed if onboarding already done.
 *   PublicRoute      — redirects authenticated users away from public pages.
 *   PublicOnlyRoute  — alias for PublicRoute (per architecture spec).
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
//  Loading screen
// ─────────────────────────────────────────────────────────────────────────────

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
          0%   { width: 0%;  marginLeft: 0% }
          50%  { width: 60%; marginLeft: 20% }
          100% { width: 0%;  marginLeft: 100% }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ProtectedRoute
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route guard for main app pages (/app/*, /pulse/*).
 *
 * Requires: authenticated + onboarding complete.
 *
 * On failure → saves the intended path in `location.state.from` so the
 * login page can send the user back after they authenticate.
 *
 * profile=null is treated as "onboarding incomplete" — the safe conservative
 * default when the profile load fails or is still pending.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading, profile } = useAuth();
  const location = useLocation();

  if (authLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    // Preserve the intended destination so login can redirect back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // profile=null → onboarding not yet complete (safe default)
  if (!profile || !profile.is_onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  OnboardingRoute
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dedicated guard for /onboarding.
 *
 * Requires: authenticated.
 * If onboarding IS complete → send to /app/feed.
 * If profile is null (not yet loaded) → stay on onboarding.
 */
export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading, profile } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Only redirect to feed when profile is loaded AND onboarding is confirmed done
  if (profile && profile.is_onboarding_complete) {
    return <Navigate to="/app/feed" replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PublicRoute / PublicOnlyRoute
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guard for login / signup / forgot-password pages.
 *
 * Authenticated users are redirected:
 *   → onboarding  if profile=null or onboarding not complete
 *   → location.state.from OR /app/feed  if fully set up
 */
function PublicGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading, profile } = useAuth();
  const location = useLocation();

  if (authLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    if (!profile || !profile.is_onboarding_complete) {
      return <Navigate to="/onboarding" replace />;
    }
    // Return to the page the user originally tried to visit, or fall back to feed
    const from = (location.state as any)?.from as string | undefined;
    return <Navigate to={from || '/app/feed'} replace />;
  }

  return <>{children}</>;
}

/** Original name — kept for backward compatibility with App.tsx */
export const PublicRoute = PublicGuard;

/** New canonical name per architecture spec */
export const PublicOnlyRoute = PublicGuard;