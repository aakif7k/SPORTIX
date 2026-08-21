import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Zap } from 'lucide-react';
import type { DailyReward, Mission, Badge } from '../../types/gamification.types';


// ─── DAILY REWARD CARD ────────────────────────────────────────────────────────
interface RewardCardProps {
  reward: DailyReward;
  onClaim: (day: number) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, onClaim }) => {
  const [burst, setBurst] = useState(false);

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reward.claimed || reward.isLocked || !reward.isToday) return;
    setBurst(true);
    onClaim(reward.day);
    setTimeout(() => setBurst(false), 800);
  };

  const state = reward.claimed ? 'claimed' : reward.isToday && !reward.isLocked ? 'today' : reward.isLocked ? 'locked' : 'available';

  const cardStyle = {
    claimed: 'border-emerald-500/30 bg-emerald-950/10 shadow-sm',
    today: 'border-volt/80 bg-volt/15 shadow-[0_0_25px_rgba(204,255,0,0.25)] ring-1 ring-volt/40',
    locked: 'border-border-muted bg-elevated/20 opacity-60',
    available: 'border-border-muted bg-elevated/30',
  }[state];

  return (
    <motion.div
      whileHover={state !== 'locked' ? { y: -2 } : {}}
      whileTap={state === 'today' ? { scale: 0.97 } : {}}
      onClick={handleClaim}
      className={`relative flex flex-col items-center justify-between gap-2 p-3 rounded-2xl border transition-all flex-shrink-0 min-w-[104px] w-[104px] ${cardStyle}`}
    >
      {/* Day label */}
      <div className={`font-mono text-[10px] font-bold uppercase tracking-widest ${reward.isBonusDay ? 'text-volt font-black' : reward.isToday ? 'text-volt' : 'text-text-muted'}`}>
        {reward.label}
      </div>

      {/* Icon */}
      <div className="relative">
        <AnimatePresence>
          {burst && (
            <motion.div
              key="burst"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-volt/40 pointer-events-none"
            />
          )}
        </AnimatePresence>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl relative ${reward.isBonusDay ? 'bg-volt/20' : reward.claimed ? 'bg-emerald-500/20' : reward.isToday ? 'bg-volt/20' : 'bg-elevated'}`}
          style={reward.isBonusDay ? { boxShadow: '0 0 14px rgba(204,255,0,0.35)' } : {}}>
          {reward.isLocked ? <Lock size={16} className="text-text-muted" /> : reward.icon}
          {reward.claimed && (
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Check size={16} className="text-emerald-400 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Reward value */}
      <div className="text-center w-full">
        <div className={`font-mono font-black text-sm ${reward.claimed ? 'text-emerald-400' : reward.isLocked ? 'text-text-muted' : 'text-volt'}`}>
          +{reward.pulseReward}
        </div>
        {reward.xpBooster && !reward.isLocked && (
          <div className="font-mono text-[9px] text-purple-400 font-bold">{reward.xpBooster}x XP</div>
        )}
        <div className="font-mono text-[9px] text-text-muted uppercase tracking-wider">PULSE</div>
      </div>

      {/* Action / Status Pill */}
      <div className="w-full mt-1">
        {reward.claimed ? (
          <div className="w-full py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-black uppercase text-center flex items-center justify-center gap-1">
            <Check size={10} className="stroke-[3]" />
            <span>COLLECTED</span>
          </div>
        ) : reward.isToday ? (
          <button
            onClick={handleClaim}
            className="w-full py-1.5 rounded-lg bg-volt hover:bg-volt-light text-volt-text font-mono text-[10px] font-black uppercase tracking-wider text-center shadow-[0_0_12px_rgba(204,255,0,0.6)] flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Zap size={10} className="fill-current" />
            <span>COLLECT</span>
          </button>
        ) : (
          <div className="w-full py-1 rounded-lg bg-base/60 border border-border-muted/40 text-text-muted font-mono text-[8px] font-bold uppercase text-center flex items-center justify-center gap-1">
            <Lock size={9} />
            <span>LOCKED</span>
          </div>
        )}
      </div>

      {/* Today pulse indicator badge */}
      {reward.isToday && !reward.claimed && (
        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-volt text-volt-text font-mono text-[8px] font-black uppercase shadow-[0_0_10px_rgba(204,255,0,0.9)] animate-bounce">
          TODAY
        </div>
      )}
      {/* Bonus crown */}
      {reward.isBonusDay && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-[11px] filter drop-shadow">👑</div>
      )}
    </motion.div>
  );
};

// ─── STREAK BANNER ────────────────────────────────────────────────────────────
export const StreakBanner: React.FC<{ streak: number }> = ({ streak }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 p-3 rounded-xl glass border border-orange-500/20"
    style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, transparent 100%)' }}
  >
    <div className="text-2xl">🔥</div>
    <div className="flex-1">
      <div className="font-label text-sm font-semibold text-white">{streak} Day Streak!</div>
      <div className="font-mono text-[10px] text-text-secondary">Keep logging in daily to maintain your bonus</div>
    </div>
    <div className="font-mono text-sm font-bold text-orange-400">+{streak * 5}% XP</div>
  </motion.div>
);

// ─── MISSION CARD ────────────────────────────────────────────────────────────
interface MissionCardProps {
  mission: Mission;
  onClaim: (id: string) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onClaim }) => {
  const pct = Math.round((mission.current / mission.target) * 100);
  const canClaim = mission.completed && !mission.claimed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass rounded-xl p-4 border transition-all ${mission.claimed ? 'border-volt/10 opacity-50' : mission.completed ? 'border-volt/40 shadow-[0_0_16px_rgba(204,255,0,0.08)]' : 'border-border-muted'}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${mission.completed ? 'bg-volt/15' : 'bg-elevated'}`}>
          {mission.claimed ? '✅' : mission.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-label text-sm font-semibold ${mission.claimed ? 'text-text-secondary line-through' : 'text-white'}`}>
              {mission.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Zap size={10} className="text-volt" />
              <span className="font-mono text-[11px] font-bold text-volt">+{mission.reward}</span>
            </div>
          </div>
          <p className="font-label text-[11px] text-text-secondary mt-0.5">{mission.description}</p>

          {/* Progress bar */}
          {!mission.claimed && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between font-mono text-[9px] text-text-muted">
                <span>{mission.current}/{mission.target}</span>
                <span className={mission.completed ? 'text-volt' : ''}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: mission.completed ? '#CCFF00' : 'linear-gradient(90deg, #CCFF00 0%, #88cc00 100%)',
                    boxShadow: mission.completed ? '0 0 8px rgba(204,255,0,0.5)' : 'none',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Claim button */}
        {canClaim && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onClaim(mission.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-label text-xs font-bold text-black transition-all"
            style={{ background: '#CCFF00', boxShadow: '0 0 12px rgba(204,255,0,0.3)' }}
            animate={{ boxShadow: ['0 0 12px rgba(204,255,0,0.3)', '0 0 20px rgba(204,255,0,0.6)', '0 0 12px rgba(204,255,0,0.3)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            CLAIM
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ─── BADGE CARD ────────────────────────────────────────────────────────────
interface BadgeCardProps {
  badge: Badge;
}

const RARITY_STYLE = {
  common:    { label: 'COMMON',    gradient: 'from-gray-500/10 to-gray-600/5',    border: 'border-gray-500/30', text: 'text-gray-400' },
  rare:      { label: 'RARE',      gradient: 'from-blue-500/10 to-blue-600/5',    border: 'border-blue-500/30', text: 'text-blue-400' },
  epic:      { label: 'EPIC',      gradient: 'from-purple-500/10 to-purple-600/5',border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { label: 'LEGENDARY', gradient: 'from-amber-500/10 to-orange-600/5', border: 'border-amber-500/30', text: 'text-amber-400' },
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const rs = RARITY_STYLE[badge.rarity as keyof typeof RARITY_STYLE];
  const pct = badge.maxProgress ? Math.round((badge.progress! / badge.maxProgress) * 100) : 0;

  return (
    <motion.div
      whileHover={badge.unlocked ? { y: -3, scale: 1.02 } : {}}
      className={`relative rounded-xl p-4 border bg-gradient-to-b transition-all ${rs.gradient} ${rs.border} ${!badge.unlocked ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Rarity label */}
      <div className={`absolute top-2 right-2 font-mono text-[8px] font-bold uppercase tracking-widest ${rs.text}`}>
        {rs.label}
      </div>

      {/* Icon + Lock overlay */}
      <div className="relative w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
        style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30`, boxShadow: badge.unlocked ? `0 0 16px ${badge.color}30` : 'none' }}>
        {badge.icon}
        {!badge.unlocked && (
          <div className="absolute inset-0 rounded-2xl bg-base/60 flex items-center justify-center">
            <Lock size={16} className="text-text-muted" />
          </div>
        )}
        {badge.unlocked && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-volt flex items-center justify-center"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Check size={9} className="text-black" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      <div className="text-center">
        <p className={`font-label text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-text-secondary'}`}>
          {badge.title}
        </p>
        <p className="font-label text-[10px] text-text-muted mt-0.5 leading-tight">{badge.description}</p>

        {badge.unlocked && badge.unlockedAt && (
          <p className="font-mono text-[9px] text-text-muted mt-1.5">
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </p>
        )}

        {!badge.unlocked && badge.maxProgress && (
          <div className="mt-2 space-y-1">
            <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: badge.color, width: `${pct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="font-mono text-[9px] text-text-muted">{badge.progress}/{badge.maxProgress}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── MISSION PREVIEW (compact, for feed) ────────────────────────────────────
export const MissionPreview: React.FC<{ missions: Mission[]; max?: number }> = ({ missions, max = 3 }) => {
  const daily = missions.filter(m => m.category === 'daily' && !m.claimed).slice(0, max);
  const completed = daily.filter(m => m.completed).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Daily Missions</span>
        <span className="font-mono text-[10px] text-volt">{completed}/{daily.length} done</span>
      </div>
      {daily.map(m => {
        const pct = Math.round((m.current / m.target) * 100);
        return (
          <div key={m.id} className="flex items-center gap-2">
            <span className="text-base flex-shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="font-label text-[11px] text-white truncate">{m.title}</span>
                <span className="font-mono text-[9px] text-text-muted flex-shrink-0">{m.current}/{m.target}</span>
              </div>
              <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-volt transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
