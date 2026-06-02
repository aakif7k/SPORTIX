import React from 'react';
import { motion } from 'framer-motion';

interface Segment {
  label: string;
  value: number; // 0 - 100
  color: string;
}

interface ChemistryBarProps {
  segments?: Segment[];
  overallValue?: number;
}

export const ChemistryBar: React.FC<ChemistryBarProps> = ({
  segments,
  overallValue
}) => {
  // Fallback to default segments if none provided
  const items = segments || [
    { label: 'Trust', value: overallValue ? Math.round(overallValue * 1.04) : 91, color: '#4ADE80' },
    { label: 'Coordination', value: overallValue ? Math.round(overallValue * 0.9) : 78, color: '#CCFF00' },
    { label: 'Communication', value: overallValue ? Math.round(overallValue * 0.95) : 83, color: '#60A5FA' }
  ];

  return (
    <div className="w-full space-y-3">
      {/* Labels */}
      <div className="flex justify-between items-center text-[11px] font-mono text-text-secondary">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}: <strong className="text-white">{item.value}%</strong></span>
          </div>
        ))}
      </div>

      {/* Segments Stacked bar */}
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-white/5 gap-[2px]">
        {items.map((item, idx) => {
          // Proportion based on the values
          const totalVal = items.reduce((sum, i) => sum + i.value, 0);
          const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 33.3;

          return (
            <motion.div
              key={idx}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              style={{ backgroundColor: item.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          );
        })}
      </div>
    </div>
  );
};
