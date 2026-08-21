/**
 * src/theme/ThemeContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Context for theme (dark/light/system). Persists to SecureStore.
 * Use the `useTheme()` hook everywhere — never access theme colors directly.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import { darkColors, lightColors, ThemeColors, ThemeMode } from './theme';
import { saveThemeMode, getThemeMode } from '../utils/secureSession';

interface ThemeContextValue {
  mode:           ThemeMode;
  colors:         ThemeColors;
  isDark:         boolean;
  reducedMotion:  boolean;
  setMode:        (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode:          'dark',
  colors:        darkColors,
  isDark:        true,
  reducedMotion: false,
  setMode:       async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    getThemeMode().then(saved => setModeState(saved));
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  const resolvedDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme === 'dark';

  const colors = resolvedDark ? darkColors : lightColors;

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await saveThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark: resolvedDark, reducedMotion, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
