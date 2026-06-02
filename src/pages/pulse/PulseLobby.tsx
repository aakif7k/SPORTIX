import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Users, ChevronRight,
  Trophy, Zap, Gift, Target, Crown, Lock, ClipboardList,
  Calendar, History, Shield, ArrowRight, Activity, Clock, ArrowLeft
} from 'lucide-react';

import { useGamificationStore, getLevelProgress, LEVELS } from '../../store/gamificationStore';
import { SemiCircleProgress, LevelBadge } from '../../components/gamification/ProgressRing';
import { RewardCard, StreakBanner, MissionCard, BadgeCard } from '../../components/gamification/GamificationCards';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import { useSquadStore } from '../../store/squadStore';
import { useEventStore } from '../../store/eventStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  badge?: string;
}> = ({ icon, title, subtitle, accent = '#CCFF00', badge }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
      <span style={{ color: accent }}>{icon}</span>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg text-white tracking-[2px] uppercase">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="font-mono text-[10px] text-text-secondary mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── PULSE GAMIFICATION SECTION (Level + Progression) ────────────────────────
const LevelProgressSection: React.FC = () => {
  const { currentPulse, totalXP, streakDays, currentLevel } = useGamificationStore();
  const { level, percentage, remaining } = getLevelProgress(currentPulse);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-[24px] border border-border-muted overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)' }}
    >
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${level.color}10 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(204,255,0,0.03) 0%, transparent 70%)' }} />

      <div className="relative p-6 md:p-8">
        <SectionHeader
          icon={<Crown size={18} />}
          title="SPORTiX Level"
          subtitle="Your progression in the SPORTiX ecosystem"
          accent={level.color}
          badge={`SEASON 1`}
        />

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Semi-circle */}
          <div className="flex flex-col items-center gap-3">
            <SemiCircleProgress pulse={currentPulse} size="lg" showLevelUp />
            <LevelBadge pulse={currentPulse} />
          </div>

          {/* Right stats */}
          <div className="flex-1 space-y-5 w-full">
            {/* Next level info */}
            {nextLevel && (
              <div className="p-4 rounded-[16px] border border-border-muted/50 bg-elevated/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Next Level</p>
                    <p className="font-display text-xl text-text-primary mt-0.5">{nextLevel.icon} {nextLevel.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-text-muted">Remaining</p>
                    <p className="font-mono text-2xl font-bold" style={{ color: level.color }}>{remaining}</p>
                    <p className="font-mono text-[9px] text-text-muted">PULSE PTS</p>
                  </div>
                </div>
                {/* Progress track */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px] text-text-muted">
                    <span>LVL {level.level}</span>
                    <span>{percentage}% complete</span>
                    <span>LVL {nextLevel.level}</span>
                  </div>
                  <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-border-muted/50">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ background: `linear-gradient(90deg, ${level.color}cc, ${level.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                    >
                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total XP', value: totalXP.toLocaleString(), icon: '⚡', color: '#a855f7' },
                { label: 'Streak', value: `${streakDays}d 🔥`, icon: '🔥', color: '#f97316' },
                { label: 'Level', value: `#${currentLevel}`, icon: '🏅', color: level.color },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-[12px] bg-elevated border border-border-muted text-center">
                  <div className="font-mono text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="font-label text-[9px] text-text-muted uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Expanded Level Roadmap System */}
            <div className="space-y-4 pt-6 border-t border-border-muted/30">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] text-accent uppercase tracking-widest font-bold">SPORTiX LEVEL ROADMAP</p>
                <span className="font-mono text-[10px] text-text-secondary">Milestone rewards every 10 levels</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {[
                  { level: 10,  title: 'Rookie Core', reward: 'Green neon shield, basic border glow' },
                  { level: 20,  title: 'Challenger Unit', reward: 'Silver chassis, pulse animations, custom badge toggle' },
                  { level: 30,  title: 'Contender X', reward: 'Layered metal frame, custom light streaks, SSR rating visibility' },
                  { level: 40,  title: 'Striker Elite', reward: 'Green crystal emblem, motion glow, custom lobby aura' },
                  { level: 50,  title: 'Elite Phantom', reward: 'Dark chrome chassis, floating holographic shine, squad invite bonus' },
                  { level: 60,  title: 'Dominator Prime', reward: 'Aggressive neon shape, mini-particle stream, custom status border' },
                  { level: 70,  title: 'Champion Nexus', reward: 'Prestige trophy design, advanced lighting rays, custom lobby tag' },
                  { level: 80,  title: 'Titan Core', reward: 'Armored heavy frame, electric pulses, dynamic profile border' },
                  { level: 90,  title: 'Apex Velocity', reward: 'Dynamic velocity crown, glowing chat bubbles, premium custom color text' },
                  { level: 100, title: 'Legend Infinite', reward: 'Prestige aura overlay, moving holographic particles, special nickname prefix' },
                  { level: 110, title: 'Grandmaster X', reward: 'Grandmaster neon aura, floating title card, leaderboard crown effects' },
                  { level: 120, title: 'HyperNova', reward: 'HyperNova space dust, customizable border speed, team chemistry score boost' },
                  { level: 130, title: 'Phantom Overdrive', reward: 'Dark cyber glow, holographic trail on posts, premium VIP lounge access' },
                  { level: 140, title: 'Immortal Zenith', reward: 'Absolute cyan neon glow, floating halo frame, exclusive match lobby crown' },
                  { level: 150, title: 'Supreme GOAT', reward: 'Absolute gold and neon prestige border, neon particle trails, GOAT verified badge' },
                ].map((milestone) => {
                  const isUnlocked = currentLevel >= milestone.level;
                  return (
                    <div 
                      key={milestone.level} 
                      className={`relative p-3 rounded-[16px] border backdrop-blur-md transition-all duration-300 flex items-center gap-3 ${
                        isUnlocked 
                          ? 'bg-elevated border-accent/15' 
                          : 'bg-base/40 border-border-muted/30 opacity-60'
                      }`}
                    >
                      {/* Badge Display */}
                      <div className="relative flex-shrink-0">
                        <BadgeIcon level={milestone.level} size={40} animate={isUnlocked} glow={isUnlocked} />
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-base/60 rounded-full flex items-center justify-center">
                            <Lock size={12} className="text-text-muted" />
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0 font-mono text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-text-primary tracking-wide truncate text-[11px]">{milestone.title}</span>
                          <span className="text-accent font-bold">LVL {milestone.level}</span>
                        </div>
                        <p className="text-text-secondary text-[9px] mt-1 leading-snug line-clamp-2">{milestone.reward}</p>
                        {isUnlocked && (
                          <span className="inline-block mt-1 text-[8px] uppercase tracking-wider text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── DAILY REWARDS SECTION ────────────────────────────────────────────────────
const DailyRewardsSection: React.FC = () => {
  const { dailyRewards, streakDays, claimDailyReward } = useGamificationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-[20px] border border-border-muted bg-surface shadow-card p-6"
    >
      <SectionHeader
        icon={<Gift size={18} />}
        title="Daily Rewards"
        subtitle={`${streakDays} day login streak — keep going!`}
        accent="#f97316"
        badge="DAILY"
      />

      {/* Streak banner */}
      <StreakBanner streak={streakDays} />

      {/* Reward cards strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 mt-4" style={{ scrollbarWidth: 'none' }}>
        {dailyRewards.map(reward => (
          <RewardCard key={reward.day} reward={reward} onClaim={claimDailyReward} />
        ))}
      </div>

      {/* Weekly bonus callout */}
      <div className="mt-4 p-3 rounded-[12px] border border-volt/15 bg-volt/5 flex items-center gap-3">
        <div className="text-2xl">👑</div>
        <div className="flex-1">
          <p className="font-label text-sm font-semibold text-volt">Day 7 Weekly Bonus</p>
          <p className="font-mono text-[10px] text-text-secondary mt-0.5">+100 Pulse · 2x XP Booster · Exclusive Title</p>
        </div>
        <div className="flex items-center gap-1 text-text-muted font-mono text-[10px]">
          <Lock size={10} /> {7 - streakDays}d left
        </div>
      </div>
    </motion.div>
  );
};

// ─── MISSIONS SECTION ─────────────────────────────────────────────────────────
const MissionsSection: React.FC = () => {
  const { missions, claimMissionReward } = useGamificationStore();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

  const filtered = missions.filter(m => m.category === tab);
  const completed = filtered.filter(m => m.completed).length;
  const totalReward = filtered.filter(m => !m.claimed).reduce((a, m) => a + m.reward, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-[20px] border border-border-muted bg-surface shadow-card p-6"
    >
      <SectionHeader
        icon={<Target size={18} />}
        title="Missions"
        subtitle="Complete missions to earn Pulse & XP"
        accent="#CCFF00"
        badge="ACTIVE"
      />

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['daily', 'weekly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${tab === t ? 'bg-volt text-volt-text font-bold' : 'border border-border-muted text-text-secondary hover:text-text-primary hover:border-volt/30'}`}>
            {t}
          </button>
        ))}
        {/* Summary pill */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-elevated border border-border-muted font-mono text-[10px] text-text-secondary">
          <Zap size={10} className="text-volt" />
          <span className="text-volt font-bold">+{totalReward}</span> available
        </div>
      </div>

      {/* Progress summary bar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-elevated border border-border-muted">
        <div className="flex-1">
          <div className="flex justify-between font-mono text-[10px] text-text-secondary mb-1">
            <span>Progress</span>
            <span className="text-volt">{completed}/{filtered.length} completed</span>
          </div>
          <div className="w-full h-2 bg-base rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-volt"
              style={{ boxShadow: '0 0 8px rgba(204,255,0,0.5)' }}
              animate={{ width: `${filtered.length > 0 ? (completed / filtered.length) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-black text-volt">{Math.round(filtered.length > 0 ? (completed / filtered.length) * 100 : 0)}%</div>
        </div>
      </div>

      {/* Mission cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(m => (
            <MissionCard key={m.id} mission={m} onClaim={claimMissionReward} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── ACHIEVEMENTS SECTION ─────────────────────────────────────────────────────
const AchievementsSection: React.FC = () => {
  const { badges } = useGamificationStore();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const filtered = filter === 'all' ? badges : badges.filter(b => filter === 'unlocked' ? b.unlocked : !b.unlocked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="rounded-[20px] border border-border-muted bg-surface shadow-card p-6"
    >
      <SectionHeader
        icon={<Trophy size={18} />}
        title="Achievements"
        subtitle={`${badges.filter(b => b.unlocked).length}/${badges.length} badges unlocked`}
        accent="#FFD700"
        badge="HALL"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all capitalize ${filter === f ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'border border-border-muted text-text-secondary hover:text-text-primary hover:border-volt/30'}`}>
            {f} {f === 'unlocked' ? `(${badges.filter(b => b.unlocked).length})` : f === 'locked' ? `(${badges.filter(b => !b.unlocked).length})` : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((badge, i) => (
            <motion.div key={badge.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
              <BadgeCard badge={badge} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── NEW REGISTERED SECTION (AI MATCHMAKING & BATTLE HISTORY) ──────────────────
interface GeneratedHistoryItem {
  id: string;
  name: string;
  sport: string;
  date: string;
  compatibility: number;
  status: 'active' | 'declined' | 'completed' | 'pending';
  chemistry: { overall: number; trust: number; coordination: number; communication: number };
  membersCount: number;
  members: Array<{ name: string; avatar: string; position: string; level: number; distance: number; compatibility: number }>;
  xpEarned?: number;
}

interface JoinedEventHistoryItem {
  id: string;
  title: string;
  sport: string;
  date: string;
  venue: string;
  location: string;
  status: 'ready' | 'pending' | 'active' | 'completed';
  joinedAs: string;
  teamName?: string;
  countdown: string;
  xpAwarded?: number;
}

const RegisteredSection: React.FC = () => {
  const navigate = useNavigate();
  const { squads } = useSquadStore();
  const { events } = useEventStore();
  const { nearbyRadius } = useAISettingsStore();
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [archiveMode, setArchiveMode] = useState<'dashboard' | 'squads' | 'events'>('dashboard');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  // Combine store squads (active) and mock archived squads for a complete history
  const activeSquadsList = squads.map(s => ({
    id: s.squadId,
    name: s.name,
    sport: s.sport,
    date: s.createdAt || '2026-05-19',
    compatibility: s.pulseAvg ? Math.min(99, Math.round(s.pulseAvg / 10)) : 88,
    status: 'active' as const,
    chemistry: s.chemistry,
    membersCount: s.members.length,
    members: s.members.map(m => ({
      name: m.name,
      avatar: m.avatar,
      position: m.position || 'CM',
      level: m.level || 20,
      distance: m.distance || 3.5,
      compatibility: m.compatibility || 85
    }))
  }));

  const mockGeneratedHistory: GeneratedHistoryItem[] = [
    ...activeSquadsList,
    {
      id: 'gen-squad-5',
      name: 'Alpha Force',
      sport: 'Basketball',
      date: '2026-06-12',
      compatibility: 92,
      status: 'completed',
      chemistry: { overall: 90, trust: 88, coordination: 94, communication: 88 },
      membersCount: 5,
      members: [
        { name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', position: 'Guard', level: 68, distance: 3.1, compatibility: 92 },
        { name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', position: 'Forward', level: 79, distance: 2.5, compatibility: 90 }
      ]
    },
    {
      id: 'gen-squad-3',
      name: 'Cyber Spectres',
      sport: 'Valorant',
      date: '2026-05-02',
      compatibility: 68,
      status: 'declined',
      chemistry: { overall: 64, trust: 60, coordination: 68, communication: 64 },
      membersCount: 5,
      members: [
        { name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', position: 'Sentinel', level: 72, distance: 6.1, compatibility: 72 },
        { name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', position: 'Duelist', level: 68, distance: 8.2, compatibility: 65 },
        { name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', position: 'Controller', level: 79, distance: 4.5, compatibility: 78 }
      ]
    },
    {
      id: 'gen-squad-4',
      name: 'Vanguard Elite',
      sport: 'Football',
      date: '2026-04-20',
      compatibility: 89,
      status: 'completed',
      chemistry: { overall: 85, trust: 88, coordination: 82, communication: 85 },
      membersCount: 6,
      xpEarned: 1250,
      members: [
        { name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', position: 'ST', level: 84, distance: 1.2, compatibility: 90 },
        { name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', position: 'LW', level: 81, distance: 3.3, compatibility: 88 }
      ]
    },
    {
      id: 'gen-squad-6',
      name: 'Spin Masters',
      sport: 'Tennis',
      date: '2026-04-05',
      compatibility: 84,
      status: 'completed',
      chemistry: { overall: 80, trust: 82, coordination: 78, communication: 80 },
      membersCount: 2,
      members: [
        { name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', position: 'Player 1', level: 81, distance: 2.1, compatibility: 85 }
      ]
    },
    {
      id: 'gen-squad-7',
      name: 'Apex Predators',
      sport: 'Athletics',
      date: '2026-03-18',
      compatibility: 76,
      status: 'completed',
      chemistry: { overall: 72, trust: 70, coordination: 75, communication: 71 },
      membersCount: 4,
      members: [
        { name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', position: 'Runner', level: 68, distance: 4.5, compatibility: 78 }
      ]
    },
    {
      id: 'gen-squad-8',
      name: 'Neon Racers',
      sport: 'Athletics',
      date: '2026-03-02',
      compatibility: 62,
      status: 'declined',
      chemistry: { overall: 58, trust: 60, coordination: 55, communication: 60 },
      membersCount: 3,
      members: [
        { name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', position: 'Runner', level: 72, distance: 5.2, compatibility: 64 }
      ]
    }
  ];

  // Load actual events from useEventStore where current user is registered
  const joinedStoreEvents = events.filter(e => e.participants.includes('cu1')).map(e => ({
    id: e.id,
    title: e.title,
    sport: e.sport,
    date: e.date,
    venue: e.venue,
    location: e.location,
    status: e.status === 'upcoming' ? 'ready' as const : 'active' as const,
    joinedAs: e.aiGenerated ? 'AI AutoSquad' : 'Solo Agent',
    teamName: e.aiGenerated ? 'Iron Pulse FC' : undefined,
    countdown: e.status === 'upcoming' ? '23d 15h 31m' : 'EVENT ACTIVE'
  }));

  const mockJoinedEventsHistory: JoinedEventHistoryItem[] = [
    ...joinedStoreEvents,
    {
      id: 'evt-hist-3',
      title: 'Asia Pacific Basketball Open',
      sport: 'Basketball',
      date: '2026-06-28',
      venue: 'Yoyogi National Gymnasium',
      location: 'Tokyo, Japan',
      status: 'pending',
      joinedAs: 'Solo Agent',
      countdown: '36d 13h 02m'
    },
    {
      id: 'evt-hist-6',
      title: 'Euro Tennis Clash',
      sport: 'Tennis',
      date: '2026-06-05',
      venue: 'Court-8 / Arena',
      location: 'Paris, France',
      status: 'ready',
      joinedAs: 'Double Partner',
      teamName: 'Spin Masters',
      countdown: '13d 08h 12m'
    },
    {
      id: 'evt-hist-2',
      title: 'Metropolitan Cup 2026',
      sport: 'Football',
      date: '2026-05-20',
      venue: 'Munich City Stadium',
      location: 'Munich, Germany',
      status: 'active',
      joinedAs: 'Captain',
      teamName: 'Iron Pulse FC',
      countdown: 'EVENT IN PROGRESS'
    },
    {
      id: 'evt-hist-4',
      title: 'Alps Climbing Exhibition',
      sport: 'Athletics',
      date: '2026-05-10',
      venue: 'Virtual Node-12 / Alps',
      location: 'Online / Virtual',
      status: 'completed',
      joinedAs: 'Solo Athlete',
      xpAwarded: 500,
      countdown: 'COMPLETED'
    },
    {
      id: 'evt-hist-5',
      title: 'Berlin Marathon 2026',
      sport: 'Athletics',
      date: '2026-04-18',
      venue: 'Brandenburg Gate',
      location: 'Berlin, Germany',
      status: 'completed',
      joinedAs: 'Solo Runner',
      xpAwarded: 400,
      countdown: 'COMPLETED'
    },
    {
      id: 'evt-hist-7',
      title: 'Cyber Strike League',
      sport: 'Valorant',
      date: '2026-03-24',
      venue: 'Cloud Arena Node-7',
      location: 'Virtual',
      status: 'completed',
      joinedAs: 'Tactician',
      teamName: 'Code Hackers',
      xpAwarded: 1200,
      countdown: 'COMPLETED'
    },
    {
      id: 'evt-hist-8',
      title: 'Urban Streetball Showdown',
      sport: 'Basketball',
      date: '2026-03-05',
      venue: 'Kreuzberg Courts',
      location: 'Berlin, Germany',
      status: 'completed',
      joinedAs: 'Point Guard',
      teamName: 'Volt Ballers',
      xpAwarded: 750,
      countdown: 'COMPLETED'
    }
  ];

  // Helper to group by month
  interface GroupedItems<T> {
    monthKey: string;
    items: T[];
  }

  const getSortedMonthGroups = <T extends { date: string }>(items: T[]): GroupedItems<T>[] => {
    const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
    const groupsMap = new Map<string, T[]>();
    
    sorted.forEach(item => {
      const parts = item.date.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = [
          'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        const monthName = months[monthIndex] || 'UNKNOWN';
        const key = `${monthName} ${year}`;
        
        if (!groupsMap.has(key)) {
          groupsMap.set(key, []);
        }
        groupsMap.get(key)!.push(item);
      }
    });
    
    const result: GroupedItems<T>[] = [];
    groupsMap.forEach((val, key) => {
      result.push({ monthKey: key, items: val });
    });
    return result;
  };

  const sortedSquads = [...mockGeneratedHistory].sort((a, b) => b.date.localeCompare(a.date));
  const sortedEvents = [...mockJoinedEventsHistory].sort((a, b) => b.date.localeCompare(a.date));

  const dashboardSquads = sortedSquads.slice(0, 3);
  const dashboardEvents = sortedEvents.slice(0, 3);

  const renderSquadCard = (squad: GeneratedHistoryItem) => {
    const isSelected = selectedSquadId === squad.id;
    return (
      <div
        key={squad.id}
        onClick={() => setSelectedSquadId(isSelected ? null : squad.id)}
        style={{ 
          boxShadow: isSelected ? 'var(--shadow-hover)' : 'var(--shadow-card)',
          borderColor: isSelected ? 'var(--accent)' : 'var(--border)'
        }}
        className={`p-5 rounded-[22px] bg-surface border transition-all duration-300 relative group cursor-pointer hover:shadow-hover hover:border-accent/30 flex flex-col justify-between ${isSelected ? 'min-h-[175px]' : 'h-[175px]'}`}
      >
        {/* Futuristic glowing indicator node */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
        )}

        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Card Top: Title and Badges */}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-condensed font-bold text-sm uppercase tracking-wider text-text-primary leading-none truncate block max-w-[160px]">{squad.name}</span>
                <span className="px-2 py-0.5 rounded-md font-mono text-[8px] font-semibold bg-elevated border border-border-muted text-text-secondary uppercase">
                  {squad.sport}
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-muted">Generated: {squad.date}</p>
            </div>
            
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-md font-mono text-[8px] font-bold uppercase border ${
                squad.status === 'active' ? 'bg-volt-dim text-volt border-volt/20' :
                squad.status === 'declined' ? 'bg-danger-dim text-danger border-danger/20' :
                squad.status === 'completed' ? 'bg-cyan-dim text-cyan border-cyan/20' :
                'bg-warning-dim text-warning border-warning/20'
              }`}>
                {squad.status}
              </span>
              <div className="font-mono text-[10px] font-bold text-volt mt-1">{squad.compatibility}% Match</div>
            </div>
          </div>
        </div>

        {/* Card Bottom: Metadata and Action Button */}
        <div className="mt-4 pt-3 border-t border-border-muted flex items-center justify-between h-8">
          <div className="flex -space-x-1.5 overflow-hidden">
            {squad.members.slice(0, 4).map((member, i) => (
              <img
                key={i}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-surface object-cover bg-base border border-border-muted"
                src={member.avatar}
                alt={member.name}
              />
            ))}
            {squad.members.length > 4 && (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-elevated border border-border-muted text-[8px] font-mono text-text-primary font-bold ring-2 ring-surface">
                +{squad.members.length - 4}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 font-mono text-[10px] text-text-secondary group-hover:text-text-primary transition-colors">
            <span>Chemistry: <strong className="text-text-primary font-bold">{squad.chemistry.overall}%</strong></span>
            <ChevronRight size={12} className={`text-text-muted transition-transform duration-300 ${isSelected ? 'rotate-90 text-volt' : ''}`} />
          </div>
        </div>

        {/* Expandable holographic details panel */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-4 pt-4 border-t border-border-muted space-y-4 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Telemetry stats sub-grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'TRUST', val: squad.chemistry.trust, color: 'text-volt' },
                  { label: 'COORD', val: squad.chemistry.coordination, color: 'text-cyan' },
                  { label: 'COMM', val: squad.chemistry.communication, color: 'text-plasma' }
                ].map(c => (
                  <div key={c.label} className="p-2 rounded-xl bg-elevated border border-border-muted text-center font-mono">
                    <span className="text-[8px] text-text-muted block font-semibold">{c.label}</span>
                    <span className={`text-[11px] font-bold block mt-0.5 ${c.color}`}>{c.val}%</span>
                  </div>
                ))}
              </div>

              {/* AI matching checklist */}
              <div className="p-3 rounded-xl bg-volt-dim/30 border border-border-muted space-y-2 relative">
                <div className="font-mono text-[9px] text-volt uppercase tracking-wider font-bold">AI MATCH SYNC DIAGNOSTICS</div>
                <div className="space-y-1.5 font-mono text-[9px]">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Shield size={10} className="text-volt flex-shrink-0" />
                    <span className="truncate">Level synchronization matches tolerance (+/-5)</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Activity size={10} className="text-volt flex-shrink-0" />
                    <span className="truncate">Same gameplay category: competitive sports category</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={10} className="text-volt flex-shrink-0" />
                    <span className="truncate">Proximity threshold within {nearbyRadius} KM (Avg: 3.2 KM)</span>
                  </div>
                </div>
              </div>

              {/* Detailed members listing */}
              <div className="space-y-2">
                <div className="font-mono text-[8px] text-text-muted uppercase tracking-wider font-bold">TEAM PARTICIPANTS</div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {squad.members.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-elevated border border-border-muted font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover bg-base border border-border-muted" />
                        <div>
                          <span className="text-text-primary font-bold block leading-none">{member.name}</span>
                          <span className="text-[8px] text-text-muted mt-0.5 block">{member.position} · Level {member.level}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-volt font-bold">{member.compatibility}%</span>
                        <span className="text-[8px] text-text-muted block">{member.distance} KM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button if accepted & active */}
              {squad.status === 'active' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/pulse/squad/${squad.id}`);
                  }}
                  className="w-full py-2 bg-volt text-volt-text rounded-xl font-condensed font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>Access Squad Workspace</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderEventCard = (event: JoinedEventHistoryItem) => {
    const isSelected = selectedEventId === event.id;
    return (
      <div
        key={event.id}
        onClick={() => setSelectedEventId(isSelected ? null : event.id)}
        style={{ 
          boxShadow: isSelected ? 'var(--shadow-hover)' : 'var(--shadow-card)',
          borderColor: isSelected ? 'var(--cyan)' : 'var(--border)'
        }}
        className={`p-5 rounded-[22px] bg-surface border transition-all duration-300 relative group cursor-pointer hover:shadow-hover hover:border-cyan/30 flex flex-col justify-between ${isSelected ? 'min-h-[175px]' : 'h-[175px]'}`}
      >
        {/* Futuristic glowing indicator node */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)] animate-pulse" />
        )}

        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Card Top: Title and Badges */}
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-condensed font-bold text-sm uppercase tracking-wider text-text-primary leading-none truncate block max-w-[160px]">{event.title}</span>
                <span className="px-2 py-0.5 rounded-md font-mono text-[8px] font-semibold bg-elevated border border-border-muted text-text-secondary uppercase">
                  {event.sport}
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-muted truncate">{event.venue} · {event.location}</p>
            </div>
            
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-md font-mono text-[8px] font-bold uppercase border ${
                event.status === 'ready' ? 'bg-volt-dim text-volt border-volt/20' :
                event.status === 'active' ? 'bg-danger-dim text-danger border-danger/20 animate-pulse' :
                event.status === 'completed' ? 'bg-neutral-500/10 text-text-secondary border-neutral-500/20' :
                'bg-warning-dim text-warning border-warning/20'
              }`}>
                {event.status === 'ready' ? 'READY' : event.status === 'active' ? 'LIVE' : event.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card Bottom: Metadata and Action Button */}
        <div className="mt-4 pt-3 border-t border-border-muted flex items-center justify-between h-8">
          <div className="flex items-center gap-1.5 text-text-secondary font-mono text-[10px]">
            <Calendar size={12} className="text-cyan" />
            <span>{event.date}</span>
          </div>
          
          <div className="flex items-center gap-1 font-mono text-[10px] text-text-secondary group-hover:text-text-primary transition-colors">
            <span>Crew: <strong className="text-text-primary font-bold">{event.joinedAs}</strong></span>
            <ChevronRight size={12} className={`text-text-muted transition-transform duration-300 ${isSelected ? 'rotate-90 text-cyan' : ''}`} />
          </div>
        </div>

        {/* Expandable holographic details panel */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-4 pt-4 border-t border-border-muted space-y-3 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Matched squad or registration type */}
              {event.teamName ? (
                <div className="p-2.5 rounded-xl bg-elevated border border-border-muted flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-cyan" />
                    <div>
                      <span className="text-text-muted block text-[8px] uppercase">DEPLOYED SQUAD</span>
                      <span className="text-text-primary font-bold">{event.teamName}</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-volt-dim text-volt border border-volt/20 text-[8px] font-bold uppercase">
                    Balanced
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-elevated border border-border-muted flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-warning" />
                    <div>
                      <span className="text-text-muted block text-[8px] uppercase">DEPLOYED SQUAD</span>
                      <span className="text-text-primary font-bold">Solo Entry Roster</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-warning-dim text-warning border border-warning/20 text-[8px] font-bold uppercase">
                    Pending Sync
                  </span>
                </div>
              )}

              {/* Countdown element */}
              <div className="p-3 rounded-xl bg-elevated border border-border-muted flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-cyan flex-shrink-0" />
                  <span className="text-[9px] text-text-secondary uppercase">Battle Countdown</span>
                </div>
                <span className="text-xs font-bold tracking-widest text-cyan font-mono" style={{ color: event.status === 'active' ? 'var(--danger)' : 'var(--cyan)' }}>
                  {event.countdown}
                </span>
              </div>

              {/* Event description */}
              <div className="font-mono text-[9px] text-text-secondary leading-relaxed bg-elevated p-2.5 rounded-xl border border-border-muted">
                <p className="text-text-muted text-[8px] uppercase tracking-wider mb-1 font-bold">REGISTRATION METRICS</p>
                Battle lobby secure. Matches will start automatically. Tactical squad chats are synced inside the Event discussion group tab. Bring standard gear.
              </div>

              {/* Action to launch lobby */}
              {event.status !== 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${event.id}`);
                  }}
                  className="w-full py-2 bg-cyan text-cyan-text rounded-xl font-condensed font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-1.5 mt-1 shadow-sm"
                >
                  <span>Launch Battle Dashboard</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {archiveMode === 'dashboard' && (
        <>
          {/* ── Top Futuristic Telemetry Stats Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-[20px] bg-elevated/40 border border-border-muted relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-volt/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-volt/10 transition-all" />
              <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest">System Status</div>
              <div className="font-display text-lg text-text-primary mt-1 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-volt animate-ping" />
                <span className="text-volt">OVERDRIVE</span>
              </div>
              <div className="font-mono text-[9px] text-text-secondary mt-1.5">AI Pulse Sync: 98.4%</div>
            </div>

            <div className="p-4 rounded-[20px] bg-elevated/40 border border-border-muted relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-cyan/10 transition-all" />
              <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold">Squads Balanced</div>
              <div className="font-display text-2xl text-text-primary mt-1 font-bold">
                <span className="text-cyan dark:text-[#00D4FF] light:text-[#008ba3]">{mockGeneratedHistory.length}</span> <span className="font-mono text-xs text-text-secondary">Tactical Units</span>
              </div>
              <div className="font-mono text-[9px] text-text-secondary mt-1.5">{squads.length} Active in Huddles</div>
            </div>

            <div className="p-4 rounded-[20px] bg-elevated/40 border border-border-muted relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-all" />
              <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold">Combat Nodes</div>
              <div className="font-display text-2xl text-text-primary mt-1 font-bold">
                <span className="text-amber-400">{mockJoinedEventsHistory.filter(e => e.status !== 'completed').length}</span> <span className="font-mono text-xs text-text-secondary">Active Battles</span>
              </div>
              <div className="font-mono text-[9px] text-text-secondary mt-1.5">Next match in 23 days</div>
            </div>

            <div className="p-4 rounded-[20px] bg-elevated/40 border border-border-muted relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-all" />
              <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold">Combat win rate</div>
              <div className="font-display text-2xl text-text-primary mt-1 font-bold">
                <span className="text-purple-400">74%</span> <span className="font-mono text-xs text-text-secondary">Ratio</span>
              </div>
              <div className="font-mono text-[9px] text-text-secondary mt-1.5">Rank: Contender II</div>
            </div>
          </div>

          {/* ── Main Dashboard Columns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
            
            {/* Center Separation Line */}
            <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-between pointer-events-none py-4">
              <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-border-muted to-transparent relative">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-volt/40 border border-volt/80 animate-pulse-volt" />
                <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan/40 border border-cyan/80 animate-pulse-cyan" />
              </div>
            </div>

            {/* Left Column: Squad Generation Logs */}
            <div className="space-y-4 pr-0 lg:pr-6">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-volt" />
                <h2 className="font-display text-base tracking-[2px] uppercase text-text-primary leading-none">AI Squad Generation Logs</h2>
              </div>

              <div className="space-y-4">
                {dashboardSquads.map(squad => renderSquadCard(squad))}
                
                {/* View Full History Button */}
                <button
                  onClick={() => { setArchiveMode('squads'); setSelectedMonthFilter('all'); }}
                  className="w-full py-3 px-4 rounded-[16px] border border-volt/20 hover:border-volt/50 bg-volt/5 hover:bg-volt/10 transition-all duration-300 font-mono text-[11px] font-bold text-volt uppercase tracking-widest flex items-center justify-center gap-2 group hover:shadow-[0_0_15px_rgba(204,255,0,0.12)]"
                >
                  <span>View Full Squad Generation History</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: Joined Event Registrations */}
            <div className="space-y-4 pl-0 lg:pl-6 relative">
              {/* Mobile separating line */}
              <div className="block lg:hidden my-8 relative">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border-muted to-transparent" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan/40 border border-cyan/80" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-cyan" />
                <h2 className="font-display text-base tracking-[2px] uppercase text-text-primary leading-none">Joined Battle Logs</h2>
              </div>

              <div className="space-y-4">
                {dashboardEvents.map(event => renderEventCard(event))}

                {/* View Full History Button */}
                <button
                  onClick={() => { setArchiveMode('events'); setSelectedMonthFilter('all'); }}
                  className="w-full py-3 px-4 rounded-[16px] border border-cyan/20 hover:border-cyan/50 bg-cyan/5 hover:bg-cyan/10 transition-all duration-300 font-mono text-[11px] font-bold text-cyan uppercase tracking-widest flex items-center justify-center gap-2 group hover:shadow-[0_0_15px_rgba(0,212,255,0.12)]"
                >
                  <span>View Full Joined Battle History</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {archiveMode === 'squads' && (
        <div className="space-y-6 animate-rise">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-[24px] border border-border-muted bg-surface/60 backdrop-blur-md relative overflow-hidden shadow-card">
            <div className="absolute top-0 right-0 w-64 h-64 bg-volt/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setArchiveMode('dashboard')}
                className="p-3 rounded-xl border border-border-muted bg-surface hover:border-volt/40 hover:bg-elevated transition-all text-text-secondary hover:text-text-primary flex items-center justify-center"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl text-text-primary tracking-[2px] uppercase leading-none">Squad Generation History</h2>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold bg-volt/10 text-volt border border-volt/20 uppercase">
                    Archive View
                  </span>
                </div>
                <p className="font-mono text-[10px] text-text-secondary mt-1">Detailed history logs of all AI matchmaking instances</p>
              </div>
            </div>

            {/* Archive stats */}
            <div className="flex gap-3 font-mono text-[10px]">
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">TOTAL</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{mockGeneratedHistory.length}</span>
              </div>
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">AVG FIT</span>
                <span className="text-sm font-bold text-volt mt-0.5 block">
                  {Math.round(mockGeneratedHistory.reduce((acc, cur) => acc + cur.compatibility, 0) / mockGeneratedHistory.length)}%
                </span>
              </div>
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">SUCCESS</span>
                <span className="text-sm font-bold text-cyan mt-0.5 block">
                  {mockGeneratedHistory.filter(s => s.status === 'completed' || s.status === 'active').length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Layout with Month Filter Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            
            {/* Left Column: Month Filter Navigation */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-3">
                <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold px-1">Filter Timeline</div>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setSelectedMonthFilter('all')}
                    className={`px-3 py-2.5 rounded-xl text-left font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between w-full flex-shrink-0 lg:flex-shrink-1 border ${
                      selectedMonthFilter === 'all'
                        ? 'bg-volt border-volt text-volt-text shadow-sm'
                        : 'border-border-muted bg-surface text-text-secondary hover:text-text-primary hover:border-volt/30'
                    }`}
                  >
                    <span>ALL TIMELINE</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${selectedMonthFilter === 'all' ? 'bg-volt-text/10 text-volt-text' : 'bg-base text-text-muted border border-border-muted/30'}`}>
                      {mockGeneratedHistory.length}
                    </span>
                  </button>

                  {getSortedMonthGroups(mockGeneratedHistory).map(group => (
                    <button
                      key={group.monthKey}
                      onClick={() => setSelectedMonthFilter(group.monthKey)}
                      className={`px-3 py-2.5 rounded-xl text-left font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between w-full flex-shrink-0 lg:flex-shrink-1 border ${
                        selectedMonthFilter === group.monthKey
                          ? 'bg-volt border-volt text-volt-text shadow-sm'
                          : 'border-border-muted bg-surface text-text-secondary hover:text-text-primary hover:border-volt/30'
                      }`}
                    >
                      <span>{group.monthKey}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${selectedMonthFilter === group.monthKey ? 'bg-volt-text/10 text-volt-text' : 'bg-base text-text-muted border border-border-muted/30'}`}>
                        {group.items.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Month Timeline list */}
            <div className="lg:col-span-9 space-y-8">
              {getSortedMonthGroups(mockGeneratedHistory)
                .filter(group => selectedMonthFilter === 'all' || group.monthKey === selectedMonthFilter)
                .map(group => (
                  <div key={group.monthKey} className="space-y-4">
                    {/* Month Header Banner */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black tracking-widest text-volt uppercase bg-volt/10 px-3 py-1.5 rounded-lg border border-volt/20">
                        {group.monthKey}
                      </span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-volt/20 via-volt/5 to-transparent" />
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
                        {group.items.length} {group.items.length === 1 ? 'Squad' : 'Squads'}
                      </span>
                    </div>
                    
                    {/* Interactive Vertical Timeline list */}
                    <div className="relative border-l border-border-muted/40 ml-4 pl-8 space-y-6 py-2">
                      {group.items.map((squad, idx) => (
                        <div key={squad.id} className="relative">
                          {/* Chrono timeline node */}
                          <div className="absolute -left-10 top-6 w-4 h-4 rounded-full border border-volt bg-surface flex items-center justify-center shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-volt" />
                            {idx === 0 && selectedMonthFilter === 'all' && (
                              <div className="absolute inset-0 rounded-full animate-ping-slow bg-volt opacity-25" />
                            )}
                          </div>
                          
                          {/* Card */}
                          {renderSquadCard(squad)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {archiveMode === 'events' && (
        <div className="space-y-6 animate-rise">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-[24px] border border-border-muted bg-surface/60 backdrop-blur-md relative overflow-hidden shadow-card">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setArchiveMode('dashboard')}
                className="p-3 rounded-xl border border-border-muted bg-surface hover:border-cyan/40 hover:bg-elevated transition-all text-text-secondary hover:text-text-primary flex items-center justify-center"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl text-text-primary tracking-[2px] uppercase leading-none">Joined Battle History</h2>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold bg-cyan/10 text-cyan border border-cyan/20 uppercase">
                    Engagement Record
                  </span>
                </div>
                <p className="font-mono text-[10px] text-text-secondary mt-1">Detailed history logs of all registered events and battles</p>
              </div>
            </div>

            {/* Archive stats */}
            <div className="flex gap-3 font-mono text-[10px]">
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">TOTAL</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">{mockJoinedEventsHistory.length}</span>
              </div>
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">LIVE BATTLES</span>
                <span className="text-sm font-bold text-red-500 mt-0.5 block">
                  {mockJoinedEventsHistory.filter(e => e.status === 'active').length}
                </span>
              </div>
              <div className="px-4 py-2 bg-surface border border-border-muted/50 rounded-xl text-center min-w-[80px] shadow-sm">
                <span className="text-text-muted block uppercase text-[8px] font-bold">COMPLETED</span>
                <span className="text-sm font-bold text-cyan mt-0.5 block">
                  {mockJoinedEventsHistory.filter(e => e.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Layout with Month Filter Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            
            {/* Left Column: Month Filter Navigation */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-3">
                <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold px-1">Filter Timeline</div>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setSelectedMonthFilter('all')}
                    className={`px-3 py-2.5 rounded-xl text-left font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between w-full flex-shrink-0 lg:flex-shrink-1 border ${
                      selectedMonthFilter === 'all'
                        ? 'bg-cyan border-cyan text-cyan-text shadow-sm'
                        : 'border-border-muted bg-surface text-text-secondary hover:text-text-primary hover:border-cyan/30'
                    }`}
                  >
                    <span>ALL TIMELINE</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${selectedMonthFilter === 'all' ? 'bg-cyan-text/10 text-cyan-text' : 'bg-base text-text-muted border border-border-muted/30'}`}>
                      {mockJoinedEventsHistory.length}
                    </span>
                  </button>

                  {getSortedMonthGroups(mockJoinedEventsHistory).map(group => (
                    <button
                      key={group.monthKey}
                      onClick={() => setSelectedMonthFilter(group.monthKey)}
                      className={`px-3 py-2.5 rounded-xl text-left font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between w-full flex-shrink-0 lg:flex-shrink-1 border ${
                        selectedMonthFilter === group.monthKey
                          ? 'bg-cyan border-cyan text-cyan-text shadow-sm'
                          : 'border-border-muted bg-surface text-text-secondary hover:text-text-primary hover:border-cyan/30'
                      }`}
                    >
                      <span>{group.monthKey}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${selectedMonthFilter === group.monthKey ? 'bg-cyan-text/10 text-cyan-text' : 'bg-base text-text-muted border border-border-muted/30'}`}>
                        {group.items.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Month Timeline list */}
            <div className="lg:col-span-9 space-y-8">
              {getSortedMonthGroups(mockJoinedEventsHistory)
                .filter(group => selectedMonthFilter === 'all' || group.monthKey === selectedMonthFilter)
                .map(group => (
                  <div key={group.monthKey} className="space-y-4">
                    {/* Month Header Banner */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black tracking-widest text-cyan uppercase bg-cyan/10 px-3 py-1.5 rounded-lg border border-cyan/20">
                        {group.monthKey}
                      </span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan/20 via-cyan/5 to-transparent" />
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
                        {group.items.length} {group.items.length === 1 ? 'Event' : 'Events'}
                      </span>
                    </div>
                    
                    {/* Interactive Vertical Timeline list */}
                    <div className="relative border-l border-border-muted/40 ml-4 pl-8 space-y-6 py-2">
                      {group.items.map((event, idx) => (
                        <div key={event.id} className="relative">
                          {/* Chrono timeline node */}
                          <div className="absolute -left-10 top-6 w-4 h-4 rounded-full border border-cyan bg-surface flex items-center justify-center shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                            {idx === 0 && selectedMonthFilter === 'all' && (
                              <div className="absolute inset-0 rounded-full animate-ping-slow bg-cyan opacity-25" />
                            )}
                          </div>
                          
                          {/* Card */}
                          {renderEventCard(event)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'registered', label: 'Registered', icon: <ClipboardList size={14} /> },
  { id: 'level',      label: 'My Level',   icon: <Crown size={14} /> },
  { id: 'rewards',    label: 'Rewards',    icon: <Gift size={14} /> },
  { id: 'missions',   label: 'Missions',   icon: <Target size={14} /> },
  { id: 'badges',     label: 'Badges',     icon: <Trophy size={14} /> },
];

export const PulseLobby: React.FC = () => {
  const [activeTab, setActiveTab] = useState('registered');
  const { currentPulse, streakDays, missions } = useGamificationStore();
  const { level } = getLevelProgress(currentPulse);

  const pendingMissions = missions.filter(m => m.completed && !m.claimed).length;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-0 pb-20 space-y-6">

      {/* ── PAGE HEADER ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2"
      >
        <div>
          <h1 className="font-display text-[32px] md:text-[40px] text-text-primary tracking-widest leading-none">
            SPORTi<span className="text-volt">X</span> PULSE
          </h1>
          <p className="font-mono text-[11px] text-text-secondary mt-1">
            Your squad ecosystem · Level {level.level} · {level.icon} {level.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elevated border border-border-muted font-mono text-sm">
            <span className="text-volt font-bold">{currentPulse}</span>
            <span className="text-text-muted">PTS</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elevated border border-orange-500/20 font-mono text-sm">
            <span className="text-orange-400">🔥 {streakDays}</span>
            <span className="text-text-muted">streak</span>
          </div>
        </div>
      </motion.div>

      {/* ── STICKY NAV TABS ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-base/90 backdrop-blur-md border-b border-border-muted/50 -mx-4 px-4 md:-mx-0 md:px-0 py-2">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-label font-semibold flex-shrink-0 transition-all ${activeTab === tab.id ? 'bg-volt text-volt-text shadow-[0_0_12px_rgba(204,255,0,0.25)]' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'}`}
            >
              {tab.icon}
              {tab.label}
              {/* Notification dots */}
              {tab.id === 'missions' && pendingMissions > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-volt text-volt-text text-[8px] font-bold flex items-center justify-center">
                  {pendingMissions}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'registered' && <RegisteredSection />}
          {activeTab === 'level'      && <LevelProgressSection />}
          {activeTab === 'rewards'    && <DailyRewardsSection />}
          {activeTab === 'missions'   && <MissionsSection />}
          {activeTab === 'badges'     && <AchievementsSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
