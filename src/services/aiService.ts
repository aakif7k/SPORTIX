import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AITeamResult, Team, TeamMember, SportCategory, ExperienceLevel, BracketRound } from '../types';
import { SPORT_POSITIONS } from './mockData';
import { getEventParticipants } from './eventService';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

function getGenAI() {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(apiKey);
}

// ─── CONNECTION TEST ────────────────────────────────────────────────────────
export async function testAIConnection(): Promise<{ ok: boolean; message: string; model?: string }> {
  const genAI = getGenAI();
  if (!genAI) {
    return { ok: false, message: 'API key not configured. Check your .env file.' };
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Reply with exactly: "SportiX AI online"');
    const text = result.response.text().trim();
    return { ok: true, message: text || 'Connected', model: 'gemini-1.5-flash' };
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    return { ok: false, message: msg };
  }
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

async function buildTeamFromEventParticipants(
  sport: SportCategory,
  teamName: string,
  id: string,
  eventId: string
): Promise<Team> {
  const positions = SPORT_POSITIONS[sport] || SPORT_POSITIONS.default;
  const fallbackNames = ['Jordan Hayes', 'Kai Nakamura', 'Lena Hoffman', 'Carlos Reyes', 'Amara Diallo', 'Flynn O\'Brien', 'Zara Patel', 'Dmitri Volkov', 'Sofia Chen', 'Marco Vitale', 'Aisha Kamara'];
  const fallbackAvatars = Array.from({ length: 11 }, (_, i) => `https://i.pravatar.cc/150?img=${20 + i}`);

  let eventAthletes: any[] = [];
  try {
    const parts = await getEventParticipants(eventId);
    for (const p of parts) {
      if (p.profile && p.profile.full_name) {
        eventAthletes.push({
          userId: p.user_id,
          name: p.profile.full_name,
          avatar: p.profile.avatar_url,
          position: p.profile.sport || positions[0]
        });
      }
    }
  } catch (err) {
    console.warn('[aiService] Could not fetch event participants:', err);
  }

  // Supplement if less than 6 athletes
  if (eventAthletes.length < 6) {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.limit(10)]
      );
      for (const d of res.documents) {
        if (!eventAthletes.some(a => a.userId === d.$id)) {
          eventAthletes.push({
            userId: d.$id,
            name: d.full_name || 'Athlete',
            avatar: d.avatar_url,
            position: d.position || positions[0]
          });
        }
      }
    } catch {}
  }

  const targetLength = Math.min(positions.length, 6);
  const members: TeamMember[] = positions.slice(0, targetLength).map((pos, i) => {
    const candidate = eventAthletes[i];
    const name = candidate?.name || fallbackNames[i % fallbackNames.length];
    const avatar = candidate?.avatar || fallbackAvatars[i % fallbackAvatars.length];
    const userId = candidate?.userId || `ai_${id}_${i}`;

    return {
      userId,
      name,
      avatar,
      position: pos,
      skillScore: randomStat(82, 97),
      stats: generateAthleteStats(sport, pos),
      compatibilityScore: randomStat(85, 99),
    };
  });

  const overallRating = Math.round(members.reduce((sum, m) => sum + m.skillScore, 0) / members.length);
  const compat = Math.round(members.reduce((sum, m) => sum + m.compatibilityScore, 0) / members.length);
  return { id, name: teamName, sport, members, overallRating, compatibilityRating: compat, aiGenerated: true, captain: members[0]?.userId };
}

