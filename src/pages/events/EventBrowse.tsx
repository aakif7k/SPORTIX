import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, Search, Trophy, ArrowRight, Plus, 
  Activity, Settings 
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { SPORT_CATEGORIES } from '@/constants/sports';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';

export const EventBrowse: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading, error, refresh } = useEvents();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'featured'>('all');

  // The soonest upcoming event headlines the page.
  const featuredEvent = [...events]
    .filter(e => e.status === 'upcoming' || e.status === 'live')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0]
    ?? events[0];

  const filteredEvents = events.filter(event => {
    const haystack = `${event.title} ${event.location ?? ''} ${event.city ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all'
      || event.sport.toLowerCase() === selectedSport.toLowerCase();

    if (!matchesSearch || !matchesSport) return false;
    if (filterTab === 'live') return event.status === 'live';
    // There is no isFeatured column; "featured" means starting soonest.
    if (filterTab === 'featured') return event.$id === featuredEvent?.$id;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <PendingReportBanner />

      {/* ── CLASHHUB HEADER ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-gradient-to-br from-[#140D00] via-[#0A0A0A] to-[#120A00] border border-[#FF6B00]/25 shadow-[0_0_50px_rgba(255,107,0,0.15)]">
        {/* Glow orb background */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF6B00]/20 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 font-mono text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest">
              <Trophy size={13} /> CLASHHUB LIVE TOURNAMENTS
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
              COMPETE. WIN.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FFA800] to-[#CCFF00]">
                CLAIM GLORY.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg font-sans">
              Discover official sports tournaments, 5-a-side clashes, and pickup events near you. Build your squad, enter brackets, and earn Pulse Points.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/app/events/create')}
              className="px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#ff7b1a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.3)] group"
            >
              <Plus size={16} /> Host Tournament
            </button>
            <button
              onClick={() => navigate('/app/events/manage')}
              className="px-5 py-3 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 hover:bg-[#CCFF00]/20 text-[#CCFF00] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.15)]"
            >
              <Settings size={15} /> Manage My Events
            </button>
            <button
              onClick={() => navigate('/app/clashhub/history')}
              className="px-5 py-3 rounded-2xl bg-elevated border border-white/10 hover:border-[#FF6B00]/40 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Activity size={15} /> Match History
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURED HERO EVENT BANNER ───────────────────────────────────── */}
      {!loading && !error && featuredEvent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/app/events/${featuredEvent.$id}`)}
          className="relative rounded-3xl overflow-hidden border border-white/10 bg-surface cursor-pointer group shadow-2xl"
        >
          <div className="h-64 sm:h-80 relative overflow-hidden">
            <img 
              src={featuredEvent.banner_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80'} 
              alt={featuredEvent.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FF6B00] text-black font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg">
                FEATURED CHAMPIONSHIP
              </span>
              {featuredEvent.status === 'live' && (
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
                </span>
              )}
            </div>

            {/* Bottom Event Info */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#CCFF00]">
                <span>{new Date(featuredEvent.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {featuredEvent.location ?? featuredEvent.city ?? 'TBC'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#FF6B00] transition-colors">
                {featuredEvent.title}
              </h2>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
                  <span>{featuredEvent.current_participants} / {featuredEvent.max_participants} Registered</span>
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                    <div 
                      className="h-full bg-[#FF6B00] rounded-full" 
                      style={{ width: `${(featuredEvent.current_participants / featuredEvent.max_participants) * 100}%` }} 
                    />
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#FF6B00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Enter Tournament <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SEARCH & SPORT CATEGORY FILTERS ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search tournaments by name or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border-muted text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]/40 font-mono transition-all"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-border-muted w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'live', label: 'Live' },
              { id: 'featured', label: 'Featured' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                  filterTab === tab.id
                    ? 'bg-[#FF6B00] text-black shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sport Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedSport === 'all'
                ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                : 'bg-surface border border-border-muted text-text-secondary hover:text-white'
            }`}
          >
            🔥 All Sports ({events.length})
          </button>
          {SPORT_CATEGORIES.map(sport => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedSport === sport.id
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                  : 'bg-surface border border-border-muted text-text-secondary hover:text-white'
              }`}
            >
              {sport.emoji} {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LOADING ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
             aria-busy="true" aria-label="Loading events">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-2xl bg-surface border border-border-muted overflow-hidden">
              <div className="h-40 w-full bg-elevated animate-shimmer" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-elevated animate-shimmer" />
                <div className="h-2 w-1/2 rounded bg-elevated animate-shimmer" />
                <div className="h-2 w-2/3 rounded bg-elevated animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-2xl bg-surface border border-border-muted p-8 text-center space-y-3">
          <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
            Could not load events
          </p>
          <p className="font-mono text-[11px] text-text-secondary">
            {error.isNetwork
              ? 'The server is unreachable. Check your connection.'
              : error.message}
          </p>
          {error.requestId && (
            <p className="font-mono text-[9px] text-text-muted">Reference: {error.requestId}</p>
          )}
          <button
            onClick={() => refresh()}
            className="px-4 py-2 rounded-full bg-accent text-black font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── EMPTY ────────────────────────────────────────────────────────── */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="rounded-2xl bg-surface border border-dashed border-border-muted p-10 text-center space-y-2">
          <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
            {events.length === 0 ? 'No events yet' : 'Nothing matches that'}
          </p>
          <p className="font-mono text-[11px] text-text-secondary">
            {events.length === 0
              ? 'Be the first to put one on.'
              : 'Try a different sport or clear the search.'}
          </p>
          <button
            onClick={() => navigate('/app/events/create')}
            className="mt-2 px-4 py-2 rounded-full bg-accent text-black font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-all"
          >
            Create an event
          </button>
        </div>
      )}

      {/* ── TOURNAMENT CARDS GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && !error && filteredEvents.map(event => {
          const pctFull = Math.round((event.current_participants / event.max_participants) * 100);
          return (
            <motion.div
              key={event.$id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/app/events/${event.$id}`)}
              className="rounded-3xl overflow-hidden bg-surface border border-border-muted/80 cursor-pointer group flex flex-col justify-between shadow-lg transition-all hover:border-[#FF6B00]/40"
            >
              <div>
                {/* Event Image Banner */}
                <div className="h-44 relative overflow-hidden">
                  <img 
                    src={event.banner_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
                  
                  {/* Status Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {event.status === 'live' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 font-mono text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur border border-white/10 font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-wider">
                        {event.sport}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                    <Calendar size={12} className="text-[#FF6B00]" />
                    <span>{new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <MapPin size={12} className="text-text-muted" />
                    <span className="truncate">{(event.location ?? event.city ?? 'TBC')}</span>
                  </div>

                  <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight group-hover:text-[#FF6B00] transition-colors line-clamp-1">
                    {event.title}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 font-sans">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Progress */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-muted">Filled: {pctFull}%</span>
                    <span className="text-[#FF6B00] font-bold">{event.current_participants}/{event.max_participants}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#FF6B00] rounded-full transition-all" style={{ width: `${pctFull}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
