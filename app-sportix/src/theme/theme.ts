import { useColorScheme } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  elevated: string;
  hover: string;
  border: string;
  borderGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  accent: string;
  accentHover: string;
  accentSurface: string;
  accentBorder: string;
  accentGlow: string;
  accentText: string;
  volt: string;
  voltDim: string;
  voltMid: string;
  cyan: string;
  cyanDim: string;
  cyanBorder: string;
  cyanGlow: string;
  plasma: string;
  plasmaDim: string;
  hot: string;
  hotDim: string;
  gold: string;
  goldSurface: string;
  goldBorder: string;
  success: string;
  successDim: string;
  warning: string;
  warningDim: string;
  danger: string;
  dangerDim: string;
}

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#080808',
  card: '#0D0D0D',
  elevated: '#141414',
  hover: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.08)',
  borderGlow: 'rgba(204, 255, 0, 0.25)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#64748B',
  textDisabled: '#475569',
  accent: '#CCFF00',
  accentHover: '#D7FF72',
  accentSurface: 'rgba(204, 255, 0, 0.12)',
  accentBorder: 'rgba(204, 255, 0, 0.35)',
  accentGlow: 'rgba(204, 255, 0, 0.45)',
  accentText: '#000000',
  volt: '#CCFF00',
  voltDim: 'rgba(204, 255, 0, 0.08)',
  voltMid: 'rgba(204, 255, 0, 0.25)',
  cyan: '#00D4FF',
  cyanDim: 'rgba(0, 212, 255, 0.08)',
  cyanBorder: 'rgba(0, 212, 255, 0.25)',
  cyanGlow: 'rgba(0, 212, 255, 0.30)',
  plasma: '#BF5FFF',
  plasmaDim: 'rgba(191, 95, 255, 0.08)',
  hot: '#FF3B00',
  hotDim: 'rgba(255, 59, 0, 0.12)',
  gold: '#FFD54A',
  goldSurface: 'rgba(255, 213, 74, 0.08)',
  goldBorder: 'rgba(255, 213, 74, 0.20)',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningDim: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.12)',
};

export const lightColors: ThemeColors = {
  background: '#F3F1EC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FAFAF7',
  hover: '#F1EFE9',
  border: 'rgba(0, 0, 0, 0.08)',
  borderGlow: 'rgba(45, 122, 31, 0.16)',
  textPrimary: '#111111',
  textSecondary: '#5E5E5E',
  textMuted: '#909090',
  textDisabled: '#AAAAAA',
  accent: '#2D7A1F',
  accentHover: '#245F17',
  accentSurface: '#E7F4DD',
  accentBorder: 'rgba(45, 122, 31, 0.16)',
  accentGlow: 'rgba(45, 122, 31, 0.22)',
  accentText: '#FFFFFF',
  volt: '#2D7A1F',
  voltDim: 'rgba(45, 122, 31, 0.08)',
  voltMid: 'rgba(45, 122, 31, 0.25)',
  cyan: '#007A9B',
  cyanDim: 'rgba(0, 122, 155, 0.08)',
  cyanBorder: 'rgba(0, 122, 155, 0.16)',
  cyanGlow: 'rgba(0, 122, 155, 0.22)',
  plasma: '#8B2FC9',
  plasmaDim: 'rgba(139, 47, 201, 0.08)',
  hot: '#C22700',
  hotDim: 'rgba(194, 39, 0, 0.12)',
  gold: '#D97706',
  goldSurface: 'rgba(217, 119, 6, 0.08)',
  goldBorder: 'rgba(217, 119, 6, 0.20)',
  success: '#1B5E20',
  successDim: 'rgba(27, 94, 32, 0.08)',
  warning: '#E65100',
  warningDim: 'rgba(230, 81, 0, 0.08)',
  danger: '#C62828',
  dangerDim: 'rgba(198, 40, 40, 0.08)',
};

export function getThemeColors(mode: ThemeMode = 'dark', systemScheme?: 'light' | 'dark' | null): ThemeColors {
  if (mode === 'light') return lightColors;
  if (mode === 'dark') return darkColors;
  return systemScheme === 'light' ? lightColors : darkColors;
}
