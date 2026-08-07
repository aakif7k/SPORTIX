export interface Athlete {
  uid: string;
  name: string;
  avatar: string;
  sport: string;
  position: string;
  pulseScore: number;
  tier: 'CONTENDER' | 'ELITE' | 'PULSE ELITE';
  compatibility?: number;
  role?: 'captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member';
  readiness?: 'Ready' | 'Maybe' | 'Unavailable';
  experienceLevel?: string;
  level?: number;
  distance?: number;
  stats?: {
    matches: number;
    wins: number;
    followers: number;
  };
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

export interface PulseScoreBreakdown {
  matchPerf: number;
  consistency: number;
  chemistry: number;
  reliability: number;
  activity: number;
  leadership: number;
}

export interface PulseScoreHistoryItem {
  date: string;
  score: number;
  matchId?: string;
  delta: number;
}

export interface PulseScore {
  userId: string;
  score: number;
  tier: 'CONTENDER' | 'ELITE' | 'PULSE ELITE';
  breakdown: PulseScoreBreakdown;
  history: PulseScoreHistoryItem[];
  lastUpdated: string;
}

export interface MatchResult {
  matchId: string;
  squadId: string;
  opponentName: string;
  result: 'W' | 'L' | 'D';
  score: string;
  date: string;
  chemistryDelta: number;
  topPerformer: {
    uid: string;
    name: string;
    avatar: string;
    statsSummary: string;
  };
  playerStats: Record<string, Record<string, number | string>>;
  validations: Record<string, Record<string, 'confirm' | 'partial' | 'dispute'>>;
  retentionVotes: Record<string, 'definitely' | 'maybe' | 'no'>;
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
  activeCaptainVote?: {
    initiatorId: string;
    candidateId: string;
    votes: Record<string, string>; // userId -> candidateId (or "no")
    status: 'active' | 'completed';
  };
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

export interface ValidationVote {
  targetUserId: string;
  voterId: string;
  voteType: 'confirm' | 'partial' | 'dispute';
  reason?: string;
}

export interface LeadershipData {
  athleteId: string;
  attendance: number;
  communication: number;
  reliability: number;
  squadApproval: number;
  eventParticipation: number;
  score: number;
  strengths: string[];
}

export interface ChatMessage {
  msgId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  content: string;
  type: 'text' | 'announcement' | 'poll' | 'tactical' | 'achievement';
  attachmentUrl?: string;
  timestamp: string;
  pollData?: {
    question: string;
    options: { text: string; votes: number }[];
    votedUsers?: string[];
  };
  tacticalData?: {
    formation?: string;
    notes?: string;
  };
  announcementData?: {
    matchTime?: string;
    venue?: string;
  };
}

export interface Tournament {
  tournamentId: string;
  name: string;
  sport: string;
  squadIds: string[];
  currentRound: number;
  status: 'Registering Open' | 'In Progress' | 'Full';
  startDate: string;
  endDate: string;
  prizePool: string;
  bracket?: {
    rounds: {
      roundName: string;
      matches: {
        matchId: string;
        squadA: { squadId: string; name: string; score?: number; logoUrl?: string };
        squadB: { squadId: string; name: string; score?: number; logoUrl?: string };
        winnerId?: string;
        status: 'TBD' | 'Completed' | 'Scheduled';
        date: string;
      }[];
    }[];
  };
}
