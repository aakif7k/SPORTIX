import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePendingReport } from '../../hooks/usePendingReport';
import { useMatchReportStore } from '../../store/matchReportStore';

export const PendingReportBanner: React.FC = () => {
  const navigate = useNavigate();
  const { hasPending, pendingMatch } = usePendingReport();
  const { dismissPendingReport } = useMatchReportStore();

  const sportEmoji: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    cricket: '🏏',
    running: '🏃',
    generic: '🏅',
  };

  return (
    <AnimatePresence>
      {hasPending && pendingMatch && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6 rounded-[16px] p-5 relative overflow-hidden"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.25)',
            animation: 'amberPulse 2s ease infinite',
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={dismissPendingReport}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* LEFT SIDE */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {/* Top label */}
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertTriangle size={16} style={{ color: '#FBBF24' }} />
                </motion.div>
                <span
                  className="font-mono text-[11px] uppercase tracking-[3px]"
                  style={{ color: '#FBBF24' }}
                >
                  MATCH REPORT PENDING
                </span>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#FBBF24' }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>

              {/* Main message */}
              <p className="font-condensed font-semibold text-[18px] text-[var(--text-primary)] leading-tight">
                Complete your match report to unlock your progress
              </p>

              {/* Match details */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#FBBF24',
                  }}
                >
                  {sportEmoji[pendingMatch.sport]} {pendingMatch.sport.charAt(0).toUpperCase() + pendingMatch.sport.slice(1)}
                </span>
                <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                  {pendingMatch.eventName}
                </span>
                <span className="font-mono text-[12px] text-[var(--text-muted)]">
                  · {pendingMatch.daysAgo} days ago
                </span>
              </div>
            </div>

            {/* RIGHT SIDE — Buttons */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={dismissPendingReport}
                className="px-4 py-2 rounded-[10px] font-mono text-[13px] transition-all hover:bg-white/5"
                style={{
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: '#FBBF24',
                }}
              >
                Remind Me Later
              </button>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(251,191,36,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/app/clashhub/report/${pendingMatch.matchId}`)}
                className="flex items-center gap-2 px-5 py-2 rounded-[10px] font-condensed font-semibold text-[15px] transition-all"
                style={{ background: '#FBBF24', color: '#080808' }}
              >
                Complete Report <ArrowRight size={15} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
