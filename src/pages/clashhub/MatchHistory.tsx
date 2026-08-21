import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Zap, TrendingUp, Activity, Sparkles, Clock, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useMatchReport } from '../../hooks/useMatchReport';
import { useCareerStats } from '../../hooks/useCareerStats';
import { MatchHistoryCard } from '../../components/performance/MatchHistoryCard';
import { useAuthStore } from '../../store/authStore';
import { getPendingReportsForUser, type PendingReportEvent } from '../../services/eventReportService';
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
  const { user } = useAuthStore();
  const [sportFilter, setSportFilter] = useState<PerformanceSport | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [pendingReports, setPendingReports] = useState<PendingReportEvent[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const { getMatchHistory, matchHistory } = useMatchReport();
  const careerStats = useCareerStats();

  useEffect(() => {
    if (!user?.id) return;
    setLoadingPending(true);
    getPendingReportsForUser(user.id)
      .then(res => setPendingReports(res))
      .catch(err => console.warn('[MatchHistory] Failed to fetch pending reports:', err))
      .finally(() => setLoadingPending(false));
  }, [user?.id]);

  const filteredHistory = getMatchHistory({
    sport: sportFilter === 'all' ? undefined : sportFilter,
    result: resultFilter === 'all' ? undefined : resultFilter,
  });

  const allItems: MatchHistoryItem[] = filteredHistory;

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

      {/* ── PENDING POST-EVENT REPORTS BANNER (Awaiting Submission) ────── */}
      {loadingPending ? (
        <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-center gap-2 text-text-muted font-mono text-xs">
          <Loader2 size={14} className="animate-spin text-[#CCFF00]" />
          <span>Checking pending event reports...</span>
        </div>
      ) : pendingReports.length > 0 ? (
        <div className="space-y-3 p-6 rounded-3xl bg-gradient-to-br from-[#1A1400] via-[#0E0E0E] to-[#0A0A0A] border-2 border-[#CCFF00]/40 shadow-[0_0_30px_rgba(204,255,0,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_10px_#CCFF00]" />
              <h2 className="font-sans font-black text-sm uppercase tracking-wider text-white">
                Pending Match Reports ({pendingReports.length})
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-[10px] font-bold text-[#CCFF00] uppercase">
              +40 Pulse Each
            </span>
          </div>

          <p className="text-xs font-mono text-text-secondary">
            You participated in the following completed events. Submit your match report to record your statistics and earn Pulse rewards!
          </p>

          <div className="space-y-2.5 pt-1">
            {pendingReports.map(item => (
              <motion.div
                key={item.eventId}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-2xl bg-[#121212] border border-[#CCFF00]/20 hover:border-[#CCFF00]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans font-black text-sm text-white uppercase tracking-wide">
                      {item.eventName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#1E1E1E] text-text-secondary font-mono text-[10px] font-bold uppercase capitalize">
                      {item.sport}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#CCFF00]/10 text-[#CCFF00] font-mono text-[10px] font-bold">
                      +{item.pulseReward} PULSE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-text-muted" /> {item.location}
                      </span>
                    )}
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-text-muted" /> {new Date(item.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/app/events/${item.eventId}/report`)}
                  className="px-4 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#d4ff33] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer self-stretch sm:self-auto"
                >
                  <Sparkles size={14} /> Submit Report <ChevronRight size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

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
        {allItems.length === 0 ? (
          <div className="p-12 rounded-3xl bg-surface border border-border-muted text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-elevated border border-border-muted flex items-center justify-center mx-auto text-[#CCFF00]">
              <Trophy size={22} />
            </div>
            <p className="font-sans font-bold text-sm text-white">
              Play a match to build your history.
            </p>
            <p className="font-mono text-xs text-text-muted">
              Join an event or squad match to log your telemetry stats.
            </p>
          </div>
        ) : (
          allItems.map((match, idx) => (
            <MatchHistoryCard key={match.id} match={match} index={idx} />
          ))
        )}
      </div>

    </div>
  );
};
