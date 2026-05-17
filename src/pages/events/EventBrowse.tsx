import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Calendar, MapPin, Users, Zap, SlidersHorizontal } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import type { Event } from '../../types';
import { SportBadge, AIBadge, LiveIndicator } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const EventCard: React.FC<{ event: Event; index: number }> = ({ event, index }) => {
  const navigate = useNavigate();
  const sportData = SPORT_CATEGORIES.find(s => s.id === event.sport);
  const pctFull = Math.round((event.participants.length / event.maxParticipants) * 100);
  const dateStr = new Date(event.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(`/app/events/${event.id}`)}
      className="glass rounded-xl overflow-hidden cursor-pointer border border-border-muted hover:border-volt/20 transition-all group"
    >
      {event.bannerImage && (
        <div className="h-32 relative overflow-hidden">
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {event.status === 'live' && <LiveIndicator />}
            {event.aiTeamAvailable && <AIBadge />}
          </div>
          <div className="absolute bottom-2 right-3 font-mono text-xl">{sportData?.emoji}</div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg text-white leading-tight">{event.title}</h3>
          <SportBadge sport={event.sport} size="sm" />
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary font-label mb-3">
          <span className="flex items-center gap-1"><Calendar size={11} /> {dateStr}</span>
          <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>
        </div>
        {/* Fill bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
            <span>{event.participants.length}/{event.maxParticipants} athletes</span>
            <span className={pctFull > 80 ? 'text-hot' : 'text-volt'}>{pctFull}% full</span>
          </div>
          <div className="h-1 bg-elevated rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pctFull > 80 ? 'bg-hot' : 'bg-volt'}`} style={{ width: `${pctFull}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-label text-text-secondary capitalize">{event.skillLevel}</span>
            {event.prizePool && <span className="text-xs font-mono text-volt">{event.prizePool}</span>}
          </div>
          <button className="text-xs font-label font-semibold text-black bg-volt px-3 py-1.5 rounded-lg hover:shadow-glow-volt-sm transition-all">
            View →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const EventBrowse: React.FC = () => {
  const { events } = useEventStore();
  const [sportFilter, setSportFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const filtered = sportFilter === 'all' ? events : events.filter(e => e.sport === sportFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">CLASHHUB</h1>
          <p className="text-text-secondary font-label text-sm mt-0.5">{events.length} upcoming clashes worldwide</p>
        </div>
        <Button onClick={() => navigate('/app/events/create')} icon={<Calendar size={15} />}>Create Event</Button>
      </div>

      {/* Sport Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setSportFilter('all')} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-label font-medium transition-all ${sportFilter === 'all' ? 'bg-volt text-black' : 'bg-elevated border border-border-muted text-text-secondary hover:border-volt/30 hover:text-white'}`}>
          All Sports
        </button>
        {SPORT_CATEGORIES.slice(0, 8).map(s => (
          <button key={s.id} onClick={() => setSportFilter(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-label font-medium transition-all ${sportFilter === s.id ? 'bg-volt text-black' : 'bg-elevated border border-border-muted text-text-secondary hover:border-volt/30 hover:text-white'}`}>
            <span>{s.emoji}</span>{s.label}
          </button>
        ))}
        <button onClick={() => setShowFilters(f => !f)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-label font-medium bg-elevated border border-border-muted text-text-secondary hover:border-volt/30 hover:text-white">
          <SlidersHorizontal size={12} /> More Filters
        </button>
      </div>

      {/* AI Team Banner */}
      <div className="glass rounded-xl p-5 flex items-center gap-4 border border-volt/10" style={{ background: 'rgba(204,255,0,0.03)' }}>
        <div className="w-12 h-12 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center flex-shrink-0">
          <Zap size={22} className="text-volt" fill="currentColor" />
        </div>
        <div className="flex-1">
          <p className="font-display text-lg text-white tracking-wide">AUTOSQUAD</p>
          <p className="text-xs text-text-secondary font-label">No team? Let Gemini AI build the perfect lineup for you in seconds.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/app/events/e1')}>Build Team →</Button>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
      </div>
    </div>
  );
};
