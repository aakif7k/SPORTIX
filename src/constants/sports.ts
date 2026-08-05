/**
 * The sport taxonomy: every sport the product knows about, and the positions
 * each team sport fields.
 *
 * This is reference data, not sample data, and it lived in services/mockData.ts —
 * so nine components that only wanted the list of sports were importing the
 * fixtures file, and mockData.ts could not be deleted without breaking screens
 * that had already been moved onto the API.
 *
 * SPORT_CATEGORIES is the short list used for filters and chips; GLOBAL_SPORTS is
 * the full list used where someone picks their own sport, and includes the short
 * list. Ids are the values written to Appwrite, so they are snake_case and must
 * not be renamed without a migration.
 */

// ─── SPORT CATEGORIES ──────────────────────────────────────────────────────
export const SPORT_CATEGORIES = [
  { id: 'football', label: 'Football', emoji: '⚽', color: '#22c55e' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', color: '#f97316' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', color: '#eab308' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', color: '#84cc16' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', color: '#06b6d4' },
  { id: 'athletics', label: 'Athletics', emoji: '🏃', color: '#CCFF00' },
  { id: 'boxing', label: 'Boxing', emoji: '🥊', color: '#ef4444' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', color: '#3b82f6' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', color: '#a855f7' },
  { id: 'rugby', label: 'Rugby', emoji: '🏉', color: '#78716c' },
  { id: 'baseball', label: 'Baseball', emoji: '⚾', color: '#ec4899' },
  { id: 'golf', label: 'Golf', emoji: '⛳', color: '#10b981' },
  { id: 'hockey', label: 'Hockey', emoji: '🏑', color: '#f59e0b' },
  { id: 'mma', label: 'MMA', emoji: '🥋', color: '#FF3B00' },
  { id: 'gymnastics', label: 'Gymnastics', emoji: '🤸', color: '#8b5cf6' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', color: '#14b8a6' },
];

export const GLOBAL_SPORTS = [
  ...SPORT_CATEGORIES,
  { id: 'archery', label: 'Archery', emoji: '🏹', color: '#fcd34d' },
  { id: 'american_football', label: 'American Football', emoji: '🏈', color: '#b45309' },
  { id: 'table_tennis', label: 'Table Tennis', emoji: '🏓', color: '#ef4444' },
  { id: 'wrestling', label: 'Wrestling', emoji: '🤼', color: '#6366f1' },
  { id: 'water_polo', label: 'Water Polo', emoji: '🤽', color: '#0ea5e9' },
  { id: 'fencing', label: 'Fencing', emoji: '🤺', color: '#94a3b8' },
  { id: 'weightlifting', label: 'Weightlifting', emoji: '🏋️', color: '#475569' },
  { id: 'skateboarding', label: 'Skateboarding', emoji: '🛹', color: '#14b8a6' },
  { id: 'surfing', label: 'Surfing', emoji: '🏄', color: '#38bdf8' },
  { id: 'snowboarding', label: 'Snowboarding', emoji: '🏂', color: '#cbd5e1' },
  { id: 'skiing', label: 'Skiing', emoji: '⛷️', color: '#e2e8f0' },
  { id: 'ice_hockey', label: 'Ice Hockey', emoji: '🏒', color: '#bae6fd' },
  { id: 'figure_skating', label: 'Figure Skating', emoji: '⛸️', color: '#fbcfe8' },
  { id: 'martial_arts', label: 'Martial Arts', emoji: '🥋', color: '#1e293b' },
  { id: 'taekwondo', label: 'Taekwondo', emoji: '🥋', color: '#f87171' },
  { id: 'judo', label: 'Judo', emoji: '🥋', color: '#3b82f6' },
  { id: 'rowing', label: 'Rowing', emoji: '🚣', color: '#2dd4bf' },
  { id: 'canoe', label: 'Canoeing', emoji: '🛶', color: '#f59e0b' },
  { id: 'sailing', label: 'Sailing', emoji: '⛵', color: '#0284c7' },
  { id: 'equestrian', label: 'Equestrian', emoji: '🏇', color: '#78350f' },
  { id: 'handball', label: 'Handball', emoji: '🤾', color: '#f43f5e' },
  { id: 'softball', label: 'Softball', emoji: '🥎', color: '#fde047' },
  { id: 'lacrosse', label: 'Lacrosse', emoji: '🥍', color: '#65a30d' },
  { id: 'bowling', label: 'Bowling', emoji: '🎳', color: '#d97706' },
  { id: 'esports', label: 'Esports', emoji: '🎮', color: '#8b5cf6' },
  { id: 'darts', label: 'Darts', emoji: '🎯', color: '#dc2626' },
  { id: 'billiards', label: 'Billiards / Pool', emoji: '🎱', color: '#0f172a' },
  { id: 'rock_climbing', label: 'Rock Climbing', emoji: '🧗', color: '#57534e' },
  { id: 'triathlon', label: 'Triathlon', emoji: '🏃🚴🏊', color: '#059669' },
  { id: 'squash', label: 'Squash', emoji: '🏸', color: '#10b981' },
  { id: 'netball', label: 'Netball', emoji: '🏐', color: '#d946ef' },
];

export const SPORT_POSITIONS: Record<string, string[]> = {
  football: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'],
  basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  volleyball: ['S', 'OH', 'MB', 'OPP', 'L'],
  rugby: ['Prop', 'Hooker', 'Lock', 'Flanker', 'No.8', 'Scrum-half', 'Fly-half', 'Wing', 'Centre', 'Fullback'],
  baseball: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
  hockey: ['GK', 'CB', 'LB', 'RB', 'CM', 'LW', 'RW', 'CF'],
  cricket: ['Bat', 'Bowl', 'WK', 'All-rounder'],
  default: ['Captain', 'Co-Captain', 'Member'],
};
