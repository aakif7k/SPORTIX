/**
 * src/store/eventStore.ts
 */
import { create } from 'zustand';
import { SportixEvent } from '../types';

interface EventState {
  events:        SportixEvent[];
  activeEvent:   SportixEvent | null;
  sportFilter:   string;
  searchQuery:   string;
  loading:       boolean;
  hasMore:       boolean;
  page:          number;

  setEvents:      (events: SportixEvent[]) => void;
  appendEvents:   (events: SportixEvent[]) => void;
  setActiveEvent: (event: SportixEvent | null) => void;
  setSportFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setLoading:     (loading: boolean) => void;
  setHasMore:     (hasMore: boolean) => void;
  nextPage:       () => void;
  resetPaging:    () => void;
  updateEventParticipants: (eventId: string, count: number) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events:        [],
  activeEvent:   null,
  sportFilter:   'All',
  searchQuery:   '',
  loading:       false,
  hasMore:       true,
  page:          0,

  setEvents:      (events) => set({ events }),
  appendEvents:   (events) => set({ events: [...get().events, ...events] }),
  setActiveEvent: (event) => set({ activeEvent: event }),
  setSportFilter: (sportFilter) => set({ sportFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLoading:     (loading) => set({ loading }),
  setHasMore:     (hasMore) => set({ hasMore }),
  nextPage:       () => set({ page: get().page + 1 }),
  resetPaging:    () => set({ page: 0, hasMore: true, events: [] }),

  updateEventParticipants: (eventId, count) => {
    const updated = get().events.map(e =>
      e.$id === eventId ? { ...e, current_participants: count } : e
    );
    set({ events: updated });
    if (get().activeEvent?.$id === eventId) {
      set({ activeEvent: { ...get().activeEvent!, current_participants: count } });
    }
  },
}));
