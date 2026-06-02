import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useMatchReportStore, MOCK_PENDING_MATCH } from '../../store/matchReportStore';
import { useAuthStore } from '../../store/authStore';
import { SportStatForm } from '../../components/performance/SportStatForm';
import { RatingSlider } from '../../components/performance/RatingSlider';
import { PulseEarnedSummary } from '../../components/performance/PulseEarnedSummary';
import { getPulseBreakdown } from '../../services/performanceService';
import type { MatchResult, PerformanceSport } from '../../types/performance.types';


// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
const StepProgressBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="w-full h-[3px] rounded-full" style={{ background: 'var(--bg-elevated)' }}>
    <motion.div
      className="h-full rounded-full"
      style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
      animate={{ width: `${((step + 1) / 3) * 100}%` }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  </div>
);

// ─── RESULT CARDS ─────────────────────────────────────────────────────────────
const RESULT_OPTIONS: Array<{
  result: MatchResult;
  label: string;
  sub: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    result: 'win',  label: 'VICTORY', sub: 'We dominated.',           emoji: '🏆',
    color: '#4ADE80', bg: 'rgba(74,222,128,0.06)',  border: '#4ADE80',
  },
  {
    result: 'loss', label: 'DEFEAT',  sub: 'Tough one. Learn and return.', emoji: '🛡',
    color: '#F87171', bg: 'rgba(248,113,113,0.06)', border: '#F87171',
  },
  {
    result: 'draw', label: 'DRAW',    sub: 'Balanced battle.',        emoji: '🤝',
    color: '#FBBF24', bg: 'rgba(251,191,36,0.06)',  border: '#FBBF24',
  },
];

