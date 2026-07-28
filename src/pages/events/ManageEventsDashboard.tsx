import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Settings, Plus, Search, Calendar, MapPin, 
  Edit, Trash2, ArrowLeft, ChevronRight
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';

export const ManageEventsDashboard: React.FC = () => {
  const { events, deleteEvent } = useEventStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events created by the authenticated organizer
  const myEvents = events.filter(e => e.organizerId === user?.id || !user);

  const filteredEvents = myEvents.filter(e => 
    !searchQuery || 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      if (deleteEvent) {
        deleteEvent(id);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white px-4 pb-24 pt-6">
      
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141200] via-[#0A0A0A] to-[#120A05] border border-[#CCFF00]/20 shadow-[0_0_40px_rgba(204,255,0,0.1)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/events')}
            className="w-11 h-11 rounded-2xl bg-elevated border border-white/10 hover:border-[#CCFF00]/40 flex items-center justify-center text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">
              <Settings size={12} /> ORGANIZER DASHBOARD
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">Manage My Events</h1>
            <p className="font-mono text-xs text-text-secondary mt-1">
              You are organizing {myEvents.length} active tournaments
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/events/create')}
          className="px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#ff7b1a] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
        >
          <Plus size={16} /> Host New Tournament
        </button>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search your tournaments by title or location..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface border border-border-muted text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#CCFF00]/40 font-mono transition-all"
        />
      </div>

      {/* ── EVENTS LIST ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map(event => {
          return (
            <motion.div
              key={event.id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/app/events/${event.id}/manage`)}
              className="rounded-3xl overflow-hidden bg-surface border border-border-muted cursor-pointer group flex flex-col justify-between shadow-xl transition-all hover:border-[#CCFF00]/40"
            >
              <div>
                {/* Banner Header */}
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={event.bannerImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/events/${event.id}/manage`); }}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur border border-white/20 hover:bg-[#CCFF00] hover:text-black text-white transition-all"
                      title="Edit Event"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, event.id)}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur border border-white/20 hover:bg-red-600 text-white transition-all"
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                    <Calendar size={12} className="text-[#CCFF00]" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <MapPin size={12} className="text-text-muted" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  <h3 className="font-sans font-bold text-base text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors line-clamp-1">
                    {event.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono text-text-muted pt-2 border-t border-white/5">
                    <span>Format: {event.format}</span>
                    <span className="text-[#CCFF00] font-bold">Prize: {event.prizePool || 'TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => navigate(`/app/events/${event.id}/manage`)}
                  className="w-full py-2.5 rounded-xl bg-elevated border border-white/10 hover:border-[#CCFF00]/40 text-[#CCFF00] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                >
                  Manage Event Settings <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
