import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/Navbar';
import { RightPanel } from '../components/layout/RightPanel';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMessagesPage = location.pathname.startsWith('/app/messages');
  
  const { showLogoutConfirm, setShowLogoutConfirm } = useAuthStore();
  const { logout } = useAuth();

  const handleConfirmLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate('/login');
    } catch {
      toast.error("Failed to log out. Try again.");
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLogoutConfirm(false);
      }
    };
    if (showLogoutConfirm) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm, setShowLogoutConfirm]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Global ambient orbs (decorative, fixed) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-left volt orb */}
        <div
          className="absolute animate-pulse-volt"
          style={{
            top: '-10%', left: '-5%',
            width: '45vw', height: '45vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--volt-06) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-right cyan orb */}
        <div
          className="absolute animate-pulse-cyan"
          style={{
            bottom: '-15%', right: '-5%',
            width: '40vw', height: '40vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)',
          }}
        />
        {/* Center plasma orb */}
        <div
          className="absolute animate-pulse-plasma"
          style={{
            top: '40%', left: '40%',
            width: '30vw', height: '30vw',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(191,95,255,0.03) 0%, transparent 70%)',
          }}
        />
        {/* Animated scan line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--volt-15), rgba(0,212,255,0.1), transparent)',
            animation: 'scan 12s linear infinite',
            top: 0,
          }}
        />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <main className={`flex-1 overflow-hidden ${isMessagesPage ? 'pb-[72px] md:pb-0' : 'overflow-y-auto pb-20 md:pb-4'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className={isMessagesPage ? "w-full h-full" : "max-w-4xl mx-auto px-4 py-4"}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          {!isMessagesPage && <RightPanel />}
        </div>
      </div>

      <BottomNav />

      {/* Global Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm p-7 rounded-[24px] border border-border bg-surface shadow-modal z-10 flex flex-col items-center gap-4 glass"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <LogOut size={22} />
              </div>
              <h2 className="font-display text-[32px] tracking-wider text-text-primary uppercase leading-none">LOG OUT?</h2>
              <p className="font-mono text-xs text-text-muted text-center leading-relaxed">
                You'll need to sign in again to access your SPORTiX account.
              </p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={handleConfirmLogout}
                  className="w-full py-3 bg-[#F87171] hover:bg-[#DC2626] text-white rounded-xl font-condensed font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Log Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 border border-border-default hover:bg-bg-hover text-text-primary rounded-xl font-condensed font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
