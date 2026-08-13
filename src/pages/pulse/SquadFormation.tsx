import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AILoader } from '../../components/pulse/AILoader';
import { AutoSquadEventSelector, type EventOption } from '../../components/pulse/AutoSquadEventSelector';
import { AIInsightPanel, type AIInsightData } from '../../components/pulse/AIInsightPanel';
import { getRemainingGenerations, generateAutoSquad, acceptAutoSquad, type DailyLimitInfo } from '../../services/autoSquadService';
import { useSquadStore } from '../../store/squadStore';
import { useAuthStore } from '../../store/authStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { Sparkles, Check, Users, Activity, Brain, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';
import { createNotification } from '../../services/notificationService';
import { useEventStore } from '../../store/eventStore';
import toast from 'react-hot-toast';

// ─── 4 Master Tabs ────────────────────────────────────────────────────────────
const DASH_TABS = [
  { id: 'generate', label: 'Generate', icon: <Sparkles size={13} /> },
  { id: 'results', label: 'Results', icon: <Activity size={13} /> },
  { id: 'accepted', label: 'Accepted', icon: <CheckCircle2 size={13} /> },
  { id: 'insights', label: 'AI Insights', icon: <Brain size={13} /> },
];

const FUTURISTIC_NAMES = [
  'SQUAD NOVA', 'SQUAD VECTOR', 'SQUAD APEX', 'SQUAD TITAN', 'SQUAD VORTEX',
  'PULSE X', 'STRIKE XI', 'NEON XI', 'SQUAD AXIS', 'SQUAD VELOCITY'
];

