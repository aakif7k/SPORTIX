import React from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    initials: 'MR', ring: '#CCFF00',
    name: 'Marcus Reid', pos: 'Striker', level: 34,
    badge: 'Striker Elite', badgeColor: '#FBBF24', badgeBg: 'rgba(251,191,36,0.1)',
    quote: 'Found my entire 5-a-side squad through AutoSquad in 3 minutes. We\'ve won 8 matches straight.',
  },
  {
    initials: 'SJ', ring: '#60A5FA',
    name: 'Serena Jax', pos: 'Point Guard', level: 57,
    badge: 'Dominator Prime', badgeColor: '#C084FC', badgeBg: 'rgba(192,132,252,0.1)',
    quote: 'The Pulse system actually made me train more consistently. It\'s addictive in the best way.',
  },
  {
    initials: 'AO', ring: '#4ADE80',
    name: 'Aisha Osei', pos: 'Midfielder', level: 28,
    badge: 'Contender X', badgeColor: '#60A5FA', badgeBg: 'rgba(96,165,250,0.1)',
    quote: 'ClashHub events are insane. Joined a tournament, found lifelong teammates. SPORTiX is different.',
  },
];

const CITIES = ['London', 'Dubai', 'New York', 'Mumbai', 'Accra', 'Tokyo', 'Lagos', 'Barcelona', 'Sydney', 'São Paulo'];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: [0.25, 0, 0.25, 1] as any, delay },
});

export const Testimonials: React.FC = () => (
  <section className="py-24 bg-[#080808] overflow-hidden">
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

      {/* Heading */}
      <motion.div className="text-center mb-16" {...fadeUp()}>
        <h2 className="font-['Bebas_Neue'] text-white" style={{ fontSize: 'clamp(48px,6vw,96px)', lineHeight: 1 }}>
          ATHLETES SPEAK.
        </h2>
        <p className="font-mono text-[14px] text-[#888] mt-4">Real athletes. Real squads. Real results.</p>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={t.name}
            className="relative rounded-[20px] p-6 group cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(204,255,0,0.08)', backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12 }}
            whileHover={{ y: -4, borderColor: 'rgba(204,255,0,0.25)', boxShadow: '0 0 40px rgba(204,255,0,0.08)' }}>

            {/* Big quotation mark */}
            <span className="absolute top-4 right-5 font-['Bebas_Neue'] text-[80px] leading-none text-[#CCFF00] select-none pointer-events-none"
              style={{ opacity: 0.12 }}>"</span>

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <svg key={j} className="w-4 h-4" fill="#CCFF00" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p className="font-mono text-[14px] text-[#B0B0B0] italic leading-[1.8] mb-6">"{t.quote}"</p>

            {/* Athlete info */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-['Barlow_Condensed'] font-bold text-sm flex-shrink-0"
                style={{ background: '#111', border: `2px solid ${t.ring}`, color: '#CCFF00' }}>
                {t.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Barlow_Condensed'] font-semibold text-[15px] text-white">{t.name}</p>
                <p className="font-mono text-[10px] text-[#666]">{t.pos} · Level {t.level}</p>
              </div>
              <span className="font-mono text-[9px] px-2 py-1 rounded-md flex-shrink-0"
                style={{ background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeColor}30` }}>
                {t.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust marquee */}
      <motion.div className="text-center mb-6"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <p className="font-mono text-[12px] text-[#555] mb-4">Trusted by athletes across</p>
      </motion.div>

      <div className="overflow-hidden relative">
        <div className="flex gap-8 animate-marquee" style={{ width: 'max-content' }}>
          {[...CITIES, ...CITIES].map((city, i) => (
            <span key={i} className="font-mono text-[13px] text-[#444] flex-shrink-0 whitespace-nowrap">
              {city}
              {i < CITIES.length * 2 - 1 && <span className="mx-3 text-[#222]">·</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
