import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Trophy, Search, ChevronDown, Check, Flame, ShieldCheck, Lock } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

export interface EventOption {
  id: string;
  title: string;
  sport: string;
  location: string;
  city?: string;
  startsAt: string;
  currentParticipants: number;
  maxParticipants: number;
  bannerUrl?: string | null;
  status: string;
}

interface Props {
  selectedEvent: EventOption | null;
  onSelectEvent: (event: EventOption | null) => void;
  preselectedEventId?: string | null;
}

export const AutoSquadEventSelector: React.FC<Props> = ({ selectedEvent, onSelectEvent, preselectedEventId }) => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      setLoading(true);
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.EVENTS,
          [Query.orderDesc('starts_at'), Query.limit(30)]
        );

        let mapped: EventOption[] = [];
        if (res.documents && res.documents.length > 0) {
          // Fetch real participant counts for each event
          const eventOptions = await Promise.all(
            res.documents.map(async (d: any) => {
              let realPartCount = 0;
              try {
                const partsRes = await databases.listDocuments(
                  DATABASE_ID,
                  COLLECTIONS.EVENT_PARTICIPANTS,
                  [Query.equal('event_id', d.$id), Query.limit(200)]
                );
                const confirmed = (partsRes.documents || []).filter((p: any) => {
                  const s = (p.status || 'confirmed').toLowerCase();
                  return s !== 'withdrawn' && s !== 'cancelled' && s !== 'removed';
                });
                realPartCount = confirmed.length;
              } catch {
                realPartCount = Number(d.current_participants || 0);
              }

              return {
                id: d.$id,
                title: d.title || 'SPORTiX Event',
                sport: d.sport || 'Football',
                location: d.location || d.venue || 'SPORTiX Arena',
                city: d.city || 'Chennai',
                startsAt: d.starts_at || new Date().toISOString(),
                currentParticipants: realPartCount,
                maxParticipants: Number(d.max_participants || 24),
                bannerUrl: d.banner_url || null,
                status: d.status || 'upcoming',
              };
            })
          );
          mapped = eventOptions;
        }

        if (mounted) {
          setEvents(mapped);

          // Auto-select preselected event ID if provided, otherwise first available
          if (preselectedEventId) {
            const found = mapped.find(e => e.id === preselectedEventId);
            if (found) onSelectEvent(found);
            else if (mapped.length > 0 && !selectedEvent) onSelectEvent(mapped[0]);
          } else if (!selectedEvent && mapped.length > 0) {
            onSelectEvent(mapped[0]);
          }
        }
      } catch (err) {
        console.error('[AutoSquadEventSelector] Failed to load events:', err);
        if (mounted) {
          setEvents([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEvents();
    return () => { mounted = false; };
  }, [preselectedEventId]);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Trophy size={14} className="text-accent" /> Select Event
        </label>
        {selectedEvent && (
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            selectedEvent.currentParticipants >= 10
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'bg-warning/15 text-warning border border-warning/30'
          }`}>
            {selectedEvent.currentParticipants >= 10 ? (
              <>
                <ShieldCheck size={12} /> AUTOSQUAD UNLOCKED ({selectedEvent.currentParticipants} ATHLETES)
              </>
            ) : (
              <>
                <Lock size={12} /> {selectedEvent.currentParticipants} / 10 ATHLETES JOINED
              </>
            )}
          </span>
        )}
      </div>

      {/* Main Trigger Box */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-4 rounded-2xl bg-elevated border border-border-muted hover:border-accent/50 focus:border-accent transition-all flex items-center justify-between gap-4 shadow-md group"
        >
          {selectedEvent ? (
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 transition-colors">
                <Flame size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-sans font-bold text-sm text-text-primary">
                    {selectedEvent.title}
                  </h4>
                  <span className="font-mono text-[10px] font-bold text-accent uppercase px-2 py-0.5 rounded bg-accent/10">
                    ⚽ {selectedEvent.sport}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 font-mono text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-accent/80" /> {selectedEvent.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-accent/80" />
                    {new Date(selectedEvent.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-text-primary font-bold">
                    <Users size={12} className="text-accent" /> {selectedEvent.currentParticipants} / {selectedEvent.maxParticipants}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs text-text-muted">
              {loading ? 'Scanning SPORTiX events...' : 'Click to choose an event'}
            </div>
          )}

          <ChevronDown
            size={18}
            className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`}
          />
        </button>

        {/* Dropdown Options Sheet */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-surface border border-border-muted shadow-2xl p-3 space-y-3 max-h-80 overflow-y-auto backdrop-blur-xl"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter events by title, sport, or city..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-elevated border border-border-muted font-mono text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
                />
              </div>

              {/* Event List */}
              <div className="space-y-1.5">
                {filteredEvents.length === 0 ? (
                  <div className="p-4 text-center font-mono text-xs text-text-muted">
                    No active events found.
                  </div>
                ) : (
                  filteredEvents.map(evt => {
                    const isSelected = selectedEvent?.id === evt.id;
                    const isReady = evt.currentParticipants >= 10;
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => {
                          onSelectEvent(evt);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-accent/15 border border-accent/40 text-text-primary'
                            : 'hover:bg-elevated text-text-secondary hover:text-text-primary border border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-sans font-bold text-xs text-text-primary truncate flex items-center gap-2">
                            <span>{evt.title}</span>
                            {isReady && (
                              <span className="font-mono text-[9px] text-accent bg-accent/10 px-1.5 py-0.2 rounded font-bold">
                                ⚡ READY
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-text-muted flex items-center gap-2 mt-0.5">
                            <span className="text-accent font-bold">{evt.sport}</span>
                            <span>•</span>
                            <span>{evt.location}</span>
                            <span>•</span>
                            <span>{evt.currentParticipants} Players</span>
                          </div>
                        </div>

                        {isSelected && <Check size={16} className="text-accent flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
