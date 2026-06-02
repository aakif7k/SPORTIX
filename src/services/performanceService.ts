// ─── PERFORMANCE SERVICE ─────────────────────────────────────────────────────
// Pulse, SSR, and chemistry delta calculations

import type { PerformanceSport, MatchResult } from '../types/performance.types';

type Stats = Record<string, number | string | boolean>;

// ─── PULSE CALCULATION ────────────────────────────────────────────────────────

export function calculatePulse(
  sport: PerformanceSport,
  stats: Stats,
  matchRating: number,
  isMvp: boolean,
  result: MatchResult
): number {
  let pulse = 0;

  switch (sport) {
    case 'football': {
      const goals   = Number(stats.goals   ?? 0);
      const assists = Number(stats.assists  ?? 0);
      const passes  = Number(stats.passes   ?? 0);
      const tackles = Number(stats.tackles  ?? 0);
      const saves   = Number(stats.saves    ?? 0);

      pulse += goals   * 25;
      pulse += assists * 15;
      pulse += Math.min(passes / 10, 10);   // max +10
      pulse += Math.min(tackles / 3, 10);   // max +10
      pulse += saves * 8;
      pulse += (matchRating / 10) * 20;
      break;
    }

    case 'cricket': {
      const runs    = Number(stats.runs    ?? 0);
      const wickets = Number(stats.wickets ?? 0);
      const catches = Number(stats.catches ?? 0);

      pulse += Math.min(runs * 0.5, 50);   // max +50
      pulse += wickets * 20;
      pulse += catches * 10;
      pulse += (matchRating / 10) * 20;
      break;
    }

    case 'basketball': {
      const points   = Number(stats.points   ?? 0);
      const assists  = Number(stats.assists   ?? 0);
      const rebounds = Number(stats.rebounds  ?? 0);
      const steals   = Number(stats.steals    ?? 0);
      const blocks   = Number(stats.blocks    ?? 0);

      pulse += Math.min(points, 40);
      pulse += assists  * 8;
      pulse += rebounds * 5;
      pulse += steals   * 8;
      pulse += blocks   * 6;
      pulse += (matchRating / 10) * 15;
      break;
    }

    case 'running': {
      pulse += 30; // base for completing
      if (stats.personalBest) pulse += 50;
      const pos = Number(stats.positionFinished ?? 99);
      if (pos <= 3) pulse += 40;
      pulse += (matchRating / 10) * 15;
      break;
    }

    default: {
      const contribution = Number(stats.contribution ?? 5);
      pulse += contribution * 5;
      pulse += (matchRating / 10) * 20;
    }
  }

  // Bonuses
  if (isMvp) pulse += 40;
  if (result === 'win') pulse += 15;
  else if (result === 'draw') pulse += 5;

  return Math.max(0, Math.round(pulse));
}

// ─── LIVE PREVIEW BREAKDOWN ───────────────────────────────────────────────────

export interface PulseBreakdownRow {
  label: string;
  value: number;
}

export function getPulseBreakdown(
  sport: PerformanceSport,
  stats: Stats,
  matchRating: number,
  isMvp: boolean,
  result: MatchResult
): { rows: PulseBreakdownRow[]; total: number } {
  const rows: PulseBreakdownRow[] = [];

  switch (sport) {
    case 'football': {
      const goals   = Number(stats.goals   ?? 0);
      const assists = Number(stats.assists  ?? 0);
      const passes  = Number(stats.passes   ?? 0);
      const tackles = Number(stats.tackles  ?? 0);
      const saves   = Number(stats.saves    ?? 0);

      if (goals)   rows.push({ label: `Goals (${goals} × 25)`,     value: goals * 25 });
      if (assists) rows.push({ label: `Assists (${assists} × 15)`,  value: assists * 15 });
      const passesPts = Math.round(Math.min(passes / 10, 10));
      if (passesPts) rows.push({ label: `Passes bonus`,              value: passesPts });
      const tacklesPts = Math.round(Math.min(tackles / 3, 10));
      if (tacklesPts) rows.push({ label: `Tackles bonus`,            value: tacklesPts });
      if (saves)   rows.push({ label: `Saves (${saves} × 8)`,       value: saves * 8 });
      break;
    }
    case 'cricket': {
      const runs    = Number(stats.runs    ?? 0);
      const wickets = Number(stats.wickets ?? 0);
      const catches = Number(stats.catches ?? 0);

      if (runs)    rows.push({ label: `Runs (×0.5, max 50)`,    value: Math.round(Math.min(runs * 0.5, 50)) });
      if (wickets) rows.push({ label: `Wickets (${wickets} × 20)`, value: wickets * 20 });
      if (catches) rows.push({ label: `Catches (${catches} × 10)`, value: catches * 10 });
      break;
    }
    case 'basketball': {
      const points   = Number(stats.points   ?? 0);
      const assists  = Number(stats.assists   ?? 0);
      const rebounds = Number(stats.rebounds  ?? 0);
      const steals   = Number(stats.steals    ?? 0);
      const blocks   = Number(stats.blocks    ?? 0);

      if (points)   rows.push({ label: `Points (max 40)`,          value: Math.min(points, 40) });
      if (assists)  rows.push({ label: `Assists (${assists} × 8)`,  value: assists * 8 });
      if (rebounds) rows.push({ label: `Rebounds (${rebounds} × 5)`,value: rebounds * 5 });
      if (steals)   rows.push({ label: `Steals (${steals} × 8)`,    value: steals * 8 });
      if (blocks)   rows.push({ label: `Blocks (${blocks} × 6)`,    value: blocks * 6 });
      break;
    }
    case 'running': {
      rows.push({ label: 'Race completion', value: 30 });
      if (stats.personalBest) rows.push({ label: 'Personal Best!', value: 50 });
      if (Number(stats.positionFinished ?? 99) <= 3) rows.push({ label: 'Top 3 finish', value: 40 });
      break;
    }
    default: {
      const contribution = Number(stats.contribution ?? 5);
      rows.push({ label: `Contribution (${contribution} × 5)`, value: contribution * 5 });
    }
  }

  const ratingPts = Math.round((matchRating / 10) * (sport === 'basketball' ? 15 : 20));
  rows.push({ label: `Rating bonus (${matchRating}/10)`, value: ratingPts });

  if (isMvp) rows.push({ label: 'MVP bonus 👑', value: 40 });

  const resultLabel = result === 'win' ? 'Win bonus' : result === 'draw' ? 'Draw bonus' : '';
  const resultPts   = result === 'win' ? 15 : result === 'draw' ? 5 : 0;
  if (resultPts) rows.push({ label: resultLabel, value: resultPts });

  const total = rows.reduce((acc, r) => acc + r.value, 0);
  return { rows, total: Math.max(0, total) };
}

// ─── SSR DELTA ────────────────────────────────────────────────────────────────

export function calculateSSRDelta(
  _sport: PerformanceSport,
  stats: Stats,
  matchRating: number,
  result: MatchResult
): number {
  let delta = (matchRating / 10) * 0.5;
  if (result === 'win') delta += 0.2;
  const goals = Number(stats.goals ?? stats.points ?? stats.runs ?? 0);
  if (goals >= 3) delta += 0.1;
  return Math.round(delta * 10) / 10;
}

// ─── CHEMISTRY DELTA ─────────────────────────────────────────────────────────

export function calculateChemistryDelta(
  isMvp: boolean,
  result: MatchResult,
  matchRating: number
): number {
  let base = (matchRating / 10) * 2;
  if (result === 'win') base += 2;
  if (isMvp) base += 3;
  return Math.round(base);
}
