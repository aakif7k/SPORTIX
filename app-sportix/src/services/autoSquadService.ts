/**
 * src/services/autoSquadService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AutoSquad AI Matchmaking.
 * Rules:
 *  - Quota check (5/day) against autosquad_requests before calling FastAPI.
 *  - AI call goes to FastAPI /api/autosquad/generate — NEVER Gemini directly.
 *  - Result stored in generated_squads collection.
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query, FASTAPI_URL } from '../api/appwrite';
import { AutoSquadRequest } from '../types';
import { authService } from './authService';

const DAILY_QUOTA = 5;

function toRequest(doc: any): AutoSquadRequest {
  return {
    $id:        doc.$id,
    user_id:    doc.user_id,
    sport:      doc.sport   ?? '',
    status:     doc.status  ?? 'pending',
    created_at: doc.created_at ?? doc.$createdAt,
    $createdAt: doc.$createdAt,
  };
}

export const autoSquadService = {
  /** Check how many AutoSquad requests the user has used today (server-side quota). */
  async getDailyQuotaUsed(): Promise<number> {
    try {
      const raw = await account.get();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.AUTOSQUAD_REQUESTS, [
        Query.equal('user_id', raw.$id),
        Query.greaterThan('created_at', todayStart.toISOString()),
        Query.limit(DAILY_QUOTA + 1),
      ]);
      return res.total;
    } catch {
      return 0;
    }
  },

  /** Returns true if user has remaining quota. */
  async hasQuotaRemaining(): Promise<boolean> {
    const used = await autoSquadService.getDailyQuotaUsed();
    return used < DAILY_QUOTA;
  },

  /**
   * Generate an AI squad via FastAPI.
   * 1. Check quota
   * 2. Create autosquad_request document
   * 3. Call FastAPI /api/autosquad/generate with JWT
   * 4. Store result in generated_squads
   */
  async generateSquad(params: {
    sport:           string;
    eventId?:        string;
    preferredRoles?: string[];
    onProgress?:     (message: string) => void;
  }): Promise<{ requestId: string; squadData: any }> {
    const hasQuota = await autoSquadService.hasQuotaRemaining();
    if (!hasQuota) {
      throw new Error('Daily AutoSquad quota reached (5/day). Try again tomorrow.');
    }

    const raw = await account.get();
    params.onProgress?.('Registering AutoSquad request...');

    // Create the request document
    const requestDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.AUTOSQUAD_REQUESTS,
      ID.unique(),
      {
        user_id:    raw.$id,
        sport:      params.sport,
        status:     'processing',
        created_at: new Date().toISOString(),
      },
    );

    params.onProgress?.('Scanning athlete pool...');

    try {
      // Get JWT for FastAPI auth
      const jwt = await authService.createJWT();

      params.onProgress?.('AI analyzing compatibility metrics...');

      const response = await fetch(`${FASTAPI_URL}/api/autosquad/generate`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          sport:            params.sport,
          event_id:         params.eventId ?? null,
          preferred_roles:  params.preferredRoles ?? [],
          request_id:       requestDoc.$id,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail ?? `AutoSquad API error: ${response.status}`);
      }

      const squadData = await response.json();
      params.onProgress?.('Calculating chemistry scores...');

      // Store result
      await databases.createDocument(DATABASE_ID, COLLECTIONS.GENERATED_SQUADS, ID.unique(), {
        request_id:  requestDoc.$id,
        event_id:    params.eventId ?? null,
        squad_data:  JSON.stringify(squadData),
        created_at:  new Date().toISOString(),
      });

      // Update request status
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.AUTOSQUAD_REQUESTS, requestDoc.$id, {
        status: 'completed',
      });

      params.onProgress?.('Squad ready!');
      return { requestId: requestDoc.$id, squadData };
    } catch (error) {
      // Mark request as failed
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.AUTOSQUAD_REQUESTS, requestDoc.$id, {
        status: 'failed',
      });
      throw error;
    }
  },

  /** Accept generated squad — create squads + squad_members documents. */
  async acceptGeneratedSquad(squadData: any, sport: string, name: string): Promise<string> {
    const raw = await account.get();

    const squad = await databases.createDocument(DATABASE_ID, COLLECTIONS.SQUADS, ID.unique(), {
      name:             name,
      sport:            sport,
      captain_id:       raw.$id,
      members_count:    squadData.members?.length ?? 1,
      overall_rating:   squadData.overall_rating  ?? 0,
      chemistry_rating: squadData.chemistry        ?? 0,
    });

    // Add members
    if (Array.isArray(squadData.members)) {
      for (const member of squadData.members) {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.SQUAD_MEMBERS, ID.unique(), {
          squad_id: squad.$id,
          user_id:  member.user_id ?? raw.$id,
          role:     member.role     ?? 'player',
          position: member.position ?? '',
        });
      }
    }

    return squad.$id;
  },
};
