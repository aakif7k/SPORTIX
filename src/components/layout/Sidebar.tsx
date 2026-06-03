import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Calendar, Search, MessageCircle, Bell, User, Zap,
  LogOut, Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/app/feed',          icon: Home,          label: 'HypeZone',  accent: 'var(--volt)',  badge: null },
  { to: '/app/events',        icon: Calendar,      label: 'ClashHub',  accent: '#FF6B00',      badge: '3' },
  { to: '/app/discover',      icon: Search,        label: 'Discover',  accent: '#00D4FF',      badge: null },
  { to: '/pulse',             icon: Zap,           label: 'Pulse',     accent: 'var(--volt)',  badge: null },
  { to: '/app/messages',      icon: MessageCircle, label: 'Huddle',    accent: '#A855F7',      badge: null },
  { to: '/app/notifications', icon: Bell,          label: 'Buzz',      accent: '#FF3B00',      badge: null },
  { to: '/app/profile/me',    icon: User,          label: 'PlayerDNA', accent: 'var(--volt)',  badge: null },
];

interface SidebarProps { className?: string; }

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [expanded, setExpanded] = useState(false);
  const { user, setShowLogoutConfirm } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced hover handlers to prevent jitter on fast mouse moves
  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setExpanded(true), 40);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setExpanded(false), 60);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-expanded={expanded}
      className={`sidebar-rail hidden md:flex flex-col h-screen sticky top-0 z-40 flex-shrink-0 overflow-visible ${className}`}
      style={{
        width: expanded ? '240px' : '64px',
        transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width',
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* ── Ambient glow top ── */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--volt-08) 0%, transparent 70%)' }}
      />
      {/* ── Subtle grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(var(--volt-04) 1px, transparent 1px), linear-gradient(90deg, var(--volt-04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ═══════════════════════ LOGO ═══════════════════════ */}
      <div className="relative flex items-center gap-3 px-4 py-4 min-h-[68px] overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/app/feed')}
          className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden cursor-pointer relative"
          style={{ boxShadow: '0 0 20px var(--volt-35)' }}
        >
          <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
        </motion.div>

        <div
          className="flex flex-col leading-none overflow-hidden"
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'opacity 180ms ease, transform 180ms ease',
            transitionDelay: expanded ? '60ms' : '0ms',
            pointerEvents: expanded ? 'auto' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '22px', color: 'var(--volt)', letterSpacing: '0.15em', lineHeight: 1 }}>
            SPORTIX
          </span>
          <span style={{ fontFamily: 'DM Mono', fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
            PRO NETWORK
          </span>
        </div>
      </div>

      {/* ═══════════════════════ NAV ITEMS ═══════════════════════ */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <p
          style={{
            fontFamily: 'Space Grotesk', fontSize: '8px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)',
            paddingLeft: '12px', marginBottom: '6px', marginTop: '4px',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 160ms ease',
            transitionDelay: expanded ? '50ms' : '0ms',
          }}
        >
          Navigate
        </p>

        {NAV_ITEMS.map(({ to, icon: Icon, label, accent, badge }) => {
          const isBuzz = label === 'Buzz';
          const badgeCount = isBuzz ? unreadCount : (badge ? parseInt(badge) : 0);

          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div
                  className="relative flex items-center gap-3 cursor-pointer rounded-xl sidebar-nav-item"
                  style={{
                    padding: '9px 0',
                    justifyContent: 'flex-start',
                    transition: 'background 0.18s ease',
                  }}
                  data-active={isActive}
                  data-accent={accent}
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
                    className="relative flex-shrink-0 flex items-center justify-center rounded-lg w-8 h-8"
                    style={{
                      marginLeft: '8px',
                      background: isActive ? `${accent}22` : 'var(--bg-hover, rgba(255,255,255,0.04))',
                      border: `1px solid ${isActive ? `${accent}44` : 'var(--border)'}`,
                      boxShadow: isActive ? `0 0 12px ${accent}30` : 'none',
                      transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                    }}
                  >
                    <Icon size={15} style={{ color: isActive ? accent : 'var(--text-muted)', transition: 'color 0.18s ease' }} />
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
                  <div
                    className="flex flex-col min-w-0 overflow-hidden"
                    style={{
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
                      transition: 'opacity 160ms ease, transform 160ms ease',
                      transitionDelay: expanded ? '70ms' : '0ms',
                      whiteSpace: 'nowrap',
                      pointerEvents: expanded ? 'auto' : 'none',
                    }}
                  >
                    <span style={{
                      fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: '14px',
                      color: isActive ? accent : 'var(--text-secondary, var(--text-muted))',
                      transition: 'color 0.18s ease',
                      letterSpacing: '0.5px',
                    }}>
                      {label}
                    </span>
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}

      </nav>

      {/* ═══════════════════════ BOTTOM USER SECTION ═══════════════════════ */}
      <div className="mt-auto flex-shrink-0 relative" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, var(--volt-04) 0%, transparent 70%)' }} />

        {user && (
          <div className="w-full relative" style={{ paddingBottom: '0' }}>


            {/* Collapsed: avatar only */}
            <div
              className="w-full flex items-center justify-center py-3"
              style={{
                opacity: expanded ? 0 : 1,
                transform: expanded ? 'scale(0.85)' : 'scale(1)',
                transition: 'opacity 180ms ease, transform 180ms ease',
                pointerEvents: expanded ? 'none' : 'auto',
                position: expanded ? 'absolute' : 'relative',
                top: 0,
              }}
            >
              <div
                className="relative flex-shrink-0 cursor-pointer"
                onClick={() => navigate('/app/profile/me')}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '1px solid var(--volt-30)' }}>
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-0 -right-0.5 w-3 h-3 rounded-full bg-volt" style={{ border: '2px solid var(--bg-elevated)' }} />
              </div>
            </div>

            {/* Expanded: full profile card */}
            <div
              className="mx-3 rounded-[16px] overflow-hidden flex flex-col items-center relative group/profile"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                opacity: expanded ? 1 : 0,
                transform: expanded ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
                transition: 'opacity 200ms ease, transform 200ms ease',
                transitionDelay: expanded ? '60ms' : '0ms',
                pointerEvents: expanded ? 'auto' : 'none',
                marginTop: expanded ? '6px' : '0',
                marginBottom: expanded ? '6px' : '0',
              }}
            >
              <div className="absolute inset-0 pointer-events-none rounded-[16px] border border-volt opacity-0 group-hover/profile:opacity-30 transition-opacity duration-300 z-20" />

              {/* Cover strip */}
              <div className="w-full h-[28px] relative">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <defs>
                    <pattern id="sport-pattern-bottom" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="var(--volt-10)" strokeWidth="1"/>
                    </pattern>
                    <linearGradient id="cover-grad-bottom" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#081A00" />
                      <stop offset="100%" stopColor="#050508" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cover-grad-bottom)"/>
                  <rect width="100%" height="100%" fill="url(#sport-pattern-bottom)"/>
                </svg>
              </div>

              {/* Avatar */}
              <div className="relative -mt-[20px] mb-2 z-10">
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden" style={{ border: '2px solid var(--volt)', outline: '2px solid var(--bg-elevated)', outlineOffset: '-2px', backgroundColor: 'var(--bg-elevated)' }}>
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                </div>
              </div>

              {/* Name */}
              <h3 className="font-condensed text-[16px] font-bold mb-1 leading-none truncate w-full text-center px-2" style={{ color: 'var(--text-primary)' }}>{user.name}</h3>
              <div className="mb-3 px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <span className="font-mono text-[9px] font-bold text-accent">#{user.sport.toUpperCase()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <button onClick={() => navigate('/app/settings')} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-wider hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                  <Settings size={12} /> Edit
                </button>
                <button onClick={() => setShowLogoutConfirm(true)} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#FF3B00] hover:bg-[#FF3B00]/10 transition-colors">
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
};
