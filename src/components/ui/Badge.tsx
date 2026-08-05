import React from 'react';
import { motion } from 'framer-motion';
import { SPORT_CATEGORIES } from '@/constants/sports';
import type { SportCategory } from '../../types';

// ─── SPORT BADGE ───────────────────────────────────────────────────────────
interface SportBadgeProps { sport: SportCategory; size?: 'sm' | 'md'; }
export const SportBadge: React.FC<SportBadgeProps> = ({ sport, size = 'md' }) => {
  const s = SPORT_CATEGORIES.find(c => c.id === sport);
  const padClass = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-xs gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-label font-medium ${padClass}`}
      style={{ background: `${s?.color}18`, border: `1px solid ${s?.color}40`, color: s?.color }}>
      <span>{s?.emoji}</span>
      <span>{s?.label || sport}</span>
    </span>
  );
};

// ─── AI BADGE ──────────────────────────────────────────────────────────────
export const AIBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-label font-medium
    bg-purple-900/30 border border-purple-500/30 text-purple-300 shadow-glow-purple ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-blink-dot" />
    ⚡ AI Matched
  </span>
);

// ─── LIVE INDICATOR ────────────────────────────────────────────────────────
export const LiveIndicator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-label font-semibold
    bg-hot/10 border border-hot/30 text-hot ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-hot animate-ping-slow" />
    LIVE
  </span>
);

// ─── ROLE BADGE ────────────────────────────────────────────────────────────
type BadgeVariant = 'volt' | 'orange' | 'purple' | 'blue' | 'gray';
interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; }
const variantMap: Record<BadgeVariant, string> = {
  volt: 'bg-volt/10 border-volt/30 text-volt',
  orange: 'bg-hot/10 border-hot/30 text-hot',
  purple: 'bg-purple-900/30 border-purple-500/30 text-purple-300',
  blue: 'bg-blue-900/30 border-blue-500/30 text-blue-300',
  gray: 'bg-white/5 border-white/10 text-text-secondary',
};
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-label font-medium border ${variantMap[variant]} ${className}`}>
    {children}
  </span>
);

// ─── RARITY BADGE ─────────────────────────────────────────────────────────
const rarityMap = { common: 'gray', rare: 'blue', epic: 'purple', legendary: 'volt' } as const;
export const RarityBadge: React.FC<{ rarity: 'common' | 'rare' | 'epic' | 'legendary' }> = ({ rarity }) => (
  <Badge variant={rarityMap[rarity]}>{rarity.toUpperCase()}</Badge>
);

// ─── VERIFIED CHECK ────────────────────────────────────────────────────────
export const VerifiedBadge: React.FC = () => (
  <motion.span whileHover={{ scale: 1.1 }} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-volt text-black text-xs font-bold">✓</motion.span>
);
