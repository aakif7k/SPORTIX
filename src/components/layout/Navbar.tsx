import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Zap, Home, Calendar, MessageCircle, User } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-500 ${scrolled ? 'premium-nav' : ''}`}
    >
      <div className="flex items-center h-[64px] px-6 gap-4 max-w-[1440px] mx-auto">
        {/* Logo - shown on md+ when sidebar is present (sidebar handles logo there), hidden on mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#CCFF00,#88AA00)', boxShadow: '0 0 16px rgba(204,255,0,0.4)' }}
          >
            <Zap size={15} className="text-black" fill="black" />
          </div>
          <span className="font-display text-xl tracking-widest" style={{ color: '#CCFF00', textShadow: '0 0 20px rgba(204,255,0,0.5)' }}>SPORTIX</span>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => navigate('/app/discover')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(204,255,0,0.1)',
            fontFamily: 'DM Mono',
            fontSize: '12px',
            color: '#6E6E8A',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)'; (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(204,255,0,0.1)'; (e.currentTarget as HTMLElement).style.color = '#6E6E8A'; }}
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
          <Bell size={17} style={{ color: '#6E6E8A' }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold"
              style={{ background: '#FF3B00', fontSize: '8px', fontFamily: 'DM Mono', color: '#fff', padding: '0 3px', boxShadow: '0 0 8px rgba(255,59,0,0.7)' }}
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
      </div>
    </header>
  );
};

// ─── BOTTOM NAV (mobile) ───────────────────────────────────────────────────
const BOT_ITEMS = [
  { to: '/app/feed', icon: Home, label: 'Home' },
  { to: '/app/events', icon: Calendar, label: 'Events' },
  { to: '/app/messages', icon: MessageCircle, label: 'Chat' },
  { to: '/app/profile/me', icon: User, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom premium-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {BOT_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent' : 'text-text-secondary'}`}>
                <Icon size={20} />
                <span className="text-[10px] font-condensed">{label}</span>
                {isActive && <div className="w-4 h-0.5 bg-accent rounded-full shadow-glow-volt-sm" />}
              </div>
            )}
          </NavLink>
        ))}

        {/* AI+ center button */}
        <motion.button
          whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/pulse')}
          className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-glow-volt -mt-5 neuo"
        >
          <Zap size={24} className="text-black" fill="black" />
        </motion.button>

        <NavLink to="/app/messages">
          {({ isActive }) => (
            <div className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent' : 'text-text-secondary'}`}>
              <MessageCircle size={20} />
              <span className="text-[10px] font-condensed">Chat</span>
              {isActive && <div className="w-4 h-0.5 bg-accent rounded-full shadow-glow-volt-sm" />}
            </div>
          )}
        </NavLink>
        <NavLink to="/app/profile/me">
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent' : 'text-text-secondary'}`}>
              <User size={20} />
              <span className="text-[10px] font-condensed">Profile</span>
              {isActive && <div className="w-4 h-0.5 bg-accent rounded-full shadow-glow-volt-sm" />}
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
