/**
 * UniversalEventReadinessMatrix.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Universal Event Readiness Matrix & Team Formation Visualizer.
 * 100% Sport-Agnostic: dynamically renders teams and role slots for all 30 sports
 * from sportix_sport_roles with per-team role counters and remaining space for each role.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { DynamicEventRoleSelector } from './DynamicEventRoleSelector';
import {
  getEventReadiness,
  updateParticipantRole,
  type EventReadinessData,
} from '../../services/eventReadinessService';
import {
  type EventAllocationResult,
} from '../../services/roleAllocationEngine';
import { client, DATABASE_ID, COLLECTIONS } from '../../lib/appwrite';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface UniversalEventReadinessMatrixProps {
  eventId: string;
  sportName: string;
  maxCapacity?: number;
  onAutoSquadTrigger?: () => void;
  className?: string;
}

export const UniversalEventReadinessMatrix: React.FC<UniversalEventReadinessMatrixProps> = ({
  eventId,
  sportName,
  maxCapacity = 32,
  onAutoSquadTrigger,
  className = '',
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?.uid || '';

  const [loading, setLoading] = useState(true);
  const [readinessData, setReadinessData] = useState<EventReadinessData | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Fetch full readiness & allocation
  const loadReadiness = async () => {
    try {
      const data = await getEventReadiness(eventId, currentUserId);
      setReadinessData(data);
    } catch (err) {
      console.error('[UniversalEventReadinessMatrix] Failed to load readiness:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();

    // Appwrite Realtime subscription for event_participants
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.EVENT_PARTICIPANTS}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      // Recompute allocation dynamically on any participant change
      const payload: any = response.payload;
      if (payload && (payload.event_id === eventId || payload.eventId === eventId)) {
        loadReadiness();
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [eventId, currentUserId]);

  const allocation: EventAllocationResult | undefined = readinessData?.allocation;

  const handleRoleChangeSubmit = async () => {
    if (!selectedNewRole || updatingRole) return;
    setUpdatingRole(true);
    try {
      const res = await updateParticipantRole(eventId, selectedNewRole);
      if (res.success) {
        toast.success(`Role updated to ${selectedNewRole}! Team allocation recalculated.`);
        setIsChangingRole(false);
        await loadReadiness();
      } else {
        toast.error(res.message || 'Failed to update role');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating role');
    } finally {
      setUpdatingRole(false);
    }
  };

  if (loading && !readinessData) {
    return (
      <div className={`p-6 rounded-2xl bg-card/60 border border-white/10 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-white/10 rounded-md" />
          <div className="h-6 w-24 bg-white/10 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const missingRoles = allocation?.missing_roles_summary || [];
  const roleRemainingSpace = allocation?.role_remaining_space || {};
  const registeredCount = readinessData?.eligible_count ?? allocation?.registered_count ?? 0;
  const capacity = readinessData?.max_participants ?? maxCapacity;
  const overallPct = allocation?.overall_readiness_pct ?? 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── HEADER & OVERVIEW METRICS ────────────────────────────────────────── */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-card/90 via-card/60 to-primary/5 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/15 text-primary border border-primary/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Allocation
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Sport: <strong className="text-foreground">{readinessData?.sport || sportName}</strong>
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Universal Event Readiness Matrix
              </h2>
            </div>

            {/* AutoSquad Trigger or Live Sync Status */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => loadReadiness()}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-colors"
                title="Refresh Matrix"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {onAutoSquadTrigger && (
                <button
                  onClick={onAutoSquadTrigger}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg bg-gradient-to-r from-primary via-accent to-volt text-white shadow-primary/25 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Open AutoSquad Lab for this event"
                >
                  <Zap className="w-4 h-4 text-white animate-pulse" />
                  AutoSquad Lab
                </button>
              )}
            </div>
          </div>

          {/* ── METRICS GRID ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">
                Registered
              </span>
              <div className="text-xl font-extrabold text-foreground">
                {registeredCount} <span className="text-xs font-normal text-muted-foreground">/ {capacity}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">
                Teams Forming
              </span>
              <div className="text-xl font-extrabold text-foreground">
                {allocation?.teams.length || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider block mb-1">
                Complete Teams
              </span>
              <div className="text-xl font-extrabold text-emerald-300">
                {allocation?.completed_teams_count || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] text-amber-400 font-medium uppercase tracking-wider block mb-1">
                Partial Teams
              </span>
              <div className="text-xl font-extrabold text-amber-300">
                {allocation?.partial_teams_count || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[11px] text-purple-400 font-medium uppercase tracking-wider block mb-1">
                Waiting List
              </span>
              <div className="text-xl font-extrabold text-purple-300">
                {allocation?.waiting_players_count || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-primary/15 border border-primary/30">
              <span className="text-[11px] text-primary font-medium uppercase tracking-wider block mb-1">
                Readiness
              </span>
              <div className="text-xl font-extrabold text-primary">
                {overallPct}%
              </div>
            </div>
          </div>

          {/* ── OVERALL READINESS PROGRESS BAR ───────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Overall Squad Formation Progress
              </span>
              <span className="text-foreground">{overallPct}% Ready</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary via-teal-400 to-emerald-400 shadow-lg shadow-primary/20"
              />
            </div>
          </div>

          {/* ── CURRENT USER ASSIGNMENT BANNER ───────────────────────────────── */}
          {currentUserId && readinessData?.user_team_index && (
            <div className="mt-4 p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-black text-white text-sm shadow-md shadow-primary/30">
                  T{readinessData.user_team_index}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    You are assigned to Team {readinessData.user_team_index}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Role: <strong className="text-primary">{readinessData.user_role_assignment || 'Athlete'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsChangingRole(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-foreground text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
              >
                Change Role
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {currentUserId && readinessData?.user_is_waiting && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-amber-300">You are on the Waiting List</div>
                  <div className="text-[11px] text-muted-foreground">{readinessData.user_waiting_reason}</div>
                </div>
              </div>

              <button
                onClick={() => setIsChangingRole(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
              >
                Switch Role
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── REMAINING SPACE PER ROLE OVERVIEW ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-card/70 border border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          Role Availability & Remaining Space in Active Formations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(roleRemainingSpace).map(([rName, count]) => (
            <div
              key={rName}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                count > 0
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-muted-foreground'
              }`}
            >
              <span className="font-semibold text-xs text-foreground truncate">{rName}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-muted-foreground'
                }`}
              >
                {count > 0 ? `${count} open` : 'Filled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSING ROLES SHORTAGE ALERT ─────────────────────────────────────── */}
      {missingRoles.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-300 mb-1">Squad Role Shortages</h4>
            <p className="text-muted-foreground leading-relaxed">
              To complete active forming squads, the following roles are still needed:{' '}
              {missingRoles.map((m, i) => (
                <span key={i} className="font-semibold text-amber-200">
                  {m.team_name} needs {m.needed_count} {m.role_name}
                  {i < missingRoles.length - 1 ? ', ' : '.'}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}



      {/* ── CHANGE ROLE MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isChangingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-card border border-white/15 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Change Selected Role</h3>
                </div>
                <button
                  onClick={() => setIsChangingRole(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <DynamicEventRoleSelector
                sportName={readinessData?.sport || sportName}
                selectedRole={selectedNewRole || readinessData?.user_role_assignment}
                onSelectRole={(r) => setSelectedNewRole(r)}
                roleRemainingSpace={roleRemainingSpace}
              />

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsChangingRole(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChangeSubmit}
                  disabled={!selectedNewRole || updatingRole}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingRole ? 'Updating...' : 'Confirm Role Switch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
