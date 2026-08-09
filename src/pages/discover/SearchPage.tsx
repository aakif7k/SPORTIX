import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, MessageCircle, Bookmark, BarChart2, Zap, MapPin, UserX, AlertCircle, CheckCircle2
} from 'lucide-react';
import { MOCK_EVENTS, SPORT_CATEGORIES } from '../../services/mockData';
import { useProfiles } from '../../hooks/useProfiles';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = ['Athletes', 'ClashHub Events', 'The Arena Stats'];

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Athletes');
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedUserIds, setSavedUserIds] = useState<string[]>([]);

  // ── Filter states ──────────────────────────────────────────────────────────
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [openToRecruitOnly, setOpenToRecruitOnly] = useState<boolean>(false);
  const [locationQuery, setLocationQuery] = useState<string>('');

  const toggleSaveUser = (id: string) => {
    setSavedUserIds(prev => prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]);
  };

  const filters = useMemo(() => ({
    sport: selectedSport === 'all' ? undefined : selectedSport,
    experienceLevel: selectedLevel === 'all' ? undefined : selectedLevel,
    openToRecruit: openToRecruitOnly ? true : undefined,
    location: locationQuery.trim() || undefined,
  }), [selectedSport, selectedLevel, openToRecruitOnly, locationQuery]);

  // ── Appwrite profile data ───────────────────────────────────────────────
  const { profiles: athletes, loading: athletesLoading, error: athletesError, isEmpty } = useProfiles(query, filters);

  // Events search
  const events = query
    ? MOCK_EVENTS.filter(e => e.title.toLowerCase().includes(query.toLowerCase()) || e.sport.toLowerCase().includes(query.toLowerCase()))
    : MOCK_EVENTS;

  const sportAnalytics = SPORT_CATEGORIES.slice(0, 6).map(s => ({
    name: s.label,
    count: Math.floor(Math.random() * 600 + 300),
    emoji: s.emoji,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 text-text-primary">
      
      {/* ── DISCOVER HERO BANNER ────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-surface border border-border-muted shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#00D4FF]/15 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 font-mono text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest">
            <Zap size={12} /> AI ATHLETE DISCOVERY
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-text-primary">
            DISCOVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#A855F7] to-[#CCFF00]">TALENT & CLASHES</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg font-sans">
            Connect with verified athletes, scout competitive players for your squad, and explore live tournament brackets.
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER INPUT BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search athletes by name, username, sport, city, country, or skill level..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface border border-border-muted text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#00D4FF]/50 font-mono transition-all"
          />
        </div>

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            filterOpen ? 'bg-[#00D4FF] text-black border-[#00D4FF]' : 'bg-elevated border-border-muted hover:border-[#00D4FF]/40 text-text-primary'
          }`}
        >
          <SlidersHorizontal size={15} className={filterOpen ? 'text-black' : 'text-[#00D4FF]'} /> Filter Criteria
        </button>
      </div>

      {/* ── FILTER CRITERIA PANEL ────────────────────────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-surface border border-border-muted space-y-4 font-mono text-xs overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border-muted pb-3">
              <h3 className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-[#00D4FF]" /> Appwrite Filter Panel
              </h3>
              <button
                onClick={() => {
                  setSelectedSport('all');
                  setSelectedLevel('all');
                  setOpenToRecruitOnly(false);
                  setLocationQuery('');
                }}
                className="text-[10px] text-[#00D4FF] hover:underline"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-text-muted block mb-1 font-bold">Sport Category</label>
                <select
                  value={selectedSport}
                  onChange={e => setSelectedSport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-muted text-text-primary focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="all">All Sports</option>
                  <option value="Football">Football / Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Padel">Padel</option>
                  <option value="Running">Running</option>
                </select>
              </div>

              <div>
                <label className="text-text-muted block mb-1 font-bold">Skill Level</label>
                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-muted text-text-primary focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner / Rookie</option>
                  <option value="amateur">Amateur</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="text-text-muted block mb-1 font-bold">City / Location</label>
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-muted text-text-primary focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="recruitOnly"
                checked={openToRecruitOnly}
                onChange={e => setOpenToRecruitOnly(e.target.checked)}
                className="rounded accent-[#00D4FF]"
              />
              <label htmlFor="recruitOnly" className="text-text-secondary cursor-pointer">
                Only show athletes open to squad recruitment
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── NAVIGATION TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none bg-surface p-1.5 rounded-2xl border border-border-muted font-mono text-xs">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT RESULTS ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* ATHLETES TAB */}
        {activeTab === 'Athletes' && (
          <motion.div key="ath" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Loading */}
            {athletesLoading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin" />
                <p className="font-mono text-xs text-text-muted">Scouting athletes from Appwrite...</p>
              </div>
            )}

            {/* Error */}
            {!athletesLoading && athletesError && (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <AlertCircle size={40} className="text-red-400 opacity-60" />
                <p className="font-mono text-xs text-red-400">{athletesError}</p>
              </div>
            )}

            {/* Empty */}
            {!athletesLoading && !athletesError && isEmpty && (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <UserX size={40} className="text-text-muted opacity-60" />
                <p className="font-mono text-xs text-text-muted">
                  {query ? `No athletes found matching "${query}"` : 'No registered athletes found in Appwrite database.'}
                </p>
              </div>
            )}

            {/* Results */}
            {!athletesLoading && !athletesError && athletes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {athletes.map(athlete => {
                  const isSaved = savedUserIds.includes(athlete.id);
                  return (
                    <motion.div
                      key={athlete.id}
                      whileHover={{ y: -4 }}
                      className="rounded-3xl overflow-hidden bg-surface border border-border-muted p-5 space-y-4 shadow-xl transition-all hover:border-[#00D4FF]/40 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={athlete.avatar_url || `https://i.pravatar.cc/150?u=${athlete.id}`}
                                alt={athlete.full_name}
                                className="w-14 h-14 rounded-2xl object-cover border border-[#00D4FF]/40 shadow-md bg-elevated"
                              />
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#CCFF00] ring-2 ring-surface flex items-center justify-center text-[9px] font-black text-black">
                                <CheckCircle2 size={10} className="text-black" />
                              </span>
                            </div>
                            <div>
                              <h3 className="font-sans font-bold text-base text-text-primary">{athlete.full_name}</h3>
                              <div className="flex items-center gap-2 font-mono text-[11px] text-[#00D4FF]">
                                <span>@{athlete.username || 'athlete'}</span>
                                <span>•</span>
                                <span className="capitalize">{athlete.sport || 'Multi-Sport'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-xs text-text-muted uppercase block">PULSE</span>
                            <span className="text-lg font-black text-[#CCFF00]">{athlete.pulse_score ?? 100}</span>
                          </div>
                        </div>

                        {athlete.location && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                            <MapPin size={11} className="text-[#00D4FF]" />
                            <span>{athlete.location}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-elevated border border-border-muted text-center font-mono">
                          <div>
                            <p className="text-[9px] text-text-muted uppercase">Sport</p>
                            <p className="text-xs font-bold text-text-primary capitalize truncate">{athlete.sport || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-text-muted uppercase">Level</p>
                            <p className="text-xs font-bold text-[#00D4FF] capitalize">{athlete.experience_level || `Lvl ${athlete.level}`}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-text-muted uppercase">Open</p>
                            <p className="text-xs font-bold text-[#CCFF00]">{athlete.is_open_to_recruit ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border-muted">
                        <button
                          onClick={() => navigate(`/app/profile/${athlete.id}`)}
                          className="flex-1 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-[#1ad8ff] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          View PlayerDNA
                        </button>
                        <button
                          onClick={() => navigate(`/app/messages?user=${athlete.id}`)}
                          className="p-2.5 rounded-xl bg-elevated border border-border-muted hover:border-border-muted text-text-primary transition-all"
                          title="Message"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          onClick={() => toggleSaveUser(athlete.id)}
                          className={`p-2.5 rounded-xl border transition-all ${isSaved ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-border-muted text-text-primary'}`}
                          title="Bookmark Athlete"
                        >
                          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* CLASHHUB EVENTS TAB */}
        {activeTab === 'ClashHub Events' && (
          <motion.div key="evt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => navigate(`/app/events/${event.id}`)}
                className="p-5 rounded-3xl bg-surface border border-border-muted hover:border-[#00D4FF]/40 cursor-pointer transition-all space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between font-mono text-xs text-[#00D4FF]">
                  <span>{event.sport.toUpperCase()}</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <h3 className="font-sans font-bold text-base text-text-primary uppercase">{event.title}</h3>
                <p className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                  <MapPin size={12} /> {event.location}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* THE ARENA STATS TAB */}
        {activeTab === 'The Arena Stats' && (
          <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-muted space-y-6">
              <h3 className="font-sans font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 size={18} className="text-[#00D4FF]" /> The Arena — Global Sports Breakdown
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sportAnalytics}>
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#101010', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="count" fill="#00D4FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
