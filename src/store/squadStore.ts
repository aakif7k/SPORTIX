import { create } from 'zustand';
import type { Squad, ChatMessage, Tournament, Athlete } from '../types/pulse.types';
import { useAuthStore } from './authStore';
import { getSquads, updateSquad } from '../services/squadService';
import { getMessages, createMessage } from '../services/messageService';

interface SquadStoreState {
  squads: Squad[];
  activeSquadId: string | null;
  chats: Record<string, ChatMessage[]>;
  tournaments: Tournament[];
  generatedSquads: Squad[];
  dailyGenerationsCount: number;
  lastGenerationDate: string;
  loadData: () => Promise<void>;
  setActiveSquadId: (id: string | null) => void;
  updateTacticalBoard: (squadId: string, formation: string, notes: string) => void;
  sendChatMessage: (squadId: string, message: Omit<ChatMessage, 'msgId' | 'timestamp'>) => void;
  updateSquadSettings: (squadId: string, name: string, formation: string) => void;
  registerSquadForTournament: (squadId: string, tournamentId: string) => void;
  addSquad: (squad: Squad) => void;
  
  // Generated Results actions
  addGeneratedSquad: (squad: Squad) => void;
  declineGeneratedSquad: (squadId: string) => void;
  acceptGeneratedSquad: (squadId: string) => void;
  incrementGenerationsCount: () => void;
  resetGenerationsCount: (date: string) => void;
  
  // Coordination actions
  createSquadEvent: (squadId: string, title: string, date: string, type: 'practice' | 'match') => void;
  votePracticeSchedule: (squadId: string, eventId: string, voterId: string, vote: 'yes' | 'no') => void;
  startCaptainVote: (squadId: string, candidateId: string, initiatorId: string) => void;
  castCaptainVote: (squadId: string, voterId: string, candidateId: string) => void;
  
  // Media Feed actions
  addSquadPost: (squadId: string, content: string, mediaUrl?: string) => void;
  likeSquadPost: (squadId: string, postId: string, userId: string) => void;

  // Session isolation
  reset: () => void;
}

