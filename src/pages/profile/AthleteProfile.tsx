import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MessageCircle, UserPlus, UserCheck, TrendingUp, Edit3, Zap, LogOut } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useSquadStore } from '../../store/squadStore';
import { MOCK_USERS, CURRENT_USER } from '../../services/mockData';
import type { User } from '../../types';
import { SportBadge, VerifiedBadge, RarityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Toggle, ProgressBar, CountUpNumber } from '../../components/ui/index';
import { ProfileEditDrawer } from '../../components/profile/ProfileEditDrawer';

import { useGamificationStore } from '../../store/gamificationStore';
import { SemiCircleProgress, LevelBadge } from '../../components/gamification/ProgressRing';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import { Award, Sparkles, Clock, Activity, Flame, Shield, Lock as LockIcon } from 'lucide-react';

// Performance tracking imports
import { CareerStatCard } from '../../components/performance/CareerStatCard';
import { PerformanceRadar } from '../../components/performance/PerformanceRadar';
import { MatchHistoryCard } from '../../components/performance/MatchHistoryCard';
import { useCareerStats } from '../../hooks/useCareerStats';
import { useMatchReportStore } from '../../store/matchReportStore';

const TABS = ['Overview', 'PlayerDNA', 'PeakStats', 'Highlights', 'ClashHub', 'Performance', 'GloryBoard'];

