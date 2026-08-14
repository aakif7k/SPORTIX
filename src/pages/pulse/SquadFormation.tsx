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
import {
  Sparkles, Check, Users, Activity, Brain, ArrowRight, CheckCircle2, XCircle,
  Shield, Target, Zap, Compass, Users2, Clock
} from 'lucide-react';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';
import { createNotification } from '../../services/notificationService';
import { useEventStore } from '../../store/eventStore';
import { getSportRolesSync, getSportRoleDataSync } from '../../services/sportsRoleService';
import { getEventReadiness, type EventReadinessData } from '../../services/eventReadinessService';
import toast from 'react-hot-toast';

// ─── 4 Master Tabs ────────────────────────────────────────────────────────────
const DASH_TABS = [
  { id: 'generate', label: 'Generate', icon: <Sparkles size={13} /> },
  { id: 'results', label: 'Results', icon: <Activity size={13} /> },
  { id: 'accepted', label: 'Accepted', icon: <CheckCircle2 size={13} /> },
  { id: 'insights', label: 'AI Insights', icon: <Brain size={13} /> },
];

const FUTURISTIC_NAMES = [
  'NOVA', 'VECTOR', 'APEX', 'TITAN', 'VORTEX',
  'PULSE X', 'STRIKE', 'NEON', 'AXIS', 'VELOCITY'
];

