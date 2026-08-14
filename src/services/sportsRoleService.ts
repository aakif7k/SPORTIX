/**
 * sportsRoleService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend client service for SPORTiX Sports Role dataset & database integration.
 * Fetches from Appwrite 'sportix_sport_roles' and backend API with caching and fallback.
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

export interface SportsRoleData {
  sport_id: string;
  sport: string;
  roles: string[];
  role_1: string;
  role_1_count: number;
  role_2: string;
  role_2_count: number;
  role_3: string;
  role_3_count: number;
  role_4: string;
  role_4_count: number;
  total_players: number;
}

export const OFFICIAL_SPORTIX_SPORTS_ROLES: SportsRoleData[] = [
  { sport_id: 'S001', sport: 'Football',          role_1: 'Goalkeeper',         role_1_count: 1, role_2: 'Defender',             role_2_count: 4, role_3: 'Midfielder',            role_3_count: 3, role_4: 'Forward',              role_4_count: 3, total_players: 11, roles: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] },
  { sport_id: 'S002', sport: 'Cricket',           role_1: 'Batter',             role_1_count: 4, role_2: 'Bowler',               role_2_count: 4, role_3: 'All-Rounder',           role_3_count: 2, role_4: 'Wicketkeeper',        role_4_count: 1, total_players: 11, roles: ['Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'] },
  { sport_id: 'S003', sport: 'Basketball',        role_1: 'Point Guard',        role_1_count: 1, role_2: 'Shooting Guard',       role_2_count: 1, role_3: 'Forward',               role_3_count: 2, role_4: 'Center',              role_4_count: 1, total_players: 5,  roles: ['Point Guard', 'Shooting Guard', 'Forward', 'Center'] },
  { sport_id: 'S004', sport: 'Volleyball',        role_1: 'Setter',             role_1_count: 1, role_2: 'Outside Hitter',       role_2_count: 2, role_3: 'Middle Blocker',        role_3_count: 2, role_4: 'Libero',              role_4_count: 1, total_players: 6,  roles: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero'] },
  { sport_id: 'S005', sport: 'Tennis',            role_1: 'Baseline Player',    role_1_count: 1, role_2: 'Serve & Volley',       role_2_count: 1, role_3: 'All-Court Player',      role_3_count: 1, role_4: 'Counterpuncher',      role_4_count: 1, total_players: 1,  roles: ['Baseline Player', 'Serve & Volley', 'All-Court Player', 'Counterpuncher'] },
  { sport_id: 'S006', sport: 'Badminton',         role_1: 'Singles Player',     role_1_count: 1, role_2: 'Doubles Player',       role_2_count: 1, role_3: 'Attacking Player',      role_3_count: 1, role_4: 'Defensive Player',    role_4_count: 1, total_players: 1,  roles: ['Singles Player', 'Doubles Player', 'Attacking Player', 'Defensive Player'] },
  { sport_id: 'S007', sport: 'Field Hockey',      role_1: 'Goalkeeper',         role_1_count: 1, role_2: 'Defender',             role_2_count: 4, role_3: 'Midfielder',            role_3_count: 3, role_4: 'Forward',              role_4_count: 3, total_players: 11, roles: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] },
  { sport_id: 'S008', sport: 'Baseball',          role_1: 'Pitcher',            role_1_count: 1, role_2: 'Catcher',              role_2_count: 1, role_3: 'Infielder',             role_3_count: 4, role_4: 'Outfielder',          role_4_count: 3, total_players: 9,  roles: ['Pitcher', 'Catcher', 'Infielder', 'Outfielder'] },
  { sport_id: 'S009', sport: 'Softball',          role_1: 'Pitcher',            role_1_count: 1, role_2: 'Catcher',              role_2_count: 1, role_3: 'Infielder',             role_3_count: 4, role_4: 'Outfielder',          role_4_count: 3, total_players: 9,  roles: ['Pitcher', 'Catcher', 'Infielder', 'Outfielder'] },
  { sport_id: 'S010', sport: 'Rugby',             role_1: 'Forward',            role_1_count: 8, role_2: 'Scrum-Half',           role_2_count: 1, role_3: 'Back',                  role_3_count: 5, role_4: 'Fullback',            role_4_count: 1, total_players: 15, roles: ['Forward', 'Scrum-Half', 'Back', 'Fullback'] },
  { sport_id: 'S011', sport: 'American Football', role_1: 'Quarterback',        role_1_count: 1, role_2: 'Running Back',         role_2_count: 1, role_3: 'Wide Receiver',         role_3_count: 3, role_4: 'Defensive Player',    role_4_count: 6, total_players: 11, roles: ['Quarterback', 'Running Back', 'Wide Receiver', 'Defensive Player'] },
  { sport_id: 'S012', sport: 'Water Polo',        role_1: 'Goalkeeper',         role_1_count: 1, role_2: 'Defender',             role_2_count: 2, role_3: 'Midfielder',            role_3_count: 2, role_4: 'Attacker',            role_4_count: 2, total_players: 7,  roles: ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'] },
  { sport_id: 'S013', sport: 'Table Tennis',      role_1: 'Attacker',           role_1_count: 1, role_2: 'Defender',             role_2_count: 1, role_3: 'All-Rounder',           role_3_count: 1, role_4: 'Counter-Attacker',    role_4_count: 1, total_players: 1,  roles: ['Attacker', 'Defender', 'All-Rounder', 'Counter-Attacker'] },
  { sport_id: 'S014', sport: 'Boxing',            role_1: 'Out-Boxer',          role_1_count: 1, role_2: 'Swarmer',              role_2_count: 1, role_3: 'Slugger',               role_3_count: 1, role_4: 'Counterpuncher',      role_4_count: 1, total_players: 1,  roles: ['Out-Boxer', 'Swarmer', 'Slugger', 'Counterpuncher'] },
  { sport_id: 'S015', sport: 'MMA',               role_1: 'Striker',            role_1_count: 1, role_2: 'Wrestler',             role_2_count: 1, role_3: 'Grappler',              role_3_count: 1, role_4: 'All-Rounder',         role_4_count: 1, total_players: 1,  roles: ['Striker', 'Wrestler', 'Grappler', 'All-Rounder'] },
  { sport_id: 'S016', sport: 'Swimming',          role_1: 'Freestyle',          role_1_count: 1, role_2: 'Backstroke',           role_2_count: 1, role_3: 'Breaststroke',          role_3_count: 1, role_4: 'Butterfly',           role_4_count: 1, total_players: 1,  roles: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'] },
  { sport_id: 'S017', sport: 'Cycling',           role_1: 'Sprinter',          role_1_count: 1, role_2: 'Climber',              role_2_count: 1, role_3: 'Time-Trialist',         role_3_count: 1, role_4: 'All-Rounder',         role_4_count: 1, total_players: 1,  roles: ['Sprinter', 'Climber', 'Time-Trialist', 'All-Rounder'] },
  { sport_id: 'S018', sport: 'Athletics',         role_1: 'Sprinter',          role_1_count: 1, role_2: 'Distance Runner',      role_2_count: 1, role_3: 'Jumper',                role_3_count: 1, role_4: 'Thrower',             role_4_count: 1, total_players: 1,  roles: ['Sprinter', 'Distance Runner', 'Jumper', 'Thrower'] },
  { sport_id: 'S019', sport: 'Golf',              role_1: 'Driver',            role_1_count: 1, role_2: 'Iron Player',          role_2_count: 1, role_3: 'Short-Game Specialist', role_3_count: 1, role_4: 'Putter',              role_4_count: 1, total_players: 1,  roles: ['Driver', 'Iron Player', 'Short-Game Specialist', 'Putter'] },
  { sport_id: 'S020', sport: 'Lacrosse',          role_1: 'Goaltender',         role_1_count: 1, role_2: 'Defender',             role_2_count: 3, role_3: 'Midfielder',            role_3_count: 3, role_4: 'Attacker',            role_4_count: 3, total_players: 10, roles: ['Goaltender', 'Defender', 'Midfielder', 'Attacker'] },
  { sport_id: 'S021', sport: 'Beach Volleyball',  role_1: 'Blocker',            role_1_count: 1, role_2: 'Defender',             role_2_count: 1, role_3: 'Server',                role_3_count: 1, role_4: 'All-Rounder',         role_4_count: 1, total_players: 2,  roles: ['Blocker', 'Defender', 'Server', 'All-Rounder'] },
  { sport_id: 'S022', sport: 'Pickleball',        role_1: 'Baseline Player',    role_1_count: 1, role_2: 'Net Player',           role_2_count: 1, role_3: 'Server',                role_3_count: 1, role_4: 'All-Rounder',         role_4_count: 1, total_players: 2,  roles: ['Baseline Player', 'Net Player', 'Server', 'All-Rounder'] },
  { sport_id: 'S023', sport: 'Darts',             role_1: 'Scoring Specialist', role_1_count: 1, role_2: 'Finisher',             role_2_count: 1, role_3: 'All-Rounder',           role_3_count: 1, role_4: 'Accuracy Specialist', role_4_count: 1, total_players: 1,  roles: ['Scoring Specialist', 'Finisher', 'All-Rounder', 'Accuracy Specialist'] },
  { sport_id: 'S024', sport: 'Gymnastics',        role_1: 'Floor Specialist',   role_1_count: 1, role_2: 'Vault Specialist',     role_2_count: 1, role_3: 'Bars Specialist',       role_3_count: 1, role_4: 'Beam Specialist',     role_4_count: 1, total_players: 1,  roles: ['Floor Specialist', 'Vault Specialist', 'Bars Specialist', 'Beam Specialist'] },
  { sport_id: 'S025', sport: 'Handball',          role_1: 'Goalkeeper',         role_1_count: 1, role_2: 'Defender',             role_2_count: 3, role_3: 'Playmaker',             role_3_count: 2, role_4: 'Pivot',               role_4_count: 1, total_players: 7,  roles: ['Goalkeeper', 'Defender', 'Playmaker', 'Pivot'] },
  { sport_id: 'S026', sport: 'Kabaddi',           role_1: 'Raider',             role_1_count: 2, role_2: 'Defender',             role_2_count: 4, role_3: 'All-Rounder',           role_3_count: 1, role_4: 'Corner',              role_4_count: 2, total_players: 7,  roles: ['Raider', 'Defender', 'All-Rounder', 'Corner'] },
  { sport_id: 'S027', sport: 'Kho-Kho',           role_1: 'Chaser',             role_1_count: 1, role_2: 'Runner',               role_2_count: 3, role_3: 'Defender',              role_3_count: 3, role_4: 'Attacker',            role_4_count: 2, total_players: 9,  roles: ['Chaser', 'Runner', 'Defender', 'Attacker'] },
  { sport_id: 'S028', sport: 'Wrestling',         role_1: 'Freestyle Wrestler', role_1_count: 1, role_2: 'Greco-Roman Wrestler', role_2_count: 1, role_3: 'Takedown Specialist',   role_3_count: 1, role_4: 'Grappler',            role_4_count: 1, total_players: 1,  roles: ['Freestyle Wrestler', 'Greco-Roman Wrestler', 'Takedown Specialist', 'Grappler'] },
  { sport_id: 'S029', sport: 'Futsal',            role_1: 'Goalkeeper',         role_1_count: 1, role_2: 'Defender',             role_2_count: 1, role_3: 'Winger',                role_3_count: 2, role_4: 'Pivot',               role_4_count: 1, total_players: 5,  roles: ['Goalkeeper', 'Defender', 'Winger', 'Pivot'] },
  { sport_id: 'S030', sport: 'Squash',            role_1: 'Attacker',           role_1_count: 1, role_2: 'Defender',             role_2_count: 1, role_3: 'All-Rounder',           role_3_count: 1, role_4: 'Counter-Attacker',    role_4_count: 1, total_players: 1,  roles: ['Attacker', 'Defender', 'All-Rounder', 'Counter-Attacker'] },
];

let cachedRoles: SportsRoleData[] | null = null;

function normalizeSportKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Fetch all sports roles dynamically from Appwrite or API with fallback.
 */
