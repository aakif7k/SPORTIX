import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MessageCircle, UserPlus, UserCheck, Settings, Trophy, TrendingUp, Star, Shield } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { MOCK_USERS, CURRENT_USER } from '../../services/mockData';
import type { User } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { SportBadge, VerifiedBadge, RarityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Toggle, ProgressBar, CountUpNumber } from '../../components/ui/index';

const TABS = ['Overview', 'PeakStats', 'Highlights', 'ClashHub', 'GloryBoard'];

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
  const [activeTab, setActiveTab] = useState('Overview');
  const [following, setFollowing] = useState(false);
  const [openToRecruit, setOpenToRecruit] = useState(false);

  const isMe = uid === 'me';
  const athlete: User = isMe ? CURRENT_USER : (MOCK_USERS.find(u => u.id === uid) || MOCK_USERS[0]);
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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-48 md:h-64 relative">
          {athlete.coverImage ? (
            <img src={athlete.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-elevated" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent" />
        </div>

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-volt/30 shadow-glow-volt-sm flex-shrink-0">
              {athlete.avatar && <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide">{athlete.name.toUpperCase()}</h1>
                {athlete.isVerified && <VerifiedBadge />}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {athlete.sports.map(s => <SportBadge key={s} sport={s} size="sm" />)}
                <span className="flex items-center gap-1 text-xs text-text-secondary font-label">
                  <MapPin size={11} /> {athlete.location}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isMe ? (
                <Button variant="ghost" size="sm" icon={<Settings size={14} />}>Edit</Button>
              ) : (
                <>
                  <Button variant={following ? 'ghost' : 'primary'} size="sm"
                    icon={following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    onClick={() => setFollowing(f => !f)}>
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

      {/* Stat Bar */}
      <div className="glass rounded-xl p-5 grid grid-cols-4 gap-4">
        <StatItem label="MATCHES" value={athlete.stats.matches} idx={0} />
        <StatItem label="EVENTS" value={athlete.stats.events} idx={1} />
        <StatItem label="FOLLOWERS" value={athlete.stats.followers} idx={2} />
        <StatItem label="WIN RATE" value={Math.round((athlete.stats.wins / athlete.stats.matches) * 100)} idx={3} />
      </div>

      {/* Open to Recruit Toggle (visible to recruiters on others' profiles) */}
      {isMe && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-label text-sm font-medium text-white">Open to Recruiters</p>
            <p className="text-xs text-text-secondary font-label mt-0.5">Recruiters can see your profile and stats</p>
          </div>
          <Toggle checked={openToRecruit} onChange={setOpenToRecruit} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border-muted">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-label font-medium transition-all ${activeTab === tab ? 'bg-volt text-black shadow-glow-volt-sm' : 'text-text-secondary hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <h3 className="font-display text-lg text-white mb-3 tracking-wide">ABOUT</h3>
                <p className="font-label text-sm text-text-secondary leading-relaxed">{athlete.bio}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Experience', value: `${athlete.stats.yearsExperience} years` },
                    { label: 'Level', value: athlete.experienceLevel },
                    { label: 'Rating', value: `${athlete.stats.rating}/100` },
                    { label: 'Win Rate', value: `${Math.round((athlete.stats.wins / athlete.stats.matches) * 100)}%` },
                  ].map(item => (
                    <div key={item.label} className="bg-elevated rounded-lg p-3 border border-border-muted">
                      <div className="stat-label">{item.label}</div>
                      <div className="font-mono text-sm text-white mt-1 capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <h3 className="font-display text-lg text-white mb-4 tracking-wide">PERFORMANCE</h3>
                <div className="space-y-3">
                  {Object.entries(athlete.performanceData).map(([k, v]) => (
                    <ProgressBar key={k} label={k.toUpperCase()} value={v} max={100} showValue />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PeakStats' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-5">
                <h3 className="font-display text-base text-white mb-4 tracking-wide">RADAR CHART</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2A2A2A" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontFamily: 'Space Grotesk' }} />
                    <Radar dataKey="A" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-xl p-5">
                <h3 className="font-display text-base text-white mb-4 tracking-wide">ATTRIBUTE BARS</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barSize={14}>
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 11 }} cursor={{ fill: 'rgba(204,255,0,0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={`rgba(204,255,0,${0.5 + i * 0.08})`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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

          {activeTab === 'GloryBoard' && (
            <div className="grid md:grid-cols-2 gap-3">
              {athlete.achievements.map((achievement, i) => (
                <motion.div key={achievement.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass rounded-xl p-4 flex items-center gap-4 border border-border-muted hover:border-volt/20 transition-all">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-label text-sm font-semibold text-white truncate">{achievement.title}</p>
                      <RarityBadge rarity={achievement.rarity} />
                    </div>
                    <p className="text-xs text-text-secondary font-label mt-0.5">{achievement.description}</p>
                    <p className="text-[10px] font-mono text-text-muted mt-1">{new Date(achievement.date).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'ClashHub' && (
            <div className="glass rounded-xl p-5 text-center">
              <p className="font-mono text-text-secondary text-sm">No event history yet</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/app/events')}>Browse ClashHub</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
