/**
 * squadService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite `squads` and `squad_members` collections.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import type { Squad, Athlete } from '@/types/pulse.types';

// Mock Data Fallbacks (migrated from squadStore)
const mockAthletes: Athlete[] = [
  { uid: 'u1', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', sport: 'Football', position: 'ST', pulseScore: 847, tier: 'ELITE', compatibility: 94, role: 'member', readiness: 'Ready', level: 84, distance: 1.2 },
  { uid: 'u2', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', sport: 'Football', position: 'CM', pulseScore: 793, tier: 'ELITE', compatibility: 91, role: 'strategist', readiness: 'Ready', level: 79, distance: 4.5 },
  { uid: 'u3', name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', sport: 'Football', position: 'GK', pulseScore: 721, tier: 'CONTENDER', compatibility: 85, role: 'member', readiness: 'Maybe', level: 72, distance: 6.1 },
  { uid: 'u4', name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', sport: 'Football', position: 'CB', pulseScore: 689, tier: 'CONTENDER', compatibility: 78, role: 'recruiter', readiness: 'Ready', level: 68, distance: 8.2 },
  { uid: 'u5', name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', sport: 'Football', position: 'LW', pulseScore: 812, tier: 'ELITE', compatibility: 88, role: 'vice', readiness: 'Ready', level: 81, distance: 3.3 },
  { uid: 'cu1', name: 'Alex Rivera (You)', avatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg', sport: 'Football', position: 'RW', pulseScore: 721, tier: 'CONTENDER', compatibility: 100, role: 'captain', readiness: 'Ready', level: 24, distance: 0 }
];

const mockMatchHistory: any[] = [
  { matchId: 'm1', squadId: 'squad-1', opponentName: 'Rapid XI', result: 'W', score: '3 - 1', date: '2026-05-18', chemistryDelta: 8, topPerformer: { uid: 'u1', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', statsSummary: '2 Goals, 1 Assist' } },
  { matchId: 'm2', squadId: 'squad-1', opponentName: 'Cyber Athletico', result: 'D', score: '2 - 2', date: '2026-05-14', chemistryDelta: 2, topPerformer: { uid: 'u2', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', statsSummary: '1 Goal, 85% Pass Accuracy' } },
  { matchId: 'm3', squadId: 'squad-1', opponentName: 'Titan United', result: 'W', score: '1 - 0', date: '2026-05-10', chemistryDelta: 5, topPerformer: { uid: 'u3', name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', statsSummary: '6 Saves, Clean Sheet' } }
];

const mockAchievements = [
  { id: 'a1', name: '5 Match Win Streak', icon: 'Trophy', description: 'Win 5 matches in a row', unlocked: true },
  { id: 'a2', name: 'Chemistry 90%+', icon: 'Zap', description: 'Reach overall team chemistry above 90%', unlocked: false },
  { id: 'a3', name: 'Zero Disputes', icon: 'Shield', description: 'Complete 10 matches with no post-match validation disputes', unlocked: true },
  { id: 'a4', name: 'Pulse Elite Squad', icon: 'Flame', description: 'Average squad Pulse Score above 800', unlocked: false }
];

export const MOCK_SQUADS: Squad[] = [
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
    tacticalNotes: 'Using overlapping wingers and low-block defense.',
    createdAt: '2026-05-01',
    lastActive: '2026-05-19',
    tournamentIds: ['t-1'],
    events: [],
    posts: [],
    xpBoostActive: false,
    streakMultiplier: 1.0,
    tags: ['Competitive', 'High Chem', 'Tiki-Taka'],
    lookingFor: ['CDM', 'CB']
  }
];

// ─── MAPPER ──────────────────────────────────────────────────────────────────
function docToSquad(doc: Record<string, any>): Squad {
  return {
    squadId: doc.$id,
    name: doc.name || 'Unnamed Squad',
    sport: doc.sport || 'General',
    captainId: doc.captain_id || '',
    members: doc.members ? JSON.parse(doc.members) : [],
    chemistry: doc.chemistry ? JSON.parse(doc.chemistry) : { overall: 50, trust: 50, coordination: 50, communication: 50, retentionScore: 50, activityScore: 50, consistencyScore: 50, approvalScore: 50 },
    pulseAvg: doc.pulse_avg || 0,
    winRate: doc.win_rate || 0,
    matchHistory: doc.match_history ? JSON.parse(doc.match_history) : [],
    achievements: doc.achievements ? JSON.parse(doc.achievements) : [],
    formation: doc.formation || 'Custom',
    tacticalNotes: doc.tactical_notes || '',
    createdAt: doc.$createdAt || new Date().toISOString(),
    lastActive: doc.$updatedAt || new Date().toISOString(),
    tournamentIds: doc.tournament_ids ? JSON.parse(doc.tournament_ids) : [],
    events: doc.events ? JSON.parse(doc.events) : [],
    posts: doc.posts ? JSON.parse(doc.posts) : [],
    xpBoostActive: doc.xp_boost_active || false,
    streakMultiplier: doc.streak_multiplier || 1.0,
    tags: doc.tags || [],
    lookingFor: doc.looking_for || []
  };
}

function squadToDoc(squad: Partial<Squad>): Record<string, any> {
  const doc: Record<string, any> = {};
  if (squad.name !== undefined) doc.name = squad.name;
  if (squad.sport !== undefined) doc.sport = squad.sport;
  if (squad.captainId !== undefined) doc.captain_id = squad.captainId;
  if (squad.members !== undefined) doc.members = JSON.stringify(squad.members);
  if (squad.chemistry !== undefined) doc.chemistry = JSON.stringify(squad.chemistry);
  if (squad.pulseAvg !== undefined) doc.pulse_avg = squad.pulseAvg;
  if (squad.winRate !== undefined) doc.win_rate = squad.winRate;
  if (squad.matchHistory !== undefined) doc.match_history = JSON.stringify(squad.matchHistory);
  if (squad.achievements !== undefined) doc.achievements = JSON.stringify(squad.achievements);
  if (squad.formation !== undefined) doc.formation = squad.formation;
  if (squad.tacticalNotes !== undefined) doc.tactical_notes = squad.tacticalNotes;
  if (squad.tournamentIds !== undefined) doc.tournament_ids = JSON.stringify(squad.tournamentIds);
  if (squad.events !== undefined) doc.events = JSON.stringify(squad.events);
  if (squad.posts !== undefined) doc.posts = JSON.stringify(squad.posts);
  if (squad.xpBoostActive !== undefined) doc.xp_boost_active = squad.xpBoostActive;
  if (squad.streakMultiplier !== undefined) doc.streak_multiplier = squad.streakMultiplier;
  if (squad.tags !== undefined) doc.tags = squad.tags;
  if (squad.lookingFor !== undefined) doc.looking_for = squad.lookingFor;
  return doc;
}

// ─── READ ────────────────────────────────────────────────────────────────────
export async function getSquads(): Promise<Squad[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SQUADS, [Query.limit(50)]);
    if (res.documents.length === 0) return MOCK_SQUADS;
    return res.documents.map(docToSquad);
  } catch (err) {
    console.warn('[squadService] getSquads failed, using mock data:', err);
    return MOCK_SQUADS;
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export async function createSquad(squad: Omit<Squad, 'squadId'>): Promise<Squad | null> {
  try {
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.SQUADS, ID.unique(), squadToDoc(squad));
    return docToSquad(doc);
  } catch (err) {
    console.error('[squadService] createSquad failed:', err);
    return null;
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export async function updateSquad(squadId: string, updates: Partial<Squad>): Promise<Squad | null> {
  try {
    if (squadId.startsWith('squad-')) return null; // Ignore mock updates
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.SQUADS, squadId, squadToDoc(updates));
    return docToSquad(doc);
  } catch (err) {
    console.error('[squadService] updateSquad failed:', err);
    return null;
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function deleteSquad(squadId: string): Promise<boolean> {
  try {
    if (squadId.startsWith('squad-')) return false; // Ignore mock deletes
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SQUADS, squadId);
    return true;
  } catch (err) {
    console.error('[squadService] deleteSquad failed:', err);
    return false;
  }
}
