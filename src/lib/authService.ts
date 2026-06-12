import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'athlete' | 'recruiter' | 'coach' | 'organizer';
  sport: string;
  sports: string[];
  experienceLevel: string;
  location: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  sport: string;
  sports: string[];
  experience_level: string;
  location: string;
  avatar_url: string | null;
  bio: string;
  is_open_to_recruit: boolean;
  is_active: boolean;
  is_onboarding_complete: boolean;
  pulse_score: number;
  level: number;
  coins_balance: number;
  login_streak: number;
  created_at: string;
  updated_at: string;
}

/* ─── REGISTER ───────────────────────────────────────────────────────── */
export async function registerUser(data: RegisterData) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        username: data.username,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Signup failed — no user returned.');

  const uid = authData.user.id;

  // 2. Insert profile row in `profiles` table
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: uid,
    uid,
    full_name: data.fullName,
    username: data.username.toLowerCase().trim(),
    email: data.email,
    role: data.role,
    sport: data.sport,
    sports: data.sports,
    experience_level: data.experienceLevel,
    location: data.location,
    avatar_url: null,
    bio: '',
    is_open_to_recruit: false,
    is_active: true,
    is_onboarding_complete: false,
    pulse_score: 100,
    level: 1,
    coins_balance: 0,
    login_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) throw profileError;

  return authData;
}

/* ─── LOGIN ─────────────────────────────────────────────────────────── */
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/* ─── GOOGLE SIGN IN ─────────────────────────────────────────────────── */
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/* ─── SIGN OUT ───────────────────────────────────────────────────────── */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/* ─── FORGOT PASSWORD ────────────────────────────────────────────────── */
export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/* ─── GET USER PROFILE ───────────────────────────────────────────────── */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as UserProfile;
}

/* ─── UPDATE USER PROFILE ────────────────────────────────────────────── */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', uid)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/* ─── CHECK USERNAME AVAILABLE ───────────────────────────────────────── */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

/* ─── GET CURRENT SESSION USER ───────────────────────────────────────── */
export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/* ─── MAP SUPABASE ERROR CODES ───────────────────────────────────────── */
export function getAuthErrorMessage(error: any): string {
  const msg = error?.message || '';
  if (msg.includes('Invalid login credentials')) return 'Email or password is incorrect.';
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  if (msg.includes('User already registered')) return 'An account with this email already exists.';
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  if (msg.includes('Unable to validate email')) return 'Please enter a valid email address.';
  if (msg.includes('Email rate limit')) return 'Too many attempts. Please wait a moment.';
  if (msg.includes('network')) return 'Network error. Check your connection.';
  return error?.message || 'Something went wrong. Please try again.';
}
