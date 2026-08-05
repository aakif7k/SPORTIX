import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useCareer, useMatchHistory } from '@/hooks/useCareer';
import { usePerformanceInsight } from '@/hooks/useAI';
import { CareerStatCard } from '../../components/performance/CareerStatCard';
import { PerformanceRadar } from '../../components/performance/PerformanceRadar';
import type { PerformanceSport } from '../../types/performance.types';

const TABS = ['Overview', 'Trends', 'AI Insights', 'Radar'];

export const PerformanceTracker: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const { career, loading, error, refresh } = useCareer();
  // The Pulse growth chart was five hardcoded points ending at an SSR of 94.8.
  // It is the athlete's validated reports in the order they were filed.
  const { matches } = useMatchHistory();

  const pulseTrend = [...matches]
    .filter(m => !m.is_pending)
    .reverse()
    .map((m, i) => ({
      match: `Match ${i + 1}`,
      pulse: m.pulse_earned,
      ssr: m.ssr_delta,
    }));

  // The radar was pinned to football for everybody. Use whichever sport the
  // athlete has actually filed reports in.
  const primarySport = (matches.find(m => m.sport)?.sport ?? 'football') as PerformanceSport;

  // Only asked for when the tab is open: the AI tier allows three calls an hour.
  const {
    insights, loading: insightsLoading, unavailable: insightsUnavailable,
    message: insightsMessage, error: insightsError,
  } = usePerformanceInsight(activeTab === 'AI Insights' && (career?.total_matches ?? 0) > 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-24" aria-busy="true" aria-label="Loading performance analytics">
        <div className="h-28 rounded-3xl bg-surface border border-border-muted animate-shimmer" />
        <div className="h-12 rounded-2xl bg-surface border border-border-muted animate-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-surface border border-border-muted animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3 text-white">
        <p className="font-sans font-bold text-sm uppercase tracking-wider">Analytics did not load</p>
        <p className="font-mono text-xs text-text-muted">{error.message}</p>
        <button
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono text-[10px] font-bold uppercase"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

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
          <TrendingUp size={16} /> SSR: {career?.current_ssr ?? '—'}
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
              {/* The trend badges said "+4 this month", "+6%", "+150 today" and
                  "2 recent" for every athlete on every visit. There is no
                  prior-period comparison to derive them from, so they are gone
                  rather than invented. */}
              <CareerStatCard icon="⚽" value={career?.football?.total_goals ?? 0} label="Total Goals" index={0} />
              <CareerStatCard icon="🏆" value={`${career?.win_rate ?? 0}%`} label="Win Rate" index={1} />
              <CareerStatCard icon="⚡" value={career?.total_pulse_earned ?? 0} label="Pulse Earned" index={2} />
              <CareerStatCard icon="👑" value={career?.mvp_count ?? 0} label="MVP Awards" index={3} color="#FF6B00" />
            </div>

            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Career Win-Loss Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-center font-mono">
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-[#CCFF00]">{career?.wins ?? 0}</p>
                  <p className="text-[10px] text-text-muted uppercase">WINS</p>
                </div>
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-amber-400">{career?.draws ?? 0}</p>
                  <p className="text-[10px] text-text-muted uppercase">DRAWS</p>
                </div>
                <div className="p-4 rounded-2xl bg-elevated border border-white/5">
                  <p className="text-2xl font-black text-red-400">{career?.losses ?? 0}</p>
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
              {pulseTrend.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                    No validated matches yet
                  </p>
                  <p className="font-mono text-xs text-text-muted">
                    Pulse growth is plotted once your reports are confirmed by teammates.
                  </p>
                </div>
              ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pulseTrend}>
                    <XAxis dataKey="match" tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 11, fontFamily: 'Urbanist' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#101010', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="pulse" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              )}
            </div>
          </motion.div>
        )}

        {/* AI INSIGHTS TAB */}
        {activeTab === 'AI Insights' && (
          <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* These were three hardcoded claims about the athlete's own play — a
                35% weekend Pulse advantage, a 78% win rate over their last four —
                identical for every user and true for none. They are generated from
                this athlete's own figures now, by the server-side AI proxy, with a
                prompt that forbids inventing statistics or trends. */}
            {(career?.total_matches ?? 0) === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-border-muted text-center space-y-2 shadow-lg">
                <span className="text-2xl">🧠</span>
                <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                  Nothing to analyse yet
                </p>
                <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                  File and validate a few match reports first.
                </p>
              </div>
            ) : insightsLoading ? (
              <div aria-busy="true" aria-label="Generating insights" className="space-y-4">
                {[0, 1].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-surface border border-border-muted animate-shimmer" />
                ))}
              </div>
            ) : insightsUnavailable ? (
              <div className="p-8 rounded-2xl bg-surface border border-border-muted text-center space-y-2 shadow-lg">
                <span className="text-2xl">🧠</span>
                <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                  Analysis is not enabled
                </p>
                <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                  This server has no AI key configured, so your{' '}
                  {career?.total_matches} validated match
                  {career?.total_matches === 1 ? '' : 'es'} cannot be analysed here.
                </p>
              </div>
            ) : insights.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-border-muted text-center space-y-2 shadow-lg">
                <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                  No observations
                </p>
                <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                  {insightsMessage ?? insightsError?.message
                    ?? 'There was not enough in your record to draw a conclusion from.'}
                </p>
              </div>
            ) : insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface border border-border-muted space-y-2 shadow-lg"
                style={{ borderLeftColor: '#CCFF00', borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <h4 className="font-sans font-bold text-base text-white">{insight.title}</h4>
                </div>
                <p className="text-xs text-text-secondary font-sans leading-relaxed">{insight.detail}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* RADAR TAB */}
        {activeTab === 'Radar' && (
          <motion.div key="radar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
              <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Attribute Distribution Radar</h3>
              <PerformanceRadar sport={primarySport} size="lg" />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
