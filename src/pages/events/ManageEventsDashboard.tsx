import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Plus, Search, Calendar, MapPin, 
  Users, Edit, Trash2, ArrowLeft, Trophy, BarChart3, AlertCircle
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES } from '../../services/mockData';

// Re-using same animation helpers
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as any } } };

export const ManageEventsDashboard: React.FC = () => {
  const { events, deleteEvent } = useEventStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Assuming currentUser id is 'cu1' for this context (test user)
  const myEvents = events.filter(e => e.organizerId === 'cu1');

  const filteredEvents = myEvents.filter(e => 
    !searchQuery || 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      if (deleteEvent) {
        deleteEvent(id);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-text-primary px-4 pb-24 md:pb-12 pt-6">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/app/events')}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all bg-elevated border border-border-muted hover:border-volt/30 hover:text-volt"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="font-display text-[28px] sm:text-[36px] tracking-wide leading-none text-text-primary uppercase flex items-center gap-3">
              <Settings size={24} className="text-volt" /> Manage Events
            </h1>
            <p className="font-mono text-[11px] mt-1.5 flex items-center gap-2 text-text-secondary">
              <BarChart3 size={11} className="text-volt" />
              You are organizing {myEvents.length} active clashes
            </p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/app/events/create')}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-[16px] font-mono text-[12px] font-bold flex-shrink-0 bg-volt text-volt-text hover:opacity-90 transition-opacity w-full sm:w-auto shadow-[0_0_15px_rgba(204,255,0,0.3)]">
          <Plus size={16} /> New Event
        </motion.button>
      </motion.div>

      {/* ── SEARCH BAR ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search your events by name or location..."
          className="w-full pl-11 pr-4 py-3.5 rounded-[16px] font-mono text-[13px] bg-surface border border-border-muted text-text-primary outline-none transition-all focus:border-volt/50 focus:ring-1 focus:ring-volt/30"
        />
      </motion.div>

      {/* ── EVENTS LIST ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filteredEvents.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 font-mono text-[13px] text-text-muted glass rounded-[24px] border border-border-muted">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-text-secondary mb-4">No events found matching your criteria.</p>
            <button onClick={() => navigate('/app/events/create')} className="text-volt font-bold hover:underline">
              Create your first event
            </button>
          </motion.div>
        ) : (
          <motion.div key="grid" variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map(event => {
              const sportData = SPORT_CATEGORIES.find(s => s.id === event.sport);
              const dateStr = new Date(event.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
              
              return (
                <motion.div key={event.id} variants={fadeUp} whileHover={{ y: -4 }}
                  className="glass rounded-[24px] overflow-hidden border border-border-muted relative group flex flex-col shadow-lg">
                  
                  {/* Banner Header */}
                  <div className="h-40 relative overflow-hidden bg-surface cursor-pointer" onClick={() => navigate(`/app/events/${event.id}/manage`)}>
                    {event.bannerImage ? (
                      <img src={event.bannerImage} alt={event.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        style={{ 
                          objectPosition: event.bannerAlignment === 'top' ? 'center 20%' : event.bannerAlignment === 'bottom' ? 'center 80%' : 'center 50%' 
                        }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-20 group-hover:scale-105 transition-transform duration-500"
                        style={{ background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-hover) 100%)' }}>
                        {sportData?.emoji}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/app/events/${event.id}/manage`); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-volt hover:text-volt-text hover:border-volt transition-colors"
                        title="Edit Event">
                        <Edit size={14} />
                      </button>
                      <button onClick={(e) => handleDelete(e, event.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-danger hover:text-white hover:border-danger transition-colors"
                        title="Delete Event">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                      <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white uppercase border border-white/10">
                        {sportData?.emoji} {sportData?.label}
                      </span>
                      <span className="font-mono text-[10px] font-bold flex items-center gap-1.5 text-volt drop-shadow-md bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-volt/20">
                        <Users size={12} /> {event.participants.length}/{event.maxParticipants}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/20">
                    <div className="cursor-pointer" onClick={() => navigate(`/app/events/${event.id}/manage`)}>
                      <h3 className="font-display text-[20px] leading-tight text-text-primary mb-3 group-hover:text-volt transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-text-secondary">
                          <Calendar size={13} className="text-volt/70" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-text-secondary truncate">
                          <MapPin size={13} className="text-volt/70" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[9px] font-bold uppercase px-2 py-1 rounded bg-elevated border border-border-muted text-text-secondary shadow-sm">
                          {event.status}
                        </span>
                        {event.prizePool && (
                          <span className="font-mono text-[10px] font-bold flex items-center gap-1 text-gold bg-gold/10 px-2 py-1 rounded border border-gold/20 shadow-sm">
                            <Trophy size={11} /> {event.prizePool}
                          </span>
                        )}
                      </div>
                      <button onClick={() => navigate(`/app/events/${event.id}/manage`)}
                        className="font-mono text-[11px] font-bold text-volt hover:opacity-80 flex items-center gap-1.5 transition-opacity">
                        Manage <ArrowLeft size={12} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
