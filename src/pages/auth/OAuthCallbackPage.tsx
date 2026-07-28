/**
 * OAuthCallbackPage.tsx
 *
 * Appwrite redirects here after a successful Google OAuth flow.
 * Responsibilities:
 *  1. Wait for AuthContext to detect the new session
 *  2. Check if this Google account already has a profile document
 *  3a. If YES  → go directly to /app/feed
 *  3b. If NO   → create a bare profile document, go to /onboarding
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/authService';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
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
        const existing = await getUserProfile(user.id);

        if (existing && existing.is_onboarding_complete) {
          // Returning Google user with completed onboarding — go straight to feed
          toast.success(`Welcome back, ${existing.full_name || user.name}! ⚡`);
          navigate('/app/feed', { replace: true });
        } else {
          // Brand-new Google user — attempt document creation if possible, then onboard
          try {
            const now = new Date().toISOString();
            await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              user.id,
              {
                full_name:              user.name  || '',
                username:               '',
                email:                  user.email || '',
                role:                   'athlete',
                sport:                  '',
                sports:                 [],
                experience_level:       'amateur',
                location:               '',
                avatar_url:             null,
                bio:                    '',
                is_open_to_recruit:     false,
                is_active:              true,
                is_onboarding_complete: false,
                pulse_score:            100,
                level:                  1,
                coins_balance:          0,
                login_streak:           0,
                created_at:             now,
                updated_at:             now,
              },
            );
          } catch (docErr: any) {
            console.warn('OAuth profile doc creation skipped:', docErr?.message);
          }

          toast.success('Google account verified! Let\'s set up your PlayerDNA ⚡');
          navigate('/onboarding', { replace: true });
        }
      } catch (err: any) {
        console.error('OAuth callback fallback:', err);
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
      <div style={{ fontFamily: 'Urbanist, sans-serif', fontSize: '32px', color: '#fff', letterSpacing: '4px' }}>
        SPORT<span style={{ color: '#CCFF00' }}>iX</span>
      </div>

      {/* Animated volt bar */}
      <div style={{ width: '180px', height: '2px', background: '#1A2200', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#CCFF00', borderRadius: '999px',
          animation: 'loadBar 1.4s ease-in-out infinite',
        }} />
      </div>

      <p style={{ fontFamily: 'Urbanist, sans-serif', fontSize: '11px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase' }}>
        Verifying Google account…
      </p>

      <style>{`
        @keyframes loadBar {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};
