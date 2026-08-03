/**
 * Types matching what the API actually returns.
 *
 * snake_case, deliberately. The convention for this codebase is that Appwrite
 * attribute keys, FastAPI bodies and frontend interfaces all agree, with only
 * Appwrite's own $-prefixed system fields passing through untouched. The older
 * camelCase types in types/index.ts describe mockData shapes and are replaced
 * page by page as each screen moves onto the API; both exist for now because the
 * migration is incremental, and mixing the two in one component is what produced
 * the original field-casing drift.
 */

export interface ApiEvent {
  $id: string;
  title: string;
  description: string | null;
  sport: string;
  format: 'solo' | 'team' | 'tournament' | 'league';
  skill_level: 'beginner' | 'amateur' | 'semi_pro' | 'pro' | 'elite';
  organizer_id: string;
  venue: string | null;
  location: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  starts_at: string;
  ends_at: string | null;
  registration_deadline: string | null;
  max_participants: number;
  min_participants: number | null;
  current_participants: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  banner_url: string | null;
  banner_alignment: 'top' | 'center' | 'bottom' | null;
  prize_pool: string | null;
  entry_fee: string | null;
  rules: string[];
  tags: string[];
  ai_team_available: boolean;
  ai_generated: boolean;
  created_at: string;
  $createdAt: string;
}

export interface ApiEventParticipant {
  $id: string;
  event_id: string;
  user_id: string;
  role: string | null;
  crew_id: string | null;
  squad_id: string | null;
  entry_type: 'solo' | 'squad' | 'crew';
  status: 'registered' | 'confirmed' | 'withdrawn';
  joined_at: string;
}

/** Every list endpoint returns this shape inside `data`. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiSquad {
  $id: string;
  name: string;
  sport: string;
  captain_id: string;
  logo_url: string | null;
  formation: string | null;
  tactical_notes: string | null;
  max_members: number;
  members_count: number;
  win_rate: number;
  chemistry_score: number;
  pulse_avg: number;
  trust: number;
  coordination: number;
  communication: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  xp_boost_active: boolean;
  streak_multiplier: number;
  last_active: string | null;
  created_at: string;
  $createdAt: string;
}

export type SquadRole =
  | 'captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member';

export interface ApiSquadMember {
  $id: string;
  squad_id: string;
  user_id: string;
  role: SquadRole;
  position: string | null;
  readiness: 'ready' | 'maybe' | 'unavailable';
  joined_at: string;
  // Joined from the member's profile by GET /api/squads/{id}/members. The rows
  // themselves hold only user_id, so a roster had no names to show.
  full_name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
  level: number;
  pulse_score: number;
}

export interface ApiSquadChemistry {
  squad_id: string;
  overall: number;
  trust: number;
  coordination: number;
  communication: number;
  chemistry_score: number;
  pulse_avg: number;
  members_count: number;
  matches_played: number;
}
