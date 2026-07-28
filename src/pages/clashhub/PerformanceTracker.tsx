import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useCareerStats } from '../../hooks/useCareerStats';
import { CareerStatCard } from '../../components/performance/CareerStatCard';
import { PerformanceRadar } from '../../components/performance/PerformanceRadar';

const PULSE_TREND = [
  { match: 'Match 1', pulse: 45, ssr: 88.2 },
  { match: 'Match 2', pulse: 62, ssr: 89.5 },
  { match: 'Match 3', pulse: 38, ssr: 89.1 },
  { match: 'Match 4', pulse: 74, ssr: 92.4 },
  { match: 'Match 5', pulse: 91, ssr: 94.8 },
];

const AI_INSIGHTS = [
  {
    icon: '🎯',
    title: 'Weekend Performance Peak',
    desc: 'You score 35% more Pulse points in weekend tournament clashes. Recommend booking weekend fixtures.',
    color: '#CCFF00',
  },
  {
    icon: '📈',
    title: 'Win Streak SSR Surge',
    desc: 'Your last 4 matches show a 78% win rate. Continue consistency to unlock ELITE SSR rank.',
    color: '#00D4FF',
  },
  {
    icon: '⚡',
    title: 'Assist & Playmaking Opportunity',
    desc: 'Increasing forward assist frequency can boost overall team chemistry score by +15%.',
    color: '#A855F7',
  },
];

const TABS = ['Overview', 'Trends', 'AI Insights', 'Radar'];

export const PerformanceTracker: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const careerStats = useCareerStats();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 text-white">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141200] via-[#0A0A0A] to-[#0A1015] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-elevated border border-white/10 hover:border-[#CCFF00]/40 flex items-center justify-center text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">
              <Brain size={12} /> AI PERFORMANCE HUB
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">Performance Analytics</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-xs font-bold text-[#CCFF00]">
          <TrendingUp size={16} /> SSR: {careerStats.currentSSR || 94.8} PEAK
        </div>
      </div>

      {/* ── NAVIGATION TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none bg-surface p-1.5 rounded-2xl border border-border-muted">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CareerStatCard icon="⚽" value={careerStats.football?.totalGoals ?? 12} label="Total Goals" trend="+4 this month" trendUp index={0} />
              <CareerStatCard icon="🏆" value={`${careerStats.winRate || 78}%`} label="Win Rate" trend="+6%" trendUp index={1} />
              <CareerStatCard icon="⚡" value={careerStats.totalPulseEarned || 4200} label="Pulse Earned" trend="+150 today" trendUp index={2} />
              <CareerStatCard icon="👑" value={careerStats.football?.mvpCount ?? 5} label="MVP Awards" trend="2 recent" trendUp index={3} color="#FF6B00" />
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Career Win-Loss Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-center font-mono">
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-[#CCFF00]">{careerStats.wins || 18}</p>
                  <p className="text-[10px] text-text-muted uppercase">WINS</p>
                </div>
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-amber-400">{careerStats.draws || 4}</p>
                  <p className="text-[10px] text-text-muted uppercase">DRAWS</p>
                </div>
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-red-400">{careerStats.losses || 3}</p>
                  <p className="text-[10px] text-text-muted uppercase">LOSSES</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'Trends' && (
          <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Pulse Point Growth Rate</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PULSE_TREND}>
                    <XAxis dataKey="match" tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#101010', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="pulse" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI INSIGHTS TAB */}
        {activeTab === 'AI Insights' && (
          <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {AI_INSIGHTS.map((insight, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface border border-border-muted space-y-2 shadow-lg"
                style={{ borderLeftColor: insight.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{insight.icon}</span>
                  <h4 className="font-sans font-bold text-base text-white">{insight.title}</h4>
                </div>
                <p className="text-xs text-text-secondary font-sans leading-relaxed">{insight.desc}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* RADAR TAB */}
        {activeTab === 'Radar' && (
          <motion.div key="radar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Attribute Distribution Radar</h3>
              <PerformanceRadar sport="football" size="lg" />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
