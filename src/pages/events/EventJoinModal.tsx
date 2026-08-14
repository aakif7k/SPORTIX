import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Sparkles, MapPin, Check, ArrowRight, Shield } from 'lucide-react';
import { useSquadStore } from '../../store/squadStore';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { generateAIPulseSquad } from '../../services/squadAI';
import { getEventReadiness, type EventReadinessData } from '../../services/eventReadinessService';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import type { Event } from '../../types';
import type { Athlete } from '../../types/pulse.types';

import { getEventLifecycleState } from '../../services/eventLifecycleService';
import { createNotification } from '../../services/notificationService';
import toast from 'react-hot-toast';

import { DynamicEventRoleSelector } from '../../components/events/DynamicEventRoleSelector';

export interface EventJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
  event: Event;
}

type FlowStep = 'choice' | 'generating' | 'result' | 'confirmed';

const CATEGORY_OPTIONS = ['Amateur', 'Semi-Pro', 'Professional'] as const;

export const EventJoinModal: React.FC<EventJoinModalProps> = ({ isOpen, onClose, onJoined, event }) => {
  const { user } = useAuthStore();
  const { addGeneratedSquad, acceptGeneratedSquad, incrementGenerationsCount, dailyGenerationsCount } = useSquadStore();
  const { nearbyRadius } = useAISettingsStore();

  const dynamicLogs = [
    '> Initializing matchmaking engine...',
    `> Scanning ${nearbyRadius} KM radius for athletes in "${event.title}"...`,
    '> Fetching registered event participants and talent pool...',
    '> Analyzing player roles, positions, and Pulse scores...',
    '> Computing team chemistry and pulse harmony...',
    '> Generating compatibility matrix...',
    '> Selecting optimal captain candidate...',
    '> Building squad formation with AI...',
    '> Squad assembled. Readiness: OPTIMAL.',
  ];

  const [step, setStep] = useState<FlowStep>('choice');
  const [category, setCategory] = useState<'Amateur' | 'Semi-Pro' | 'Professional'>('Semi-Pro');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [generatedSquad, setGeneratedSquad] = useState<any>(null);
  const [readiness, setReadiness] = useState<EventReadinessData | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const remaining = Math.max(0, 5 - dailyGenerationsCount);

  // Reset state & fetch readiness when opened
  useEffect(() => {
    if (isOpen) {
      const lifecycle = getEventLifecycleState(event);
      if (lifecycle.isEnded || !lifecycle.canJoin) {
        toast.error('This event has ended and is no longer accepting registrations.');
        onClose();
        return;
      }
      setStep('choice');
      setSelectedRole('');
      setLogs([]);
      setGeneratedSquad(null);
      getEventReadiness(event.id).then(setReadiness).catch(() => null);
    }
  }, [isOpen, event]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleGenerateSquad = async () => {
    if (remaining <= 0) return;
    setStep('generating');
    setLogs([]);

    // Typewriter log effect
    for (let i = 0; i < dynamicLogs.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      setLogs(prev => [...prev, dynamicLogs[i]]);
    }

    try {
      const profile = {
        id: user?.id || user?.uid || '',
        name: user?.name || 'You',
        username: user?.username || 'athlete',
        avatar: user?.avatar || '',
        level: user?.level || 24,
        gameplayCategory: category,
        pulseScore: (user as any)?.pulse_score || 780,
      };
      const squad = await generateAIPulseSquad(
        event.sport,
        'squad',
        profile,
        (logMsg) => setLogs(prev => [...prev, logMsg]),
        event.id,
        event.title
      );
      setGeneratedSquad(squad);
      incrementGenerationsCount();
      addGeneratedSquad(squad);
      setStep('result');
    } catch (err) {
      console.error(err);
      setStep('choice');
    }
  };

  const handleAcceptSquad = async () => {
    const currentUserId = user?.id || user?.uid || '';
    const teamName = generatedSquad?.name || 'AutoSquad Team';

    if (generatedSquad) {
      acceptGeneratedSquad(generatedSquad.squadId);
      const memberUserIds = (generatedSquad.members || []).map((m: any) => m.uid || m.id || m.userId).filter(Boolean);
      await useEventStore.getState().joinEvent(
        event.id,
        currentUserId,
        'squad',
        generatedSquad.squadId,
        memberUserIds.length > 0 ? memberUserIds : [currentUserId],
        selectedRole || 'Athlete'
      );
    } else {
      await useEventStore.getState().joinEvent(event.id, currentUserId, 'solo', undefined, undefined, selectedRole || 'Athlete');
    }

    // Send Buzz Notification
    if (currentUserId) {
      createNotification({
        userId: currentUserId,
        type: 'team_update',
        title: `⚡ Team Accepted: ${teamName}`,
        message: `Your new team is accepted by you: ${teamName} • ${event.title}`,
        read: false,
        relatedId: event.id,
        relatedType: 'event',
        actorName: teamName,
        actorAvatar: generatedSquad?.members?.[0]?.avatar || user?.avatar,
      }).catch(() => null);
    }

    toast.success(`Your new team is accepted by you: ${teamName} • ${event.title}`, { duration: 4000 });
    setStep('confirmed');
    setTimeout(() => onJoined(), 1800);
  };

  const handleJoinSolo = async () => {
    const currentUserId = user?.id || user?.uid || '';
    await useEventStore.getState().joinEvent(event.id, currentUserId, 'solo', undefined, undefined, selectedRole || 'Athlete');
    setStep('confirmed');
    setTimeout(() => onJoined(), 1200);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="w-full md:max-w-lg rounded-t-[28px] md:rounded-[28px] overflow-hidden premium-card border border-border-muted"
            style={{ background: 'var(--bg-surface)' }}
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-border-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
              <div>
                <div className="font-display text-[18px] text-text-primary tracking-wider uppercase">JOIN EVENT</div>
                <div className="font-mono text-[9px] text-text-muted mt-0.5 uppercase truncate max-w-[200px]">{event.title}</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-elevated hover:bg-hover transition-all text-text-muted hover:text-text-primary">
                <X size={15} />
              </button>
            </div>

            <AnimatePresence mode="wait">

              {/* ── STEP: CHOICE ─────────────────────────────────────────── */}
              {step === 'choice' && (
                <motion.div key="choice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-4">

                  {/* Category selector */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">Gameplay Category</label>
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-elevated border border-border-muted">
                      {CATEGORY_OPTIONS.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                          className={`py-2 rounded-lg font-mono text-[10px] font-bold transition-all ${
                            category === cat ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                          }`}
                          style={category === cat ? { color: 'var(--volt-text)' } : {}}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sport Role Selection */}
                  <div className="pt-1">
                    <DynamicEventRoleSelector
                      sportName={event.sport}
                      selectedRole={selectedRole}
                      onSelectRole={(r) => setSelectedRole(r)}
                      roleRemainingSpace={readiness?.allocation?.role_remaining_space}
                    />
                  </div>

                  {/* AutoSquad Readiness Banner */}
                  <div className="p-3.5 rounded-xl border font-mono text-[10px] space-y-1 bg-volt/10 border-volt/30 text-volt">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} /> ⚡ AUTOSQUAD AI READY
                      </span>
                      <span>{readiness?.eligible_count || 1} Registered</span>
                    </div>
                    <p className="text-text-secondary text-[9px]">
                      AutoSquad AI matches registered athletes and pool candidates for {event.sport} by Pulse rating synergy.
                    </p>
                  </div>

                  {/* Join with AI AutoSquad */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateSquad}
                    className="w-full rounded-[16px] p-5 text-left relative overflow-hidden group premium-card border shadow-sm transition-all bg-accent-surface border-accent-border/50 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-accent-surface flex items-center justify-center flex-shrink-0 border border-accent-border">
                        <Sparkles size={20} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-[15px] text-text-primary tracking-wide uppercase">
                          JOIN WITH AI AUTOSQUAD
                        </div>
                        <div className="font-mono text-[10px] text-text-secondary mt-1">
                          AutoSquad AI scans nearby athletes, matches Pulse ratings for {event.sport}, and registers you instantly.
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="font-mono text-[9px] text-accent">{nearbyRadius || 10} KM radius</span>
                          <span className="font-mono text-[9px] text-text-muted">·</span>
                          <span className="font-mono text-[9px] text-accent">Pulse Matched</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-accent flex-shrink-0 mt-1" />
                    </div>
                  </motion.button>

                  {/* Join Solo */}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={handleJoinSolo}
                    className="w-full rounded-[16px] p-4 text-left relative overflow-hidden group premium-card bg-elevated border border-border-muted flex items-center justify-between">
                    <div>
                      <div className="font-display text-[14px] text-text-primary tracking-wide uppercase">JOIN AS SOLO ATHLETE</div>
                      <div className="font-mono text-[9px] text-text-muted">Register individually for open athlete slots</div>
                    </div>
                    <ArrowRight size={15} className="text-text-muted group-hover:text-text-primary transition-colors" />
                  </motion.button>

                  {/* Exit */}
                  <button onClick={onClose}
                    className="w-full py-3 rounded-[14px] font-mono text-[12px] text-text-muted hover:text-text-primary border border-border-muted hover:border-accent transition-all">
                    Exit
                  </button>
                </motion.div>
              )}

              {/* ── STEP: GENERATING ─────────────────────────────────────── */}
              {step === 'generating' && (
                <motion.div key="gen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-surface flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                        <Sparkles size={15} className="text-accent" />
                      </motion.div>
                    </div>
                    <div>
                      <div className="font-display text-[15px] text-text-primary tracking-wide uppercase">SCANNING ATHLETES</div>
                      <div className="font-mono text-[9px] text-text-muted">AutoSquad AI processing {event.sport} talent pool...</div>
                    </div>
                  </div>

                  {/* Terminal log */}
                  <div ref={logRef}
                    className="rounded-[14px] p-4 h-44 overflow-y-auto font-mono text-[10px] space-y-1 bg-base border border-border-muted">
                    {logs.map((line, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        className={i === logs.length - 1 ? 'text-accent font-bold' : 'text-text-muted'}>
                        {line}
                        {i === logs.length - 1 && <span className="inline-block w-1.5 h-3 bg-accent ml-1 animate-pulse" />}
                      </motion.div>
                    ))}
                    {logs.length === 0 && <span className="text-text-muted">Initializing...</span>}
                  </div>

                  {/* Progress */}
                  <div className="h-1.5 rounded-full bg-border-muted overflow-hidden">
                    <motion.div className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(Math.round((logs.length / dynamicLogs.length) * 100), 95)}%` }}
                      transition={{ duration: 0.3 }} />
                  </div>
                </motion.div>
              )}

              {/* ── STEP: RESULT ─────────────────────────────────────────── */}
              {step === 'result' && generatedSquad && (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 space-y-4">
                  {/* Success banner */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-accent-surface border border-accent-border/50">
                    <Check size={16} className="text-accent" />
                    <div>
                      <div className="font-mono text-[11px] text-accent font-bold">Squad Generated Successfully</div>
                      <div className="font-mono text-[9px] text-text-secondary">Chemistry: {generatedSquad.chemistry.overall}% · Win Rate: {generatedSquad.winRate}%</div>
                    </div>
                  </div>

                  {/* Squad name + stats */}
                  <div className="rounded-[16px] p-4 border border-border-muted bg-elevated">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-display text-[18px] text-text-primary tracking-wide uppercase">{generatedSquad.name}</div>
                        <div className="font-mono text-[9px] text-text-muted">{generatedSquad.sport} · {generatedSquad.formation}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[22px] text-accent">{generatedSquad.chemistry.overall}%</div>
                        <div className="font-mono text-[8px] text-text-muted">CHEMISTRY</div>
                      </div>
                    </div>

                    {/* Suggested captain */}
                    {generatedSquad.members?.find((m: Athlete) => m.role === 'captain') && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[10px] bg-accent-surface border border-accent-border/50">
                        <Shield size={11} className="text-accent" />
                        <span className="font-mono text-[9px] text-accent">
                          AI Captain: <strong>{generatedSquad.members.find((m: Athlete) => m.role === 'captain')?.name}</strong>
                        </span>
                      </div>
                    )}

                    {/* Members */}
                    <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {generatedSquad.members?.slice(0, 6).map((m: Athlete, i: number) => (
                        <motion.div key={m.uid} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-2 rounded-[10px] bg-hover border border-border-muted/50">
                          <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-[11px] text-text-primary truncate font-bold">{m.name}</div>
                            <div className="font-mono text-[9px] text-text-muted">{m.position}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {m.distance !== undefined && (
                              <span className="font-mono text-[8px] text-accent flex items-center gap-0.5">
                                <MapPin size={7} />{m.distance === 0 ? 'You' : `${m.distance}km`}
                              </span>
                            )}
                            <BadgeIcon level={m.level || 20} size={14} animate={false} glow={false} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('choice')}
                      className="px-4 py-3 rounded-[12px] border border-border-muted font-mono text-[11px] text-text-muted hover:text-text-primary transition-all">
                      Regenerate
                    </button>
                    <button onClick={handleAcceptSquad}
                      className="flex-1 py-3 rounded-[12px] font-display text-[14px] tracking-wide flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--volt-text)', boxShadow: '0 0 20px var(--accent-glow)' }}>
                      <Check size={15} /> Accept &amp; Join Event
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP: CONFIRMED ───────────────────────────────────────── */}
              {step === 'confirmed' && (
                <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="p-8 text-center space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--volt-text)', boxShadow: '0 0 30px var(--accent-glow)' }}>
                    <Check size={28} strokeWidth={3} style={{ color: 'var(--volt-text)' }} />
                  </motion.div>
                  <div className="space-y-2">
                    <div className="font-display text-[20px] text-text-primary tracking-wider uppercase">SQUAD CONFIRMED</div>
                    <div className="p-3.5 rounded-2xl bg-volt/10 border border-volt/30 text-volt text-xs font-mono font-bold leading-relaxed">
                      ⚡ Your new team is accepted by you: <span className="text-white">{generatedSquad?.name || 'AutoSquad'}</span> • {event.title}
                    </div>
                    <div className="font-mono text-[10px] text-text-muted">
                      Notification sent to your Buzz feed. Redirecting to event…
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
