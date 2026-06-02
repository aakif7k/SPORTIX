import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CareerStatCardProps {
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  index?: number;
}

export const CareerStatCard: React.FC<CareerStatCardProps> = ({
  icon,
  value,
  label,
  trend,
  trendUp = true,
  color = 'var(--accent)',
  index = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35 }}
    className="rounded-[16px] p-5 space-y-2"
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
    }}
  >
    <div className="flex items-start justify-between">
      <span className="text-2xl leading-none">{icon}</span>
      {trend && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold"
          style={{
            background: trendUp ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
            color: trendUp ? '#4ADE80' : '#F87171',
            border: `1px solid ${trendUp ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend}
        </div>
      )}
    </div>

    <div
      className="font-display text-[42px] leading-none"
      style={{ color }}
    >
      {value}
    </div>

    <div className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)]">
      {label}
    </div>
  </motion.div>
);
