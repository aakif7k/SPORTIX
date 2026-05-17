import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Zap, ArrowRight, Flame, Radio } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { MOCK_USERS, SPORT_CATEGORIES } from '../../services/mockData';
import { Avatar } from '../ui/Avatar';
import { LiveIndicator } from '../ui/Badge';

const TRENDING = [
  { tag: '#NationalChampionship', posts: '12.4K' },
  { tag: '#AutoSquad',           posts: '8.9K'  },
  { tag: '#ClashHub2025',        posts: '6.1K'  },
];

export const RightPanel: React.FC = () => {
  const { events } = useEventStore();
  const upcomingEvents = events.slice(0, 3);
  const suggestedAthletes = MOCK_USERS.slice(0, 4);
  const navigate = useNavigate();

  return (
    <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-4 py-4 pr-4 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

      {/* ── LIVE CLASHHUB ── */}
      <div className="holo-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,59,0,0.15)', border: '1px solid rgba(255,59,0,0.3)' }}>
              <Radio size={12} style={{ color: '#FF3B00' }} />
            </div>
            <span className="font-display text-sm tracking-widest" style={{ color: '#FF3B00', textShadow: '0 0 12px rgba(255,59,0,0.5)' }}>LIVE CLASHES</span>
          </div>
          <LiveIndicator />
        </div>
        <div className="space-y-2">
          {upcomingEvents.map((event, i) => {
            const sportData = SPORT_CATEGORIES.find(s => s.id === event.sport);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/app/events/${event.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(204,255,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <span className="text-lg">{sportData?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-xs font-semibold text-white truncate">{event.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((event.participants.length / event.maxParticipants) * 100)}%`,
                          background: 'linear-gradient(90deg, #CCFF00, #00D4FF)',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#6E6E8A' }}>
                      {event.participants.length}/{event.maxParticipants}
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#CCFF00' }}>
                  {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => navigate('/app/events')}
          className="mt-3 w-full text-center flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all"
          style={{ fontFamily: 'Space Grotesk', fontSize: '11px', fontWeight: 600, color: '#CCFF00', background: 'rgba(204,255,0,0.05)', border: '1px solid rgba(204,255,0,0.1)' }}
        >
          All Clashes <ArrowRight size={11} />
        </motion.button>
      </div>

      {/* ── RISING ATHLETES ── */}
      <div className="holo-card-cyan p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <TrendingUp size={12} style={{ color: '#00D4FF' }} />
          </div>
          <span className="font-display text-sm tracking-widest" style={{ color: '#00D4FF', textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>RISING ATHLETES</span>
        </div>
        <div className="space-y-3">
          {suggestedAthletes.map((athlete, i) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ x: 3 }}
              onClick={() => navigate(`/app/profile/${athlete.id}`)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Avatar src={athlete.avatar} name={athlete.name} sport={athlete.sport} isOnline={athlete.isOnline} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-label text-xs font-semibold text-white group-hover:text-volt transition-colors truncate">{athlete.name}</p>
                <p style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#6E6E8A' }} className="capitalize">
                  {athlete.sport} · {athlete.stats.followers.toLocaleString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="text-[10px] font-label font-semibold px-2 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
                onClick={e => e.stopPropagation()}
              >
                Follow
              </motion.button>
            </motion.div>
          ))}
        </div>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => navigate('/app/discover')}
          className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all"
          style={{ fontFamily: 'Space Grotesk', fontSize: '11px', fontWeight: 600, color: '#00D4FF', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}
        >
          Discover All <ArrowRight size={11} />
        </motion.button>
      </div>

      {/* ── TRENDING ── */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(191,95,255,0.04)', border: '1px solid rgba(191,95,255,0.12)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #BF5FFF, transparent)', opacity: 0.5 }} />
        <div className="flex items-center gap-2 mb-3">
          <Flame size={13} style={{ color: '#BF5FFF' }} />
          <span className="font-display text-sm tracking-widest" style={{ color: '#BF5FFF', textShadow: '0 0 12px rgba(191,95,255,0.5)' }}>HEATZONE</span>
        </div>
        <div className="space-y-2">
          {TRENDING.map((item, i) => (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              whileHover={{ x: 2 }}
              className="flex items-center justify-between cursor-pointer group py-1"
            >
              <span className="font-label text-xs font-semibold group-hover:text-white transition-colors" style={{ color: '#9090AA' }}>{item.tag}</span>
              <span style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#BF5FFF', background: 'rgba(191,95,255,0.1)', border: '1px solid rgba(191,95,255,0.2)', padding: '1px 6px', borderRadius: '999px' }}>{item.posts}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── AUTOSQUAD AI BANNER ── */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="rounded-2xl p-4 cursor-pointer relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(204,255,0,0.1), rgba(204,255,0,0.04))', border: '1px solid rgba(204,255,0,0.2)' }}
        onClick={() => navigate('/app/events/e1/ai-team')}
      >
        {/* Shimmer */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(204,255,0,0.06), transparent)', width: '50%', pointerEvents: 'none' }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #CCFF00, #00D4FF, transparent)', opacity: 0.7 }} />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(204,255,0,0.2)', border: '1px solid rgba(204,255,0,0.4)', boxShadow: '0 0 16px rgba(204,255,0,0.2)' }}>
            <Zap size={16} fill="currentColor" style={{ color: '#CCFF00' }} />
          </div>
          <div>
            <p className="font-display text-sm tracking-widest" style={{ color: '#CCFF00', textShadow: '0 0 12px rgba(204,255,0,0.5)' }}>AUTOSQUAD</p>
            <p style={{ fontFamily: 'DM Mono', fontSize: '9px', color: '#6E6E8A' }}>Powered by Gemini AI</p>
          </div>
        </div>
        <p className="font-label text-xs leading-relaxed mb-3" style={{ color: '#6E6E8A' }}>
          AI found <span style={{ color: '#CCFF00', fontWeight: 700 }}>3 compatible teammates</span> for the Football Championship
        </p>
        <div className="w-full py-2 rounded-xl flex items-center justify-center gap-2 transition-all" style={{ background: '#CCFF00', boxShadow: '0 0 20px rgba(204,255,0,0.25)' }}>
          <Zap size={12} fill="black" style={{ color: 'black' }} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '11px', color: '#000', letterSpacing: '0.05em' }}>BUILD MY SQUAD →</span>
        </div>
      </motion.div>
    </aside>
  );
};
