import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Zap, BarChart2, Shield, Globe,
  AtSign, Hash, Play, Briefcase,
  Camera, Save, Check, Bell, Star, Award, ChevronDown, Loader2,
} from 'lucide-react';
import type { User as UserType, SportCategory, ExperienceLevel, PerformanceData } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { uploadProfilePicture } from '../../services/storageService';
import { updateProfile as updateProfileService } from '../../services/profileService';
import toast from 'react-hot-toast';
import { SPORT_CATEGORIES, SPORT_POSITIONS } from '../../services/mockData';
import { Toggle } from '../ui/index';

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface SectionProps {
  id: string;
  label: string;
  icon: any;
  accentColor?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, hint, children, required }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-xs font-label font-semibold text-text-secondary uppercase tracking-widest">
      {label}
      {required && <span className="text-volt text-[10px]">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] font-label text-text-muted">{hint}</p>}
  </div>
);

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  prefix?: string;
}> = ({ value, onChange, placeholder, type = 'text', maxLength, prefix }) => (
  <div className={`flex items-center gap-2 bg-elevated border border-border-muted rounded-xl px-3 py-2.5 focus-within:border-volt/50 transition-all ${prefix ? 'pl-3' : ''}`}>
    {prefix && <span className="font-mono text-xs text-text-muted flex-shrink-0">{prefix}</span>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="flex-1 bg-transparent font-mono text-sm text-white placeholder-text-muted outline-none min-w-0"
    />
    {maxLength && (
      <span className="font-mono text-[10px] text-text-muted flex-shrink-0">
        {value.length}/{maxLength}
      </span>
    )}
  </div>
);

const SelectInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full appearance-none bg-elevated border border-border-muted rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-volt/50 transition-all pr-8 capitalize"
    >
      {options.map(o => <option key={o.value} value={o.value} className="bg-surface capitalize">{o.label}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
  </div>
);

const SliderInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  label: string;
  color?: string;
}> = ({ value, onChange, label, color = '#CCFF00' }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-mono text-text-secondary">
      <span>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
    <div className="relative h-2">
      <div className="absolute inset-0 bg-elevated rounded-full" />
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}40` }}
      />
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  </div>
);

// ─── ACCORDION SECTION ─────────────────────────────────────────────────────
const Section: React.FC<SectionProps> = ({ label, icon: Icon, accentColor = '#CCFF00', open, onToggle, children }) => (
  <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${open ? 'border-volt/20 bg-elevated/50' : 'border-border-muted bg-elevated/20 hover:border-volt/10'}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <Icon size={16} style={{ color: accentColor }} />
      </div>
      <span className="font-display text-sm tracking-wide text-white flex-1">{label}</span>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown size={16} className="text-text-muted" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div className="px-4 pb-5 space-y-4 border-t border-border-muted/50 pt-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
interface Props {
  athlete: UserType;
  onClose: () => void;
}

type DraftState = UserType & {
  socials: {
    instagram: string;
    twitter: string;
    youtube: string;
    linkedin: string;
    website: string;
  };
  position: string;
  height: string;
  weight: string;
  nationality: string;
  phone: string;
  dateOfBirth: string;
  club: string;
  agent: string;
  jersey: string;
  preferredFoot: string;
  trainingSchedule: string;
  injuryHistory: string;
  privateProfile: boolean;
  showStats: boolean;
  showLocation: boolean;
  emailNotif: boolean;
  pushNotif: boolean;
  matchAlerts: boolean;
  recruitAlerts: boolean;
  theme: 'dark' | 'volt' | 'red';
};

const DEFAULT_SOCIALS = { instagram: '', twitter: '', youtube: '', linkedin: '', website: '' };

export const ProfileEditDrawer: React.FC<Props> = ({ athlete, onClose }) => {
  const [openSection, setOpenSection] = useState<string>('identity');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<DraftState>({
    ...athlete,
    socials: athlete?.socials || DEFAULT_SOCIALS,
    position: athlete?.position || (athlete?.sport ? SPORT_POSITIONS[athlete.sport]?.[0] : 'Member') || 'Member',
    height: athlete?.height || '',
    weight: athlete?.weight || '',
    nationality: athlete?.nationality || '',
    phone: athlete?.phone || '',
    dateOfBirth: athlete?.dateOfBirth || '',
    club: athlete?.club || '',
    agent: athlete?.agent || '',
    jersey: athlete?.jersey || '',
    preferredFoot: athlete?.preferredFoot || '',
    trainingSchedule: athlete?.trainingSchedule || '',
    injuryHistory: athlete?.injuryHistory || '',
    privateProfile: athlete?.privateProfile || false,
    showStats: athlete?.showStats !== false,
    showLocation: athlete?.showLocation !== false,
    emailNotif: athlete?.emailNotif !== false,
    pushNotif: athlete?.pushNotif !== false,
    matchAlerts: athlete?.matchAlerts !== false,
    recruitAlerts: athlete?.recruitAlerts || athlete?.openToRecruit || false,
    theme: athlete?.themePref || 'dark',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const userId = athlete.id || (athlete as any).uid;
    if (!userId) return;

    setUploadingAvatar(true);
    const result = await uploadProfilePicture(userId, file);
    setUploadingAvatar(false);

    if (result?.fileUrl) {
      setDraft(d => ({ ...d, avatar: result.fileUrl }));
    }
  };

  const set = useCallback(<K extends keyof DraftState>(key: K, val: DraftState[K]) => {
    setDraft(d => ({ ...d, [key]: val }));
  }, []);

  const setPerf = useCallback((key: keyof PerformanceData, val: number) => {
    setDraft(d => ({ ...d, performanceData: { ...d.performanceData, [key]: val } }));
  }, []);

  const setSocial = useCallback((key: keyof typeof DEFAULT_SOCIALS, val: string) => {
    setDraft(d => ({ ...d, socials: { ...d.socials, [key]: val } }));
  }, []);

  const toggle = (section: string) =>
    setOpenSection(s => (s === section ? '' : section));

  const { updateProfile: updateProfileStore } = useAuthStore();

  const handleSave = async () => {
    setSaving(true);
    const userId = athlete.id || (athlete as any).uid;
    try {
      if (userId) {
        await updateProfileService(userId, {
          full_name: draft.name,
          username: draft.username,
          bio: draft.bio,
          location: draft.location,
          sport: draft.sport,
          sports: draft.sports,
          experience_level: draft.experienceLevel,
          is_open_to_recruit: draft.openToRecruit,
          position: draft.position,
          avatar_url: draft.avatar,
        } as any);
      }

      updateProfileStore({
        name: draft.name,
        username: draft.username,
        bio: draft.bio,
        location: draft.location,
        sport: draft.sport,
        sports: draft.sports,
        experienceLevel: draft.experienceLevel,
        openToRecruit: draft.openToRecruit,
        avatar: draft.avatar,
        position: draft.position,
      });

      toast.success('Profile Updated! ⚡ Your changes have been saved.');
      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch (err: any) {
      console.error('[ProfileEditDrawer] save error:', err);
      toast.error(err?.message || "Couldn't update profile. Please try again.");
      setSaving(false);
    }
  };

  const positions = SPORT_POSITIONS[draft.sport] || SPORT_POSITIONS.default;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-base/80 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border-muted z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-muted flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-volt/10 border border-volt/20 flex items-center justify-center">
            <Zap size={16} className="text-volt" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-white tracking-wide">EDIT PLAYER DNA</h2>
            <p className="text-[11px] font-mono text-text-muted">All changes · A to Z</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-text-secondary hover:text-volt hover:bg-volt/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar Quick Edit */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border-muted bg-elevated/30 flex-shrink-0">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
          <div className="relative group flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-volt/30">
              <img src={draft.avatar} alt={draft.name} className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-base/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
            >
              {uploadingAvatar ? <Loader2 size={18} className="text-volt animate-spin" /> : <Camera size={18} className="text-volt" />}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-sm font-semibold text-white truncate">{draft.name}</p>
            <p className="font-mono text-xs text-text-secondary">@{draft.username}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-[10px] font-label px-2.5 py-1 rounded-lg border border-volt/30 text-volt hover:bg-volt/10 transition-all flex items-center gap-1"
              >
                {uploadingAvatar ? <Loader2 size={10} className="animate-spin" /> : null}
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-volt">{draft.stats.rating}</div>
            <div className="text-[9px] font-label text-text-muted uppercase tracking-widest">Rating</div>
          </div>
        </div>

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A2A #111' }}>

          {/* ── 1. IDENTITY ──────────────────────────────────────────── */}
          <Section id="identity" label="Identity & Basic Info" icon={User} accentColor="#CCFF00"
            open={openSection === 'identity'} onToggle={() => toggle('identity')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <TextInput value={draft.name} onChange={v => set('name', v)} placeholder="Your full name" maxLength={60} />
              </Field>
              <Field label="Username" required>
                <TextInput value={draft.username} onChange={v => set('username', v.toLowerCase().replace(/\s/g, '_'))} placeholder="handle" prefix="@" maxLength={30} />
              </Field>
            </div>
            <Field label="Bio / Headline" hint="Describe yourself as an athlete. Max 250 characters.">
              <textarea
                value={draft.bio}
                onChange={e => set('bio', e.target.value)}
                maxLength={250}
                rows={3}
                placeholder="400m specialist | National champion | Fueled by data."
                className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2.5 font-mono text-sm text-white placeholder-text-muted outline-none focus:border-volt/50 transition-all resize-none"
              />
              <div className="text-right text-[10px] font-mono text-text-muted">{draft.bio.length}/250</div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email">
                <TextInput value={draft.email} onChange={v => set('email', v)} type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Phone" hint="Private — recruiters only">
                <TextInput value={draft.phone} onChange={v => set('phone', v)} placeholder="+1 (555) 000-0000" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Location / City">
                <TextInput value={draft.location} onChange={v => set('location', v)} placeholder="Madrid, Spain" />
              </Field>
              <Field label="Nationality">
                <TextInput value={draft.nationality} onChange={v => set('nationality', v)} placeholder="Spanish" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <TextInput value={draft.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
              </Field>
              <Field label="Role">
                <SelectInput value={draft.role} onChange={v => set('role', v as any)}
                  options={[
                    { value: 'athlete', label: 'Athlete' },
                    { value: 'coach', label: 'Coach' },
                    { value: 'recruiter', label: 'Recruiter' },
                    { value: 'organizer', label: 'Organizer' },
                  ]}
                />
              </Field>
            </div>
          </Section>

          {/* ── 2. SPORTS ──────────────────────────────────────────────── */}
          <Section id="sports" label="Sports & Competition" icon={Zap} accentColor="#CCFF00"
            open={openSection === 'sports'} onToggle={() => toggle('sports')}>
            <Field label="Primary Sport">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SPORT_CATEGORIES.map(s => (
                  <motion.button
                    key={s.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { set('sport', s.id as SportCategory); set('sports', [s.id as SportCategory]); }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${draft.sport === s.id ? 'border-volt bg-volt/10 shadow-glow-volt-sm' : 'border-border-muted bg-elevated hover:border-volt/30'}`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-[9px] font-label text-text-secondary leading-tight">{s.label.slice(0, 7)}</span>
                  </motion.button>
                ))}
              </div>
            </Field>
            <Field label="Secondary Sports" hint="Up to 3 additional sports">
              <div className="flex flex-wrap gap-2">
                {SPORT_CATEGORIES.map(s => {
                  const active = draft.sports.includes(s.id as SportCategory);
                  return (
                    <button key={s.id} onClick={() => {
                      const cur = draft.sports;
                      set('sports', active ? cur.filter(x => x !== s.id) : cur.length < 4 ? [...cur, s.id as SportCategory] : cur);
                    }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-label border transition-all ${active ? 'border-volt/60 bg-volt/10 text-volt' : 'border-border-muted bg-elevated text-text-secondary hover:border-volt/30 hover:text-white'}`}>
                      <span>{s.emoji}</span>{s.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Position">
                <SelectInput value={draft.position} onChange={v => set('position', v)}
                  options={positions.map(p => ({ value: p, label: p }))}
                />
              </Field>
              <Field label="Experience Level">
                <SelectInput value={draft.experienceLevel} onChange={v => set('experienceLevel', v as ExperienceLevel)}
                  options={[
                    { value: 'amateur', label: 'Amateur' },
                    { value: 'semi-pro', label: 'Semi-Pro' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'elite', label: 'Elite' },
                  ]}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Jersey Number">
                <TextInput value={draft.jersey} onChange={v => set('jersey', v)} placeholder="10" maxLength={3} />
              </Field>
              <Field label="Preferred Foot / Hand" hint="Sport-specific">
                <SelectInput value={draft.preferredFoot} onChange={v => set('preferredFoot', v)}
                  options={[
                    { value: '', label: 'Not specified' },
                    { value: 'right', label: 'Right' },
                    { value: 'left', label: 'Left' },
                    { value: 'both', label: 'Both / Ambidextrous' },
                  ]}
                />
              </Field>
            </div>
            <Field label="Open to Recruiters" hint="Let agents and clubs discover your profile">
              <div className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border-muted">
                <div>
                  <p className="font-label text-sm font-medium text-white">Recruiter Discovery</p>
                  <p className="text-[10px] text-text-secondary font-label mt-0.5">Appear in recruiter search results</p>
                </div>
                <Toggle checked={draft.openToRecruit} onChange={v => set('openToRecruit', v)} />
              </div>
            </Field>
          </Section>

          {/* ── 3. PHYSICAL ──────────────────────────────────────────────── */}
          <Section id="physical" label="Physical Attributes" icon={BarChart2} accentColor="#f97316"
            open={openSection === 'physical'} onToggle={() => toggle('physical')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Height">
                <TextInput value={draft.height} onChange={v => set('height', v)} placeholder="180 cm" />
              </Field>
              <Field label="Weight">
                <TextInput value={draft.weight} onChange={v => set('weight', v)} placeholder="75 kg" />
              </Field>
              <Field label="Yrs Experience">
                <TextInput value={String(draft.stats.yearsExperience)} onChange={v => set('stats', { ...draft.stats, yearsExperience: parseInt(v) || 0 })} type="number" placeholder="9" />
              </Field>
            </div>
            <Field label="Training Schedule / Routine" hint="Describe your weekly training schedule">
              <textarea
                value={draft.trainingSchedule}
                onChange={e => set('trainingSchedule', e.target.value)}
                rows={2}
                placeholder="Mon-Fri: 6AM track session + gym, Sat: match/scrimmage, Sun: recovery..."
                className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2.5 font-mono text-sm text-white placeholder-text-muted outline-none focus:border-volt/50 transition-all resize-none"
              />
            </Field>
            <Field label="Injury History" hint="Visible only to you and agents you authorize">
              <textarea
                value={draft.injuryHistory}
                onChange={e => set('injuryHistory', e.target.value)}
                rows={2}
                placeholder="2022 ACL right knee — fully recovered. No current issues."
                className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2.5 font-mono text-sm text-white placeholder-text-muted outline-none focus:border-volt/50 transition-all resize-none"
              />
            </Field>
          </Section>

          {/* ── 4. PERFORMANCE DNA ──────────────────────────────────────── */}
          <Section id="performance" label="Performance DNA Sliders" icon={Star} accentColor="#a855f7"
            open={openSection === 'performance'} onToggle={() => toggle('performance')}>
            <p className="text-xs font-label text-text-muted">
              Self-rate your abilities 0–100. These power your radar chart and AI matching.
            </p>
            <div className="space-y-4">
              {(Object.entries(draft.performanceData) as [keyof PerformanceData, number][]).map(([key, val]) => {
                const colors: Record<string, string> = {
                  speed: '#CCFF00', strength: '#f97316', endurance: '#06b6d4',
                  agility: '#a855f7', technique: '#22c55e', teamwork: '#FF3B00',
                };
                return (
                  <SliderInput
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={val}
                    onChange={v => setPerf(key, v)}
                    color={colors[key] || '#CCFF00'}
                  />
                );
              })}
            </div>
            <div className="p-3 rounded-xl bg-elevated border border-border-muted/50">
              <p className="text-[10px] font-label text-text-muted">
                ⚡ Overall DNA Rating is auto-calculated from your sliders. Your current rating:{' '}
                <span className="text-volt font-bold">
                  {Math.round(Object.values(draft.performanceData).reduce((a, b) => a + b, 0) / 6)}
                </span>
                /100
              </p>
            </div>
          </Section>

          {/* ── 5. CAREER ──────────────────────────────────────────────── */}
          <Section id="career" label="Career & Club History" icon={Award} accentColor="#06b6d4"
            open={openSection === 'career'} onToggle={() => toggle('career')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Current Club / Team">
                <TextInput value={draft.club} onChange={v => set('club', v)} placeholder="FC Berlin, Team Alpha..." />
              </Field>
              <Field label="Agent / Manager" hint="Private">
                <TextInput value={draft.agent} onChange={v => set('agent', v)} placeholder="John Smith Sports Mgmt" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Career Matches">
                <TextInput value={String(draft.stats.matches)} onChange={v => set('stats', { ...draft.stats, matches: parseInt(v) || 0 })} type="number" placeholder="94" />
              </Field>
              <Field label="Career Wins">
                <TextInput value={String(draft.stats.wins)} onChange={v => set('stats', { ...draft.stats, wins: parseInt(v) || 0 })} type="number" placeholder="71" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Career Losses">
                <TextInput value={String(draft.stats.losses)} onChange={v => set('stats', { ...draft.stats, losses: parseInt(v) || 0 })} type="number" placeholder="23" />
              </Field>
              <Field label="Events Participated">
                <TextInput value={String(draft.stats.events)} onChange={v => set('stats', { ...draft.stats, events: parseInt(v) || 0 })} type="number" placeholder="28" />
              </Field>
            </div>
            <div className="p-3 rounded-xl bg-elevated border border-border-muted/50 space-y-1">
              <p className="text-[10px] font-label text-text-muted uppercase tracking-widest">Calculated Stats</p>
              <div className="flex gap-4 font-mono text-xs text-white">
                <span>Win Rate: <span className="text-volt">{draft.stats.matches > 0 ? Math.round((draft.stats.wins / draft.stats.matches) * 100) : 0}%</span></span>
                <span>W/L: <span className="text-volt">{draft.stats.wins}-{draft.stats.losses}</span></span>
              </div>
            </div>
          </Section>

          {/* ── 6. SOCIAL LINKS ──────────────────────────────────────────── */}
          <Section id="social" label="Social Links & Presence" icon={Globe} accentColor="#22c55e"
            open={openSection === 'social'} onToggle={() => toggle('social')}>
            {[
              { key: 'instagram' as const, icon: AtSign, prefix: 'instagram.com/', placeholder: 'yourhandle', color: '#e1306c' },
              { key: 'twitter' as const, icon: Hash, prefix: 'x.com/', placeholder: 'yourhandle', color: '#1da1f2' },
              { key: 'youtube' as const, icon: Play, prefix: 'youtube.com/@', placeholder: 'channel', color: '#ff0000' },
              { key: 'linkedin' as const, icon: Briefcase, prefix: 'linkedin.com/in/', placeholder: 'profile', color: '#0077b5' },
              { key: 'website' as const, icon: Globe, prefix: 'https://', placeholder: 'yourwebsite.com', color: '#22c55e' },
            ].map(({ key, icon: Icon, prefix, placeholder, color }) => (
              <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                <div className="flex items-center gap-2 bg-elevated border border-border-muted rounded-xl px-3 py-2.5 focus-within:border-volt/50 transition-all">
                  <Icon size={14} style={{ color }} className="flex-shrink-0" />
                  <span className="font-mono text-xs text-text-muted flex-shrink-0 hidden sm:block">{prefix}</span>
                  <input
                    type="text"
                    value={draft.socials[key]}
                    onChange={e => setSocial(key, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent font-mono text-sm text-white placeholder-text-muted outline-none min-w-0"
                  />
                </div>
              </Field>
            ))}
          </Section>

          {/* ── 7. PRIVACY ──────────────────────────────────────────────── */}
          <Section id="privacy" label="Privacy & Visibility" icon={Shield} accentColor="#FF3B00"
            open={openSection === 'privacy'} onToggle={() => toggle('privacy')}>
            {[
              { key: 'privateProfile' as const, label: 'Private Profile', desc: 'Only followers can see your profile' },
              { key: 'showStats' as const, label: 'Show Performance Stats', desc: 'Display your DNA radar and stats publicly' },
              { key: 'showLocation' as const, label: 'Show Location', desc: 'Display your city on your public profile' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border-muted">
                <div>
                  <p className="font-label text-sm font-medium text-white">{label}</p>
                  <p className="text-[10px] text-text-secondary font-label mt-0.5">{desc}</p>
                </div>
                <Toggle checked={draft[key] as boolean} onChange={v => set(key, v as any)} />
              </div>
            ))}
            <div className="p-3 rounded-xl bg-hot/5 border border-hot/20">
              <p className="text-[10px] font-label text-text-secondary leading-relaxed">
                🔒 Email, phone, and agent info are always private and never shown on your public profile.
              </p>
            </div>
          </Section>

          {/* ── 8. NOTIFICATIONS ──────────────────────────────────────────── */}
          <Section id="notifications" label="Notifications & Alerts" icon={Bell} accentColor="#eab308"
            open={openSection === 'notifications'} onToggle={() => toggle('notifications')}>
            {[
              { key: 'emailNotif' as const, label: 'Email Notifications', desc: 'Weekly digest and event updates via email' },
              { key: 'pushNotif' as const, label: 'Push Notifications', desc: 'In-app alerts for messages and activity' },
              { key: 'matchAlerts' as const, label: 'Match & Event Alerts', desc: 'Get notified 48h before your events' },
              { key: 'recruitAlerts' as const, label: 'Recruiter Activity', desc: 'When a recruiter views or saves your profile' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border-muted">
                <div>
                  <p className="font-label text-sm font-medium text-white">{label}</p>
                  <p className="text-[10px] text-text-secondary font-label mt-0.5">{desc}</p>
                </div>
                <Toggle checked={draft[key] as boolean} onChange={v => set(key, v as any)} />
              </div>
            ))}
          </Section>

          {/* Bottom spacer */}
          <div className="h-6" />
        </div>

        {/* Sticky Footer */}
        <div className="px-4 py-4 border-t border-border-muted bg-surface flex-shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-border-muted text-text-secondary hover:text-white hover:border-volt/30 font-label text-sm transition-all">
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 py-2.5 rounded-xl font-label text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            style={{
              background: saved ? '#22c55e' : '#CCFF00',
              color: '#000',
              boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : '0 0 16px rgba(204,255,0,0.2)',
            }}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.div key="saving" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                  Saving DNA...
                </motion.div>
              ) : saved ? (
                <motion.div key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Check size={16} /> Profile Updated!
                </motion.div>
              ) : (
                <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Save size={16} /> Save Player DNA
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};
