import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { useMatchReport } from '../../hooks/useMatchReport';
import { useCareerStats } from '../../hooks/useCareerStats';
import { MatchHistoryCard } from '../../components/performance/MatchHistoryCard';
import { MOCK_PENDING_MATCH } from '../../store/matchReportStore';
import type { MatchHistoryItem, PerformanceSport } from '../../types/performance.types';

const SPORTS: Array<{ id: PerformanceSport | 'all'; label: string; emoji: string }> = [
  { id: 'all',        label: 'All Sports', emoji: '🏅' },
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

  // Add pending match at top
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
    { icon: <Trophy size={16} />, label: 'MATCHES', value: matchHistory.length, color: 'var(--accent)' },
    { icon: <Zap size={16} />,    label: 'PULSE EARNED', value: careerStats.totalPulseEarned, color: '#60A5FA' },
    { icon: <Target size={16} />, label: 'WIN RATE', value: `${careerStats.winRate}%`, color: '#4ADE80' },
    { icon: <TrendingUp size={16} />, label: 'SSR RATING', value: careerStats.currentSSR, color: '#FBBF24' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 space-y-6">

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
        <div className="flex-1" />
      </div>

      <div>
        <h1 className="font-display text-[52px] leading-none text-[var(--text-primary)] tracking-wider">
          MATCH HISTORY
        </h1>
        <p className="font-mono text-[14px] text-[var(--text-muted)] mt-1">
          Your complete performance record
        </p>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-[14px] p-4 text-center space-y-1.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-center" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="font-display text-[30px] leading-none" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {SPORTS.map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSportFilter(s.id as PerformanceSport | 'all')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[12px] font-bold whitespace-nowrap transition-all"
              style={
                sportFilter === s.id
                  ? { background: 'var(--accent)', color: '#080808' }
                  : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {s.emoji} {s.label}
            </motion.button>
          ))}
        </div>

        {/* Result filter */}
        <div className="flex gap-2">
          {RESULTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setResultFilter(r.id)}
              className="px-4 py-1.5 rounded-full font-mono text-[12px] font-bold transition-all"
              style={
                resultFilter === r.id
                  ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                  : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent' }
              }
            >
              {r.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)]">
            <Filter size={13} />
            {filteredHistory.length} results
          </div>
        </div>
      </div>

      {/* Match list */}
      <div className="space-y-4">
        {allItems.length === 0 ? (
          <div
            className="rounded-[16px] p-12 text-center space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}
          >
            <div className="text-[40px]">📊</div>
            <h3 className="font-display text-[24px] text-[var(--text-primary)]">NO MATCHES YET</h3>
            <p className="font-mono text-[13px] text-[var(--text-muted)]">
              Complete match reports to build your history
            </p>
            <button
              onClick={() => navigate(`/app/clashhub/report/${MOCK_PENDING_MATCH.matchId}`)}
              className="mt-4 inline-block px-6 py-3 rounded-[12px] font-mono text-[13px] font-bold"
              style={{ background: 'var(--accent)', color: '#080808' }}
            >
              Submit Report →
            </button>
          </div>
        ) : (
          allItems.map((match, i) => (
            <MatchHistoryCard
              key={match.id}
              match={match}
              index={i}
            />
          ))
        )}
      </div>

      {/* Performance link CTA */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => navigate('/app/clashhub/performance')}
        className="rounded-[16px] p-5 cursor-pointer flex items-center justify-between transition-all"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent)', boxShadow: '0 0 20px rgba(204,255,0,0.06)' }}
      >
        <div>
          <p className="font-display text-[18px] text-[var(--text-primary)] tracking-wider">
            VIEW PERFORMANCE ANALYTICS
          </p>
          <p className="font-mono text-[12px] text-[var(--text-muted)] mt-0.5">
            Charts, trends, and AI insights across all your matches
          </p>
        </div>
        <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
      </motion.div>
    </div>
  );
};
