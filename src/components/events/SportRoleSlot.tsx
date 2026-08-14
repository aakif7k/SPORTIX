/**
 * SportRoleSlot.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal sport-agnostic Role Slot component.
 * Displays filled/required counts, progress bar, status (OPEN/PARTIAL/FULL),
 * and remaining space for the role.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import type { RoleSlotDefinition } from '../../services/roleAllocationEngine';

interface SportRoleSlotProps {
  slot: RoleSlotDefinition;
  sportName?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const SportRoleSlot: React.FC<SportRoleSlotProps> = ({
  slot,
  sportName: _sportName,
  isInteractive = false,
  isSelected = false,
  onSelect,
}) => {
  const { role_name, required_count, filled_count, remaining_space, status } = slot;
  const pct = Math.min(100, Math.round((filled_count / Math.max(1, required_count)) * 100));

  // Determine badge styling based on slot status
  const getStatusBadge = () => {
    switch (status) {
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            FULL
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-300" />
            {remaining_space} NEEDED
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Users className="w-3 h-3 text-indigo-300" />
            {remaining_space} OPEN
          </span>
        );
    }
  };

  const getProgressBarColor = () => {
    if (status === 'FULL') return 'from-emerald-500 to-teal-400';
    if (status === 'PARTIAL') return 'from-amber-500 to-orange-400';
    return 'from-indigo-500 to-primary';
  };

  return (
    <motion.div
      whileHover={isInteractive ? { scale: 1.02, y: -2 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      onClick={isInteractive ? onSelect : undefined}
      className={`relative p-3.5 rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-primary/15 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/40'
          : status === 'FULL'
          ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60'
          : status === 'PARTIAL'
          ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
          : 'bg-card/70 border-white/10 hover:border-white/20'
      } ${isInteractive ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">{role_name}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress & counts */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Slots: <strong className="text-foreground">{filled_count}</strong> / {required_count}
          </span>
          <span className="font-medium text-foreground/80">
            {status === 'FULL' ? '100%' : `${pct}% filled`}
          </span>
        </div>

        {/* Dynamic Animated Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${getProgressBarColor()}`}
          />
        </div>
      </div>

      {/* Remaining Space for Role Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Remaining Space:</span>
        <span
          className={`font-semibold ${
            remaining_space === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {remaining_space === 0 ? 'No slots remaining' : `${remaining_space} space${remaining_space > 1 ? 's' : ''} left`}
        </span>
      </div>
    </motion.div>
  );
};
