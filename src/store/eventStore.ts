import { create } from 'zustand';
import type { Event, AITeamResult, BracketRound, EventStatus } from '../types';

interface EventState {
  events: Event[];
  activeEvent: Event | null;
  aiTeamResult: AITeamResult | null;
  isGenerating: boolean;
  
  // Basic Actions
  setActiveEvent: (event: Event | null) => void;
  setAITeamResult: (result: AITeamResult | null) => void;
  setIsGenerating: (val: boolean) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  // Architectural Event Lifecycle Actions
  joinEvent: (eventId: string, userId: string) => { success: boolean; message: string };
  leaveEvent: (eventId: string, userId: string) => { success: boolean; message: string };
  updateEventStatus: (eventId: string, status: EventStatus) => void;
  updateBracket: (eventId: string, bracket: BracketRound[]) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  // Was seeded with MOCK_EVENTS, which is how eight fixtures ended up being
  // "the events" on any screen that read this store. Events come from the API;
  // what is left here is the AutoSquad generation state AITeamBuilder needs,
  // and the client-side event actions below are dead weight kept only until
  // that page moves onto a server-side AI proxy.
  events: [],
  activeEvent: null,
  aiTeamResult: null,
  isGenerating: false,

  setActiveEvent: (event) => set({ activeEvent: event }),
  setAITeamResult: (result) => set({ aiTeamResult: result }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  
  addEvent: (event) => set(state => ({ events: [event, ...state.events] })),
  
  updateEvent: (id, updates) => set(state => ({
    events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
    activeEvent: state.activeEvent?.id === id ? { ...state.activeEvent, ...updates } : state.activeEvent
  })),

  deleteEvent: (id) => set(state => ({
    events: state.events.filter(e => e.id !== id),
    activeEvent: state.activeEvent?.id === id ? null : state.activeEvent
  })),

  // Concurrency-safe event registration with slot availability checks
  joinEvent: (eventId: string, userId: string) => {
    const events = get().events;
    const targetEvent = events.find(e => e.id === eventId);

    if (!targetEvent) {
      return { success: false, message: 'Tournament event not found.' };
    }

    if (targetEvent.participants.includes(userId)) {
      return { success: false, message: 'You are already registered for this event.' };
    }

    if (targetEvent.participants.length >= targetEvent.maxParticipants) {
      return { success: false, message: 'Registration closed. All tournament slots are filled.' };
    }

    const updatedParticipants = [...targetEvent.participants, userId];
    
    set(state => ({
      events: state.events.map(e => 
        e.id === eventId ? { ...e, participants: updatedParticipants } : e
      ),
      activeEvent: state.activeEvent?.id === eventId 
        ? { ...state.activeEvent, participants: updatedParticipants } 
        : state.activeEvent
    }));

    return { success: true, message: 'Successfully registered for tournament clash!' };
  },

  // Atomic cancellation of event registration
  leaveEvent: (eventId: string, userId: string) => {
    const events = get().events;
    const targetEvent = events.find(e => e.id === eventId);

    if (!targetEvent) {
      return { success: false, message: 'Tournament event not found.' };
    }

    if (!targetEvent.participants.includes(userId)) {
      return { success: false, message: 'You are not registered for this event.' };
    }

    const updatedParticipants = targetEvent.participants.filter(p => p !== userId);

    set(state => ({
      events: state.events.map(e => 
        e.id === eventId ? { ...e, participants: updatedParticipants } : e
      ),
      activeEvent: state.activeEvent?.id === eventId 
        ? { ...state.activeEvent, participants: updatedParticipants } 
        : state.activeEvent
    }));

    return { success: true, message: 'Registration cancelled.' };
  },

  // Lifecycle status transition
  updateEventStatus: (eventId: string, status: EventStatus) => {
    set(state => ({
      events: state.events.map(e => e.id === eventId ? { ...e, status } : e),
      activeEvent: state.activeEvent?.id === eventId ? { ...state.activeEvent, status } : state.activeEvent
    }));
  },

  // Update bracket results
  updateBracket: (eventId: string, bracket: BracketRound[]) => {
    set(state => ({
      events: state.events.map(e => e.id === eventId ? { ...e, bracket } : e),
      activeEvent: state.activeEvent?.id === eventId ? { ...state.activeEvent, bracket } : state.activeEvent
    }));
  }
}));