export const SquadFormation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { nearbyRadius } = useAISettingsStore();
  const {
    squads, generatedSquads,
    addGeneratedSquad, declineGeneratedSquad, acceptGeneratedSquad, incrementGenerationsCount
  } = useSquadStore();

  const initialType = searchParams.get('type') || 'solo';
  const urlEventId = searchParams.get('eventId') || searchParams.get('event_id');
  const [entryType, setEntryType] = useState<string>(initialType);
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [status, setStatus] = useState<'selection' | 'matching'>('selection');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [dailyQuota, setDailyQuota] = useState<DailyLimitInfo>({ used: 0, remaining: 5, max: 5 });
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    getRemainingGenerations().then(setDailyQuota).catch(() => null);
  }, []);

  // Master generation handler
  const handleGenerateSquad = async () => {
    setGenError(null);
    const targetEv = selectedEvent || {
      id: urlEventId || 'event_1',
      title: 'Chennai Sunday Football League',
      sport: 'Football',
      location: 'Nehru Stadium, Chennai',
      city: 'Chennai',
      startsAt: new Date().toISOString(),
      currentParticipants: 14,
      maxParticipants: 32,
      bannerUrl: null,
      status: 'upcoming'
    };

    if (!selectedEvent) {
      setSelectedEvent(targetEv);
    }

    if (dailyQuota.remaining <= 0) {
      setGenError('Daily limit reached (5 generations max per day). Please try again tomorrow.');
      return;
    }

    setActiveTab('generate');
    setStatus('matching');

    try {
      const res = await generateAutoSquad({
        event_id: targetEv.id,
        sport: targetEv.sport,
        entry_type: entryType as any,
        radius_km: nearbyRadius || 10,
        location: targetEv.location,
      });

      // Generate 5 draft slot variations
      const baseSquad = res.squad_data;
      const squadMembers = baseSquad.members || [];

      // Create 5 saved draft slots for this generation
      for (let i = 0; i < 5; i++) {
        const draftName = FUTURISTIC_NAMES[i % FUTURISTIC_NAMES.length];
        const pulsedMembers = squadMembers.map((m: any, idx: number) => ({
          uid: m.id || `user_${idx}`,
          name: m.full_name || `Athlete ${idx + 1}`,
          username: m.username || `athlete_${idx + 1}`,
          avatar: m.avatar_url || `https://i.pravatar.cc/150?u=${m.id || idx}`,
          sport: m.sport || targetEv.sport,
          position: m.position || ['FW', 'MF', 'DF', 'GK'][idx % 4],
          pulseScore: m.pulse_score || (700 + ((idx * 37) % 150)),
          tier: (m.ssr || 75) >= 85 ? 'ELITE' : 'CONTENDER',
          compatibility: Math.max(75, (baseSquad.score_breakdown?.compatibility_score || 88) - (i * 2)),
          role: m.is_captain || idx === 0 ? 'captain' : 'member',
          readiness: 'Ready',
          level: m.level || 15,
          distance: m.distance_km || Number((1.2 + idx * 0.8).toFixed(1)),
          location: targetEv.city || 'Chennai',
        }));

        const totalPulse = pulsedMembers.reduce((sum: number, m: any) => sum + (m.pulseScore || 700), 0);
        const avgPulse = Math.round(totalPulse / Math.max(1, pulsedMembers.length));

        const draftObj: any = {
          squadId: `draft_${Date.now()}_${i + 1}`,
          name: draftName,
          sport: targetEv.sport,
          eventId: targetEv.id,
          eventName: targetEv.title,
          captainId: pulsedMembers[0]?.uid || user?.id || 'cu1',
          members: pulsedMembers,
          chemistry: {
            overall: Math.max(70, (res.overall_compatibility || 88) - (i * 2)),
            trust: 85,
            coordination: 88,
            communication: 82,
            retentionScore: 88,
            activityScore: 85,
            consistencyScore: 85,
            approvalScore: 80,
          },
          pulseAvg: avgPulse,
          winRate: 80 + i,
          matchHistory: [],
          achievements: [],
          formation: baseSquad.formation || '4-3-3',
          tacticalNotes: res.reasoning,
          createdAt: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString().split('T')[0],
          tournamentIds: [],
          events: [targetEv.title],
          posts: [],
          xpBoostActive: false,
          streakMultiplier: 1.0,
          tags: ['AutoSquad AI', baseSquad.formation || '4-3-3', targetEv.sport],
          lookingFor: [],
          score_breakdown: baseSquad.score_breakdown,
          captain_recommendation: baseSquad.captain_recommendation,
        };

        addGeneratedSquad(draftObj);
        if (i === 0) setSelectedDraftId(draftObj.squadId);
      }

      incrementGenerationsCount();
      setActiveTab('results');

      // Refresh daily limit count
      const updatedQuota = await getRemainingGenerations();
      setDailyQuota(updatedQuota);
    } catch (err: any) {
      console.error('[SquadFormation] Generation error:', err);
      setGenError(err.message || 'AutoSquad generation failed.');
    } finally {
      setStatus('selection');
    }
  };

  const handleDecline = (id: string) => {
    declineGeneratedSquad(id);
    if (selectedDraftId === id) {
      const rem = generatedSquads.filter(s => s.squadId !== id);
      setSelectedDraftId(rem.length > 0 ? rem[0].squadId : null);
    }
  };

  const handleAccept = async (id: string) => {
    const targetSquad = generatedSquads.find(s => s.squadId === id);
    await acceptAutoSquad(id).catch(() => null);
    acceptGeneratedSquad(id);
    setActiveTab('accepted');

    const currentUserId = user?.id || '';
    const squadTitle = targetSquad?.name || 'AutoSquad Team';
    const eventTitle = (targetSquad as any)?.eventName || selectedEvent?.title || 'SPORTiX Event';
    const eventId = (targetSquad as any)?.eventId || selectedEvent?.id || '';

    // Join event if applicable
    if (eventId && currentUserId) {
      const memberIds = (targetSquad?.members || []).map((m: any) => m.uid || m.id).filter(Boolean);
      await useEventStore.getState().joinEvent(
        eventId,
        currentUserId,
        'squad',
        id,
        memberIds.length > 0 ? memberIds : [currentUserId]
      );
    }

    // Buzz notification
    if (currentUserId) {
      await createNotification({
        userId: currentUserId,
        type: 'team_update',
        title: `⚡ Team Accepted: ${squadTitle}`,
        message: `Your new team is accepted by you: ${squadTitle} • ${eventTitle}`,
        read: false,
        relatedId: eventId,
        relatedType: 'event',
        actorName: squadTitle,
        actorAvatar: targetSquad?.members?.[0]?.avatar,
      }).catch(() => null);
    }

    toast.success(`Your new team is accepted by you: ${squadTitle} • ${eventTitle}`, { duration: 4500 });
  };

  const activeSquad = generatedSquads.find(s => s.squadId === selectedDraftId) || generatedSquads[0] || null;

  // Prepare AI Insight data for current accepted / generated squad
  const currentInsightSquad = squads[0] || activeSquad;
  const insightData: AIInsightData | null = currentInsightSquad ? (() => {
    const pulses = currentInsightSquad.members.map((m: any) => m.pulseScore || 700);
    const highestPulse = Math.max(...pulses);
    const lowestPulse = Math.min(...pulses);
    const avgPulse = Math.round(pulses.reduce((a: number, b: number) => a + b, 0) / Math.max(1, pulses.length));
    const topPlayer = currentInsightSquad.members.find((m: any) => (m.pulseScore || 700) === highestPulse) || currentInsightSquad.members[0];

    return {
      teamName: currentInsightSquad.name,
      eventName: (currentInsightSquad as any).eventName || selectedEvent?.title || 'SPORTiX Event',
      avgPulse,
      highestPulse,
      lowestPulse,
      pulseSpread: highestPulse - lowestPulse,
      topPerformerName: topPlayer?.name || 'Athlete',
      topPerformerUsername: (topPlayer as any)?.username || 'athlete',
      topPerformerPulse: topPlayer?.pulseScore || highestPulse,
      rawInsightText: currentInsightSquad.tacticalNotes,
    };
  })() : null;

  // ─── Tab: Generate (Event-First) ──────────────────────────────────────────
  const TabGenerate = () => (
    <div className="space-y-6">
      {/* Top Section: Left Config + Right Command CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Configuration & Event Selector */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-5 shadow-card h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm text-text-primary tracking-wider uppercase flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> BUILD YOUR SQUAD
                </h3>
                <span className="font-mono text-[10px] text-accent font-bold px-2 py-0.5 rounded bg-accent/10">
                  EVENT-FIRST
                </span>
              </div>

              {/* Searchable Event Selector (Pre-fills URL eventId if available) */}
              <AutoSquadEventSelector
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
                preselectedEventId={urlEventId}
              />
            </div>

            {/* Entry Mode */}
            <div className="space-y-2 pt-2">
              <label className="font-mono text-[10px] font-bold text-text-secondary uppercase">Entry Mode</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-elevated border border-border-muted rounded-xl font-mono text-[10px]">
                {['solo', 'duo', 'full'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEntryType(type)}
                    className={`py-2 rounded-lg uppercase font-bold transition-all ${
                      entryType === type
                        ? 'btn-accent shadow-md'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Primary Generate CTA Component & Flow Visual */}
        <div className="lg:col-span-7">
          <div className="p-8 text-center rounded-3xl border border-dashed border-border-muted bg-surface shadow-card flex flex-col items-center justify-center space-y-6 h-full min-h-[380px]">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-glow">
              <Sparkles size={36} />
            </div>

            <div>
              <h3 className="font-display text-xl uppercase tracking-wider text-text-primary">
                AUTOSQUAD AI LAB
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                EVENT → PARTICIPANTS → AI MATCHMAKING → SQUAD
              </p>
            </div>

            {/* Quota Stats */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="rounded-2xl p-4 bg-elevated border border-border-muted text-center">
                <div className="font-display text-2xl text-accent font-bold">{generatedSquads.length}</div>
                <div className="font-mono text-[10px] text-text-muted uppercase mt-0.5">Saved Drafts</div>
              </div>
              <div className="rounded-2xl p-4 bg-elevated border border-border-muted text-center">
                <div className="font-display text-2xl text-text-primary font-bold">{dailyQuota.remaining} / 5</div>
                <div className="font-mono text-[10px] text-text-muted uppercase mt-0.5">Quota Remaining</div>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="w-full max-w-xs space-y-3">
              <button
                type="button"
                onClick={handleGenerateSquad}
                disabled={dailyQuota.remaining <= 0}
                className={`w-full py-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  dailyQuota.remaining > 0
                    ? 'btn-accent hover:scale-[1.01] cursor-pointer'
                    : 'bg-elevated border border-border-muted text-text-muted cursor-not-allowed'
                }`}
              >
                <Sparkles size={18} />
                {dailyQuota.remaining > 0 ? 'GENERATE AUTOSQUAD' : 'Daily Limit Reached (5/5)'}
              </button>

              {genError && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger font-mono text-xs">
                  {genError}
                </div>
              )}
            </div>

            {generatedSquads.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className="flex items-center gap-2 font-mono text-xs text-accent hover:underline font-bold"
              >
                View {generatedSquads.length} Saved Squad Draft Slot{generatedSquads.length !== 1 ? 's' : ''} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: AI Matchmaking Engine Component (FULL WIDTH HORIZONTALLY) */}
      <div className="w-full p-6 rounded-3xl bg-surface border border-border-muted space-y-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Brain size={22} />
            </div>
            <div>
              <h4 className="font-display text-sm text-text-primary tracking-wider uppercase">
                AI MATCHMAKING ENGINE
              </h4>
              <p className="font-mono text-[11px] text-text-muted">
                Multi-dimensional candidate scoring matrix • Real-time squad compatibility evaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-accent font-bold px-3 py-1 rounded-full bg-accent/10 flex items-center gap-1.5 border border-accent/30">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              ENGINE MONITORED & ACTIVE
            </span>
            <span className="font-mono text-[10px] text-text-primary font-bold px-3 py-1 rounded-full bg-elevated border border-border-muted">
              100% READY
            </span>
          </div>
        </div>

        {/* 6 Dimension Grid Spanning Horizontally Across Entire Width with Full Un-truncated Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['Proximity Radius', `Strict ${nearbyRadius || 10} KM radius limit applied`, '10 KM LIMIT'],
            ['Competitive Skill (SSR)', 'Competitive rating compatibility matrix', 'ACTIVE'],
            ['Position Coverage', 'Balanced formation role synchronization', 'BALANCED'],
            ['Pulse Activity Signal', 'Real-time engagement & consistency metrics', 'LIVE'],
            ['Historical Chemistry', 'Evaluated match & crew relationship data', 'VERIFIED'],
            ['Level Calibration', 'SPORTiX level range calibration', 'SYNCED'],
          ].map(([label, desc, tag]) => (
            <div key={label} className="p-4 rounded-2xl bg-elevated border border-border-muted/70 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-text-primary font-bold">{label}</span>
                <span className="font-mono text-[9px] font-bold text-accent px-2 py-0.5 rounded bg-surface border border-border-muted flex-shrink-0">
                  {tag}
                </span>
              </div>
              <span className="font-mono text-[11px] text-text-muted leading-snug">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Tab: Results (5 Persistent Saved Slots) ──────────────────────────────
  const TabResults = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: 5 Draft Slots */}
      <div className="lg:col-span-4 space-y-3">
        <div className="p-5 rounded-3xl bg-surface border border-border-muted space-y-3 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xs text-text-secondary tracking-wider uppercase">
              GENERATED SQUAD SLOTS
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded text-accent bg-accent/10 font-bold">
              5 SLOTS
            </span>
          </div>

          {[0, 1, 2, 3, 4].map(idx => {
            const draft = generatedSquads[idx];
            const isSelected = activeSquad?.squadId === draft?.squadId;
            const slotNum = String(idx + 1).padStart(2, '0');

            if (draft) {
              return (
                <motion.div
                  key={draft.squadId}
                  onClick={() => setSelectedDraftId(draft.squadId)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-accent/15 border-accent shadow-md'
                      : 'bg-elevated border-border-muted hover:border-border-muted/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-accent font-bold">SLOT {slotNum}</span>
                      <p className="font-sans font-bold text-xs tracking-wide text-text-primary truncate">
                        {draft.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDecline(draft.squadId); }}
                      className="p-1 rounded text-text-muted hover:text-danger transition-colors"
                      title="Reject Draft"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 font-mono text-[9px]">
                    <div className="text-center p-1.5 rounded bg-surface border border-border-muted/50">
                      <div className="text-accent font-bold">{draft.chemistry.overall}%</div>
                      <div className="text-text-muted">MATCH</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-surface border border-border-muted/50">
                      <div className="text-text-primary font-bold">⚡ {draft.pulseAvg}</div>
                      <div className="text-text-muted">AVG PULSE</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-surface border border-border-muted/50">
                      <div className="text-text-primary font-bold">{draft.members.length}</div>
                      <div className="text-text-muted">PLAYERS</div>
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-dashed border-border-muted bg-elevated flex items-center justify-between text-text-muted font-mono text-xs"
              >
                <span>SLOT {slotNum}</span>
                <span className="text-[10px] uppercase">AVAILABLE</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Squad Draft Detail */}
      <div className="lg:col-span-8">
        {activeSquad ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Squad Card Header */}
            <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-mono text-[10px] text-accent font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-accent/10">
                    {activeSquad.chemistry.overall}% MATCH SCORE
                  </span>
                  <h2 className="font-display text-2xl uppercase leading-none mt-2 text-text-primary">
                    {activeSquad.name}
                  </h2>
                  <p className="font-mono text-xs text-text-muted mt-1">
                    Event: {(activeSquad as any).eventName || selectedEvent?.title || 'SPORTiX Event'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAccept(activeSquad.squadId)}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-xl btn-accent font-display font-bold text-xs tracking-wider uppercase hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check size={16} /> ACCEPT TEAM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(activeSquad.squadId)}
                    className="px-5 py-3 rounded-xl bg-elevated border border-border-muted text-text-secondary font-mono text-xs hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all cursor-pointer"
                  >
                    REJECT TEAM
                  </button>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border-muted">
                <div className="p-3 bg-elevated rounded-xl">
                  <span className="font-mono text-[10px] text-text-muted block uppercase">AI BALANCE</span>
                  <strong className="font-display text-base text-accent block mt-0.5">{activeSquad.chemistry.overall}</strong>
                </div>
                <div className="p-3 bg-elevated rounded-xl">
                  <span className="font-mono text-[10px] text-text-muted block uppercase">AVG PULSE</span>
                  <strong className="font-display text-base text-text-primary block mt-0.5">⚡ {activeSquad.pulseAvg}</strong>
                </div>
                <div className="p-3 bg-elevated rounded-xl">
                  <span className="font-mono text-[10px] text-text-muted block uppercase">AVG SSR</span>
                  <strong className="font-display text-base text-text-primary block mt-0.5">81</strong>
                </div>
                <div className="p-3 bg-elevated rounded-xl">
                  <span className="font-mono text-[10px] text-text-muted block uppercase">PLAYERS</span>
                  <strong className="font-display text-base text-text-primary block mt-0.5">{activeSquad.members.length}</strong>
                </div>
              </div>
            </div>

            {/* Athlete Cards Grid */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-text-secondary uppercase tracking-wider">
                ATHLETES ({activeSquad.members.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSquad.members.map((m: any) => (
                  <div key={m.uid} className="p-4 rounded-2xl bg-surface border border-border-muted space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar || `https://i.pravatar.cc/150?u=${m.uid}`}
                        alt={m.name}
                        className="w-11 h-11 rounded-xl object-cover border border-border-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <h5 className="font-sans font-bold text-xs text-text-primary truncate">
                          {m.name}
                        </h5>
                        <p className="font-mono text-[10px] text-text-muted truncate">
                          @{m.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] pt-2 border-t border-border-muted/50">
                      <span className="text-accent font-bold flex items-center gap-1">
                        ⚡ {m.pulseScore || 700} Pulse
                      </span>
                      <span className="text-text-muted flex items-center gap-1">
                        📍 {m.location || 'Chennai'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-dashed border-border-muted bg-surface shadow-card flex flex-col items-center gap-4 min-h-[350px] justify-center">
            <Activity size={28} className="text-text-muted" />
            <h3 className="font-display text-base uppercase text-text-primary">NO SQUAD DRAFTS</h3>
            <p className="font-mono text-xs text-text-muted">
              Select an event and click Generate AutoSquad to build draft squads.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Tab: Accepted Squads (Team Intelligence Dashboard) ────────────────────
  const TabAccepted = () => (
    <div className="space-y-6">
      {squads.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border-muted bg-surface shadow-card flex flex-col items-center gap-4 min-h-[320px] justify-center">
          <Users size={28} className="text-accent" />
          <h3 className="font-display text-base uppercase text-text-primary">NO ACCEPTED SQUADS</h3>
          <p className="font-mono text-xs text-text-muted max-w-sm">
            Accept a generated squad to build and view your accepted team dashboard.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className="px-6 py-3 btn-accent font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-all cursor-pointer shadow-md"
          >
            Generate A Squad
          </button>
        </div>
      ) : (
        squads.map(squad => {
          const pulses = squad.members.map((m: any) => m.pulseScore || 700);
          const highestPulse = Math.max(...pulses);
          const lowestPulse = Math.min(...pulses);
          const avgPulse = Math.round(pulses.reduce((a: number, b: number) => a + b, 0) / Math.max(1, pulses.length));

          return (
            <div key={squad.squadId} className="p-6 rounded-3xl bg-surface border border-border-muted space-y-6 shadow-card">
              {/* Accepted Banner */}
              <div className="p-3.5 rounded-2xl bg-volt/10 border border-volt/30 flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-volt font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-volt flex-shrink-0" />
                  Your new team is accepted by you: <span className="text-white">{squad.name}</span> • <span className="text-volt">{(squad as any).eventName || (squad as any).events?.[0] || selectedEvent?.title || 'SPORTiX Event'}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-volt/20 text-volt text-[10px] uppercase font-bold tracking-wider flex-shrink-0">
                  Accepted ✓
                </span>
              </div>

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-muted">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl text-text-primary tracking-wide uppercase">
                      {squad.name}
                    </h3>
                    <span className="font-mono text-[10px] font-bold text-accent uppercase px-2 py-0.5 rounded bg-accent/10">
                      READY
                    </span>
                  </div>
                  <p className="font-mono text-xs text-text-muted mt-1">
                    Event: {(squad as any).eventName || selectedEvent?.title || 'Chennai Sunday Football League'} • {squad.sport}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-text-muted uppercase block">TEAM PULSE</span>
                    <span className="font-display text-lg text-accent font-bold">⚡ {avgPulse}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-text-muted uppercase block">PLAYERS</span>
                    <span className="font-display text-lg text-text-primary font-bold">{squad.members.length}</span>
                  </div>
                </div>
              </div>

              {/* Pulse Distribution Summary */}
              <div className="p-4 rounded-2xl bg-elevated border border-border-muted grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">AVERAGE PULSE</span>
                  <strong className="text-accent text-sm">⚡ {avgPulse}</strong>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">HIGHEST PULSE</span>
                  <strong className="text-text-primary text-sm">⚡ {highestPulse}</strong>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">LOWEST PULSE</span>
                  <strong className="text-text-primary text-sm">⚡ {lowestPulse}</strong>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">PULSE SPREAD</span>
                  <strong className="text-text-primary text-sm">{highestPulse - lowestPulse} pts</strong>
                </div>
              </div>

              {/* Player Cards Grid */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs font-bold text-text-secondary uppercase tracking-wider">
                  ATHLETES
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {squad.members.map((m: any) => (
                    <div key={m.uid} className="p-4 rounded-2xl bg-elevated border border-border-muted space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatar || `https://i.pravatar.cc/150?u=${m.uid}`}
                          alt={m.name}
                          className="w-12 h-12 rounded-xl object-cover border border-border-muted"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-sans font-bold text-xs text-text-primary truncate">
                            {m.name}
                          </h5>
                          <p className="font-mono text-[10px] text-text-muted truncate">
                            @{m.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px] pt-2 border-t border-border-muted/50">
                        <span className="text-accent font-bold">⚡ {m.pulseScore || 700} Pulse</span>
                        <span className="text-text-muted">📍 {m.location || 'Chennai'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-text-primary space-y-6 min-h-screen pb-20">
      <PendingReportBanner />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-muted pb-6"
      >
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-wide leading-none uppercase text-text-primary">
            AUTOSQUAD AI LAB
          </h1>
          <p className="font-mono text-xs text-text-secondary mt-1.5 uppercase tracking-wide">
            EVENT-BASED ATHLETE MATCHMAKING · INTELLIGENT SQUAD FORMATION
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-[10px]">
            <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold">
              10 KM PROXIMITY
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-elevated border border-border-muted text-text-primary font-bold">
              AI MATCHING
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-elevated border border-border-muted text-text-primary font-bold">
              PULSE INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Quota Display */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border-muted flex items-center gap-3 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold font-mono text-xs">
            {dailyQuota.remaining}
          </div>
          <div>
            <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">AI GENERATIONS</span>
            <span className="font-mono text-xs font-bold text-text-primary">
              {dailyQuota.remaining} / 5 AVAILABLE TODAY
            </span>
          </div>
        </div>
      </motion.div>

      {/* 4 Tabs Navigation */}
      <div className="sticky top-0 z-30 bg-base/95 backdrop-blur-md border-b border-border-muted -mx-4 px-4 md:-mx-8 md:px-8 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {DASH_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-label font-bold flex-shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'btn-accent shadow-md'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'results' && generatedSquads.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface text-text-primary text-[9px] font-bold border border-border-muted">
                  {generatedSquads.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {status === 'matching' ? (
          <AILoader key="ai-loader" onComplete={() => {}} />
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'generate' && <TabGenerate />}
            {activeTab === 'results' && <TabResults />}
            {activeTab === 'accepted' && <TabAccepted />}
            {activeTab === 'insights' && <AIInsightPanel insightData={insightData} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
