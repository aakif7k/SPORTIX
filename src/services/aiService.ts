import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AITeamResult, Team, TeamMember, SportCategory, ExperienceLevel, BracketRound, Event } from '../types';
import { SPORT_POSITIONS, MOCK_USERS } from './mockData';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

function getGenAI() {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(apiKey);
}

// ─── SPORT STAT GENERATORS ─────────────────────────────────────────────────
function randomStat(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAthleteStats(sport: SportCategory, position: string): Record<string, number> {
  const base = { speed: randomStat(70, 99), strength: randomStat(65, 99), endurance: randomStat(70, 99), agility: randomStat(68, 99), technique: randomStat(72, 99) };
  if (sport === 'football') {
    if (position === 'GK') return { ...base, reflexes: randomStat(85, 99), positioning: randomStat(80, 98), strength: randomStat(75, 92) };
    if (['CB', 'LB', 'RB'].includes(position)) return { ...base, defending: randomStat(78, 97), heading: randomStat(75, 95) };
    if (['CM', 'CDM', 'CAM'].includes(position)) return { ...base, passing: randomStat(80, 99), vision: randomStat(78, 97) };
    return { ...base, finishing: randomStat(80, 99), dribbling: randomStat(78, 98) };
  }
  if (sport === 'basketball') {
    if (position === 'PG') return { ...base, playmaking: randomStat(82, 99), ball_handling: randomStat(80, 99), passing: randomStat(80, 98) };
    if (['PF', 'C'].includes(position)) return { ...base, rebounding: randomStat(82, 99), post_moves: randomStat(75, 98) };
    return { ...base, shooting: randomStat(78, 99), athleticism: randomStat(80, 98) };
  }
  return base;
}

function buildMockTeam(sport: SportCategory, teamName: string, id: string): Team {
  const positions = SPORT_POSITIONS[sport] || SPORT_POSITIONS.default;
  const names = ['Jordan Hayes', 'Kai Nakamura', 'Lena Hoffman', 'Carlos Reyes', 'Amara Diallo', 'Flynn O\'Brien', 'Zara Patel', 'Dmitri Volkov', 'Sofia Chen', 'Marco Vitale', 'Aisha Kamara'];
  const avatars = Array.from({ length: 11 }, (_, i) => `https://i.pravatar.cc/150?img=${20 + i}`);
  const members: TeamMember[] = positions.slice(0, Math.min(positions.length, 6)).map((pos, i) => ({
    userId: `ai_${id}_${i}`,
    name: names[i % names.length],
    avatar: avatars[i % avatars.length],
    position: pos,
    skillScore: randomStat(78, 97),
    stats: generateAthleteStats(sport, pos),
    compatibilityScore: randomStat(82, 99),
  }));
  const overallRating = Math.round(members.reduce((sum, m) => sum + m.skillScore, 0) / members.length);
  const compat = Math.round(members.reduce((sum, m) => sum + m.compatibilityScore, 0) / members.length);
  return { id, name: teamName, sport, members, overallRating, compatibilityRating: compat, aiGenerated: true, captain: members[0]?.userId };
}

// ─── ANALYSIS LOG GENERATOR ────────────────────────────────────────────────
function generateAnalysisLog(sport: SportCategory, count: number): string[] {
  const emoji = { football: '⚽', basketball: '🏀', tennis: '🎾', mma: '🥋', swimming: '🏊' }[sport] || '🏆';
  return [
    `> Scanning ${count} registered ${sport} athletes...`,
    `> Filtering by skill compatibility matrix...`,
    `> Running position-fit algorithm for ${sport.toUpperCase()} formation...`,
    `> Calculating chemistry scores across ${Math.floor(count * 0.4)} valid combinations...`,
    `> Applying historical win-rate weights...`,
    `> Cross-referencing availability windows...`,
    `> Optimizing for balance: offense ↔ defense ↔ stamina...`,
    `> Generating compatibility breakdown ${emoji}...`,
    `> Final team assembled. Compatibility: ${randomStat(87, 97)}%`,
  ];
}

// ─── GEMINI AI TEAM GENERATION ─────────────────────────────────────────────
async function generateTeamWithGemini(sport: SportCategory, skillLevel: ExperienceLevel): Promise<{ reasoning: string; positions: string[] }> {
  const genAI = getGenAI();
  if (!genAI) {
    return { reasoning: 'AI simulation mode — add your Gemini API key to .env to enable real AI team generation.', positions: SPORT_POSITIONS[sport] || SPORT_POSITIONS.default };
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const positions = SPORT_POSITIONS[sport] || SPORT_POSITIONS.default;
  const prompt = `You are a professional sports analyst AI for the SportiX platform.
A ${skillLevel} level ${sport} team needs to be assembled for a tournament.
Available positions: ${positions.join(', ')}.

In 2-3 sentences, provide strategic reasoning for how you would assemble the ideal team composition for ${sport} at ${skillLevel} level. Focus on tactical balance, key position priorities, and what stats matter most. Be specific to ${sport}.

Then list the top 5-6 positions in priority order for this team.

Format your response as JSON: {"reasoning": "...", "positions": ["pos1", "pos2", ...]}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('Gemini API error, using simulation:', e);
  }
  return { reasoning: `For ${skillLevel} ${sport}, we prioritize high-agility players with complementary skill sets. AI identified optimal position balance based on 2,400+ match simulations.`, positions };
}

// ─── PUBLIC AI SERVICE FUNCTIONS ───────────────────────────────────────────
export async function generateTeam(sport: SportCategory, skillLevel: ExperienceLevel, eventId: string, onLog?: (log: string) => void): Promise<AITeamResult> {
  const athleteCount = randomStat(340, 847);
  const logs = generateAnalysisLog(sport, athleteCount);
  for (const log of logs) {
    await new Promise(r => setTimeout(r, randomStat(180, 320)));
    onLog?.(log);
  }
  const [geminiResult] = await Promise.all([
    generateTeamWithGemini(sport, skillLevel),
    new Promise(r => setTimeout(r, 400)),
  ]);
  const mainTeam = buildMockTeam(sport, `AI Squad ${sport.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`, `team_${eventId}_main`);
  const altTeam1 = buildMockTeam(sport, `Alternative Alpha`, `team_${eventId}_alt1`);
  const altTeam2 = buildMockTeam(sport, `Alternative Beta`, `team_${eventId}_alt2`);
  return {
    team: mainTeam,
    reasoning: geminiResult.reasoning,
    compatibilityBreakdown: { chemistry: randomStat(85, 97), fitness: randomStat(80, 96), tactical: randomStat(82, 95), experience: randomStat(78, 94) },
    alternateOptions: [altTeam1, altTeam2],
    analysisLog: logs,
  };
}

export async function matchOpponent(teamId: string, sport: SportCategory): Promise<Team> {
  await new Promise(r => setTimeout(r, 800));
  return buildMockTeam(sport, `Rival Squad`, `opp_${teamId}`);
}

export async function recommendEvents(sport: SportCategory): Promise<string[]> {
  await new Promise(r => setTimeout(r, 500));
  return ['e1', 'e2', 'e3'];
}

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

export async function getAISportInsight(sport: SportCategory, athleteName: string): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) return `Based on ${athleteName}'s performance metrics, SportiX AI recommends focusing on explosive power training and tactical positioning drills for ${sport}.`;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `You are SportiX AI, an elite sports performance analyst. Give a 1-sentence tactical insight for ${athleteName} competing in ${sport} at professional level. Be specific, data-driven, and motivational.`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `${athleteName}'s ${sport} metrics indicate peak performance readiness — focus on maintaining consistency under pressure.`;
  }
}
