/**
 * src/components/ui/StoryRing.tsx
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface StoryRingProps {
  avatarUrl?: string | null;
  hasUnseen?: boolean;
  size?: number;
  onPress?: () => void;
}

export function StoryRing({ avatarUrl, hasUnseen = true, size = 64, onPress }: StoryRingProps) {
  const { colors } = useTheme();
  const innerSize = size - 6;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      <View style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: hasUnseen ? colors.volt : colors.border,
        },
      ]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
          />
        ) : (
          <View style={[
            styles.placeholder,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: colors.surface }
          ]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:   { alignItems: 'center', justifyContent: 'center' },
  ring:        { borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 2 },
  placeholder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
});
