import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MessageCircle, Bookmark, BarChart2, Zap } from 'lucide-react';
import { MOCK_USERS, MOCK_EVENTS, SPORT_CATEGORIES } from '../../services/mockData';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import type { User } from '../../types';

const MOCK_USER_DISTANCES: Record<string, number> = {
  u1: 3.2,
  u2: 12.5,
  u3: 27.8,
  u4: 54.2,
  u5: 8.1,
  u6: 15.4,
  u7: 5.2,
  u8: 24.8,
  u9: 11.6,
  u10: 38.4,
  cu1: 0,
};

const MOCK_EVENT_DISTANCES: Record<string, number> = {
  e1: 4.8,
  e2: 18.2,
  e3: 35.5,
  e4: 82.1,
  e5: 12.4,
  e6: 22.1,
  e7: 42.6,
  e8: 68.3,
  e9: 8.5,
  e10: 14.2,
  e11: 3.1,
  e12: 55.4,
  e13: 11.2,
  e14: 28.6,
  e15: 72.1,
  e16: 9.3,
  e17: 4.5,
  e18: 1.2,
  e19: 19.5,
  e20: 34.2,
};
import { Avatar } from '../../components/ui/Avatar';
import { SportBadge, AIBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/index';
import { AnimatedPlaceholderInput } from '../../components/ui/Input';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TABS = ['Athletes', 'ClashHub', 'TheArena'];
const SEARCH_PLACEHOLDERS = ['Search athletes...', 'Find events near you...', 'Discover teams...', 'Search by sport...'];

// ─── ATHLETE CARD (Recruiter view) ─────────────────────────────────────────
const AthleteCard: React.FC<{ athlete: User; index: number }> = ({ athlete, index }) => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="glass rounded-xl overflow-hidden border border-border-muted hover:border-volt/20 transition-all group">
      {/* Cover strip */}
      <div className="h-16 relative bg-elevated overflow-hidden">
        {athlete.coverImage && <img src={athlete.coverImage} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />}
        <div className="absolute inset-0 bg-gradient-to-r from-base/80 to-transparent" />
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-label font-medium ${athlete.openToRecruit ? 'bg-volt/20 border border-volt/30 text-volt' : 'bg-surface border border-border-muted text-text-muted'}`}>
            {athlete.openToRecruit ? '● Open to Offers' : '◌ Not Available'}
          </span>
        </div>
      </div>
      <div className="p-4 -mt-6">
        <div className="flex items-end gap-3 mb-3">
          <Avatar src={athlete.avatar} name={athlete.name} sport={athlete.sport} size="lg" />
          <div className="flex-1 min-w-0 pb-1">
            <p className="font-label text-base font-semibold text-text-primary truncate">{athlete.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <SportBadge sport={athlete.sport} size="sm" />
              <span className="font-mono text-[9px] text-text-secondary">({MOCK_USER_DISTANCES[athlete.id] || 10.0} KM)</span>
            </div>
          </div>
          <div className="text-right pb-1">
            <div className="font-mono text-2xl text-volt">{athlete.stats.rating}</div>
            <div className="stat-label text-[9px]">RATING</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'MATCHES', val: athlete.stats.matches },
            { label: 'WINS', val: athlete.stats.wins },
            { label: 'YRS EXP', val: athlete.stats.yearsExperience },
          ].map(s => (
            <div key={s.label} className="bg-elevated rounded-lg p-2 text-center border border-border-muted">
              <div className="font-mono text-sm text-text-primary">{s.val}</div>
              <div className="stat-label text-[9px]">{s.label}</div>
            </div>
          ))}
        </div>
        <ProgressBar value={athlete.performanceData.technique} max={100} label="Technique" showValue />
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm" fullWidth onClick={() => navigate(`/app/profile/${athlete.id}`)}>
            View Profile
          </Button>
          <Button variant="ghost" size="sm" icon={<MessageCircle size={13} />} onClick={() => navigate('/app/messages')} />
          <Button variant="ghost" size="sm" icon={<Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />}
            onClick={() => setSaved(s => !s)} className={saved ? 'text-volt' : ''} />
        </div>
      </div>
    </motion.div>
  );
};

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────
export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Athletes');
  const [filterOpen, setFilterOpen] = useState(false);
  const { nearbyRadius } = useAISettingsStore();
  const navigate = useNavigate();

  const athletes = (query ? MOCK_USERS.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.sport.includes(query.toLowerCase())) : MOCK_USERS)
    .filter(u => u.id === 'cu1' || (MOCK_USER_DISTANCES[u.id] || 10.0) <= nearbyRadius);
  const events = (query ? MOCK_EVENTS.filter(e => e.title.toLowerCase().includes(query.toLowerCase())) : MOCK_EVENTS)
    .filter(e => (MOCK_EVENT_DISTANCES[e.id] || 15.0) <= nearbyRadius);

  const sportBreakdown = SPORT_CATEGORIES.slice(0, 6).map(s => ({
    name: s.label.slice(0, 4), count: Math.floor(Math.random() * 800 + 200), emoji: s.emoji,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl text-text-primary tracking-wide">DISCOVER</h1>
        <p className="text-text-secondary font-label text-sm mt-0.5">Find athletes, clashes & squads</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <AnimatedPlaceholderInput
            placeholders={SEARCH_PLACEHOLDERS}
            value={query} onChange={e => setQuery(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
        <Button variant="ghost" size="md" icon={<SlidersHorizontal size={16} />} onClick={() => setFilterOpen(f => !f)}>
          Filters
        </Button>
      </div>

      {/* AI Recommendation Bar */}
      <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-volt/10">
        <Zap size={16} className="text-volt flex-shrink-0" fill="currentColor" />
        <p className="text-xs font-label text-text-secondary flex-1">
          <span className="text-volt font-medium">AI recommends</span>: Based on your athletics profile — Pro Football Championship and Asia Pacific Basketball Open match your competitive level.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border-muted">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-label font-medium transition-all ${activeTab === tab ? 'bg-volt text-volt-text shadow-glow-volt-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {activeTab === 'Athletes' && (
          <motion.div key="ath" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid sm:grid-cols-2 gap-4">
              {athletes.map((a, i) => <AthleteCard key={a.id} athlete={a} index={i} />)}
            </div>
          </motion.div>
        )}
        {activeTab === 'ClashHub' && (
          <motion.div key="evt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 gap-4">
            {events.map((event, i) => {
              const sport = SPORT_CATEGORIES.find(s => s.id === event.sport);
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/app/events/${event.id}`)}
                  className="glass rounded-xl p-4 border border-border-muted hover:border-volt/20 cursor-pointer transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{sport?.emoji}</span>
                    <div>
                      <p className="font-label text-sm font-semibold text-text-primary">{event.title}</p>
                      <p className="text-xs text-text-secondary font-mono">
                        {event.location} ({MOCK_EVENT_DISTANCES[event.id] || 15.0} KM) · {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {event.aiTeamAvailable && <AIBadge />}
                </motion.div>
              );
            })}
          </motion.div>
        )}
        {activeTab === 'TheArena' && (
          <motion.div key="com" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-xl p-5">
              <h3 className="font-display text-xl text-text-primary mb-4 tracking-wide flex items-center gap-2">
                <BarChart2 size={16} className="text-volt" /> THE ARENA — SPORT BREAKDOWN
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sportBreakdown} barSize={20}>
                  <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-primary)' }} cursor={{ fill: 'var(--bg-hover)' }} formatter={(v: any) => [`${v} athletes`, 'Count']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {sportBreakdown.map((_, i) => <Cell key={i} fill="var(--accent)" fillOpacity={0.4 + i * 0.1} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {sportBreakdown.map(s => (
                  <div key={s.name} className="bg-elevated rounded-lg p-3 border border-border-muted text-center">
                    <div className="text-xl mb-1">{s.emoji}</div>
                    <div className="font-mono text-sm text-volt">{s.count.toLocaleString()}</div>
                    <div className="stat-label text-[9px] mt-0.5">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Drawer */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-surface border-l border-border-muted z-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-text-primary tracking-wide">FILTERS</h3>
              <button onClick={() => setFilterOpen(false)} className="text-text-secondary hover:text-volt">✕</button>
            </div>
            <div className="space-y-5">
              <div>
                <p className="stat-label mb-3">SPORT</p>
                <div className="grid grid-cols-2 gap-2">
                  {SPORT_CATEGORIES.slice(0, 8).map(s => (
                    <button key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-muted text-xs font-label text-text-secondary hover:border-volt/30 hover:text-text-primary transition-all">
                      <span>{s.emoji}</span>{s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="stat-label mb-3">EXPERIENCE LEVEL</p>
                {['Amateur', 'Semi-Pro', 'Professional', 'Elite'].map(l => (
                  <button key={l} className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent text-sm font-label text-text-secondary hover:border-volt/30 hover:text-text-primary transition-all mb-1">
                    {l}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => setFilterOpen(false)}>Apply Filters</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