const SquadProfileWidget: React.FC = () => {
  const navigate = useNavigate();
  const { squads } = useSquadStore();
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || 'cu1';
  const squad = squads[0] || null;
  const myRole = squad?.members.find(m => m.uid === currentUserId)?.role || 'member';
  const isCaptain = squad?.captainId === currentUserId;
  const chemistry = squad?.chemistry.overall || 0;

  if (!squad) {
    return (
      <div className="p-5 rounded-[20px] border border-dashed border-border-muted text-center space-y-3">
        <div className="font-display text-[14px] text-text-secondary tracking-wider">NO ACTIVE SQUAD</div>
        <button
          onClick={() => navigate('/pulse/squad-formation')}
          className="px-5 py-2 bg-[#CCFF00] text-black font-mono text-[11px] font-bold rounded-[10px] hover:scale-105 transition-all"
        >
          Generate My Squad
        </button>
      </div>
    );
  }

  const historyItems = [
    { label: 'Joined', date: squad.createdAt, icon: '⚡' },
    { label: 'First Match Win', date: squad.matchHistory?.[2]?.date || '—', icon: '★' },
    { label: 'Chemistry 87%+', date: squad.matchHistory?.[0]?.date || '—', icon: '◆' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header Card */}
      <div className="rounded-[20px] border p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--accent-surface) 0%, var(--bg-surface) 100%)', borderColor: 'var(--accent-border)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-[18px] text-text-primary tracking-wider">{squad.name}</span>
              {isCaptain && (
                <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/30 font-mono text-[8px] text-[#FFD700] font-bold">CAPTAIN</span>
              )}
            </div>
            <div className="font-mono text-[10px] text-text-secondary">
              {squad.sport} · {squad.formation} · {squad.members.length} Members
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold" style={{ background: 'var(--volt-dim)', borderColor: 'var(--volt-mid)', color: 'var(--volt)' }}>
                {myRole.toUpperCase()}
              </span>
              <span className="font-mono text-[10px] text-text-muted">Win Rate: <span className="text-text-primary font-bold">{squad.winRate}%</span></span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/pulse/squad/${squad.squadId}`)}
            className="px-3 py-1.5 rounded-xl border border-accent/30 font-mono text-[10px] text-accent hover:bg-accent/10 transition-all flex-shrink-0"
          >
            Open Workspace
          </button>
        </div>

        {/* Chemistry Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">Team Chemistry</span>
            <span className="font-mono text-[13px] font-bold" style={{ color: chemistry >= 85 ? 'var(--accent)' : 'var(--warning)' }}>{chemistry}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${chemistry}%`, background: 'linear-gradient(90deg, var(--accent), var(--success))' }} />
          </div>
        </div>
      </div>

      {/* Squad History Timeline */}
      <div className="rounded-[16px] border border-border-muted p-4 bg-surface">
        <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-3">Squad History</div>
        <div className="space-y-3">
          {historyItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center font-mono text-[10px] text-accent flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <div className="font-mono text-[10px] text-text-primary">{item.label}</div>
                <div className="font-mono text-[9px] text-text-muted">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Matches', value: squad.matchHistory?.length || 0, color: 'var(--accent)' },
          { label: 'Wins', value: squad.matchHistory?.filter(m => m.result === 'W').length || 0, color: 'var(--cyan)' },
          { label: 'Chemistry', value: `${chemistry}%`, color: 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="rounded-[12px] p-3 border border-border-muted text-center bg-base">
            <div className="font-display text-[20px]" style={{ color: s.color }}>{s.value}</div>
            <div className="font-mono text-[9px] text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const StatItem: React.FC<{ label: string; value: number; idx: number }> = ({ label, value, idx }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="text-center">
    <div className="font-mono text-2xl font-bold text-volt">
      <CountUpNumber value={value} />
    </div>
    <div className="stat-label mt-0.5">{label}</div>
  </motion.div>
);

export const AthleteProfile: React.FC = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user: authUser, setShowLogoutConfirm } = useAuthStore();
  const { currentPulse, currentLevel, streakDays } = useGamificationStore();
  const careerStats = useCareerStats();
  const { matchHistory } = useMatchReportStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [following, setFollowing] = useState(false);
  const [openToRecruit, setOpenToRecruit] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isMe = uid === 'me' || uid === authUser?.id;

  // Always read the latest data from authStore if it's "me"
  const baseAthlete: User = isMe
    ? (authUser || CURRENT_USER)
    : (MOCK_USERS.find(u => u.id === uid) || MOCK_USERS[0]);

  const [athlete, setAthlete] = useState(baseAthlete);

  // Sync if authUser changes (after profile edit)
  useEffect(() => {
    if (isMe && authUser) setAthlete(authUser);
  }, [authUser, isMe]);

  useEffect(() => { setOpenToRecruit(athlete.openToRecruit); }, [athlete.id]);

  const radarData = [
    { subject: 'Speed', A: athlete.performanceData.speed },
    { subject: 'Strength', A: athlete.performanceData.strength },
    { subject: 'Endurance', A: athlete.performanceData.endurance },
    { subject: 'Agility', A: athlete.performanceData.agility },
    { subject: 'Technique', A: athlete.performanceData.technique },
    { subject: 'Teamwork', A: athlete.performanceData.teamwork },
  ];

  const barData = Object.entries(athlete.performanceData).map(([k, v]) => ({
    name: k.slice(0, 4).toUpperCase(), value: v,
  }));

  const overallDNA = Math.round(Object.values(athlete.performanceData).reduce((a, b) => a + b, 0) / 6);

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-4">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl bg-surface border border-border-muted/50 overflow-hidden">
          {/* Cover */}
          <div className="h-32 sm:h-48 md:h-64 relative">
            {athlete.coverImage ? (
              <img src={athlete.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-elevated" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent" />

            {/* DNA rating badge top-right */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 glass px-3 py-1.5 rounded-full border border-volt/20">
              <Zap size={12} className="text-volt" fill="currentColor" />
              <span className="font-mono text-sm font-bold text-volt">{overallDNA}</span>
              <span className="font-label text-[9px] text-text-secondary uppercase tracking-widest">DNA</span>
            </div>

            {/* Mobile/Header Logout Button (Fix 9 - Loc 2) */}
            {isMe && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-xl bg-base/80 hover:bg-red-500/20 hover:text-red-500 text-text-primary border border-border-muted backdrop-blur transition-all"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          {/* Profile info overlap section */}
          <div className="px-5 pb-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-volt/30 shadow-glow-volt-sm flex-shrink-0 z-10 bg-elevated">
                {athlete.avatar && <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />}
              </div>
              
              {/* Profile Details & Buttons */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-text-primary tracking-wide flex items-center gap-2">
                      {athlete.name.toUpperCase()}
                      <BadgeIcon level={isMe ? currentLevel : 25} size={26} />
                    </h1>
                    {athlete.isVerified && <VerifiedBadge />}
                  </div>
                  <p className="font-mono text-xs text-text-secondary mt-0.5">@{athlete.username}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {athlete.sports.map(s => <SportBadge key={s} sport={s} size="sm" />)}
                    <span className="flex items-center gap-1 text-xs text-text-secondary font-label">
                      <MapPin size={11} /> {athlete.location}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {isMe ? (
                    <Button
                      variant="ghost" size="sm"
                      icon={<Edit3 size={14} />}
                      onClick={() => setEditOpen(true)}
                      className="border border-volt/30 hover:border-volt hover:bg-volt/10 hover:text-volt transition-all"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={following ? 'ghost' : 'primary'} size="sm"
                        icon={following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        onClick={() => setFollowing(f => !f)}
                      >
                        {following ? 'Following' : 'Follow'}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<MessageCircle size={14} />}
                        onClick={() => navigate('/app/messages')}>
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT BAR ─────────────────────────────────────────────────── */}
        <div className="glass rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatItem label="MATCHES" value={athlete.stats.matches} idx={0} />
          <StatItem label="EVENTS" value={athlete.stats.events} idx={1} />
          <StatItem label="FOLLOWERS" value={athlete.stats.followers} idx={2} />
          <StatItem label="WIN RATE" value={Math.round((athlete.stats.wins / Math.max(athlete.stats.matches, 1)) * 100)} idx={3} />
        </div>

        {/* ── RECRUITER TOGGLE (self only) ─────────────────────────────── */}
        {isMe && (
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-label text-sm font-medium text-text-primary">Open to Recruiters</p>
              <p className="text-xs text-text-secondary font-label mt-0.5">Recruiters can see your profile and stats</p>
            </div>
            <Toggle checked={openToRecruit} onChange={setOpenToRecruit} />
          </div>
        )}

        {/* ── TABS ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border-muted overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 flex-1 py-2 px-3 rounded-lg text-xs font-label font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-volt text-volt-text shadow-glow-volt-sm' : 'text-text-secondary hover:text-text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>

            {/* OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="space-y-4">
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg text-text-primary tracking-wide">ABOUT</h3>
                    {isMe && (
                      <button onClick={() => setEditOpen(true)}
                        className="text-[10px] font-label text-volt hover:underline flex items-center gap-1">
                        <Edit3 size={10} /> Edit
                      </button>
                    )}
                  </div>
                  <p className="font-label text-sm text-text-secondary leading-relaxed">{athlete.bio}</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Experience', value: `${athlete.stats.yearsExperience} years` },
                      { label: 'Level', value: athlete.experienceLevel },
                      { label: 'DNA Rating', value: `${overallDNA}/100` },
                      { label: 'Win Rate', value: `${Math.round((athlete.stats.wins / Math.max(athlete.stats.matches, 1)) * 100)}%` },
                      ...(athlete.club ? [{ label: 'Current Club', value: athlete.club }] : []),
                      ...(athlete.position ? [{ label: 'Position', value: athlete.position }] : []),
                      ...(athlete.height ? [{ label: 'Height', value: athlete.height }] : []),
                      ...(athlete.weight ? [{ label: 'Weight', value: athlete.weight }] : []),
                      ...(athlete.jersey ? [{ label: 'Jersey', value: `#${athlete.jersey}` }] : []),
                      ...(athlete.preferredFoot ? [{ label: 'Preferred Hand/Foot', value: athlete.preferredFoot }] : []),
                    ].map(item => (
                      <div key={item.label} className="bg-elevated rounded-lg p-3 border border-border-muted">
                        <div className="stat-label">{item.label}</div>
                        <div className="font-mono text-sm text-text-primary mt-1 capitalize">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-text-primary tracking-wide">PERFORMANCE DNA</h3>
                    {isMe && (
                      <button onClick={() => setEditOpen(true)}
                        className="text-[10px] font-label text-volt hover:underline flex items-center gap-1">
                        <Edit3 size={10} /> Tune
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {Object.entries(athlete.performanceData).map(([k, v]) => (
                      <ProgressBar key={k} label={k.toUpperCase()} value={v} max={100} showValue />
                    ))}
                  </div>
                </div>

                {(athlete.trainingSchedule || athlete.injuryHistory) && (
                  <div className="glass rounded-xl p-5">
                    <h3 className="font-display text-lg text-white tracking-wide mb-3">ROUTINE & CONDITION</h3>
                    <div className="space-y-3 font-mono text-xs">
                      {athlete.trainingSchedule && (
                        <div className="p-3 bg-elevated rounded-lg border border-border-muted">
                          <div className="text-[9px] text-text-secondary uppercase">TRAINING SCHEDULE</div>
                          <p className="text-text-primary mt-1 leading-relaxed">{athlete.trainingSchedule}</p>
                        </div>
                      )}
                      {athlete.injuryHistory && (
                        <div className="p-3 bg-elevated rounded-lg border border-border-muted">
                          <div className="text-[9px] text-[var(--hot)] uppercase">INJURY STATUS</div>
                          <p className="text-text-primary mt-1 leading-relaxed">{athlete.injuryHistory}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── CURRENT SQUAD WIDGET ──────────────────────────────────── */}
                <SquadProfileWidget />
              </div>
            )}

            {/* PLAYER DNA */}
            {activeTab === 'PlayerDNA' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Level box & Progress Arc */}
                  <div className="glass rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden md:col-span-1 min-h-[300px]">
                    <div className="absolute top-4 left-4 font-mono text-[10px] text-accent tracking-widest font-bold uppercase">PROGRESSION</div>
                    <div className="mt-6 flex flex-col items-center">
                      <SemiCircleProgress pulse={isMe ? currentPulse : 740} size="md" />
                      <div className="mt-2">
                        <LevelBadge pulse={isMe ? currentPulse : 740} />
                      </div>
                    </div>
                  </div>

                  {/* Rank Showcase & SSR Rating */}
                  <div className="glass rounded-xl p-5 space-y-5 md:col-span-2 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[9px] text-text-secondary uppercase block">SSR Skill Rating</span>
                          <span className="font-display text-2xl text-text-primary font-black block mt-0.5">842 <span className="text-accent text-sm">PRO</span></span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[9px] text-text-secondary uppercase block">Team Chemistry</span>
                          <span className="font-display text-2xl text-success font-black block mt-0.5">91% <span className="text-text-secondary text-sm">EXCELLENT</span></span>
                        </div>
                      </div>

                      {/* Rating meters */}
                      <div className="space-y-3">
                        <ProgressBar label="Match attendance" value={96} max={100} showValue />
                        <ProgressBar label="Communication index" value={91} max={100} showValue />
                        <ProgressBar label="Squad Approval rating" value={88} max={100} showValue />
                      </div>
                    </div>

                    {/* Daily Streak Tracker & Category Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border-muted font-mono text-[11px]">
                      <div className="p-3 bg-elevated rounded-xl border border-border-muted/50 flex items-center gap-3">
                        <Flame className="text-orange-500" size={18} />
                        <div>
                          <span className="text-text-secondary text-[9px] block">DAILY STREAK</span>
                          <span className="text-text-primary font-bold block">{isMe ? streakDays : 5} Days Active</span>
                        </div>
                      </div>
                      <div className="p-3 bg-elevated rounded-xl border border-border-muted/50 flex items-center gap-3">
                        <Activity className="text-accent" size={18} />
                        <div>
                          <span className="text-text-secondary text-[9px] block">CATEGORY IDENTITY</span>
                          <span className="text-text-primary font-bold block capitalize">{athlete.sport} ({athlete.experienceLevel})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge Showcase Section (Futuristic metallic badge designs) */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-accent" />
                    <h3 className="font-display text-base text-text-primary uppercase tracking-wider">PREMIUM ESPORTS BADGE SHOWCASE</h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {[
                      { lvl: 5,  name: 'Rookie Core',   desc: 'Level 1-10 Shield' },
                      { lvl: 15, name: 'Challenger',    desc: 'Level 11-20 Silver' },
                      { lvl: 25, name: 'Contender X',   desc: 'Level 21-30 Layer' },
                      { lvl: 35, name: 'Striker Elite', desc: 'Level 31-40 Crystal' },
                      { lvl: 45, name: 'Elite Phantom', desc: 'Level 41-50 Chrome' },
                      { lvl: 55, name: 'Dominator',     desc: 'Level 51-60 Aggress' },
                      { lvl: 65, name: 'Champion Nexus',desc: 'Level 61-70 Trophy' },
                      { lvl: 75, name: 'Titan Core',    desc: 'Level 71-80 Armor' },
                      { lvl: 85, name: 'Apex Velocity', desc: 'Level 81-90 Crown' },
                      { lvl: 95, name: 'Legend Inf',    desc: 'Level 91-100 Pres' },
                      { lvl: 115,name: 'HyperNova',     desc: 'Level 111-120 Elite' },
                      { lvl: 145,name: 'Supreme GOAT',  desc: 'Level 141+ GOAT' },
                    ].map((badge) => {
                      const isUnlockedBadge = isMe ? (currentLevel >= badge.lvl) : (25 >= badge.lvl);
                      return (
                        <div 
                          key={badge.lvl} 
                          className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all relative ${
                            isUnlockedBadge 
                              ? 'bg-elevated border-accent/15' 
                              : 'bg-base/30 border-border-muted/20 opacity-40'
                          }`}
                        >
                          <BadgeIcon level={badge.lvl} size={42} animate={isUnlockedBadge} glow={isUnlockedBadge} />
                          <div className="font-mono text-[9px]">
                            <span className="text-text-primary font-bold block truncate">{badge.name}</span>
                            <span className="text-text-secondary text-[8px] block mt-0.5 uppercase tracking-wide">LVL {badge.lvl}</span>
                          </div>
                          {!isUnlockedBadge && (
                            <div className="absolute top-2 right-2 bg-base/60 p-0.5 rounded-full">
                              <LockIcon size={10} className="text-text-muted" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MVP & Leadership Statistics */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-accent" />
                    <h3 className="font-display text-base text-text-primary uppercase tracking-wider">MVP & LEADERSHIP STATISTICS</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: 'MVP TITLES', value: '4 Times', desc: 'Top overall performance' },
                      { title: 'ATTENDANCE', value: '98.2%', desc: 'Consistency & reliability' },
                      { title: 'COMMUNICATION', value: 'A+ Rating', desc: 'Tactical block approval' },
                      { title: 'SQUAD RETENTION', value: '92.4%', desc: 'Teammates vote to keep' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 bg-elevated border border-border-muted/50 rounded-xl font-mono text-[10px]">
                        <span className="text-text-secondary text-[9px] uppercase tracking-wider block">{stat.title}</span>
                        <span className="text-accent font-black text-lg block mt-1">{stat.value}</span>
                        <p className="text-text-muted text-[8px] mt-1 leading-snug">{stat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievement Timeline */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-accent" />
                    <h3 className="font-display text-base text-text-primary uppercase tracking-wider">ATHLETE PROGRESSION TIMELINE</h3>
                  </div>
                  <div className="space-y-4 font-mono text-[11px] relative pl-4 border-l border-border-muted/50">
                    {[
                      { date: '2026-05-18', title: 'Unlocked Striker Elite', desc: 'Reached level 35 milestone reward' },
                      { date: '2026-05-12', title: 'Formed Team "Iron Pulse FC"', desc: 'Accepted AI squad matching generation result' },
                      { date: '2026-05-02', title: 'Unlocked Contender X', desc: 'Milestone reached with 2,000 Pulse Points' },
                      { date: '2026-04-15', title: 'Registered Profile on SPORTiX', desc: 'Initialized PlayerDNA bio & category details' },
                    ].map((item, i) => (
                      <div key={i} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-base shadow-glow-volt-sm" />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-accent font-bold uppercase">{item.title}</span>
                          <span className="text-text-muted">{item.date}</span>
                        </div>
                        <p className="text-text-secondary text-[10px] leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Squad History */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    <h3 className="font-display text-base text-text-primary uppercase tracking-wider">AI SQUAD MATCHMAKING HISTORY</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    {[
                      { name: 'Iron Pulse FC', sport: 'Football', chemistry: '87%', status: 'Active accepted squad', winRate: '74%' },
                      { name: 'Tokyo 3v3 Stars', sport: 'Basketball', chemistry: '90%', status: 'Disbanded historical', winRate: '60%' },
                    ].map((squad, i) => (
                      <div key={i} className="p-4 bg-elevated border border-border-muted/60 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-text-primary font-bold block">{squad.name}</span>
                          <span className="text-text-secondary text-[9px] uppercase block mt-1">{squad.sport} · {squad.winRate} WR</span>
                        </div>
                        <div className="text-right">
                          <span className="text-success font-bold block">{squad.chemistry} Chem</span>
                          <span className="text-text-muted text-[8px] uppercase block mt-1">{squad.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PEAK STATS */}
            {activeTab === 'PeakStats' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass rounded-xl p-5">
                  <h3 className="font-display text-base text-text-primary mb-4 tracking-wide">DNA RADAR</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'Space Grotesk' }} />
                      <Radar dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass rounded-xl p-5">
                  <h3 className="font-display text-base text-text-primary mb-4 tracking-wide">ATTRIBUTE BARS</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barSize={14}>
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-primary)' }} cursor={{ fill: 'var(--bg-hover)' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill="var(--accent)" fillOpacity={0.5 + i * 0.08} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Full stat breakdown */}
                <div className="md:col-span-2 glass rounded-xl p-5">
                  <h3 className="font-display text-base text-text-primary mb-4 tracking-wide">CAREER RECORD</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { label: 'MATCHES', val: athlete.stats.matches },
                      { label: 'WINS', val: athlete.stats.wins },
                      { label: 'LOSSES', val: athlete.stats.losses },
                      { label: 'EVENTS', val: athlete.stats.events },
                      { label: 'FOLLOWERS', val: athlete.stats.followers.toLocaleString() },
                      { label: 'YRS EXP', val: athlete.stats.yearsExperience },
                    ].map(s => (
                      <div key={s.label} className="bg-elevated rounded-lg p-3 border border-border-muted text-center">
                        <div className="font-mono text-lg font-bold text-volt">{s.val}</div>
                        <div className="stat-label text-[9px] mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HIGHLIGHTS */}
            {activeTab === 'Highlights' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} className="aspect-square rounded-xl overflow-hidden bg-elevated border border-border-muted relative group cursor-pointer">
                    <img src={`https://images.unsplash.com/photo-${['1574629810360-7efbbe195018', '1546519638-68e109498ffc', '1567427017947-545c5f8d16ad', '1544367567-0f2fcb009e0b', '1547941126-3d5322b218b0', '1431324155629-1a6deb1dec8d'][i % 6]}?w=300&q=60`} alt="highlight" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-base/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <TrendingUp size={24} className="text-volt" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* CLASH HUB (Events) */}
            {activeTab === 'ClashHub' && (
              <div className="glass rounded-xl p-5 text-center">
                <p className="font-mono text-text-secondary text-sm">No event history yet</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/app/events')}>Browse ClashHub</Button>
              </div>
            )}

            {/* PERFORMANCE */}
            {activeTab === 'Performance' && (
              <div className="space-y-5">
                {/* Career stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <CareerStatCard icon="⚽" value={careerStats.football?.totalGoals ?? 0} label="Total Goals"  trend="+2 this month" trendUp index={0} />
                  <CareerStatCard icon="🏆" value={`${careerStats.winRate}%`}             label="Win Rate"    trend="+5%"          trendUp index={1} />
                  <CareerStatCard icon="⚡" value={careerStats.totalPulseEarned}           label="Pulse"       trend="+91 today"    trendUp index={2} />
                  <CareerStatCard icon="👑" value={careerStats.football?.mvpCount ?? 0}   label="MVP Titles" trend="1 recent"     trendUp index={3} color="#FBBF24" />
                </div>

                {/* Radar */}
                <div className="glass rounded-xl p-5">
                  <h3 className="font-display text-base text-text-primary tracking-wide mb-3">PERFORMANCE RADAR</h3>
                  <PerformanceRadar sport="football" size="md" />
                </div>

                {/* Match history preview */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base text-text-primary tracking-wide">RECENT MATCHES</h3>
                    <button
                      onClick={() => navigate('/app/clashhub/history')}
                      className="font-mono text-[12px]"
                      style={{ color: 'var(--accent)' }}
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {matchHistory.slice(0, 3).map((match, i) => (
                      <MatchHistoryCard key={match.id} match={match} compact index={i} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GLORY BOARD (Achievements) */}
            {activeTab === 'GloryBoard' && (
              <div className="grid md:grid-cols-2 gap-3">
                {athlete.achievements.map((achievement, i) => (
                  <motion.div key={achievement.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass rounded-xl p-4 flex items-center gap-4 border border-border-muted hover:border-volt/20 transition-all">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-label text-sm font-semibold text-text-primary truncate">{achievement.title}</p>
                        <RarityBadge rarity={achievement.rarity} />
                      </div>
                      <p className="text-xs text-text-secondary font-label mt-0.5">{achievement.description}</p>
                      <p className="text-[10px] font-mono text-text-muted mt-1">{new Date(achievement.date).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Profile Edit Drawer */}
      <AnimatePresence>
        {editOpen && (
          <ProfileEditDrawer
            athlete={athlete}
            onClose={() => setEditOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
