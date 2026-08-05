import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Settings, UserPlus, Crown, Shield,
  Zap, Check, X, MoreVertical,
  UserMinus, Edit2, LogOut, Trash2, Lock
} from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { useCrew } from '@/hooks/useCrew';
import { useAuthStore } from '../../store/authStore';

// ─── Mock Crew Data ───────────────────────────────────────────────────────────
const READINESS_COLOR: Record<string, string> = {
  ready: 'var(--accent)',
  maybe: 'var(--warning)',
  unavailable: 'var(--text-muted)',
};

const READINESS_LABEL: Record<string, string> = {
  ready: 'Ready',
  maybe: 'Maybe',
  unavailable: 'Unavailable',
};

type SettingsAction =
  | 'changeAdmin' | 'rename' | 'permissions' | 'invite' | 'leave' | 'delete';

// ─── Settings Modal ───────────────────────────────────────────────────────────
const CrewSettingsModal: React.FC<{
  onClose: () => void;
  crewName: string;
  onRename: (n: string) => void;
  onDisband: () => void;
  members: Array<{ user_id: string; full_name: string; avatar_url: string | null; level: number }>;
  currentUserId: string;
}> = ({ onClose, crewName, onRename, onDisband, members, currentUserId }) => {
  const [view, setView] = useState<SettingsAction | null>(null);
  const [newName, setNewName] = useState(crewName);

  const SETTINGS_ITEMS = [
    { id: 'changeAdmin'  as SettingsAction, label: 'Change Crew Admin',      icon: <Crown size={14} />,      color: 'var(--warning)' },
    { id: 'rename'       as SettingsAction, label: 'Edit Crew Name',          icon: <Edit2 size={14} />,      color: 'var(--accent)' },
    { id: 'permissions'  as SettingsAction, label: 'Manage Join Permissions', icon: <Lock size={14} />,       color: 'var(--info)' },
    { id: 'invite'       as SettingsAction, label: 'Invite New Players',       icon: <UserPlus size={14} />,   color: 'var(--plasma)' },
    { id: 'leave'        as SettingsAction, label: 'Leave Crew',               icon: <LogOut size={14} />,     color: 'var(--danger)' },
    { id: 'delete'       as SettingsAction, label: 'Delete Crew',              icon: <Trash2 size={14} />,     color: 'var(--danger)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28 }}
        className="w-full md:max-w-sm rounded-t-[28px] md:rounded-[24px] overflow-hidden premium-card border border-border"
        style={{ background: 'var(--bg-surface)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          {view ? (
            <button onClick={() => setView(null)} className="flex items-center gap-2 text-text-muted hover:text-text-primary font-mono text-[11px]">
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <span className="font-display text-[16px] text-text-primary tracking-wider uppercase">CREW SETTINGS</span>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary">
            <X size={13} />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {!view && SETTINGS_ITEMS.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-[14px] text-left transition-all hover:bg-hover border border-transparent hover:border-border">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-surface)', color: item.color }}>
                {item.icon}
              </div>
              <span className="font-mono text-[12px] text-text-primary">{item.label}</span>
              <ChevronLeft size={12} className="text-text-muted ml-auto rotate-180" />
            </button>
          ))}

          {/* Rename sub-view */}
          {view === 'rename' && (
            <div className="space-y-4">
              <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">New Crew Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] bg-elevated border border-border text-text-primary font-mono text-[13px] outline-none focus:border-accent/50"
                placeholder="Enter crew name..." />
              <button onClick={() => { onRename(newName); setView(null); }}
                className="w-full py-3 rounded-[12px] font-display text-[13px] tracking-wide"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--volt-text)' }}>
                Save Name
              </button>
            </div>
          )}

          {/* Permissions sub-view */}
          {view === 'permissions' && (
            <div className="space-y-3">
              {[
                { label: 'Open to Everyone', desc: 'Anyone can join with a link' },
                { label: 'Invite Only', desc: 'Only admin can invite' },
                { label: 'Approval Required', desc: 'Admin approves each request' },
              ].map((opt, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3.5 rounded-[14px] border border-border bg-elevated text-left">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i === 1 ? 'border-accent bg-accent' : 'border-border'}`}>
                    {i === 1 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-base)]" />}
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-text-primary">{opt.label}</div>
                    <div className="font-mono text-[9px] text-text-muted">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Change Admin sub-view */}
          {view === 'changeAdmin' && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] text-text-muted mb-3">Select a new crew admin:</p>
              {/* Real crew members. crew_members has captain and member and no
                  transfer endpoint, so this lists who could take over rather than
                  claiming to hand the captaincy across. */}
              {members.filter(m => m.user_id !== currentUserId).map(m => (
                <button key={m.user_id} disabled
                  className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-border bg-elevated opacity-60 cursor-not-allowed transition-all">
                  <img src={m.avatar_url ?? undefined} alt={m.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-mono text-[11px] text-text-primary">{m.full_name || 'Athlete'}</div>
                    <div className="font-mono text-[9px] text-text-muted">Lvl {m.level}</div>
                  </div>
                  <Crown size={13} className="text-text-muted" />
                </button>
              ))}
              {members.length <= 1 && (
                <p className="font-mono text-[10px] text-text-muted">
                  There is nobody else in the crew yet.
                </p>
              )}
            </div>
          )}

          {/* Leave / Delete confirmations */}
          {(view === 'leave' || view === 'delete') && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: 'var(--danger-dim)' }}>
                {view === 'leave' ? <LogOut size={20} className="text-red-500" /> : <Trash2 size={20} className="text-red-500" />}
              </div>
              <div>
                <div className="font-display text-[16px] text-text-primary uppercase tracking-wide">{view === 'leave' ? 'Leave Crew?' : 'Delete Crew?'}</div>
                <div className="font-mono text-[10px] text-text-muted mt-1">
                  {view === 'leave' ? 'You will be removed from the crew.' : 'This action cannot be undone. All crew data will be lost.'}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setView(null)} className="flex-1 py-3 rounded-[12px] border border-border font-mono text-[11px] text-text-muted hover:text-text-primary">Cancel</button>
                {/* Both confirmations used to just close the modal. Leaving and
                    disbanding are the same call for a captain — the only member who
                    reaches this dialog — so both disband. */}
                <button onClick={onDisband} className="flex-1 py-3 rounded-[12px] bg-danger font-mono text-[11px] text-white font-bold hover:opacity-90">
                  {view === 'leave' ? 'Leave' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Crew Page ───────────────────────────────────────────────────────────
export const EventCrewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || 'cu1';

  // The store held a copy of every event seeded from mockData; the event this
  // page is about comes from the API.
  const { event } = useEvent(id);
  const {
    crew: apiCrew, loading, error, refresh,
    createCrew, renameCrew, removeMember, disbandCrew, busy,
  } = useCrew(id);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [newCrewName, setNewCrewName] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const crew = apiCrew?.members ?? [];
  const crewName = apiCrew?.name ?? '';
  const isCaptain = apiCrew?.is_captain ?? false;
  // Readiness comes from each athlete's event entry, so this counts confirmations
  // rather than a status typed into the page.
  const readyCount = apiCrew?.ready_count ?? 0;
  const readyPct = crew.length ? Math.round((readyCount / crew.length) * 100) : 0;

  const handleKick = (memberId: string) => {
    setMemberMenu(null);
    if (!apiCrew) return;
    void removeMember({ crewId: apiCrew.$id, userId: memberId });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pb-20 space-y-5" aria-busy="true" aria-label="Loading your crew">
        <div className="h-10 w-2/3 rounded-[10px] bg-elevated animate-shimmer" />
        <div className="h-32 rounded-[18px] bg-elevated animate-shimmer" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 rounded-[16px] bg-elevated animate-shimmer" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          Crew did not load
        </p>
        <p className="font-mono text-[11px] text-text-secondary">{error.message}</p>
        <button onClick={() => refresh()}
          className="px-4 py-2 rounded-[10px] bg-accent text-black font-mono text-[10px] font-bold uppercase">
          Retry
        </button>
      </div>
    );
  }

  // Having no crew is the normal starting state, and the page had no way to form
  // one — the roster was simply always there.
  if (!apiCrew) {
    return (
      <div className="max-w-md mx-auto py-16 space-y-4 text-center">
        <div>
          <h1 className="font-display text-[22px] text-text-primary tracking-wider uppercase">
            No crew yet
          </h1>
          <p className="font-mono text-[11px] text-text-muted mt-1">
            Form a crew for {event?.title ?? 'this event'} and invite athletes into it.
          </p>
        </div>
        <input
          value={newCrewName}
          onChange={e => setNewCrewName(e.target.value)}
          placeholder="Crew name"
          className="w-full h-10 rounded-[10px] bg-elevated border border-border px-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-accent"
        />
        <button
          onClick={() => { if (newCrewName.trim() && !busy) void createCrew(newCrewName.trim()); }}
          disabled={!newCrewName.trim() || busy}
          className="w-full py-3 rounded-[10px] bg-accent text-black font-condensed font-bold text-[14px] uppercase tracking-wider disabled:opacity-40"
        >
          {busy ? 'Forming…' : 'Form crew'}
        </button>
        <button onClick={() => navigate(`/app/events/${id}`)}
          className="font-mono text-[10px] text-text-muted hover:text-text-primary uppercase tracking-wider">
          Back to the event
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/app/events/${id}`)}
            className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-[22px] text-text-primary tracking-wider uppercase">Crew Management</h1>
            <p className="font-mono text-[10px] text-text-muted">{event?.title}</p>
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-border font-mono text-[10px] text-text-muted hover:text-text-primary hover:border-accent transition-all">
          <Settings size={12} /> Settings
        </button>
      </motion.div>

      {/* Crew Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="premium-card bg-accent-surface border border-accent-border/50 rounded-[22px] p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-display text-[20px] text-text-primary tracking-wide uppercase">{crewName}</div>
            <div className="font-mono text-[10px] text-text-secondary mt-0.5">{crew.length} Members · {event?.sport}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-[24px] text-accent">{readyPct}%</div>
            <div className="font-mono text-[8px] text-text-muted">CREW CHEMISTRY</div>
          </div>
        </div>

        {/* Readiness bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="font-mono text-[9px] text-text-muted">Event Readiness</span>
            <span className="font-mono text-[9px] text-accent">{readyCount}/{crew.length} Ready</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${readyPct}%` }}
              transition={{ duration: 0.8 }} className="h-full rounded-full bg-accent" />
          </div>
        </div>

        {/* Stats mini grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Avg Level', value: crew.length ? Math.round(crew.reduce((s, m) => s + m.level, 0) / crew.length) : 0 },
            { label: 'Ready',     value: `${readyCount}/${crew.length}` },
            { label: 'Avg Pulse', value: crew.length ? Math.round(crew.reduce((s, m) => s + m.pulse_score, 0) / crew.length) : 0 },
          ].map((s, i) => (
            <div key={i} className="rounded-[12px] p-2.5 bg-elevated border border-border text-center">
              <div className="font-display text-[16px] text-accent">{s.value}</div>
              <div className="font-mono text-[8px] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Invite button. It used to flip a flag and claim "Invite Link Copied!"
          without copying anything. */}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => {
          const link = `${window.location.origin}/app/events/${id}`;
          navigator.clipboard?.writeText(link)
            .then(() => setInviteCopied(true))
            .catch(() => setInviteCopied(false));
        }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] border font-mono text-[12px] font-bold transition-all"
        style={{
          background: inviteCopied ? 'var(--accent-surface)' : 'var(--bg-elevated)',
          borderColor: inviteCopied ? 'var(--accent-border)' : 'var(--border)',
          color: inviteCopied ? 'var(--accent-text)' : 'var(--text-muted)'
        }}>
        {inviteCopied ? <><Check size={14} /> Event link copied</> : <><UserPlus size={14} /> Invite friends</>}
      </motion.button>

      {/* Members list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Crew Members ({crew.length})</span>
        </div>

        {crew.map((member, i) => (
          <motion.div key={member.$id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-[16px] p-4 border border-border ${member.user_id === currentUserId ? 'bg-accent-surface' : 'bg-elevated'}`}>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img src={member.avatar_url ?? undefined} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]"
                style={{ background: READINESS_COLOR[member.readiness] }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-text-primary truncate font-bold">
                  {member.full_name || 'Athlete'}
                  {member.user_id === currentUserId && ' (You)'}
                </span>
                {member.role === 'captain' && (
                  <span className="px-1.5 py-0.5 rounded bg-accent-surface border border-accent-border font-mono text-[7px] text-accent font-bold">CAPTAIN</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[9px]" style={{ color: READINESS_COLOR[member.readiness] }}>
                  {READINESS_LABEL[member.readiness]}
                </span>
                <span className="font-mono text-[9px] text-text-muted">· Lvl {member.level} · {Math.round(member.pulse_score)}P</span>
              </div>
            </div>

            {/* Captain actions (not for self) */}
            {member.user_id !== currentUserId && isCaptain && (
              <div className="relative flex-shrink-0">
                <button onClick={() => setMemberMenu(memberMenu === member.$id ? null : member.$id)}
                  className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-all">
                  <MoreVertical size={13} />
                </button>
                <AnimatePresence>
                  {memberMenu === member.$id && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-9 z-20 rounded-[12px] overflow-hidden shadow-xl w-40 premium-card bg-surface border border-border">
                      {/* "Make Admin" and "Send Message" only closed the menu:
                          crew_members has no admin role beyond captain, and there
                          is no per-crew DM. Removing is the action that exists. */}
                      {[
                        { label: 'Remove Player', icon: <UserMinus size={11} />, color: 'var(--danger)', action: () => handleKick(member.user_id) },
                      ].map((opt, i) => (
                        <button key={i} onClick={opt.action}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-hover transition-all text-left"
                          style={{ color: opt.color }}>
                          {opt.icon}
                          <span className="font-mono text-[10px]">{opt.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Admin capabilities panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-[18px] p-5 border border-border bg-elevated">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={13} className="text-accent" />
          <span className="font-display text-[13px] text-text-primary tracking-wider uppercase">ADMIN CAPABILITIES</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Manage members', 'Approve invitations',
            'Control event participation', 'Send announcements',
          ].map((cap, i) => (
            <div key={i} className="flex items-center gap-2 font-mono text-[10px] text-text-secondary">
              <Check size={10} className="text-accent flex-shrink-0" />
              {cap}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Join event with crew CTA */}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/app/events/${id}`)}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="w-full py-4 rounded-[16px] font-display text-[15px] tracking-wide text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--volt-text)' }}>
        <Zap size={16} /> Join Event with Crew
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <CrewSettingsModal
            onClose={() => setSettingsOpen(false)}
            crewName={crewName}
            members={crew}
            currentUserId={currentUserId}
            onRename={name => {
              void renameCrew({ crewId: apiCrew.$id, name });
              setSettingsOpen(false);
            }}
            onDisband={() => {
              void disbandCrew(apiCrew.$id).then(() => navigate(`/app/events/${id}`));
              setSettingsOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
