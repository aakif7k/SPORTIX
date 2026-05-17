import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/Navbar';
import { RightPanel } from '../components/layout/RightPanel';

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)' },
};

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--base)' }}>

      {/* ── Global ambient orbs (decorative, fixed) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-left volt orb */}
        <div
          className="absolute animate-pulse-volt"
          style={{
            top: '-10%', left: '-5%',
            width: '45vw', height: '45vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%)',
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
            background: 'linear-gradient(90deg, transparent, rgba(204,255,0,0.15), rgba(0,212,255,0.1), transparent)',
            animation: 'scan 12s linear infinite',
            top: 0,
          }}
        />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-4xl mx-auto px-4 py-4"
            >
              <Outlet />
            </motion.div>
          </main>
          <RightPanel />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
