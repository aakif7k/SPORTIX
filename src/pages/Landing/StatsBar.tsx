import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';

/* ─── Types ──────────────────────────────────────────────── */
interface StatItem {
  rawValue: number;
  prefix?: string;
  suffix: string;
  label: string;
  decimals?: number;
}

/* ─── Stat Definitions ───────────────────────────────────── */
const STATS: StatItem[] = [
  { rawValue: 24800, suffix: '+', label: 'Athletes Worldwide' },
  { rawValue: 1200, suffix: '+', label: 'Events Hosted' },
  { rawValue: 89, suffix: '%', label: 'Squad Match Rate' },
  { rawValue: 4.2, suffix: 'M+', label: 'Pulse Points Awarded', decimals: 1 },
  { rawValue: 340, suffix: '+', label: 'Cities Covered' },
];

/* ─── Easing ─────────────────────────────────────────────── */
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/* ─── useCountUp Hook ────────────────────────────────────── */
function useCountUp(
  target: number,
  duration: number,
  triggered: boolean,
  decimals = 0
): string {
  const [display, setDisplay] = useState('0');
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const current = eased * target;
      setDisplay(
        decimals > 0
          ? current.toFixed(decimals)
          : Math.floor(current).toLocaleString()
      );
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [target, duration, decimals]
  );

  useEffect(() => {
    if (!triggered) return;
    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [triggered, animate]);

  return display;
}

/* ─── Single Stat ────────────────────────────────────────── */
interface StatCellProps {
  stat: StatItem;
  triggered: boolean;
  index: number;
}

const StatCell: React.FC<StatCellProps> = ({ stat, triggered, index }) => {
  const count = useCountUp(stat.rawValue, 2000, triggered, stat.decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={triggered ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.25, 0, 0.25, 1] as any }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '0 16px',
        flex: '1 1 0',
        minWidth: '140px',
      }}
    >
      {/* Number */}
      <div
        style={{
          fontFamily: "'Urbanist', sans-serif",
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 800,
          lineHeight: 1,
          color: '#CCFF00',
          letterSpacing: '0.02em',
          textShadow: '0 0 30px rgba(204,255,0,0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        {stat.prefix ?? ''}{count}{stat.suffix}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "'Urbanist', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#888888',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {stat.label}
      </div>
    </motion.div>
  );
};

/* ─── Divider ────────────────────────────────────────────── */
const Divider: React.FC = () => (
  <div
    style={{
      width: '1px',
      height: '40px',
      background: 'rgba(204,255,0,0.1)',
      flexShrink: 0,
      alignSelf: 'center',
    }}
  />
);

/* ─── StatsBar ───────────────────────────────────────────── */
const StatsBar: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      style={{
        width: '100%',
        backgroundColor: '#111111',
        borderTop: '1px solid #1E1E1E',
        borderBottom: '1px solid #1E1E1E',
        paddingTop: '40px',
        paddingBottom: '40px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Desktop: flex row with dividers */}
        <div className="hidden sm:flex" style={{ alignItems: 'center' }}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <StatCell stat={stat} triggered={isInView} index={i} />
              {i < STATS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: 2-col then 1-col grid */}
        <div className="flex sm:hidden">
          <MobileGrid stats={STATS} triggered={isInView} />
        </div>
      </div>
    </section>
  );
};

/* ─── Mobile Grid ────────────────────────────────────────── */
interface MobileGridProps {
  stats: StatItem[];
  triggered: boolean;
}

const MobileGrid: React.FC<MobileGridProps> = ({ stats, triggered }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '32px 16px',
      width: '100%',
    }}
  >
    {stats.map((stat, i) => {
      const isLast = i === stats.length - 1;
      const isOdd = stats.length % 2 !== 0;

      return (
        <div
          key={stat.label}
          style={{
            gridColumn: isLast && isOdd ? '1 / -1' : undefined,
          }}
        >
          <StatCell stat={stat} triggered={triggered} index={i} />
        </div>
      );
    })}
  </div>
);

export default StatsBar;
export { StatsBar };
