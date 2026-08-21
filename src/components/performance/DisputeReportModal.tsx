import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Check, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReportDispute, type EventReportItem } from '@/services/eventReportService';
import { useAuthStore } from '@/store/authStore';

interface DisputeReportModalProps {
  report: EventReportItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeReportModal: React.FC<DisputeReportModalProps> = ({
  report,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [selectedField, setSelectedField] = useState('Goals / Points');
  const [selectedReason, setSelectedReason] = useState('Statistic was over-reported');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic field options based on sport
  const getFieldOptions = () => {
    switch (report.sport) {
      case 'football':
        return ['Goals', 'Assists', 'Passes', 'Tackles', 'Saves', 'Overall Rating', 'Match Result', 'Other'];
      case 'cricket':
        return ['Runs', 'Wickets', 'Catches', 'Balls Faced', 'Overall Rating', 'Match Result', 'Other'];
      case 'basketball':
        return ['Points', 'Assists', 'Rebounds', 'Steals', 'Blocks', 'Overall Rating', 'Match Result', 'Other'];
      case 'running':
        return ['Finish Time', 'Distance', 'Position', 'Overall Rating', 'Other'];
      default:
        return ['Contribution', 'Match Rating', 'MVP Status', 'Match Result', 'Other'];
    }
  };

  const REASON_OPTIONS = [
    'Statistic was over-reported (higher than actual game)',
    'Statistic was under-reported (lower than actual game)',
    'Player was not in the active lineup for this game',
    'Incorrect match outcome / result recorded',
    'Unsportsmanlike or fabricated performance telemetry',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be signed in to submit a dispute.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReportDispute(
        report.eventId,
        report.id,
        report.userId,
        user.id,
        selectedField,
        selectedReason,
        description.trim() || undefined
      );

      toast.success('Dispute submitted! The event host has been notified for review.');
      onSuccess();
    } catch (err: any) {
      console.error('[DisputeReportModal] Error:', err);
      toast.error(err?.message || 'Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-md w-full bg-[#0E0E0E] border border-amber-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                // PEER DISPUTE PROTOCOL
              </span>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider">
                Report Inaccurate Stats
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player Being Reported */}
        <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">REPORTED ATHLETE</span>
            <span className="font-sans font-bold text-white text-sm">{report.userName || 'Athlete'}</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 font-mono text-[10px] text-[#CCFF00] font-bold uppercase">
            {report.sport}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question 1: What is incorrect? */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-text-secondary uppercase tracking-wider">
              1. What field is incorrect?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {getFieldOptions().map(field => (
                <button
                  type="button"
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    selectedField === field
                      ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-[#161616] text-text-secondary border border-white/10 hover:border-amber-400/40 hover:text-white'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Reason */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-text-secondary uppercase tracking-wider">
              2. Select reason:
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-none">
              {REASON_OPTIONS.map(reason => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl font-sans text-xs transition-all flex items-start gap-2 cursor-pointer ${
                    selectedReason === reason
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 font-semibold'
                      : 'bg-[#141414] border border-white/5 text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                    selectedReason === reason ? 'border-amber-400 bg-amber-400' : 'border-white/20'
                  }`}>
                    {selectedReason === reason && <Check size={10} className="text-black stroke-[3]" />}
                  </span>
                  <span>{reason}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Explanation */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-text-secondary uppercase tracking-wider">
              3. Tell the host what happened (optional):
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. He scored 2 goals instead of 4 in the second half..."
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 font-sans text-xs text-white placeholder-text-muted outline-none focus:border-amber-400 resize-none transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
