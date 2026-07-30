import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { ReportResult } from '../../types/performance.types';

interface PulseEarnedSummaryProps {
  result: ReportResult;
  onClose: () => void;
}

// Count-up number component
const CountUp: React.FC<{ target: number; suffix?: string; delay?: number }> = ({
  target,
  suffix = '',
  delay = 0,
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 800;
      const steps = 30;
      const step = target / steps;
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setCurrent(Math.min(Math.round(step * i), target));
        if (i >= steps) clearInterval(interval);
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  return <>{current}{suffix}</>;
};

// Burst offsets are computed once at module load. Math.random() during render
// is impure: React may re-render this on any parent update, which re-rolled
// every particle's distance and made the burst jitter mid-animation.
const BURST_PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360;
  const dist  = 60 + Math.random() * 80;
  return {
    x: Math.cos((angle * Math.PI) / 180) * dist,
    y: Math.sin((angle * Math.PI) / 180) * dist,
  };
});

// Particle burst for level-up
const ParticleBurst: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {BURST_PARTICLES.map(({ x, y }, i) => {
      return (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-sm"
          style={{ background: '#CCFF00', transform: 'translate(-50%, -50%)' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x, y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, delay: i * 0.025, ease: 'easeOut' }}
        />
      );
    })}
  </div>
);

// AI terminal processing lines
const TERMINAL_LINES = [
  '> Validating stat submission...',
  '> Calculating Pulse rewards...',
  '> Updating SSR rating...',
  '> Recalculating team chemistry...',
  '> Updating SPORTiX Level...',
  '> Performance logged successfully ✓',
];

export const PulseEarnedSummary: React.FC<PulseEarnedSummaryProps> = ({ result, onClose }) => {
  const navigate = useNavigate();
  const [visibleLines, setVisibleLines] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    // Type in terminal lines
    TERMINAL_LINES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === TERMINAL_LINES.length - 1) {
          setTimeout(() => setShowRewards(true), 400);
          if (result.leveledUp) {
            setTimeout(() => setShowLevelUp(true), 800);
          }
        }
      }, 800 + i * 600);
    });
  }, [result.leveledUp]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(204,255,0,0.08) 0%, #080808 70%)',
      }}
    >
      <div className="w-full max-w-lg space-y-8 py-12">

        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="flex justify-center"
        >
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            <motion.circle
              cx="40" cy="40" r="36"
              fill="none" stroke="#CCFF00" strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M24 40 L36 52 L56 30"
              fill="none" stroke="#CCFF00" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-2"
        >
          <h1 className="font-display text-[52px] leading-none text-white tracking-wider">
            REPORT SUBMITTED
          </h1>
          <p className="font-mono text-[14px] text-[var(--text-muted)]">
            AI is calculating your performance...
          </p>
        </motion.div>

        {/* AI Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-[16px] p-5 font-mono text-[13px] space-y-2"
          style={{ background: '#0A0A0A', border: '1px solid var(--border)' }}
        >
          {TERMINAL_LINES.map((line, i) => (
            <AnimatePresence key={i}>
              {i < visibleLines && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="transition-colors duration-500"
                  style={{ color: i < visibleLines - 1 ? '#3A3A3A' : '#CCFF00' }}
                >
                  {line}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </motion.div>

        {/* Reward cards */}
        <AnimatePresence>
          {showRewards && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              {/* Pulse */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0, type: 'spring', stiffness: 200 }}
                className="rounded-[16px] p-4 text-center space-y-2"
                style={{ background: '#1A2200', border: '1px solid rgba(204,255,0,0.3)' }}
              >
                <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: '#CCFF00' }}>
                  ⚡ PULSE
                </div>
                <div className="font-display text-[56px] leading-none" style={{ color: '#CCFF00' }}>
                  +<CountUp target={result.pulseEarned} delay={200} />
                </div>
              </motion.div>

              {/* SSR */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="rounded-[16px] p-4 text-center space-y-2"
                style={{ background: '#0A0F1F', border: '1px solid rgba(96,165,250,0.3)' }}
              >
                <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                  📊 SSR
                </div>
                <div className="font-display text-[48px] leading-none" style={{ color: '#60A5FA' }}>
                  +{result.ssrDelta}
                </div>
              </motion.div>

              {/* Chemistry */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="rounded-[16px] p-4 text-center space-y-2"
                style={{ background: '#0A1F0A', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: '#4ADE80' }}>
                  🧬 CHEM
                </div>
                <div className="font-display text-[48px] leading-none" style={{ color: '#4ADE80' }}>
                  +{result.chemistryDelta}%
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level-up overlay */}
        <AnimatePresence>
          {showLevelUp && result.leveledUp && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 250 }}
              className="relative rounded-[24px] p-8 text-center space-y-3 overflow-visible"
              style={{
                background: 'linear-gradient(135deg, #1A2200 0%, #0A0A0A 100%)',
                border: '2px solid var(--accent)',
                boxShadow: '0 0 60px rgba(204,255,0,0.25)',
              }}
            >
              <ParticleBurst />
              <div className="font-display text-[64px] leading-none" style={{ color: '#CCFF00' }}>
                LEVEL UP!
              </div>
              <div className="font-condensed font-semibold text-[22px] text-white">
                Level {result.oldLevel} → Level {result.newLevel}
              </div>
              {result.rankUnlocked && (
                <div className="inline-block px-4 py-2 rounded-full font-mono text-[13px] font-bold"
                  style={{ background: 'rgba(204,255,0,0.15)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.3)' }}>
                  🏆 {result.rankUnlocked} UNLOCKED
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTAs */}
        <AnimatePresence>
          {showRewards && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <button
                onClick={() => { onClose(); navigate('/app/clashhub/history'); }}
                className="flex-1 py-3 rounded-[12px] font-mono text-[13px] font-bold transition-all hover:bg-white/5"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                View Match History →
              </button>
              <button
                onClick={() => { onClose(); navigate('/app/events'); }}
                className="flex-1 py-3 rounded-[12px] font-mono text-[13px] font-bold transition-all"
                style={{ background: 'var(--accent)', color: '#080808' }}
              >
                Back to ClashHub →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
