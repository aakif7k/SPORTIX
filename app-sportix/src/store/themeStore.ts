/**
 * src/store/themeStore.ts
 */
import { create } from 'zustand';
import { ThemeMode } from '../theme/theme';
import { saveThemeMode } from '../utils/secureSession';

interface ThemeState {
  mode:    ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode:    'dark',
  setMode: (mode) => {
    set({ mode });
    saveThemeMode(mode);
  },
}));
