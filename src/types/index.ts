// ─── CORE USER TYPES ───────────────────────────────────────────────────────

export type UserRole = 'athlete' | 'recruiter' | 'coach' | 'organizer';

export type SportCategory =
  | 'football' | 'basketball' | 'tennis' | 'cricket' | 'swimming'
  | 'athletics' | 'boxing' | 'cycling' | 'volleyball' | 'rugby'
  | 'baseball' | 'golf' | 'hockey' | 'mma' | 'gymnastics'
  | 'rowing' | 'skiing' | 'surfing' | 'wrestling' | 'badminton';

export type ExperienceLevel = 'amateur' | 'semi-pro' | 'professional' | 'elite';

export interface UserStats {
  matches: number;
  events: number;
  followers: number;
  following: number;
  wins: number;
  losses: number;
  rating: number;
  yearsExperience: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface User {
  id: string;
  uid: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  role: UserRole;
  sport: SportCategory;
  sports: SportCategory[];
  location: string;
  bio: string;
  stats: UserStats;
  experienceLevel: ExperienceLevel;
  achievements: Achievement[];
  openToRecruit: boolean;
  isOnline: boolean;
  isVerified: boolean;
  level?: number;
  createdAt: string;
  performanceData: PerformanceData;
  isOnboardingComplete?: boolean;
  date_of_birth?: string | null;
  jersey?: string;
  position?: string;
  height?: string;
  weight?: string;
  nationality?: string;
  phone?: string;
  dateOfBirth?: string | null;
  club?: string;
  agent?: string;
  preferredFoot?: string;
  trainingSchedule?: string;
  injuryHistory?: string;
  socials?: {
    instagram: string;
    twitter: string;
    youtube: string;
    linkedin: string;
    website: string;
  };
  privateProfile?: boolean;
  showStats?: boolean;
  showLocation?: boolean;
  emailNotif?: boolean;
  pushNotif?: boolean;
  matchAlerts?: boolean;
  recruitAlerts?: boolean;
  themePref?: 'dark' | 'volt' | 'red';
}

export interface PerformanceData {
  speed: number;
  strength: number;
  endurance: number;
  agility: number;
  technique: number;
  teamwork: number;
}

// ─── POST TYPES ────────────────────────────────────────────────────────────

export type PostCategory = 'training' | 'highlights' | 'achievements' | 'events' | 'general';

export interface PostReaction {
  likes: string[];
  comments: Comment[];
  shares: number;
  saves: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: string[];
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  category: PostCategory;
  reactions: PostReaction;
  timestamp: string;
  isSponsored?: boolean;
}

// ─── EVENT TYPES ───────────────────────────────────────────────────────────

export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type EventFormat = 'solo' | 'team' | 'tournament' | 'league';

export interface SportPosition {
  id: string;
  name: string;
  abbreviation: string;
  stats: string[];
}

export interface TeamMember {
  userId: string;
  name: string;
  avatar: string;
  position: string;
  skillScore: number;
  stats: Record<string, number>;
  compatibilityScore: number;
}

export interface Team {
  id: string;
  name: string;
  sport: SportCategory;
  members: TeamMember[];
  overallRating: number;
  compatibilityRating: number;
  aiGenerated: boolean;
  captain?: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  team1?: string;
  team2?: string;
  winner?: string;
  score?: { team1: number; team2: number };
  scheduledTime?: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface BracketRound {
  round: number;
  name: string;
  matches: BracketMatch[];
}

export interface Event {
  id: string;
  title: string;
  sport: SportCategory;
  description: string;
  date: string;
  endDate?: string;
  venue: string;
  location: string;
  format: EventFormat;
  skillLevel: ExperienceLevel;
  maxParticipants: number;
  participants: string[];
  teams: Team[];
  bracket?: BracketRound[];
  organizerId: string;
  bannerImage?: string;
  banner_image_file_id?: string;
  banner_image_url?: string;
  bannerAlignment?: 'top' | 'center' | 'bottom';
  status: EventStatus;
  aiTeamAvailable: boolean;
  aiGenerated: boolean;
  prizePool?: string;
  entryFee?: string;
  rules: string[];
  tags: string[];
  createdAt: string;
}

// ─── MESSAGE TYPES ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  timestamp: string;
  read: boolean;
  reactions?: Record<string, string[]>;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Pick<User, 'id' | 'name' | 'avatar' | 'isOnline'>[];
  lastMessage?: Message;
  unreadCount: number;
  isEventChat: boolean;
  eventId?: string;
  eventName?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── NOTIFICATION TYPES ────────────────────────────────────────────────────

export type NotificationType =
  | 'event_invite' | 'ai_match' | 'connection_request'
  | 'like' | 'comment' | 'match_reminder' | 'team_update' | 'achievement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  relatedId?: string;
  relatedType?: 'event' | 'post' | 'user' | 'team';
  actorAvatar?: string;
  actorName?: string;
}

// ─── AI SERVICE TYPES ──────────────────────────────────────────────────────

export interface AITeamResult {
  team: Team;
  reasoning: string;
  compatibilityBreakdown: Record<string, number>;
  alternateOptions: Team[];
  analysisLog: string[];
}

export interface AIRecommendation {
  type: 'event' | 'athlete' | 'team';
  score: number;
  reason: string;
  data: Event | User | Team;
}

// ─── FILTER TYPES ─────────────────────────────────────────────────────────

export interface AthleteFilters {
  sport?: SportCategory;
  experienceLevel?: ExperienceLevel;
  location?: string;
  openToRecruit?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface EventFilters {
  sport?: SportCategory;
  status?: EventStatus;
  format?: EventFormat;
  skillLevel?: ExperienceLevel;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  aiTeamAvailable?: boolean;
}

// ─── STORY TYPE ────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  userAvatar: string;
  userName: string;
  userSport: SportCategory;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  viewed: boolean;
}
