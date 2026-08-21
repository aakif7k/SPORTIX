/**
 * src/components/ui/ChemistryRadar.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface RadarMetric {
  label: string;
  value: number; // 0 to 100
}

interface ChemistryRadarProps {
  metrics: RadarMetric[];
  size?: number;
}

export function ChemistryRadar({ metrics, size = 180 }: ChemistryRadarProps) {
  const { colors } = useTheme();
  const count = metrics.length || 5;
  const center = size / 2;
  const radius = center - 24;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polyPoints = metrics.map((m, idx) => {
    const { x, y } = getCoordinates(idx, m.value);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Grid Rings */}
        {gridLevels.map((lvl, lIdx) => {
          const ringPoints = Array.from({ length: count }).map((_, idx) => {
            const { x, y } = getCoordinates(idx, lvl * 100);
            return `${x},${y}`;
          }).join(' ');
          return (
            <Polygon
              key={lIdx}
              points={ringPoints}
              stroke={colors.border}
              strokeWidth={1}
              fill="none"
              opacity={0.5}
            />
          );
        })}

        {/* Axis Spokes */}
        {Array.from({ length: count }).map((_, idx) => {
          const { x, y } = getCoordinates(idx, 100);
          return (
            <Line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}

        {/* Data Polygon */}
        <Polygon
          points={polyPoints}
          fill={colors.volt}
          fillOpacity={0.25}
          stroke={colors.volt}
          strokeWidth={2}
        />

        {/* Data Vertices */}
        {metrics.map((m, idx) => {
          const { x, y } = getCoordinates(idx, m.value);
          return (
            <Circle
              key={idx}
              cx={x}
              cy={y}
              r={3.5}
              fill={colors.volt}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
