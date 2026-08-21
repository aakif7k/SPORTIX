/**
 * src/components/ui/EmptyState.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface EmptyStateProps {
  icon?:       string;
  title:       string;
  subtitle?:   string;
}

export function EmptyState({ icon = '🏟️', title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon:      { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 18, textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
