import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 } as const,
  transition: { duration: 0.6, ease: [0.25, 0, 0.25, 1] as any, delay },
});

const RANKS = [
  { name: 'Rookie Core',     range: 'L1–10',   color: '#555' },
  { name: 'Challenger Unit', range: 'L11–20',  color: '#4ADE80' },
  { name: 'Contender X',     range: 'L21–30',  color: '#60A5FA' },
  { name: 'Striker Elite',   range: 'L31–40',  color: '#FBBF24' },
  { name: 'Elite Phantom',   range: 'L41–50',  color: '#C084FC', active: true },
  { name: 'Dominator Prime', range: 'L51–60',  color: '#FF6B35' },
  { name: 'Champion Nexus',  range: 'L61–70',  color: '#F87171' },
  { name: 'Titan Core',      range: 'L71–80',  color: '#4DC8E8' },
  { name: 'Apex Velocity',   range: 'L81–90',  color: '#A78BFA' },
  { name: 'Legend Infinite', range: 'L91–100', color: '#CCFF00', glow: true },
];

const BARS = [
  { label: 'Match Performance', pct: 89 },
  { label: 'Consistency',       pct: 76 },
  { label: 'Team Chemistry',    pct: 87 },
  { label: 'Reliability',       pct: 71 },
  { label: 'Activity',          pct: 82 },
];

export const PulseShowcase: React.FC = () => (
  <section className="py-24 bg-[#080808]">
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* ── LEFT TEXT ── */}
        <div>
          <motion.p {...fadeUp(0)} className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-[4px] mb-4">
            The Progression System
          </motion.p>
          <motion.h2 {...fadeUp(0.1)} className="font-['Bebas_Neue'] text-[ffffff] mb-4" style={{ fontSize: 'clamp(48px,6vw,90px)', lineHeight: 1 }}>
            YOUR PULSE.<br />
            <span style={{ color: '#CCFF00', textShadow: '0 0 40px rgba(204,255,0,0.4)' }}>YOUR LEGACY.</span>
          </motion.h2>
          <motion.p {...fadeUp(0.2)} className="font-mono text-[15px] text-[#888] leading-[1.7] mb-10 max-w-md">
            Every login, every match, every assist pushes your SPORTiX Pulse higher. Level up through 100 tiers and beyond into the Prestige ranks.
          </motion.p>

          {/* Rank Roadmap */}
          <motion.div {...fadeUp(0.3)} className="space-y-1.5">
            {RANKS.map((rank, i) => (
              <motion.div key={rank.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: rank.active ? 'rgba(204,255,0,0.06)' : 'transparent',
                  border: rank.active ? '1px solid rgba(204,255,0,0.2)' : '1px solid transparent',
                }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: rank.color, boxShadow: rank.glow ? `0 0 8px ${rank.color}` : 'none' }} />
                <span className="font-['Barlow_Condensed'] font-semibold text-[14px]"
                  style={{ color: rank.active ? '#CCFF00' : '#888' }}>
                  {rank.name}
                </span>
                <span className="font-mono text-[10px] ml-auto" style={{ color: rank.active ? '#CCFF00' : '#444' }}>
                  {rank.range}
                </span>
                {rank.active && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(204,255,0,0.1)', color: '#CCFF00' }}>
                    CURRENT
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT VISUAL ── */}
        <div className="flex flex-col items-center gap-6">
          {/* Semi-circle arc */}
          <motion.div {...fadeUp(0.2)} className="relative">
            <svg viewBox="0 0 320 180" className="w-72 h-40" style={{ overflow: 'visible' }}>
              {/* Track */}
              <path d="M 30 160 A 130 130 0 0 1 290 160" fill="none" stroke="#1A2200" strokeWidth="14" strokeLinecap="round" />
              {/* Fill */}
              <motion.path d="M 30 160 A 130 130 0 0 1 290 160" fill="none" stroke="#CCFF00" strokeWidth="14" strokeLinecap="round"
                strokeDasharray="408.4"
                initial={{ strokeDashoffset: 408.4 }}
                whileInView={{ strokeDashoffset: 408.4 * 0.27 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                style={{ filter: 'drop-shadow(0 0 10px #CCFF00)' }}
              />
              {/* Center text */}
              <text x="160" y="90" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" fill="#666" letterSpacing="2">LEVEL 41</text>
              <text x="160" y="142" textAnchor="middle">
                <tspan fontFamily="Bebas Neue" fontSize="64" fill="#CCFF00">634</tspan>
                <tspan fontFamily="Bebas Neue" fontSize="24" fill="#444" dx="6">/ 700</tspan>
              </text>
              <text x="160" y="168" textAnchor="middle" fontFamily="DM Mono" fontSize="10" fill="#888" letterSpacing="1">ELITE PHANTOM</text>
            </svg>
          </motion.div>

          {/* Category bars */}
          <motion.div {...fadeUp(0.4)} className="w-full max-w-sm space-y-3">
            {BARS.map((bar, i) => (
              <div key={bar.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[11px] text-[#888]">{bar.label}</span>
                  <span className="font-mono text-[11px] text-[#CCFF00]">{bar.pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A2200' }}>
                  <motion.div className="h-full rounded-full" style={{ background: '#CCFF00' }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${bar.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 + i * 0.1 }} />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Prestige preview */}
          <motion.div {...fadeUp(0.5)} className="w-full max-w-sm p-4 rounded-2xl relative overflow-hidden"
            style={{ background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.15)' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.05), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' }}>
                🔒
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Next Prestige →</p>
                <p className="font-['Bebas_Neue'] text-[22px] text-[#FFD700]">GRANDMASTER X</p>
                <p className="font-mono text-[10px] text-[#666]">Level 100 Required</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);
