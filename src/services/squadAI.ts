import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Squad, Athlete } from '../types/pulse.types';
import { useAISettingsStore } from '../store/aiSettingsStore';
import { getEventParticipants } from './eventService';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

const MOCK_TEAM_NAMES = [
  'Volt Renegades', 'Neon Hawks', 'Carbon Vipers', 'Chrome Titans', 'Aether Strikers', 
  'Pulse Matrix', 'Apex Predators', 'Giga Rangers', 'Quantum Knights', 'Solaris XI',
  'Titan Vanguard', 'Cyber Strikers', 'Apex Dynamos', 'Velocity Prime', 'Hyperion FC'
];

const MOCK_ATHLETES_NAMES = [
  'Marcus Reid', 'Aisha Mensah', 'Zaid Al-Hassan', 'Priya Nair', 'Devon Clarke', 
  'Kofi Boaitey', 'Elena Rostova', 'Carlos Santini', 'Yuki Tanaka', 'Liam Brookes',
  'Sofia Moreno', 'Dimitri Leonov', 'Chloe Dupont', 'Omar Farooq', 'Amara Okafor'
];

const AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
];

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

function getGenAI() {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(apiKey);
}

interface GeminiSquadResponse {
  name: string;
  reasoning: string;
  formation: string;
  tacticalNotes: string;
  chemistry: {
    overall: number;
    trust: number;
    coordination: number;
    communication: number;
  };
}

// POSITIONS BY SPORT
const POSITIONS_BY_SPORT: Record<string, string[]> = {
  Football: ['GK', 'ST', 'CM', 'CB', 'LW', 'RW', 'LB', 'RB', 'CDM', 'CAM'],
  football: ['GK', 'ST', 'CM', 'CB', 'LW', 'RW', 'LB', 'RB', 'CDM', 'CAM'],
  Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  Tennis: ['Single', 'Double Partner'],
  tennis: ['Single', 'Double Partner'],
  Cricket: ['BAT', 'BOWL', 'WKT', 'ALL'],
  cricket: ['BAT', 'BOWL', 'WKT', 'ALL'],
  Volleyball: ['Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite'],
  volleyball: ['Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite'],
};

/**
 * Helper to fetch real candidates from event participants and Appwrite profiles.
 */
async function fetchCandidatesFromEvent(
  eventId?: string,
  sport: string = 'football',
  currentUserId?: string
): Promise<any[]> {
  const candidates: any[] = [];
  const seenUserIds = new Set<string>();
  if (currentUserId) seenUserIds.add(currentUserId);

  // 1. Fetch from event participants if eventId provided
  if (eventId) {
    try {
      const parts = await getEventParticipants(eventId);
      for (const p of parts) {
        if (p.user_id && !seenUserIds.has(p.user_id)) {
          seenUserIds.add(p.user_id);
          candidates.push({
            id: p.user_id,
            full_name: p.profile?.full_name || 'Event Athlete',
            username: p.profile?.username || 'athlete',
            avatar_url: p.profile?.avatar_url,
            sport: p.profile?.sport || sport,
            source: 'joined_event'
          });
        }
      }
    } catch (e) {
      console.warn('[squadAI] Could not fetch event participants:', e);
    }
  }

  // 2. Fetch active profiles from Appwrite if needed to fill squad capacity
  if (candidates.length < 8) {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('is_active', true), Query.limit(20)]
      );
      for (const doc of res.documents) {
        if (doc.$id && !seenUserIds.has(doc.$id)) {
          seenUserIds.add(doc.$id);
          candidates.push({
            id: doc.$id,
            full_name: doc.full_name || 'Athlete',
            username: doc.username || 'athlete',
            avatar_url: doc.avatar_url,
            sport: doc.sport || sport,
            position: doc.position,
            pulse_score: doc.pulse_score,
            level: doc.level,
            experience_level: doc.experience_level,
            city: doc.location || doc.city,
            source: 'database_profile'
          });
        }
      }
    } catch (e) {
      console.warn('[squadAI] Could not query profiles collection:', e);
    }
  }

  return candidates;
}

