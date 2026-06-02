import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

interface RatingSliderProps {
  value: number;
  onChange: (val: number) => void;
}

function getRatingColor(val: number): string {
  if (val <= 3) return '#F87171';
  if (val <= 6) return '#FBBF24';
  return '#CCFF00';
}

export const RatingSlider: React.FC<RatingSliderProps> = ({ value, onChange }) => {
  const color = getRatingColor(value);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)]">
          MATCH RATING
        </span>
        <motion.span
          key={value}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="font-display text-[42px] leading-none"
          style={{ color }}
        >
          {value}
          <span className="text-[18px] text-[var(--text-muted)]">/10</span>
        </motion.span>
      </div>

      {/* Custom slider */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div
          className="absolute inset-x-0 h-[6px] rounded-full"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        />
        {/* Fill */}
        <div
          className="absolute left-0 h-[6px] rounded-full transition-[width] duration-50"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
        {/* Range input */}
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={handleInput}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 10 }}
        />
        {/* Thumb visual */}
        <div
          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg pointer-events-none transition-[left] duration-50"
          style={{
            left: `calc(${pct}% - 12px)`,
            background: color,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between font-mono text-[11px] text-[var(--text-muted)]">
        <span>1 — Poor</span>
        <span>10 — Perfect</span>
      </div>
    </div>
  );
};
