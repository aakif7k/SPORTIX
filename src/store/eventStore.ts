import { create } from 'zustand';
import type { Event, AITeamResult } from '../types';
import { MOCK_EVENTS } from '../services/mockData';

interface EventState {
  events: Event[];
  activeEvent: Event | null;
  aiTeamResult: AITeamResult | null;
  isGenerating: boolean;
  setActiveEvent: (event: Event | null) => void;
  setAITeamResult: (result: AITeamResult | null) => void;
  setIsGenerating: (val: boolean) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: MOCK_EVENTS,
  activeEvent: null,
  aiTeamResult: null,
  isGenerating: false,
  setActiveEvent: (event) => set({ activeEvent: event }),
  setAITeamResult: (result) => set({ aiTeamResult: result }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  addEvent: (event) => set(state => ({ events: [event, ...state.events] })),
  updateEvent: (id, updates) => set(state => ({
    events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
  })),
  deleteEvent: (id) => set(state => ({
    events: state.events.filter(e => e.id !== id),
  })),
}));
