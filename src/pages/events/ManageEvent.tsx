import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users,
  Trash2, Check, X, Plus, Edit, Eye, MessageSquare,
  Lock, Settings, BarChart3, Shield, Info, Activity, AlertTriangle, Send, ShieldCheck
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { MOCK_USERS } from '../../services/mockData';
import type { SportCategory, EventFormat, ExperienceLevel } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'details', label: 'Edit Info', icon: Edit },
  { id: 'participants', label: 'Roster & Invites', icon: Users },
  { id: 'settings', label: 'Rules & Privacy', icon: Settings },
];

const MOCK_ANALYTICS_DATA = [
  { name: 'Day 1', signups: 3 },
  { name: 'Day 3', signups: 8 },
  { name: 'Day 5', signups: 12 },
  { name: 'Day 7', signups: 19 },
  { name: 'Day 9', signups: 26 },
  { name: 'Day 11', signups: 31 },
];

export const ManageEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, updateEvent } = useEventStore();
  const event = events.find(e => e.id === id);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // local pending participants state
  const [pendingRequests, setPendingRequests] = useState([
    { id: 'u_req_1', name: 'Sophia Martinez', avatar: 'https://i.pravatar.cc/150?img=25', level: 27, position: 'LW', distance: 4.2 },
    { id: 'u_req_2', name: 'Liam Davies', avatar: 'https://i.pravatar.cc/150?img=12', level: 32, position: 'CB', distance: 8.5 },
  ]);

  // Form states initialized from event
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [venue, setVenue] = useState(event?.venue || '');
  const [location, setLocation] = useState(event?.location || '');
  const [date, setDate] = useState(event?.date || '');
  const [format, setFormat] = useState(event?.format || 'tournament');
  const [sport] = useState(event?.sport || 'football');
  const [skillLevel] = useState(event?.skillLevel || 'semi-pro');
  const [maxParticipants, setMaxParticipants] = useState(event?.maxParticipants?.toString() || '32');
  const [prizePool, setPrizePool] = useState(event?.prizePool || '');
  const [entryFee, setEntryFee] = useState(event?.entryFee || '');
  const [rules, setRules] = useState<string[]>(event?.rules || ['']);

  // Admin and settings states
  const [isPublic, setIsPublic] = useState(true);
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [discussionModeration, setDiscussionModeration] = useState(true);
  const [teamLimit, setTeamLimit] = useState('16');
  const [registrationDeadline, setRegistrationDeadline] = useState('2025-06-10');
  const [selectedAdminId, setSelectedAdminId] = useState('u1');

  if (!event) {
    return (
      <div className="text-center py-16 font-mono text-[12px] text-text-muted">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-500 animate-pulse" />
        Event not found.
        <Button className="mt-4" onClick={() => navigate('/app/events')}>Go to Events</Button>
      </div>
    );
  }

  const handleUpdateDetails = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      updateEvent(event.id, {
        title,
        description,
        venue,
        location,
        date,
        format: format as EventFormat,
        sport: sport as SportCategory,
        skillLevel: skillLevel as ExperienceLevel,
        maxParticipants: parseInt(maxParticipants, 10),
        prizePool,
        entryFee,
        rules: rules.filter(Boolean),
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setAnnouncementSent(true);
    setAnnouncementText('');
    setTimeout(() => setAnnouncementSent(false), 3000);
  };

  const handleApprove = (userId: string) => {
    updateEvent(event.id, {
      participants: [...event.participants, userId],
    });
    setPendingRequests(prev => prev.filter(p => p.id !== userId));
  };

  const handleReject = (userId: string) => {
    setPendingRequests(prev => prev.filter(p => p.id !== userId));
  };

  const handleRemoveParticipant = (userId: string) => {
    updateEvent(event.id, {
      participants: event.participants.filter(p => p !== userId),
    });
  };

  const handleRuleChange = (idx: number, val: string) => {
    setRules(rules.map((r, ri) => ri === idx ? val : r));
  };

  const handleAddRule = () => setRules([...rules, '']);
  const handleRemoveRule = (idx: number) => setRules(rules.filter((_, ri) => ri !== idx));

  // Resolved participants from store
  const resolvedParticipants = MOCK_USERS.filter(u => event.participants.includes(u.id));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-28 md:pb-12 pt-4 sm:pt-6 text-text-primary">
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/app/events/${event.id}`)}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}
        >
          <ArrowLeft size={18} className="text-text-secondary" />
        </motion.button>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))', border: '1px solid var(--border-muted)' }}>
          <div className="absolute top-0 right-0 w-16 h-16 opacity-20" style={{ background: 'radial-gradient(circle at top right, #CCFF00, transparent)' }} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#CCFF0018', border: '1px solid #CCFF0030' }}>
            <Settings size={18} className="text-volt" />
          </div>
          <div>
            <h1 className="font-display text-[20px] sm:text-[26px] text-text-primary leading-none tracking-widest uppercase">MANAGE CLASH</h1>
            <p className="font-mono text-[9px] sm:text-[10px] text-text-secondary mt-0.5 tracking-wider truncate max-w-[200px] sm:max-w-none">
              {event.title.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4 md:gap-6">
        
        {/* ── TABS ── */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left relative"
                style={{
                  background: isActive ? 'rgba(204,255,0,0.12)' : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-muted)'}`,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 0 16px rgba(204,255,0,0.15)' : 'none'
                }}
              >
                {isActive && <motion.div layoutId="tab-accent" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: 'var(--accent)' }} />}
                <Icon size={15} />
                <span className="font-condensed text-[14px] font-bold">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        <div className="min-h-[450px]">
          <AnimatePresence mode="wait">

            {/* ── Tab: Dashboard ── */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'ATTENDEES', value: `${event.participants.length}/${event.maxParticipants}`, icon: <Users size={16} />, color: 'var(--accent)' },
                    { label: 'TEAM READINESS', value: '88%', icon: <Activity size={16} />, color: '#06b6d4' },
                    { label: 'STATUS', value: event.status.toUpperCase(), icon: <Shield size={16} />, color: '#f97316' }
                  ].map(s => (
                    <div key={s.label} className="glass rounded-[20px] p-4 border border-border-muted flex flex-col justify-between">
                      <div className="flex items-center justify-between text-text-muted">
                        <span className="font-mono text-[9px] uppercase tracking-widest">{s.label}</span>
                        <span style={{ color: s.color }}>{s.icon}</span>
                      </div>
                      <div className="font-display text-xl sm:text-2xl mt-2" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart and Squad readiness */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* Registration velocity */}
                  <div className="glass rounded-[22px] p-5 border border-border-muted">
                    <h3 className="font-display text-base tracking-wider uppercase mb-4 flex items-center gap-2">
                      <Activity size={14} className="text-volt" /> Registration Velocity
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={MOCK_ANALYTICS_DATA}>
                        <defs>
                          <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-primary)' }} cursor={false} />
                        <Area type="monotone" dataKey="signups" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Team Readiness and Squad Participation */}
                  <div className="glass rounded-[22px] p-5 border border-border-muted flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-base tracking-wider uppercase mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-volt" /> Team Status Overview
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-text-secondary">Iron Pulse FC (Captain: Priya)</span>
                          <span className="text-volt font-bold">READY (6/6)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-text-secondary">Volt Hawks (Captain: DeShawn)</span>
                          <span className="text-volt font-bold">READY (5/5)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-text-secondary">Cyber Spartans</span>
                          <span className="text-orange-500 font-bold">DRAFTING (4/5)</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-elevated/40 border border-border-muted font-mono text-[9px] text-text-muted">
                      💡 Ensure all captain approvals are completed before the match registration deadline.
                    </div>
                  </div>
                </div>

                {/* Announcement box */}
                <div className="glass rounded-[22px] p-5 border border-border-muted">
                  <h3 className="font-display text-base tracking-wider uppercase mb-3 flex items-center gap-2">
                    <Send size={14} className="text-volt" /> Send Broadcast Announcement
                  </h3>
                  <p className="font-mono text-[10px] text-text-muted mb-3">Broadcast announcements will push live notifications to all registered athletes.</p>
                  <form onSubmit={handleSendAnnouncement} className="flex gap-2">
                    <input
                      type="text"
                      value={announcementText}
                      onChange={e => setAnnouncementText(e.target.value)}
                      placeholder="Tournament announcement details..."
                      className="flex-1 rounded-xl px-4 py-2.5 font-mono text-xs bg-base border border-border-muted text-text-primary outline-none focus:border-volt/50"
                    />
                    <Button variant="primary" size="md" type="submit">Send</Button>
                  </form>
                  <AnimatePresence>
                    {announcementSent && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs font-mono text-volt flex items-center gap-1">
                        ✓ Broadcast alert pushed to all players.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}

            {/* ── Tab: Details Form ── */}
            {activeTab === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <div className="glass rounded-[22px] p-6 border border-border-muted space-y-4">
                  <h3 className="font-display text-lg tracking-wider uppercase border-b border-border-muted pb-2 text-volt">Edit Event Details</h3>
                  
                  <Input label="Event Name" value={title} onChange={e => setTitle(e.target.value)} placeholder="Pro Football 5v5 Championship" required />
                  
                  <Textarea label="Event Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the tournament rules, check-in time..." rows={4} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <Select label="Format" value={format} onChange={e => setFormat(e.target.value as EventFormat)}
                      options={[{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }, { value: 'solo', label: 'Solo' }, { value: 'team', label: 'Team' }]} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Venue" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Berlin Indoor Arena" />
                    <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Berlin, Germany" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input label="Max Players" type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
                    <Input label="Prize Pool" value={prizePool} onChange={e => setPrizePool(e.target.value)} placeholder="€25,000" />
                    <Input label="Entry Fee" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="€150" />
                  </div>

                  {/* Save feedback block */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border-muted">
                    {saveSuccess && (
                      <span className="text-xs font-mono text-volt flex items-center gap-1">
                        ✓ Event configuration updated successfully
                      </span>
                    )}
                    <Button variant="primary" className="sm:ml-auto" disabled={isSaving || !title} onClick={handleUpdateDetails}>
                      {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Tab: Participants Management ── */}
            {activeTab === 'participants' && (
              <motion.div key="participants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                
                {/* Pending Approvals */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-3">
                  <h3 className="font-display text-base tracking-wider uppercase text-orange-500 flex items-center gap-1.5">
                    <Info size={14} /> Pending Join Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.length === 0 ? (
                      <p className="font-mono text-[10px] text-text-muted">No pending request queues.</p>
                    ) : (
                      pendingRequests.map(req => (
                        <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-3 sm:gap-2 rounded-xl bg-elevated border border-border-muted font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <img src={req.avatar} alt={req.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <span className="font-bold block text-text-primary">{req.name}</span>
                              <span className="text-[9px] text-text-secondary mt-0.5 block">{req.position} · Level {req.level} · {req.distance} KM</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 justify-end self-end sm:self-auto">
                            <button onClick={() => handleApprove(req.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-volt/20 text-volt hover:bg-volt/30 border border-volt/25">
                              <Check size={14} />
                            </button>
                            <button onClick={() => handleReject(req.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/25">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Registered Athletes list */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-3">
                  <h3 className="font-display text-base tracking-wider uppercase text-text-primary">
                    Registered Athletes ({resolvedParticipants.length})
                  </h3>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {resolvedParticipants.length === 0 ? (
                      <p className="font-mono text-[10px] text-text-muted">No athletes registered yet.</p>
                    ) : (
                      resolvedParticipants.map(participant => (
                        <div key={participant.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-3 sm:gap-2 rounded-xl bg-elevated border border-border-muted font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar src={participant.avatar} name={participant.name} size="sm" />
                            <div>
                              <span className="font-bold block text-text-primary">{participant.name}</span>
                              <span className="text-[9px] text-text-secondary uppercase mt-0.5 block">{participant.sport} · {participant.experienceLevel}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
                            {participant.id === selectedAdminId ? (
                              <span className="text-[9px] font-bold text-volt px-2 py-0.5 bg-volt/15 border border-volt/20 rounded-md">
                                ADMIN
                              </span>
                            ) : (
                              <button onClick={() => setSelectedAdminId(participant.id)} className="text-[9px] font-bold text-text-muted hover:text-volt font-mono transition-colors">
                                MAKE ADMIN
                              </button>
                            )}
                            <button onClick={() => handleRemoveParticipant(participant.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── Tab: Advanced Rules & Settings ── */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                
                {/* Rules Editor */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-3">
                  <h3 className="font-display text-base tracking-wider uppercase text-volt">Edit Announcements & Rules</h3>
                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-mono text-xs text-volt font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={rule}
                          onChange={e => handleRuleChange(idx, e.target.value)}
                          className="flex-1 rounded-xl px-4 py-2 font-mono text-xs bg-base border border-border-muted text-text-primary outline-none focus:border-volt/50"
                        />
                        <button onClick={() => handleRemoveRule(idx)} className="text-text-muted hover:text-red-500 p-1.5">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={handleAddRule} className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-dashed border-border text-text-secondary hover:border-volt/40 hover:text-text-primary transition-all">
                      <Plus size={11} /> Add Rule / Requirement
                    </button>
                  </div>
                </div>

                {/* Event Settings Toggles */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <h3 className="font-display text-base tracking-wider uppercase text-text-primary">Event Access Controls</h3>
                  
                  {/* Visibility */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold flex items-center gap-1.5 text-text-primary">
                        {isPublic ? <Eye size={13} className="text-volt" /> : <Lock size={13} className="text-orange-500" />}
                        Public Visibility
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">Toggle whether the event shows in main browse and feeds</p>
                    </div>
                    <button onClick={() => setIsPublic(!isPublic)} className={`px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border ${isPublic ? 'bg-volt/15 border-volt text-volt' : 'bg-surface border-border-muted text-text-secondary'}`}>
                      {isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </button>
                  </div>

                  {/* Invite Only */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold flex items-center gap-1.5 text-text-primary">
                        <Shield size={13} className="text-volt" /> Invite-only Registration
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">Require an invite code to join this event</p>
                    </div>
                    <button onClick={() => setIsInviteOnly(!isInviteOnly)} className={`px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border ${isInviteOnly ? 'bg-volt/15 border-volt text-volt' : 'bg-surface border-border-muted text-text-secondary'}`}>
                      {isInviteOnly ? 'INVITE ONLY' : 'OPEN ACCESS'}
                    </button>
                  </div>

                  {/* Discussion Control */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold flex items-center gap-1.5 text-text-primary">
                        <MessageSquare size={13} className="text-volt" /> Discussion Moderation
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">Enable filter-guards and automatic spam moderation in chat</p>
                    </div>
                    <button onClick={() => setDiscussionModeration(!discussionModeration)} className={`px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border ${discussionModeration ? 'bg-volt/15 border-volt text-volt' : 'bg-surface border-border-muted text-text-secondary'}`}>
                      {discussionModeration ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  {/* Details parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Team Count Limit</label>
                      <input type="number" value={teamLimit} onChange={e => setTeamLimit(e.target.value)} className="w-full rounded-xl px-4 py-2.5 font-mono text-xs bg-base border border-border-muted text-text-primary focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Registration Deadline</label>
                      <input type="date" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} className="w-full rounded-xl px-4 py-2.5 font-mono text-xs bg-base border border-border-muted text-text-primary focus:outline-none" />
                    </div>
                  </div>

                  {/* Save button settings */}
                  <div className="flex justify-end pt-2">
                    <Button variant="primary" onClick={handleUpdateDetails}>
                      Confirm Policies
                    </Button>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
