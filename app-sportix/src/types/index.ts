/**
 * src/types/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical type definitions for SPORTiX mobile app.
 * These types align exactly to the live Appwrite schema attributes.
 * Single source of truth — never duplicate UserProfile shapes.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  /** = Appwrite Auth $id */
  id: string;
  email: string;
  name: string;
}

// ─── UserProfile (matches `profiles` collection exactly) ─────────────────────
export type UserRole = 'athlete' | 'recruiter' | 'coach' | 'organizer';
export type ExperienceLevel = 'amateur' | 'semi_pro' | 'pro' | 'elite';

export interface UserProfile {
  /** = Appwrite document $id = Auth user $id */
  $id: string;
  full_name:              string;
  username:               string;
  email:                  string;
  role:                   UserRole;
  sport:                  string;
  sports:                 string[];
  experience_level:       ExperienceLevel;
  location:               string;
  avatar_url:             string | null;
  bio:                    string;
  is_open_to_recruit:     boolean;
  is_active:              boolean;
  is_onboarding_complete: boolean;
  pulse_score:            number;
  level:                  number;
  coins_balance:          number;
  login_streak:           number;
  city?:                  string;
  $createdAt?:            string;
  $updatedAt?:            string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────
export interface Post {
  $id: string;
  author_id:          string;
  author_full_name:   string;
  author_username:    string;
  author_avatar_url:  string | null;
  author_sport:       string;
  content:            string;
  media_urls:         string[];
  media_type:         'image' | 'video' | null;
  post_type:          string;
  sport_tag:          string;
  location_tag:       string;
  likes_count:        number;
  comments_count:     number;
  is_liked_by_user?:  boolean;
  $createdAt:         string;
}

// ─── Comment ──────────────────────────────────────────────────────────────────
export interface Comment {
  $id:              string;
  post_id:          string;
  author_id:        string;
  author_name:      string;
  author_avatar_url:string | null;
  content:          string;
  created_at:       string;
  $createdAt:       string;
}

// ─── Story ───────────────────────────────────────────────────────────────────
export interface Story {
  $id:              string;
  author_id:        string;
  author_name:      string;
  author_username:  string;
  author_avatar:    string | null;
  media_url:        string;
  media_type:       'image' | 'video';
  caption:          string;
  sport_tag:        string;
  view_count:       number;
  expires_at:       string;
  $createdAt:       string;
  viewed_by_user?:  boolean;
}

// ─── Reel ─────────────────────────────────────────────────────────────────────
export interface Reel {
  $id:              string;
  author_id:        string;
  author_name:      string;
  author_username:  string;
  author_avatar_url:string | null;
  author_sport:     string;
  video_url:        string;
  thumbnail_url:    string | null;
  caption:          string;
  sport_tag:        string;
  likes_count:      number;
  comments_count:   number;
  views_count:      number;
  is_liked_by_user?:boolean;
  $createdAt:       string;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface SportixEvent {
  $id:                  string;
  title:                string;
  description:          string;
  sport:                string;
  event_type:           string;
  date:                 string;
  location:             string;
  organizer_id:         string;
  max_participants:     number;
  current_participants: number;
  status:               EventStatus;
  target_squad_size:    number;
  banner_image_url?:    string;
  entry_fee?:           number;
  skill_level?:         string;
  $createdAt:           string;
}

// ─── EventParticipant ─────────────────────────────────────────────────────────
export type ParticipantStatus = 'registered' | 'confirmed' | 'withdrawn';

export interface EventParticipant {
  $id:           string;
  event_id:      string;
  user_id:       string;
  role:          string;
  selected_role: string;
  status:        ParticipantStatus;
  $createdAt:    string;
}

// ─── Squad ────────────────────────────────────────────────────────────────────
export interface Squad {
  $id:              string;
  name:             string;
  sport:            string;
  captain_id:       string;
  members_count:    number;
  overall_rating:   number;
  chemistry_rating: number;
  $createdAt:       string;
}

export interface SquadMember {
  $id:       string;
  squad_id:  string;
  user_id:   string;
  role:      string;
  position:  string;
  $createdAt:string;
  /** Joined profile data */
  profile?:  UserProfile;
}

// ─── Match ────────────────────────────────────────────────────────────────────
export interface Match {
  $id:       string;
  squad1_id: string;
  squad2_id: string;
  score1:    number;
  score2:    number;
  winner_id: string;
  sport:     string;
  played_at: string;
}

export interface PlayerStat {
  $id:       string;
  match_id:  string;
  user_id:   string;
  goals:     number;
  assists:   number;
  rating:    number;
  validated: boolean;
}

// ─── Pulse / Gamification ─────────────────────────────────────────────────────
export interface PulseScore {
  $id:      string;
  user_id:  string;
  score:    number;
  level:    number;
  streak:   number;
}

export interface Badge {
  $id:         string;
  name:        string;
  description: string;
  icon:        string;
  category:    string;
}

export interface UserBadge {
  $id:       string;
  user_id:   string;
  badge_id:  string;
  earned_at: string;
  badge?:    Badge;
}

export interface DailyMission {
  $id:          string;
  title:        string;
  description:  string;
  reward_coins: number;
  category:     string;
}

export interface UserMission {
  $id:        string;
  user_id:    string;
  mission_id: string;
  progress:   number;
  completed:  boolean;
  mission?:   DailyMission;
}

export interface CoinTransaction {
  $id:         string;
  user_id:     string;
  amount:      number;
  type:        'earn' | 'spend';
  description: string;
  $createdAt:  string;
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export interface Conversation {
  $id:               string;
  name:              string;
  is_group:          boolean;
  avatar_url:        string | null;
  last_message?:     string;
  last_message_at?:  string;
  $createdAt:        string;
  /** Populated client-side */
  unread_count?:     number;
}

export interface ConversationMember {
  $id:             string;
  conversation_id: string;
  user_id:         string;
  profile?:        UserProfile;
}

export interface Message {
  $id:             string;
  conversation_id: string;
  sender_id:       string;
  content:         string;
  $createdAt:      string;
  /** Populated client-side */
  sender?:         UserProfile;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'like' | 'comment' | 'follow' | 'event_join' | 'squad_invite'
  | 'match_report' | 'validation' | 'badge' | 'mission' | 'system';

export interface AppNotification {
  $id:        string;
  user_id:    string;
  title:      string;
  message:    string;
  type:       NotificationType;
  is_read:    boolean;
  created_at: string;
  $createdAt: string;
}

// ─── AutoSquad ────────────────────────────────────────────────────────────────
export interface AutoSquadRequest {
  $id:        string;
  user_id:    string;
  sport:      string;
  status:     'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  $createdAt: string;
}

export interface GeneratedSquad {
  $id:          string;
  request_id:   string;
  event_id?:    string;
  squad_data:   string; // JSON string
  created_at:   string;
  $createdAt:   string;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  $id:         string;
  user_id:     string;
  username:    string;
  avatar_url:  string | null;
  pulse_score: number;
  level:       number;
  sport:       string;
  rank:        number;
}

// ─── Sports Roles ─────────────────────────────────────────────────────────────
export interface SportsRole {
  $id:            string;
  sport_id:       string;
  sport:          string;
  roles:          string[];
  role_1:         string;
  role_1_count:   number;
  role_2:         string;
  role_2_count:   number;
  role_3:         string;
  role_3_count:   number;
  role_4:         string;
  role_4_count:   number;
  total_players:  number;
}

// ─── Followers ────────────────────────────────────────────────────────────────
export interface Follower {
  $id:          string;
  follower_id:  string;
  following_id: string;
  created_at:   string;
  $createdAt:   string;
}
