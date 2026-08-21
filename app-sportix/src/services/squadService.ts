/**
 * src/services/squadService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Squad, SquadMember } from '../types';
import { toUserProfile } from './authService';

function toSquad(doc: any): Squad {
  return {
    $id:              doc.$id,
    name:             doc.name             ?? '',
    sport:            doc.sport            ?? '',
    captain_id:       doc.captain_id       ?? '',
    members_count:    doc.members_count    ?? 0,
    overall_rating:   doc.overall_rating   ?? 0,
    chemistry_rating: doc.chemistry_rating ?? 0,
    $createdAt:       doc.$createdAt,
  };
}

function toSquadMember(doc: any): SquadMember {
  return {
    $id:       doc.$id,
    squad_id:  doc.squad_id,
    user_id:   doc.user_id,
    role:      doc.role     ?? '',
    position:  doc.position ?? '',
    $createdAt:doc.$createdAt,
  };
}

export const squadService = {
  async getMySquads(): Promise<Squad[]> {
    const raw = await account.get();
    // Get all squad_members entries for this user
    const memberRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SQUAD_MEMBERS, [
      Query.equal('user_id', raw.$id),
      Query.limit(20),
    ]);
    if (memberRes.total === 0) return [];

    const squadIds = [...new Set(memberRes.documents.map((d: any) => d.squad_id))];
    const squads: Squad[] = [];
    for (const sid of squadIds) {
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SQUADS, sid);
        squads.push(toSquad(doc));
      } catch { /* squad may have been deleted */ }
    }
    return squads;
  },

  async getSquad(squadId: string): Promise<Squad | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.SQUADS, squadId);
      return toSquad(doc);
    } catch {
      return null;
    }
  },

  async getMembers(squadId: string): Promise<SquadMember[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SQUAD_MEMBERS, [
      Query.equal('squad_id', squadId),
      Query.limit(50),
    ]);
    const members = res.documents.map(toSquadMember);
    // Enrich with profile data
    for (const member of members) {
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, member.user_id);
        member.profile = toUserProfile(doc);
      } catch { /* profile lookup failed */ }
    }
    return members;
  },

  async createSquad(data: {
    name:  string;
    sport: string;
  }): Promise<Squad> {
    const raw = await account.get();
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.SQUADS, ID.unique(), {
      name:             data.name,
      sport:            data.sport,
      captain_id:       raw.$id,
      members_count:    1,
      overall_rating:   0,
      chemistry_rating: 0,
    });

    // Add creator as first member
    await databases.createDocument(DATABASE_ID, COLLECTIONS.SQUAD_MEMBERS, ID.unique(), {
      squad_id: doc.$id,
      user_id:  raw.$id,
      role:     'captain',
      position: 'captain',
    });

    return toSquad(doc);
  },

  async transferCaptaincy(squadId: string, newCaptainId: string): Promise<void> {
    const raw = await account.get();
    const squad = await databases.getDocument(DATABASE_ID, COLLECTIONS.SQUADS, squadId);
    if ((squad as any).captain_id !== raw.$id) {
      throw new Error('Only the captain can transfer captaincy.');
    }
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.SQUADS, squadId, {
      captain_id: newCaptainId,
    });
  },
};
