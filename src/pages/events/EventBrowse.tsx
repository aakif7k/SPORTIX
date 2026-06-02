import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Zap, SlidersHorizontal, Settings,
  Search, TrendingUp, Trophy, ArrowRight, Flame, Plus
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import type { Event } from '../../types';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';

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

// ─── Animation helpers ───────────────────────────────────────────────────────
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as any } } };

// ─── Premium Event Card ───────────────────────────────────────────────────────
const EventCard: React.FC<{ event: Event; index: number; featured?: boolean }> = ({ event, index: _index, featured }) => {
  const navigate  = useNavigate();
  const sportData = SPORT_CATEGORIES.find(s => s.id === event.sport);
  const pctFull   = Math.round((event.participants.length / event.maxParticipants) * 100);
  const dateStr   = new Date(event.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  const isHot     = pctFull > 75;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/app/events/${event.id}`)}
      className="premium-card rounded-[24px] overflow-hidden cursor-pointer group relative"
      style={{ boxShadow: featured ? '0 8px 40px var(--accent-glow)' : undefined }}>

      {/* BANNER IMAGE */}
      <div className={`relative overflow-hidden ${featured ? 'h-52' : 'h-40'}`}>
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            style={{ 
              objectPosition: event.bannerAlignment === 'top' 
                ? 'center 20%' 
                : event.bannerAlignment === 'bottom' 
                ? 'center 80%' 
                : 'center 50%' 
            }} />
        ) : (
          <div className="w-full h-full" style={{
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-hover) 100%)'
          }}>
            <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-15">
              {sportData?.emoji}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {event.status === 'live' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[9px] font-bold backdrop-blur-sm bg-danger/80 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          {featured && (
            <span className="px-2.5 py-1 rounded-full font-mono text-[9px] font-bold backdrop-blur-sm bg-volt text-volt-text shadow-sm border border-volt/20">
              FEATURED
            </span>
          )}
          {isHot && (
            <span className="flex items-center gap-0.5 px-2.5 py-1 rounded-full font-mono text-[9px] font-bold backdrop-blur-sm bg-hot text-white border border-hot/20">
              <Flame size={9} /> HOT
            </span>
          )}
        </div>

        {/* Sport emoji top-right */}
        <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-sm text-lg bg-surface/50 border border-border-muted">
          {sportData?.emoji}
        </div>

        {/* Bottom fill bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <div className="flex justify-between font-mono text-[9px] mb-1 text-white/95">
            <span>{event.participants.length}/{event.maxParticipants} athletes</span>
            <span className="font-bold" style={{ color: isHot ? 'var(--hot)' : 'var(--volt)' }}>{pctFull}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-white/20">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${pctFull}%`,
                background: isHot
                  ? 'linear-gradient(90deg, var(--hot), var(--danger))'
                  : 'linear-gradient(90deg, var(--volt), var(--accent-hover))',
                boxShadow: isHot ? '0 0 6px var(--danger)' : '0 0 6px var(--accent-glow)'
              }} />
          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-5 space-y-3">
        {/* Title + sport tag */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[17px] leading-tight tracking-wide flex-1 text-text-primary">
            {event.title}
          </h3>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full flex-shrink-0 capitalize font-bold"
            style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
            {event.sport}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 font-mono text-[10px] text-text-secondary">
          <span className="flex items-center gap-1"><Calendar size={10} />{dateStr}</span>
          <span className="flex items-center gap-1"><MapPin size={10} />{event.location} ({MOCK_EVENT_DISTANCES[event.id] || 15.0} KM)</span>
        </div>

        {/* Bottom row: skill + prize + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border-muted">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] capitalize px-2 py-0.5 rounded-full bg-elevated border border-border-muted text-text-secondary">
              {event.skillLevel}
            </span>
            {event.prizePool && (
              <span className="font-mono text-[10px] font-bold flex items-center gap-0.5 text-gold">
                <Trophy size={9} /> {event.prizePool}
              </span>
            )}
          </div>

          {/* View button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-[10px] bg-volt text-volt-text transition-all hover:opacity-90">
              View <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const EventBrowse: React.FC = () => {
  const { events }   = useEventStore();
  const { nearbyRadius } = useAISettingsStore();
  const navigate     = useNavigate();
  const [sportFilter, setSportFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const searchRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setVisibleCount(5);
  }, [sportFilter, searchQuery, nearbyRadius]);

  const filtered = events.filter(e => {
    const matchesSport = sportFilter === 'all' || e.sport === sportFilter;
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRadius = (MOCK_EVENT_DISTANCES[e.id] || 15.0) <= nearbyRadius;
    return matchesSport && matchesSearch && matchesRadius;
  });

  const featuredEvent  = filtered[0];
  const remainingEvents = filtered.slice(1, visibleCount);

  return (
    <div className="space-y-6 text-text-primary">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[42px] tracking-wide leading-none text-text-primary">
            CLASHHUB
          </h1>
          <p className="font-mono text-[11px] mt-1.5 flex items-center gap-2 text-text-secondary">
            <TrendingUp size={11} className="text-volt" />
            {events.length} upcoming clashes worldwide
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app/events/manage')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] font-mono text-[11px] font-bold flex-1 sm:flex-initial bg-elevated border border-border-muted text-text-primary hover:text-volt hover:border-volt/30 transition-all whitespace-nowrap">
            <Settings size={14} /> Manage Events
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app/events/create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] font-mono text-[11px] font-bold flex-1 sm:flex-initial bg-volt text-volt-text hover:opacity-90 transition-opacity whitespace-nowrap shadow-[0_0_15px_rgba(204,255,0,0.2)]">
            <Plus size={14} /> Create Event
          </motion.button>
        </div>
      </motion.div>

      {/* ── SEARCH BAR ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
        <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search events, cities, sports..."
          className="w-full pl-10 pr-4 py-3 rounded-[16px] font-mono text-[12px] bg-surface border border-border-muted text-text-primary outline-none transition-all focus:border-volt/50 focus:ring-1 focus:ring-volt/30"
        />
      </motion.div>

      {/* ── PENDING REPORT BANNER ────────────────────────────── */}
      <PendingReportBanner />

      {/* ── SPORT FILTER CHIPS ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSportFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-mono text-[10px] font-bold transition-all border ${
              sportFilter === 'all'
                ? 'bg-volt text-volt-text border-volt shadow-sm'
                : 'bg-elevated text-text-secondary border-border-muted hover:text-text-primary'
            }`}>
            All Sports
          </button>
          {SPORT_CATEGORIES.slice(0, 8).map(s => (
            <button key={s.id} onClick={() => setSportFilter(s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[10px] font-bold transition-all border ${
                sportFilter === s.id
                  ? 'bg-volt text-volt-text border-volt shadow-sm'
                  : 'bg-elevated text-text-secondary border-border-muted hover:text-text-primary'
              }`}>
              {s.emoji} {s.label}
            </button>
          ))}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[10px] font-bold transition-all border ${
              showFilters
                ? 'bg-volt-dim text-volt border-volt/35'
                : 'bg-elevated text-text-secondary border-border-muted hover:text-text-primary'
            }`}>
            <SlidersHorizontal size={11} /> Filters
          </button>
        </div>
      </motion.div>

      {/* ── AI AUTOSQUAD BANNER ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        onClick={() => navigate('/app/events/e1')}
        whileHover={{ scale: 1.01 }}
        className="premium-card rounded-[22px] p-5 flex items-center gap-4 cursor-pointer relative overflow-hidden group">
        {/* Animated background pulse */}
        <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 10% 50%, var(--accent-surface), transparent)' }} />
        <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 relative bg-volt-dim border border-volt/20"
        >
          <Zap size={22} className="text-volt" fill="currentColor" />
        </motion.div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-display text-[17px] tracking-wide text-text-primary">AUTOSQUAD</span>
            <span className="px-2 py-0.5 rounded bg-volt-dim text-volt font-mono text-[8px] font-bold border border-volt/20">GEMINI AI</span>
          </div>
          <p className="font-mono text-[10px] text-text-secondary">
            No team? Let AI build the perfect lineup in seconds. {nearbyRadius} KM radius match.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] font-mono text-[10px] font-bold flex-shrink-0 relative bg-volt text-volt-text hover:opacity-90">
          Build Team <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.div>

      {/* ── EVENTS LIST ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 font-mono text-[12px] text-text-muted">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            No events found. Try a different filter.
          </motion.div>
        ) : (
          <motion.div key="grid" variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {/* Featured top card */}
            {featuredEvent && (
              <EventCard event={featuredEvent} index={0} featured />
            )}
            {/* 2-col grid for rest */}
            <div className="grid md:grid-cols-2 gap-4">
              {remainingEvents.map((event, i) => (
                <EventCard key={event.id} event={event} index={i + 1} />
              ))}
            </div>
            {/* Pagination button */}
            {filtered.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="flex items-center gap-2 px-6 py-3 rounded-[16px] font-mono text-[11px] font-bold bg-surface border border-border-muted text-text-primary hover:text-volt hover:border-volt/35 transition-all shadow-md"
                >
                  More clashes fr fr ⚡ <ArrowRight size={14} className="text-volt" />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
