import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, MessageCircle, Bookmark, BarChart2, Zap, MapPin
} from 'lucide-react';
import { useDiscover, useSportBreakdown } from '@/hooks/useDiscover';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

const TABS = ['Athletes', 'ClashHub Events', 'The Arena Stats'];

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Athletes');
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedUserIds, setSavedUserIds] = useState<string[]>([]);

  const toggleSaveUser = (id: string) => {
    setSavedUserIds(prev => prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]);
  };

  // Searching happens on the server: this filtered eight fixtures in the browser
  // and so could never find a real athlete. With no query the API returns
  // suggested athletes and upcoming events rather than nothing.
  const {
    athletes, athletesLoading, athletesError, refreshAthletes,
    events, eventsLoading, eventsError, refreshEvents, searching,
  } = useDiscover(query);
  const {
    breakdown: sportAnalytics, loading: breakdownLoading,
    error: breakdownError, refresh: refreshBreakdown,
  } = useSportBreakdown();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 text-white">
      
      {/* ── DISCOVER HERO BANNER ────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-gradient-to-br from-[#05141A] via-[#0A0A0A] to-[#120A1A] border border-[#00D4FF]/25 shadow-[0_0_50px_rgba(0,212,255,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 font-mono text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest">
            <Zap size={12} /> AI ATHLETE DISCOVERY
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
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
            placeholder="Search athletes by name, sport, or location..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface border border-border-muted text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#00D4FF]/50 font-mono transition-all"
          />
        </div>

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-elevated border border-white/10 hover:border-[#00D4FF]/40 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          <SlidersHorizontal size={15} className="text-[#00D4FF]" /> Filter Criteria
        </button>
      </div>

      {/* ── AI RECOMMENDATION STRIP ──────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00D4FF]/10 via-[#0A0A0A] to-transparent border border-[#00D4FF]/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/20 border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF] flex-shrink-0">
          <Zap size={16} />
        </div>
        <p className="font-mono text-xs text-text-secondary flex-1">
          <span className="text-[#00D4FF] font-bold">AI Scouting Recommendation:</span> 84% compatible strikers and defenders actively looking for squad offers near your area.
        </p>
      </div>

      {/* ── NAVIGATION TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none bg-surface p-1.5 rounded-2xl border border-border-muted">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                : 'text-text-muted hover:text-white'
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
          <motion.div key="ath" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {athletesLoading ? (
              <SkeletonCards label="Loading athletes" />
            ) : athletesError ? (
              <ResultError message={athletesError.message} onRetry={() => refreshAthletes()} />
            ) : athletes.length === 0 ? (
              <EmptyResult
                title={searching ? 'No athletes found' : 'No athletes to suggest yet'}
                detail={searching
                  ? 'Try a different name, handle or sport.'
                  : 'As more athletes join, suggestions appear here.'}
              />
            ) : athletes.map(athlete => {
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
                            src={athlete.avatar_url ?? undefined}
                            alt={athlete.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-[#00D4FF]/40 shadow-md"
                          />
                          {/* The tick used to be on every card, including
                              unverified athletes. */}
                          {athlete.is_verified && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#CCFF00] ring-2 ring-black flex items-center justify-center text-[9px] font-black text-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-sans font-bold text-base text-white">{athlete.name}</h3>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-[#00D4FF]">
                            <span>@{athlete.username || 'athlete'}</span>
                            <span>•</span>
                            <span>{athlete.sport || 'Multi-Sport'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs text-text-muted uppercase block">PULSE</span>
                        <span className="text-lg font-black text-[#CCFF00]">
                          {Math.round(athlete.pulse_score)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 font-sans">
                      {athlete.bio || 'No bio yet.'}
                    </p>

                    {/* Matches and win rate are per-match aggregates that the
                        profile row does not carry, and inventing 42 and 78% for
                        every athlete was worse than showing what is known. */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-elevated/60 border border-white/5 text-center font-mono">
                      <div>
                        <p className="text-[9px] text-text-muted uppercase">Sport</p>
                        <p className="text-xs font-bold text-white capitalize">
                          {athlete.sport || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted uppercase">City</p>
                        <p className="text-xs font-bold text-[#CCFF00]">{athlete.city || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted uppercase">Level</p>
                        <p className="text-xs font-bold text-[#00D4FF]">Lvl {athlete.level}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => navigate(`/app/profile/${athlete.id}`)}
                      className="flex-1 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-[#1ad8ff] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      View PlayerDNA
                    </button>
                    <button
                      onClick={() => navigate('/app/messages')}
                      className="p-2.5 rounded-xl bg-elevated border border-white/10 hover:border-white/20 text-white transition-all"
                      title="Message"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => toggleSaveUser(athlete.id)}
                      className={`p-2.5 rounded-xl border transition-all ${isSaved ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-white/10 text-white'}`}
                      title="Bookmark Athlete"
                    >
                      <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* CLASHHUB EVENTS TAB */}
        {activeTab === 'ClashHub Events' && (
          <motion.div key="evt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventsLoading ? (
              <SkeletonCards label="Loading events" />
            ) : eventsError ? (
              <ResultError message={eventsError.message} onRetry={() => refreshEvents()} />
            ) : events.length === 0 ? (
              <EmptyResult
                title={searching ? 'No events found' : 'No events scheduled'}
                detail={searching
                  ? 'Try a different title or sport.'
                  : 'Nothing on the calendar right now.'}
              />
            ) : events.map(event => (
              <div
                key={event.$id}
                onClick={() => navigate(`/app/events/${event.$id}`)}
                className="p-5 rounded-3xl bg-surface border border-border-muted hover:border-[#00D4FF]/40 cursor-pointer transition-all space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between font-mono text-xs text-[#00D4FF]">
                  <span>{event.sport.toUpperCase()}</span>
                  <span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString() : 'TBC'}</span>
                </div>
                <h3 className="font-sans font-bold text-base text-white uppercase">{event.title}</h3>
                <p className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                  <MapPin size={12} /> {event.venue ?? event.city ?? 'Venue to be confirmed'}
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

              {/* These were Math.random() counts generated once at module load
                  and labelled as global participation. They are real counts of
                  active athletes per sport now. */}
              {breakdownLoading ? (
                <div className="h-64 w-full rounded-2xl bg-elevated animate-shimmer"
                     aria-busy="true" aria-label="Loading the sports breakdown" />
              ) : breakdownError ? (
                <ResultError message={breakdownError.message} onRetry={() => refreshBreakdown()} />
              ) : sportAnalytics.length === 0 ? (
                <EmptyResult
                  title="No participation data yet"
                  detail="Counts appear once athletes have chosen their sports."
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sportAnalytics}>
                      <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 12, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#101010', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                      <Bar dataKey="count" fill="#00D4FF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};

/** Card-shaped skeletons, matching the two-column result grids. */
const SkeletonCards: React.FC<{ label: string }> = ({ label }) => (
  <>
    {[0, 1, 2, 3].map(i => (
      <div
        key={i}
        aria-busy="true"
        aria-label={i === 0 ? label : undefined}
        className="rounded-3xl bg-surface border border-border-muted p-5 space-y-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-elevated animate-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-elevated animate-shimmer" />
            <div className="h-3 w-1/3 rounded bg-elevated animate-shimmer" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-elevated animate-shimmer" />
        <div className="h-16 rounded-2xl bg-elevated animate-shimmer" />
      </div>
    ))}
  </>
);

const EmptyResult: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div className="md:col-span-2 p-8 rounded-3xl bg-surface border border-border-muted text-center space-y-2">
    <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">{title}</p>
    <p className="font-mono text-xs text-text-muted">{detail}</p>
  </div>
);

const ResultError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="md:col-span-2 p-8 rounded-3xl bg-surface border border-border-muted text-center space-y-3">
    <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
      That did not load
    </p>
    <p className="font-mono text-xs text-text-muted">{message}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D4FF] text-black font-mono text-[10px] font-bold uppercase"
    >
      <RefreshCw size={12} /> Retry
    </button>
  </div>
);
