import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelProgress } from '../../store/gamificationStore';
import { BadgeIcon } from './BadgeIcon';

// ─── ANIMATED SEMICIRCLE PROGRESS ─────────────────────────────────────────────
interface SemiCircleProps {
  pulse: number;
  size?: 'sm' | 'md' | 'lg';
  showLevelUp?: boolean;
}

export const SemiCircleProgress: React.FC<SemiCircleProps> = ({ pulse, size = 'md', showLevelUp = false }) => {
  const { level, percentage, current, required } = getLevelProgress(pulse);
  const [displayPct, setDisplayPct] = useState(0);
  const [levelUpBurst, setLevelUpBurst] = useState(false);
  const prevPct = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayPct(percentage), 100);
    if (percentage < prevPct.current && showLevelUp) setLevelUpBurst(true);
    prevPct.current = percentage;
    return () => clearTimeout(timer);
  }, [percentage, showLevelUp]);

  useEffect(() => {
    if (levelUpBurst) {
      const t = setTimeout(() => setLevelUpBurst(false), 1200);
      return () => clearTimeout(t);
    }
  }, [levelUpBurst]);

  const dims = { sm: 140, md: 200, lg: 260 }[size];
  const stroke = { sm: 8, md: 12, lg: 14 }[size];
  const cx = dims / 2;
  const cy = dims / 2;
  const r = (dims - stroke * 2) / 2;
  // Semi-circle: from 210deg to -30deg (spanning 240deg)
  const startAngle = 210;
  const totalAngle = 240;
  const circumference = 2 * Math.PI * r;
  const arcLength = (totalAngle / 360) * circumference;

  const polarToXY = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const start = polarToXY(startAngle);
  const end = polarToXY(startAngle + totalAngle);
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const dashOffset = arcLength - (displayPct / 100) * arcLength;

  return (
    <div className="relative flex flex-col items-center" style={{ width: dims }}>
      {/* Level Up Burst */}
      <AnimatePresence>
        {levelUpBurst && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${level.color}`, boxShadow: `0 0 30px ${level.color}` }}
          />
        )}
      </AnimatePresence>

      <svg width={dims} height={dims * 0.75} viewBox={`0 0 ${dims} ${dims}`} style={{ overflow: 'visible' }}>
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Glow layer */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke={level.color}
          strokeWidth={stroke + 6}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          opacity={0.15}
          style={{ filter: `blur(4px)` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          animate={{ strokeDashoffset: dashOffset }}
        />
        {/* Main arc */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke={level.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${level.color}80)` }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const angle = startAngle + (pct / 100) * totalAngle;
          const inner = polarToXY(angle);
          const outerR = r + stroke / 2 + 4;
          const outer = {
            x: cx + outerR * Math.cos(((angle - 90) * Math.PI) / 180),
            y: cy + outerR * Math.sin(((angle - 90) * Math.PI) / 180),
          };
          return (
            <line key={pct}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={pct <= displayPct ? level.color : 'rgba(255,255,255,0.1)'}
              strokeWidth={pct === 0 || pct === 100 ? 1.5 : 1}
              opacity={0.7}
            />
          );
        })}
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '15%' }}>
        <motion.div
          key={level.level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center flex flex-col items-center justify-center"
        >
          <div className="mb-1">
            <BadgeIcon level={level.level} size={size === 'lg' ? 68 : size === 'md' ? 52 : 40} />
          </div>
          <div
            className="font-mono font-black leading-none"
            style={{ fontSize: size === 'lg' ? 36 : size === 'md' ? 26 : 18, color: level.color, textShadow: `0 0 20px ${level.color}60` }}
          >
            {pulse}
          </div>
          <div className="font-label text-[9px] text-text-muted uppercase tracking-widest mt-0.5">PULSE</div>
          <div className="font-display tracking-widest mt-1" style={{ fontSize: size === 'lg' ? 13 : 10, color: level.color }}>
            {level.title}
          </div>
        </motion.div>
      </div>

      {/* Bottom labels */}
      <div className="flex justify-between w-full px-2 -mt-2">
        <span className="font-mono text-[9px] text-text-muted">{current} PTS</span>
        <span className="font-mono text-[9px]" style={{ color: level.color }}>{percentage}%</span>
        <span className="font-mono text-[9px] text-text-muted">{required} PTS</span>
      </div>
    </div>
  );
};

// ─── MINI PULSE WIDGET (for sidebar/feed) ────────────────────────────────────
interface MiniPulseWidgetProps {
  pulse: number;
  onClick?: () => void;
}

export const MiniPulseWidget: React.FC<MiniPulseWidgetProps> = ({ pulse, onClick }) => {
  const { level, percentage, remaining } = getLevelProgress(pulse);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full glass rounded-xl p-3 border border-border-muted hover:border-volt/30 transition-all text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${level.color}10`, border: `1px solid ${level.color}20` }}>
          <BadgeIcon level={level.level} size={28} animate={false} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label text-xs font-semibold text-white">LVL {level.level} · {level.title}</span>
            <span className="font-mono text-[10px]" style={{ color: level.color }}>{pulse} PTS</span>
          </div>
          <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color, boxShadow: `0 0 8px ${level.color}60` }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px] text-text-muted">{remaining} pts to next level</span>
            <span className="font-mono text-[9px] text-text-muted">{percentage}%</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ─── LEVEL BADGE ─────────────────────────────────────────────────────────────
export const LevelBadge: React.FC<{ pulse: number; size?: 'sm' | 'md' }> = ({ pulse, size = 'md' }) => {
  const { level } = getLevelProgress(pulse);
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono font-bold uppercase tracking-widest ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'}`}
      style={{ background: `${level.color}15`, border: `1px solid ${level.color}30`, color: level.color }}
    >
      <BadgeIcon level={level.level} size={size === 'sm' ? 14 : 18} animate={false} glow={false} />
      <span>LVL {level.level} · {level.title}</span>
    </div>
  );
};
