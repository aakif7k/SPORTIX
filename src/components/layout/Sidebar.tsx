import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, Search, MessageCircle, Bell, User, Zap,
  LogOut, Settings, TrendingUp, Shield, Activity, Target,
  ChevronLeft, ChevronRight, Radio, Trophy, Flame,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Avatar } from '../ui/Avatar';

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/app/feed',          icon: Home,          label: 'HypeZone',  accent: '#CCFF00',  badge: null },
  { to: '/app/events',        icon: Calendar,      label: 'ClashHub',  accent: '#FF6B00',  badge: '3' },
  { to: '/app/discover',      icon: Search,        label: 'Discover',  accent: '#00D4FF',  badge: null },
  { to: '/app/messages',      icon: MessageCircle, label: 'Huddle',    accent: '#A855F7',  badge: null },
  { to: '/app/notifications', icon: Bell,          label: 'Buzz',      accent: '#FF3B00',  badge: null },
  { to: '/app/profile/me',    icon: User,          label: 'PlayerDNA', accent: '#CCFF00',  badge: null },
];

// ─── LIVE PULSE DOT ──────────────────────────────────────────────────────────
const LivePulse: React.FC = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CCFF00]" />
  </span>
);

// ─── MINI STAT BAR ───────────────────────────────────────────────────────────
const MiniStatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between items-center">
      <span style={{ fontFamily: 'Space Grotesk', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono', fontSize: '9px', color }}>{value}</span>
    </div>
    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </div>
);

// ─── LIVE MATCH TICKER ───────────────────────────────────────────────────────
const LIVE_MATCHES = [
  { sport: '⚽', teams: 'BVB vs PSG', score: '2 - 1', time: '67\'' },
  { sport: '🏀', teams: 'LAL vs GSW', score: '98 - 94', time: '3Q' },
  { sport: '🎾', teams: 'Alcaraz vs Sinner', score: '6-4 4-5', time: 'Set 2' },
];

interface SidebarProps { className?: string; }

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [expanded, setExpanded] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  // Cycle live match ticker
  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % LIVE_MATCHES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const winRate = user ? Math.round((user.stats.wins / user.stats.matches) * 100) : 0;
  const currentMatch = LIVE_MATCHES[tickerIdx];

  return (
    <motion.aside
      animate={{ width: expanded ? 260 : 68 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`hidden md:flex flex-col h-screen sticky top-0 z-40 flex-shrink-0 overflow-hidden relative ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(8,8,8,1) 100%)',
        borderRight: '1px solid rgba(204,255,0,0.08)',
      }}
    >
      {/* ── Ambient glow top ── */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.08) 0%, transparent 70%)' }}
      />
      {/* ── Subtle grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(204,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ═══════════════════════ LOGO ═══════════════════════ */}
      <div className="relative flex items-center gap-3 px-4 py-4 min-h-[68px]" style={{ borderBottom: '1px solid rgba(204,255,0,0.07)' }}>
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/app/feed')}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer relative"
          style={{ background: 'linear-gradient(135deg, #CCFF00, #88AA00)', boxShadow: '0 0 20px rgba(204,255,0,0.35)' }}
        >
          <Zap size={18} className="text-black" fill="black" />
          <div className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }} />
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col leading-none"
            >
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '22px', color: '#CCFF00', letterSpacing: '0.15em', lineHeight: 1 }}>
                SPORTIX
              </span>
              <span style={{ fontFamily: 'DM Mono', fontSize: '8px', color: '#555', letterSpacing: '0.2em' }}>
                PRO NETWORK
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════ PLAYER CARD (expanded only) ═══════════════════════ */}
      <AnimatePresence>
        {expanded && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mx-3 mt-3 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(204,255,0,0.06) 0%, rgba(0,0,0,0) 100%)',
              border: '1px solid rgba(204,255,0,0.12)',
            }}
          >
            {/* Cover strip with gradient */}
            <div className="h-10 relative overflow-hidden">
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(204,255,0,0.15), rgba(0,212,255,0.08), transparent)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(204,255,0,0.03) 4px, rgba(204,255,0,0.03) 5px)' }} />
            </div>

            <div className="px-3 pb-3 -mt-5">
              {/* Avatar + name row */}
              <div className="flex items-end gap-2 mb-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '2px solid rgba(204,255,0,0.4)', boxShadow: '0 0 12px rgba(204,255,0,0.2)' }}>
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#CCFF00] border-2 border-[#0a0a0a]" />
                </div>
                <div className="flex-1 min-w-0 pb-0.5">
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '12px', color: '#fff' }} className="truncate">{user.name}</p>
                  <div className="flex items-center gap-1">
                    <span style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#CCFF00' }}>@{user.username}</span>
                    {user.isVerified && <span className="text-[8px]">✓</span>}
                  </div>
                </div>
                <div className="text-right pb-0.5">
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '20px', color: '#CCFF00', lineHeight: 1 }}>{user.stats.rating}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '7px', color: '#555', letterSpacing: '0.1em' }}>OVR</div>
                </div>
              </div>

              {/* Mini stat bars */}
              <div className="space-y-1.5">
                <MiniStatBar label="Speed" value={user.performanceData.speed} color="#CCFF00" />
                <MiniStatBar label="Technique" value={user.performanceData.technique} color="#00D4FF" />
                <MiniStatBar label="Endurance" value={user.performanceData.endurance} color="#FF6B00" />
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-1 mt-2.5">
                {[
                  { label: 'W', value: user.stats.wins },
                  { label: 'WIN%', value: `${winRate}%` },
                  { label: 'EXP', value: `${user.stats.yearsExperience}Y` },
                ].map(s => (
                  <div key={s.label} className="rounded-lg text-center py-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '14px', color: '#fff', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '7px', color: '#555', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════ NAV ITEMS ═══════════════════════ */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Section label */}
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: 'Space Grotesk', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#333', paddingLeft: '12px', marginBottom: '6px', marginTop: '4px' }}
            >
              Navigate
            </motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map(({ to, icon: Icon, label, accent, badge }) => {
          const isBuzz = label === 'Buzz';
          const badgeCount = isBuzz ? unreadCount : (badge ? parseInt(badge) : 0);

          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  onHoverStart={() => setHoveredNav(label)}
                  onHoverEnd={() => setHoveredNav(null)}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex items-center gap-3 cursor-pointer rounded-xl"
                  style={{
                    padding: expanded ? '9px 12px' : '9px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    background: isActive
                      ? `linear-gradient(90deg, ${accent}18, transparent)`
                      : hoveredNav === label
                      ? 'rgba(255,255,255,0.04)'
                      : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Active bar */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="relative flex-shrink-0 flex items-center justify-center rounded-lg w-8 h-8 transition-all duration-200"
                    style={{
                      background: isActive ? `${accent}22` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? `${accent}44` : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isActive ? `0 0 12px ${accent}30` : 'none',
                    }}
                  >
                    <Icon size={15} style={{ color: isActive ? accent : hoveredNav === label ? '#ccc' : '#555', transition: 'color 0.2s' }} />
                    {badgeCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: '#FF3B00', fontSize: '8px', fontFamily: 'DM Mono', fontWeight: 700, color: '#fff', padding: '0 3px', boxShadow: '0 0 6px rgba(255,59,0,0.6)' }}
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </motion.span>
                    )}
                  </div>

                  {/* Label */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col min-w-0"
                      >
                        <span style={{
                          fontFamily: 'Space Grotesk', fontWeight: isActive ? 700 : 500, fontSize: '13px',
                          color: isActive ? accent : hoveredNav === label ? '#e0e0e0' : '#888',
                          transition: 'color 0.2s',
                          letterSpacing: isActive ? '0.02em' : '0',
                        }}>
                          {label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          );
        })}

        {/* ── DIVIDER ── */}
        <div className="my-3 mx-2" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(204,255,0,0.1), transparent)' }} />

        {/* ── LIVE NOW TICKER ── */}
        <div
          className="mx-1 rounded-xl overflow-hidden cursor-pointer"
          style={{ background: 'rgba(255,59,0,0.06)', border: '1px solid rgba(255,59,0,0.15)' }}
          onClick={() => navigate('/app/events')}
        >
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ borderBottom: '1px solid rgba(255,59,0,0.1)', justifyContent: expanded ? 'flex-start' : 'center' }}
          >
            <LivePulse />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: 'Space Grotesk', fontSize: '8px', fontWeight: 700, color: '#FF3B00', letterSpacing: '0.15em' }}
                >
                  LIVE NOW
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div
                key={tickerIdx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="px-2 py-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span style={{ fontSize: '12px' }}>{currentMatch.sport}</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#bbb', flex: 1, marginLeft: '4px' }} className="truncate">
                    {currentMatch.teams}
                  </span>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: '13px', color: '#CCFF00' }}>
                    {currentMatch.score}
                  </span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '8px', color: '#FF3B00', marginLeft: '4px' }}>
                    {currentMatch.time}
                  </span>
                </div>
              </motion.div>
            )}
            {!expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center p-1.5">
                <Radio size={12} style={{ color: '#FF3B00' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── AUTOSQUAD AI BUTTON ── */}
        <div className="pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app/events/e1/ai-team')}
            className="w-full rounded-xl overflow-hidden relative"
            style={{
              padding: expanded ? '10px 12px' : '10px 0',
              background: 'linear-gradient(135deg, rgba(204,255,0,0.12), rgba(204,255,0,0.04))',
              border: '1px solid rgba(204,255,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            {/* Animated shimmer */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(204,255,0,0.08), transparent)', width: '60%' }}
            />
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative"
              style={{ background: 'rgba(204,255,0,0.2)', border: '1px solid rgba(204,255,0,0.4)', boxShadow: '0 0 12px rgba(204,255,0,0.25)' }}
            >
              <Zap size={15} fill="currentColor" style={{ color: '#CCFF00' }} />
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-lg"
                style={{ background: 'rgba(204,255,0,0.1)' }}
              />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '12px', color: '#CCFF00', letterSpacing: '0.05em' }}>AutoSquad</p>
                  <p style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#888' }}>AI · Build your squad</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      {/* ═══════════════════════ BOTTOM USER SECTION ═══════════════════════ */}
      <div className="relative" style={{ borderTop: '1px solid rgba(204,255,0,0.07)', padding: '12px 8px 10px' }}>
        {/* Ambient glow bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(204,255,0,0.04) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-2.5" style={{ justifyContent: expanded ? 'flex-start' : 'center' }}>
          {/* Avatar */}
          {user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex-shrink-0 cursor-pointer"
              onClick={() => navigate('/app/profile/me')}
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(204,255,0,0.3)' }}>
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#CCFF00] border border-[#0a0a0a]" />
            </motion.div>
          )}

          <AnimatePresence>
            {expanded && user && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                className="flex-1 min-w-0"
              >
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '12px', color: '#fff' }} className="truncate">{user.name}</p>
                <p style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#CCFF00' }} className="truncate capitalize">{user.experienceLevel} · {user.sport}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/app/profile/me')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Settings size={12} style={{ color: '#666' }} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, color: '#FF3B00' }} whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,59,0,0.06)', border: '1px solid rgba(255,59,0,0.15)' }}
                >
                  <LogOut size={12} style={{ color: '#FF3B00' }} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════ EXPAND TOGGLE ═══════════════════════ */}
      <motion.button
        onClick={() => setExpanded(e => !e)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 rounded-full flex items-center justify-center z-20"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)',
          border: '1px solid rgba(204,255,0,0.2)',
          boxShadow: '0 0 12px rgba(0,0,0,0.5)',
        }}
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronRight size={12} style={{ color: '#CCFF00' }} />
        </motion.div>
      </motion.button>
    </motion.aside>
  );
};
