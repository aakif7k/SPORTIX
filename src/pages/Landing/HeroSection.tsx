import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Play, ArrowRight, Users, Activity, Sparkles, X } from 'lucide-react';

const AthleteCanvas = lazy(() => import('./AthleteCanvas'));

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
});

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#060606] pt-24 pb-16 lg:py-0" id="hero">
      {/* Dynamic Cyber Grid & Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(204,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px' 
        }} 
      />
      <div 
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] pointer-events-none rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.25) 0%, transparent 70%)' }} 
      />
      <div 
        className="absolute bottom-10 left-10 w-[500px] h-[500px] pointer-events-none rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)' }} 
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-6">

        {/* ── LEFT HERO CONTENT ─────────────────────────────────── */}
        <div className="flex-1 max-w-2xl lg:max-w-none lg:w-[55%] flex flex-col items-start text-left">

          {/* Live Status Pill */}
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101010] border border-[#CCFF00]/30 shadow-[0_0_15px_rgba(204,255,0,0.15)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-[#CCFF00] uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} /> NEXT-GEN SPORTS INTELLIGENCE v3.0
            </span>
          </motion.div>

          {/* H1 Headline for SEO */}
          <motion.div {...fadeUp(0.15)} className="mb-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] uppercase">
              Dominate.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] via-[#D7FF72] to-[#00D4FF] filter drop-shadow-[0_0_25px_rgba(204,255,0,0.35)]">
                Connect.
              </span><br />
              Compete.
            </h1>
          </motion.div>

          {/* Sub-headline */}
          <motion.p {...fadeUp(0.3)} className="text-base sm:text-lg text-text-secondary max-w-xl font-sans leading-relaxed mb-8">
            The premiere AI-powered sports platform connecting elite athletes, automating squad matchmaking, event management, and real-time PlayerDNA performance analytics.
          </motion.p>

          {/* Call-to-action buttons */}
          <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.35)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Join SPORTiX Free</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              onClick={() => setShowDemo(true)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-4 bg-[#141414] hover:bg-[#1f1f1f] border border-white/15 text-white font-mono font-bold text-sm uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/30">
                <Play size={10} className="text-[#CCFF00] fill-[#CCFF00] ml-0.5" />
              </div>
              <span>Watch Interactive Demo</span>
            </motion.button>
          </motion.div>

          {/* Social Proof */}
          <motion.div {...fadeUp(0.6)} className="flex items-center gap-4 p-3 rounded-2xl bg-surface/40 border border-border-muted/50 backdrop-blur">
            <div className="flex -space-x-2.5 overflow-hidden">
              {['https://i.pravatar.cc/100?img=33', 'https://i.pravatar.cc/100?img=47', 'https://i.pravatar.cc/100?img=12', 'https://i.pravatar.cc/100?img=60'].map((src, idx) => (
                <img key={idx} src={src} alt="Athlete" className="inline-block h-8 w-8 rounded-full ring-2 ring-[#060606] object-cover" />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Zap key={i} size={11} className="text-[#CCFF00] fill-[#CCFF00]" />
                ))}
                <span className="text-xs font-bold text-white ml-1">4.9/5</span>
              </div>
              <p className="text-[11px] font-mono text-text-muted">Trusted by 2,400+ Elite Athletes & Scouts</p>
            </div>
          </motion.div>

        </div>

        {/* ── RIGHT 3D CANVAS & FLOATING BADGES ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative w-full lg:w-[45%] h-[380px] sm:h-[480px] lg:h-[70vh] flex items-center justify-center"
        >
          {/* Floating Live Badge Top Left */}
          <motion.div 
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-6 left-4 z-20 bg-[#101010]/90 backdrop-blur-md border border-[#CCFF00]/30 rounded-2xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/30">
              <Activity size={18} className="text-[#CCFF00]" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">PlayerDNA Rating</p>
              <p className="text-sm font-mono font-bold text-white">94.8 SSR <span className="text-[#CCFF00] text-xs">Peak</span></p>
            </div>
          </motion.div>

          {/* Floating Squad Badge Bottom Right */}
          <motion.div 
            animate={{ y: [6, -6, 6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-8 right-4 z-20 bg-[#101010]/90 backdrop-blur-md border border-[#00D4FF]/30 rounded-2xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/30">
              <Users size={18} className="text-[#00D4FF]" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">AutoSquad Match</p>
              <p className="text-sm font-mono font-bold text-white">Chemistry: <span className="text-[#00D4FF]">98%</span></p>
            </div>
          </motion.div>

          {/* 3D Athlete Canvas Component */}
          <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-surface/30 backdrop-blur relative shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin" />
              </div>
            }>
              <AthleteCanvas />
            </Suspense>
          </div>
        </motion.div>

      </div>

      {/* Interactive Demo Video Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-3xl bg-[#101010] border border-[#CCFF00]/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-[#CCFF00]" />
                  <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">SPORTiX Platform Demo</span>
                </div>
                <button 
                  onClick={() => setShowDemo(false)} 
                  className="p-1 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-video bg-black flex flex-col items-center justify-center p-6 text-center space-y-4 relative">
                <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] shadow-glow-volt">
                  <Play size={28} className="fill-[#CCFF00] ml-1" />
                </div>
                <div>
                  <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">Interactive Platform Tour</h3>
                  <p className="font-sans text-xs text-text-secondary max-w-md mt-1">
                    Explore live Matchmaking, PlayerDNA radar analysis, ClashHub event hosting, and the HypeZone social feed in action.
                  </p>
                </div>
                <button
                  onClick={() => { setShowDemo(false); navigate('/signup'); }}
                  className="px-6 py-2.5 bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b8e600] transition-colors"
                >
                  Launch App Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