export async function getAllSportsRoles(): Promise<SportsRoleData[]> {
  if (cachedRoles && cachedRoles.length > 0) {
    return cachedRoles;
  }

  // 1. Try Appwrite database collection
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SPORTIX_SPORT_ROLES,
      [Query.limit(100)]
    );

    if (res.documents && res.documents.length > 0) {
      const mapped: SportsRoleData[] = res.documents.map((d: any) => ({
        sport_id: d.sport_id,
        sport: d.sport,
        role_1: d.role_1,
        role_1_count: Number(d.role_1_count ?? 1),
        role_2: d.role_2,
        role_2_count: Number(d.role_2_count ?? 1),
        role_3: d.role_3,
        role_3_count: Number(d.role_3_count ?? 1),
        role_4: d.role_4,
        role_4_count: Number(d.role_4_count ?? 1),
        total_players: Number(d.total_players ?? 1),
        roles: [d.role_1, d.role_2, d.role_3, d.role_4].filter(Boolean),
      }));

      cachedRoles = mapped.sort((a, b) => a.sport_id.localeCompare(b.sport_id));
      return cachedRoles;
    }
  } catch (err) {
    console.warn('[sportsRoleService] Appwrite fetch failed, trying backend API:', err);
  }

  // 2. Try Backend API
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/sports/roles`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        cachedRoles = data.map((d: any) => ({
          sport_id: d.sport_id,
          sport: d.sport,
          role_1: d.role_1,
          role_1_count: Number(d.role_1_count ?? 1),
          role_2: d.role_2,
          role_2_count: Number(d.role_2_count ?? 1),
          role_3: d.role_3,
          role_3_count: Number(d.role_3_count ?? 1),
          role_4: d.role_4,
          role_4_count: Number(d.role_4_count ?? 1),
          total_players: Number(d.total_players ?? 1),
          roles: d.roles || [d.role_1, d.role_2, d.role_3, d.role_4].filter(Boolean),
        }));
        return cachedRoles!;
      }
    }
  } catch (err) {
    console.warn('[sportsRoleService] Backend API fetch failed, using local dataset:', err);
  }

  // 3. Fallback to Official Dataset
  cachedRoles = OFFICIAL_SPORTIX_SPORTS_ROLES;
  return cachedRoles;
}

/**
 * Get 4 roles synchronously from cache / dataset by sport name or sport_id.
 */
export function getSportRolesSync(sportNameOrId: string): string[] {
  if (!sportNameOrId) return ['Captain', 'Strategist', 'Pro', 'Support'];

  const normalized = normalizeSportKey(sportNameOrId);
  const found = (cachedRoles || OFFICIAL_SPORTIX_SPORTS_ROLES).find(
    s => normalizeSportKey(s.sport) === normalized || normalizeSportKey(s.sport_id) === normalized
  );

  return found ? found.roles : ['Captain', 'Strategist', 'Pro', 'Support'];
}

/**
 * Get full sport role object synchronously.
 */
export function getSportRoleDataSync(sportNameOrId: string): SportsRoleData | undefined {
  if (!sportNameOrId) return undefined;

  const normalized = normalizeSportKey(sportNameOrId);
  return (cachedRoles || OFFICIAL_SPORTIX_SPORTS_ROLES).find(
    s => normalizeSportKey(s.sport) === normalized || normalizeSportKey(s.sport_id) === normalized
  );
}

/**
 * Get sport ID synchronously.
 */
export function getSportIdSync(sportName: string): string {
  const data = getSportRoleDataSync(sportName);
  return data ? data.sport_id : 'ALL';
}