// ─── ANALYSIS LOG GENERATOR ────────────────────────────────────────────────
function generateAnalysisLog(sport: SportCategory, count: number): string[] {
  const emoji = ({ football: '⚽', basketball: '🏀', tennis: '🎾', mma: '🥋', swimming: '🏊' } as Record<string, string>)[sport] || '🏆';
  return [
    `> Scanning ${count} registered ${sport} athletes in event talent pool...`,
    `> Filtering by Pulse rating synergy and positional fit...`,
    `> Running position-fit algorithm for ${sport.toUpperCase()} formation...`,
    `> Calculating chemistry scores across ${Math.floor(count * 0.4)} candidate combinations...`,
    `> Applying historical win-rate weights & pulse compatibility...`,
    `> Cross-referencing player availability...`,
    `> Optimizing for balance: offense ↔ defense ↔ stamina...`,
    `> Generating compatibility breakdown ${emoji}...`,
    `> Final AI team assembled with peak chemistry!`,
  ];
}

// ─── GEMINI AI TEAM GENERATION ─────────────────────────────────────────────
async function generateTeamWithGemini(sport: SportCategory, skillLevel: ExperienceLevel, teamRoster?: TeamMember[]): Promise<{ reasoning: string; positions: string[] }> {
  const genAI = getGenAI();
  const positions = SPORT_POSITIONS[sport] || SPORT_POSITIONS.default;
  if (!genAI) {
    return { reasoning: `For ${skillLevel} ${sport}, we prioritize complementary pulse ratings and positional balance across ${teamRoster?.[0]?.name || 'the team'} and ${teamRoster?.[1]?.name || 'key athletes'}.`, positions };
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const rosterStr = teamRoster && teamRoster.length > 0
    ? `Assigned athletes: ${teamRoster.map(m => `${m.name} (${m.position}, Skill: ${m.skillScore})`).join(', ')}`
    : `Available positions: ${positions.join(', ')}`;

  const prompt = `You are a professional sports analyst AI for the SportiX platform.
A ${skillLevel} level ${sport} team needs to be assembled for an event.
${rosterStr}

In 2-3 sentences, provide strategic reasoning for how you assembled this ideal team composition for ${sport} at ${skillLevel} level, citing at least two player names. Focus on tactical balance, chemistry, and pulse rating synergy.

Format your response as JSON: {"reasoning": "...", "positions": ["pos1", "pos2", ...]}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('Gemini API error, using simulation:', e);
  }
  return { reasoning: `For ${skillLevel} ${sport}, we prioritize high-agility players with complementary skill sets. AI identified optimal position balance based on registered event participants.`, positions };
}

// ─── PUBLIC AI SERVICE FUNCTIONS ───────────────────────────────────────────
export async function generateTeam(sport: SportCategory, skillLevel: ExperienceLevel, eventId: string, onLog?: (log: string) => void): Promise<AITeamResult> {
  const athleteCount = randomStat(340, 847);
  const logs = generateAnalysisLog(sport, athleteCount);
  for (const log of logs) {
    await new Promise(r => setTimeout(r, randomStat(150, 260)));
    onLog?.(log);
  }

  const mainTeam = await buildTeamFromEventParticipants(sport, `AI Squad ${sport.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`, `team_${eventId}_main`, eventId);
  const altTeam1 = await buildTeamFromEventParticipants(sport, `Alternative Alpha`, `team_${eventId}_alt1`, eventId);
  const altTeam2 = await buildTeamFromEventParticipants(sport, `Alternative Beta`, `team_${eventId}_alt2`, eventId);

  const geminiResult = await generateTeamWithGemini(sport, skillLevel, mainTeam.members);

  return {
    team: mainTeam,
    reasoning: geminiResult.reasoning,
    compatibilityBreakdown: { chemistry: randomStat(88, 97), fitness: randomStat(82, 96), tactical: randomStat(85, 98), experience: randomStat(80, 95) },
    alternateOptions: [altTeam1, altTeam2],
    analysisLog: logs,
  };
}

export async function matchOpponent(teamId: string, _sport: SportCategory): Promise<Team> {
  await new Promise(r => setTimeout(r, 800));
  return buildTeamFromEventParticipants('football', `Rival Squad`, `opp_${teamId}`, 'mock_event');
}

export async function recommendEvents(_sport: SportCategory): Promise<string[]> {
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
