import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Zap, AlertTriangle,
  Activity, Star, Sparkles, ChevronRight, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import {
  getPlayerEventReport,
  submitPlayerMatchReport,
  type EventReportItem,
} from '@/services/eventReportService';
import { getPulseBreakdown } from '@/services/performanceService';
import { SportStatForm } from '@/components/performance/SportStatForm';
import { RatingSlider } from '@/components/performance/RatingSlider';
import { useMatchReportStore } from '@/store/matchReportStore';
import type { MatchResult, PerformanceSport } from '@/types/performance.types';

export const EventMatchReport: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingReport, setExistingReport] = useState<EventReportItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stepper: 0 = Match Result & Position, 1 = Performance Stats, 2 = Overall Rating & Review
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [matchResult, setMatchResult] = useState<MatchResult>('win');
  const [matchRating, setMatchRating] = useState<number>(7.5);
  const [isMvp, setIsMvp] = useState<boolean>(false);
  const [position, setPosition] = useState<string>('');

  // Reward screen state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardStats, setRewardStats] = useState<{ pulseEarned: number; ssrDelta: number } | null>(null);

  // Global store sync for sport stats
  const { sportStats, setStat, reset: resetStoreStats } = useMatchReportStore();

  const sport = (eventData?.sport || 'football').toLowerCase() as PerformanceSport;

  // ── Load Event & User Participant Status ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!eventId || !user?.id) return;

    setLoading(true);
    resetStoreStats();

    Promise.all([
      databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId).catch(() => null),
      getPlayerEventReport(eventId, user.id),
    ])
      .then(([eventDoc, playerReportData]) => {
        if (!isMounted) return;

        if (eventDoc) {
          setEventData(eventDoc);
        }

        if (playerReportData.report) {
          setExistingReport(playerReportData.report);
          setMatchResult(playerReportData.report.matchResult);
          setMatchRating(playerReportData.report.matchRating);
          setIsMvp(playerReportData.report.isMvp);
          setPosition(playerReportData.report.userPosition || '');

          // Populate stats from existing report
          Object.entries(playerReportData.report.stats || {}).forEach(([k, v]) => {
            setStat(k, v);
          });
        }
      })
      .catch(err => {
        console.error('[EventMatchReport] Load error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId, user?.id]);

  // ── Form Submission ───────────────────────────────────────────────────────
  const handleSubmitReport = async () => {
    if (!eventId || !user?.id) return;

    setIsSubmitting(true);
    try {
      const res = await submitPlayerMatchReport(eventId, user.id, {
        sport,
        matchResult,
        stats: sportStats,
        matchRating,
        position,
        isMvp,
      });

      setExistingReport(res.report);
      setRewardStats({
        pulseEarned: res.pulseEarned,
        ssrDelta: res.ssrDelta,
      });
      setShowRewardModal(true);
      toast.success('Match report submitted! +40 Pulse awarded ⚡');
    } catch (err: any) {
      console.error('[EventMatchReport] Submit error:', err);
      toast.error(err?.message || 'Failed to submit match report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { rows: pulseRows, total: livePulseTotal } = getPulseBreakdown(
    sport,
    sportStats,
    matchRating,
    isMvp,
    matchResult
  );

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-text-muted">Loading Match Telemetry Report...</p>
      </div>
    );
  }

  // Not Found or Not Participant
  if (!eventData) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertTriangle size={32} className="text-amber-400 mx-auto" />
        <h2 className="font-sans font-bold text-lg text-white">Event Not Found</h2>
        <button onClick={() => navigate('/app/events')} className="px-5 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-mono text-xs">
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-text-primary">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/app/events/${eventId}`)}
          className="p-2.5 rounded-xl bg-[#121212] border border-white/10 hover:border-[#CCFF00] text-text-secondary hover:text-white transition-all flex items-center gap-2 font-mono text-xs cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Event</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-wider">
          EVENT ID: {(eventId || '').slice(0, 8)}
        </span>
      </div>

      {/* ── EVENT CONTEXT BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0C0C0C] border border-white/10 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              <Trophy size={14} className="text-[#CCFF00]" />
              <span>POST-EVENT REPORTING</span>
              <span>•</span>
              <span className="text-[#00D4FF]">{eventData.sport}</span>
            </div>
            <h1 className="font-sans font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              {eventData.title}
            </h1>
            <p className="font-mono text-xs text-text-muted mt-1">
              Record your verified match telemetry, earn SPORTiX Pulse, and update your PlayerDNA.
            </p>
          </div>

          {/* Status Badge if already submitted */}
          {existingReport && (
            <div className="flex-shrink-0">
              <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md ${
                existingReport.validationStatus === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : existingReport.validationStatus === 'CORRECTION_REQUESTED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : existingReport.validationStatus === 'DISPUTED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : existingReport.validationStatus === 'RECTIFIED'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
              }`}>
                <Activity size={12} />
                {existingReport.validationStatus === 'VERIFIED'
                  ? 'VERIFIED BY HOST ✓'
                  : existingReport.validationStatus === 'CORRECTION_REQUESTED'
                  ? 'CORRECTION REQUESTED'
                  : existingReport.validationStatus === 'RECTIFIED'
                  ? 'RECTIFIED BY HOST'
                  : 'SUBMITTED (UNDER REVIEW)'}
              </span>
            </div>
          )}
        </div>

        {/* Host Correction Note Alert if applicable */}
        {existingReport?.validationStatus === 'CORRECTION_REQUESTED' && existingReport.correctionNote && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-mono text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 uppercase">
              <AlertTriangle size={14} className="text-amber-400" /> Host Feedback:
            </span>
            <p className="font-sans text-xs text-white leading-relaxed">
              "{existingReport.correctionNote}"
            </p>
            <p className="text-[10px] text-amber-300">
              Please adjust your performance metrics below and resubmit for verification.
            </p>
          </div>
        )}
      </div>

      {/* ── STEP PROGRESS BAR ── */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#0C0C0C] border border-white/10 font-mono text-xs">
        {[
          { step: 0, label: '1. Outcome & Role' },
          { step: 1, label: '2. Sport Telemetry' },
          { step: 2, label: '3. Rating & Review' },
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`py-2 px-3 rounded-xl font-bold transition-all text-center ${
              currentStep === s.step
                ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : currentStep > s.step
                ? 'bg-white/10 text-white'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── STEP CONTENT ── */}
      <div className="space-y-6">
        {/* STEP 0: MATCH OUTCOME & ROLE */}
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Match Result Selector */}
            <div className="p-6 rounded-3xl bg-[#0C0C0C] border border-white/10 space-y-4">
              <p className="font-mono text-xs uppercase tracking-widest text-[#CCFF00]">
                Q1: WHAT WAS THE FINAL MATCH OUTCOME?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'win', label: 'VICTORY', sub: 'Match Won', emoji: '🏆', color: '#4ADE80' },
                  { id: 'draw', label: 'DRAW', sub: 'Tied Battle', emoji: '🤝', color: '#FBBF24' },
                  { id: 'loss', label: 'DEFEAT', sub: 'Match Lost', emoji: '🛡️', color: '#F87171' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMatchResult(opt.id as MatchResult)}
                    className={`p-4 sm:p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                      matchResult === opt.id
                        ? 'bg-white/10 shadow-lg'
                        : 'bg-[#141414] border-white/5 hover:border-white/20'
                    }`}
                    style={{ borderColor: matchResult === opt.id ? opt.color : undefined }}
                  >
                    <span className="text-2xl sm:text-3xl block mb-1">{opt.emoji}</span>
                    <span className="font-sans font-black text-sm uppercase block text-white">
                      {opt.label}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted block mt-0.5">
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MVP Toggle */}
            <div className="p-5 rounded-3xl bg-[#0C0C0C] border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-sans font-bold text-sm text-white flex items-center gap-2">
                  <Star size={16} className="text-amber-400 fill-amber-400" /> Were you nominated Match MVP?
                </span>
                <p className="font-mono text-[10px] text-text-muted mt-0.5">
                  Awards +40 additional Pulse bonus upon host verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMvp(!isMvp)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  isMvp
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'bg-[#161616] text-text-secondary border border-white/10'
                }`}
              >
                {isMvp ? '👑 MVP YES' : 'NO'}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Continue to Telemetry</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 1: SPORT-SPECIFIC TELEMETRY */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-3xl bg-[#0C0C0C] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-widest text-[#CCFF00]">
                  Q2 & Q3: PERFORMANCE & TEAM CONTRIBUTION
                </p>
                <span className="font-mono text-[10px] text-text-muted capitalize">
                  Sport: {sport}
                </span>
              </div>

              {/* Dynamic Sport Form with Steppers */}
              <SportStatForm sport={sport} />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="px-5 py-3 rounded-2xl bg-[#141414] border border-white/10 font-mono text-xs text-text-secondary hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Review & Rate</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: OVERALL RATING & FINAL SUBMISSION */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Rating Slider */}
            <div className="p-6 rounded-3xl bg-[#0C0C0C] border border-white/10 space-y-4">
              <p className="font-mono text-xs uppercase tracking-widest text-[#CCFF00]">
                Q4: OVERALL PERFORMANCE RATING
              </p>
              <RatingSlider value={matchRating} onChange={setMatchRating} />
            </div>

            {/* Live Pulse Calculation Breakdown */}
            <div className="p-6 rounded-3xl bg-[#0C0C0C] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-sans font-bold text-xs uppercase text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-[#CCFF00]" /> Estimated Pulse Rewards
                </span>
                <span className="font-mono text-lg font-black text-[#CCFF00]">
                  +{livePulseTotal} PULSE
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs text-text-secondary">
                {pulseRows.map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{r.label}</span>
                    <span className="text-white font-bold">+{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-2xl bg-[#141414] border border-white/10 font-mono text-xs text-text-secondary hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(204,255,0,0.4)] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isSubmitting ? 'Submitting Report...' : 'Submit Match Report'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── CELEBRATION / REWARD MODAL ── */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#0E0E0E] border border-[#CCFF00]/40 rounded-3xl p-7 text-center space-y-6 shadow-[0_0_60px_rgba(204,255,0,0.3)]"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#CCFF00]/15 border border-[#CCFF00]/40 mx-auto flex items-center justify-center text-[#CCFF00] shadow-[0_0_30px_rgba(204,255,0,0.3)] animate-pulse">
                <Trophy size={40} />
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest block">
                  // TELEMETRY LOGGED
                </span>
                <h3 className="font-sans font-black text-2xl text-white uppercase tracking-tight">
                  Report Submitted!
                </h3>
                <p className="font-mono text-xs text-text-muted">
                  Your performance report is live and queued for host verification.
                </p>
              </div>

              {/* Pulse & SSR Badges */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#141414] border border-white/5 font-mono text-center">
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Pulse Awarded</span>
                  <span className="text-xl font-black text-[#CCFF00]">
                    +{rewardStats?.pulseEarned || 40}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">SSR Performance</span>
                  <span className="text-xl font-black text-[#00D4FF]">
                    +{rewardStats?.ssrDelta || 0.2}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowRewardModal(false);
                    navigate(`/app/events/${eventId}`);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                >
                  Return to Event
                </button>
                <button
                  onClick={() => {
                    setShowRewardModal(false);
                    navigate('/app/clashhub/history');
                  }}
                  className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-all cursor-pointer"
                >
                  View Match History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventMatchReport;
