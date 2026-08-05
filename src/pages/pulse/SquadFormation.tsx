import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AILoader } from '../../components/pulse/AILoader';
import { useSquadSuggestion } from '@/hooks/useAI';
import { useAutoSquad } from '@/hooks/useAutoSquad';
import { useSquadMutations, useMyInvites, useSquadActivity } from '@/hooks/useSquads';
import { useSquadStore } from '../../store/squadStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import { Sparkles, Zap, Trash2, Check,
  Lock, Users, MessageSquare,
  Activity, Shield,
  Star, Brain, ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { PendingReportBanner } from '../../components/performance/PendingReportBanner';

// ─── Sport Config ────────────────────────────────────────────────────────────
const SPORT_OPTIONS = [
  { id: 'Football',   label: 'Football',   icon: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> },
  { id: 'Basketball', label: 'Basketball', icon: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M5.636 5.636a9 9 0 1 0 12.728 12.728A9 9 0 0 0 5.636 5.636z"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg> },
  { id: 'Cricket',    label: 'Cricket',    icon: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
];

const DASH_TABS = [
  { id: 'generate',    label: 'Generate',      icon: <Sparkles size={13} /> },
  { id: 'results',     label: 'Results',       icon: <Activity size={13} /> },
  { id: 'accepted',    label: 'Accepted',      icon: <CheckCircle2 size={13} /> },
  { id: 'invitations', label: 'Invitations',   icon: <Users size={13} /> },
  { id: 'insights',    label: 'AI Insights',   icon: <Brain size={13} /> },
  { id: 'activity',    label: 'Activity Feed', icon: <MessageSquare size={13} /> },
  { id: 'chemistry',   label: 'Chemistry',     icon: <Zap size={13} /> },
];

// Squad invitations and a cross-squad activity feed are the two surfaces on this
// page with no backend behind them. Two fabricated invitations ("Alpha Strikers FC"
// from Marcus Reid, expiring in 2h 30m) and five fabricated activity lines ("Iron
// Pulse FC won 3-1 vs Rapid XI") used to live here, identical for every athlete.
//
// Invitations need a collection with a pending state — squad_members has only
// confirmed membership — plus accept and decline endpoints. An activity feed needs
// an endpoint aggregating squad posts, scheduled events, chat and achievements
// across the squads an athlete belongs to; each of those exists on its own, but
// nothing joins them. Both are honest empty states until then.

// ─── Radar Chart ─────────────────────────────────────────────────────────────
const RadarChart: React.FC<{ squad: any }> = ({ squad }) => {
  const categories = [
    { name: 'Attack',      value: squad.winRate - 5 },
    { name: 'Defense',     value: squad.chemistry.overall - 4 },
    { name: 'Speed',       value: 82 },
    { name: 'Tactics',     value: squad.chemistry.coordination || 85 },
    { name: 'Reliability', value: squad.chemistry.trust || 88 },
    { name: 'Chemistry',   value: squad.chemistry.overall },
  ];
  const size = 150; const center = size / 2; const rMax = 52;
  const points = categories.map((cat, i) => {
    const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
    const radius = (cat.value / 100) * rMax;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle), label: cat.name, val: cat.value };
  });
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <div className="flex flex-col items-center p-4 bg-base border border-border-muted/50 rounded-2xl">
      <span className="font-mono text-[9px] text-text-secondary uppercase mb-2">Tactical Balance Index</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, idx) => (
          <polygon key={idx} points={points.map((_, i) => {
            const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
            const r = scale * rMax;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        {points.map((_, i) => {
          const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
          return <line key={i} x1={center} y1={center} x2={center + rMax * Math.cos(angle)} y2={center + rMax * Math.sin(angle)} stroke="var(--border)" strokeWidth="1" />;
        })}
        <polygon points={polygonPoints} fill="var(--volt-dim)" stroke="var(--volt)" strokeWidth="2" />
        {points.map((p, i) => {
          const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
          const lx = center + (rMax + 14) * Math.cos(angle);
          const ly = center + (rMax + 8) * Math.sin(angle) + 2;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="var(--volt)" />
              <text x={lx} y={ly} fill="var(--text-secondary)" fontSize="7" fontFamily="DM Mono" textAnchor="middle">{p.label} ({p.val})</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Chemistry Breakdown Bar ──────────────────────────────────────────────────
const ChemBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] text-text-secondary">{label}</span>
      <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-text-primary/10 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
/** The picker's labels against the skill levels the AutoSquad schema accepts. */
const SKILL_LEVEL_BY_CATEGORY: Record<string, string> = {
  Amateur: 'amateur',
  'Semi-Pro': 'semi_pro',
  Professional: 'professional',
};

export const SquadFormation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { nearbyRadius } = useAISettingsStore();
  const {
    squads, generatedSquads, declineGeneratedSquad,
  } = useSquadStore();

  const initialType = searchParams.get('type') || 'solo';
  const [entryType, setEntryType] = useState<string>(initialType);
  const [selectedSport, setSelectedSport] = useState('Football');
  const [gameplayCategory, setGameplayCategory] = useState<'Amateur' | 'Semi-Pro' | 'Professional'>('Semi-Pro');
  const [status, setStatus] = useState<'selection' | 'matching'>('selection');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [squadName, setSquadName] = useState('');
  const [forming, setForming] = useState(false);

  // The quota is the server's. It used to be a zustand counter compared against a
  // literal 3, so the limit reset on every refresh.
  const { remaining: remainingGenerations } = useAutoSquad();
  const { suggestSquad, suggestion, suggesting } = useSquadSuggestion();
  const { createSquad, addMember } = useSquadMutations();
  const {
    invites, loading: invitesLoading, error: invitesError, refresh: refreshInvites,
    respondToInvite, responding,
  } = useMyInvites();
  const {
    activity, squadCount, loading: activityLoading, error: activityError,
    refresh: refreshActivity,
  } = useSquadActivity();

  const handleGenerateSquad = async () => {
    if (remainingGenerations <= 0 || suggesting) return;
    setActiveTab('generate');
    setStatus('matching');
    try {
      // Real athletes, chosen by the server; the model only assigns roles over
      // people who exist. This used to call Gemini from the browser with the key
      // in the bundle, behind a 4.5-second setTimeout that made it feel like work
      // was happening.
      await suggestSquad({
        sport: selectedSport.toLowerCase(),
        skill_level: SKILL_LEVEL_BY_CATEGORY[gameplayCategory],
        size: entryType === 'duo' ? 2 : 5,
      });
      setActiveTab('results');
    } catch {
      // useSquadSuggestion reported it, including "not enabled on this server".
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

  /**
   * Turn the suggestion into a real squad.
   *
   * The AI suggestion is advisory and persists nothing, so "accept" used to mean
   * marking a fabricated squad accepted in zustand and navigating to a squad id
   * that did not exist. This creates the squad and adds each suggested athlete
   * through the endpoints that own those writes.
   */
  const handleFormSquad = async () => {
    if (!suggestion || suggestedAthletes.length === 0 || forming) return;
    setForming(true);
    try {
      const squad = await createSquad({
        name: squadName.trim() || `${selectedSport} Squad`,
        sport: selectedSport.toLowerCase(),
      });
      for (const athlete of suggestedAthletes) {
        await addMember({
          squadId: squad.$id,
          user_id: athlete.id,
          position: athlete.assignedRole,
        }).catch(() => {
          // One athlete who cannot be added should not lose the squad.
        });
      }
      navigate(`/pulse/squad/${squad.$id}`);
    } finally {
      setForming(false);
    }
  };

  const activeSquad = generatedSquads.find(s => s.squadId === selectedDraftId) || generatedSquads[0] || null;

  /**
   * The athletes the server selected, joined to their full rows.
   *
   * The old flow stored a fabricated squad in zustand — invented names, distances
   * and compatibility scores — and rendered that. These are real profiles.
   */
  const suggestedAthletes = (suggestion?.selected ?? []).map(sel => {
    const candidate = suggestion?.candidates.find(c => c.$id === sel.id);
    return {
      id: sel.id,
      name: candidate?.full_name || 'Athlete',
      avatar: candidate?.avatar_url ?? '',
      level: candidate?.level ?? 1,
      pulse: Math.round(candidate?.pulse_score ?? 0),
      position: candidate?.position ?? sel.assigned_role,
      assignedRole: sel.assigned_role,
      why: sel.why,
    };
  });

  // ─── Tab: Generate ───────────────────────────────────────────────────────
  const renderGenerate = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Config */}
      <div className="lg:col-span-4 space-y-5">
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 space-y-5 shadow-card">
          <h3 className="font-display text-[13px] text-text-secondary tracking-wider uppercase">Configure AI Parameters</h3>

          <div className="space-y-2">
            <label className="font-mono text-[10px] text-text-secondary uppercase">Entry Mode</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-base border border-border-muted/50 rounded-xl font-mono text-[9px]">
              {['solo', 'duo', 'full'].map(type => (
                <button key={type} onClick={() => setEntryType(type)}
                  className={`py-2 rounded-lg uppercase font-bold transition-all ${entryType === type ? 'bg-volt text-volt-text shadow-glow-volt-sm' : 'text-text-muted hover:text-text-primary'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] text-text-secondary uppercase">Sport</label>
            <div className="grid grid-cols-3 gap-2">
              {SPORT_OPTIONS.map(sport => (
                <button key={sport.id} onClick={() => setSelectedSport(sport.id)}
                  style={{ backgroundColor: selectedSport === sport.id ? 'var(--volt-dim)' : 'transparent' }}
                  className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedSport === sport.id ? 'border-volt text-volt' : 'border-border-muted/50 hover:border-border-muted text-text-secondary hover:text-text-primary'
                  }`}>
                  {sport.icon}
                  <span className="font-display text-[9px] uppercase">{sport.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] text-text-secondary uppercase">Gameplay Category</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-base border border-border-muted/50 rounded-xl font-mono text-[9px]">
              {(['Amateur', 'Semi-Pro', 'Professional'] as const).map(cat => (
                <button key={cat} onClick={() => setGameplayCategory(cat)}
                  className={`py-2 rounded-lg font-bold transition-all ${gameplayCategory === cat ? 'bg-volt text-volt-text shadow-glow-volt-sm' : 'text-text-muted hover:text-text-primary'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerateSquad} disabled={remainingGenerations <= 0}
            className={`w-full py-3.5 rounded-[12px] font-condensed font-bold text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              remainingGenerations > 0 ? 'bg-volt text-volt-text hover:scale-[1.02] shadow-glow-volt-sm cursor-pointer' : 'bg-text-primary/5 border border-border-muted text-text-secondary cursor-not-allowed'
            }`}>
            <Sparkles size={16} /> Generate My Squad
          </button>
        </div>

        {/* AI Criteria info */}
        <div style={{ backgroundColor: 'var(--volt-dim)' }} className="p-4 rounded-[16px] border border-volt/20 space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={13} className="text-volt" />
            <span className="font-mono text-[10px] text-volt uppercase tracking-wider">AI Matchmaking Criteria</span>
          </div>
          {[
            [`${nearbyRadius} KM Radius`, 'Only athletes within proximity'],
            ['Level Sync', 'Similar SPORTiX level range'],
            ['Category Match', `${gameplayCategory} players only`],
            ['Role Balance', 'All positions covered'],
            ['Activity Score', 'Active players prioritized'],
            ['Chemistry Fit', 'Compatible playing styles'],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-start gap-2">
              <Check size={10} className="text-volt mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-text-primary">{label}</span>
                <span className="font-mono text-[9px] text-text-muted ml-1">— {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Info panel */}
      <div className="lg:col-span-8">
        <div className="p-8 text-center rounded-[24px] border border-dashed border-border-muted/50 bg-surface shadow-card flex flex-col items-center justify-center space-y-5 min-h-[400px]">
          <div style={{ backgroundColor: 'var(--volt-dim)' }} className="w-20 h-20 rounded-[24px] border border-volt/20 flex items-center justify-center">
            <Sparkles size={32} className="text-volt" />
          </div>
          <div>
            <h3 className="font-display text-[22px] uppercase tracking-wider text-text-primary">AutoSquad AI Lab</h3>
            <p className="font-mono text-[11px] text-text-secondary mt-2 max-w-sm mx-auto leading-relaxed">
              Configure your parameters and click Generate to let the Gemini AI engine scan nearby athletes and build your perfect squad.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {[['3', 'Max Daily'], [remainingGenerations.toString(), 'Remaining'], [generatedSquads.length.toString(), 'Drafts']].map(([val, label]) => (
              <div key={label} className="rounded-[12px] p-3 bg-base border border-border-muted/50 text-center">
                <div className="font-display text-[22px] text-volt">{val}</div>
                <div className="font-mono text-[9px] text-text-muted">{label}</div>
              </div>
            ))}
          </div>
          {generatedSquads.length > 0 && (
            <button onClick={() => setActiveTab('results')} className="flex items-center gap-2 font-mono text-[11px] text-volt hover:underline">
              View {generatedSquads.length} Generated Result{generatedSquads.length !== 1 ? 's' : ''} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Tab: Results ────────────────────────────────────────────────────────
  const renderResults = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Draft list */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[13px] text-text-secondary tracking-wider uppercase">Generated Results</h3>
            <span style={{ backgroundColor: 'var(--volt-dim)' }} className="font-mono text-[9px] px-1.5 py-0.5 rounded text-volt border border-volt/20">
              {generatedSquads.length}/3 DAILY
            </span>
          </div>
          {[0, 1, 2].map(idx => {
            const draft = generatedSquads[idx];
            const isSelected = activeSquad?.squadId === draft?.squadId;
            if (draft) {
              return (
                <motion.div key={draft.squadId} onClick={() => setSelectedDraftId(draft.squadId)} whileHover={{ scale: 1.01 }}
                  style={{ backgroundColor: isSelected ? 'var(--volt-dim)' : 'transparent' }}
                  className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
                    isSelected ? 'border-volt shadow-card' : 'border-border-muted/50 hover:border-border-muted'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-display text-[12px] tracking-wide text-text-primary truncate">{draft.name.toUpperCase()}</p>
                    <button onClick={e => { e.stopPropagation(); handleDecline(draft.squadId); }}
                      className="p-1 rounded hover:bg-danger-dim text-text-secondary hover:text-danger transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[8px]">
                    <div className="text-center p-1 rounded bg-base">
                      <div className="text-volt font-bold">{draft.chemistry.overall}%</div>
                      <div className="text-text-muted">Chem</div>
                    </div>
                    <div className="text-center p-1 rounded bg-base">
                      <div className="text-text-primary font-bold">{draft.winRate}%</div>
                      <div className="text-text-muted">Win%</div>
                    </div>
                    <div className="text-center p-1 rounded bg-base">
                      <div className="text-cyan font-bold">{draft.members.length}</div>
                      <div className="text-text-muted">Players</div>
                    </div>
                  </div>
                  {/* Suggested Captain */}
                  {draft.members.find(m => m.role === 'captain') && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="font-mono text-[8px] text-text-muted">AI Captain:</span>
                      <span className="font-mono text-[8px] text-gold font-bold">
                        {draft.members.find(m => m.role === 'captain')?.name}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            }
            return (
              <div key={idx} className="p-4 rounded-[12px] border border-dashed border-border-muted/50 bg-base flex items-center justify-center py-5 text-text-secondary font-mono text-[10px]">
                <Lock size={11} className="mr-1.5" /> DRAFT SLOT #{idx + 1} EMPTY
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Squad detail */}
      <div className="lg:col-span-8">
        {suggestion ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* The panel this replaces described a squad the browser invented: a
                generated name, a formation, a chemistry breakdown, per-member
                distances and compatibility percentages. The proxy returns the
                athletes it selected from the database and the role it gave each. */}
            <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-mono text-[9px] text-volt font-bold tracking-widest">PROPOSED AI MATCH</span>
                  <h2 className="font-display text-[28px] uppercase leading-none mt-1 text-text-primary">
                    {suggestedAthletes.length} athlete{suggestedAthletes.length === 1 ? '' : 's'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-base border border-border-muted/50 font-mono text-[9px] text-text-secondary uppercase">
                      {selectedSport}
                    </span>
                    <span style={{ backgroundColor: 'var(--volt-dim)' }} className="px-2 py-0.5 rounded border border-volt/20 font-mono text-[9px] text-volt font-bold uppercase">
                      {gameplayCategory}
                    </span>
                    {!suggestion.ai_used && (
                      <span className="px-2 py-0.5 rounded bg-base border border-border-muted/50 font-mono text-[9px] text-text-secondary">
                        Pulse order · no AI commentary
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {suggestion.reasoning && (
                <p className="font-mono text-[11px] text-text-secondary leading-relaxed border-t border-border-muted/40 pt-3">
                  {suggestion.reasoning}
                </p>
              )}
            </div>

            {suggestedAthletes.length === 0 ? (
              <div className="p-10 text-center rounded-[24px] border border-dashed border-border-muted bg-surface">
                <h3 className="font-display text-[16px] uppercase tracking-wider text-text-primary">
                  Nobody to pick from
                </h3>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  No athletes at this level play {selectedSport} yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedAthletes.map((athlete, i) => (
                  <motion.div key={athlete.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-[16px] bg-surface border border-border-muted/50 shadow-card">
                    <img src={athlete.avatar || undefined} alt={athlete.name}
                      className="w-11 h-11 rounded-full object-cover border border-border-muted" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-condensed text-[15px] font-bold text-text-primary truncate">{athlete.name}</p>
                        <span className="px-1.5 py-0.5 rounded bg-volt-dim border border-volt/20 font-mono text-[8px] text-volt font-bold uppercase flex-shrink-0">
                          {athlete.assignedRole}
                        </span>
                      </div>
                      {athlete.why && (
                        <p className="font-mono text-[10px] text-text-secondary truncate mt-0.5">{athlete.why}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-[15px] font-bold text-volt">{athlete.pulse}</div>
                        <div className="font-mono text-[8px] text-text-muted">PULSE</div>
                      </div>
                      <BadgeIcon level={athlete.level} size={18} animate={false} glow={false} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {suggestedAthletes.length > 0 && (
              <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 space-y-3 shadow-card">
                <input
                  value={squadName}
                  onChange={e => setSquadName(e.target.value)}
                  placeholder={`${selectedSport} Squad`}
                  className="w-full h-10 rounded-[10px] bg-base border border-border-muted px-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt"
                />
                <button
                  onClick={() => void handleFormSquad()}
                  disabled={forming}
                  className="w-full py-3 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[15px] uppercase tracking-wider disabled:opacity-40"
                >
                  {forming ? 'Forming…' : `Form squad with ${suggestedAthletes.length} athlete${suggestedAthletes.length === 1 ? '' : 's'}`}
                </button>
                <p className="font-mono text-[9px] text-text-muted text-center">
                  Creates the squad and adds each athlete. They appear in your squads
                  immediately.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="p-12 text-center rounded-[24px] border border-dashed border-border-muted bg-surface shadow-card flex flex-col items-center gap-4 min-h-[350px] justify-center">
            <div className="w-16 h-16 rounded-full bg-base border border-border-muted flex items-center justify-center text-text-secondary">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-display text-[18px] uppercase tracking-wider text-text-primary">No Generated Drafts</h3>
              <p className="font-mono text-[11px] text-text-secondary mt-1">Generate a squad first to see results here.</p>
            </div>
            <button onClick={() => setActiveTab('generate')}
              className="px-5 py-2.5 bg-volt text-volt-text font-display text-[12px] tracking-wide rounded-[10px] hover:scale-105 transition-all">
              Go To Generator
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Tab: Accepted Squads ────────────────────────────────────────────────
  const renderAccepted = () => (
    <div className="space-y-5">
      {squads.length === 0 ? (
        <div className="p-12 text-center rounded-[24px] border border-dashed border-border-muted bg-surface shadow-card flex flex-col items-center gap-4 min-h-[300px] justify-center">
          <div style={{ backgroundColor: 'var(--volt-dim)' }} className="w-14 h-14 rounded-[18px] border border-volt/20 flex items-center justify-center">
            <Users size={22} className="text-volt" />
          </div>
          <div>
            <h3 className="font-display text-[18px] uppercase tracking-wider text-text-primary">No Accepted Squads</h3>
            <p className="font-mono text-[11px] text-text-secondary mt-1">Accept a generated squad to unlock the full coordination workspace.</p>
          </div>
          <button onClick={() => setActiveTab('generate')} className="px-5 py-2.5 bg-volt text-volt-text font-display text-[12px] tracking-wide rounded-[10px] hover:scale-105 transition-all">
            Generate A Squad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {squads.map((squad, i) => (
            <motion.div key={squad.squadId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-[20px] border p-5 space-y-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--volt-dim) 0%, var(--bg-surface) 100%)', borderColor: 'var(--accent-border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[17px] text-text-primary tracking-wide">{squad.name}</h3>
                  <p className="font-mono text-[10px] text-text-secondary mt-0.5">{squad.sport} · {squad.formation} · {squad.members.length} Members</p>
                </div>
                <span style={{ backgroundColor: 'var(--volt-dim)' }} className="px-2 py-1 rounded-lg border border-volt/20 font-mono text-[9px] text-volt font-bold">
                  {squad.chemistry.overall}% CHEM
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                <div className="p-2 rounded-lg bg-base text-center">
                  <div className="text-volt font-bold text-[14px]">{squad.winRate}%</div>
                  <div className="text-text-muted">Win Rate</div>
                </div>
                <div className="p-2 rounded-lg bg-base text-center">
                  <div className="text-text-primary font-bold text-[14px]">{squad.matchHistory?.length || 0}</div>
                  <div className="text-text-muted">Matches</div>
                </div>
                <div className="p-2 rounded-lg bg-base text-center">
                  <div className="text-gold font-bold text-[14px]">{squad.pulseAvg}</div>
                  <div className="text-text-muted">Avg Pulse</div>
                </div>
              </div>
              {/* Members row */}
              <div className="flex -space-x-2">
                {squad.members.slice(0, 6).map(m => (
                  <img key={m.uid} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-surface object-cover" />
                ))}
                {squad.members.length > 6 && (
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-elevated flex items-center justify-center font-mono text-[8px] text-text-muted">
                    +{squad.members.length - 6}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/pulse/squad/${squad.squadId}`)}
                  className="flex-1 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[11px] font-bold hover:scale-105 transition-all flex items-center justify-center gap-1.5">
                  <MessageSquare size={12} /> Open Workspace
                </button>
                <button onClick={() => navigate(`/pulse/squad/${squad.squadId}/chat`)}
                  className="px-3 py-2 rounded-[10px] border border-border-muted bg-elevated text-text-secondary hover:text-text-primary font-mono text-[11px] transition-all">
                  <MessageSquare size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Tab: Invitations ────────────────────────────────────────────────────
  const renderInvitations = () => {
    if (invitesLoading) {
      return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading invitations">
          {[0, 1].map(i => (
            <div key={i} className="h-24 rounded-[18px] bg-elevated animate-shimmer" />
          ))}
        </div>
      );
    }

    if (invitesError) {
      return (
        <div className="p-8 text-center rounded-[24px] border border-border-muted bg-surface space-y-3">
          <h3 className="font-display text-[16px] uppercase tracking-wider text-text-primary">
            Invitations did not load
          </h3>
          <p className="font-mono text-[11px] text-text-secondary">{invitesError.message}</p>
          <button onClick={() => refreshInvites()}
            className="px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase">
            Retry
          </button>
        </div>
      );
    }

    if (invites.length === 0) {
      return (
        <div className="p-10 text-center rounded-[24px] border border-dashed border-border-muted bg-surface flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-base border border-border-muted flex items-center justify-center text-text-secondary">
            <Users size={22} />
          </div>
          <div>
            <h3 className="font-display text-[16px] uppercase tracking-wider text-text-primary">
              No invitations
            </h3>
            <p className="font-mono text-[11px] text-text-secondary mt-1 max-w-xs">
              When a captain invites you to their squad, it appears here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
            Pending Invitations ({invites.length})
          </span>
        </div>
        {invites.map((inv, i) => (
          <motion.div key={inv.$id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="p-5 rounded-[18px] border border-border-muted bg-surface shadow-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img src={inv.inviter.avatar_url ?? undefined} alt={inv.inviter.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-[14px] text-text-primary truncate">{inv.squad.name}</div>
              <div className="font-mono text-[10px] text-text-secondary mt-0.5">
                {inv.inviter.full_name || 'A captain'} · {inv.squad.sport}
                {inv.position ? ` · ${inv.position}` : ''}
              </div>
              {inv.message && (
                <p className="font-mono text-[10px] text-text-secondary mt-1.5 italic truncate">
                  &ldquo;{inv.message}&rdquo;
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[9px] text-volt">
                  {inv.squad.members_count} member{inv.squad.members_count === 1 ? '' : 's'}
                </span>
                {/* A real deadline from the server, not "2h 30m" written into the page. */}
                <span className="font-mono text-[9px] text-text-muted">
                  expires in {Math.max(1, Math.round(inv.expires_in_seconds / 3600))}h
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 self-stretch sm:self-auto">
              <button
                onClick={() => void respondToInvite({ inviteId: inv.$id, accept: true })}
                disabled={responding}
                className="flex-1 sm:flex-none px-4 py-2 rounded-[10px] bg-volt text-volt-text font-condensed font-bold text-[13px] uppercase tracking-wider disabled:opacity-40"
              >
                Accept
              </button>
              <button
                onClick={() => void respondToInvite({ inviteId: inv.$id, accept: false })}
                disabled={responding}
                className="flex-1 sm:flex-none px-4 py-2 rounded-[10px] bg-elevated border border-border-muted text-text-secondary font-condensed font-bold text-[13px] uppercase tracking-wider hover:text-text-primary disabled:opacity-40"
              >
                Decline
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // ─── Tab: AI Insights ────────────────────────────────────────────────────
  const renderInsights = () => {
    const squad = squads[0] || generatedSquads[0];
    return (
      <div className="space-y-5">
        {squad ? (
          <>
            <div style={{ backgroundColor: 'var(--volt-dim)' }} className="p-5 rounded-[20px] border border-volt/20 space-y-4">
              <div className="flex items-center gap-2">
                <Brain size={15} className="text-volt" />
                <h3 className="font-display text-[15px] text-text-primary tracking-wider uppercase">AI Team Analysis — {squad.name}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Leadership Score',   value: '92/100',   desc: 'Captain effectiveness', color: 'var(--gold)' },
                  { label: 'Teamwork Index',      value: `${squad.chemistry.coordination}`,  desc: 'Based on coordination',  color: 'var(--volt)' },
                  { label: 'Sportsmanship',       value: '88/100',   desc: 'Post-match conduct',    color: 'var(--cyan)' },
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-[14px] bg-base border border-border-muted/50 text-center">
                    <div className="font-display text-[28px]" style={{ color: metric.color }}>{metric.value}</div>
                    <div className="font-label text-[12px] text-text-primary font-semibold mt-1">{metric.label}</div>
                    <div className="font-mono text-[9px] text-text-muted">{metric.desc}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-[14px] bg-base border border-border-muted/50">
                <div className="font-mono text-[9px] text-volt uppercase tracking-wider mb-2">AI Tactical Recommendation</div>
                <p className="font-mono text-[11px] text-text-secondary leading-relaxed">
                  {squad.tacticalNotes || `Your squad shows exceptional coordination patterns. Consider switching to a high-press system leveraging ${squad.members[0]?.name}'s pace upfront. Chemistry is above threshold — activating XP boost on next practice session confirmation.`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-cyan" />
                  <span className="font-display text-[13px] text-text-primary tracking-wider">CAPTAIN CANDIDATES</span>
                </div>
                {squad.members.slice(0, 3).map((m, i) => (
                  <div key={m.uid} className="flex items-center gap-3">
                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-text-primary truncate">{m.name}</div>
                      <div className="font-mono text-[9px] text-text-muted">{m.position} · Pulse {m.pulseScore}</div>
                    </div>
                    <div className="font-mono text-[10px] font-bold" style={{ color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                      {[92, 88, 84][i]}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-volt" />
                  <span className="font-display text-[13px] text-text-primary tracking-wider">TOP PERFORMERS</span>
                </div>
                {squad.members.slice(0, 3).map((m, i) => (
                  <div key={m.uid} className="flex items-center gap-3">
                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-text-primary truncate">{m.name}</div>
                      <div className="font-mono text-[9px] text-text-muted">{m.tier} · Compat {m.compatibility}%</div>
                    </div>
                    <div className="font-mono text-[10px] text-volt font-bold">{[m.pulseScore, m.pulseScore - 20, m.pulseScore - 45][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center rounded-[24px] border border-dashed border-border-muted bg-surface shadow-card">
            <Brain size={28} className="text-text-muted mx-auto mb-3" />
            <p className="font-mono text-[11px] text-text-secondary">Generate or accept a squad to unlock AI match insights and captain recommendations.</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Tab: Activity Feed ──────────────────────────────────────────────────
  const renderActivity = () => {
    if (activityLoading) {
      return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading squad activity">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 rounded-[14px] bg-elevated animate-shimmer" />
          ))}
        </div>
      );
    }

    if (activityError) {
      return (
        <div className="p-8 text-center rounded-[24px] border border-border-muted bg-surface space-y-3">
          <h3 className="font-display text-[16px] uppercase tracking-wider text-text-primary">
            Activity did not load
          </h3>
          <p className="font-mono text-[11px] text-text-secondary">{activityError.message}</p>
          <button onClick={() => refreshActivity()}
            className="px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase">
            Retry
          </button>
        </div>
      );
    }

    if (activity.length === 0) {
      return (
        <div className="p-10 text-center rounded-[24px] border border-dashed border-border-muted bg-surface flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-base border border-border-muted flex items-center justify-center text-text-secondary">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="font-display text-[16px] uppercase tracking-wider text-text-primary">
              Nothing has happened yet
            </h3>
            <p className="font-mono text-[11px] text-text-secondary mt-1 max-w-xs">
              {squadCount === 0
                ? 'Join or form a squad and its posts, sessions and achievements appear here.'
                : 'Posts, scheduled sessions, announcements and achievements from your squads will show up here.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-4">
          Squad Activity Feed · {squadCount} squad{squadCount === 1 ? '' : 's'}
        </div>
        {activity.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-4 rounded-[14px] border border-border-muted bg-surface shadow-card">
            <div
              style={{
                backgroundColor:
                  item.type === 'achievement' ? 'var(--gold-surface)'
                    : item.type === 'event' ? 'var(--volt-dim)'
                      : 'var(--bg-elevated)',
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary"
            >
              {item.type === 'achievement' ? <Star size={12} />
                : item.type === 'event' ? <CheckCircle2 size={12} />
                  : item.type === 'message' ? <MessageSquare size={12} />
                    : <Activity size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] text-text-primary leading-snug">{item.text}</p>
              {item.detail && (
                <p className="font-mono text-[10px] text-text-secondary mt-0.5 truncate">{item.detail}</p>
              )}
              <span className="font-mono text-[9px] text-text-muted mt-1 block">
                {new Date(item.at).toLocaleString([], {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // ─── Tab: Chemistry Overview ─────────────────────────────────────────────
  const renderChemistry = () => {
    const squad = squads[0] || generatedSquads[0];
    if (!squad) return (
      <div className="p-10 text-center rounded-[24px] border border-dashed border-border-muted bg-surface shadow-card">
        <Zap size={28} className="text-text-muted mx-auto mb-3" />
        <p className="font-mono text-[11px] text-text-secondary">Accept a squad to view detailed team chemistry analytics.</p>
      </div>
    );
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RadarChart squad={squad} />
          <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-3">
            <span className="font-display text-[13px] text-text-primary tracking-wider uppercase">Chemistry Factors</span>
            <ChemBar label="Overall Chemistry"   value={squad.chemistry.overall}          color="var(--volt)" />
            <ChemBar label="Trust"               value={squad.chemistry.trust}            color="var(--success)" />
            <ChemBar label="Coordination"        value={squad.chemistry.coordination}     color="var(--volt)" />
            <ChemBar label="Communication"       value={squad.chemistry.communication}    color="var(--info)" />
            <ChemBar label="Retention Score"     value={squad.chemistry.retentionScore ?? 0}   color="var(--plasma)" />
            <ChemBar label="Activity Score"      value={squad.chemistry.activityScore ?? 0}    color="var(--hot)" />
            <ChemBar label="Consistency Score"   value={squad.chemistry.consistencyScore ?? 0} color="var(--volt)" />
          </div>
        </div>
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card">
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-4 block">Player Compatibility Matrix</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {squad.members.map(m => {
              const comp = m.compatibility ?? 0;
              return (
                <div key={m.uid} className="flex items-center gap-2 p-2 rounded-[10px] bg-base border border-border-muted/50">
                  <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[9px] text-text-primary truncate">{m.name.split(' ')[0]}</div>
                    <div className="font-mono text-[9px]" style={{ color: comp >= 90 ? 'var(--volt)' : comp >= 80 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                      {comp}% compat
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-text-primary space-y-6 min-h-screen pb-20">

      {/* Pending report banner */}
      <PendingReportBanner />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-muted/50 pb-6">
        <div>
          <h1 className="font-display text-[36px] md:text-[44px] tracking-wide leading-none uppercase text-text-primary">AUTOSQUAD AI LAB</h1>
          <p className="font-mono text-[11px] text-text-secondary mt-1.5 uppercase">
            Gemini AI matchmaking · Proximity limit: <strong className="text-text-primary">{nearbyRadius} KM</strong> · Level-matched
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-surface border border-border-muted/50 rounded-xl flex items-center gap-3 shadow-card">
            <div style={{ backgroundColor: 'var(--volt-dim)' }} className="w-8 h-8 rounded-lg flex items-center justify-center text-volt">
              <Zap size={15} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-text-secondary block">DAILY GENERATIONS</span>
              <strong className="font-mono text-[14px] text-text-primary">{remainingGenerations} / 3 <span className="text-text-secondary text-[10px]">LEFT</span></strong>
            </div>
          </div>
          <div className="p-3 bg-surface border border-border-muted/50 rounded-xl flex items-center gap-3 shadow-card">
            <div className="w-8 h-8 rounded-lg bg-base flex items-center justify-center text-text-muted">
              <Users size={15} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-text-secondary block">ACCEPTED SQUADS</span>
              <strong className="font-mono text-[14px] text-text-primary">{squads.length}</strong>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sticky Tab Nav */}
      <div className="sticky top-0 z-30 bg-base/95 backdrop-blur-md border-b border-border-muted/50 -mx-4 px-4 md:-mx-8 md:px-8 py-2">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {DASH_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-label font-semibold flex-shrink-0 transition-all ${
                activeTab === tab.id ? 'bg-volt text-volt-text shadow-glow-volt-sm font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}>
              {tab.icon} {tab.label}
              {tab.id === 'results' && generatedSquads.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-volt text-volt-text text-[8px] font-bold flex items-center justify-center">
                  {generatedSquads.length}
                </span>
              )}
              {tab.id === 'invitations' && invites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f97316] text-white text-[8px] font-bold flex items-center justify-center">
                  {invites.length}
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
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === 'generate'    && renderGenerate()}
            {activeTab === 'results'     && renderResults()}
            {activeTab === 'accepted'    && renderAccepted()}
            {activeTab === 'invitations' && renderInvitations()}
            {activeTab === 'insights'    && renderInsights()}
            {activeTab === 'activity'    && renderActivity()}
            {activeTab === 'chemistry'   && renderChemistry()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
