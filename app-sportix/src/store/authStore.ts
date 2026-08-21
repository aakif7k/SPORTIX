/**
 * src/store/authStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication & profile state. Single source of truth for the current user.
 * Session is persisted via expo-secure-store (see secureSession.ts).
 */
import { create } from 'zustand';
import { AuthUser, UserProfile } from '../types';

interface AuthState {
  /** Appwrite auth user (id, email, name) */
  authUser:   AuthUser | null;
  /** Full profile document from the `profiles` collection */
  profile:    UserProfile | null;
  loading:    boolean;
  /** Derived: true only when profile.is_onboarding_complete === true */
  isOnboardingComplete: boolean;

  setAuthUser:  (user: AuthUser | null) => void;
  setProfile:   (profile: UserProfile | null) => void;
  setLoading:   (loading: boolean) => void;
  updateProfile:(data: Partial<UserProfile>) => void;
  clearAuth:    () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser:             null,
  profile:              null,
  loading:              true,
  isOnboardingComplete: false,

  setAuthUser: (authUser) => set({ authUser }),

  setProfile: (profile) =>
    set({
      profile,
      isOnboardingComplete: profile?.is_onboarding_complete ?? false,
    }),

  setLoading: (loading) => set({ loading }),

  updateProfile: (data) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...data };
    set({
      profile:              updated,
      isOnboardingComplete: updated.is_onboarding_complete,
    });
  },

  clearAuth: () =>
    set({
      authUser:             null,
      profile:              null,
      isOnboardingComplete: false,
    }),
}));
