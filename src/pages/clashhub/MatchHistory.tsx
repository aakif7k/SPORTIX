import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Trophy, Target, Zap, TrendingUp, Activity } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { useMatchHistory, useCareer, type ApiMatchHistoryItem } from '@/hooks/useCareer';
import { MatchHistoryCard } from '../../components/performance/MatchHistoryCard';
import type { MatchHistoryItem, PerformanceSport } from '../../types/performance.types';

/**
 * The shared card still speaks the camelCase MatchHistoryItem shape, so the API
 * row is adapted here rather than rewriting the card and everything else using it.
 */
const toItem = (row: ApiMatchHistoryItem): MatchHistoryItem => ({
  id: row.id,
  matchId: row.match_id,
  eventName: row.event_name,
  sport: row.sport,
  matchResult: row.match_result as MatchHistoryItem['matchResult'],
  date: row.date ?? '',
  pulseEarned: row.pulse_earned,
  ssrDelta: row.ssr_delta,
  matchRating: row.match_rating,
  isMvp: row.is_mvp,
  validationStatus: row.validation_status,
  // The card renders a "file this report" prompt for a pending row; that used to
  // be one hardcoded fixture bolted to the top of the list regardless of whether
  // the athlete actually owed a report.
  isPending: row.is_pending,
  statSummary: row.stat_summary,
});

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

  // Filtering is a server query now: this used to pull an athlete's whole career
  // into the browser and filter the array.
  const { matches, loading, error, refresh } = useMatchHistory({
    sport: sportFilter === 'all' ? undefined : sportFilter,
    result: resultFilter,
  });
  const { career } = useCareer();

  const allItems: MatchHistoryItem[] = matches.map(toItem);

  const summaryStats = [
    { icon: <Trophy size={16} />, label: 'MATCHES', value: career?.total_matches ?? 0, color: '#CCFF00' },
    { icon: <Zap size={16} />,    label: 'PULSE EARNED', value: career?.total_pulse_earned ?? 0, color: '#00D4FF' },
    { icon: <Target size={16} />, label: 'WIN RATE', value: `${career?.win_rate ?? 0}%`, color: '#FF6B00' },
    // Null until something has been validated, rather than a flattering default.
    { icon: <TrendingUp size={16} />, label: 'SSR RATING', value: career?.current_ssr ?? '—', color: '#A855F7' },
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
          <span className="font-mono text-xs text-text-muted">
            {allItems.length} match{allItems.length === 1 ? '' : 'es'} logged
            {career?.pending_count ? ` · ${career.pending_count} awaiting validation` : ''}
          </span>
        </div>
      </div>

      {/* ── MATCH CARDS LIST ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div aria-busy="true" aria-label="Loading match history" className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-surface border border-border-muted animate-shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-surface border border-border-muted text-center space-y-3">
            <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
              Match history did not load
            </p>
            <p className="font-mono text-xs text-text-muted">{error.message}</p>
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono text-[10px] font-bold uppercase"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : allItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border-muted text-center space-y-2">
            <p className="font-sans font-bold text-sm text-white uppercase tracking-wider">
              {sportFilter === 'all' && resultFilter === 'all'
                ? 'No matches logged yet'
                : 'Nothing matches those filters'}
            </p>
            <p className="font-mono text-xs text-text-muted">
              {sportFilter === 'all' && resultFilter === 'all'
                ? 'File a report after your next match and it shows up here.'
                : 'Try a different sport or result.'}
            </p>
          </div>
        ) : allItems.map((match, idx) => (
          <MatchHistoryCard key={match.id} match={match} index={idx} />
        ))}
      </div>

    </div>
  );
};
