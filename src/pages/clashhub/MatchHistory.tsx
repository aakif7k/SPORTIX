import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Trophy, Target, Zap, TrendingUp, Activity, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useMatchReport } from '../../hooks/useMatchReport';
import { useCareerStats } from '../../hooks/useCareerStats';
import { MatchHistoryCard } from '../../components/performance/MatchHistoryCard';
import { MOCK_PENDING_MATCH } from '../../store/matchReportStore';
import type { MatchHistoryItem, PerformanceSport } from '../../types/performance.types';

const SPORTS: Array<{ id: PerformanceSport | 'all'; label: string; emoji: string }> = [
  { id: 'all',        label: 'All Sports', emoji: '🔥' },
  { id: 'football',   label: 'Football',   emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'cricket',    label: 'Cricket',    emoji: '🏏' },
  { id: 'running',    label: 'Running',    emoji: '🏃' },
];

const RESULTS = [
  { id: 'all',  label: 'All' },
  { id: 'win',  label: 'Wins' },
  { id: 'loss', label: 'Losses' },
  { id: 'draw', label: 'Draws' },
];

export const MatchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [sportFilter, setSportFilter] = useState<PerformanceSport | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const { getMatchHistory, matchHistory } = useMatchReport();
  const careerStats = useCareerStats();

  const pendingItem: MatchHistoryItem = {
    id: 'pending-001',
    matchId: MOCK_PENDING_MATCH.matchId,
    eventName: MOCK_PENDING_MATCH.eventName,
    sport: MOCK_PENDING_MATCH.sport,
    matchResult: 'win',
    date: MOCK_PENDING_MATCH.date,
    pulseEarned: 0,
    ssrDelta: 0,
    matchRating: 0,
    isMvp: false,
    validationStatus: 'pending',
    isPending: true,
    statSummary: {},
  };

  const filteredHistory = getMatchHistory({
    sport: sportFilter === 'all' ? undefined : sportFilter,
    result: resultFilter === 'all' ? undefined : resultFilter,
  });

  const allItems: MatchHistoryItem[] = [pendingItem, ...filteredHistory];

  const summaryStats = [
    { icon: <Trophy size={16} />, label: 'MATCHES', value: matchHistory.length, color: '#CCFF00' },
    { icon: <Zap size={16} />,    label: 'PULSE EARNED', value: careerStats.totalPulseEarned, color: '#00D4FF' },
    { icon: <Target size={16} />, label: 'WIN RATE', value: `${careerStats.winRate}%`, color: '#FF6B00' },
    { icon: <TrendingUp size={16} />, label: 'SSR RATING', value: careerStats.currentSSR, color: '#A855F7' },
  ];

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
              <Activity size={12} /> CLASHHUB TELEMETRY
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">Match History</h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/clashhub/performance')}
          className="px-5 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
        >
          <TrendingUp size={16} /> Performance Analytics
        </button>
      </div>

      {/* ── SUMMARY METRICS GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map(stat => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl bg-surface border border-border-muted text-center space-y-1 shadow-lg"
          >
            <div className="flex justify-center" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="font-mono text-2xl font-black text-white">{stat.value}</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── SPORT & RESULT FILTERS ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {SPORTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSportFilter(s.id as PerformanceSport | 'all')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                sportFilter === s.id
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                  : 'bg-surface border border-border-muted text-text-secondary hover:text-white'
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {RESULTS.map(r => (
              <button
                key={r.id}
                onClick={() => setResultFilter(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  resultFilter === r.id
                    ? 'bg-elevated border border-white/20 text-white'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-text-muted">{allItems.length} matches logged</span>
        </div>
      </div>

      {/* ── MATCH CARDS LIST ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {allItems.map((match, idx) => (
          <MatchHistoryCard key={match.id} match={match} index={idx} />
        ))}
      </div>

    </div>
  );
};
