/**
 * OAuthCallbackPage.tsx
 *
 * Appwrite redirects here after a successful Google OAuth flow.
 * Responsibilities:
 *  1. Wait for AuthContext to detect the new session
 *  2. Check if this Google account already has a profile document via ensureUserProfile()
 *  3a. If onboarding is complete  → go directly to /app/feed
 *  3b. If onboarding is incomplete → go to /onboarding
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { resolvePostAuthDestination } from '@/lib/authService';
import { ensureUserProfile } from '@/services/profileService';
import toast from 'react-hot-toast';

export const OAuthCallbackPage: React.FC = () => {
  const { user, authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    // Refresh auth state in case the session was just created
    refreshUser();
  }, []);

  useEffect(() => {
    if (authLoading || processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      if (!user) {
        // OAuth failed — session not created
        toast.error('Google sign-in failed. Please try again.');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const userProfile = await ensureUserProfile(user);
        const destination = resolvePostAuthDestination(true, userProfile);

        if (destination === 'APP') {
          toast.success(`Welcome back, ${userProfile.full_name || user.name}! ⚡`);
          navigate('/app/feed', { replace: true });
        } else {
          toast.success("Google account verified! Let's set up your PlayerDNA ⚡");
          navigate('/onboarding', { replace: true });
        }
      } catch (err: any) {
        console.error('[OAuthCallbackPage] error:', err);
        navigate('/onboarding', { replace: true });
      }
    };

    handleCallback();
  }, [authLoading, user]);

  // Loading screen while we wait
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
};