const mockAthletes: Athlete[] = [
  { uid: 'u1', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', sport: 'Football', position: 'ST', pulseScore: 847, tier: 'ELITE', compatibility: 94, role: 'member', readiness: 'Ready', level: 84, distance: 1.2 },
  { uid: 'u2', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', sport: 'Football', position: 'CM', pulseScore: 793, tier: 'ELITE', compatibility: 91, role: 'strategist', readiness: 'Ready', level: 79, distance: 4.5 },
  { uid: 'u3', name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', sport: 'Football', position: 'GK', pulseScore: 721, tier: 'CONTENDER', compatibility: 85, role: 'member', readiness: 'Maybe', level: 72, distance: 6.1 },
  { uid: 'u4', name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', sport: 'Football', position: 'CB', pulseScore: 689, tier: 'CONTENDER', compatibility: 78, role: 'recruiter', readiness: 'Ready', level: 68, distance: 8.2 },
  { uid: 'u5', name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', sport: 'Football', position: 'LW', pulseScore: 812, tier: 'ELITE', compatibility: 88, role: 'vice', readiness: 'Ready', level: 81, distance: 3.3 },
  { uid: 'cu1', name: 'Alex Rivera (You)', avatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg', sport: 'Football', position: 'RW', pulseScore: 721, tier: 'CONTENDER', compatibility: 100, role: 'captain', readiness: 'Ready', level: 24, distance: 0 }
];

const mockMatchHistory: any[] = [
  {
    matchId: 'm1',
    squadId: 'squad-1',
    opponentName: 'Rapid XI',
    result: 'W',
    score: '3 - 1',
    date: '2026-05-18',
    chemistryDelta: 8,
    topPerformer: { uid: 'u1', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', statsSummary: '2 Goals, 1 Assist' }
  },
  {
    matchId: 'm2',
    squadId: 'squad-1',
    opponentName: 'Cyber Athletico',
    result: 'D',
    score: '2 - 2',
    date: '2026-05-14',
    chemistryDelta: 2,
    topPerformer: { uid: 'u2', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', statsSummary: '1 Goal, 85% Pass Accuracy' }
  },
  {
    matchId: 'm3',
    squadId: 'squad-1',
    opponentName: 'Titan United',
    result: 'W',
    score: '1 - 0',
    date: '2026-05-10',
    chemistryDelta: 5,
    topPerformer: { uid: 'u3', name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', statsSummary: '6 Saves, Clean Sheet' }
  }
];

const mockAchievements = [
  { id: 'a1', name: '5 Match Win Streak', icon: 'Trophy', description: 'Win 5 matches in a row', unlocked: true },
  { id: 'a2', name: 'Chemistry 90%+', icon: 'Zap', description: 'Reach overall team chemistry above 90%', unlocked: false },
  { id: 'a3', name: 'Zero Disputes', icon: 'Shield', description: 'Complete 10 matches with no post-match validation disputes', unlocked: true },
  { id: 'a4', name: 'Pulse Elite Squad', icon: 'Flame', description: 'Average squad Pulse Score above 800', unlocked: false }
];

const initialChats: Record<string, ChatMessage[]> = {
  'squad-1': [
    { msgId: 'c1', senderId: 'u2', senderName: 'Zaid Al-Hassan', senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', senderRole: 'strategist', content: 'Hey team, let\'s focus on tactical counter-attacks for tomorrow\'s match.', type: 'text', timestamp: '2026-05-19T14:30:00Z' },
    { msgId: 'c2', senderId: 'cu1', senderName: 'Alex Rivera (You)', senderAvatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg', senderRole: 'captain', content: 'Tactical Update: Switching to 4-3-3 for this weekend', type: 'tactical', tacticalData: { formation: '4-3-3', notes: 'Using overlapping wingers and low-block defense.' }, timestamp: '2026-05-19T15:00:00Z' },
    { msgId: 'c3', senderId: 'cu1', senderName: 'Alex Rivera (You)', senderAvatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg', senderRole: 'captain', content: '📅 Match vs Rapid XI — Saturday 6PM — City Ground', type: 'announcement', announcementData: { matchTime: 'Saturday 6PM', venue: 'City Ground' }, timestamp: '2026-05-19T15:05:00Z' },
    {
      msgId: 'c4',
      senderId: 'u2',
      senderName: 'Zaid Al-Hassan',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      senderRole: 'strategist',
      content: 'Best time for practice?',
      type: 'poll',
      pollData: {
        question: 'Best time for practice?',
        options: [
          { text: 'Friday 5PM', votes: 4 },
          { text: 'Saturday 10AM', votes: 2 },
          { text: 'Sunday 2PM', votes: 0 }
        ],
        votedUsers: ['u1', 'u2', 'u3', 'u4', 'u5', 'cu1']
      },
      timestamp: '2026-05-19T16:20:00Z'
    },
    { msgId: 'c5', senderId: 'system', senderName: 'Pulse Engine', senderAvatar: '', content: '🏆 Squad reached 90% Chemistry!', type: 'achievement', timestamp: '2026-05-19T17:00:00Z' }
  ]
};

const mockTournaments: Tournament[] = [
  {
    tournamentId: 't-1',
    name: 'Metropolitan Cup 2026',
    sport: 'Football',
    squadIds: ['squad-1'],
    currentRound: 1,
    status: 'In Progress',
    startDate: '2026-05-20',
    endDate: '2026-05-30',
    prizePool: '$5,000 USD',
    bracket: {
      rounds: [
        {
          roundName: 'Semifinals',
          matches: [
            { matchId: 'tm-1', squadA: { squadId: 'squad-1', name: 'Iron Pulse FC' }, squadB: { squadId: 'squad-3', name: 'Alpha Striking' }, status: 'Scheduled', date: '2026-05-22T18:00:00Z' }
          ]
        }
      ]
    }
  }
];

const loadLocalState = () => {
  try {
    const savedGenerated = localStorage.getItem('sportix_generated_squads');
    const savedCount = localStorage.getItem('sportix_daily_gen_count');
    const savedDate = localStorage.getItem('sportix_last_gen_date');
    const savedSquads = localStorage.getItem('sportix_squads');
    const savedChats = localStorage.getItem('sportix_chats');
    
    const todayStr = new Date().toISOString().split('T')[0];
    let genCount = savedCount ? parseInt(savedCount, 10) : 0;
    let genDate = savedDate || todayStr;
    
    if (genDate !== todayStr) {
      genCount = 0;
      genDate = todayStr;
      localStorage.setItem('sportix_daily_gen_count', '0');
      localStorage.setItem('sportix_last_gen_date', todayStr);
    }
    
    return {
      generatedSquads: savedGenerated ? JSON.parse(savedGenerated) : [],
      dailyGenerationsCount: genCount,
      lastGenerationDate: genDate,
      squads: savedSquads ? JSON.parse(savedSquads) : null,
      chats: savedChats ? JSON.parse(savedChats) : null
    };
  } catch (e) {
    return {
      generatedSquads: [],
      dailyGenerationsCount: 0,
      lastGenerationDate: new Date().toISOString().split('T')[0],
      squads: null,
      chats: null
    };
  }
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
};

const localState = loadLocalState();

export const useSquadStore = create<SquadStoreState>((set) => ({
  squads: localState.squads || [
    {
      squadId: 'squad-1',
      name: 'Iron Pulse FC',
      sport: 'Football',
      captainId: 'cu1',
      members: mockAthletes,
      chemistry: { overall: 87, trust: 91, coordination: 78, communication: 83, retentionScore: 89, activityScore: 78, consistencyScore: 92, approvalScore: 88 },
      pulseAvg: 779,
      winRate: 74,
      matchHistory: mockMatchHistory,
      achievements: mockAchievements,
      formation: '4-3-3',
      tacticalNotes: 'Use overlapping wingers and maintain defensive low-block.',
      createdAt: '2026-05-01',
      lastActive: '2026-05-19',
      tournamentIds: ['t-1'],
      events: [
        { eventId: 'e-1', title: 'VS Rapid XI Match', date: '2026-05-22T18:00:00Z', type: 'match', status: 'confirmed', votes: {} },
        { eventId: 'e-2', title: 'Squad Practice Session', date: '2026-05-24T16:30:00Z', type: 'practice', status: 'pending', votes: { 'cu1': 'yes' } }
      ],
      posts: [
        {
          postId: 'post-1',
          authorId: 'u2',
          authorName: 'Zaid Al-Hassan',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          content: 'Finished today\'s tactical sprint. Feeling strong and ready for the Rapid XI showdown! Let\'s go!',
          timestamp: '2026-05-19T10:00:00Z',
          likes: ['cu1', 'u1']
        }
      ],
      xpBoostActive: false,
      streakMultiplier: 1.0
    },
    {
      squadId: 'squad-2',
      name: 'Neon Hawks',
      sport: 'Basketball',
      captainId: 'u7',
      members: [
        { uid: 'u7', name: 'Serena Jax', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', sport: 'Basketball', position: 'PG', pulseScore: 901, tier: 'PULSE ELITE', role: 'captain', readiness: 'Ready', level: 90, distance: 3.4 }
      ],
      chemistry: { overall: 92, trust: 94, coordination: 90, communication: 92 },
      pulseAvg: 901,
      winRate: 81,
      matchHistory: [],
      achievements: [],
      formation: 'Motion',
      tacticalNotes: 'High-pace fastbreaks and active perimeter switching.',
      createdAt: '2026-05-05',
      lastActive: '2026-05-19',
      tournamentIds: [],
      events: [],
      posts: [],
      xpBoostActive: false,
      streakMultiplier: 1.0
    }
  ],
  activeSquadId: 'squad-1',
  chats: localState.chats || initialChats,
  tournaments: mockTournaments,
  generatedSquads: localState.generatedSquads,
  dailyGenerationsCount: localState.dailyGenerationsCount,
  lastGenerationDate: localState.lastGenerationDate,

  loadData: async () => {
    const squads = await getSquads();
    set({ squads });
    // Also load chats for all squads
    const chats: Record<string, ChatMessage[]> = {};
    for (const squad of squads) {
      chats[squad.squadId] = await getMessages(squad.squadId);
    }
    set(state => ({ chats: { ...state.chats, ...chats } }));
  },

  setActiveSquadId: (id) => set({ activeSquadId: id }),
  
  updateTacticalBoard: (squadId, formation, notes) => {
    set((state) => {
      const updated = state.squads.map(s => s.squadId === squadId ? { ...s, formation, tacticalNotes: notes } : s);
      saveToLocalStorage('sportix_squads', updated);
      return { squads: updated };
    });
    updateSquad(squadId, { formation, tacticalNotes: notes });
  },

  sendChatMessage: (squadId, message) => {
    const newMsg: ChatMessage = {
      ...message,
      msgId: `c_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    set((state) => {
      const current = state.chats[squadId] || [];
      const updated = { ...state.chats, [squadId]: [...current, newMsg] };
      saveToLocalStorage('sportix_chats', updated);
      return { chats: updated };
    });
    // Typecast to omit msgId for creation
    createMessage(squadId, newMsg as any);
  },

  updateSquadSettings: (squadId, name, formation) => {
    set((state) => {
      const updated = state.squads.map(s => s.squadId === squadId ? { ...s, name, formation } : s);
      saveToLocalStorage('sportix_squads', updated);
      return { squads: updated };
    });
    updateSquad(squadId, { name, formation });
  },

  registerSquadForTournament: (squadId, tournamentId) => set((state) => {
    const updatedSquads = state.squads.map(s => s.squadId === squadId ? { ...s, tournamentIds: [...s.tournamentIds, tournamentId] } : s);
    const updatedTournaments = state.tournaments.map(t => t.tournamentId === tournamentId ? { ...t, squadIds: [...t.squadIds, squadId] } : t);
    saveToLocalStorage('sportix_squads', updatedSquads);
    return {
      tournaments: updatedTournaments,
      squads: updatedSquads
    };
  }),

  addSquad: (squad) => set((state) => {
    const updatedSquads = [...state.squads, squad];
    const systemMsg: ChatMessage = {
      msgId: `init_${Date.now()}`,
      senderId: 'system',
      senderName: 'Pulse Engine',
      senderAvatar: '',
      content: `Squad "${squad.name}" created successfully. Pulse Engine formation complete.`,
      type: 'achievement',
      timestamp: new Date().toISOString()
    };
    const updatedChats = {
      ...state.chats,
      [squad.squadId]: [systemMsg]
    };
    saveToLocalStorage('sportix_squads', updatedSquads);
    saveToLocalStorage('sportix_chats', updatedChats);
    return {
      squads: updatedSquads,
      chats: updatedChats
    };
  }),

  // Generated results actions
  addGeneratedSquad: (squad) => set((state) => {
    const updated = [...state.generatedSquads, squad];
    saveToLocalStorage('sportix_generated_squads', updated);
    return { generatedSquads: updated };
  }),

  declineGeneratedSquad: (squadId) => set((state) => {
    const updated = state.generatedSquads.filter(s => s.squadId !== squadId);
    saveToLocalStorage('sportix_generated_squads', updated);
    return { generatedSquads: updated };
  }),

  acceptGeneratedSquad: (squadId) => set((state) => {
    const target = state.generatedSquads.find(s => s.squadId === squadId);
    if (!target) return {};
    
    const acceptedSquad: Squad = {
      ...target,
      events: [
        { eventId: `ev-${Date.now()}-1`, title: 'Inaugural Practice Session', date: new Date(Date.now() + 86400000 * 2).toISOString(), type: 'practice', status: 'pending', votes: { 'cu1': 'yes' } }
      ],
      posts: [],
      xpBoostActive: false,
      streakMultiplier: 1.0
    };

    const updatedSquads = [...state.squads, acceptedSquad];
    const updatedGenerated = state.generatedSquads.filter(s => s.squadId !== squadId);
    
    const initMsg: ChatMessage = {
      msgId: `init_${Date.now()}`,
      senderId: 'system',
      senderName: 'Pulse Engine',
      senderAvatar: '',
      content: `AI Matchmaking Squad "${acceptedSquad.name}" has been accepted. Welcome to your huddle workspace!`,
      type: 'achievement',
      timestamp: new Date().toISOString()
    };

    const welcomeMsg: ChatMessage = {
      msgId: `welcome_${Date.now()}`,
      senderId: 'system',
      senderName: 'Pulse Engine',
      senderAvatar: '',
      content: `⚡ Secure tactical channel established. Complete confirmations for practice sessions to activate your first XP boost!`,
      type: 'text',
      timestamp: new Date(Date.now() + 1000).toISOString()
    };

    const updatedChats = {
      ...state.chats,
      [acceptedSquad.squadId]: [initMsg, welcomeMsg]
    };

    saveToLocalStorage('sportix_squads', updatedSquads);
    saveToLocalStorage('sportix_generated_squads', updatedGenerated);
    saveToLocalStorage('sportix_chats', updatedChats);

    return {
      squads: updatedSquads,
      generatedSquads: updatedGenerated,
      chats: updatedChats,
      activeSquadId: acceptedSquad.squadId
    };
  }),

  incrementGenerationsCount: () => set((state) => {
    const newCount = state.dailyGenerationsCount + 1;
    localStorage.setItem('sportix_daily_gen_count', newCount.toString());
    return { dailyGenerationsCount: newCount };
  }),

  resetGenerationsCount: (date) => set(() => {
    localStorage.setItem('sportix_daily_gen_count', '0');
    localStorage.setItem('sportix_last_gen_date', date);
    return {
      dailyGenerationsCount: 0,
      lastGenerationDate: date
    };
  }),

  // Coordination actions
  createSquadEvent: (squadId, title, date, type) => set((state) => {
    const eventId = `ev-${Date.now()}`;
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'auth_user';
    const userName = user?.name || 'Athlete';
    const userAvatar = user?.avatar || 'https://i.pravatar.cc/150?img=33';

    const newEvent = {
      eventId,
      title,
      date,
      type,
      status: 'pending' as const,
      votes: { [userId]: 'yes' as const } // Captain auto-confirms
    };

    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId) {
        return {
          ...s,
          events: [...(s.events || []), newEvent]
        };
      }
      return s;
    });

    const newMessage: ChatMessage = {
      msgId: `c_${Date.now()}`,
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      senderRole: 'captain',
      content: `📅 ${type === 'match' ? 'Match' : 'Practice'} Scheduled: ${title} — ${new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}. Please cast your votes.`,
      type: 'announcement',
      announcementData: {
        matchTime: new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        venue: 'City Ground'
      },
      timestamp: new Date().toISOString()
    };

    const updatedChats = {
      ...state.chats,
      [squadId]: [...(state.chats[squadId] || []), newMessage]
    };

    saveToLocalStorage('sportix_squads', updatedSquads);
    saveToLocalStorage('sportix_chats', updatedChats);

    return {
      squads: updatedSquads,
      chats: updatedChats
    };
  }),

  votePracticeSchedule: (squadId, eventId, voterId, vote) => set((state) => {
    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId) {
        const events = (s.events || []).map(ev => {
          if (ev.eventId === eventId) {
            const votes = { ...ev.votes, [voterId]: vote };
            
            // Check if all squad members have voted 'yes'
            // To simulate, we count how many active members are in the squad
            const memberCount = s.members.length;
            const yesVotesCount = Object.values(votes).filter(v => v === 'yes').length;
            
            // If everyone votes yes, it is confirmed and we activate XP boosts
            const isAllYes = yesVotesCount >= memberCount;
            return {
              ...ev,
              votes,
              status: isAllYes ? ('confirmed' as const) : ('pending' as const)
            };
          }
          return ev;
        });

        // Check if any event in the squad just got confirmed
        const hasJustConfirmed = events.some(ev => ev.eventId === eventId && ev.status === 'confirmed');
        
        return {
          ...s,
          events,
          xpBoostActive: hasJustConfirmed ? true : s.xpBoostActive,
          streakMultiplier: hasJustConfirmed ? 1.5 : s.streakMultiplier
        };
      }
      return s;
    });

    // If an event was confirmed, add system message to chat
    const squad = state.squads.find(s => s.squadId === squadId);
    let updatedChats = state.chats;
    
    if (squad) {
      const oldEvent = (squad.events || []).find(e => e.eventId === eventId);
      const newSquad = updatedSquads.find(s => s.squadId === squadId);
      const newEvent = (newSquad?.events || []).find(e => e.eventId === eventId);

      if (oldEvent?.status === 'pending' && newEvent?.status === 'confirmed') {
        const systemMsg: ChatMessage = {
          msgId: `c_sys_${Date.now()}`,
          senderId: 'system',
          senderName: 'Pulse Engine',
          senderAvatar: '',
          content: `⚡ Consensus unlocked! All members confirmed "${newEvent.title}". Streak multiplier set to 1.5x, 30% XP boost activated!`,
          type: 'achievement',
          timestamp: new Date().toISOString()
        };
        updatedChats = {
          ...state.chats,
          [squadId]: [...(state.chats[squadId] || []), systemMsg]
        };
        saveToLocalStorage('sportix_chats', updatedChats);
      }
    }

    saveToLocalStorage('sportix_squads', updatedSquads);
    return {
      squads: updatedSquads,
      chats: updatedChats
    };
  }),

  startCaptainVote: (squadId, candidateId, initiatorId) => set((state) => {
    const initiatorName = initiatorId === (useAuthStore.getState().user?.id || 'cu1') ? (useAuthStore.getState().user?.name || 'Alex Rivera (You)') : (state.squads.find(s => s.squadId === squadId)?.members.find(m => m.uid === initiatorId)?.name || 'Member');
    const candidateName = state.squads.find(s => s.squadId === squadId)?.members.find(m => m.uid === candidateId)?.name || 'Member';
    
    const activeVote = {
      initiatorId,
      candidateId,
      votes: { [initiatorId]: candidateId }, // Initiator votes for candidate
      status: 'active' as const
    };

    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId) {
        return {
          ...s,
          activeCaptainVote: activeVote
        };
      }
      return s;
    });

    const announcement: ChatMessage = {
      msgId: `c_${Date.now()}`,
      senderId: 'system',
      senderName: 'Pulse Engine',
      senderAvatar: '',
      content: `🗳️ Captain change vote initiated by ${initiatorName}. Proposal: Appoint ${candidateName} as Captain. Vote on settings page or chat.`,
      type: 'poll',
      pollData: {
        question: `Promote ${candidateName} to Captain?`,
        options: [
          { text: 'Approve', votes: 1 },
          { text: 'Reject', votes: 0 }
        ],
        votedUsers: [initiatorId]
      },
      timestamp: new Date().toISOString()
    };

    const updatedChats = {
      ...state.chats,
      [squadId]: [...(state.chats[squadId] || []), announcement]
    };

    saveToLocalStorage('sportix_squads', updatedSquads);
    saveToLocalStorage('sportix_chats', updatedChats);

    return {
      squads: updatedSquads,
      chats: updatedChats
    };
  }),

  castCaptainVote: (squadId, voterId, candidateId) => set((state) => {
    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId && s.activeCaptainVote) {
        const votes = {
          ...s.activeCaptainVote.votes,
          [voterId]: candidateId
        };

        const totalMembers = s.members.length;
        
        // Count approvals for the proposed candidate
        const approvals = Object.values(votes).filter(c => c === s.activeCaptainVote?.candidateId).length;
        
        // Check if there is a majority
        const hasMajority = approvals > totalMembers / 2;
        
        if (hasMajority) {
          const newCaptainId = s.activeCaptainVote.candidateId;
          
          // Re-allocate roles
          const updatedMembers = s.members.map(m => {
            if (m.uid === newCaptainId) {
              return { ...m, role: 'captain' as const };
            } else if (m.uid === s.captainId) {
              return { ...m, role: 'member' as const }; // Demote old captain
            }
            return m;
          });

          return {
            ...s,
            captainId: newCaptainId,
            members: updatedMembers,
            activeCaptainVote: undefined // Vote completed!
          };
        } else {
          // If everyone has voted and no majority, clear the vote
          const totalVotes = Object.keys(votes).length;
          const isComplete = totalVotes >= totalMembers;
          
          return {
            ...s,
            activeCaptainVote: isComplete ? undefined : {
              ...s.activeCaptainVote,
              votes
            }
          };
        }
      }
      return s;
    });

    // Check if captain changed
    const oldSquad = state.squads.find(s => s.squadId === squadId);
    const newSquad = updatedSquads.find(s => s.squadId === squadId);
    let updatedChats = state.chats;

    if (oldSquad && newSquad && oldSquad.captainId !== newSquad.captainId) {
      const candidateName = newSquad.members.find(m => m.uid === newSquad.captainId)?.name || 'New Captain';
      const changeMsg: ChatMessage = {
        msgId: `c_sys_cap_${Date.now()}`,
        senderId: 'system',
        senderName: 'Pulse Engine',
        senderAvatar: '',
        content: `👑 Captain authority transferred! ${candidateName} has been democratically elected as the new Squad Captain.`,
        type: 'achievement',
        timestamp: new Date().toISOString()
      };
      updatedChats = {
        ...state.chats,
        [squadId]: [...(state.chats[squadId] || []), changeMsg]
      };
      saveToLocalStorage('sportix_chats', updatedChats);
    }

    saveToLocalStorage('sportix_squads', updatedSquads);
    return {
      squads: updatedSquads,
      chats: updatedChats
    };
  }),

  // Media feed actions
  addSquadPost: (squadId, content, mediaUrl) => set((state) => {
    const user = useAuthStore.getState().user;
    const newPost = {
      postId: `p-${Date.now()}`,
      authorId: user?.id || 'auth_user',
      authorName: user?.name || 'Athlete',
      authorAvatar: user?.avatar || 'https://i.pravatar.cc/150?img=33',
      content,
      mediaUrl,
      timestamp: new Date().toISOString(),
      likes: []
    };

    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId) {
        return {
          ...s,
          posts: [newPost, ...(s.posts || [])]
        };
      }
      return s;
    });

    saveToLocalStorage('sportix_squads', updatedSquads);
    return { squads: updatedSquads };
  }),

  likeSquadPost: (squadId, postId, userId) => set((state) => {
    const updatedSquads = state.squads.map(s => {
      if (s.squadId === squadId) {
        const posts = (s.posts || []).map(p => {
          if (p.postId === postId) {
            const hasLiked = p.likes.includes(userId);
            const likes = hasLiked 
              ? p.likes.filter(id => id !== userId)
              : [...p.likes, userId];
            return { ...p, likes };
          }
          return p;
        });
        return { ...s, posts };
      }
      return s;
    });

    saveToLocalStorage('sportix_squads', updatedSquads);
    return { squads: updatedSquads };
  }),

  reset: () => {
    // Clear all localStorage squad keys on logout
    localStorage.removeItem('sportix_squads');
    localStorage.removeItem('sportix_chats');
    localStorage.removeItem('sportix_generated_squads');
    localStorage.removeItem('sportix_daily_gen_count');
    localStorage.removeItem('sportix_last_gen_date');
    set({
      squads: [],
      activeSquadId: null,
      chats: {},
      generatedSquads: [],
      dailyGenerationsCount: 0,
      lastGenerationDate: new Date().toISOString().split('T')[0],
    });
  },
}));
