import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Gift, Target, Check, Lock, Trophy, ArrowRight, Star, History, Activity, Calendar } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useClashHubSidebar, type SidebarMatchItem } from '../../hooks/useClashHubSidebar';

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
          {/* 8th slot = preview */}
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

// ─── Real ClashHub Events & Match Panel ──────────────────────────────────────
export const EventsPanel: React.FC = () => {
  const navigate = useNavigate();
  const {
    upcomingEvents,
    previousMatches,
    performance,
    loading,
    eventsError,
    matchesError,
    dismissEvent,
    refresh,
  } = useClashHubSidebar();

  const renderReportBadge = (match: SidebarMatchItem) => {
    switch (match.reportStatus) {
      case 'NO_REPORT':
        return (
          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border-muted/60">
            <span className="font-mono text-[9px] font-bold text-amber-400 flex items-center gap-1">
              ⚠ REPORT INCOMPLETE
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/clashhub/report/${match.matchId}`);
              }}
              className="font-mono text-[9px] text-amber-400 font-bold hover:underline"
            >
              Complete Report →
            </button>
          </div>
        );
      case 'DRAFT':
        return (
          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border-muted/60">
            <span className="font-mono text-[9px] font-bold text-amber-400 flex items-center gap-1">
              📝 REPORT DRAFT
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/clashhub/report/${match.matchId}`);
              }}
              className="font-mono text-[9px] text-amber-400 font-bold hover:underline"
            >
              Continue Report →
            </button>
          </div>
        );
      case 'SUBMITTED':
        return (
          <div className="mt-1 pt-1 border-t border-border-muted/40">
            <span className="font-mono text-[9px] font-bold text-emerald-400">✓ REPORT SUBMITTED</span>
          </div>
        );
      case 'VERIFICATION_PENDING':
        return (
          <div className="mt-1 pt-1 border-t border-border-muted/40">
            <span className="font-mono text-[9px] font-bold text-sky-400">⏳ VERIFICATION PENDING</span>
          </div>
        );
      case 'VERIFIED':
        return (
          <div className="mt-1 pt-1 border-t border-border-muted/40">
            <span className="font-mono text-[9px] font-bold text-emerald-400">✓ VERIFIED</span>
          </div>
        );
      case 'CORRECTION_REQUESTED':
        return (
          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border-muted/60">
            <span className="font-mono text-[9px] font-bold text-orange-400 flex items-center gap-1">
              ↻ CORRECTION REQUESTED
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/clashhub/report/${match.matchId}`);
              }}
              className="font-mono text-[9px] text-orange-400 font-bold hover:underline"
            >
              Update Report →
            </button>
          </div>
        );
      case 'DISPUTED':
        return (
          <div className="mt-1 pt-1 border-t border-border-muted/40">
            <span className="font-mono text-[9px] font-bold text-rose-400">⚠ REPORT DISPUTED</span>
          </div>
        );
      case 'RESOLVED':
        return (
          <div className="mt-1 pt-1 border-t border-border-muted/40">
            <span className="font-mono text-[9px] font-bold text-emerald-400">✓ REPORT RESOLVED</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. YOUR PERFORMANCE */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-surface)', border: '1px solid var(--accent-border)' }}>
            <Trophy size={12} style={{ color: 'var(--accent-text)' }} />
          </div>
          <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>YOUR PERFORMANCE</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Trophy size={12} />,   label: 'MATCHES',    value: performance.matchesCount,   color: 'var(--accent)', onClick: () => navigate('/app/clashhub/history') },
            { icon: <Zap size={12} />,      label: 'PULSE',      value: performance.pulse,          color: '#60A5FA',      onClick: () => navigate('/app/clashhub/performance') },
            { icon: <Target size={12} />,   label: 'WIN RATE',   value: `${performance.winRate}%`,  color: '#4ADE80',      onClick: () => navigate('/app/clashhub/performance') },
            { icon: <Activity size={12} />, label: 'SSR RATING', value: performance.ssr,           color: '#FBBF24',      onClick: () => navigate('/app/clashhub/performance') },
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
              <div className="font-display text-[16px] leading-none font-bold truncate" style={{ color: stat.color }}>{stat.value}</div>
              <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 2. YOUR UPCOMING EVENTS */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)' }}>
              <Calendar size={12} style={{ color: '#FF6B00' }} />
            </div>
            <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>YOUR UPCOMING EVENTS</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-20 rounded-[12px] bg-elevated animate-pulse border border-border" />
            <div className="h-20 rounded-[12px] bg-elevated animate-pulse border border-border" />
          </div>
        ) : eventsError ? (
          <div className="p-3 rounded-[12px] text-center space-y-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <p className="font-mono text-[10px] text-red-400">Unable to load your events.</p>
            <button onClick={refresh} className="px-3 py-1 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-4 rounded-[16px] text-center border border-dashed border-border-muted" style={{ background: 'var(--bg-elevated)' }}>
            <p className="font-mono text-[11px] text-text-muted">No upcoming registered events.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingEvents.map(ev => (
              <motion.div
                key={ev.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/app/events/${ev.id}`)}
                className="rounded-[14px] p-3 cursor-pointer relative overflow-hidden transition-all group"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.status === 'LIVE NOW' ? '#00D4FF' : '#FF6B00' }} />
                    <span className="font-mono text-[9px] font-bold uppercase truncate" style={{ color: ev.status === 'LIVE NOW' ? '#00D4FF' : '#FF6B00' }}>
                      {ev.sport} · {ev.status}
                    </span>
                  </div>
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-surface border border-border font-bold text-text-muted whitespace-nowrap">
                    ⏱ {ev.daysLeftText}
                  </span>
                </div>

                <h4 className="font-condensed font-bold text-[13px] text-text-primary group-hover:text-accent transition-colors truncate">
                  {ev.title}
                </h4>
                <p className="font-sans text-[10px] text-text-muted truncate mb-2">
                  📅 {ev.dateStr} · 📍 {ev.venue}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border-muted/60">
                  <span className="font-mono text-[8px] font-bold text-text-secondary">
                    {ev.currentParticipants} / {ev.maxParticipants} REGISTERED
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissEvent(ev.id);
                    }}
                    className="font-mono text-[9px] font-bold text-text-muted hover:text-red-400 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 3. PREVIOUS MATCHES */}
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

        {loading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-[12px] bg-elevated animate-pulse border border-border" />
            <div className="h-16 rounded-[12px] bg-elevated animate-pulse border border-border" />
          </div>
        ) : matchesError ? (
          <div className="p-4 rounded-[16px] text-center border border-dashed border-border-muted bg-surface space-y-2">
            <Trophy size={20} className="mx-auto text-accent opacity-60" />
            <p className="font-sans font-bold text-xs text-text-primary">Play a match to build your history.</p>
            <button onClick={refresh} className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold hover:bg-accent/20 transition-all cursor-pointer">
              Retry
            </button>
          </div>
        ) : previousMatches.length === 0 ? (
          <div className="p-4 rounded-[16px] text-center border border-dashed border-border-muted bg-surface space-y-1">
            <Trophy size={20} className="mx-auto text-accent opacity-60" />
            <p className="font-sans font-bold text-xs text-text-primary">Play a match to build your history.</p>
            <p className="font-mono text-[9px] text-text-muted">Your match journey starts here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {previousMatches.map((match) => {
              const resultColor = match.result === 'WIN' ? '#4ADE80' : match.result === 'LOSS' ? '#F87171' : '#FBBF24';
              return (
                <motion.div
                  key={match.id}
                  whileHover={{ x: 3 }}
                  onClick={() => {
                    if (match.reportStatus === 'NO_REPORT' || match.reportStatus === 'DRAFT' || match.reportStatus === 'CORRECTION_REQUESTED') {
                      navigate(`/app/clashhub/report/${match.matchId}`);
                    } else {
                      navigate('/app/clashhub/history');
                    }
                  }}
                  className="flex flex-col p-2.5 rounded-[12px] cursor-pointer gap-1 transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[9px] font-bold text-text-muted uppercase">{match.sport}</span>
                        {match.pulseEarned ? (
                          <span className="font-mono text-[9px]" style={{ color: 'var(--accent-text)' }}>+{match.pulseEarned} ⚡</span>
                        ) : null}
                      </div>
                      <p className="font-condensed font-semibold text-[12px] text-text-primary truncate leading-snug">{match.eventName}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full font-mono text-[8px] font-bold"
                      style={{ background: `${resultColor}18`, color: resultColor, border: `1px solid ${resultColor}55` }}>
                      {match.result}
                    </span>
                  </div>

                  {renderReportBadge(match)}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main RightPanel ────────────────────────────────────────────────────────
export const RightPanel: React.FC = () => {
  const location = useLocation();
  const isFeed   = location.pathname === '/app/feed';
  const isEvents = location.pathname.startsWith('/app/events') || location.pathname.startsWith('/app/clashhub');

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
