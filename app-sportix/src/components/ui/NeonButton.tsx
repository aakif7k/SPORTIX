/**
 * src/components/ui/NeonButton.tsx
 * Animated neon glow button with Reanimated 4 pulse effect.
 */
import React, { useCallback } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface NeonButtonProps {
  label:       string;
  onPress:     () => void;
  loading?:    boolean;
  disabled?:   boolean;
  variant?:    'volt' | 'cyan' | 'plasma' | 'ghost';
  size?:       'sm' | 'md' | 'lg';
  fullWidth?:  boolean;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
}

export function NeonButton({
  label, onPress, loading, disabled, variant = 'volt', size = 'md', fullWidth, style, textStyle,
}: NeonButtonProps) {
  const { colors, reducedMotion } = useTheme();
  const scale = useSharedValue(1);
  const glow  = useSharedValue(0.35);

  const accentColor =
    variant === 'cyan'   ? colors.cyan   :
    variant === 'plasma' ? colors.plasma :
    variant === 'ghost'  ? 'transparent' :
    colors.volt;

  const textColor =
    variant === 'ghost' ? colors.volt :
    variant === 'volt'  ? '#000000'   : '#FFFFFF';

  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    if (!reducedMotion) {
      scale.value = withSequence(withSpring(0.94), withSpring(1));
      glow.value  = withSequence(withTiming(0.7, { duration: 80 }), withTiming(0.35, { duration: 300 }));
    }
    onPress();
  }, [loading, disabled, onPress, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <Pressable onPress={handlePress} disabled={disabled || loading} style={fullWidth ? { width: '100%' } : {}}>
      <Animated.View style={[
        styles.base,
        {
          height,
          backgroundColor:  variant === 'ghost' ? 'transparent' : accentColor,
          borderColor:      accentColor,
          borderWidth:      variant === 'ghost' ? 1.5 : 0,
          shadowColor:      accentColor,
          shadowOffset:     { width: 0, height: 0 },
          shadowRadius:     16,
          elevation:        8,
          opacity:          (disabled || loading) ? 0.5 : 1,
        },
        fullWidth && { width: '100%' },
        animStyle,
        style,
      ]}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text style={[styles.label, { color: textColor, fontSize, fontFamily: 'Urbanist_700Bold' }, textStyle]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    letterSpacing: 0.4,
  },
});
