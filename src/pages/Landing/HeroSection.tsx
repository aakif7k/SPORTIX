import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AthleteCanvas = lazy(() => import('./AthleteCanvas'));

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as any, delay },
});

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = React.useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#080808] pt-[72px]">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(204,255,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(204,255,0,0.025) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Radial gradient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(204,255,0,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-0 py-10 lg:py-0">

        {/* ── LEFT TEXT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 max-w-2xl lg:max-w-none lg:w-[55%] flex flex-col">

          {/* Eyebrow */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-4 mb-6">
            <div className="w-10 h-px bg-[#CCFF00]" />
            <span className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-[5px]">
              The Future of Sports Is Here
            </span>
          </motion.div>

          {/* Hero headline */}
          <div className="mb-6 overflow-hidden">
            {['DOMINATE', 'CONNECT', 'COMPETE'].map((word, i) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.15 }}
              >
                <span
                  className="block font-['Bebas_Neue'] leading-[0.9]"
                  style={{
                    fontSize: 'clamp(72px,9vw,150px)',
                    color: i === 1 ? '#CCFF00' : '#FFFFFF',
                    textShadow: i === 1 ? '0 0 60px rgba(204,255,0,0.5)' : 'none',
                  }}
                >
                  {word}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Sub-headline */}
          <motion.p {...fadeUp(0.6)}
            className="font-mono text-[17px] text-[#888] max-w-[480px] leading-[1.7] mb-8">
            The AI-powered sports ecosystem where elite athletes build careers, find squads, and dominate competitions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeUp(0.8)} className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto h-14 px-8 rounded-[12px] font-['Barlow_Condensed'] font-semibold text-[18px] text-[#080808] bg-[#CCFF00] transition-all"
              style={{ boxShadow: '0 0 0 rgba(204,255,0,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(204,255,0,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 rgba(204,255,0,0.4)')}
            >
              Join SPORTiX →
            </motion.button>

            <span className="hidden sm:inline font-mono text-[#444] text-sm">or</span>

            <motion.button
              onClick={() => setShowDemo(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto h-14 px-8 rounded-[12px] font-['Barlow_Condensed'] font-semibold text-[18px] text-white border transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(204,255,0,0.4)'; (e.currentTarget as HTMLElement).style.color = '#CCFF00'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            >
              ▶ Watch Demo
            </motion.button>
          </motion.div>

          {/* Social proof */}
          <motion.div {...fadeUp(1.0)} className="flex items-center gap-4">
            <div className="flex">
              {['MR', 'SJ', 'AO', 'KN', 'DV'].map((initials, i) => (
                <div key={initials}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-['Barlow_Condensed'] font-bold text-[12px] border-2 border-[#080808]"
                  style={{
                    background: ['#1A2200', '#0D1A2B', '#0D2200', '#1A0D2B', '#2B1A0D'][i],
                    color: '#CCFF00',
                    marginLeft: i > 0 ? '-10px' : '0',
                    zIndex: 5 - i,
                    position: 'relative',
                  }}>
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5" fill="#CCFF00" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="font-mono text-[12px] text-[#888]">2,400+ athletes already training</p>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT 3D PANEL ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="relative w-full lg:w-[45%] h-[400px] sm:h-[500px] lg:h-[85vh] flex-shrink-0"
        >
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin" />
            </div>
          }>
            <AthleteCanvas />
          </Suspense>
        </motion.div>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setShowDemo(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden relative"
            style={{ background: '#111', border: '1px solid rgba(204,255,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(204,255,0,0.1)', border: '2px solid rgba(204,255,0,0.3)' }}>
                <svg className="w-8 h-8 ml-1" fill="#CCFF00" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <p className="font-['Bebas_Neue'] text-3xl text-white">SPORTIX DEMO</p>
              <p className="font-mono text-sm text-[#888]">Demo video coming soon</p>
              <button onClick={() => setShowDemo(false)} className="mt-4 font-mono text-[12px] text-[#666] hover:text-[#CCFF00] transition-colors">
                [ CLOSE ]
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};
