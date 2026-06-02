import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Gift, Target, Check, Lock, Users, Trophy, ArrowRight, Star } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useEventStore } from '../../store/eventStore';
import { useSquadStore } from '../../store/squadStore';

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
        {todayReward?.claimed && (
          <div className="w-full py-2.5 rounded-[12px] font-mono text-[10px] text-center" style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
            Claimed for today
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

// ─── Events Right Panel ─────────────────────────────────────────────────────
const EventsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { events } = useEventStore();
  const { generatedSquads } = useSquadStore();
  
  const joinedEvents = events.slice(0, 3); // mock: first 3 as "joined"
  const myGeneratedSquads = generatedSquads?.slice(0, 2) || [];
  const teamsJoinedCount = joinedEvents.length;

  return (
    <div className="space-y-4">
      {/* Generated Teams */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)' }} />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-surface)', border: '1px solid var(--accent-border)' }}>
            <Zap size={12} style={{ color: 'var(--accent-text)' }} />
          </div>
          <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>AI GENERATED TEAMS</span>
        </div>
        {myGeneratedSquads.length === 0 ? (
          <div className="text-center py-4">
            <Zap size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>No AI squads generated yet</p>
            <button onClick={() => navigate('/app/events')}
              className="mt-2 font-mono text-[10px] px-3 py-1.5 rounded-[8px]"
              style={{ background: 'var(--accent)', color: 'black' }}>Generate Squad</button>
          </div>
        ) : (
          <div className="space-y-2">
            {myGeneratedSquads.map((squad: any) => (
              <div key={squad.squadId} className="p-2.5 rounded-[12px] cursor-pointer"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="font-mono text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{squad.name}</div>
                <div className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>{squad.sport} · {squad.chemistry?.overall}% chemistry</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams Joined */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <Users size={12} style={{ color: '#00D4FF' }} />
          </div>
          <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>EVENTS JOINED</span>
          <span className="ml-auto font-display text-[20px]" style={{ color: '#00D4FF' }}>{teamsJoinedCount}</span>
        </div>
        <div className="space-y-2">
          {joinedEvents.map((event) => (
            <div key={event.id} onClick={() => navigate(`/app/events/${event.id}`)}
              className="flex items-center gap-3 p-2.5 rounded-[12px] cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'var(--bg-hover)' }}>
                ⚽
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</div>
                <div className="font-mono text-[8px]" style={{ color: 'var(--text-muted)' }}>{event.location}</div>
              </div>
              <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/app/events')}
          className="mt-3 w-full py-2 rounded-[12px] font-mono text-[10px] flex items-center justify-center gap-1"
          style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF', background: 'rgba(0,212,255,0.06)' }}>
          <Trophy size={10} /> Browse All Events
        </button>
      </div>

      {/* Quick Stats */}
      <div className="rounded-[20px] p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,213,74,0.12)', border: '1px solid rgba(255,213,74,0.25)' }}>
            <Trophy size={12} style={{ color: '#FFD700' }} />
          </div>
          <span className="font-display text-[13px] tracking-widest" style={{ color: 'var(--text-primary)' }}>YOUR STATS</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Events Won', value: '3', color: '#CCFF00' },
            { label: 'Events Joined', value: String(teamsJoinedCount), color: '#00D4FF' },
            { label: 'AI Squads', value: String(myGeneratedSquads.length), color: '#BF5FFF' },
            { label: 'Win Rate', value: '67%', color: '#FFD700' },
          ].map((stat, i) => (
            <div key={i} className="p-2.5 rounded-[12px] text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="font-display text-[18px]" style={{ color: stat.color }}>{stat.value}</div>
              <div className="font-mono text-[8px] uppercase" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
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
