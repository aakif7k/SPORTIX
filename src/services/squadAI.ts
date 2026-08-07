import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Squad, Athlete } from '../types/pulse.types';
import { useAISettingsStore } from '../store/aiSettingsStore';

const MOCK_TEAM_NAMES = [
  'Volt Renegades', 'Neon Hawks', 'Carbon Vipers', 'Chrome Titans', 'Aether Strikers', 
  'Pulse Matrix', 'Apex Predators', 'Giga Rangers', 'Quantum Knights', 'Solaris XI'
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
  Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  Tennis: ['Single', 'Double Partner'],
  Cricket: ['BAT', 'BOWL', 'WKT', 'ALL'],
  Volleyball: ['Setter', 'Libero', 'Outside Hitter', 'Middle Blocker', 'Opposite']
};

export const generateAIPulseSquad = async (
  sport: string,
  _entryType: string,
  userProfile: { name: string; username: string; avatar: string; level: number; gameplayCategory: string },
  onLog?: (log: string) => void
): Promise<Squad> => {
  const settings = useAISettingsStore.getState();

  const emit = (msg: string) => {
    if (settings.aiGeminiLogsEnabled && onLog) onLog(msg);
  };

  const squadId = `squad_${Date.now()}`;

  
  const userLevel = userProfile.level || 24;
  const gameplayCategory = userProfile.gameplayCategory || 'Semi-Pro';
  
  // 1. Generate candidate athletes within a 10 KM radius & matching levels
  const userPosition = sport === 'Basketball' ? 'SG' : 'RW';
  
  const candidateAthletes: Athlete[] = [];
  const sportPositions = POSITIONS_BY_SPORT[sport] || ['Member'];
  
  // Choose random avatars & names for candidates
  const availableAvatars = [...AVATARS];
  const availableNames = [...MOCK_ATHLETES_NAMES];
  
  // Add 5 candidates (total squad size of 6, including user)
  for (let i = 0; i < 5; i++) {
    const avatarIdx = Math.floor(Math.random() * availableAvatars.length);
    const nameIdx = Math.floor(Math.random() * availableNames.length);
    
    const avatar = availableAvatars.splice(avatarIdx, 1)[0];
    const name = availableNames.splice(nameIdx, 1)[0];
    
    // Proximity logic: Distance between 0.5 KM and nearbyRadius (within custom radius)
    const minR = 0.5;
    const maxR = settings.nearbyRadius || 10;
    const distance = Number((Math.random() * (maxR - minR) + minR).toFixed(1));
    
    // Level matching: Level range +/- 8 levels from user profile
    const lvlDelta = Math.floor(Math.random() * 15) - 7; // -7 to +7
    const level = Math.max(1, Math.min(100, userLevel + lvlDelta));
    
    // Pulse Score based on level & category
    let basePulse = 500;
    if (gameplayCategory.toLowerCase() === 'amateur') basePulse = 450 + Math.floor(Math.random() * 150);
    else if (gameplayCategory.toLowerCase() === 'professional' || gameplayCategory.toLowerCase() === 'elite') basePulse = 800 + Math.floor(Math.random() * 180);
    else basePulse = 650 + Math.floor(Math.random() * 150); // Semi-Pro
    
    const pulseScore = Math.max(100, Math.min(999, basePulse + level * 2));
    const tier = pulseScore < 700 ? 'CONTENDER' : pulseScore < 850 ? 'ELITE' : 'PULSE ELITE';
    
    // Compatibility score
    const compatibility = 80 + Math.floor(Math.random() * 19); // 80 - 98
    
    // Assign position
    const position = sportPositions[i % sportPositions.length] || 'Member';
    
    // Assign roles
    const roles: ('captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member')[] = [
      'strategist', 'vice', 'analyst', 'recruiter', 'member'
    ];
    const role = roles[i] || 'member';
    
    candidateAthletes.push({
      uid: `u_gen_${Math.floor(Math.random() * 100000)}`,
      name,
      avatar,
      sport,
      position,
      pulseScore,
      tier,
      compatibility,
      role,
      readiness: Math.random() > 0.35 ? 'Ready' : 'Maybe',
      experienceLevel: gameplayCategory,
      level,
      distance,
      stats: {
        matches: 10 + Math.floor(Math.random() * 40),
        wins: 5 + Math.floor(Math.random() * 30),
        followers: 40 + Math.floor(Math.random() * 200)
      }
    });
  }
  
  // Add the user as captain (role: 'captain')
  const userAthlete: Athlete = {
    uid: 'cu1', // Alex Rivera (You)
    name: userProfile.name,
    avatar: userProfile.avatar,
    sport,
    position: userPosition,
    pulseScore: 721,
    tier: 'CONTENDER',
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
  
  const allMembers = [...candidateAthletes, userAthlete];
  
  // 2. Query Google Gemini AI for team parameters if available, otherwise simulate
  let squadName = MOCK_TEAM_NAMES[Math.floor(Math.random() * MOCK_TEAM_NAMES.length)];
  let reasoning = `Combines the veteran coordination of Zaid and Aisha's pace with the technical defense of Devon, creating a balanced setup around Alex's positioning.`;
  let formation = sport === 'Basketball' ? 'Motion' : '4-3-3';
  let tacticalNotes = `Use chemistry-based wing transitions. Alex and Aisha overlap on the wings, supported by Zaid's central distribution.`;
  let chemistry = {
    overall: 88,
    trust: 90,
    coordination: 84,
    communication: 86,
    retentionScore: 88,
    activityScore: 78,
    consistencyScore: 92,
    approvalScore: 84
  };

  const genAI = getGenAI();
  if (genAI) {
    emit('> Connecting to SPORTiX AI engine...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const athleteList = allMembers.map(a => `${a.name} (${a.position}, Level ${a.level}, Pulse ${a.pulseScore})`).join(', ');
    emit(`> Scanning ${allMembers.length} athlete profiles for ${sport}...`);
    const prompt = `You are the SPORTiX AutoSquad AI engine.
Build a cohesive squad for a user with the following details:
- Sport: ${sport}
- Gameplay Category: ${gameplayCategory}
- Roster Candidates: ${athleteList}

Please generate:
1. A unique, high-end futuristic team name (2-3 words, eg. "Volt Crimson FC", "Neon Hawks", "Chrome Knights", "Apex Renegades").
2. AI Matchmaking Reasoning (2-3 sentences explaining exactly why this group is highly compatible, referencing at least two players by name).
3. A recommended tactical formation (e.g., 4-3-3, 3-5-2, Motion, 2-3 Zone).
4. Tactical notes (short directive on how this team should play).
5. Chemistry ratings (overall: 80-99, trust: 80-99, coordination: 80-99, communication: 80-99).

Format your response as a strict JSON object (ensure it's valid JSON and contains nothing else):
{
  "name": "...",
  "reasoning": "...",
  "formation": "...",
  "tacticalNotes": "...",
  "chemistry": {
    "overall": 88,
    "trust": 90,
    "coordination": 85,
    "communication": 89
  }
}`;

    try {
      emit('> Sending matchmaking request to AI engine...');
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      emit('> AI response received. Parsing payload...');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: GeminiSquadResponse = JSON.parse(jsonMatch[0]);
        squadName = parsed.name || squadName;
        reasoning = parsed.reasoning || reasoning;
        formation = parsed.formation || formation;
        tacticalNotes = parsed.tacticalNotes || tacticalNotes;
        emit(`> Squad name: "${squadName}" — Formation: ${formation}`);
        if (parsed.chemistry) {
          chemistry = {
            ...chemistry,
            overall: parsed.chemistry.overall || chemistry.overall,
            trust: parsed.chemistry.trust || chemistry.trust,
            coordination: parsed.chemistry.coordination || chemistry.coordination,
            communication: parsed.chemistry.communication || chemistry.communication
          };
          emit(`> Chemistry computed — Overall: ${chemistry.overall}% | Trust: ${chemistry.trust}%`);
        }
      }
      emit('> AI compilation complete. Assembling squad...');
    } catch (e) {
      emit('> AI API error — switching to simulation fallback.');
      console.warn('AI API call failed in squadAI, using simulation fallback:', e);
    }
  } else {
    emit('> Simulation mode — add VITE_GEMINI_API_KEY to enable real AI.');
  }

  const pulseAvg = Math.round(allMembers.reduce((sum, a) => sum + a.pulseScore, 0) / allMembers.length);
  const winRate = Math.floor(Math.random() * 15) + 70; // 70 - 85%

  const achievements = [
    { id: 'a1', name: 'Zero Disputes', icon: 'Shield', description: 'Complete 10 matches with no post-match validation disputes', unlocked: true },
    { id: 'a2', name: 'Chemistry 90%+', icon: 'Zap', description: 'Reach overall team chemistry above 90%', unlocked: chemistry.overall >= 90 }
  ];

  // Record successful generation against daily limit
  useAISettingsStore.getState().recordGeneration();

  return {
    squadId,
    name: squadName,
    sport,
    captainId: 'cu1',
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
    tournamentIds: [],
    events: [],
    posts: [],
    xpBoostActive: false,
    streakMultiplier: 1.0,
    activeCaptainVote: undefined
  };
};
