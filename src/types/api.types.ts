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