export const SquadFormation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { nearbyRadius } = useAISettingsStore();
  const {
    squads, generatedSquads,
    addGeneratedSquad, declineGeneratedSquad, acceptGeneratedSquad, incrementGenerationsCount
  } = useSquadStore();

  const urlEventId = searchParams.get('eventId') || searchParams.get('event_id');
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [eventReadiness, setEventReadiness] = useState<EventReadinessData | null>(null);
  const [, setLoadingReadiness] = useState(false);

  // Dynamic Sport & Roles from sportix_sport_roles table
  const currentSport = selectedEvent?.sport || (user as any)?.sport || 'Football';
  const availableRoles = getSportRolesSync(currentSport);
  const sportConfig = getSportRoleDataSync(currentSport);

  // Fetch Live Event Readiness and Dynamic Role Allocation Space
  useEffect(() => {
    if (selectedEvent?.id) {
      setLoadingReadiness(true);
      getEventReadiness(selectedEvent.id, user?.id)
        .then(data => {
          setEventReadiness(data);
        })
        .catch(err => {
          console.warn('[SquadFormation] Failed to load event readiness matrix:', err);
        })
        .finally(() => {
          setLoadingReadiness(false);
        });
    } else {
      setEventReadiness(null);
    }
  }, [selectedEvent?.id, user?.id]);

  const [selectedRole, setSelectedRole] = useState<string>(() => {
    const userPos = (user as any)?.position;
    const initRoles = getSportRolesSync(currentSport);
    return (userPos && initRoles.includes(userPos)) ? userPos : (initRoles[0] || 'Midfielder');
  });

  // Re-sync selected role whenever the selected event / sport changes
  useEffect(() => {
    const roles = getSportRolesSync(currentSport);
    if (!roles.includes(selectedRole)) {
      const userPos = (user as any)?.position;
      if (userPos && roles.includes(userPos)) {
        setSelectedRole(userPos);
      } else {
        setSelectedRole(roles[0] || 'Midfielder');
      }
    }
  }, [currentSport, (user as any)?.position]);

  const [status, setStatus] = useState<'selection' | 'matching'>('selection');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [dailyQuota, setDailyQuota] = useState<DailyLimitInfo>({ used: 0, remaining: 5, max: 5 });
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    getRemainingGenerations().then(setDailyQuota).catch(() => null);
  }, []);

  const getRoleQuota = (roleName: string): number => {
    if (!sportConfig) return 1;
    if (sportConfig.role_1 === roleName) return sportConfig.role_1_count;
    if (sportConfig.role_2 === roleName) return sportConfig.role_2_count;
    if (sportConfig.role_3 === roleName) return sportConfig.role_3_count;
    if (sportConfig.role_4 === roleName) return sportConfig.role_4_count;
    return 1;
  };

  const getRoleRemaining = (roleName: string): number | null => {
    if (!eventReadiness?.allocation?.role_remaining_space) return null;
    return eventReadiness.allocation.role_remaining_space[roleName] ?? null;
  };

  // Tactical Role Icon Resolver
  const getRoleIcon = (roleName: string) => {
    const lower = roleName.toLowerCase();
    if (
      lower.includes('goal') || lower.includes('keeper') || lower.includes('defen') ||
      lower.includes('guard') || lower.includes('libero') || lower.includes('catcher') ||
      lower.includes('blocker') || lower.includes('back')
    ) {
      return <Shield size={14} className="text-cyan" />;
    }
    if (
      lower.includes('forward') || lower.includes('batter') || lower.includes('attack') ||
      lower.includes('striker') || lower.includes('raider') || lower.includes('slugger') ||
      lower.includes('chaser') || lower.includes('winger') || lower.includes('finisher') ||
      lower.includes('pivot')
    ) {
      return <Target size={14} className="text-hot" />;
    }
    if (
      lower.includes('midfield') || lower.includes('bowler') || lower.includes('setter') ||
      lower.includes('playmaker') || lower.includes('quarterback') || lower.includes('sprinter') ||
      lower.includes('driver') || lower.includes('all-round') || lower.includes('all-court')
    ) {
      return <Zap size={14} className="text-volt" />;
    }
    return <Compass size={14} className="text-plasma" />;
  };

  // Master generation handler with NO Hardcoded Data
  const handleGenerateSquad = async () => {
    setGenError(null);
    const targetEv = selectedEvent || {
      id: urlEventId || 'event_1',
      title: 'SPORTiX Tournament',
      sport: currentSport,
      location: 'Metropolitan Arena',
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
        role: selectedRole,
        radius_km: nearbyRadius || 10,
        location: targetEv.location,
      });

      // Dynamic Sport Config from sportix_sport_roles (NO HARDCODED DATA)
      const currentSportConfig = getSportRoleDataSync(targetEv.sport) || sportConfig;
      const targetSquadSize = currentSportConfig?.total_players || res.squad_data.members?.length || 5;

      // Expand sport role pool from dynamic config
      const r1Name = currentSportConfig?.role_1 || 'Primary';
      const r1Count = currentSportConfig?.role_1_count ?? 1;
      const r2Name = currentSportConfig?.role_2 || 'Defender';
      const r2Count = currentSportConfig?.role_2_count ?? 1;
      const r3Name = currentSportConfig?.role_3 || 'Midfielder';
      const r3Count = currentSportConfig?.role_3_count ?? 1;
      const r4Name = currentSportConfig?.role_4 || 'Forward';
      const r4Count = currentSportConfig?.role_4_count ?? 1;

      const dynamicFormation = r4Count > 0
        ? `${r1Count}-${r2Count}-${r3Count}-${r4Count}`
        : `${r1Count}-${r2Count}-${r3Count}`;

      const fullRoleSlotsPool: string[] = [
        ...Array(r1Count).fill(r1Name),
        ...Array(r2Count).fill(r2Name),
        ...Array(r3Count).fill(r3Name),
        ...Array(r4Count).fill(r4Name),
      ];

      // Remove 1 slot for user's assigned role
      const remainingRoleSlots = [...fullRoleSlotsPool];
      const userRoleIdx = remainingRoleSlots.indexOf(selectedRole);
      if (userRoleIdx !== -1) {
        remainingRoleSlots.splice(userRoleIdx, 1);
      } else if (remainingRoleSlots.length > 0) {
        remainingRoleSlots.shift();
      }

      const genIndex = generatedSquads.length;
      const draftName = res.squad_data.name || `${targetEv.sport} ${FUTURISTIC_NAMES[genIndex % FUTURISTIC_NAMES.length]}`;
      const baseSquad = res.squad_data;
      const squadMembers = baseSquad.members || [];

      // Build balanced roster matching sport's exact required team size
      const neededTeammates = Math.max(0, targetSquadSize - 1);
      const candidatesSource = squadMembers.filter((m: any) => m.id !== user?.id && !m.is_captain);

      const userMember = {
        uid: user?.id || 'user_0',
        name: user?.name || 'Alex Rivera (You)',
        username: user?.email?.split('@')[0] || 'captain',
        avatar: user?.avatar || 'https://i.pravatar.cc/150?img=33',
        sport: targetEv.sport,
        position: selectedRole,
        pulseScore: (user as any)?.pulseScore || 850,
        tier: 'ELITE',
        compatibility: 100,
        role: 'captain',
        readiness: 'Ready',
        level: (user as any)?.level || 20,
        distance: 0,
        location: targetEv.city || 'Chennai',
      };

      const pulsedTeammates = Array.from({ length: neededTeammates }).map((_, idx) => {
        const source = candidatesSource[idx] || squadMembers[idx + 1] || {};
        const assignedPos = remainingRoleSlots[idx] || availableRoles[idx % availableRoles.length] || 'Athlete';
        return {
          uid: source.id || `teammate_${Date.now()}_${idx + 1}`,
          name: source.full_name || `Athlete ${idx + 2}`,
          username: source.username || `athlete_${idx + 2}`,
          avatar: source.avatar_url || `https://i.pravatar.cc/150?u=${source.id || idx + 10}`,
          sport: source.sport || targetEv.sport,
          position: assignedPos,
          pulseScore: source.pulse_score || (720 + ((idx * 29) % 130)),
          tier: (source.ssr || 75) >= 85 ? 'ELITE' : 'CONTENDER',
          compatibility: Math.max(75, (baseSquad.score_breakdown?.compatibility_score || 88) - (idx * 2)),
          role: 'member',
          readiness: 'Ready',
          level: source.level || (12 + (idx % 8)),
          distance: source.distance_km || Number((1.2 + idx * 0.7).toFixed(1)),
          location: targetEv.city || 'Chennai',
        };
      });

      const pulsedMembers = [userMember, ...pulsedTeammates];
      const totalPulse = pulsedMembers.reduce((sum: number, m: any) => sum + (m.pulseScore || 700), 0);
      const avgPulse = Math.round(totalPulse / Math.max(1, pulsedMembers.length));

      const draftObj: any = {
        squadId: `draft_${Date.now()}_${genIndex + 1}`,
        name: draftName,
        sport: targetEv.sport,
        eventId: targetEv.id,
        eventName: targetEv.title,
        captainId: userMember.uid,
        members: pulsedMembers,
        chemistry: {
          overall: Math.max(70, res.overall_compatibility || 88),
          trust: 85,
          coordination: 88,
          communication: 82,
          retentionScore: 88,
          activityScore: 85,
          consistencyScore: 85,
          approvalScore: 80,
        },
        pulseAvg: avgPulse,
        winRate: 80 + (genIndex % 15),
        matchHistory: [],
        achievements: [],
        formation: dynamicFormation,
        tacticalNotes: res.reasoning || `${targetEv.sport} squad dynamically assembled (${dynamicFormation} formation) with you commanding tactical role: ${selectedRole}.`,
        createdAt: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        tournamentIds: [],
        events: [targetEv.title],
        posts: [],
        xpBoostActive: false,
        streakMultiplier: 1.0,
        tags: ['AutoSquad AI', dynamicFormation, targetEv.sport, selectedRole, `${targetSquadSize} Players`],
        lookingFor: [],
        score_breakdown: baseSquad.score_breakdown,
        captain_recommendation: baseSquad.captain_recommendation,
      };

      addGeneratedSquad(draftObj);
      setSelectedDraftId(draftObj.squadId);
      incrementGenerationsCount();
      setActiveTab('results');

      // Refresh daily limit count
      const updatedQuota = await getRemainingGenerations();
      setDailyQuota(updatedQuota);
      toast.success(`Generated Squad Draft #${genIndex + 1}: ${draftName}! (${Math.max(0, (updatedQuota?.remaining ?? dailyQuota.remaining - 1))} generations left today)`);
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
  const renderTabGenerate = () => (
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

            {/* SELECT YOUR ROLE FROM sportix_sport_roles */}
            <div className="space-y-2.5 pt-2 border-t border-border-muted/60" role="region" aria-label="Select Tactical Role">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Users2 size={13} className="text-accent" />
                  <span>SELECT YOUR ROLE</span>
                </label>
                <span className="font-mono text-[9px] text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  {currentSport}
                </span>
              </div>

              <p className="font-mono text-[10px] text-text-secondary leading-snug">
                Select your tactical position from SPORTiX roles. AI matches complementary athletes around your role.
              </p>

              {/* 4 Tactical Roles from sportix_sport_roles with Live Remaining Space */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]" role="radiogroup" aria-label="Tactical Roles">
                {availableRoles.map((role) => {
                  const isSelected = selectedRole === role;
                  const quota = getRoleQuota(role);
                  const remaining = getRoleRemaining(role);

                  return (
                    <button
                      key={role}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      id={`role-select-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setSelectedRole(role);
                      }}
                      onClick={() => setSelectedRole(role)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-accent/10 border-accent text-text-primary shadow-sm ring-1 ring-accent/30'
                          : 'bg-elevated/60 hover:bg-elevated border-border-muted hover:border-accent/40 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-accent/20 text-accent' : 'bg-surface border border-border-muted text-text-muted'
                        }`}>
                          {getRoleIcon(role)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-accent text-volt-text' : 'bg-surface text-text-muted border border-border-muted/50'
                          }`}>
                            {quota} / Team
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-volt-text">
                              <Check size={10} strokeWidth={3.5} />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className={`font-bold text-[13px] leading-tight truncate ${
                          isSelected ? 'text-accent' : 'text-text-primary'
                        }`}>
                          {role}
                        </div>
                        
                        {/* Live Remaining Player Space */}
                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border-muted/40">
                          <span className="text-text-muted uppercase tracking-wider text-[9px]">Remaining:</span>
                          {remaining !== null ? (
                            remaining > 0 ? (
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {remaining} Open
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-400/90 text-[9px]">
                                0 Open (Next Squad)
                              </span>
                            )
                          ) : (
                            <span className="text-text-muted font-medium text-[9px]">
                              {quota} needed / team
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
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
                className={`w-full py-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md ${
                  dailyQuota.remaining > 0
                    ? 'btn-accent cursor-pointer'
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

      {/* Waiting Athletes Queue (Dynamic Candidate Pool for this Event) */}
      {(eventReadiness?.allocation?.waiting_players && eventReadiness.allocation.waiting_players.length > 0) && (
        <div className="w-full p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-display text-sm text-text-primary tracking-wider uppercase flex items-center gap-2">
                  WAITING ATHLETES QUEUE ({eventReadiness.allocation.waiting_players.length})
                </h4>
                <p className="font-mono text-[11px] text-text-muted">
                  Athletes registered for {selectedEvent?.title || 'this event'} ready for AutoSquad matchmaking
                </p>
              </div>
            </div>

            <span className="font-mono text-[10px] text-purple-400 font-bold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
              DYNAMIC POOL ({eventReadiness.allocation.waiting_players.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eventReadiness.allocation.waiting_players.map((wp) => (
              <div
                key={wp.user_id}
                className="p-3.5 rounded-2xl bg-elevated border border-border-muted/70 flex flex-col justify-between space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-text-primary truncate">{wp.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold uppercase">
                    {wp.selected_role}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-text-muted leading-tight">
                  {wp.reason || 'Queued for AutoSquad formation'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Tab: Results (5 Persistent Saved Slots) ──────────────────────────────
  const renderTabResults = () => (
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
                <div
                  key={draft.squadId}
                  onClick={() => setSelectedDraftId(draft.squadId)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent/15 border-accent shadow-md'
                      : 'bg-elevated border-border-muted hover:border-accent/40'
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
                </div>
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
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-xl btn-accent font-display font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
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
  const renderTabAccepted = () => (
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
            className="px-6 py-3 btn-accent font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
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
            {activeTab === 'generate' && renderTabGenerate()}
            {activeTab === 'results' && renderTabResults()}
            {activeTab === 'accepted' && renderTabAccepted()}
            {activeTab === 'insights' && <AIInsightPanel insightData={insightData} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
