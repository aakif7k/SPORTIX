import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import type { PerformanceSport } from '../../types/performance.types';

interface PerformanceRadarProps {
  sport?: PerformanceSport;
  data?: Record<string, number>;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_DATA: Record<PerformanceSport, Array<{ subject: string; A: number }>> = {
  football: [
    { subject: 'Goals',     A: 72 },
    { subject: 'Assists',   A: 65 },
    { subject: 'Passing',   A: 80 },
    { subject: 'Defending', A: 55 },
    { subject: 'Rating',    A: 78 },
  ],
  cricket: [
    { subject: 'Batting',     A: 74 },
    { subject: 'Bowling',     A: 60 },
    { subject: 'Fielding',    A: 70 },
    { subject: 'Consistency', A: 82 },
    { subject: 'Impact',      A: 75 },
  ],
  basketball: [
    { subject: 'Scoring',     A: 80 },
    { subject: 'Playmaking',  A: 70 },
    { subject: 'Rebounding',  A: 65 },
    { subject: 'Defense',     A: 60 },
    { subject: 'Rating',      A: 75 },
  ],
  running: [
    { subject: 'Pace',      A: 78 },
    { subject: 'Endurance', A: 85 },
    { subject: 'Finish',    A: 72 },
    { subject: 'PB Rate',   A: 60 },
    { subject: 'Placement', A: 68 },
  ],
  generic: [
    { subject: 'Performance', A: 70 },
    { subject: 'Teamwork',    A: 75 },
    { subject: 'Impact',      A: 68 },
    { subject: 'Consistency', A: 72 },
    { subject: 'Leadership',  A: 65 },
  ],
};

const HEIGHT_MAP = { sm: 160, md: 220, lg: 300 };

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({
  sport = 'football',
  data,
  size = 'md',
}) => {
  const chartData = data
    ? Object.entries(data).map(([subject, A]) => ({ subject, A }))
    : DEFAULT_DATA[sport] ?? DEFAULT_DATA.generic;

  return (
    <ResponsiveContainer width="100%" height={HEIGHT_MAP[size]}>
      <RadarChart data={chartData} cx="50%" cy="50%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Mono' }}
        />
        <Radar
          dataKey="A"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: 'var(--accent)', r: 4 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
