/**
 * Auth context, types, and the useAuth accessor.
 *
 * The provider component lives in AuthProvider.tsx. Keeping it out of this
 * module means this file exports no components, which is what lets Vite fast
 * refresh work (react-refresh/only-export-components fires on a file that
 * exports a component alongside non-components) — and it keeps the import path
 * `@/context/AuthContext` stable for the 30+ call sites that use useAuth.
 */
import { createContext, useContext } from 'react';

// Appwrite SDK v26+ removed the Models namespace — use inline type
export type AppwriteUser = {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  status: boolean;
  labels: string[];
  prefs: Record<string, unknown>;
  registration: string;
  accessedAt: string;
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string | null;
  role?: string;
  sport?: string;
  level?: number;
  pulse_score?: number;
  /** Gates the /onboarding route. Absent on a provisional profile. */
  is_onboarding_complete?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  appwriteUser: AppwriteUser | null;
  authLoading: boolean;
  /**
   * True when a session exists but its profile could not be fetched. Distinct
   * from "no profile yet": screens should offer a retry rather than render
   * placeholder values as though they were the user's own data.
   */
  profileError: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role: string;
  sport: string;
  sports: string[];
  experienceLevel: string;
  location: string;
  city: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
