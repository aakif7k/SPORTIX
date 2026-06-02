import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TERMINAL_LINES = [
  '> Scanning 1,284 athlete profiles...',
  '> Analyzing SPORTiX Level compatibility...',
  '> Checking chemistry signals...',
  '> Evaluating position balance...',
  '> Generating squad structure...',
  '> Squad ready. Compatibility: 94%',
];

const PLAYERS = [
  { initials: 'MR', name: 'Marcus Reid',     pos: 'ST',  level: 34, color: '#1A2200' },
  { initials: 'AO', name: 'Aisha Osei',      pos: 'CM',  level: 28, color: '#0D1A2B' },
  { initials: 'ZH', name: 'Zaid Al-Hassan',  pos: 'GK',  level: 31, color: '#1A0D2B' },
  { initials: 'SJ', name: 'Serena Jax',      pos: 'LW',  level: 57, color: '#2B1A00' },
  { initials: 'DC', name: 'Devon Clarke',    pos: 'CB',  level: 22, color: '#0D2B1A' },
];

const PILLS = [
  '⚡ 3 Generations Per Day',
  '📍 Location-Based Matching',
  '🏆 Skill-Balanced Squads',
];

export const AutoSquadShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [activeLines, setActiveLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [showSquad, setShowSquad] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inViewRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    if (inViewRef.current) obs.observe(inViewRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const loop = () => {
      setActiveLines(0);
      setProgress(0);
      setShowSquad(false);

      let line = 0;
      intervalRef.current = setInterval(() => {
        line++;
        setActiveLines(line);
        if (line >= TERMINAL_LINES.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setShowSquad(true), 300);
        }
      }, 900);

      const startTime = Date.now();
      const duration = 6000;
      progressRef.current = setInterval(() => {
        const pct = Math.min(100, ((Date.now() - startTime) / duration) * 100);
        setProgress(pct);
        if (pct >= 100) {
          clearInterval(progressRef.current!);
          setTimeout(loop, 1500);
        }
      }, 40);
    };
    loop();
    return () => {
      clearInterval(intervalRef.current!);
      clearInterval(progressRef.current!);
    };
  }, [inView]);

  return (
    <section className="py-24 relative overflow-hidden" ref={inViewRef}
      style={{
        background: '#0C0C0C',
        backgroundImage: 'linear-gradient(rgba(204,255,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(204,255,0,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* Heading */}
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-[4px] mb-4">AI-Powered Matchmaking</p>
          <h2 className="font-['Bebas_Neue'] text-white" style={{ fontSize: 'clamp(48px,6vw,96px)', lineHeight: 1 }}>
            YOUR SQUAD.<br />
            <span style={{ color: '#CCFF00', textShadow: '0 0 40px rgba(204,255,0,0.3)' }}>BUILT BY AI.</span>
          </h2>
          <p className="font-mono text-[14px] text-[#888] mt-4 max-w-md mx-auto leading-relaxed">
            Tell us your sport and skill level. Pulse Engine finds the perfect 11.
          </p>
        </motion.div>

        {/* Terminal Card */}
        <motion.div className="max-w-[600px] mx-auto rounded-2xl overflow-hidden mb-8"
          style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(204,255,0,0.15)', backdropFilter: 'blur(20px)' }}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>

          {/* Terminal header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'rgba(204,255,0,0.08)' }}>
            <div className="flex gap-1.5">
              {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              <span className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-widest">Pulse Engine Active</span>
            </div>
          </div>

          {/* Terminal body */}
          <div className="p-6 min-h-[200px] font-mono text-[13px]">
            {TERMINAL_LINES.map((line, i) => (
              <div key={i} className="transition-all duration-300 mb-2"
                style={{ opacity: i < activeLines ? 1 : 0, color: i === activeLines - 1 ? '#CCFF00' : '#3A3A3A' }}>
                {line}
                {i === activeLines - 1 && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="px-6 pb-5">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A2200' }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #CCFF00aa, #CCFF00)', boxShadow: '0 0 8px #CCFF0080' }} />
            </div>
          </div>
        </motion.div>

        {/* Squad Preview */}
        <AnimatePresence>
          {showSquad && (
            <motion.div className="max-w-[600px] mx-auto"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="rounded-2xl p-6"
                style={{ background: 'rgba(204,255,0,0.03)', border: '1px solid rgba(204,255,0,0.12)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-['Bebas_Neue'] text-[28px] text-white">IRON PULSE FC</h3>
                  <span className="font-mono text-[11px] px-3 py-1 rounded-full"
                    style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)', color: '#CCFF00' }}>
                    Chemistry: 94%
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none mb-5">
                  {PLAYERS.map((p, i) => (
                    <motion.div key={p.initials} className="flex-shrink-0 flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-['Barlow_Condensed'] font-bold text-sm"
                        style={{ background: p.color, border: '1px solid rgba(204,255,0,0.25)', color: '#CCFF00' }}>
                        {p.initials}
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-[9px] text-[#888] truncate max-w-[60px]">{p.name.split(' ')[0]}</p>
                        <p className="font-mono text-[9px] text-[#CCFF00]">{p.pos}</p>
                        <p className="font-mono text-[9px] text-[#555]">Lv{p.level}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  onClick={() => navigate('/signup')}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-12 rounded-xl font-['Barlow_Condensed'] font-semibold text-[16px] text-[#080808] bg-[#CCFF00]">
                  Accept Squad →
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pills */}
        <motion.div className="flex flex-wrap justify-center gap-3 mt-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}>
          {PILLS.map(pill => (
            <div key={pill} className="px-4 py-2 rounded-full font-mono text-[12px]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(204,255,0,0.15)', color: '#B0B0B0' }}>
              {pill}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
