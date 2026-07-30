/**
 * Generates the parity reference for tests/test_pulse_math.py by executing the
 * REAL frontend TypeScript, so the expected values are not hand-derived (which
 * would risk reproducing the same arithmetic mistake on both sides).
 *
 * Run from sportix-backend/:
 *   node --experimental-strip-types scripts/gen_pulse_reference.ts
 *
 * Writes tests/fixtures/pulse_reference.json. That file is committed so the
 * Python test suite does not need Node installed; regenerate it whenever
 * performanceService.ts changes.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  calculatePulse,
  getPulseBreakdown,
  calculateSSRDelta,
  calculateChemistryDelta,
} from '../../src/services/performanceService.ts';

type Stats = Record<string, number | string | boolean>;
type Case = { sport: string; stats: Stats; match_rating: number; is_mvp: boolean; result: string };

const RESULTS = ['win', 'loss', 'draw'] as const;

const CASES: Case[] = [];

// ── football (8) ─────────────────────────────────────────────────────────────
[
  { goals: 0, assists: 0, passes: 0, tackles: 0, saves: 0 },
  { goals: 1, assists: 0, passes: 35, tackles: 4, saves: 0 },
  { goals: 2, assists: 1, passes: 120, tackles: 9, saves: 0 },
  { goals: 3, assists: 2, passes: 300, tackles: 45, saves: 0 },   // both bonuses capped
  { goals: 0, assists: 0, passes: 14, tackles: 7, saves: 5 },     // keeper
  { goals: 0, assists: 3, passes: 99, tackles: 2, saves: 0 },
  { goals: 5, assists: 0, passes: 51, tackles: 31, saves: 1 },
  { goals: 1, assists: 1, passes: 100, tackles: 30, saves: 0 },   // exactly at both caps
].forEach((stats, i) => CASES.push({
  sport: 'football', stats, match_rating: [0, 5, 7.5, 10, 6, 8.2, 9, 3][i],
  is_mvp: i % 3 === 0, result: RESULTS[i % 3],
}));

// ── cricket (8) ──────────────────────────────────────────────────────────────
[
  { runs: 0, wickets: 0, catches: 0 },
  { runs: 45, wickets: 1, catches: 1 },
  { runs: 100, wickets: 0, catches: 0 },      // runs cap at 50 pts
  { runs: 250, wickets: 3, catches: 2 },      // well past the cap
  { runs: 99, wickets: 5, catches: 0 },
  { runs: 12, wickets: 0, catches: 4 },
  { runs: 7, wickets: 2, catches: 1 },
  { runs: 100, wickets: 1, catches: 1 },      // exactly at the cap
].forEach((stats, i) => CASES.push({
  sport: 'cricket', stats, match_rating: [1, 4, 6, 10, 7.7, 5.5, 8, 2][i],
  is_mvp: i % 4 === 0, result: RESULTS[(i + 1) % 3],
}));

// ── basketball (8) — note the rating multiplier is 15 here, not 20 ───────────
[
  { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0 },
  { points: 12, assists: 4, rebounds: 6, steals: 1, blocks: 0 },
  { points: 40, assists: 10, rebounds: 11, steals: 3, blocks: 2 },
  { points: 62, assists: 2, rebounds: 3, steals: 0, blocks: 1 },   // points cap at 40
  { points: 28, assists: 11, rebounds: 9, steals: 4, blocks: 3 },
  { points: 5, assists: 0, rebounds: 15, steals: 0, blocks: 6 },
  { points: 33, assists: 7, rebounds: 2, steals: 5, blocks: 0 },
  { points: 40, assists: 0, rebounds: 0, steals: 0, blocks: 0 },   // exactly at the cap
].forEach((stats, i) => CASES.push({
  sport: 'basketball', stats, match_rating: [0, 6.4, 10, 8, 9.1, 3.3, 7, 5][i],
  is_mvp: i % 2 === 0, result: RESULTS[(i + 2) % 3],
}));

// ── running (8) — exercises truthiness and the positionFinished default ──────
[
  {},                                                  // no stats at all
  { personalBest: true, positionFinished: 1 },
  { personalBest: false, positionFinished: 3 },
  { personalBest: true, positionFinished: 4 },
  { personalBest: false, positionFinished: 99 },
  { positionFinished: 2 },                             // personalBest absent
  { personalBest: true },                              // positionFinished absent -> 99
  { personalBest: 0, positionFinished: 3 },            // 0 is falsy in JS
].forEach((stats, i) => CASES.push({
  sport: 'running', stats: stats as Stats, match_rating: [5, 10, 8.8, 6, 0, 7.2, 9.9, 4][i],
  is_mvp: i % 5 === 0, result: RESULTS[i % 3],
}));

// ── generic / unknown sport (8) — exercises the contribution default of 5 ────
[
  { contribution: 0 },
  { contribution: 5 },
  { contribution: 12 },
  {},                                                  // absent -> defaults to 5
  { contribution: 1 },
  { contribution: 20 },
  { contribution: 3 },
  { contribution: 7 },
].forEach((stats, i) => CASES.push({
  sport: ['volleyball', 'tennis', 'badminton', 'swimming', 'hockey', 'rugby', 'esports', 'other'][i],
  stats: stats as Stats, match_rating: [2, 5, 7, 10, 8.4, 6.6, 1, 9][i],
  is_mvp: i % 3 === 1, result: RESULTS[(i + 1) % 3],
}));

const out = CASES.map((c) => ({
  ...c,
  expected: {
    pulse: calculatePulse(c.sport as any, c.stats, c.match_rating, c.is_mvp, c.result as any),
    breakdown_total: getPulseBreakdown(c.sport as any, c.stats, c.match_rating, c.is_mvp, c.result as any).total,
    breakdown_rows: getPulseBreakdown(c.sport as any, c.stats, c.match_rating, c.is_mvp, c.result as any)
      .rows.map((r) => r.value),
    ssr_delta: calculateSSRDelta(c.sport as any, c.stats, c.match_rating, c.result as any),
    chemistry_delta: calculateChemistryDelta(c.is_mvp, c.result as any, c.match_rating),
  },
}));

const target = join(import.meta.dirname, '..', 'tests', 'fixtures', 'pulse_reference.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify({
  generated_by: 'scripts/gen_pulse_reference.ts',
  source: 'src/services/performanceService.ts',
  cases: out,
}, null, 2) + '\n');

const perSport = out.reduce<Record<string, number>>((acc, c) => {
  const key = ['football', 'cricket', 'basketball', 'running'].includes(c.sport) ? c.sport : 'generic';
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
console.log(`wrote ${out.length} cases to ${target}`);
console.log('per sport:', perSport);
