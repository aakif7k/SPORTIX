import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 } as const,
  transition: { duration: 0.6, ease: [0.25, 0, 0.25, 1] as [number, number, number, number], delay },
});

// ── Squad Assembly Animation ─────────────────────────────────────
const SquadAssembly: React.FC = () => (
  <div className="flex items-center justify-center gap-3 py-4">
    {[0, 1, 2, 3, 4].map(i => (
      <motion.div key={i}
        initial={{ opacity: 0, scale: 0, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-['Barlow_Condensed'] font-bold text-sm"
          style={{ background: 'rgba(204,255,0,0.12)', border: '1px solid rgba(204,255,0,0.4)', color: '#CCFF00',
            boxShadow: '0 0 16px rgba(204,255,0,0.2)' }}>
          {['GK','CB','CM','LW','ST'][i]}
        </div>
        <div className="h-px w-6" style={{ background: i < 4 ? 'rgba(204,255,0,0.3)' : 'transparent' }} />
      </motion.div>
    ))}
  </div>
);

// ── Mini Progress Bar ─────────────────────────────────────────────
const MiniBar: React.FC<{ label: string; pct: number; done?: boolean }> = ({ label, pct, done }) => (
  <div className="flex items-center gap-3 py-1.5">
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[11px] text-[#888]">{label}</span>
        {done && <span className="font-mono text-[10px] text-[#CCFF00]">✓</span>}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2200' }}>
        <motion.div className="h-full rounded-full" style={{ background: '#CCFF00' }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
      </div>
    </div>
  </div>
);

// ── Chat Bubble ───────────────────────────────────────────────────
const ChatBubble: React.FC<{ sent?: boolean; text: string; delay: number }> = ({ sent, text, delay }) => (
  <motion.div {...fadeUp(delay)} className={`flex ${sent ? 'justify-end' : 'justify-start'}`}>
    <div className="max-w-[85%] px-3 py-2 rounded-xl font-mono text-[12px] leading-relaxed"
      style={{
        background: sent ? '#1A2200' : '#1E1E1E',
        color: sent ? '#CCFF00' : '#fff',
        border: `1px solid ${sent ? 'rgba(204,255,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}>
      {text}
    </div>
  </motion.div>
);

// ── Typing Dots ───────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex gap-1 px-3 py-2 rounded-xl w-16" style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.06)' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#666]"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
    ))}
  </div>
);

// ── Main Features Grid ────────────────────────────────────────────
export const FeaturesGrid: React.FC = () => {
  const cards = [
    {
      id: 'squad', span: 'lg:col-span-2 lg:row-span-2',
      title: 'AI SQUAD FORMATION',
      tag: '⚡ PULSE ENGINE',
      body: 'Pulse Engine analyzes 1,284+ athletes to build your perfect squad in seconds.',
      content: <SquadAssembly />,
    },
    {
      id: 'levels', span: '',
      title: 'SPORTIX LEVELS',
      body: '100 levels of progression. 5 prestige ranks beyond.',
      content: (
        <div className="flex flex-col items-center py-2">
          <svg viewBox="0 0 200 110" className="w-40 h-24">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1A2200" strokeWidth="14" strokeLinecap="round" />
            <motion.path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#CCFF00" strokeWidth="14" strokeLinecap="round"
              strokeDasharray="251.2" initial={{ strokeDashoffset: 251.2 }} whileInView={{ strokeDashoffset: 251.2 * 0.27 }}
              viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 6px #CCFF00)' }} />
            <text x="100" y="85" textAnchor="middle" fontFamily="Bebas Neue" fontSize="32" fill="#CCFF00">41</text>
            <text x="100" y="103" textAnchor="middle" fontFamily="DM Mono" fontSize="10" fill="#666">ELITE PHANTOM</text>
          </svg>
        </div>
      ),
    },
    {
      id: 'missions', span: '',
      title: 'DAILY MISSIONS',
      body: '',
      content: (
        <div className="py-1">
          <MiniBar label="Upload Highlight" pct={75} />
          <MiniBar label="Join Event" pct={100} done />
          <MiniBar label="Win a Match" pct={38} />
        </div>
      ),
    },
    {
      id: 'chat', span: '',
      title: 'REAL-TIME SQUAD CHAT',
      body: '',
      content: (
        <div className="space-y-2 py-2">
          <ChatBubble delay={0} text="Ready for tonight's match? 🔥" />
          <ChatBubble sent delay={0.1} text="Let's run 4-3-3 like we practiced" />
          <TypingDots />
        </div>
      ),
    },
    {
      id: 'coins', span: '',
      title: 'SPORTIX COINS',
      body: '',
      content: (
        <div className="flex flex-col items-center py-2 gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-['Bebas_Neue'] text-2xl"
            style={{ border: '2px solid #CCFF00', color: '#CCFF00', background: '#1A2200', boxShadow: '0 0 20px rgba(204,255,0,0.25)' }}>SC</div>
          <span className="font-['Bebas_Neue'] text-3xl text-[#CCFF00]">2,400 SC</span>
          <div className="w-full space-y-1">
            {['+50 Mission Complete', '+15 Match Win', '+5 Daily Login'].map(t => (
              <div key={t} className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#CCFF00]">{t.split(' ')[0]}</span>
                <span className="text-[#666]">{t.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'events', span: 'lg:col-span-2',
      title: 'CLASHHUB EVENTS',
      body: '',
      content: (
        <div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[
              { emoji: '⚽', name: 'Metro Cup 2026', date: 'Jun 12', sport: 'Football' },
              { emoji: '🏏', name: 'T20 Blitz Series', date: 'Jun 19', sport: 'Cricket' },
              { emoji: '🏀', name: 'Hoop Legends Classic', date: 'Jul 3', sport: 'Basketball' },
            ].map(ev => (
              <div key={ev.name} className="flex-shrink-0 p-3 rounded-xl min-w-[160px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(204,255,0,0.08)' }}>
                <div className="text-2xl mb-2">{ev.emoji}</div>
                <p className="font-['Barlow_Condensed'] font-semibold text-[14px] text-white leading-tight">{ev.name}</p>
                <p className="font-mono text-[10px] text-[#666] mt-1">{ev.date} · {ev.sport}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-md font-mono text-[9px] text-[#CCFF00]"
                  style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)' }}>OPEN</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[12px] text-[#CCFF00] mt-3 cursor-pointer hover:underline">Browse 1,200+ live events →</p>
        </div>
      ),
    },
  ];

  return (
    <section className="py-24 bg-[#080808]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Heading */}
        <motion.div {...fadeUp(0)} className="text-center mb-16">
          <p className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-[4px] mb-4">What SPORTiX Does</p>
          <h2 className="font-['Bebas_Neue'] text-white" style={{ fontSize: 'clamp(48px,6vw,96px)', lineHeight: 1 }}>
            ONE PLATFORM.<br />
            <span style={{ color: '#CCFF00', textShadow: '0 0 40px rgba(204,255,0,0.3)' }}>INFINITE POTENTIAL.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              className={`group rounded-[20px] p-6 flex flex-col ${card.span}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(204,255,0,0.08)',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.3s ease',
              }}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
              whileHover={{ y: -4, borderColor: 'rgba(204,255,0,0.3)', boxShadow: '0 0 40px rgba(204,255,0,0.1)' }}
            >
              <h3 className="font-['Barlow_Condensed'] font-semibold text-[22px] text-white mb-2">{card.title}</h3>
              {card.body && <p className="font-mono text-[13px] text-[#888] leading-relaxed mb-3">{card.body}</p>}
              <div className="flex-1">{card.content}</div>
              {card.tag && (
                <div className="mt-4">
                  <span className="font-mono text-[10px] px-3 py-1 rounded-full"
                    style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)', color: '#CCFF00' }}>
                    {card.tag}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
