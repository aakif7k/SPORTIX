export interface Athlete {
  uid: string;
  name: string;
  avatar: string;
  sport: string;
  position: string;
  pulseScore: number;
  tier?: 'CONTENDER' | 'ELITE' | 'PULSE ELITE';
  compatibility?: number;
  role?: 'captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member';
  readiness?: 'Ready' | 'Maybe' | 'Unavailable';
  experienceLevel?: string;
  level?: number;
  distance?: number;
  username?: string;
}

export interface ChemistryData {
  overall: number;
  trust: number;
  coordination: number;
  communication: number;
  retentionScore?: number;
  activityScore?: number;
  consistencyScore?: number;
  approvalScore?: number;
}

export interface MatchResult {
  matchId: string;
  squadId: string;
  opponentName: string;
  result: 'W' | 'L' | 'D';
  score: string;
  date: string;
  chemistryDelta: number;
  topPerformer?: {
    uid: string;
    name: string;
    avatar: string;
    statsSummary: string;
  };
}

export interface Squad {
  squadId: string;
  name: string;
  sport: string;
  captainId: string;
  members: Athlete[];
  chemistry: ChemistryData;
  pulseAvg: number;
  winRate: number;
  matchHistory: MatchResult[];
  achievements: {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
  }[];
  formation: string;
  tacticalNotes: string;
  createdAt: string;
  lastActive: string;
  tournamentIds: string[];
  events?: {
    eventId: string;
    title: string;
    date: string;
    type: 'practice' | 'match';
    status: 'confirmed' | 'pending';
    votes: Record<string, 'yes' | 'no'>;
  }[];
  posts?: {
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    mediaUrl?: string;
    timestamp: string;
    likes: string[];
  }[];
  xpBoostActive?: boolean;
  streakMultiplier?: number;
  tags?: string[];
  lookingFor?: string[];
}

export interface ChatMessage {
  msgId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  content: string;
  type: 'text' | 'tactical' | 'schedule' | 'poll' | 'announcement' | 'achievement';
  tacticalData?: {
    formation: string;
    notes: string;
  };
  scheduleData?: {
    date: string;
    title: string;
  };
  pollData?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
  };
  announcementData?: {
    matchTime: string;
    venue: string;
  };
  timestamp: string;
}

export interface Tournament {
  tournamentId: string;
  title: string;
  sport: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  prizePool: string;
  location: string;
  banner: string;
  registeredCount: number;
  maxTeams: number;
  squadIds: string[];
}

export interface SportRoleConfig {
  sport_id: string;
  sport_name: string;
  total_players: number;
  role_1: string;
  role_1_count: number;
  role_2: string;
  role_2_count: number;
  role_3: string;
  role_3_count: number;
  role_4: string;
  role_4_count: number;
  tactical_notes?: string;
}

export interface RoleSlot {
  role_name: string;
  required_count: number;
  assigned_count: number;
  is_filled: boolean;
  assigned_users: string[];
}

export interface DynamicTeam {
  team_index: number;
  team_name: string;
  roles: RoleSlot[];
  status: 'READY' | 'FORMING' | 'WAITING';
  total_capacity: number;
  current_players: number;
  remaining_players: number;
  players: {
    user_id: string;
    name: string;
    assigned_role: string;
  }[];
}

export interface WaitingPlayer {
  user_id: string;
  name: string;
  selected_role: string;
  reason: string;
}

export interface EventAllocationResult {
  sport_name: string;
  total_players_per_team: number;
  registered_count: number;
  total_teams_forming: number;
  complete_teams_count: number;
  partial_teams_count: number;
  overall_readiness_pct: number;
  teams: DynamicTeam[];
  waiting_players: WaitingPlayer[];
  role_remaining_space: Record<string, number>;
  missing_roles_summary: {
    team_name: string;
    role_name: string;
    needed_count: number;
  }[];
}
