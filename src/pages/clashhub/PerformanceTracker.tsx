import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Brain, Trophy
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { useCareerStats } from '../../hooks/useCareerStats';
import { useMatchReport } from '../../hooks/useMatchReport';
import { CareerStatCard } from '../../components/performance/CareerStatCard';
import { PerformanceRadar } from '../../components/performance/PerformanceRadar';

// ─── Mock chart data ──────────────────────────────────────────────────────────

const PULSE_TREND = [
  { match: 'M1', pulse: 45, ssr: 7.9 },
  { match: 'M2', pulse: 62, ssr: 8.0 },
  { match: 'M3', pulse: 38, ssr: 7.9 },
  { match: 'M4', pulse: 74, ssr: 8.1 },
  { match: 'M5', pulse: 91, ssr: 8.4 },
];

const SPORT_DISTRIBUTION_DATA = [
  { name: 'Football',   value: 3, color: '#CCFF00' },
  { name: 'Basketball', value: 1, color: '#60A5FA' },
  { name: 'Cricket',    value: 1, color: '#FBBF24' },
];

const AI_INSIGHTS = [
  {
    icon: '🎯',
    title: 'Your best performance is on Weekends',
    desc: 'You score 35% more Pulse points in weekend matches. Try scheduling more competitive play on weekends.',
    color: '#CCFF00',
  },
  {
    icon: '📈',
    title: 'Win Rate rising — SSR tracking up',
    desc: 'Your last 3 matches show a 72% win rate. Keep consistency to unlock ELITE tier within 8 more matches.',
    color: '#4ADE80',
  },
  {
    icon: '⚡',
    title: 'Assist output trending low',
    desc: 'You average only 0.3 assists per match. Increasing team play could boost chemistry score by +15%.',
    color: '#FBBF24',
  },
  {
    icon: '🏆',
    title: 'MVP streak potential: 2 more to unlock badge',
    desc: 'You were MVP in 1 out of 5 matches. 2 more MVP performances unlock the "Hat-Trick Hero" badge.',
    color: '#60A5FA',
  },
];

