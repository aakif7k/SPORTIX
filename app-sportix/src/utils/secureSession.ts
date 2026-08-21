/**
 * src/utils/secureSession.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed wrappers around expo-secure-store for session and settings persistence.
 * ALL session data lives here — never AsyncStorage, never plain state on disk.
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  USER_ID:          'sportix_user_id',
  SESSION_ACTIVE:   'sportix_session_active',
  BIOMETRIC_LOCK:   'sportix_biometric_lock',
  THEME_MODE:       'sportix_theme_mode',
  ONBOARDING_DONE:  'sportix_onboarding_done',
} as const;

// ─── Session flag ─────────────────────────────────────────────────────────────
export async function markSessionActive(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.SESSION_ACTIVE, 'true');
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.SESSION_ACTIVE);
  await SecureStore.deleteItemAsync(KEYS.USER_ID);
}

export async function isSessionActive(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEYS.SESSION_ACTIVE);
  return val === 'true';
}

// ─── User ID (for ownership checks) ──────────────────────────────────────────
export async function saveUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_ID, id);
}

export async function getSavedUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.USER_ID);
}

// ─── Biometric lock ───────────────────────────────────────────────────────────
export async function setBiometricLock(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.BIOMETRIC_LOCK, enabled ? 'true' : 'false');
}

export async function getBiometricLock(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEYS.BIOMETRIC_LOCK);
  return val === 'true';
}

// ─── Theme preference ─────────────────────────────────────────────────────────
export async function saveThemeMode(mode: 'dark' | 'light' | 'system'): Promise<void> {
  await SecureStore.setItemAsync(KEYS.THEME_MODE, mode);
}

export async function getThemeMode(): Promise<'dark' | 'light' | 'system'> {
  const val = await SecureStore.getItemAsync(KEYS.THEME_MODE);
  if (val === 'dark' || val === 'light' || val === 'system') return val;
  return 'dark'; // default to dark
}
