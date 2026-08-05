/**
 * Knockout bracket construction.
 *
 * Deterministic pairing, no AI involved — it only lived in services/aiService.ts,
 * which read VITE_GEMINI_API_KEY at module load, so importing it pulled the key
 * into the bundle for a function that never called a model.
 */
import type { BracketRound } from '../types';

export function generateBracket(participantIds: string[]): BracketRound[] {
  const count = Math.max(participantIds.length, 8);
  const rounds: BracketRound[] = [];
  const roundNames = ['Round of 16', 'Quarter Finals', 'Semi Finals', 'Grand Final'];
  let current = participantIds.slice(0, count);
  let roundNum = 1;
  while (current.length > 1) {
    const matches = [];
    for (let i = 0; i < current.length; i += 2) {
      matches.push({
        id: `m_${roundNum}_${i / 2}`, round: roundNum,
        matchNumber: i / 2 + 1,
        team1: current[i] || 'TBD', team2: current[i + 1] || 'TBD',
        status: roundNum === 1 ? 'scheduled' as const : 'scheduled' as const,
        scheduledTime: new Date(Date.now() + roundNum * 86400000 * 2).toISOString(),
      });
    }
    rounds.push({ round: roundNum, name: roundNames[roundNum - 1] || `Round ${roundNum}`, matches });
    current = current.filter((_, i) => i % 2 === 0);
    roundNum++;
  }
  return rounds;
}