// ─── MATCH CONTEXT CARD ───────────────────────────────────────────────────────
const MatchContextCard: React.FC<{ matchResult: MatchResult | null; sport: string }> = ({
  matchResult, sport,
}) => {
  const resultStyle = matchResult ? {
    win:  { text: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  label: 'WIN' },
    loss: { text: '#F87171', bg: 'rgba(248,113,113,0.10)', label: 'LOSS' },
    draw: { text: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  label: 'DRAW' },
  }[matchResult] : null;

  const sportEmoji: Record<string, string> = {
    football: '⚽', basketball: '🏀', cricket: '🏏', running: '🏃', generic: '🏅',
  };

  return (
    <div
      className="rounded-[14px] p-4 flex items-center justify-between gap-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-[28px]">{sportEmoji[sport] ?? '🏅'}</span>
        <div>
          <p className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">
            {MOCK_PENDING_MATCH.eventName}
          </p>
          <p className="font-mono text-[11px] text-[var(--text-muted)] capitalize">{sport}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-[var(--text-muted)]">
          {new Date(MOCK_PENDING_MATCH.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
        {resultStyle && (
          <span
            className="px-3 py-1 rounded-full font-mono text-[11px] font-bold"
            style={{ background: resultStyle.bg, color: resultStyle.text, border: `1px solid ${resultStyle.text}` }}
          >
            {resultStyle.label}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── LIVE PULSE PREVIEW ────────────────────────────────────────────────────────
const LivePulsePreview: React.FC<{
  sport: PerformanceSport;
}> = ({ sport }) => {
  const { sportStats, matchRating, isMvp, matchResult } = useMatchReportStore();
  const { rows, total } = getPulseBreakdown(
    sport,
    sportStats as Record<string, number | string | boolean>,
    matchRating,
    isMvp,
    matchResult ?? 'draw'
  );

  return (
    <div
      className="rounded-[16px] p-5 space-y-3 sticky top-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', boxShadow: '0 0 20px rgba(204,255,0,0.08)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">⚡</span>
        <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          PULSE PREVIEW
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between font-mono text-[12px]"
          >
            <span className="text-[var(--text-muted)] truncate pr-2">{row.label}</span>
            <motion.span
              key={row.value}
              initial={{ scale: 1.2, color: '#CCFF00' }}
              animate={{ scale: 1, color: 'var(--accent)' }}
              className="font-bold flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            >
              +{row.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <div
        className="pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="font-mono text-[12px] text-[var(--text-muted)] uppercase tracking-widest">TOTAL</span>
        <motion.span
          key={total}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-display text-[32px] leading-none"
          style={{ color: 'var(--accent)' }}
        >
          +{total}
        </motion.span>
      </div>

      <div
        className="px-3 py-1.5 rounded-full inline-block font-mono text-[11px] font-bold"
        style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.3)' }}
      >
        +{((matchRating / 10) * 0.5).toFixed(1)} SSR preview
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const MatchReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    currentStep, matchResult, matchRating, isMvp, sportStats,
    setStep, setMatchResult, setRating, setMvp, submit,
    showRewardScreen, submissionResult, setShowRewardScreen, reset,
  } = useMatchReportStore();

  // Determine sport from user profile or default to football
  const userSport: PerformanceSport =
    (user?.sport as PerformanceSport) ?? 'football';

  const canProceedStep0 = matchResult !== null;

  const handleNext = () => {
    if (currentStep < 2) setStep((currentStep + 1) as 0 | 1 | 2);
  };
  const handleBack = () => {
    if (currentStep > 0) setStep((currentStep - 1) as 0 | 1 | 2);
    else navigate(-1);
  };

  const handleSubmit = async () => {
    await submit(userSport);
  };

  const handleCloseReward = () => {
    setShowRewardScreen(false);
    reset();
    navigate('/app/events');
  };

  // Slide direction for AnimatePresence
  const [dir, setDir] = React.useState(1);
  const prevStep = React.useRef(currentStep);
  React.useEffect(() => {
    setDir(currentStep > prevStep.current ? 1 : -1);
    prevStep.current = currentStep;
  }, [currentStep]);

  return (
    <>
      {/* Reward Screen Overlay */}
      <AnimatePresence>
        {showRewardScreen && submissionResult && (
          <PulseEarnedSummary result={submissionResult} onClose={handleCloseReward} />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="flex items-center gap-1.5 font-mono text-[13px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={16} /> ClashHub
            </motion.button>
            <div className="flex-1" />
            <span className="font-mono text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Step {currentStep + 1} of 3
            </span>
          </div>
          <StepProgressBar step={currentStep} />
        </div>

        {/* Match context card — always visible */}
        <MatchContextCard matchResult={matchResult} sport={userSport} />

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={currentStep}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit:  (d: number) => ({ x: -d * 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >

            {/* ── STEP 0: Result ─────────────────────────────────── */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[48px] leading-none text-[var(--text-primary)] tracking-wider">
                    HOW DID IT GO?
                  </h1>
                  <p className="font-mono text-[14px] text-[var(--text-muted)] mt-1">
                    Confirm your match result
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {RESULT_OPTIONS.map((opt) => {
                    const isSelected = matchResult === opt.result;
                    return (
                      <motion.button
                        key={opt.result}
                        whileTap={{ scale: 0.97 }}
                        animate={{ scale: isSelected ? 1.02 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => setMatchResult(opt.result)}
                        className="relative rounded-[16px] p-6 text-center space-y-3 transition-all"
                        style={{
                          background: isSelected ? opt.bg : 'var(--bg-surface)',
                          border: `2px solid ${isSelected ? opt.border : 'var(--border)'}`,
                        }}
                      >
                        {isSelected && (
                          <div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: opt.color }}
                          >
                            <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                          </div>
                        )}
                        <div className="text-[40px]">{opt.emoji}</div>
                        <div className="font-display text-[28px] leading-none" style={{ color: opt.color }}>
                          {opt.label}
                        </div>
                        <div className="font-mono text-[12px] text-[var(--text-muted)]">{opt.sub}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 1: Performance Stats ─────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[48px] leading-none text-[var(--text-primary)] tracking-wider">
                    YOUR PERFORMANCE
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="px-3 py-1 rounded-full font-mono text-[11px] font-bold capitalize"
                      style={{ background: 'var(--accent-surface)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                    >
                      {userSport}
                    </span>
                    <p className="font-mono text-[13px] text-[var(--text-muted)]">
                      Submit your stats accurately. Teammates can validate these.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                  <div className="space-y-6">
                    <SportStatForm sport={userSport} />
                    <div
                      className="rounded-[16px] p-5"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <RatingSlider value={matchRating} onChange={setRating} />
                    </div>
                  </div>
                  <LivePulsePreview sport={userSport} />
                </div>
              </div>
            )}

            {/* ── STEP 2: Review + Submit ───────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-[48px] leading-none text-[var(--text-primary)] tracking-wider">
                    REVIEW YOUR REPORT
                  </h1>
                  <p className="font-mono text-[14px] text-[var(--text-muted)] mt-1">
                    Double-check before submitting. Teammates will validate these stats.
                  </p>
                </div>

                {/* Stats summary card */}
                <div
                  className="rounded-[16px] p-5 space-y-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-condensed font-semibold text-[16px] text-[var(--text-primary)]">
                      Submitted Stats
                    </h3>
                    <button
                      onClick={() => setStep(1)}
                      className="font-mono text-[12px]"
                      style={{ color: 'var(--accent)' }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sportStats).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-mono text-[13px] text-[var(--text-muted)] capitalize">{k}</span>
                        <span className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">{String(v)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-1.5 border-b col-span-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-mono text-[13px] text-[var(--text-muted)]">Rating</span>
                      <span className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">{matchRating}/10</span>
                    </div>
                  </div>
                </div>

                {/* Pulse preview — big */}
                <div
                  className="rounded-[16px] p-5 border-l-[3px] space-y-4"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderLeftColor: 'var(--accent)',
                  }}
                >
                  <p className="font-mono text-[12px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    YOU'LL EARN
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {(() => {
                      const { total } = getPulseBreakdown(
                        userSport, sportStats as Record<string, number | string | boolean>,
                        matchRating, isMvp, matchResult ?? 'draw'
                      );
                      const ssr = ((matchRating / 10) * 0.5 + (matchResult === 'win' ? 0.2 : 0)).toFixed(1);
                      const chem = Math.round((matchRating / 10) * 2 + (matchResult === 'win' ? 2 : 0) + (isMvp ? 3 : 0));
                      return (
                        <>
                          <div>
                            <div className="font-display text-[36px] leading-none" style={{ color: 'var(--accent)' }}>+{total}</div>
                            <div className="font-mono text-[10px] text-[var(--text-muted)] mt-1">⚡ PULSE</div>
                          </div>
                          <div>
                            <div className="font-display text-[36px] leading-none" style={{ color: '#60A5FA' }}>+{ssr}</div>
                            <div className="font-mono text-[10px] text-[var(--text-muted)] mt-1">📊 SSR</div>
                          </div>
                          <div>
                            <div className="font-display text-[36px] leading-none" style={{ color: '#4ADE80' }}>+{chem}%</div>
                            <div className="font-mono text-[10px] text-[var(--text-muted)] mt-1">🧬 CHEM</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] italic">
                    Submission is final. Teammates will validate.
                  </p>
                </div>

                {/* MVP declaration */}
                <div
                  className="rounded-[16px] p-5 space-y-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <p className="font-condensed font-semibold text-[16px] text-[var(--text-primary)]">
                    Were you the MVP of this match?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMvp(true)}
                      className="py-4 rounded-[14px] text-center font-condensed font-semibold text-[16px] transition-all"
                      style={
                        isMvp
                          ? { background: '#1A2200', border: '2px solid var(--accent)', color: 'var(--accent)' }
                          : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                      }
                    >
                      👑 YES — MVP
                      {isMvp && <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--accent)' }}>+40 Pulse bonus</div>}
                    </button>
                    <button
                      onClick={() => setMvp(false)}
                      className="py-4 rounded-[14px] text-center font-condensed font-semibold text-[16px] transition-all"
                      style={
                        !isMvp
                          ? { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                          : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                      }
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-5 py-3 rounded-[12px] font-mono text-[13px] transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              ← Back
            </button>
          )}

          {currentStep < 2 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              disabled={currentStep === 0 && !canProceedStep0}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] font-condensed font-semibold text-[18px] transition-all"
              style={{
                background: canProceedStep0 || currentStep > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                color: canProceedStep0 || currentStep > 0 ? '#080808' : 'var(--text-disabled)',
              }}
            >
              Next <ChevronRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(204,255,0,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={useMatchReportStore.getState().isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[14px] font-condensed font-semibold text-[20px] transition-all"
              style={{ background: 'var(--accent)', color: '#080808', height: '60px' }}
            >
              {useMatchReportStore.getState().isSubmitting
                ? '⏳ Calculating your performance...'
                : 'Submit Performance Report →'
              }
            </motion.button>
          )}
        </div>
      </div>
    </>
  );
};
