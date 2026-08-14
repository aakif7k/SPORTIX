import { create } from 'zustand';
import type { Event, AITeamResult, BracketRound, EventStatus } from '../types';
import { MOCK_EVENTS } from '../services/mockData';
import {
  getEvents,
  getEvent,
  getEventParticipants,
  createEvent as svcCreateEvent,
  updateEvent as svcUpdateEvent,
  deleteEvent as svcDeleteEvent,
  joinEvent  as svcJoinEvent,
  leaveEvent as svcLeaveEvent,
  type DbEventParticipant,
} from '../services/eventService';

interface EventState {
  events: Event[];
  activeEvent: Event | null;
  participantsMap: Record<string, DbEventParticipant[]>;
  aiTeamResult: AITeamResult | null;
  isGenerating: boolean;

  // Core actions
  loadEvents:       () => Promise<void>;
  loadEvent:        (id: string) => Promise<Event | null>;
  refreshEventData: (id: string) => Promise<void>;
  setActiveEvent:   (event: Event | null) => void;
  setAITeamResult:  (result: AITeamResult | null) => void;
  setIsGenerating:  (val: boolean) => void;
  addEvent:         (event: Omit<Event, 'id'>) => Promise<Event | null>;
  updateEvent:      (id: string, updates: Partial<Event>) => void;
  deleteEvent:      (id: string) => void;

  // Lifecycle actions
  joinEvent:         (eventId: string, userId: string, entryType?: 'solo' | 'team' | 'squad' | 'crew', teamId?: string, teamMembers?: string[], role?: string | null) => Promise<{ success: boolean; message: string }>;
  leaveEvent:        (eventId: string, userId: string) => Promise<{ success: boolean; message: string }>;
  updateEventStatus: (eventId: string, status: EventStatus) => void;
  updateBracket:     (eventId: string, bracket: BracketRound[]) => void;
}

import { client, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';

let isRealtimeSubscribed = false;

function setupRealtimeSubscription(refreshFn: (id: string) => Promise<void>) {
  if (isRealtimeSubscribed) return;
  isRealtimeSubscribed = true;
  try {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.EVENT_PARTICIPANTS}.documents`;
    client.subscribe(channel, (response: any) => {
      if (response.payload && response.payload.event_id) {
        refreshFn(response.payload.event_id).catch(() => null);
      }
    });
  } catch (err) {
    console.warn('[eventStore] Realtime subscription warning:', err);
  }
}

export const useEventStore = create<EventState>((set, get) => ({
  events:          MOCK_EVENTS,
  activeEvent:     null,
  participantsMap: {},
  aiTeamResult:    null,
  isGenerating:    false,

  // ── Load all events from Appwrite ──────────────────────────────────────────
  loadEvents: async () => {
    setupRealtimeSubscription(id => get().refreshEventData(id));
    const events = await getEvents();
    set({ events });
  },

  // ── Load a single event by ID and fetch event_participants ──────────────
  loadEvent: async (id: string) => {
    const event = await getEvent(id);
    const dbParticipants = await getEventParticipants(id);

    if (event) {
      const mergedEvent: Event = {
        ...event,
        participants: dbParticipants.length > 0
          ? dbParticipants.map(p => p.user_id)
          : event.participants,
      };

      set(state => ({
        events: state.events.some(e => e.id === event.id)
          ? state.events.map(e => e.id === event.id ? mergedEvent : e)
          : [mergedEvent, ...state.events],
        activeEvent: state.activeEvent?.id === id ? mergedEvent : state.activeEvent,
        participantsMap: {
          ...state.participantsMap,
          [id]: dbParticipants,
        },
      }));
      return mergedEvent;
    }
    return null;
  },

  // ── Re-fetch participant records from Appwrite event_participants ──────────
  refreshEventData: async (id: string) => {
    const eventDoc = await getEvent(id);
    const dbParticipants = await getEventParticipants(id);

    if (eventDoc) {
      const mergedEvent: Event = {
        ...eventDoc,
        participants: dbParticipants.map(p => p.user_id),
      };

      set(state => ({
        events: state.events.map(e => e.id === id ? mergedEvent : e),
        activeEvent: state.activeEvent?.id === id ? mergedEvent : state.activeEvent,
        participantsMap: {
          ...state.participantsMap,
          [id]: dbParticipants,
        },
      }));
    }
  },

  setActiveEvent:  (event) => set({ activeEvent: event }),
  setAITeamResult: (result) => set({ aiTeamResult: result }),
  setIsGenerating: (val) => set({ isGenerating: val }),

  // ── Create event ───────────────────────────────────────────────────────────
  addEvent: async (event) => {
    try {
      const saved = await svcCreateEvent(event);
      if (saved) {
        set(state => ({ events: [saved, ...state.events] }));
        await get().refreshEventData(saved.id);
        return saved;
      }
      const fallback: Event = { ...event, id: `local_${Date.now()}` };
      set(state => ({ events: [fallback, ...state.events] }));
      return fallback;
    } catch (err) {
      console.error('[eventStore] addEvent failed:', err);
      return null;
    }
  },

  updateEvent: (id, updates) => {
    set(state => ({
      events:      state.events.map(e => e.id === id ? { ...e, ...updates } : e),
      activeEvent: state.activeEvent?.id === id ? { ...state.activeEvent, ...updates } : state.activeEvent,
    }));
    svcUpdateEvent(id, updates);
  },

  deleteEvent: (id) => {
    set(state => ({
      events:      state.events.filter(e => e.id !== id),
      activeEvent: state.activeEvent?.id === id ? null : state.activeEvent,
    }));
    svcDeleteEvent(id);
  },

  // ── Join event ─────────────────────────────────────────────────────────────
  joinEvent: async (eventId, userId, entryType = 'solo', teamId, teamMembers, role = '') => {
    const result = await svcJoinEvent(eventId, userId, entryType, teamId, teamMembers, role);
    if (result.success) {
      await get().refreshEventData(eventId);
    }
    return result;
  },

  // ── Leave event ────────────────────────────────────────────────────────────
  leaveEvent: async (eventId, userId) => {
    const result = await svcLeaveEvent(eventId, userId);
    if (result.success) {
      await get().refreshEventData(eventId);
    }
    return result;
  },

  updateEventStatus: (eventId, status) => {
    set(state => ({
      events:      state.events.map(e => e.id === eventId ? { ...e, status } : e),
      activeEvent: state.activeEvent?.id === eventId ? { ...state.activeEvent, status } : state.activeEvent,
    }));
  },

  updateBracket: (eventId, bracket) => {
    set(state => ({
      events:      state.events.map(e => e.id === eventId ? { ...e, bracket } : e),
      activeEvent: state.activeEvent?.id === eventId ? { ...state.activeEvent, bracket } : state.activeEvent,
    }));
  },
}));