const TABS = ['Overview', 'Trends', 'AI Insights', 'Radar'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-[10px] p-3 space-y-1.5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: 12 }}
    >
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export const PerformanceTracker: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const careerStats = useCareerStats();
  const { matchHistory } = useMatchReport();

  const ssrTrendIcon = careerStats.ssrTrend === 'up'
    ? <TrendingUp size={14} style={{ color: '#4ADE80' }} />
    : careerStats.ssrTrend === 'down'
    ? <TrendingDown size={14} style={{ color: '#F87171' }} />
    : <Minus size={14} style={{ color: '#9CA3AF' }} />;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 pt-4 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-mono text-[13px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} /> Back
        </motion.button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-[52px] leading-none text-[var(--text-primary)] tracking-wider">
            PERFORMANCE TRACKER
          </h1>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[12px] font-bold"
            style={{
              background: careerStats.ssrTrend === 'up' ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
              color: careerStats.ssrTrend === 'up' ? '#4ADE80' : '#F87171',
              border: `1px solid ${careerStats.ssrTrend === 'up' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            }}
          >
            {ssrTrendIcon} SSR {careerStats.currentSSR}
          </div>
        </div>
        <p className="font-mono text-[14px] text-[var(--text-muted)]">
          Powered by AI — Your performance intelligence hub
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-[10px] font-mono text-[12px] font-bold transition-all whitespace-nowrap"
            style={
              activeTab === tab
                ? { background: 'var(--accent)', color: '#080808' }
                : { color: 'var(--text-muted)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >

          {/* ── OVERVIEW ──────────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* Career stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <CareerStatCard icon="⚽" value={careerStats.football?.totalGoals ?? 0} label="Total Goals"     trend="+2 this month" trendUp index={0} />
                <CareerStatCard icon="🏆" value={careerStats.winRate + '%'} label="Win Rate"        trend="+5%"          trendUp index={1} />
                <CareerStatCard icon="⚡" value={careerStats.totalPulseEarned} label="Pulse Earned"   trend="+91 today"    trendUp index={2} />
                <CareerStatCard icon="👑" value={careerStats.football?.mvpCount ?? 0} label="MVP Titles"      trend="1 recent"     trendUp index={3} color="#FBBF24" />
              </div>

              {/* Record overview */}
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
                  CAREER RECORD
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="font-display text-[40px] leading-none" style={{ color: '#4ADE80' }}>
                      {careerStats.wins}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">WINS</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-[40px] leading-none" style={{ color: '#FBBF24' }}>
                      {careerStats.draws}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">DRAWS</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-[40px] leading-none" style={{ color: '#F87171' }}>
                      {careerStats.losses}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">LOSSES</div>
                  </div>
                </div>

                {/* Win rate bar */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Win Rate</span>
                    <span style={{ color: 'var(--accent)' }}>{careerStats.winRate}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${careerStats.winRate}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Sport distribution pie */}
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
                  SPORT BREAKDOWN
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={SPORT_DISTRIBUTION_DATA}
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="var(--bg-base)"
                      >
                        {SPORT_DISTRIBUTION_DATA.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          fontFamily: 'DM Mono',
                          fontSize: 12,
                          color: 'var(--text-primary)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {SPORT_DISTRIBUTION_DATA.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="font-mono text-[13px] text-[var(--text-secondary)]">{d.name}</span>
                        </div>
                        <span className="font-mono text-[13px] font-bold" style={{ color: d.color }}>
                          {d.value} match{d.value !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRENDS ────────────────────────────────────────────── */}
          {activeTab === 'Trends' && (
            <div className="space-y-5">
              {/* Pulse trend */}
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
                  ⚡ PULSE TREND
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={PULSE_TREND}>
                    <defs>
                      <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#CCFF00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#CCFF00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="match" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="pulse" stroke="#CCFF00" fill="url(#pulseGrad)" strokeWidth={2.5} name="Pulse Earned" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* SSR trend */}
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
                  📊 SSR RATING TREND
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={PULSE_TREND}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="match" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[7.5, 9]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="ssr" stroke="#60A5FA" strokeWidth={2.5} dot={{ fill: '#60A5FA', r: 4 }} name="SSR Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── AI INSIGHTS ─────────────────────────────────────── */}
          {activeTab === 'AI Insights' && (
            <div className="space-y-4">
              {/* Header */}
              <div
                className="rounded-[16px] p-5 flex items-center gap-4"
                style={{ background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.15)' }}
              >
                <Brain size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <p className="font-condensed font-semibold text-[16px] text-[var(--text-primary)]">
                    AI Performance Analysis
                  </p>
                  <p className="font-mono text-[12px] text-[var(--text-muted)]">
                    Based on your last {matchHistory.length} matches · Updated after each report
                  </p>
                </div>
              </div>

              {/* Insight cards */}
              <div className="space-y-4">
                {AI_INSIGHTS.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-[16px] p-5 space-y-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeftColor: insight.color, borderLeftWidth: 3 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[24px]">{insight.icon}</span>
                      <h4 className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">
                        {insight.title}
                      </h4>
                    </div>
                    <p className="font-mono text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {insight.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── RADAR ──────────────────────────────────────────── */}
          {activeTab === 'Radar' && (
            <div className="space-y-5">
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div>
                  <h3 className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
                    PERFORMANCE RADAR
                  </h3>
                  <p className="font-mono text-[12px] text-[var(--text-muted)] mt-0.5">
                    Average across all football matches
                  </p>
                </div>
                <PerformanceRadar sport="football" size="lg" />
              </div>

              {/* Football specific stats */}
              {careerStats.football && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Goals',   value: careerStats.football.totalGoals,  color: 'var(--accent)' },
                    { label: 'Total Assists', value: careerStats.football.totalAssists, color: '#60A5FA' },
                    { label: 'Avg Rating',    value: careerStats.football.avgRating,   color: '#4ADE80' },
                    { label: 'MVP Count',     value: careerStats.football.mvpCount,    color: '#FBBF24' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-[14px] p-4 text-center"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="font-display text-[36px] leading-none" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Best match callout */}
              {careerStats.football?.bestMatch && (
                <div
                  className="rounded-[16px] p-5 space-y-2"
                  style={{ background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <Trophy size={16} style={{ color: 'var(--accent)' }} />
                    <p className="font-mono text-[12px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                      BEST MATCH
                    </p>
                  </div>
                  <p className="font-condensed font-semibold text-[16px] text-[var(--text-primary)]">
                    {careerStats.football.bestMatch}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
