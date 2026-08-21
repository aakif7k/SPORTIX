/**
 * squadService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite `squads` and `squad_members` collections.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import type { Squad } from '@/types/pulse.types';

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
export async function getSquads(currentUserId?: string): Promise<Squad[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SQUADS, [
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ]);
    if (!res.documents || res.documents.length === 0) return [];
    const allSquads = res.documents.map(docToSquad);
    if (!currentUserId) return allSquads;

    return allSquads.filter(squad => {
      if (squad.captainId === currentUserId) return true;
      return (squad.members || []).some(
        (m: any) => m.uid === currentUserId || m.id === currentUserId || m.userId === currentUserId
      );
    });
  } catch (err) {
    console.warn('[squadService] getSquads failed:', err);
    return [];
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
