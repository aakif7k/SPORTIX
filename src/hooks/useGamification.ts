/**
 * Level, Pulse, streak rewards, missions, coins and badges — all from the API.
 *
 * gamificationStore held every one of these as client state seeded with fixtures:
 * 2,450 Pulse, 3,800 XP, level 25, a 3-day streak, three missions, seven daily
 * rewards with days 1-3 pre-claimed, and five badges. It also computed the level
 * from the *current* Pulse score, which disagrees with the server: levels track
 * lifetime earned Pulse, so spending or losing Pulse must never demote anyone.
 *
 * Nothing here derives a level, a tier or a reward. The server owns all of it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const gamificationKeys = {
  all: ['gamification'] as const,
  streak: () => ['gamification', 'streak'] as const,
  missions: () => ['gamification', 'missions'] as const,
  badges: () => ['gamification', 'badges'] as const,
  coins: () => ['gamification', 'coins'] as const,
};

export interface ApiLevel {
  current_level: number;
  current_pulse: number;
  total_pulse_ever: number;
  pulse_for_next: number;
  progress_percent: number;
  prestige_rank: string;
  level_ups_count: number;
}

export interface ApiPulse {
  total_pulse: number;
  match_performance: number;
  consistency: number;
  team_chemistry: number;
  reliability: number;
  activity: number;
  leadership: number;
  tier: string;
}

export interface ApiStreakRung {
  day: number;
  label: string;
  pulse: number;
  coins: number;
  icon: string;
  xp_booster?: number;
  is_bonus_day?: boolean;
  claimed: boolean;
  is_today: boolean;
  is_locked: boolean;
}

export interface ApiStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  claimed_today: boolean;
  rewards: ApiStreakRung[];
}

export interface ApiMission {
  $id?: string;
  mission_key: string;
  title: string;
  description: string | null;
  progress: number;
  target: number;
  is_claimed: boolean;
  reward_coins: number;
  reward_pulse: number;
  category: string | null;
}

export interface ApiBadge {
  $id: string;
  key?: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string | null;
  unlocked: boolean;
  unlocked_at: string | null;
}

function listOf<T>(data: unknown, ...keys: string[]): T[] {
  const d = data as Record<string, unknown> | undefined;
  for (const key of ['items', 'documents', ...keys]) {
    if (Array.isArray(d?.[key])) return d[key] as T[];
  }
  return Array.isArray(d) ? (d as T[]) : [];
}

/** The athlete's Pulse and level, which the server computes together. */
export function usePulseAndLevel() {
  const pulse = useQuery<ApiPulse, ApiError>({
    queryKey: qk.pulse.me(),
    queryFn: async () => (await api.get<{ data: ApiPulse }>('/api/pulse/me')).data,
  });

  const level = useQuery<ApiLevel, ApiError>({
    queryKey: qk.pulse.level(),
    queryFn: async () => (await api.get<{ data: ApiLevel }>('/api/pulse/me/level')).data,
  });

  return {
    pulse: pulse.data ?? null,
    level: level.data ?? null,
    loading: pulse.isPending || level.isPending,
    error: (pulse.error ?? level.error ?? null) as ApiError | null,
    refresh: () => { pulse.refetch(); level.refetch(); },
  };
}

export function useStreak() {
  const queryClient = useQueryClient();

  const query = useQuery<ApiStreak, ApiError>({
    queryKey: gamificationKeys.streak(),
    queryFn: async () => (await api.get<{ data: ApiStreak }>('/api/missions/streak')).data,
  });

  const claim = useMutation({
    mutationFn: async () => (await api.post<{
      data: { day: number; pulse_awarded: number; coins_awarded: number; leveled_up: boolean };
    }>('/api/missions/streak/claim', {})).data,
    onSuccess: res => {
      toast.success(
        `Day ${res.day} claimed: +${res.pulse_awarded} Pulse, +${res.coins_awarded} coins`);
      // Pulse, level, coins and the ladder all moved server-side.
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
      queryClient.invalidateQueries({ queryKey: qk.pulse.all });
      if (res.leveled_up) toast.success('You levelled up');
    },
    // "Already claimed today" is a 400 and is not worth a red toast — the ladder
    // already shows it as collected.
    onError: (e: ApiError) => {
      if (e.status !== 400) toast.error(e.message || 'Could not claim that reward');
    },
  });

  return {
    streak: query.data ?? null,
    rewards: query.data?.rewards ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    claimDaily: claim.mutateAsync,
    claiming: claim.isPending,
  };
}

export function useMissions() {
  const queryClient = useQueryClient();

  const query = useQuery<ApiMission[], ApiError>({
    queryKey: gamificationKeys.missions(),
    queryFn: async () => listOf<ApiMission>(
      (await api.get<{ data: unknown }>('/api/missions/today')).data, 'missions'),
  });

  const claim = useMutation({
    mutationFn: (missionId: string) => api.post(`/api/missions/claim/${missionId}`, {}),
    onSuccess: () => {
      toast.success('Mission reward claimed');
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
      queryClient.invalidateQueries({ queryKey: qk.pulse.all });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not claim that mission'),
  });

  return {
    missions: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    claimMission: claim.mutateAsync,
  };
}

export function useBadges() {
  const query = useQuery<ApiBadge[], ApiError>({
    queryKey: gamificationKeys.badges(),
    queryFn: async () => listOf<ApiBadge>(
      (await api.get<{ data: unknown }>('/api/badges/me')).data, 'badges'),
  });

  return {
    badges: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useCoins() {
  const query = useQuery<{ balance: number; total_earned: number; total_spent: number }, ApiError>({
    queryKey: gamificationKeys.coins(),
    queryFn: async () => {
      const res = await api.get<{
        data: { balance?: number; total_earned?: number; total_spent?: number };
      }>('/api/coins/balance');
      return {
        balance: Number(res.data?.balance ?? 0),
        total_earned: Number(res.data?.total_earned ?? 0),
        total_spent: Number(res.data?.total_spent ?? 0),
      };
    },
  });

  return {
    coins: query.data ?? { balance: 0, total_earned: 0, total_spent: 0 },
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
  };
}
