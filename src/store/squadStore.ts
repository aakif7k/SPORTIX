import { create } from 'zustand';
import type { Squad, ChatMessage, Tournament } from '../types/pulse.types';
import { useAuthStore } from './authStore';
import { getSquads, updateSquad } from '../services/squadService';
import { getMessages, createMessage } from '../services/messageService';
import { getUserGeneratedSquads } from '../services/autoSquadService';

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

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
};

export const useSquadStore = create<SquadStoreState>((set) => ({
  squads: [],
  activeSquadId: null,
  chats: {},
  tournaments: [],
  generatedSquads: [],
  dailyGenerationsCount: 0,
  lastGenerationDate: new Date().toISOString().split('T')[0],

  loadData: async () => {
    const user = useAuthStore.getState().user;
    const currentUserId = user?.id || '';

    try {
      const squads = await getSquads(currentUserId);
      set({ squads, activeSquadId: squads[0]?.squadId || null });

      if (currentUserId) {
        const genSquads = await getUserGeneratedSquads(currentUserId);
        if (genSquads && genSquads.length > 0) {
          set({ generatedSquads: genSquads });
        }
      }

      // Load chats for squads
      const chats: Record<string, ChatMessage[]> = {};
      for (const squad of squads) {
        if (squad.squadId) {
          chats[squad.squadId] = await getMessages(squad.squadId);
        }
      }
      set(state => ({ chats: { ...state.chats, ...chats } }));
    } catch (err) {
      console.warn('[squadStore] loadData error:', err);
    }
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
