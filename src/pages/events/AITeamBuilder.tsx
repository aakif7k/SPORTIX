import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, CheckCircle, Users, Star, ChevronRight, Terminal } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { generateTeam } from '../../services/aiService';
import { SPORT_CATEGORIES } from '../../services/mockData';
import type { AITeamResult } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/index';
import { ProgressBar } from '../../components/ui/index';

export const AITeamBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, setAITeamResult, aiTeamResult, isGenerating, setIsGenerating } = useEventStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [activeTeam, setActiveTeam] = useState<AITeamResult | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const event = events.find(e => e.id === id) || events[0];
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
      const result = await generateTeam(event.sport, event.skillLevel, event.id, addLog);
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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center shadow-glow-volt-sm">
          <Zap size={24} className="text-volt" fill="currentColor" />
        </div>
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">AUTOSQUAD</h1>
          <p className="text-xs font-label text-text-secondary">Powered by Google Gemini · {sportData?.emoji} {event?.title}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-8 border border-volt/10 text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-volt/5 border border-volt/20 flex items-center justify-center">
                  <Users size={40} className="text-volt" />
                </div>
                <div className="absolute inset-0 rounded-full border border-volt/20 animate-ping-slow opacity-30" />
              </div>
              <div>
                <h2 className="font-display text-3xl text-white mb-2 tracking-wide">NO TEAM? NO PROBLEM.</h2>
                <p className="font-label text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
                  SportiX AI analyzes hundreds of registered athletes, calculates compatibility scores, and assembles the perfect team for <span className="text-volt">{event?.sport}</span> in seconds.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {['847 Athletes Scanned', '2,400 Combinations', '94% Avg Compatibility'].map((stat, i) => (
                  <div key={i} className="telemetry-card rounded-lg p-3">
                    <div className="font-mono text-sm text-volt">{stat.split(' ')[0]}</div>
                    <div className="stat-label text-[10px] mt-0.5">{stat.split(' ').slice(1).join(' ')}</div>
                  </div>
                ))}
              </div>
              <Button size="lg" onClick={startGeneration} icon={<Zap size={18} fill="black" />} fullWidth>
                Generate My AI Team
              </Button>
            </div>
          </motion.div>
        )}

        {/* ANALYZING STATE */}
        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-6 border border-volt/10 space-y-5">
              <div className="flex items-center gap-3">
                <Spinner size={22} />
                <div>
                  <p className="font-display text-2xl text-white tracking-wide">SCANNING ATHLETES</p>
                  <p className="text-xs font-mono text-text-secondary">AutoSquad processing {event?.sport} talent pool...</p>
                </div>
              </div>

              {/* Terminal Log */}
              <div ref={logRef} className="bg-base rounded-xl border border-border-muted p-4 h-48 overflow-y-auto font-mono text-xs space-y-1" style={{ scrollbarWidth: 'thin' }}>
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className={i === logs.length - 1 ? 'text-volt' : 'text-text-secondary'}>
                    {log}
                    {i === logs.length - 1 && <span className="inline-block w-2 h-3 bg-volt ml-1 animate-blink-dot" />}
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
            <div className="glass rounded-xl p-4 border border-volt/20 flex items-center gap-3 bg-volt/3">
              <CheckCircle size={20} className="text-volt flex-shrink-0" />
              <div>
                <p className="font-label text-sm font-semibold text-volt">AutoSquad Generated Successfully</p>
                <p className="text-xs text-text-secondary font-mono">Compatibility Score: {activeTeam.team.compatibilityRating}% · Rating: {activeTeam.team.overallRating}/100</p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="glass rounded-xl p-4 border border-border-muted">
              <p className="stat-label mb-2 flex items-center gap-2"><Terminal size={11} /> AI REASONING</p>
              <p className="font-mono text-xs text-text-secondary leading-relaxed">{activeTeam.reasoning}</p>
            </div>

            {/* Team Card */}
            <div className="glass rounded-2xl p-6 border border-volt/15 shadow-glow-volt">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl text-white tracking-wide">{activeTeam.team.name}</h2>
                  <p className="text-xs font-mono text-text-secondary">{sportData?.emoji} {event?.sport} · AI Generated</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl text-volt">{activeTeam.team.overallRating}</div>
                  <div className="stat-label">OVR</div>
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
                    className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-border-muted">
                    <Avatar src={member.avatar} name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-label text-sm font-semibold text-white truncate">{member.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-volt/10 border border-volt/20 text-volt font-mono flex-shrink-0">{member.position}</span>
                      </div>
                      <p className="text-[10px] font-mono text-text-secondary">Chemistry: {member.compatibilityScore}%</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-volt">{member.skillScore}</div>
                      <div className="stat-label text-[9px]">SKILL</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleRegenerate} icon={<RefreshCw size={15} />}>Regenerate</Button>
              <Button fullWidth onClick={() => navigate(`/app/events/${id}`)} icon={<CheckCircle size={15} fill="black" />}>
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
