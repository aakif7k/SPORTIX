/**
 * src/screens/auth/SignupScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the unified futuristic authentication terminal in Signup mode.
 */

import React from 'react';
import { LoginScreen } from './LoginScreen';

export function SignupScreen(props: any) {
  return <LoginScreen {...props} route={{ ...props.route, params: { mode: 'signup' } }} />;
}
