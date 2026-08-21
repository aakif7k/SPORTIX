/**
 * src/services/matchService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Match, PlayerStat } from '../types';

function toMatch(doc: any): Match {
  return {
    $id:       doc.$id,
    squad1_id: doc.squad1_id ?? '',
    squad2_id: doc.squad2_id ?? '',
    score1:    doc.score1    ?? 0,
    score2:    doc.score2    ?? 0,
    winner_id: doc.winner_id ?? '',
    sport:     doc.sport     ?? '',
    played_at: doc.played_at ?? doc.$createdAt,
  };
}

export const matchService = {
  async getMatchesBySquad(squadId: string): Promise<Match[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MATCHES, [
      Query.or([
        Query.equal('squad1_id', squadId),
        Query.equal('squad2_id', squadId),
      ]),
      Query.orderDesc('played_at'),
      Query.limit(20),
    ]);
    return res.documents.map(toMatch);
  },

  async submitMatchReport(data: {
    squad1_id: string;
    squad2_id: string;
    score1:    number;
    score2:    number;
    winner_id: string;
    sport:     string;
    stats:     Array<{ user_id: string; goals: number; assists: number; rating: number }>;
  }): Promise<Match> {
    const matchDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.MATCHES, ID.unique(), {
      squad1_id: data.squad1_id,
      squad2_id: data.squad2_id,
      score1:    data.score1,
      score2:    data.score2,
      winner_id: data.winner_id,
      sport:     data.sport,
      played_at: new Date().toISOString(),
    });

    // Create player stats
    for (const stat of data.stats) {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.PLAYER_STATS, ID.unique(), {
        match_id:  matchDoc.$id,
        user_id:   stat.user_id,
        goals:     stat.goals,
        assists:   stat.assists,
        rating:    stat.rating,
        validated: false,
      });
    }

    return toMatch(matchDoc);
  },

  async submitValidation(statId: string, approved: boolean): Promise<void> {
    const raw = await account.get();
    await databases.createDocument(DATABASE_ID, COLLECTIONS.STAT_VALIDATIONS, ID.unique(), {
      stat_id:    statId,
      validator:  raw.$id,
      approved,
      created_at: new Date().toISOString(),
    });
  },

  async getPendingValidations(): Promise<PlayerStat[]> {
    const raw = await account.get();
    // Get stats from the user's matches that are not yet validated
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PLAYER_STATS, [
      Query.equal('user_id', raw.$id),
      Query.equal('validated', false),
      Query.limit(20),
    ]);
    return (res.documents as any[]).map(d => ({
      $id:       d.$id,
      match_id:  d.match_id,
      user_id:   d.user_id,
      goals:     d.goals    ?? 0,
      assists:   d.assists  ?? 0,
      rating:    d.rating   ?? 0,
      validated: d.validated ?? false,
    }));
  },
};
