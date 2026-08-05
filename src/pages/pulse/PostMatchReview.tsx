import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { useAuth } from '@/context/AuthContext';
import { usePendingReport } from '@/hooks/usePendingReport';
import { useMatchStats, usePostMatchActions } from '@/hooks/usePostMatch';
import { useSubmitReport } from '@/hooks/useCareer';
import { StatSubmissionForm } from '../../components/pulse/StatSubmissionForm';
import { ValidationCard } from '../../components/pulse/ValidationCard';
import { SquadRetentionVote } from '../../components/pulse/SquadRetentionVote';
import { PulseRing } from '../../components/pulse/PulseRing';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

export const PostMatchReview: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep, setStep, setUserStats, setRetentionVote, resetFlow, recordVote,
  } = useMatchStore();

  const { user } = useAuth();
  const { pendingMatch } = usePendingReport();
  const matchId = pendingMatch?.matchId;
  const { teammates, loading: teammatesLoading } = useMatchStats(matchId, user?.id);
  const { submitReport, submitting } = useSubmitReport();
  const {
    snapshotPulse, validateStat, finishValidation, voteRetention,
    pulseBefore, pulseAfter, deltas,
  } = usePostMatchActions(matchId);

  // The score animation ran from a hardcoded 721 to a hardcoded 732 for everyone.
  // It now animates between the athlete's real Pulse before and after the match.
  const [animatedScore, setAnimatedScore] = useState<number | null>(null);
  const [showDeltas, setShowDeltas] = useState(false);

  useEffect(() => {
    if (currentStep !== 4 || !pulseBefore || !pulseAfter) return;

    const timer1 = setTimeout(() => setShowDeltas(true), 500);
    let frame = 0;

    const timer2 = setTimeout(() => {
      const from = pulseBefore.total_pulse;
      const to = pulseAfter.total_pulse;
      const duration = 1000;
      const startTime = performance.now();

      const update = (now: number) => {
        const pct = Math.min((now - startTime) / duration, 1);
        setAnimatedScore(Math.round(from + pct * (to - from)));
        if (pct < 1) frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      // The loop outlived the step change before, so leaving and returning left
      // two of them running.
      if (frame) cancelAnimationFrame(frame);
    };
  }, [currentStep, pulseBefore, pulseAfter]);

  // A review needs a match. This used to render a fixture instead, so the screen
  // always had something to show even when there was nothing to review.
  if (!matchId) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          Nothing to review
        </p>
        <p className="font-mono text-[11px] text-text-secondary">
          You have no completed match waiting on a report.
        </p>
        <button
          onClick={() => navigate('/pulse')}
          className="px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[11px] font-bold uppercase"
        >
          Back to Pulse
        </button>
      </div>
    );
  }

  const handleStatsSubmit = async (stats: Record<string, string | number | boolean>) => {
    if (submitting) return;
    setUserStats(stats);
    // Snapshot Pulse before the submission so step 4 can show what changed.
    await snapshotPulse();
    try {
      await submitReport({
        matchId,
        sport: (pendingMatch?.sport ?? user?.sport ?? 'football') as never,
        stats,
        matchRating: Number(stats.matchRating ?? stats.rating ?? 7),
        isMvp: Boolean(stats.isMvp ?? stats.mvp ?? false),
      });
      setStep(3);
    } catch {
      // Surfaced by the mutation; the form keeps what was entered.
    }
  };

  const handleTeammateVote = (
    statId: string, status: 'confirm' | 'partial' | 'dispute', reason?: string,
  ) => {
    recordVote(statId, status, reason);
    // Each vote is recorded as it is cast, which is what re-weights the teammate's
    // Pulse award server-side.
    void validateStat({ statId, vote: status, reason });
  };

  const handleValidationSubmit = async () => {
    await finishValidation();
    setStep(4);
  };

  const handleRetentionSubmit = async (vote: 'definitely' | 'maybe' | 'no') => {
    setRetentionVote(vote);
    // One vote per teammate; the screen collects a single overall answer, so it is
    // recorded against each teammate who played.
    for (const teammate of teammates) {
      await voteRetention({ targetId: teammate.user_id, vote }).catch(() => {});
    }
    resetFlow();
    navigate('/pulse');
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center">
      
      {/* Steps indicator */}
      <div className="flex justify-between items-center mb-10 max-w-md mx-auto w-full border-b border-border-muted pb-4 font-mono text-[9px] text-text-secondary">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-bold ${
              currentStep >= s ? 'bg-volt border-volt text-volt-text shadow-glow-volt-sm' : 'border-border-muted text-text-secondary'
            }`}>
              {s}
            </span>
            <span className={currentStep === s ? 'text-text-primary font-bold' : ''}>
              {['Result', 'Stats', 'Validate', 'Rating', 'Retention'][s - 1]}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* Step 1: Match Complete Screen */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-center"
          >
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">MATCH DEBRIEF PROTOCOL</span>
              <h1 className="font-display text-[64px] sm:text-[72px] text-text-primary leading-none tracking-wide">MATCH COMPLETE</h1>
              <p className="font-mono text-[12px] text-text-secondary uppercase">
                {pendingMatch?.eventName}
                {pendingMatch?.date ? ` · ${new Date(pendingMatch.date).toLocaleDateString()}` : ''}
              </p>
            </div>

            {/* The banner used to declare a "VICTORY OVER APEX RANGERS" with a
                hardcoded W, an invented +8% chemistry delta, a fixed MVP, and
                "9 / 15 players want to play again" — none of which the flow knows
                before the report is filed. The debrief names the match and says
                what happens next instead of asserting an outcome. */}
            <div className="inline-flex flex-col items-center justify-center p-8 rounded-[24px] bg-accent-surface border border-accent/25 shadow-glow-volt-lg">
              <Star size={44} className="text-accent" fill="var(--accent)" />
              <span className="font-mono text-[12px] text-accent font-bold mt-3 uppercase tracking-widest text-center">
                {pendingMatch?.eventName ?? 'Match complete'}
              </span>
              {typeof pendingMatch?.daysAgo === 'number' && (
                <span className="font-mono text-[10px] text-text-secondary mt-1">
                  {pendingMatch.daysAgo === 0
                    ? 'Played today'
                    : `Played ${pendingMatch.daysAgo} day${pendingMatch.daysAgo === 1 ? '' : 's'} ago`}
                </span>
              )}
            </div>

            <div className="max-w-xl mx-auto bg-elevated rounded-[16px] p-4 font-mono text-[11px] text-text-secondary text-left space-y-1.5">
              <p>1. Log your stats for this match.</p>
              <p>2. Confirm what your teammates logged — three confirmations validate a line.</p>
              <p>3. Your Pulse updates once the squad agrees.</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full max-w-xl mx-auto py-3.5 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[15px] tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5 uppercase"
            >
              Submit Your Stats <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Step 2: Stat Submission Form */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h2 className="font-display text-[40px] text-text-primary leading-none">YOUR PERFORMANCE</h2>
              <p className="font-mono text-[11px] text-text-secondary">Stats are verified by teammate consensus. Input accurately.</p>
            </div>
            
            <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card">
              <StatSubmissionForm sport="Football" onSubmit={handleStatsSubmit} />
            </div>
          </motion.div>
        )}

        {/* Step 3: Teammate Validation */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h2 className="font-display text-[40px] text-text-primary leading-none">VALIDATE TEAMMATES</h2>
              <p className="font-mono text-[11px] text-text-secondary">Verify and confirm logs submitted by your teammates.</p>
            </div>

            <div className="space-y-4">
              {teammatesLoading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="h-24 rounded-[16px] bg-elevated animate-shimmer" />
                ))
              ) : teammates.length === 0 ? (
                <div className="p-6 rounded-[16px] bg-elevated border border-border-muted text-center font-mono text-[11px] text-text-secondary">
                  No teammate has logged this match yet. You can come back to confirm
                  their stats once they do.
                </div>
              ) : teammates.map((teammate) => (
                <ValidationCard
                  key={teammate.$id}
                  athlete={{
                    uid: teammate.user_id,
                    name: teammate.full_name || 'Athlete',
                    avatar: teammate.avatar_url ?? '',
                    sport: teammate.sport,
                    position: teammate.position ?? '',
                    pulseScore: Math.round(teammate.pulse_score),
                    tier: teammate.tier as never,
                    role: 'member' as const,
                  }}
                  statsSummary={
                    Object.entries(teammate.stat_summary)
                      .map(([k, v]) => `${v} ${k}`)
                      .join(' · ')
                    + ` · Rating ${teammate.match_rating}/10`
                  }
                  onVote={(_uid, status, reason) =>
                    handleTeammateVote(teammate.$id, status, reason)}
                />
              ))}
            </div>

            <button
              onClick={handleValidationSubmit}
              className="w-full py-4 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[15px] tracking-wider hover:opacity-90 transition-transform uppercase"
            >
              Submit Validations →
            </button>
          </motion.div>
        )}

        {/* Step 4: Pulse Score Update Animation */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 text-center max-w-md mx-auto"
          >
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-volt tracking-widest font-bold uppercase">ALGORITHM STAGE FINALIZED</span>
              <h2 className="font-display text-[48px] leading-none uppercase text-text-primary">PULSE SCORE UPDATED</h2>
            </div>

            {/* Animated Category Deltas */}
            <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-3 font-mono text-[11px] text-left">
              <AnimatePresence>
                {showDeltas && (
                  <div className="space-y-2.5">
                    {deltas.length === 0 ? (
                      <p className="text-text-secondary">
                        No component moved on this match.
                      </p>
                    ) : deltas.map((item, idx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.4 }}
                        className="flex justify-between"
                      >
                        <span className="text-text-secondary">{item.label}</span>
                        <strong className={item.value >= 0 ? 'text-success' : 'text-danger'}>
                          {item.value >= 0 ? '+' : ''}{item.value}
                        </strong>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Score shift indicators */}
            <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-border-muted">
              <span className="font-display text-[32px] text-text-muted">
                {pulseBefore ? Math.round(pulseBefore.total_pulse) : '—'}
              </span>
              <ArrowRight size={24} className="text-text-secondary" />
              <span className="font-display text-[64px] text-accent shadow-glow-volt-sm px-4 py-1 rounded-2xl bg-accent-surface">
                {animatedScore ?? (pulseAfter ? Math.round(pulseAfter.total_pulse) : '—')}
              </span>
            </div>

            {/* Circle ring */}
            <div className="flex justify-center">
              <PulseRing
                score={animatedScore ?? Math.round(pulseAfter?.total_pulse ?? 0)}
                size="lg"
                animated={false}
              />
            </div>

            <button
              onClick={() => setStep(5)}
              className="w-full py-3.5 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[14px] uppercase tracking-wider hover:opacity-90"
            >
              Continue to Retention Vote →
            </button>
          </motion.div>
        )}

        {/* Step 5: Squad Retention Vote */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h2 className="font-display text-[40px] text-text-primary leading-none">PLAY AGAIN WITH THIS SQUAD?</h2>
              <p className="font-mono text-[11px] text-text-secondary">Your feedback decides future matchmaking alignment configurations.</p>
            </div>

            <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card">
              <SquadRetentionVote onVote={handleRetentionSubmit} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
