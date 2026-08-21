/**
 * PulseCenterTabButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Futuristic animated center circular button for SPORTiX Mobile.
 * Features:
 * - Concentric electric neon shockwave waves
 * - High-voltage SportiX Pulse Logo with dynamic reactive glow
 * - Tactile heavy haptic feedback on press
 */

import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  focused: boolean;
  onPress: () => void;
}

export const PulseCenterTabButton: React.FC<Props> = ({ focused, onPress }) => {
  const pulseScale1 = useSharedValue(1);
  const pulseOpacity1 = useSharedValue(0.7);

  const pulseScale2 = useSharedValue(1);
  const pulseOpacity2 = useSharedValue(0.4);

  useEffect(() => {
    // Primary shockwave
    pulseScale1.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity1.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(0.7, { duration: 0 })
      ),
      -1,
      false
    );

    // Secondary delayed shockwave
    setTimeout(() => {
      pulseScale2.value = withRepeat(
        withSequence(
          withTiming(1.65, { duration: 2200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 0 })
        ),
        -1,
        false
      );
      pulseOpacity2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2200, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 0 })
        ),
        -1,
        false
      );
    }, 400);
  }, []);

  const animatedWave1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale1.value }],
    opacity: pulseOpacity1.value,
  }));

  const animatedWave2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale2.value }],
    opacity: pulseOpacity2.value,
  }));

  const handlePress = () => {
    triggerHaptic('heavy');
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.container}
    >
      {/* Outer Neon Shockwave Rings */}
      <Animated.View style={[styles.pulseWaveOuter, animatedWave2]} />
      <Animated.View style={[styles.pulseWaveInner, animatedWave1]} />

      {/* Center Elevated Sphere */}
      <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
        <View style={styles.innerGlow}>
          <Zap size={24} color="#000" strokeWidth={3} fill="#000" />
        </View>
      </View>
      <Text style={[styles.pulseLabel, focused && styles.pulseLabelActive]}>PULSE</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: Platform.OS === 'ios' ? -18 : -14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
    height: 68,
  },
  pulseWaveOuter: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 212, 255, 0.25)',
  },
  pulseWaveInner: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(204, 255, 0, 0.45)',
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#000000',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
  centerButtonActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#00D4FF',
    shadowColor: '#00D4FF',
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  innerGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  pulseLabelActive: {
    color: '#CCFF00',
    fontFamily: 'Urbanist_900Black',
  },
});
