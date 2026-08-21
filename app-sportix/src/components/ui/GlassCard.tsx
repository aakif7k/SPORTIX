/**
 * src/components/ui/GlassCard.tsx
 * Glassmorphic card using expo-blur.
 */
import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';

export interface GlassCardProps {
  children:   React.ReactNode;
  style?:     StyleProp<ViewStyle>;
  intensity?: number;
  tint?:      'light' | 'dark' | 'default';
  hasCorners?: boolean;
}

export function GlassCard({ children, style, intensity = 20, tint }: GlassCardProps) {
  const { isDark } = useTheme();
  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');

  return (
    <BlurView
      intensity={intensity}
      tint={resolvedTint}
      style={[styles.card, isDark ? styles.darkBorder : styles.lightBorder, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  darkBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lightBorder: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
});