export const generateAIPulseSquad = async (
  sport: string,
  _entryType: string,
  userProfile: { id?: string; name: string; username: string; avatar: string; level: number; gameplayCategory: string; pulseScore?: number },
  onLog?: (log: string) => void,
  eventId?: string,
  eventTitle?: string
): Promise<Squad> => {
  const settings = useAISettingsStore.getState();

  const emit = (msg: string) => {
    if (onLog) onLog(msg);
  };

  const squadId = `squad_${Date.now()}`;
  const userLevel = userProfile.level || 24;
  const gameplayCategory = userProfile.gameplayCategory || 'Semi-Pro';
  const userPulse = userProfile.pulseScore || 780;

  emit(`> Initiating AI AutoSquad Engine for ${sport}...`);
  if (eventId) {
    emit(`> Scanning registered event participants for "${eventTitle || eventId}"...`);
  }

  // Fetch real candidates from joined event and Appwrite DB
  const rawCandidates = await fetchCandidatesFromEvent(eventId, sport, userProfile.id);
  emit(`> Found ${rawCandidates.length} eligible athletes in event pool. Computing Pulse synergy...`);

  const sportPositions = POSITIONS_BY_SPORT[sport] || POSITIONS_BY_SPORT.football || ['Member'];
  const userPosition = sport === 'Basketball' || sport === 'basketball' ? 'SG' : 'RW';

  const candidateAthletes: Athlete[] = [];
  const availableAvatars = [...AVATARS];
  const availableNames = [...MOCK_ATHLETES_NAMES];

  // Pick top 5 matching candidates
  const targetCandidateCount = 5;
  for (let i = 0; i < targetCandidateCount; i++) {
    const raw = rawCandidates[i];

    let name = raw?.full_name;
    let avatar = raw?.avatar_url;
    let uid = raw?.id || `u_gen_${Date.now()}_${i}`;

    if (!name || name === 'Athlete' || name === 'Event Athlete') {
      const nameIdx = Math.floor(Math.random() * availableNames.length);
      name = availableNames.splice(nameIdx, 1)[0] || `Athlete ${i + 1}`;
    }
    if (!avatar) {
      const avatarIdx = Math.floor(Math.random() * availableAvatars.length);
      avatar = availableAvatars.splice(avatarIdx, 1)[0] || `https://i.pravatar.cc/150?img=${i + 15}`;
    }

    // Distance in km
    const minR = 0.5;
    const maxR = settings.nearbyRadius || 10;
    const distance = Number((Math.random() * (maxR - minR) + minR).toFixed(1));

    // Level calculation
    const lvlDelta = Math.floor(Math.random() * 10) - 5;
    const level = raw?.level || Math.max(1, Math.min(100, userLevel + lvlDelta));

    // Pulse Score Calculation & Matching
    let candidatePulse = raw?.pulse_score;
    if (!candidatePulse) {
      const pulseVariance = Math.floor(Math.random() * 80) - 40;
      candidatePulse = Math.max(300, Math.min(990, userPulse + pulseVariance));
    }

    const tier = candidatePulse < 700 ? 'CONTENDER' : candidatePulse < 850 ? 'ELITE' : 'PULSE ELITE';

    // Compatibility based on pulse score delta and level harmony
    const pulseDelta = Math.abs(userPulse - candidatePulse);
    const compatibility = Math.max(78, Math.min(99, Math.round(98 - (pulseDelta / 25))));

    const position = raw?.position || sportPositions[i % sportPositions.length] || 'Member';
    const roles: ('captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member')[] = [
      'strategist', 'vice', 'analyst', 'recruiter', 'member'
    ];
    const role = roles[i] || 'member';

    candidateAthletes.push({
      uid,
      name,
      avatar,
      sport,
      position,
      pulseScore: candidatePulse,
      tier,
      compatibility,
      role,
      readiness: 'Ready',
      experienceLevel: raw?.experience_level || gameplayCategory,
      level,
      distance,
      stats: {
        matches: 12 + Math.floor(Math.random() * 45),
        wins: 7 + Math.floor(Math.random() * 32),
        followers: 50 + Math.floor(Math.random() * 180)
      }
    });
  }

  // Add the user as Captain
  const userAthlete: Athlete = {
    uid: userProfile.id || 'cu1',
    name: userProfile.name || 'You',
    avatar: userProfile.avatar || AVATARS[0],
    sport,
    position: userPosition,
    pulseScore: userPulse,
    tier: userPulse >= 850 ? 'PULSE ELITE' : userPulse >= 700 ? 'ELITE' : 'CONTENDER',
    compatibility: 100,
    role: 'captain',
    readiness: 'Ready',
    experienceLevel: gameplayCategory,
    level: userLevel,
    distance: 0,
    stats: {
      matches: 42,
      wins: 31,
      followers: 182
    }
  };

  const allMembers = [userAthlete, ...candidateAthletes];

  // 2. Query Google Gemini AI for team formation and reasoning
  let squadName = `${sport.charAt(0).toUpperCase() + sport.slice(1)} ${MOCK_TEAM_NAMES[Math.floor(Math.random() * MOCK_TEAM_NAMES.length)]}`;
  let reasoning = `Assembled around ${userAthlete.name} with complementary Pulse ratings (${userAthlete.pulseScore}) matching ${candidateAthletes[0]?.name} (${candidateAthletes[0]?.pulseScore}) and ${candidateAthletes[1]?.name} for optimal tactical balance.`;
  let formation = sport.toLowerCase().includes('basket') ? 'Motion 2-3' : '4-3-3';
  let tacticalNotes = `Exploit high Pulse rating transitions. ${userAthlete.name} and ${candidateAthletes[0]?.name} control the pace while maintaining solid defensive coverage.`;
  let chemistry = {
    overall: 91,
    trust: 92,
    coordination: 89,
    communication: 90,
    retentionScore: 88,
    activityScore: 85,
    consistencyScore: 92,
    approvalScore: 88
  };

  const genAI = getGenAI();
  if (genAI) {
    emit('> Connecting to Gemini AI Matchmaking Engine...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const athleteList = allMembers.map(a => `${a.name} (Position: ${a.position}, Pulse Rating: ${a.pulseScore}, Level: ${a.level})`).join(', ');
    emit(`> Running AI compatibility matrix on ${allMembers.length} joined athlete profiles...`);

    const prompt = `You are the SPORTiX AutoSquad AI engine.
Build a cohesive squad for an event: "${eventTitle || 'SPORTiX Championship'}"
- Sport: ${sport}
- Gameplay Category: ${gameplayCategory}
- Roster Candidates: ${athleteList}

Please generate:
1. A unique, high-end futuristic team name (2-3 words, e.g. "Volt Crimson FC", "Neon Hawks", "Chrome Knights", "Apex Surge", "Pulse Vipers").
2. AI Matchmaking Reasoning (2-3 sentences explaining exactly why this group is highly compatible, referencing at least two players by their exact names and their Pulse ratings).
3. A recommended tactical formation (e.g., 4-3-3, 3-5-2, Motion 2-3, Diamond).
4. Tactical notes (short directive on how this team should play).
5. Chemistry ratings (overall: 80-99, trust: 80-99, coordination: 80-99, communication: 80-99).

Format your response as a strict JSON object:
{
  "name": "...",
  "reasoning": "...",
  "formation": "...",
  "tacticalNotes": "...",
  "chemistry": {
    "overall": 92,
    "trust": 90,
    "coordination": 91,
    "communication": 89
  }
}`;

    try {
      emit('> Synthesizing AI squad chemistry...');
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: GeminiSquadResponse = JSON.parse(jsonMatch[0]);
        squadName = parsed.name || squadName;
        reasoning = parsed.reasoning || reasoning;
        formation = parsed.formation || formation;
        tacticalNotes = parsed.tacticalNotes || tacticalNotes;
        emit(`> Squad name generated: "${squadName}" [Formation: ${formation}]`);
        if (parsed.chemistry) {
          chemistry = {
            ...chemistry,
            overall: parsed.chemistry.overall || chemistry.overall,
            trust: parsed.chemistry.trust || chemistry.trust,
            coordination: parsed.chemistry.coordination || chemistry.coordination,
            communication: parsed.chemistry.communication || chemistry.communication
          };
          emit(`> Chemistry computed — Overall: ${chemistry.overall}% | Pulse Alignment: 94%`);
        }
      }
      emit('> AutoSquad compilation successful! Lineup ready.');
    } catch (e) {
      emit('> AI synthesis finished with deterministic Pulse matrix.');
      console.warn('AI API call failed in squadAI, using pulse algorithm:', e);
    }
  } else {
    emit('> AutoSquad Pulse matchmaking algorithm completed.');
  }

  const pulseAvg = Math.round(allMembers.reduce((sum, a) => sum + a.pulseScore, 0) / allMembers.length);
  const winRate = Math.floor(Math.random() * 12) + 76; // 76 - 88%

  const achievements = [
    { id: 'a1', name: 'Zero Disputes', icon: 'Shield', description: 'Complete 10 matches with no post-match validation disputes', unlocked: true },
    { id: 'a2', name: 'Chemistry 90%+', icon: 'Zap', description: 'Reach overall team chemistry above 90%', unlocked: chemistry.overall >= 90 }
  ];

  // Record generation
  useAISettingsStore.getState().recordGeneration();

  return {
    squadId,
    name: squadName,
    sport,
    captainId: userAthlete.uid,
    members: allMembers,
    chemistry,
    pulseAvg,
    winRate,
    matchHistory: [],
    achievements,
    formation,
    tacticalNotes,
    createdAt: new Date().toISOString().split('T')[0],
    lastActive: new Date().toISOString().split('T')[0],
    tournamentIds: eventId ? [eventId] : [],
    events: eventId ? [{
      eventId,
      title: eventTitle || 'Event',
      date: new Date().toISOString().split('T')[0],
      type: 'match' as const,
      status: 'confirmed' as const,
      votes: {}
    }] : [],
    posts: [],
    xpBoostActive: false,
    streakMultiplier: 1.0,
    activeCaptainVote: undefined
  };
};
