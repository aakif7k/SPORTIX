import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, Search, Trophy, ArrowRight, Plus, 
  Activity, Settings 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';

import { getEventLifecycleState } from '../../services/eventLifecycleService';
import { EventStatusBadge } from '../../components/events/EventStatusBadge';

export const EventBrowse: React.FC = () => {
  const navigate = useNavigate();
  const { events, loadEvents } = useEventStore();

  // Fetch live events from Appwrite on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || event.sport.toLowerCase() === selectedSport.toLowerCase();
    
    if (!matchesSearch || !matchesSport) return false;

    const lifecycle = getEventLifecycleState(event);
    if (filterTab === 'upcoming') return !lifecycle.isEnded && !lifecycle.isLive && !lifecycle.isCancelled;
    if (filterTab === 'live') return lifecycle.isLive;
    if (filterTab === 'completed') return lifecycle.isEnded;
    return true;
  });

  const featuredEvent = events.find(e => (e as any).isFeatured) || events[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <PendingReportBanner />

      {/* ── CLASHHUB HEADER ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-surface border border-border-muted shadow-2xl">
        {/* Glow orb background */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF6B00]/15 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 font-mono text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest">
              <Trophy size={13} /> CLASHHUB LIVE TOURNAMENTS
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-text-primary uppercase tracking-tight leading-tight">
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
              className="px-5 py-3 rounded-2xl bg-elevated border border-border-muted hover:border-[#FF6B00]/40 text-text-primary font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Activity size={15} /> Match History
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURED HERO EVENT BANNER ───────────────────────────────────── */}
      {featuredEvent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/app/events/${featuredEvent.id}`)}
          className="relative rounded-3xl overflow-hidden border border-border-muted bg-surface cursor-pointer group shadow-2xl"
        >
          <div className="h-64 sm:h-80 relative overflow-hidden">
            <img 
              src={featuredEvent.bannerImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80'} 
              alt={featuredEvent.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FF6B00] text-black font-mono text-[10px] font-bold uppercase tracking-wider shadow-lg">
                FEATURED CHAMPIONSHIP
              </span>
              <EventStatusBadge event={featuredEvent} size="sm" />
            </div>

            {/* Bottom Event Info */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#CCFF00]">
                <span>{new Date(featuredEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {featuredEvent.location}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-text-primary uppercase tracking-tight leading-tight group-hover:text-[#FF6B00] transition-colors">
                {featuredEvent.title}
              </h2>
              <div className="flex items-center justify-between pt-2 border-t border-border-muted">
                <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
                  <span>{featuredEvent.participants.length} / {featuredEvent.maxParticipants} Registered</span>
                  <div className="w-24 h-1.5 rounded-full bg-elevated overflow-hidden hidden sm:block border border-border-muted">
                    <div 
                      className="h-full bg-[#FF6B00] rounded-full" 
                      style={{ width: `${(featuredEvent.participants.length / featuredEvent.maxParticipants) * 100}%` }} 
                    />
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#FF6B00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Details <ArrowRight size={14} />
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
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border-muted text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]/40 font-mono transition-all"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-border-muted w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'live', label: 'Live' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                  filterTab === tab.id
                    ? 'bg-[#FF6B00] text-black shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
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
                : 'bg-surface border border-border-muted text-text-secondary hover:text-text-primary'
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
                  : 'bg-surface border border-border-muted text-text-secondary hover:text-text-primary'
              }`}
            >
              {sport.emoji} {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOURNAMENT CARDS GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const lifecycle = getEventLifecycleState(event);
          const pctFull = Math.round((event.participants.length / event.maxParticipants) * 100);
          return (
            <motion.div
              key={event.id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/app/events/${event.id}`)}
              className="rounded-3xl overflow-hidden bg-surface border border-border-muted cursor-pointer group flex flex-col justify-between shadow-lg transition-all hover:border-[#FF6B00]/40"
            >
              <div>
                {/* Event Image Banner */}
                <div className="h-44 relative overflow-hidden">
                  <img 
                    src={event.bannerImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ filter: lifecycle.isEnded ? 'brightness(0.75)' : 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  
                  {/* Status Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <EventStatusBadge event={event} size="sm" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                    <Calendar size={12} className="text-[#FF6B00]" />
                    <span>{lifecycle.startsAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <MapPin size={12} className="text-text-muted" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-tight group-hover:text-[#FF6B00] transition-colors line-clamp-1">
                    {event.title}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 font-sans">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Progress */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-border-muted space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-muted">
                      {lifecycle.isEnded ? 'Final Participation' : `Filled: ${pctFull}%`}
                    </span>
                    <span className="text-[#FF6B00] font-bold">
                      {event.participants.length}/{event.maxParticipants} {lifecycle.isEnded ? 'Athletes' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-elevated overflow-hidden border border-border-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pctFull}%`,
                        background: lifecycle.isEnded ? '#64748B' : '#FF6B00',
                      }}
                    />
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
