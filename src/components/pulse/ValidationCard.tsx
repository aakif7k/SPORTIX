import React, { useState } from 'react';
import type { Athlete } from '../../types/pulse.types';
import { RoleBadge } from './RoleBadge';
import { Check, Edit3, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationCardProps {
  athlete: Athlete;
  statsSummary: string;
  onVote: (userId: string, vote: 'confirm' | 'partial' | 'dispute', reason?: string) => void;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  athlete,
  statsSummary,
  onVote,
}) => {
  const [vote, setVote] = useState<'confirm' | 'partial' | 'dispute' | null>(null);
  const [partialReason, setPartialReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const handleSelectVote = (v: 'confirm' | 'partial' | 'dispute') => {
    setVote(v);
    if (v === 'confirm') {
      onVote(athlete.uid, 'confirm');
    }
  };

  const handlePartialSubmit = () => {
    if (partialReason.trim()) {
      onVote(athlete.uid, 'partial', partialReason);
    }
  };

  const handleDisputeSubmit = (reason: string) => {
    setDisputeReason(reason);
    onVote(athlete.uid, 'dispute', reason);
  };

  const disputeOptions = [
    'Stats are highly inflated',
    'Did not play in this match',
    'Incorrect position details',
    'Unsportsmanlike conduct reporting',
  ];

  return (
    <div className="rounded-[16px] p-5 bg-surface border border-border-muted/50 space-y-4 shadow-card hover:shadow-hover transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={athlete.avatar} alt={athlete.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h4 className="font-condensed text-[16px] font-bold text-text-primary">{athlete.name}</h4>
            <div className="flex gap-1.5 mt-1 items-center">
              <span className="font-mono text-[9px] text-volt font-bold">#{athlete.position}</span>
              {athlete.role && athlete.role !== 'member' && (
                <RoleBadge role={athlete.role} />
              )}
            </div>
          </div>
        </div>
        <div className="group relative">
          <HelpCircle size={14} className="text-text-secondary cursor-pointer hover:text-text-primary" />
          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-elevated border border-border-muted/50 rounded-[8px] text-[9px] font-mono text-text-secondary hidden group-hover:block z-30 shadow-card">
            80%+ confirms → Accepted<br/>
            50–79% → Partially weighted<br/>
            Below 50% → Flagged
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-[12px] bg-elevated border border-border-muted/30 font-mono text-[11px] text-text-secondary">
        <span className="text-[10px] text-text-primary block mb-1 font-bold">SUBMITTED PERFORMANCE:</span>
        {statsSummary}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleSelectVote('confirm')}
          className={`h-9 rounded-[10px] flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold transition-all ${
            vote === 'confirm'
              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]'
              : 'bg-elevated text-text-secondary border border-border-muted/50 hover:bg-hover hover:text-text-primary'
          }`}
        >
          <Check size={12} /> Confirm
        </button>

        <button
          onClick={() => handleSelectVote('partial')}
          className={`h-9 rounded-[10px] flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold transition-all ${
            vote === 'partial'
              ? 'bg-[#eab308]/20 text-[#eab308] border border-[#eab308]'
              : 'bg-elevated text-text-secondary border border-border-muted/50 hover:bg-hover hover:text-text-primary'
          }`}
        >
          <Edit3 size={12} /> Partial
        </button>

        <button
          onClick={() => handleSelectVote('dispute')}
          className={`h-9 rounded-[10px] flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold transition-all ${
            vote === 'dispute'
              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]'
              : 'bg-elevated text-text-secondary border border-border-muted/50 hover:bg-hover hover:text-text-primary'
          }`}
        >
          <X size={12} /> Dispute
        </button>
      </div>

      <AnimatePresence mode="wait">
        {vote === 'partial' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2"
          >
            <input
              type="text"
              placeholder="What's inaccurate?"
              value={partialReason}
              onChange={(e) => setPartialReason(e.target.value)}
              className="w-full bg-base border border-border-muted/50 rounded-[10px] px-3.5 py-2 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt"
            />
            <button
              onClick={handlePartialSubmit}
              className="w-full py-1.5 rounded-[8px] bg-elevated border border-border-muted/50 text-text-primary hover:bg-hover font-mono text-[10px] transition-colors"
            >
              Submit Note
            </button>
          </motion.div>
        )}

        {vote === 'dispute' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2"
          >
            <span className="font-mono text-[9px] text-text-secondary block">Select dispute reason:</span>
            <div className="grid grid-cols-1 gap-1">
              {disputeOptions.map((o, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDisputeSubmit(o)}
                  className={`py-2 px-3 text-left font-mono text-[10px] rounded-[8px] border transition-colors ${
                    disputeReason === o
                      ? 'bg-[#ef4444]/15 border-[#ef4444] text-[#ef4444]'
                      : 'bg-base border-border-muted/30 text-text-secondary hover:bg-elevated hover:text-text-primary'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
