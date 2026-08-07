import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, MessageCircle, UserPlus, UserCheck, TrendingUp, Edit3, Zap, 
  Activity, Flame, Shield, Trophy, CheckCircle2
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useSquadStore } from '../../store/squadStore';
import { getProfile, profileToUserShape } from '../../services/profileService';
import type { User } from '../../types';
import { VerifiedBadge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/index';
import { ProfileEditDrawer } from '../../components/profile/ProfileEditDrawer';

const TABS = ['Overview', 'PlayerDNA', 'Peak Stats', 'Match History', 'Glory Board'];

export const AthleteProfile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);

  const isMe = !uid || uid === 'me' || uid === 'my-profile' || uid === authUser?.id;
  const targetId = isMe ? authUser?.id : uid;

  const [profileUser, setProfileUser] = useState<User | null>(
    isMe && authUser ? (authUser as unknown as User) : null
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isConnected, setIsConnected] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openToRecruit, setOpenToRecruit] = useState(true);

  const { squads } = useSquadStore();
  const userSquad = squads[0] || null;

  // ── Fetch profile from Appwrite ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    if (isMe && authUser) {
      setProfileUser(authUser as unknown as User);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    const lookupId = targetId || authUser?.id || uid;

    if (!lookupId) {
      setProfileLoading(false);
      if (!authUser) setProfileError('Please sign in to view your profile.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    getProfile(lookupId)
      .then(appwriteProfile => {
        if (isMounted) {
          if (appwriteProfile) {
            setProfileUser(profileToUserShape(appwriteProfile) as unknown as User);
            setProfileError(null);
          } else if (authUser) {
            setProfileUser(authUser as unknown as User);
            setProfileError(null);
          } else {
            setProfileError('Athlete profile not found.');
          }
        }
      })
      .catch(err => {
        console.error('[AthleteProfile] fetch error:', err);
        if (isMounted) {
          if (authUser) {
            setProfileUser(authUser as unknown as User);
            setProfileError(null);
          } else {
            setProfileError('Failed to load profile. Please try again.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [uid, authUser, isMe, targetId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-text-muted">Loading PlayerDNA Profile...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (profileError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-white">
        <Shield size={48} className="text-red-400 opacity-60" />
        <p className="font-mono text-sm text-red-400">{profileError}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/20 transition"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-text-muted">Loading PlayerDNA Profile...</p>
      </div>
    );
  }

  const userStatsAny = (profileUser.stats || {}) as any;

  const radarData = [
    { subject: 'Pace', A: userStatsAny.pace || 88, fullMark: 100 },
    { subject: 'Shooting', A: userStatsAny.shooting || 82, fullMark: 100 },
    { subject: 'Passing', A: userStatsAny.passing || 85, fullMark: 100 },
    { subject: 'Dribbling', A: userStatsAny.dribbling || 90, fullMark: 100 },
    { subject: 'Defense', A: userStatsAny.defense || 74, fullMark: 100 },
    { subject: 'Physical', A: userStatsAny.physicality || 86, fullMark: 100 },
  ];

  const matchPerformanceData = [
    { match: 'VS Titans', rating: 8.8 },
    { match: 'VS Apex', rating: 9.2 },
    { match: 'VS Phantom', rating: 8.5 },
    { match: 'VS Velocity', rating: 9.5 },
    { match: 'VS Knights', rating: 9.0 },
  ];

  return (
    <article className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* ── HERO BANNER & AVATAR HEADER ────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-surface border border-border-muted/80 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        {/* Cover Photo */}
        <div className="h-44 sm:h-60 relative overflow-hidden bg-gradient-to-r from-[#101500] via-[#0A1015] to-[#150A15]">
          <img 
            src="https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1200&q=80" 
            alt="Cover background" 
            className="w-full h-full object-cover opacity-35 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
          
          {/* Top Right Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-[10px] font-bold text-[#CCFF00] backdrop-blur flex items-center gap-1">
              <Zap size={12} /> SSR: 94.8 PEAK
            </span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <img 
                  src={profileUser.avatar || 'https://i.pravatar.cc/150?img=33'} 
                  alt={profileUser.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-[#0C0C0C] shadow-2xl bg-elevated"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#CCFF00] ring-4 ring-[#0C0C0C] flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-black" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    {profileUser.name}
                  </h1>
                  <VerifiedBadge />
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 font-mono text-xs text-text-secondary">
                  <span className="text-[#CCFF00] font-bold">@{profileUser.username || 'athlete'}</span>
                  <span>•</span>
                  <span>{profileUser.sport || 'Multi-Sport'}</span>
                  {profileUser.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {profileUser.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
              {isMe ? (
                <button
                  onClick={() => setEditOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsConnected(!isConnected)}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isConnected 
                        ? 'bg-surface border border-border-muted text-text-secondary' 
                        : 'bg-[#CCFF00] text-black hover:bg-[#b8e600]'
                    }`}
                  >
                    {isConnected ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>

                  <button
                    onClick={() => navigate(`/app/messages?user=${profileUser.id}`)}
                    className="px-4 py-2.5 rounded-xl bg-elevated border border-white/10 hover:border-[#CCFF00]/40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#121212]/80 border border-white/5">
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Matches Played</p>
              <p className="text-xl font-black text-white">{profileUser.stats?.matches || 48}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Win Rate</p>
              <p className="text-xl font-black text-[#CCFF00]">78%</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Pulse Level</p>
              <p className="text-xl font-black text-[#00D4FF]">Level {profileUser.level || 41}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Global Rank</p>
              <p className="text-xl font-black text-white">#142</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECRUITMENT STATUS BAR ────────────────────────────────────────── */}
      {isMe && (
        <div className="p-4 rounded-2xl bg-surface border border-border-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
              <Flame size={18} />
            </div>
            <div>
              <p className="font-sans font-bold text-xs text-white">Open for Squad Scouting & Matches</p>
              <p className="font-mono text-[10px] text-text-muted">Allow tournament captains to view your PlayerDNA radar</p>
            </div>
          </div>
          <Toggle checked={openToRecruit} onChange={setOpenToRecruit} />
        </div>
      )}

      {/* ── TAB NAVIGATION ────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-surface rounded-2xl p-1.5 border border-border-muted overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[110px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT SECTIONS ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: About & Bio */}
              <div className="md:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
                  <h2 className="font-sans font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-[#CCFF00]" /> Athlete Bio & Scouting Profile
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {profileUser.bio || 'Versatile striker & offensive playmaker specializing in fast break execution, tactical pressing, and set-piece creation. Looking for competitive squad opportunities.'}
                  </p>

                  {/* Physical Specs Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-elevated/50 border border-white/5">
                      <p className="font-mono text-[9px] text-text-muted uppercase">Height</p>
                      <p className="font-mono text-xs font-bold text-white">185 cm</p>
                    </div>
                    <div className="p-3 rounded-xl bg-elevated/50 border border-white/5">
                      <p className="font-mono text-[9px] text-text-muted uppercase">Weight</p>
                      <p className="font-mono text-xs font-bold text-white">78 kg</p>
                    </div>
                    <div className="p-3 rounded-xl bg-elevated/50 border border-white/5">
                      <p className="font-mono text-[9px] text-text-muted uppercase">Foot</p>
                      <p className="font-mono text-xs font-bold text-[#CCFF00]">Right</p>
                    </div>
                  </div>
                </div>

                {/* Performance Radar Mini */}
                <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
                  <h2 className="font-sans font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00D4FF]" /> PlayerDNA Attribute Distribution
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} />
                        <Radar name={profileUser.name} dataKey="A" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: Squad Status */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
                  <h2 className="font-sans font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield size={16} className="text-[#CCFF00]" /> Active Squad
                  </h2>
                  {userSquad ? (
                    <div className="p-4 rounded-2xl bg-[#141414] border border-[#CCFF00]/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-sm text-white">{userSquad.name}</span>
                        <span className="font-mono text-[10px] text-[#CCFF00] font-bold px-2 py-0.5 rounded-full bg-[#CCFF00]/10">
                          {userSquad.sport}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-text-muted">Formation: {userSquad.formation}</p>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                        <span className="text-text-muted">Squad Chemistry</span>
                        <span className="text-[#CCFF00] font-bold">{userSquad.chemistry.overall}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <p className="font-mono text-xs text-text-muted">No active squad assigned</p>
                      <button
                        onClick={() => navigate('/pulse/matchmaking')}
                        className="px-4 py-2 bg-[#CCFF00] text-black font-mono font-bold text-xs rounded-xl uppercase tracking-wider"
                      >
                        AutoSquad Match
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* PLAYERDNA RADAR TAB */}
          {activeTab === 'PlayerDNA' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-muted space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider">Comprehensive Attribute Radar</h2>
                  <p className="font-mono text-xs text-text-muted">Algorithmic rating calculated from tournament match performance</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-xs font-bold text-[#CCFF00]">
                  SSR: 94.8
                </span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#FFF', fontSize: 13, fontFamily: 'Urbanist' }} />
                    <Radar name={profileUser.name} dataKey="A" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {radarData.map(item => (
                  <div key={item.subject} className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between">
                    <span className="font-mono text-xs text-text-muted">{item.subject}</span>
                    <span className="font-mono text-sm font-bold text-[#CCFF00]">{item.A}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PEAK STATS TAB */}
          {activeTab === 'Peak Stats' && (
            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-6">
              <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider">Career Performance Trends</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matchPerformanceData}>
                    <XAxis dataKey="match" tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#101010', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="rating" fill="#CCFF00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* MATCH HISTORY TAB */}
          {activeTab === 'Match History' && (
            <div className="space-y-4">
              {[
                { vs: 'VS Iron Titans', score: '3 - 1', result: 'WIN', mvp: true, date: '2 days ago' },
                { vs: 'VS Cyber Knights', score: '2 - 2', result: 'DRAW', mvp: false, date: '5 days ago' },
                { vs: 'VS Apex Predators', score: '4 - 0', result: 'WIN', mvp: true, date: '1 week ago' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-surface border border-border-muted flex items-center justify-between">
                  <div>
                    <p className="font-sans font-bold text-sm text-white">{m.vs}</p>
                    <p className="font-mono text-xs text-text-muted">{m.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-white">{m.score}</span>
                    <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${m.result === 'WIN' ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-white/10 text-white'}`}>
                      {m.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GLORY BOARD TAB */}
          {activeTab === 'Glory Board' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Golden Boot', desc: 'Top scorer in Spring Cup', rarity: 'Gold', color: '#FFD700' },
                { title: 'MVP Award', desc: 'Match rating > 9.0 (5x)', rarity: 'Platinum', color: '#E5E4E2' },
                { title: 'Squad Leader', desc: 'Captained 10 victories', rarity: 'Obsidian', color: '#CCFF00' },
                { title: 'Streak Master', desc: '8 match win streak', rarity: 'Silver', color: '#C0C0C0' },
              ].map((b, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface border border-border-muted space-y-2 text-center">
                  <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-elevated border border-white/10 text-white">
                    <Trophy size={22} style={{ color: b.color }} />
                  </div>
                  <p className="font-sans font-bold text-xs text-white">{b.title}</p>
                  <p className="font-mono text-[10px] text-text-muted">{b.desc}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Drawer Modal */}
      {isMe && editOpen && (
        <ProfileEditDrawer athlete={profileUser} onClose={() => setEditOpen(false)} />
      )}
    </article>
  );
};
