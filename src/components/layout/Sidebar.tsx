import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Calendar, Search, MessageCircle, User, Zap,
  LogOut, Settings, Flame, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/app/feed',          icon: Home,          label: 'HypeZone',  accent: '#CCFF00', badge: null },
  { to: '/app/events',        icon: Calendar,      label: 'ClashHub',  accent: '#FF6B00', badge: '3' },
  { to: '/app/discover',      icon: Search,        label: 'Discover',  accent: '#00D4FF', badge: null },
  { to: '/pulse',             icon: Zap,           label: 'Pulse',     accent: '#CCFF00', badge: null },
  { to: '/app/messages',      icon: MessageCircle, label: 'Huddle',    accent: '#A855F7', badge: null },
  { to: '/app/profile/me',    icon: User,          label: 'PlayerDNA', accent: '#00D4FF', badge: null },
];

interface SidebarProps { className?: string; }

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [expanded, setExpanded] = useState(false);
  const { user, setShowLogoutConfirm } = useAuthStore();
  const navigate = useNavigate();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        width: expanded ? '240px' : '68px',
        transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border)',
        boxShadow: expanded ? '10px 0 30px rgba(0, 0, 0, 0.15)' : 'none',
      }}
    >
      {/* ── Ambient Top Cyber Glow ── */}
      <div
        className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204, 255, 0, 0.08) 0%, transparent 75%)' }}
      />
      
      {/* ── Subtle Background Grid Lines ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(204, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(204, 255, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ═══════════════════════ LOGO HEADER ═══════════════════════ */}
      <div className="relative flex items-center gap-3 px-4 py-4 min-h-[72px] border-b border-border-muted overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/app/feed')}
          className="flex-shrink-0 w-10 h-10 rounded-2xl overflow-hidden cursor-pointer relative border border-[#CCFF00]/40 shadow-[0_0_20px_rgba(204,255,0,0.3)] bg-surface flex items-center justify-center"
        >
          <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#CCFF00] ring-2 ring-surface" />
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
          <span className="font-sans text-xl font-black text-text-primary tracking-widest leading-none flex items-center gap-1">
            SPORT<span className="text-[#CCFF00]">IX</span>
          </span>
          <span className="font-mono text-[9px] text-[#CCFF00] font-bold tracking-wider mt-0.5 flex items-center gap-1">
            <Flame size={10} className="text-[#CCFF00] animate-pulse" /> ATHLETE NETWORK
          </span>
        </div>
      </div>

      {/* ═══════════════════════ NAVIGATION ITEMS ═══════════════════════ */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto scrollbar-none">
        <p
          className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 transition-opacity duration-200"
          style={{ opacity: expanded ? 1 : 0 }}
        >
          NAVIGATION
        </p>

        {NAV_ITEMS.map(({ to, icon: Icon, label, accent, badge }) => {
          return (
            <NavLink key={to} to={to} className="block text-none">
              {({ isActive }) => (
                <div
                  className={`relative flex items-center gap-3 cursor-pointer rounded-2xl py-2.5 px-2.5 transition-all duration-200 group ${
                    isActive 
                      ? 'bg-elevated border border-border-muted shadow-md' 
                      : 'hover:bg-elevated/50 border border-transparent'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                      style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
                    />
                  )}

                  {/* Icon Box */}
                  <div
                    className="relative flex-shrink-0 flex items-center justify-center rounded-xl w-9 h-9 transition-all duration-200"
                    style={{
                      background: isActive ? `${accent}25` : 'var(--bg-elevated)',
                      border: `1px solid ${isActive ? `${accent}66` : 'var(--border)'}`,
                      boxShadow: isActive ? `0 0 16px ${accent}33` : 'none',
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? accent : 'var(--text-secondary)' }} />
                    {badge && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[15px] h-4 rounded-full flex items-center justify-center bg-[#FF3B00] text-white text-[9px] font-bold font-mono px-1 shadow-[0_0_8px_rgba(255,59,0,0.8)]"
                      >
                        {badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
                    style={{
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'opacity 160ms ease, transform 160ms ease',
                      transitionDelay: expanded ? '60ms' : '0ms',
                      whiteSpace: 'nowrap',
                      pointerEvents: expanded ? 'auto' : 'none',
                    }}
                  >
                    <span 
                      className={`font-sans font-bold text-sm tracking-wide transition-colors ${isActive ? 'text-text-primary font-black' : 'text-text-secondary group-hover:text-text-primary'}`}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <ChevronRight size={14} style={{ color: accent }} />
                    )}
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ═══════════════════════ USER PROFILE FOOTER ═══════════════════════ */}
      <div className="mt-auto flex-shrink-0 relative border-t border-border-muted p-3">
        {user && (
          <div className="relative">
            
            {/* Collapsed Avatar Only */}
            <div
              className="w-full flex items-center justify-center py-2"
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
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() => navigate('/app/profile/me')}
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[#CCFF00]/40 shadow-[0_0_12px_rgba(204,255,0,0.2)] bg-elevated">
                  <img 
                    src={user?.avatar || (user as any)?.avatar_url || 'https://i.pravatar.cc/150?img=33'} 
                    alt={user?.name || 'Athlete'} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#CCFF00] ring-2 ring-surface flex items-center justify-center text-[8px] font-black text-black">
                  ✓
                </span>
              </div>
            </div>

            {/* Expanded Full Profile Card */}
            <div
              className="rounded-2xl overflow-hidden bg-surface border border-border-muted p-3 space-y-3 shadow-xl transition-all duration-200"
              style={{
                opacity: expanded ? 1 : 0,
                transform: expanded ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
                transition: 'opacity 200ms ease, transform 200ms ease',
                transitionDelay: expanded ? '60ms' : '0ms',
                pointerEvents: expanded ? 'auto' : 'none',
              }}
            >
              {/* Profile Header */}
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/app/profile/me')}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user?.avatar || (user as any)?.avatar_url || 'https://i.pravatar.cc/150?img=33'} 
                    alt={user?.name || 'Athlete'} 
                    className="w-10 h-10 rounded-2xl object-cover border border-[#CCFF00]/50 shadow-md bg-elevated"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#CCFF00] ring-2 ring-surface flex items-center justify-center text-[8px] font-black text-black">
                    ✓
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans font-bold text-sm text-text-primary truncate leading-snug group-hover:text-[#CCFF00] transition-colors">
                    {user?.name || 'Athlete'}
                  </h3>
                  <div className="flex items-center gap-1 font-mono text-[9px] text-[#CCFF00]">
                    <span>#{(user?.sport || 'FOOTBALL').toUpperCase()}</span>
                    <span>•</span>
                    <span className="text-text-muted">SSR: 94.8</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-muted">
                <button
                  onClick={() => navigate('/app/settings')}
                  className="py-2 rounded-xl bg-elevated border border-border-muted hover:border-[#CCFF00]/40 font-mono text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Settings size={12} /> Edit
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
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
