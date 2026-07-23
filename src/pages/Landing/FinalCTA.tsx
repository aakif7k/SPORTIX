import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FLOAT_BADGES = [
  { label: '⚡ Level 57',       style: { top: '15%', left: '5%' },  delay: 0 },
  { label: '🏆 94% Chemistry',  style: { top: '15%', right: '5%' }, delay: 1 },
  { label: '847 Pulse Score',   style: { bottom: '20%', left: '5%' }, delay: 2 },
  { label: '✓ Squad Ready',     style: { bottom: '20%', right: '5%' }, delay: 1.5 },
];

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-36 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(204,255,0,0.06) 0%, #080808 70%)' }}>

      {/* Decorative floating badges */}
      {FLOAT_BADGES.map((b, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ delay: b.delay * 0.3, duration: 0.5 }}
          className="absolute hidden lg:flex items-center px-4 py-2 rounded-xl font-mono text-[12px]"
          style={{
            ...b.style,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(204,255,0,0.12)',
            color: '#B0B0B0', animation: `float 3s ease-in-out ${b.delay}s infinite`,
          }}>
          {b.label}
        </motion.div>
      ))}

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 lg:px-12 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="font-mono text-[12px] text-[#CCFF00] uppercase tracking-[5px] mb-8">
          The Starting Whistle
        </motion.p>

        {/* Headline */}
        <div className="overflow-hidden mb-8">
          {['ARE YOU', 'READY TO', 'DOMINATE?'].map((word, i) => (
            <motion.div key={word}
              initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}>
              <span className="block font-sans font-black leading-[0.95] tracking-tight uppercase"
                style={{
                  fontSize: 'clamp(52px,9vw,130px)',
                  color: i === 2 ? '#CCFF00' : '#FFFFFF',
                  textShadow: i === 2 ? '0 0 60px rgba(204,255,0,0.5)' : 'none',
                }}>
                {word}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
          className="font-mono text-[16px] text-[#888] max-w-lg mx-auto leading-[1.7] mb-12">
          Join 24,800+ athletes already building their legacy on SPORTiX. Free to join. Forever elite.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            onClick={() => navigate('/signup')}
            whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(204,255,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="h-16 px-12 rounded-[14px] font-['Barlow_Condensed'] font-semibold text-[20px] text-[#080808] bg-[#CCFF00] w-full sm:w-auto transition-all">
            Create Free Account →
          </motion.button>
          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ borderColor: 'rgba(204,255,0,0.3)', color: '#CCFF00' }}
            whileTap={{ scale: 0.97 }}
            className="h-16 px-12 rounded-[14px] font-['Barlow_Condensed'] font-semibold text-[20px] text-[#FFFFFF] border w-full sm:w-auto transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}>
            Explore Platform
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
