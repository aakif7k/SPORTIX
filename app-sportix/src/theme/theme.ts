import { useColorScheme } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  elevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSurface: string;
  accentText: string;
  volt: string;
  cyan: string;
  hot: string;
  success: string;
  danger: string;
}

export const darkColors: ThemeColors = {
  background: '#060606',
  surface: '#101010',
  card: '#181818',
  elevated: '#202020',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  accent: '#CCFF00',
  accentSurface: 'rgba(204, 255, 0, 0.10)',
  accentText: '#CCFF00',
  volt: '#CCFF00',
  cyan: '#00D4FF',
  hot: '#FF3B00',
  success: '#22C55E',
  danger: '#EF4444',
};

export const lightColors: ThemeColors = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#15803D',
  accentSurface: '#DCFCE7',
  accentText: '#15803D',
  volt: '#15803D',
  cyan: '#0284C7',
  hot: '#C22700',
  success: '#16A34A',
  danger: '#DC2626',
};

export function getThemeColors(mode: ThemeMode, systemScheme?: 'light' | 'dark' | null): ThemeColors {
  if (mode === 'light') return lightColors;
  if (mode === 'dark') return darkColors;
  return systemScheme === 'light' ? lightColors : darkColors;
}
