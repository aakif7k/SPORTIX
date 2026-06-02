import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { usePulseStore } from '../../store/pulseStore';
import { StatSubmissionForm } from '../../components/pulse/StatSubmissionForm';
import { ValidationCard } from '../../components/pulse/ValidationCard';
import { SquadRetentionVote } from '../../components/pulse/SquadRetentionVote';
import { PulseRing } from '../../components/pulse/PulseRing';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

export const PostMatchReview: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentMatch,
    currentStep,
    setStep,
    setUserStats,
    submitValidation,
    setRetentionVote,
    resetFlow
  } = useMatchStore();

  const { addScoreDelta } = usePulseStore();

  // Score delta animation states
  const [animatedScore, setAnimatedScore] = useState(721);
  const [showDeltas, setShowDeltas] = useState(false);

  useEffect(() => {
    if (currentStep === 4) {
      // Trigger animations
      const timer1 = setTimeout(() => setShowDeltas(true), 500);

      const timer2 = setTimeout(() => {
        let current = 721;
        const target = 732;
        const duration = 1000;
        const startTime = performance.now();

        const update = (now: number) => {
          const elapsed = now - startTime;
          const pct = Math.min(elapsed / duration, 1);
          const val = Math.round(current + pct * (target - current));
          setAnimatedScore(val);

          if (pct < 1) {
            requestAnimationFrame(update);
          }
        };
        requestAnimationFrame(update);
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentStep]);

  if (!currentMatch) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        No active match review found.
      </div>
    );
  }

  // Teammates mock list for validation step
  const validationTeammates = [
    { uid: 'u1', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', sport: 'Football', position: 'ST', pulseScore: 847, tier: 'ELITE' as const, role: 'member' as const },
    { uid: 'u2', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', sport: 'Football', position: 'CM', pulseScore: 793, tier: 'ELITE' as const, role: 'strategist' as const },
    { uid: 'u3', name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', sport: 'Football', position: 'GK', pulseScore: 721, tier: 'CONTENDER' as const, role: 'member' as const },
  ];

  const teammateStats: Record<string, string> = {
    u1: 'Submitted: 2 Goals · 1 Assist · Match Rating 9/10',
    u2: 'Submitted: 0 Goals · 2 Assists · Match Rating 8/10',
    u3: 'Submitted: 6 Saves · 1 Conceded · Match Rating 8/10',
  };

  // Deltas for Step 4
  const deltasList = [
    { label: 'Match Performance', val: '+6', color: 'text-success' },
    { label: 'Team Chemistry', val: '+3', color: 'text-success' },
    { label: 'Reliability', val: '+2', color: 'text-success' },
    { label: 'Consistency', val: '-1', color: 'text-danger' },
    { label: 'Leadership', val: '+1', color: 'text-success' },
  ];

  const handleStatsSubmit = (stats: Record<string, string | number | boolean>) => {
    setUserStats(stats);
    setStep(3);
  };

  const handleValidationSubmit = () => {
    // Save final scores to store
    addScoreDelta({
      matchPerf: 6,
      consistency: -1,
      chemistry: 3,
      reliability: 2,
      activity: 1,
      leadership: 1
    }, 11);
    setStep(4);
  };

  const handleRetentionSubmit = (vote: 'definitely' | 'maybe' | 'no') => {
    setRetentionVote(vote);
    resetFlow();
    navigate(`/pulse/squad/${currentMatch.squadId}`);
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
              <p className="font-mono text-[12px] text-text-secondary uppercase">VS {currentMatch.opponentName} · {currentMatch.date}</p>
            </div>

            {/* Victory/Loss Banner */}
            <div className="inline-flex flex-col items-center justify-center p-8 rounded-[24px] bg-accent-surface border border-accent/25 shadow-glow-volt-lg">
              <span className="font-display text-[90px] text-accent leading-none tracking-wide">W</span>
              <span className="font-mono text-[12px] text-accent font-bold mt-2 uppercase tracking-widest">VICTORY OVER APEX RANGERS</span>
            </div>

            {/* Chem & Top Performer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex flex-col justify-center items-center">
                <span className="font-mono text-[9px] text-text-secondary">CHEMISTRY DELTA</span>
                <span className="font-display text-[28px] text-accent block mt-1">CHEMISTRY ↑ +8%</span>
              </div>
              <div className="p-4 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex items-center gap-3">
                <img src={currentMatch.topPerformer.avatar} alt="Top performer" className="w-10 h-10 rounded-full object-cover" />
                <div className="text-left">
                  <span className="font-mono text-[8px] text-text-secondary uppercase block flex items-center gap-1">
                    <Star size={10} className="text-accent" fill="var(--accent)" /> Match MVP
                  </span>
                  <strong className="font-condensed text-[14px] text-text-primary uppercase block mt-0.5">{currentMatch.topPerformer.name}</strong>
                  <span className="font-mono text-[10px] text-text-secondary block mt-0.5">{currentMatch.topPerformer.statsSummary}</span>
                </div>
              </div>
            </div>

            <div className="max-w-xl mx-auto bg-elevated rounded-[16px] p-4 font-mono text-[11px] text-text-secondary flex justify-between items-center">
              <span>9 / 15 players want to play again together</span>
              <div className="w-24 h-1.5 bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-volt" style={{ width: '60%' }} />
              </div>
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
              {validationTeammates.map((teammate) => (
                <ValidationCard
                  key={teammate.uid}
                  athlete={teammate}
                  statsSummary={teammateStats[teammate.uid]}
                  onVote={submitValidation}
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
                    {deltasList.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.4 }}
                        className="flex justify-between"
                      >
                        <span className="text-text-secondary">{item.label}</span>
                        <strong className={item.color}>{item.val}</strong>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Score shift indicators */}
            <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-border-muted">
              <span className="font-display text-[32px] text-text-muted">721</span>
              <ArrowRight size={24} className="text-text-secondary" />
              <span className="font-display text-[64px] text-accent shadow-glow-volt-sm px-4 py-1 rounded-2xl bg-accent-surface">
                {animatedScore}
              </span>
            </div>

            {/* Circle ring */}
            <div className="flex justify-center">
              <PulseRing score={animatedScore} size="lg" animated={false} />
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
