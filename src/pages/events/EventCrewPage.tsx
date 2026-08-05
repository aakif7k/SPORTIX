import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Settings, UserPlus, Crown, Shield,
  Zap, Check, X, MoreVertical, Megaphone,
  UserMinus, Edit2, LogOut, Trash2, Lock
} from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '../../store/authStore';

// ─── Mock Crew Data ───────────────────────────────────────────────────────────
const MOCK_CREW = [
  { id: 'cu1', name: 'Alex Rivera (You)', avatar: 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg', role: 'admin',   sport: 'Football', status: 'Ready',   pulseScore: 721, level: 24  },
  { id: 'u1', name: 'Marcus Reid',       avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', role: 'member',  sport: 'Football', status: 'Ready',   pulseScore: 847, level: 84  },
  { id: 'u2', name: 'Zaid Al-Hassan',    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'member',  sport: 'Football', status: 'Maybe',   pulseScore: 793, level: 79  },
  { id: 'u5', name: 'Aisha Mensah',      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', role: 'member',  sport: 'Football', status: 'Ready',   pulseScore: 812, level: 81  },
  { id: 'u3', name: 'Priya Nair',        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'member',  sport: 'Football', status: 'Offline', pulseScore: 721, level: 72  },
];

const STATUS_COLOR: Record<string, string> = {
  Ready: 'var(--accent)', Maybe: 'var(--warning)', Offline: 'var(--text-muted)'
};

type SettingsAction =
  | 'changeAdmin' | 'rename' | 'permissions' | 'invite' | 'leave' | 'delete';

// ─── Settings Modal ───────────────────────────────────────────────────────────
const CrewSettingsModal: React.FC<{ onClose: () => void; crewName: string; onRename: (n: string) => void }> = ({ onClose, crewName, onRename }) => {
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
              {MOCK_CREW.filter(m => m.id !== (useAuthStore.getState().user?.id || 'cu1')).map(m => (
                <button key={m.id} className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-border bg-elevated hover:border-accent/30 transition-all">
                  <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-mono text-[11px] text-text-primary">{m.name}</div>
                    <div className="font-mono text-[9px] text-text-muted">Lvl {m.level}</div>
                  </div>
                  <Crown size={13} className="text-text-muted" />
                </button>
              ))}
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
                <button onClick={onClose} className="flex-1 py-3 rounded-[12px] bg-danger font-mono text-[11px] text-white font-bold hover:opacity-90">
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
  const [crew, setCrew] = useState(MOCK_CREW);
  const [crewName, setCrewName] = useState('Iron Pulse FC');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const readyCount = crew.filter(m => m.status === 'Ready').length;
  const chemScore = Math.round((readyCount / crew.length) * 100);

  const handleKick = (memberId: string) => {
    setCrew(prev => prev.filter(m => m.id !== memberId));
    setMemberMenu(null);
  };

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
            <div className="font-display text-[24px] text-accent">{chemScore}%</div>
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
            <motion.div initial={{ width: 0 }} animate={{ width: `${(readyCount / crew.length) * 100}%` }}
              transition={{ duration: 0.8 }} className="h-full rounded-full bg-accent" />
          </div>
        </div>

        {/* Stats mini grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Avg Level', value: Math.round(crew.reduce((s, m) => s + m.level, 0) / crew.length) },
            { label: 'Ready',     value: `${readyCount}/${crew.length}` },
            { label: 'Avg Pulse', value: Math.round(crew.reduce((s, m) => s + m.pulseScore, 0) / crew.length) },
          ].map((s, i) => (
            <div key={i} className="rounded-[12px] p-2.5 bg-elevated border border-border text-center">
              <div className="font-display text-[16px] text-accent">{s.value}</div>
              <div className="font-mono text-[8px] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Invite button */}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => setInviteSent(true)}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] border font-mono text-[12px] font-bold transition-all"
        style={{
          background: inviteSent ? 'var(--accent-surface)' : 'var(--bg-elevated)',
          borderColor: inviteSent ? 'var(--accent-border)' : 'var(--border)',
          color: inviteSent ? 'var(--accent-text)' : 'var(--text-muted)'
        }}>
        {inviteSent ? <><Check size={14} /> Invite Link Copied!</> : <><UserPlus size={14} /> Invite Friends</>}
      </motion.button>

      {/* Members list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Crew Members ({crew.length})</span>
        </div>

        {crew.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-[16px] p-4 border border-border ${member.id === currentUserId ? 'bg-accent-surface' : 'bg-elevated'}`}>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]"
                style={{ background: STATUS_COLOR[member.status] }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-text-primary truncate font-bold">{member.name}</span>
                {member.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded bg-accent-surface border border-accent-border font-mono text-[7px] text-accent font-bold">ADMIN</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[9px]" style={{ color: STATUS_COLOR[member.status] }}>{member.status}</span>
                <span className="font-mono text-[9px] text-text-muted">· Lvl {member.level} · {member.pulseScore}P</span>
              </div>
            </div>

            {/* Admin actions (not for self) */}
            {member.id !== currentUserId && (
              <div className="relative flex-shrink-0">
                <button onClick={() => setMemberMenu(memberMenu === member.id ? null : member.id)}
                  className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-all">
                  <MoreVertical size={13} />
                </button>
                <AnimatePresence>
                  {memberMenu === member.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-9 z-20 rounded-[12px] overflow-hidden shadow-xl w-40 premium-card bg-surface border border-border">
                      {[
                        { label: 'Make Admin', icon: <Crown size={11} />, color: 'var(--warning)', action: () => setMemberMenu(null) },
                        { label: 'Send Message', icon: <Megaphone size={11} />, color: 'var(--accent)', action: () => setMemberMenu(null) },
                        { label: 'Remove Player', icon: <UserMinus size={11} />, color: 'var(--danger)', action: () => handleKick(member.id) },
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
            onRename={name => { setCrewName(name); setSettingsOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
