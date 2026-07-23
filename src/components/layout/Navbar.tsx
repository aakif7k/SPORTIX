import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Home, Calendar, MessageCircle, User } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { unreadCount } = useNotificationStore();
  const { user, setShowLogoutConfirm } = useAuthStore();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-500 ${scrolled ? 'premium-nav' : ''}`}
    >
      <div className="flex items-center h-[64px] px-6 gap-4 max-w-[1440px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div
            className="w-8 h-8 rounded-xl overflow-hidden"
            style={{ boxShadow: '0 0 16px var(--volt-40)' }}
          >
            <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-xl tracking-widest" style={{ color: 'var(--volt)', textShadow: '0 0 20px var(--volt-50)' }}>SPORTIX</span>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => navigate('/app/discover')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--volt-10)',
            fontFamily: 'Urbanist, sans-serif',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)'; (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--volt-10)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <Search size={13} />
          <span>Search athletes, events...</span>
          <span
            className="ml-4 text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
          >⌘K</span>
        </button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/app/notifications')}
          className="relative p-2 rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Bell size={17} style={{ color: 'var(--text-muted)' }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold"
              style={{ background: '#FF3B00', fontSize: '8px', fontFamily: 'Urbanist, sans-serif', color: '#fff', padding: '0 3px', boxShadow: '0 0 8px rgba(255,59,0,0.7)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        {/* Settings Route */}
        <motion.button
          whileHover={{ rotate: 90 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={() => navigate('/app/settings')}
          className="p-2 rounded-xl text-text-muted hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </motion.button>

        {/* User Avatar Dropdown (Navbar - Location 3) */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(o => !o); }}
              className="w-9 h-9 rounded-xl overflow-hidden border border-border cursor-pointer flex items-center justify-center bg-elevated"
            >
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </motion.button>
            
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 py-1.5 w-[180px] rounded-[14px] border border-border bg-surface/90 backdrop-blur-md shadow-modal z-50 flex flex-col"
                >
                  <button
                    onClick={() => { setDropdownOpen(false); navigate(`/app/profile/me`); }}
                    className="w-full h-11 px-4 flex items-center hover:bg-bg-hover text-left font-mono text-[13px] text-text-primary transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/app/settings'); }}
                    className="w-full h-11 px-4 flex items-center hover:bg-bg-hover text-left font-mono text-[13px] text-text-primary transition-colors"
                  >
                    Settings
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                    className="w-full h-11 px-4 flex items-center hover:bg-[#F87171]/5 text-left font-mono text-[13px] text-[#F87171] transition-colors"
                  >
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

// ─── BOTTOM NAV (mobile) ───────────────────────────────────────────────────
export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom premium-nav border-t border-border/10">
      <div className="flex items-center justify-around px-2 py-2">
        
        {/* HypeZone */}
        <NavLink to="/app/feed">
          {({ isActive }) => (
            <div 
              className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all"
              style={{ color: isActive ? 'var(--volt)' : 'var(--text-muted)' }}
            >
              <Home size={22} />
              {isActive && <div className="absolute bottom-1 w-4 h-0.5 bg-accent rounded-full shadow-glow-volt-sm" />}
            </div>
          )}
        </NavLink>

        {/* ClashHub */}
        <NavLink to="/app/events">
          {({ isActive }) => (
            <div 
              className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all"
              style={{ color: isActive ? '#FF6B00' : 'var(--text-muted)' }}
            >
              <Calendar size={22} />
              {isActive && <div className="absolute bottom-1 w-4 h-0.5 bg-[#FF6B00] rounded-full shadow-glow-volt-sm" />}
            </div>
          )}
        </NavLink>

        {/* AI+ Center Pulse Button */}
        <motion.button
          whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/pulse')}
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-glow-volt -mt-5 border border-black/10"
          style={{ background: 'var(--volt)', boxShadow: '0 0 18px var(--volt-40)' }}
          aria-label="Pulse Matchmaking"
        >
          <span className="font-display text-2xl font-black text-black select-none leading-none">S</span>
        </motion.button>

        {/* Buzz (Notifications) */}
        <NavLink to="/app/notifications">
          {({ isActive }) => (
            <div 
              className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all"
              style={{ color: isActive ? '#FF3B00' : 'var(--text-muted)' }}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF3B00] text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-[0_0_8px_rgba(255,59,0,0.8)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {isActive && <div className="absolute bottom-1 w-4 h-0.5 bg-[#FF3B00] rounded-full shadow-[0_0_8px_rgba(255,59,0,0.8)]" />}
            </div>
          )}
        </NavLink>

        {/* PlayerDNA */}
        <NavLink to="/app/profile/me">
          {({ isActive }) => (
            <div 
              className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all"
              style={{ color: isActive ? 'var(--volt)' : 'var(--text-muted)' }}
            >
              <User size={22} />
              {isActive && <div className="absolute bottom-1 w-4 h-0.5 bg-accent rounded-full shadow-glow-volt-sm" />}
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
