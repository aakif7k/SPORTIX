/**
 * src/components/ui/PulseGauge.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface PulseGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
}

export function PulseGauge({ score, maxScore = 1000, size = 160 }: PulseGaugeProps) {
  const { colors } = useTheme();
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.volt} />
            <Stop offset="100%" stopColor={colors.cyan} />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#pulseGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.innerContent}>
        <Text style={[styles.scoreText, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
          {score}
        </Text>
        <Text style={[styles.labelText, { color: colors.textMuted, fontFamily: 'Urbanist_600SemiBold' }]}>
          PULSE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  svg:          { transform: [{ rotate: '0deg' }] },
  innerContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scoreText:    { fontSize: 36, lineHeight: 40 },
  labelText:    { fontSize: 11, letterSpacing: 1, marginTop: 2 },
});
