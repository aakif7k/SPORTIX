import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Gift, Target, Check, Lock, Trophy, ArrowRight, Star, History, Activity } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useCareerStats } from '../../hooks/useCareerStats';
import { useMatchReportStore } from '../../store/matchReportStore';

// ─── Daily Rewards Panel ─────────────────────────────────────────────────────
const DailyRewardsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { dailyRewards, missions, claimDailyReward } = useGamificationStore();
  const todayReward = dailyRewards.find(r => r.isToday);
  const activeMissions = missions.filter(m => !m.completed).slice(0, 3);

  return (
    <div className="space-y-4">

      {/* Daily Rewards */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,213,74,0.12)', border: '1px solid rgba(255,213,74,0.25)' }}>
            <Gift size={12} style={{ color: '#FFD700' }} />
          </div>
          <span className="font-display text-[14px] tracking-widest" style={{ color: 'var(--text-primary)' }}>DAILY REWARDS</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {dailyRewards.slice(0, 7).map((reward) => (
            <motion.div key={reward.day} whileHover={{ scale: 1.05 }}
              onClick={() => reward.isToday && !reward.claimed ? claimDailyReward(reward.day) : null}
              className="flex flex-col items-center gap-1 p-2 rounded-[12px] cursor-pointer relative overflow-hidden"
              style={{
                background: reward.claimed ? 'var(--accent-surface)' : reward.isToday ? 'rgba(255,213,74,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${reward.claimed ? 'var(--accent-border)' : reward.isToday ? 'rgba(255,213,74,0.3)' : 'var(--border)'}`,
              }}>
              {reward.claimed ? (
                <Check size={14} style={{ color: 'var(--accent-text)' }} />
              ) : reward.isToday ? (
                <span className="text-lg">{reward.icon}</span>
              ) : reward.day > (todayReward?.day ?? 0) ? (
                <Lock size={12} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <span className="text-sm">{reward.icon}</span>
              )}
              <span className="font-mono text-[8px]" style={{ color: reward.claimed ? 'var(--accent-text)' : 'var(--text-muted)' }}>D{reward.day}</span>
            </motion.div>
          ))}
          {/* 8th slot = tomorrow preview */}
          <div className="flex flex-col items-center gap-1 p-2 rounded-[12px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Star size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="font-mono text-[8px]" style={{ color: 'var(--text-muted)' }}>D8</span>
          </div>
        </div>
        {todayReward && !todayReward.claimed && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => claimDailyReward(todayReward.day)}
            className="w-full py-2.5 rounded-[12px] font-display text-[13px] tracking-wide flex items-center justify-center gap-2"
            style={{ background: '#FFD700', color: '#000', boxShadow: '0 4px 14px rgba(255,213,74,0.35)' }}>
            <Gift size={14} /> Claim Day {todayReward.day}
          </motion.button>
        )}
        {(!todayReward || todayReward.claimed || dailyRewards.every(r => r.claimed || r.isLocked)) && (
          <div className="w-full py-2.5 rounded-[12px] font-mono text-[10px] text-center flex items-center justify-center gap-1.5" style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
            <Lock size={12} /> Claimed today · Next reward unlocks at 12:00 AM
          </div>
        )}
      </div>

      {/* Active Missions */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(191,95,255,0.12)', border: '1px solid rgba(191,95,255,0.25)' }}>
              <Target size={12} style={{ color: '#BF5FFF' }} />
            </div>
            <span className="font-display text-[14px] tracking-widest" style={{ color: 'var(--text-primary)' }}>MISSIONS</span>
          </div>
          <button onClick={() => navigate('/pulse')} className="font-mono text-[9px] flex items-center gap-0.5" style={{ color: 'var(--accent-text)' }}>
            View All <ArrowRight size={9} />
          </button>
        </div>
        <div className="space-y-2">
          {activeMissions.map((mission) => (
            <div key={mission.id} className="p-2.5 rounded-[12px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{mission.icon}</span>
                <span className="font-label text-[11px] font-semibold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{mission.title}</span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--accent-text)' }}>+{mission.reward}P</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                <div className="h-full rounded-full" style={{ width: `${(mission.current / mission.target) * 100}%`, background: 'var(--accent)' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[8px]" style={{ color: 'var(--text-muted)' }}>{mission.current}/{mission.target}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/pulse')}
          className="mt-3 w-full py-2 rounded-[12px] font-mono text-[10px] flex items-center justify-center gap-1 transition-all"
          style={{ border: '1px solid var(--accent-border)', color: 'var(--accent-text)', background: 'var(--accent-surface)' }}>
          <Target size={10} /> View All Missions
        </button>
      </div>
    </div>
  );
};

export const EventsPanel: React.FC = () => {
  const navigate = useNavigate();
  const careerStats = useCareerStats();
  const { matchHistory } = useMatchReportStore();

  return (
    <div className="space-y-4">
      {/* YOUR PERFORMANCE */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-surface)', border: '1px solid var(--accent-border)' }}>
            <Trophy size={12} style={{ color: 'var(--accent-text)' }} />
          </div>
          <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>YOUR PERFORMANCE</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Trophy size={12} />,    label: 'MATCHES',      value: matchHistory.length,         color: 'var(--accent)', onClick: () => navigate('/app/clashhub/history') },
            { icon: <Zap size={12} />,       label: 'PULSE',        value: careerStats.totalPulseEarned, color: '#60A5FA',      onClick: () => navigate('/app/clashhub/performance') },
            { icon: <Target size={12} />,    label: 'WIN RATE',     value: `${careerStats.winRate}%`,   color: '#4ADE80',      onClick: () => navigate('/app/clashhub/performance') },
            { icon: <Activity size={12} />,  label: 'SSR RATING',   value: careerStats.currentSSR,      color: '#FBBF24',      onClick: () => navigate('/app/clashhub/performance') },
          ].map((stat, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={stat.onClick}
              className="rounded-[12px] p-3 text-center space-y-1 transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-center" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="font-display text-[18px] leading-none font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* PREVIOUS MATCHES */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <History size={12} style={{ color: '#00D4FF' }} />
            </div>
            <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>PREVIOUS MATCHES</span>
          </div>
          <button onClick={() => navigate('/app/clashhub/history')} className="font-mono text-[9px] flex items-center gap-0.5" style={{ color: 'var(--accent-text)' }}>
            View All <ArrowRight size={9} />
          </button>
        </div>

        <div className="space-y-2">
          {matchHistory.slice(0, 4).map((match) => {
            const resultColor = match.matchResult === 'win' ? '#4ADE80' : match.matchResult === 'loss' ? '#F87171' : '#FBBF24';
            const resultLabel = match.matchResult.toUpperCase();
            return (
              <motion.div
                key={match.id}
                whileHover={{ x: 3 }}
                onClick={() => navigate('/app/clashhub/history')}
                className="flex items-center justify-between p-2.5 rounded-[12px] cursor-pointer gap-3 transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[9px] text-[var(--text-muted)] capitalize">{match.sport}</span>
                    <span className="font-mono text-[9px]" style={{ color: 'var(--accent)' }}>+{match.pulseEarned} ⚡</span>
                  </div>
                  <p className="font-condensed font-semibold text-[12px] text-[var(--text-primary)] truncate leading-snug">{match.eventName}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-mono text-[8px] font-bold"
                  style={{ background: `${resultColor}18`, color: resultColor, border: `1px solid ${resultColor}55` }}>
                  {resultLabel}
                </span>
              </motion.div>
            );
          })}

          {/* Report pending card */}
          <motion.div
            whileHover={{ x: 3 }}
            onClick={() => navigate(`/app/clashhub/report/match-pending-001`)}
            className="flex flex-col gap-1 p-2.5 rounded-[12px] cursor-pointer transition-all"
            style={{ background: 'rgba(251,191,36,0.03)', border: '1.5px dashed rgba(251,191,36,0.3)' }}
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] font-bold" style={{ color: '#FBBF24' }}>⚠ PENDING REPORT</span>
              <span className="font-mono text-[9px]" style={{ color: '#FBBF24' }}>Report now →</span>
            </div>
            <p className="font-condensed font-semibold text-[12px] text-[var(--text-primary)] leading-snug truncate">Iron Pulse FC vs Rapid XI</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── Main RightPanel ────────────────────────────────────────────────────────
export const RightPanel: React.FC = () => {
  const location = useLocation();
  const isFeed   = location.pathname === '/app/feed';
  const isEvents = location.pathname.startsWith('/app/events');

  return (
    <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-0 py-4 pr-4 pl-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {isFeed && <DailyRewardsPanel />}
      {isEvents && <EventsPanel />}
      {!isFeed && !isEvents && (
        <div className="space-y-4">
          <DailyRewardsPanel />
        </div>
      )}
    </aside>
  );
};
