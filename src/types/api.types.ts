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

// ─── Messaging ────────────────────────────────────────────────────────────────
// The browser subscribes to these two collections for live delivery, so these
// shapes describe both an API response and a realtime payload. The one
// difference is called out on ApiSquadMessage.

export interface ApiParticipant {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
}

export interface ApiConversation {
  $id: string;
  participant_ids: string[];
  is_event_chat: boolean;
  event_id: string | null;
  event_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  $createdAt: string;
  // Resolved by the server from conversation_members so a thread header needs no
  // second request. Excludes the caller.
  participants: ApiParticipant[];
  unread_count: number;
  last_read_at: string | null;
}

export type MessageMediaType = 'image' | 'video' | 'file';

export interface ApiMessage {
  $id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  media_type: MessageMediaType | null;
  read_by: string[];
  created_at: string;
  $createdAt: string;
  // Joined on the API's own responses; absent on a realtime payload, which is
  // the raw document.
  sender?: ApiParticipant;
}

export type SquadMessageType =
  | 'text' | 'announcement' | 'poll' | 'tactical' | 'achievement';

export interface ApiSquadMessage {
  $id: string;
  squad_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_avatar_url: string | null;
  sender_role: string | null;
  content: string;
  type: SquadMessageType;
  attachment_url: string | null;
  // Appwrite has no JSON type, so these are string columns. GET parses them; a
  // realtime payload still carries the raw string, which is why the squad
  // channel refetches on a socket event instead of appending the payload.
  poll_data: Record<string, unknown> | string | null;
  tactical_data: Record<string, unknown> | string | null;
  announcement_data: Record<string, unknown> | string | null;
  created_at: string;
  $createdAt: string;
}

// ─── Squad match history ──────────────────────────────────────────────────────

export interface ApiTopPerformer {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  match_rating: number;
  is_mvp: boolean;
  stats_summary: string;
  /** False until three teammates have confirmed the numbers. */
  is_validated: boolean;
}

export interface ApiSquadMatch {
  $id: string;
  event_id: string | null;
  home_squad_id: string | null;
  away_squad_id: string | null;
  sport: string;
  opponent_name: string | null;
  result: 'pending' | 'win' | 'loss' | 'draw';
  score_home: number | null;
  score_away: number | null;
  status: 'active' | 'completed' | 'cancelled';
  played_at: string | null;
  chemistry_delta: number;
  created_at: string;
  $createdAt: string;
  /** W/L/D, or null when the result was never entered. */
  outcome: 'W' | 'L' | 'D' | null;
  score: string | null;
  top_performer: ApiTopPerformer | null;
}

// ─── Leadership ───────────────────────────────────────────────────────────────

export interface LeadershipComponents {
  attendance: number;
  communication: number;
  reliability: number;
  squad_approval: number;
  event_participation: number;
}

export interface ApiLeadershipStanding {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  pulse_score: number;
  role: SquadRole;
  joined_at: string | null;
  components: LeadershipComponents;
  score: number;
}

export interface ApiLeadershipRecommendation {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  score: number;
  components: LeadershipComponents;
  current_role: SquadRole;
  strengths: string[];
  matches_analysed: number;
}

export interface ApiLeadershipBallot {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  vote: 'approve' | 'reject' | null;
}

export interface ApiLeadershipVote {
  candidate: { user_id: string; full_name: string; username: string; avatar_url: string | null };
  approve: number;
  reject: number;
  total_members: number;
  votes_needed: number;
  my_vote: 'approve' | 'reject' | null;
  opened_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  ballots: ApiLeadershipBallot[];
}

export interface ApiLeadership {
  squad_id: string;
  captain: ApiLeadershipStanding | null;
  captain_since: string | null;
  is_captain: boolean;
  component_labels: Record<keyof LeadershipComponents, string>;
  standings: ApiLeadershipStanding[];
  recommendation: ApiLeadershipRecommendation | null;
  vote: ApiLeadershipVote | null;
  roles: Array<{ role: SquadRole; member: ApiLeadershipStanding | null }>;
}
