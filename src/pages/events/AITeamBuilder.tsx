import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, CheckCircle, Users, Terminal } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useEvent } from '@/hooks/useEvents';
import { useSquadSuggestion } from '@/hooks/useAI';
import { SPORT_CATEGORIES } from '@/constants/sports';
import type { AISquadSuggestion } from '@/hooks/useAI';

/** Event skill levels against the values the AutoSquad schema accepts. */
const SKILL_LEVEL_BY_EVENT: Record<string, string> = {
  beginner: 'casual',
  amateur: 'amateur',
  semi_pro: 'semi_pro',
  pro: 'professional',
  elite: 'professional',
};
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/index';
import { ProgressBar } from '../../components/ui/index';

export const AITeamBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsGenerating } = useEventStore();
  const { suggestSquad } = useSquadSuggestion();
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [activeTeam, setActiveTeam] = useState<AISquadSuggestion | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // The store held a copy of every event seeded from mockData; the event this
  // page is about comes from the API.
  const { event } = useEvent(id);
  const sportData = SPORT_CATEGORIES.find(s => s.id === event?.sport);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, log]);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const startGeneration = async () => {
    setPhase('analyzing');
    setIsGenerating(true);
    setLogs([]);
    try {
      if (!event) return;
      // The log lines describe what is actually happening now. They used to be a
      // scripted sequence played out on timers while the browser called Gemini
      // with the key from the bundle.
      addLog(`> Selecting ${event.sport} athletes at ${event.skill_level.replace('_', '-')} level...`);
      addLog('> Asking the Pulse Engine to assign roles...');
      const result = await suggestSquad({
        sport: event.sport,
        skill_level: SKILL_LEVEL_BY_EVENT[event.skill_level] ?? 'amateur',
        size: 5,
        event_id: event.$id,
      });
      addLog(
        result.ai_used
          ? `> ${result.selected.length} selected. Roles assigned.`
          : `> ${result.selected.length} selected by Pulse; AI commentary unavailable.`,
      );
      setActiveTeam(result);
      setPhase('done');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setActiveTeam(null);
    setPhase('idle');
    setLogs([]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent-surface border border-accent-border flex items-center justify-center">
          <Zap size={24} className="text-accent" fill="currentColor" />
        </div>
        <div>
          <h1 className="font-display text-4xl text-text-primary tracking-wide uppercase">AUTOSQUAD</h1>
          <p className="text-xs font-label text-text-secondary">Powered by Google Gemini · {sportData?.emoji} {event?.title}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="premium-card rounded-2xl p-8 text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-accent-surface border border-accent-border flex items-center justify-center">
                  <Users size={40} className="text-accent" />
                </div>
                <div className="absolute inset-0 rounded-full border border-accent-border animate-ping-slow opacity-30" />
              </div>
              <div>
                <h2 className="font-display text-3xl text-text-primary mb-2 tracking-wide uppercase">NO TEAM? NO PROBLEM.</h2>
                <p className="font-label text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
                  SportiX AI analyzes hundreds of registered athletes, calculates compatibility scores, and assembles the perfect team for <span className="text-accent font-semibold">{event?.sport}</span> in seconds.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {['847 Athletes Scanned', '2,400 Combinations', '94% Avg Compatibility'].map((stat, i) => (
                  <div key={i} className="telemetry-card rounded-lg p-3">
                    <div className="font-mono text-sm text-accent">{stat.split(' ')[0]}</div>
                    <div className="stat-label text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.split(' ').slice(1).join(' ')}</div>
                  </div>
                ))}
              </div>
              <Button size="lg" onClick={startGeneration} icon={<Zap size={18} fill="currentColor" />} fullWidth>
                Generate My AI Team
              </Button>
            </div>
          </motion.div>
        )}

        {/* ANALYZING STATE */}
        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="premium-card rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Spinner size={22} />
                <div>
                  <p className="font-display text-2xl text-text-primary tracking-wide uppercase">SCANNING ATHLETES</p>
                  <p className="text-xs font-mono text-text-secondary">AutoSquad processing {event?.sport} talent pool...</p>
                </div>
              </div>

              {/* Terminal Log */}
              <div ref={logRef} className="bg-base rounded-xl border border-border p-4 h-48 overflow-y-auto font-mono text-xs space-y-1" style={{ scrollbarWidth: 'thin' }}>
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className={i === logs.length - 1 ? 'text-accent' : 'text-text-secondary'}>
                    {log}
                    {i === logs.length - 1 && <span className="inline-block w-2 h-3 bg-accent ml-1 animate-blink-dot" />}
                  </motion.div>
                ))}
                {logs.length === 0 && <span className="text-text-muted">Initializing AI engine...</span>}
              </div>

              {/* Progress */}
              <ProgressBar value={Math.min(Math.round((logs.length / 9) * 100), 95)} showValue label="ANALYSIS PROGRESS" />
            </div>
          </motion.div>
        )}

        {/* DONE STATE */}
        {phase === 'done' && activeTeam && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* The header claimed a compatibility percentage and a rating out of
                100, the card invented a team name and an OVR, the breakdown was four
                fabricated sub-scores, and the footer offered "alternative lineups"
                that did not exist. The proxy returns the athletes it chose, the
                role it assigned each, and its reasoning — so that is what appears. */}
            <div className="premium-card rounded-xl p-4 flex items-center gap-3 bg-accent-surface border-accent-border">
              <CheckCircle size={20} className="text-accent flex-shrink-0" />
              <div>
                <p className="font-label text-sm font-semibold text-accent">
                  {activeTeam.selected.length} athlete{activeTeam.selected.length === 1 ? '' : 's'} selected
                </p>
                <p className="text-xs text-text-secondary font-mono">
                  {activeTeam.ai_used
                    ? 'Roles assigned by the Pulse Engine'
                    : 'Ordered by Pulse — AI commentary was unavailable'}
                  {activeTeam.discarded
                    ? ` · ${activeTeam.discarded} suggestion${activeTeam.discarded === 1 ? '' : 's'} discarded as unknown athletes`
                    : ''}
                </p>
              </div>
            </div>

            {activeTeam.reasoning && (
              <div className="premium-card rounded-xl p-4">
                <p className="stat-label mb-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Terminal size={11} /> AI REASONING
                </p>
                <p className="font-mono text-xs text-text-secondary leading-relaxed">{activeTeam.reasoning}</p>
              </div>
            )}

            <div className="premium-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">
                    Suggested lineup
                  </h2>
                  <p className="text-xs font-mono text-text-secondary">
                    {sportData?.emoji} {event?.sport} · {event?.skill_level.replace('_', '-')}
                  </p>
                </div>
              </div>

              {activeTeam.selected.length === 0 ? (
                <p className="font-mono text-xs text-text-secondary text-center py-6">
                  No athletes at this level play {event?.sport} yet, so there was nobody
                  to pick from. Invite people to the event directly.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTeam.selected.map((sel, i) => {
                    const athlete = activeTeam.candidates.find(c => c.$id === sel.id);
                    return (
                      <motion.div key={sel.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-border">
                        <Avatar src={athlete?.avatar_url ?? undefined} name={athlete?.full_name || 'Athlete'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-label text-sm font-semibold text-text-primary truncate">
                              {athlete?.full_name || 'Athlete'}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-surface border border-accent-border text-accent font-mono flex-shrink-0">
                              {sel.assigned_role}
                            </span>
                          </div>
                          {sel.why && (
                            <p className="text-[10px] font-mono text-text-secondary truncate">{sel.why}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg font-bold text-accent">
                            {Math.round(athlete?.pulse_score ?? 0)}
                          </div>
                          <div className="stat-label text-[9px]" style={{ color: 'var(--text-muted)' }}>PULSE</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRegenerate} icon={<RefreshCw size={15} />}>Regenerate</Button>
              <Button fullWidth onClick={() => navigate(`/app/events/${id}`)} icon={<CheckCircle size={15} fill="currentColor" />}>
                Accept Team →
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
