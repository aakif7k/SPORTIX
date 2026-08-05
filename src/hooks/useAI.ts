/**
 * The AI features, through the server-side proxy.
 *
 * services/aiService.ts and services/squadAI.ts called Gemini from the browser
 * with VITE_GEMINI_API_KEY, so the key was in the bundle. Nothing here holds a
 * key; it calls /api/ai.
 *
 * Every hook distinguishes "AI is not configured" from "the call failed". A server
 * without a key answers 503 AI_UNAVAILABLE, and a page should say so rather than
 * showing an error or, worse, inventing content.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';

export const aiKeys = {
  all: ['ai'] as const,
  health: () => ['ai', 'health'] as const,
  insight: () => ['ai', 'performance-insight'] as const,
};

export interface AIHealth {
  ok: boolean;
  configured: boolean;
  model?: string;
  message: string;
}

export interface AISuggestedSelection {
  id: string;
  assigned_role: string;
  why: string;
}

export interface AICandidate {
  $id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
  position: string | null;
  experience_level: string;
  level: number;
  pulse_score: number;
}

export interface AISquadSuggestion {
  selected: AISuggestedSelection[];
  reasoning: string;
  ai_used: boolean;
  discarded?: number;
  candidates: AICandidate[];
}

export interface AIInsight { title: string; detail: string }

export function useAIHealth() {
  const query = useQuery<AIHealth, ApiError>({
    queryKey: aiKeys.health(),
    // Whether a server has a key configured does not change minute to minute.
    staleTime: 10 * 60 * 1000,
    queryFn: async () => (await api.get<{ data: AIHealth }>('/api/ai/health')).data,
  });

  return {
    health: query.data ?? null,
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useSquadSuggestion() {
  const suggest = useMutation({
    mutationFn: async (input: { sport: string; skill_level: string; size?: number; event_id?: string | null }) =>
      (await api.post<{ data: AISquadSuggestion }>('/api/ai/squad-suggestion', {
        sport: input.sport,
        skill_level: input.skill_level,
        size: input.size ?? 5,
        event_id: input.event_id ?? null,
      })).data,
    onError: (e: ApiError) => {
      // A server with no key is a configuration fact, not a failure to shout about.
      if (e.code === 'AI_UNAVAILABLE') {
        toast.error('AI squad building is not enabled on this server.');
        return;
      }
      toast.error(e.message || 'Could not build a squad');
    },
  });

  return {
    suggestSquad: suggest.mutateAsync,
    suggestion: suggest.data ?? null,
    suggesting: suggest.isPending,
    unavailable: (suggest.error as ApiError | null)?.code === 'AI_UNAVAILABLE',
    reset: suggest.reset,
  };
}

export function usePerformanceInsight(enabled: boolean) {
  const query = useQuery<{ insights: AIInsight[]; ai_used: boolean; message?: string }, ApiError>({
    queryKey: aiKeys.insight(),
    enabled,
    // The AI tier allows three calls an hour, so this must not refetch casually.
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () => (await api.get<{
      data: { insights: AIInsight[]; ai_used: boolean; message?: string };
    }>('/api/ai/performance-insight')).data,
  });

  const error = (query.error as ApiError | null) ?? null;
  return {
    insights: query.data?.insights ?? [],
    aiUsed: query.data?.ai_used ?? false,
    message: query.data?.message,
    loading: enabled && query.isPending,
    unavailable: error?.code === 'AI_UNAVAILABLE',
    error,
  };
}
