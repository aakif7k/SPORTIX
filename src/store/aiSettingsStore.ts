/**
 * aiSettingsStore.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every AI / Progression setting in SportiX.
 * All values are persisted in localStorage so they survive page reloads.
 *
 * Settings governed here:
 *  • aiDailyLimit        — enforce 3-generation/day cap on AutoSquad AI
 *  • aiGeminiLogs        — show real-time Gemini thought-logs in the UI
 *  • squadAutoAccept     — auto-join squad drafts from high-chemistry teammates
 *  • badgeOnProfile/Feed/Events/Squads — badge visibility toggles
 *
 * Daily limit logic:
 *  The store tracks { date, count } in localStorage key "sportix_ai_daily".
 *  On every read it checks if `date` matches today; if not it resets to 0.
 *  `canGenerateToday()` returns true when limit is off OR count < 3.
 *  `recordGeneration()` increments the counter (call after a successful gen).
 */

import { create } from 'zustand';

const STORAGE_KEY = 'sportix_ai_settings';
const DAILY_KEY   = 'sportix_ai_daily';
const DAILY_LIMIT = 3;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AISettingsState {
  // ── AI Config ──────────────────────────────────────────────────────────────
  aiDailyLimitEnabled: boolean;   // enforce 3 generations/day cap
  aiGeminiLogsEnabled: boolean;   // show Gemini thought-log during AutoSquad
  squadAutoAccept:     boolean;   // auto-accept squad invites from high-chem teammates

  // ── Badge Visibility ───────────────────────────────────────────────────────
  badgeOnProfile: boolean;
  badgeOnFeed:    boolean;
  badgeOnEvents:  boolean;
  badgeOnSquads:       boolean;

  // ── Nearby Radius Settings ──────────────────────────────────────────────────
  nearbyRadius:        number;   // user-selected nearby search radius in KM
  isCustomRadius:      boolean;  // whether custom radius is selected

  // ── Derived / counters ─────────────────────────────────────────────────────
  dailyGenerationsUsed: number;   // how many AI squads generated today
  lastGenerationDate:   string;   // YYYY-MM-DD of last gen (for reset detection)

  // ── Actions ────────────────────────────────────────────────────────────────
  setAiDailyLimitEnabled: (v: boolean) => void;
  setAiGeminiLogsEnabled: (v: boolean) => void;
  setSquadAutoAccept:     (v: boolean) => void;
  setBadgeOnProfile:      (v: boolean) => void;
  setBadgeOnFeed:         (v: boolean) => void;
  setBadgeOnEvents:       (v: boolean) => void;
  setBadgeOnSquads:       (v: boolean) => void;
  setNearbyRadius:        (v: number) => void;
  setIsCustomRadius:      (v: boolean) => void;

  /** Returns true if the user is allowed to generate another AI squad today */
  canGenerateToday: () => boolean;
  /** Call this AFTER a successful squad generation to increment the daily counter */
  recordGeneration: () => void;
  /** Returns remaining generations allowed today (Infinity when limit off) */
  remainingGenerations: () => number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function loadDaily(): { count: number; date: string } {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { count: number; date: string };
      if (parsed.date === todayStr()) return parsed;
    }
  } catch { /* ignore */ }
  // New day or no data
  const fresh = { count: 0, date: todayStr() };
  localStorage.setItem(DAILY_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveDaily(count: number): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify({ count, date: todayStr() }));
}

function loadSettings(): Partial<AISettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveSettings(patch: object): void {
  try {
    const existing = loadSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch { /* ignore */ }
}

// ─── Initial values ───────────────────────────────────────────────────────────
const saved  = loadSettings();
const daily  = loadDaily();

const defaults: Pick<
  AISettingsState,
  | 'aiDailyLimitEnabled' | 'aiGeminiLogsEnabled' | 'squadAutoAccept'
  | 'badgeOnProfile' | 'badgeOnFeed' | 'badgeOnEvents' | 'badgeOnSquads'
  | 'nearbyRadius' | 'isCustomRadius'
> = {
  aiDailyLimitEnabled: true,
  aiGeminiLogsEnabled: true,
  squadAutoAccept:     false,
  badgeOnProfile:      true,
  badgeOnFeed:         true,
  badgeOnEvents:       true,
  badgeOnSquads:       true,
  nearbyRadius:        100,
  isCustomRadius:      false,
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAISettingsStore = create<AISettingsState>((set, get) => ({
  // Merge saved settings over defaults
  ...defaults,
  ...saved,

  // Daily counter (always re-loaded fresh to catch day rollovers)
  dailyGenerationsUsed: daily.count,
  lastGenerationDate:   daily.date,

  // ── Setters ───────────────────────────────────────────────────────────────
  setAiDailyLimitEnabled: (v) => {
    saveSettings({ aiDailyLimitEnabled: v });
    set({ aiDailyLimitEnabled: v });
  },
  setAiGeminiLogsEnabled: (v) => {
    saveSettings({ aiGeminiLogsEnabled: v });
    set({ aiGeminiLogsEnabled: v });
  },
  setSquadAutoAccept: (v) => {
    saveSettings({ squadAutoAccept: v });
    set({ squadAutoAccept: v });
  },
  setBadgeOnProfile: (v) => {
    saveSettings({ badgeOnProfile: v });
    set({ badgeOnProfile: v });
  },
  setBadgeOnFeed: (v) => {
    saveSettings({ badgeOnFeed: v });
    set({ badgeOnFeed: v });
  },
  setBadgeOnEvents: (v) => {
    saveSettings({ badgeOnEvents: v });
    set({ badgeOnEvents: v });
  },
  setBadgeOnSquads: (v) => {
    saveSettings({ badgeOnSquads: v });
    set({ badgeOnSquads: v });
  },
  setNearbyRadius: (v) => {
    saveSettings({ nearbyRadius: v });
    set({ nearbyRadius: v });
  },
  setIsCustomRadius: (v) => {
    saveSettings({ isCustomRadius: v });
    set({ isCustomRadius: v });
  },

  // ── Daily limit logic ─────────────────────────────────────────────────────
  canGenerateToday: () => {
    const { aiDailyLimitEnabled, dailyGenerationsUsed, lastGenerationDate } = get();
    // If limit is off — always allowed
    if (!aiDailyLimitEnabled) return true;
    // If stored date is not today reset silently
    if (lastGenerationDate !== todayStr()) return true;
    return dailyGenerationsUsed < DAILY_LIMIT;
  },

  recordGeneration: () => {
    const { lastGenerationDate, dailyGenerationsUsed } = get();
    const today = todayStr();
    const newCount = lastGenerationDate === today ? dailyGenerationsUsed + 1 : 1;
    saveDaily(newCount);
    set({ dailyGenerationsUsed: newCount, lastGenerationDate: today });
  },

  remainingGenerations: () => {
    const { aiDailyLimitEnabled, dailyGenerationsUsed, lastGenerationDate } = get();
    if (!aiDailyLimitEnabled) return Infinity;
    if (lastGenerationDate !== todayStr()) return DAILY_LIMIT;
    return Math.max(0, DAILY_LIMIT - dailyGenerationsUsed);
  },
}));
