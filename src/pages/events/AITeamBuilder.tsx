import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, CheckCircle, Users, Terminal } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useEvent } from '@/hooks/useEvents';
import { generateTeam } from '../../services/aiService';
import { SPORT_CATEGORIES } from '@/constants/sports';
import type { AITeamResult, SportCategory, ExperienceLevel } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/index';
import { ProgressBar } from '../../components/ui/index';

export const AITeamBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setAITeamResult, setIsGenerating } = useEventStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [activeTeam, setActiveTeam] = useState<AITeamResult | null>(null);
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
      // The API's skill levels and this page's legacy union are different
      // vocabularies (semi_pro/pro against semi-pro/professional), so they are
      // mapped here at the one call site rather than either side being loosened.
      const legacyLevel: ExperienceLevel = ({
        beginner: 'amateur', amateur: 'amateur', semi_pro: 'semi-pro',
        pro: 'professional', elite: 'elite',
      } as const)[event.skill_level] ?? 'amateur';
      const result = await generateTeam(
        event.sport as SportCategory, legacyLevel, event.$id, addLog);
      setActiveTeam(result);
      setAITeamResult(result);
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
            {/* Success Header */}
            <div className="premium-card rounded-xl p-4 flex items-center gap-3 bg-accent-surface border-accent-border">
              <CheckCircle size={20} className="text-accent flex-shrink-0" />
              <div>
                <p className="font-label text-sm font-semibold text-accent">AutoSquad Generated Successfully</p>
                <p className="text-xs text-text-secondary font-mono">Compatibility Score: {activeTeam.team.compatibilityRating}% · Rating: {activeTeam.team.overallRating}/100</p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="premium-card rounded-xl p-4">
              <p className="stat-label mb-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Terminal size={11} /> AI REASONING</p>
              <p className="font-mono text-xs text-text-secondary leading-relaxed">{activeTeam.reasoning}</p>
            </div>

            {/* Team Card */}
            <div className="premium-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">{activeTeam.team.name}</h2>
                  <p className="text-xs font-mono text-text-secondary">{sportData?.emoji} {event?.sport} · AI Generated</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl text-accent">{activeTeam.team.overallRating}</div>
                  <div className="stat-label" style={{ color: 'var(--text-muted)' }}>OVR</div>
                </div>
              </div>

              {/* Compatibility Breakdown */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {Object.entries(activeTeam.compatibilityBreakdown).map(([key, val]) => (
                  <ProgressBar key={key} label={key.toUpperCase()} value={val} max={100} showValue />
                ))}
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                {activeTeam.team.members.map((member, i) => (
                  <motion.div key={member.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-border">
                    <Avatar src={member.avatar} name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-label text-sm font-semibold text-text-primary truncate">{member.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-surface border border-accent-border text-accent font-mono flex-shrink-0">{member.position}</span>
                      </div>
                      <p className="text-[10px] font-mono text-text-secondary">Chemistry: {member.compatibilityScore}%</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-accent">{member.skillScore}</div>
                      <div className="stat-label text-[9px]" style={{ color: 'var(--text-muted)' }}>SKILL</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRegenerate} icon={<RefreshCw size={15} />}>Regenerate</Button>
              <Button fullWidth onClick={() => navigate(`/app/events/${id}`)} icon={<CheckCircle size={15} fill="currentColor" />}>
                Accept Team →
              </Button>
            </div>

            {/* Alt teams hint */}
            <p className="text-center text-xs text-text-muted font-mono">{activeTeam.alternateOptions.length} alternative lineups available · click Regenerate to explore</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
