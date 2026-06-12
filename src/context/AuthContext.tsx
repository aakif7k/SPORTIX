import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/lib/authService';
import type { User as AppUser } from '@/types';

interface AuthContextType {
  currentUser: SupabaseUser | null;
  session: Session | null;
  authLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  session: null,
  authLoading: true,
  logout: async () => {},
});

function mapProfileToAppUser(profile: any, supabaseUser: SupabaseUser): AppUser {
  return {
    id: supabaseUser.id,
    uid: supabaseUser.id,
    name: profile?.full_name || supabaseUser.user_metadata?.full_name || '',
    username: profile?.username || '',
    email: supabaseUser.email || '',
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    coverImage: profile?.cover_image || 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80',
    role: profile?.role || 'athlete',
    sport: profile?.sport || '',
    sports: profile?.sports || [],
    location: profile?.location || '',
    bio: profile?.bio || '',
    stats: {
      matches: profile?.matches || 0,
      events: profile?.events || 0,
      followers: profile?.followers || 0,
      following: profile?.following || 0,
      wins: profile?.wins || 0,
      losses: profile?.losses || 0,
      rating: profile?.pulse_score || 100,
      yearsExperience: profile?.years_experience || 1,
    },
    experienceLevel: profile?.experience_level || 'amateur',
    achievements: profile?.achievements || [],
    openToRecruit: profile?.is_open_to_recruit || false,
    isOnline: profile?.is_active || true,
    isVerified: profile?.is_verified || false,
    level: profile?.level || 1,
    createdAt: profile?.created_at || new Date().toISOString(),
    performanceData: profile?.performance_data || {
      speed: 0,
      strength: 0,
      endurance: 0,
      agility: 0,
      technique: 0,
      teamwork: 0,
    },
    isOnboardingComplete: profile?.is_onboarding_complete || false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        useAuthStore.getState().setUser(null);
      }
      setAuthLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          useAuthStore.getState().setUser(null);
        }
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(supabaseUser: SupabaseUser) {
    try {
      const profile = await getUserProfile(supabaseUser.id);
      const appUser = mapProfileToAppUser(profile, supabaseUser);
      useAuthStore.getState().setUser(appUser);
    } catch {
      // Profile might not exist yet (during signup flow)
      const appUser = mapProfileToAppUser(null, supabaseUser);
      useAuthStore.getState().setUser(appUser);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    setCurrentUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, session, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
