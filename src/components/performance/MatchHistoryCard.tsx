import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { MatchHistoryItem } from '../../types/performance.types';

interface MatchHistoryCardProps {
  match: MatchHistoryItem;
  compact?: boolean;
  index?: number;
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  basketball: '🏀',
  cricket: '🏏',
  running: '🏃',
  generic: '🏅',
};

const RESULT_STYLES = {
  win:  { text: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.3)',  label: 'WIN' },
  loss: { text: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.3)', label: 'LOSS' },
  draw: { text: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.3)',  label: 'DRAW' },
};

const VALIDATION_ICON = {
  validated: <CheckCircle2 size={12} style={{ color: '#4ADE80' }} />,
  pending:   <Clock size={12} style={{ color: '#FBBF24' }} />,
  disputed:  <AlertTriangle size={12} style={{ color: '#F87171' }} />,
  partial:   <Clock size={12} style={{ color: '#FBBF24' }} />,
};

const VALIDATION_TEXT = {
  validated: { text: '✓ Validated by teammates',  color: '#4ADE80' },
  pending:   { text: '⏳ Awaiting validation',     color: '#FBBF24' },
  disputed:  { text: '⚠ Disputed',                color: '#F87171' },
  partial:   { text: '⏳ Partially validated',     color: '#FBBF24' },
};

export const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({
  match,
  compact = false,
  index = 0,
}) => {
  const navigate  = useNavigate();
  const result    = RESULT_STYLES[match.matchResult];
  const dateStr   = new Date(match.date).toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const validation = VALIDATION_TEXT[match.validationStatus];

  // Pending report variant
  if (match.isPending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="rounded-[16px] p-5 relative"
        style={{
          border: '2px dashed rgba(251,191,36,0.4)',
          background: 'rgba(251,191,36,0.04)',
          animation: 'dashPulse 2.5s ease infinite',
        }}
      >
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase"
          style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
          REPORT PENDING
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{SPORT_EMOJI[match.sport]}</span>
          <span className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">{match.eventName}</span>
        </div>
        <p className="font-mono text-[12px] text-[var(--text-muted)] mb-4">{dateStr}</p>
        <button
          onClick={() => navigate(`/app/clashhub/report/${match.matchId}`)}
          className="flex items-center gap-1.5 font-mono text-[12px] font-bold"
          style={{ color: '#FBBF24' }}
        >
          Complete Report <ArrowRight size={13} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-[16px] p-5 space-y-4 cursor-pointer group transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${result.border}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
    >
      {/* Row 1: Sport + Event + Date + Result */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {SPORT_EMOJI[match.sport]} {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}
          </span>
          <span className="font-condensed font-semibold text-[15px] text-[var(--text-primary)] truncate">
            {match.eventName}
          </span>
          {match.isMvp && (
            <span className="text-xs flex-shrink-0">👑</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[11px] text-[var(--text-muted)] hidden sm:block">{dateStr}</span>
          <span
            className="px-3 py-1 rounded-full font-mono text-[11px] font-bold"
            style={{ background: result.bg, border: `1px solid ${result.border}`, color: result.text }}
          >
            {result.label}
          </span>
        </div>
      </div>

      {/* Row 2: Stat chips */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(match.statSummary).map(([k, v]) => (
            <span
              key={k}
              className="px-3 py-1.5 rounded-[8px] font-mono text-[12px]"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {k}: <strong style={{ color: 'var(--text-primary)' }}>{v}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Row 3: Pulse + SSR + Validation */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--accent)' }}>
            +{match.pulseEarned} ⚡ Pulse
          </span>
          <span className="font-mono text-[13px] font-bold" style={{ color: '#60A5FA' }}>
            {match.ssrDelta >= 0 ? '+' : ''}{match.ssrDelta} 📊 SSR
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {VALIDATION_ICON[match.validationStatus]}
          <span className="font-mono text-[12px]" style={{ color: validation.color }}>
            {validation.text}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
