import { create } from 'zustand';
import type { AITeamResult } from '../types';

/**
 * AutoSquad generation state for AITeamBuilder — and nothing else.
 *
 * This store used to hold `events` seeded from mockData plus a full client-side
 * implementation of the event lifecycle: addEvent, updateEvent, deleteEvent,
 * joinEvent and leaveEvent with their own capacity and duplicate-entry checks,
 * updateEventStatus, and updateBracket. All of it duplicated rules the server owns,
 * and none of it had a caller left once the event pages moved onto the API — the
 * checks were being made twice, in one place against data that no longer existed.
 *
 * What remains is genuinely client state: whether a generation is in flight, and
 * the result being displayed.
 */
interface EventUIState {
  aiTeamResult: AITeamResult | null;
  isGenerating: boolean;
  setAITeamResult: (result: AITeamResult | null) => void;
  setIsGenerating: (val: boolean) => void;
}

export const useEventStore = create<EventUIState>((set) => ({
  aiTeamResult: null,
  isGenerating: false,
  setAITeamResult: (result) => set({ aiTeamResult: result }),
  setIsGenerating: (val) => set({ isGenerating: val }),
}));
