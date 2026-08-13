/**
 * src/hooks/useAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin consumer hook that exposes the AuthContext value.
 *
 * Usage:
 *   import { useAuth } from '@/hooks/useAuth';
 *
 * This is the canonical import path going forward. The existing
 *   import { useAuth } from '@/context/AuthContext'
 * also continues to work (it's the same function).
 */

export { useAuth } from '@/context/AuthContext';
export type { AuthStatus, AuthUser } from '@/context/AuthContext';
