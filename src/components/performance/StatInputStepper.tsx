import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface StatInputStepperProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const StatInputStepper: React.FC<StatInputStepperProps> = ({
  label,
  emoji,
  value,
  onChange,
  min = 0,
  max = 100,
}) => {
  const handleMinus = () => { if (value > min) onChange(value - 1); };
  const handlePlus  = () => { if (value < max) onChange(value + 1); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      {/* Label */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="text-xl leading-none flex-shrink-0">{emoji}</span>
        <span className="font-condensed font-semibold text-[15px] text-[var(--text-primary)] truncate">
          {label}
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleMinus}
          disabled={value <= min}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{
            background: value <= min ? 'var(--bg-elevated)' : 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: value <= min ? 'var(--text-disabled)' : 'var(--text-primary)',
          }}
        >
          <Minus size={14} />
        </motion.button>

        <motion.div
          key={value}
          initial={{ scale: 1.18, color: '#CCFF00' }}
          animate={{ scale: 1, color: 'var(--accent)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-10 text-center font-display text-[28px] leading-none select-none"
          style={{ color: 'var(--accent)' }}
        >
          {value}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handlePlus}
          disabled={value >= max}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{
            background: value >= max ? 'var(--bg-elevated)' : 'rgba(204,255,0,0.12)',
            border: '1px solid var(--accent)',
            color: value >= max ? 'var(--text-disabled)' : 'var(--accent)',
          }}
        >
          <Plus size={14} />
        </motion.button>
      </div>
    </div>
  );
};
