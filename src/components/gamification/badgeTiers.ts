/**
 * Badge tier definitions.
 *
 * Kept in its own module so BadgeIcon.tsx exports only a component: mixing
 * component and non-component exports in one file breaks Vite fast refresh
 * (react-refresh/only-export-components).
 */

// Types for Ranks & Badges
export type MilestoneBadgeTier =
  | 'rookie'         // 1-10
  | 'challenger'     // 11-20
  | 'contender'      // 21-30
  | 'striker'        // 31-40
  | 'elite'          // 41-50
  | 'dominator'      // 51-60
  | 'champion'       // 61-70
  | 'titan'          // 71-80
  | 'apex'           // 81-90
  | 'legend'         // 91-100
  // Elite Tiers
  | 'grandmaster'    // 101-110
  | 'hypernova'      // 111-120
  | 'phantom'        // 121-130
  | 'immortal'       // 131-140
  | 'supreme';       // 141+

export interface BadgeInfo {
  tier: MilestoneBadgeTier;
  name: string;
  color: string;
  glowColor: string;
  borderColor: string;
}

export const getBadgeTierInfo = (level: number): BadgeInfo => {
  if (level <= 10)  return { tier: 'rookie',      name: 'Rookie Core',      color: '#CCFF00', glowColor: 'rgba(204,255,0,0.6)', borderColor: '#1A3300' };
  if (level <= 20)  return { tier: 'challenger',  name: 'Challenger Unit',  color: '#E2E8F0', glowColor: 'rgba(226,232,240,0.6)', borderColor: '#475569' };
  if (level <= 30)  return { tier: 'contender',   name: 'Contender X',      color: '#00D4FF', glowColor: 'rgba(0,212,255,0.6)', borderColor: '#00475A' };
  if (level <= 40)  return { tier: 'striker',     name: 'Striker Elite',    color: '#10B981', glowColor: 'rgba(16,185,129,0.6)', borderColor: '#064E3B' };
  if (level <= 50)  return { tier: 'elite',       name: 'Elite Phantom',    color: '#8B5CF6', glowColor: 'rgba(139,92,246,0.6)', borderColor: '#4C1D95' };
  if (level <= 60)  return { tier: 'dominator',   name: 'Dominator Prime',  color: '#F97316', glowColor: 'rgba(249,115,22,0.6)', borderColor: '#7C2D12' };
  if (level <= 70)  return { tier: 'champion',    name: 'Champion Nexus',   color: '#EF4444', glowColor: 'rgba(239,68,68,0.6)', borderColor: '#7F1D1D' };
  if (level <= 80)  return { tier: 'titan',       name: 'Titan Core',       color: '#EC4899', glowColor: 'rgba(236,72,153,0.6)', borderColor: '#701A75' };
  if (level <= 90)  return { tier: 'apex',        name: 'Apex Velocity',    color: '#3B82F6', glowColor: 'rgba(59,130,246,0.6)', borderColor: '#1E3A8A' };
  if (level <= 100) return { tier: 'legend',      name: 'Legend Infinite',  color: '#CCFF00', glowColor: 'rgba(204,255,0,0.8)', borderColor: '#3B82F6' };
  
  // Elite Levels After 100
  if (level <= 110) return { tier: 'grandmaster', name: 'Grandmaster X',    color: '#F59E0B', glowColor: 'rgba(245,158,11,0.8)', borderColor: '#78350F' };
  if (level <= 120) return { tier: 'hypernova',   name: 'HyperNova',        color: '#EC4899', glowColor: 'rgba(236,72,153,0.9)', borderColor: '#5B21B6' };
  if (level <= 130) return { tier: 'phantom',     name: 'Phantom Overdrive',color: '#8B5CF6', glowColor: 'rgba(139,92,246,0.9)', borderColor: '#06B6D4' };
  if (level <= 140) return { tier: 'immortal',    name: 'Immortal Zenith',  color: '#00F5FF', glowColor: 'rgba(0,245,255,1)', borderColor: '#1E40AF' };
  return { tier: 'supreme', name: 'Supreme GOAT', color: '#CCFF00', glowColor: 'rgba(204,255,0,1)', borderColor: '#EF4444' };
};
