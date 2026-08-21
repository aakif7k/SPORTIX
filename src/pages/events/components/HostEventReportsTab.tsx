import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, AlertTriangle, Edit3, Search, FileText, ChevronRight,
  Loader2, RefreshCw, X, MessageSquare, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getEventReportsForHost,
  verifyPlayerReport,
  requestReportCorrection,
  rectifyPlayerReport,
  subscribeToEventReports,
  type ReportCompletionMatrix,
  type AuditTrailEntry
} from '@/services/eventReportService';

interface HostEventReportsTabProps {
  eventId: string;
  hostId: string;
}

export const HostEventReportsTab: React.FC<HostEventReportsTabProps> = ({
  eventId,
  hostId,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrix, setMatrix] = useState<ReportCompletionMatrix | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Active Report Details / Actions Modal
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [showRectifyModal, setShowRectifyModal] = useState(false);
  const [rectifyReason, setRectifyReason] = useState('');
  const [editableStats, setEditableStats] = useState<Record<string, number>>({});
  const [editableRating, setEditableRating] = useState<number>(7);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async (isSilent = false) => {
    if (!eventId || !hostId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getEventReportsForHost(eventId, hostId);
      setMatrix(data.matrix);
      setParticipants(data.participants);
    } catch (err: any) {
      console.error('[HostEventReportsTab] Load error:', err);
      toast.error(err?.message || 'Failed to load event match reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, hostId]);

  useEffect(() => {
    loadData();
    // Subscribe to realtime updates
    const unsubscribe = subscribeToEventReports(eventId, () => {
      loadData(true);
    });
    return () => unsubscribe();
  }, [loadData, eventId]);

  // ── Host Actions ──────────────────────────────────────────────────────────
  const handleVerify = async (reportId: string) => {
    if (!reportId) return;
    setIsProcessingAction(true);
    try {
      await verifyPlayerReport(eventId, reportId, hostId);
      toast.success('Match report approved & verified! Official stats updated ✓');
      setSelectedParticipant(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSendCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant?.report?.id || !correctionNote.trim()) {
      toast.error('Please enter a note for the athlete.');
      return;
    }

    setIsProcessingAction(true);
    try {
      await requestReportCorrection(
        eventId,
        selectedParticipant.report.id,
        hostId,
        correctionNote.trim()
      );
      toast.success('Correction request dispatched to athlete.');
      setShowCorrectionModal(false);
      setCorrectionNote('');
      setSelectedParticipant(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request correction.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenRectify = (participant: any) => {
    const report = participant.report;
    if (!report) return;

    const initialStats: Record<string, number> = {};
    Object.entries(report.stats || {}).forEach(([k, v]) => {
      if (typeof v === 'number') initialStats[k] = v;
    });

    setEditableStats(initialStats);
    setEditableRating(report.matchRating || 7);
    setRectifyReason('');
    setShowRectifyModal(true);
  };

  const handleSaveRectification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant?.report?.id) return;

    setIsProcessingAction(true);
    try {
      await rectifyPlayerReport(
        eventId,
        selectedParticipant.report.id,
        hostId,
        editableStats,
        editableRating,
        rectifyReason.trim() || 'Host telemetry verification.'
      );
      toast.success('Match report rectified & official audit trail recorded!');
      setShowRectifyModal(false);
      setSelectedParticipant(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to rectify report.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── Filtered Participants ─────────────────────────────────────────────────
  const filteredParticipants = participants.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.userName.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.teamName && p.teamName.toLowerCase().includes(q)) ||
      (p.userPosition && p.userPosition.toLowerCase().includes(q)) ||
      (p.userId && p.userId.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'SUBMITTED') return p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW';
    if (statusFilter === 'DISPUTED') return p.status === 'DISPUTED';
    if (statusFilter === 'VERIFIED') return p.status === 'VERIFIED' || p.status === 'RECTIFIED';
    if (statusFilter === 'PENDING') return p.status === 'NOT_SUBMITTED';
    return true;
  });

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3 text-white">
        <Loader2 size={28} className="animate-spin text-[#CCFF00]" />
        <p className="font-mono text-xs text-text-muted">Loading Match Reports & Verification Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── COMPLETION MATRIX HUD ── */}
      {matrix && (
        <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/10 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest block">
                  // HOST MATCH REPORT MATRIX
                </span>
                {refreshing && <RefreshCw size={12} className="animate-spin text-text-muted" />}
              </div>
              <h2 className="font-sans font-black text-xl text-white uppercase tracking-wider">
                Post-Event Telemetry & Review
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-secondary">
                Completion: <strong className="text-[#CCFF00] font-black">{matrix.completionPercentage}%</strong>
              </span>
              <button
                onClick={() => loadData(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all cursor-pointer"
                title="Refresh Matrix"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#181818] h-2.5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matrix.completionPercentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#88FF00] to-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.5)]"
            />
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#121212] border border-white/5 font-mono">
              <span className="text-[10px] text-text-muted uppercase block">Total Athletes</span>
              <span className="text-lg font-black text-white">{matrix.totalParticipants}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121212] border border-white/5 font-mono">
              <span className="text-[10px] text-text-muted uppercase block">Submitted</span>
              <span className="text-lg font-black text-[#CCFF00]">{matrix.submittedCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121212] border border-white/5 font-mono">
              <span className="text-[10px] text-text-muted uppercase block">Verified ✓</span>
              <span className="text-lg font-black text-emerald-400">{matrix.verifiedCount + matrix.rectifiedCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121212] border border-white/5 font-mono">
              <span className="text-[10px] text-text-muted uppercase block">Disputed / Review</span>
              <span className="text-lg font-black text-amber-400">{matrix.disputedCount + matrix.correctionRequestedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROLS & FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, @username, or team..."
            className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 font-mono text-xs text-white placeholder-text-muted outline-none focus:border-[#CCFF00]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'SUBMITTED', label: 'Needs Review' },
            { id: 'DISPUTED', label: 'Disputed' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'PENDING', label: 'Not Submitted' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                  : 'bg-[#121212] text-text-secondary border border-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PARTICIPANTS ROSTER ── */}
      <div className="space-y-3">
        {filteredParticipants.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0E0E0E] border border-white/10 space-y-2">
            <FileText size={24} className="text-text-muted mx-auto" />
            <p className="font-sans font-bold text-sm text-white">No Match Reports Found</p>
            <p className="font-mono text-xs text-text-muted">No athletes match the current search or filter criteria.</p>
          </div>
        ) : (
          filteredParticipants.map(participant => {
            const report = participant.report;
            const hasDisputes = report && report.disputeCount > 0;
            const initial = (participant.userName || 'A').charAt(0).toUpperCase();

            return (
              <motion.div
                key={participant.userId}
                layout
                className="p-4 sm:p-5 rounded-2xl bg-[#0E0E0E] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Athlete Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-mono text-sm font-black text-[#CCFF00] overflow-hidden flex-shrink-0 shadow-inner">
                    {participant.userAvatar ? (
                      <img src={participant.userAvatar} alt={participant.userName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-black text-sm text-white uppercase tracking-wide">
                        {participant.userName}
                      </span>
                      {participant.username && (
                        <span className="font-mono text-xs text-[#CCFF00] font-bold">
                          {participant.username}
                        </span>
                      )}
                      {report?.isMvp && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold">
                          👑 MVP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted mt-0.5">
                      {participant.teamName && <span className="text-[#00D4FF] font-semibold">{participant.teamName} •</span>}
                      {participant.userPosition && <span>Pos: {participant.userPosition} •</span>}
                      <span>ID: {participant.userId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Summary Pill */}
                {report ? (
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    {Object.entries(report.stats || {}).slice(0, 3).map(([key, val]) => (
                      <span key={key} className="px-2.5 py-1 rounded-xl bg-[#161616] border border-white/5 text-text-secondary capitalize">
                        {key}: <strong className="text-white">{String(val)}</strong>
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-xl bg-[#161616] border border-white/5 text-text-secondary">
                      Rating: <strong className="text-[#CCFF00]">{report.matchRating}/10</strong>
                    </span>
                    {hasDisputes && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
                        <AlertTriangle size={11} /> {report.disputeCount} Dispute{report.disputeCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="font-mono text-xs text-text-muted italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
                    <span>Awaiting player submission (+40 Pulse reward queued)</span>
                  </div>
                )}

                {/* Status & Review CTA */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider ${
                    participant.status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : participant.status === 'RECTIFIED'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : participant.status === 'DISPUTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : participant.status === 'CORRECTION_REQUESTED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : participant.status === 'SUBMITTED'
                      ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                      : 'bg-white/5 text-text-muted border border-white/5'
                  }`}>
                    {participant.status.replace('_', ' ')}
                  </span>

                  {report && (
                    <button
                      onClick={() => setSelectedParticipant(participant)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#CCFF00] hover:text-black text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Review</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── REPORT DETAIL & HOST ACTIONS MODAL ── */}
      <AnimatePresence>
        {selectedParticipant && selectedParticipant.report && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full bg-[#0E0E0E] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest block">
                    // ATHLETE MATCH TELEMETRY
                  </span>
                  <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                    {selectedParticipant.userName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-1.5 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dispute Alert if any */}
              {selectedParticipant.report.disputeCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block uppercase">
                      ⚠️ {selectedParticipant.report.disputeCount} Peer Dispute(s) Logged
                    </span>
                    <p className="font-sans text-[11px] text-text-secondary mt-0.5">
                      Participants in this match reported discrepancies in this athlete's telemetry. Review closely or rectify stats.
                    </p>
                  </div>
                </div>
              )}

              {/* Performance Stats Grid */}
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted block">
                  Reported Sport Metrics:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(selectedParticipant.report.stats || {}).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-2xl bg-[#141414] border border-white/5 font-mono">
                      <span className="text-[10px] text-text-muted uppercase block capitalize">{key}</span>
                      <span className="text-base font-black text-white">{String(val)}</span>
                    </div>
                  ))}
                  <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 font-mono">
                    <span className="text-[10px] text-text-muted uppercase block">Match Rating</span>
                    <span className="text-base font-black text-[#CCFF00]">{selectedParticipant.report.matchRating}/10</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 font-mono">
                    <span className="text-[10px] text-text-muted uppercase block">Pulse Earned</span>
                    <span className="text-base font-black text-[#00D4FF]">+{selectedParticipant.report.pulseEarned} ⚡</span>
                  </div>
                </div>
              </div>

              {/* Audit Trail if rectified */}
              {selectedParticipant.report.auditTrail && selectedParticipant.report.auditTrail.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <History size={13} className="text-[#00D4FF]" /> Rectification Audit Trail:
                  </span>
                  <div className="space-y-2 max-h-32 overflow-y-auto font-mono text-[11px] text-text-secondary">
                    {selectedParticipant.report.auditTrail.map((entry: AuditTrailEntry, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#141414] border border-white/5 space-y-1">
                        <div className="flex justify-between text-text-muted text-[9px]">
                          <span>By: {entry.changed_by_name || 'Host'}</span>
                          <span>{new Date(entry.changed_at).toLocaleString()}</span>
                        </div>
                        <p className="text-white text-xs">Reason: {entry.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Host Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => handleVerify(selectedParticipant.report.id)}
                  className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setShowCorrectionModal(true)}
                  className="py-3 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <MessageSquare size={14} />
                  <span>Correction</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => handleOpenRectify(selectedParticipant)}
                  className="py-3 px-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Edit3 size={14} />
                  <span>Rectify</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CORRECTION REQUEST MODAL ── */}
      <AnimatePresence>
        {showCorrectionModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#0E0E0E] border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-sans font-black text-base text-white uppercase">
                  Request Report Correction
                </span>
                <button onClick={() => setShowCorrectionModal(false)} className="text-text-muted hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendCorrection} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-text-secondary uppercase">
                    Correction Note for {selectedParticipant?.userName}:
                  </label>
                  <textarea
                    value={correctionNote}
                    onChange={e => setCorrectionNote(e.target.value)}
                    rows={3}
                    required
                    placeholder="e.g. Please verify your assists count, match log indicates 1 assist."
                    className="w-full bg-[#141414] border border-white/10 rounded-2xl p-3 font-sans text-xs text-white placeholder-text-muted outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingAction}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingAction ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                    <span>Send Request</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── RECTIFY / EDIT STATS MODAL ── */}
      <AnimatePresence>
        {showRectifyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-[#0E0E0E] border border-cyan-500/30 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="font-mono text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">
                    // AUDITED HOST OVERRIDE
                  </span>
                  <h3 className="font-sans font-black text-base text-white uppercase">
                    Rectify Player Telemetry
                  </h3>
                </div>
                <button onClick={() => setShowRectifyModal(false)} className="text-text-muted hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveRectification} className="space-y-4">
                {/* Editable numeric stats */}
                <div className="space-y-2">
                  <span className="font-mono text-xs text-text-secondary uppercase">Adjust Statistics:</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(editableStats).map(([k, val]) => (
                      <div key={k} className="p-2.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                        <label className="font-mono text-[10px] text-text-muted uppercase capitalize block">{k}</label>
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={e => setEditableStats({ ...editableStats, [k]: Number(e.target.value) })}
                          className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 font-mono text-xs text-white font-bold outline-none focus:border-cyan-400"
                        />
                      </div>
                    ))}
                    <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                      <label className="font-mono text-[10px] text-text-muted uppercase block">Rating (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        value={editableRating}
                        onChange={e => setEditableRating(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 font-mono text-xs text-cyan-400 font-bold outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason for rectification */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-text-secondary uppercase">
                    Audit Log Reason:
                  </label>
                  <input
                    type="text"
                    required
                    value={rectifyReason}
                    onChange={e => setRectifyReason(e.target.value)}
                    placeholder="e.g. Adjusted goals based on official referee match sheet."
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 font-sans text-xs text-white placeholder-text-muted outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowRectifyModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingAction}
                    className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingAction ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                    <span>Save & Rectify</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
