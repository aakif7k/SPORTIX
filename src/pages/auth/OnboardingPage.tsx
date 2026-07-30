import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, MapPin, Camera, Check, Search, X, Info,
  Users, ChevronRight, UserCircle2, AtSign,
  Dumbbell, Briefcase, Award, CalendarDays
} from 'lucide-react';
import { GLOBAL_SPORTS } from '../../services/mockData';
import { Button } from '../../components/ui/Button';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import { checkUsernameAvailable, getUserProfile } from '@/lib/authService';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

/* ─── Constants ─────────────────────────────────────────────────────── */

const ROLES: { id: UserRole; icon: any; title: string; desc: string }[] = [
  { id: 'athlete',   icon: Dumbbell,    title: 'Athlete',   desc: 'Compete, get discovered, build your legacy' },
  { id: 'recruiter', icon: Briefcase,   title: 'Recruiter', desc: 'Scout elite talent across 20+ sports' },
  { id: 'coach',     icon: Award,       title: 'Coach',     desc: 'Manage athletes, track performance' },
  { id: 'organizer', icon: CalendarDays,title: 'Organizer', desc: 'Create & manage world-class events' },
];

const ROLE_LEVEL_LABELS: Record<UserRole, { id: string; label: string; desc: string }[]> = {
  athlete: [
    { id: 'amateur',      label: 'Amateur',        desc: 'Recreational / weekend warrior' },
    { id: 'semi-pro',     label: 'Semi-Pro',       desc: 'Competitive, part-time career' },
    { id: 'professional', label: 'Professional',   desc: 'Full-time competitive athlete' },
    { id: 'elite',        label: 'Elite',          desc: 'National / International level' },
  ],
  recruiter: [
    { id: 'junior',   label: 'Junior Scout',   desc: 'Learning the scouting craft' },
    { id: 'regional', label: 'Regional Scout', desc: 'Covers local & national talent' },
    { id: 'senior',   label: 'Senior Scout',   desc: 'Multi-sport, professional network' },
    { id: 'elite',    label: 'Elite Director', desc: 'Global talent acquisition' },
  ],
  coach: [
    { id: 'grassroots',   label: 'Grassroots',     desc: 'Youth / community coaching' },
    { id: 'club',         label: 'Club Level',     desc: 'Competitive club / academy' },
    { id: 'professional', label: 'Professional',   desc: 'Pro league or national team' },
    { id: 'elite',        label: 'Elite Head Coach',desc: 'Champions League / World Cup' },
  ],
  organizer: [
    { id: 'local',         label: 'Local Events',  desc: 'Community / city-level events' },
    { id: 'regional',      label: 'Regional',      desc: 'State / multi-city competitions' },
    { id: 'national',      label: 'National',      desc: 'Country-wide championships' },
    { id: 'international', label: 'International', desc: 'Global tournaments & leagues' },
  ],
};

const NEARBY_ATHLETES = [
  { name: 'Marcus Thielemann',   role: 'Football • Pro',      img: 'https://i.pravatar.cc/100?img=11', distance: '1.2 km' },
  { name: 'Priya Krishnamurthy', role: 'Tennis • Elite',      img: 'https://i.pravatar.cc/100?img=47', distance: '2.4 km' },
  { name: 'Isabela Moraes',      role: 'Swimming • Olympic',  img: 'https://i.pravatar.cc/100?img=9',  distance: '3.1 km' },
  { name: 'Yuki Tanaka',         role: 'MMA • Pro',           img: 'https://i.pravatar.cc/100?img=18', distance: '4.7 km' },
  { name: 'Aleksei Volkov',      role: 'Weightlifting • Pro', img: 'https://i.pravatar.cc/100?img=52', distance: '5.3 km' },
];

const STEP_LABELS = ['Role', 'Details', 'Sports', 'Photo', 'Connect'];
const TOTAL_STEPS = 5;

/* ─── Sub-components ─────────────────────────────────────────────────── */

const StepBar: React.FC<{ current: number }> = ({ current }) => {
  const pct = ((current + 1) / TOTAL_STEPS) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-1 mb-3">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-1.5 ${i <= current ? 'text-volt' : 'text-text-muted'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300
                ${i < current ? 'bg-volt border-volt text-black' : i === current ? 'border-volt text-volt shadow-[0_0_8px_rgba(204,255,0,0.4)]' : 'border-border-muted text-text-muted'}`}
              >
                {i < current ? <Check size={10} strokeWidth={3} /> : i + 1}
              </div>
              <span className="text-[10px] font-label hidden sm:block tracking-wide uppercase">{label}</span>
            </div>
            {i < TOTAL_STEPS - 1 && <div className="flex-1 h-px bg-border-muted" />}
          </React.Fragment>
        ))}
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden border border-border-muted">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} className="h-full bg-volt rounded-full shadow-[0_0_6px_rgba(204,255,0,0.5)]" />
      </div>
    </div>
  );
};

const SkillBars: React.FC<{ level: string; selected: boolean }> = ({ level, selected }) => {
  const counts: Record<string, number> = { amateur: 1, 'semi-pro': 2, professional: 3, elite: 4, junior: 1, regional: 2, senior: 3, grassroots: 1, club: 2, local: 1, national: 3, international: 4 };
  const count = counts[level] || 2;
  return (
    <div className="flex gap-1 items-end flex-shrink-0">
      {[1, 2, 3, 4].map(bar => {
        const filled = bar <= count;
        return (
          <motion.div
            key={bar}
            animate={{ scaleY: selected && filled ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3, delay: bar * 0.05 }}
            style={{
              transformOrigin: 'bottom',
              backgroundColor: filled ? 'var(--accent)' : 'var(--border)',
              boxShadow: selected && filled ? '0 0 8px rgba(204,255,0,0.5)' : 'none',
              height: `${bar * 6}px`,
            }}
            className="w-1.5 rounded-sm transition-colors"
          />
        );
      })}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────── */

export const OnboardingPage: React.FC = () => {
  const navigate  = useNavigate();
  const fileRef   = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { user: currentUser } = useAuth();

  /* Step */
  const [step, setStep] = useState(0);

  /* Step 0 – Role */
  const [role, setRole] = useState<UserRole>('athlete');

  /* Step 1 – Details */
  const [fullName,  setFullName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [location,  setLocation]  = useState('');
  const [level,     setLevel]     = useState('');
  const [bio,       setBio]       = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  // The check result is stored with the username it was run against, so
  // availability can be derived. A short username previously had to be reset to
  // null synchronously inside the effect (react-hooks/set-state-in-effect).
  const [usernameCheck, setUsernameCheck] = useState<{ username: string; available: boolean } | null>(null);
  const [checkingUsername,   setCheckingUsername]   = useState(false);

  /* Step 2 – Sports */
  const [primarySport,     setPrimarySport]     = useState('');
  const [interestedSports, setInterestedSports] = useState<string[]>([]);
  const [sportSearch,      setSportSearch]      = useState('');

  /* Step 3 – Photo */
  const [photoFile,      setPhotoFile]      = useState<File | null>(null);
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);

  /* Step 4 – Nearby */
  const [followed, setFollowed] = useState<string[]>([]);

  /* Global */
  const [isLoading, setIsLoading] = useState(false);

  /* ── Pre-populate from existing profile ── */
  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.id).then(profile => {
        if (!profile) return;
        if (profile.username)          setUsername(profile.username);
        if (profile.role)              setRole(profile.role as UserRole);
        if (profile.location)          setLocation(profile.location);
        if (profile.bio)               setBio(profile.bio);
        if (profile.sports?.length) {
          setPrimarySport(profile.sports[0]);
          setInterestedSports(profile.sports.slice(1));
        }
        if (profile.experience_level)  setLevel(profile.experience_level);
        if (profile.avatar_url)        setPhotoPreview(profile.avatar_url);
        if (profile.full_name)    setFullName(profile.full_name);
      });
    }
  }, [currentUser]);

  /* ── Username debounce ── */
  useEffect(() => {
    if (username.length < 3) return;
    const t = setTimeout(async () => {
      setCheckingUsername(true);
      const ok = await checkUsernameAvailable(username);
      setUsernameCheck({ username, available: ok });
      setCheckingUsername(false);
    }, 600);
    return () => clearTimeout(t);
  }, [username]);

  // null while too short or while the stored result belongs to an older value,
  // which also stops a stale verdict from being shown against a new username.
  const usernameAvailable: boolean | null =
    username.length >= 3 && usernameCheck?.username === username
      ? usernameCheck.available
      : null;

  /* ── GPS ── */
  const handleGPS = () => {
    if (isLocating) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city    = data.address?.city || data.address?.town || data.address?.village || '';
          const country = data.address?.country || '';
          setLocation(`${city}${city && country ? ', ' : ''}${country}` || `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      () => {
        toast.error('Could not access your location. Please type it manually.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  /* ── Photo ── */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onload = ev => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) { clearInterval(interval); setIsUploading(false); return 100; }
          return prev + 12;
        });
      }, 80);
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ── Sports ── */
  const toggleInterested = (id: string) => {
    if (id === primarySport) return;
    setInterestedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const visibleSports = React.useMemo(() => {
    if (sportSearch.trim()) return GLOBAL_SPORTS.filter((s: any) => s.label.toLowerCase().includes(sportSearch.toLowerCase()));
    return GLOBAL_SPORTS.slice(0, 12);
  }, [sportSearch]);

  /* ── Save to Appwrite ── */
  const handleCompleteOnboarding = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    const updatedUser = {
      ...currentUser,
      name: fullName,
      username: username.toLowerCase().trim(),
      role: role as any,
      sport: primarySport as any,
      sports: [primarySport, ...interestedSports].filter(Boolean) as any,
      experienceLevel: level as any,
      location,
      bio,
      avatar: photoPreview || (currentUser as any)?.avatar_url || (currentUser as any)?.avatar || '',
      isOnboardingComplete: true,
    };

    // Update local Zustand auth store immediately
    useAuthStore.getState().updateProfile(updatedUser);

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        currentUser.id,
        {
          role,
          full_name: fullName,
          username: username.toLowerCase().trim(),
          location,
          bio,
          sport:            primarySport,
          sports:           [primarySport, ...interestedSports].filter(Boolean),
          experience_level: level,
          avatar_url:       photoPreview || null,
          is_onboarding_complete: true,
          updated_at: new Date().toISOString(),
        },
      );
    } catch (err: any) {
      console.warn('Appwrite profiles collection missing, saved onboarding state locally:', err?.message);
    } finally {
      setIsLoading(false);
      toast.success("Profile set up! Welcome to SPORTiX ⚡");
      navigate('/app/feed');
    }
  };

  /* ── Username feedback ── */
  let usernameFeedback = null;
  if (checkingUsername) {
    usernameFeedback = <div className="w-4 h-4 border-2 border-volt border-t-transparent rounded-full animate-spin" />;
  } else if (usernameAvailable === true) {
    usernameFeedback = <span className="text-volt font-mono text-[10px] flex items-center gap-1"><Check size={12} strokeWidth={3} /> Available</span>;
  } else if (usernameAvailable === false) {
    usernameFeedback = <span className="text-red-400 font-mono text-[10px] flex items-center gap-1"><X size={12} strokeWidth={3} /> Taken</span>;
  }

  const levelOptions = ROLE_LEVEL_LABELS[role];

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(204,255,0,0.07) 0%, transparent 60%)' }} />

      <div className="w-full max-w-xl relative z-10 py-8">
        {/* Logo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-volt rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-black" fill="currentColor" />
          </div>
          <span className="font-display text-2xl text-volt tracking-widest">SPORTIX</span>
        </motion.div>

        {/* Progress bar */}
        <StepBar current={step} />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-volt/10 overflow-hidden"
        >
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════
                STEP 0 — ROLE
            ══════════════════════════════════ */}
            {step === 0 && (
              <motion.div key="s0"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <h2 className="font-display text-[28px] text-white mb-1 tracking-widest">SELECT ROLE</h2>
                <p className="text-text-secondary font-label text-sm mb-6">How will you use SPORTiX?</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ROLES.map(({ id, icon: Icon, title, desc }) => {
                    const sel = role === id;
                    return (
                      <motion.button
                        key={id} type="button"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setRole(id)}
                        className={`relative p-4 rounded-xl border text-left transition-all duration-200 overflow-hidden
                          ${sel ? 'border-volt bg-volt/10 shadow-[0_0_20px_rgba(204,255,0,0.12)]' : 'border-border-muted bg-elevated hover:border-volt/30'}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all ${sel ? 'bg-volt text-black shadow-glow-volt-sm' : 'bg-surface text-text-secondary'}`}>
                          <Icon size={17} />
                        </div>
                        <p className={`font-label text-sm font-bold ${sel ? 'text-volt' : 'text-white'}`}>{title}</p>
                        <p className="font-label text-xs text-text-secondary mt-0.5 leading-snug">{desc}</p>
                        {sel && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-volt flex items-center justify-center">
                            <Check size={11} className="text-black" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <Button fullWidth size="lg" onClick={() => setStep(1)} icon={<ChevronRight size={16} />}>
                  Continue
                </Button>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 1 — DETAILS
            ══════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(0)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <h2 className="font-display text-[28px] text-white mb-1 tracking-widest">YOUR DETAILS</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Complete your profile identity</p>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <UserCircle2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        placeholder="Marcus Thielemann"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Username</label>
                    <div className="relative">
                      <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text" value={username}
                        onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                        placeholder="marcus_thiel"
                        className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                      />
                      {usernameFeedback && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{usernameFeedback}</div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-label font-medium text-text-secondary uppercase tracking-widest">Location</label>
                      <button type="button" onClick={() => setShowLocationInfo(v => !v)} className="text-text-muted hover:text-volt transition-colors">
                        <Info size={13} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {showLocationInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          className="mb-3 px-3.5 py-2.5 rounded-xl bg-volt/8 border border-volt/20 text-xs text-text-secondary font-label leading-relaxed"
                        >
                          <span className="text-volt font-semibold">⚡ Why location?</span><br />
                          We surface <span className="text-white">nearby players</span>, <span className="text-white">local events</span>, and <span className="text-white">training partners</span> close to you. Your exact coordinates are never shared publicly.
                          <button type="button" onClick={() => setShowLocationInfo(false)} className="ml-2 text-text-muted hover:text-volt transition-colors"><X size={12} className="inline" /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative flex items-center">
                      <MapPin size={15} className={`absolute left-3.5 pointer-events-none z-10 ${isLocating ? 'text-volt animate-pulse' : 'text-text-muted'}`} />
                      <input
                        type="text" value={isLocating ? 'Locating…' : location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="Berlin, Germany" disabled={isLocating}
                        className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all font-mono"
                      />
                      <button
                        type="button" onClick={handleGPS} disabled={isLocating}
                        className="absolute right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-volt/10 hover:bg-volt/20 text-volt text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-volt/20"
                      >
                        {isLocating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 border-2 border-volt border-t-transparent rounded-full" />
                        ) : <MapPin size={11} />}
                        {isLocating ? 'Locating' : 'Use GPS'}
                      </button>
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2.5">
                      {role === 'athlete' ? 'Player Level' : role === 'coach' ? 'Coaching Level' : role === 'recruiter' ? 'Scouting Level' : 'Event Scale'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {levelOptions.map(opt => {
                        const sel = level === opt.id;
                        return (
                          <motion.button
                            key={opt.id} type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setLevel(opt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all
                              ${sel ? 'border-volt bg-volt/10 shadow-[0_0_12px_rgba(204,255,0,0.1)]' : 'border-border-muted bg-elevated hover:border-volt/25'}`}
                          >
                            <div>
                              <p className={`font-label text-xs font-bold ${sel ? 'text-volt' : 'text-white'}`}>{opt.label}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{opt.desc}</p>
                            </div>
                            <SkillBars level={opt.id} selected={sel} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Bio <span className="normal-case text-text-muted">(optional)</span></label>
                    <textarea
                      value={bio} onChange={e => setBio(e.target.value)}
                      placeholder="Professional midfielder. Champions League finalist…"
                      rows={2}
                      className="w-full bg-elevated border border-border rounded-xl font-mono text-sm text-text-primary placeholder-text-muted px-4 py-3 resize-none outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                  <Button
                    fullWidth size="lg"
                    disabled={!fullName.trim() || username.length < 3 || !location.trim() || !level || usernameAvailable === false || isLocating}
                    onClick={() => setStep(2)}
                    icon={<ChevronRight size={16} />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 2 — SPORTS
            ══════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(1)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <h2 className="font-display text-[28px] text-white mb-1 tracking-widest">YOUR SPORTS</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Primary + up to 4 interested sports</p>

                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    ref={searchRef} type="text" placeholder="Search sports…"
                    value={sportSearch} onChange={e => setSportSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                  />
                  {sportSearch && (
                    <button onClick={() => setSportSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-0.5 mb-4">
                  {visibleSports.map((sport: any) => {
                    const isPrimary    = primarySport === sport.id;
                    const isInterested = interestedSports.includes(sport.id);
                    return (
                      <motion.button
                        key={sport.id} type="button" whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (!primarySport) { setPrimarySport(sport.id); }
                          else if (isPrimary) { setPrimarySport(''); }
                          else { toggleInterested(sport.id); }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200
                          ${isPrimary ? 'border-volt bg-volt text-black shadow-glow-volt-sm'
                          : isInterested ? 'border-volt/50 bg-volt/10 text-volt'
                          : 'border-border-muted bg-elevated text-text-secondary hover:border-volt/30 hover:text-text-primary'}`}
                      >
                        {isPrimary && <span className="absolute top-1 right-1 text-[7px] font-bold bg-black/20 px-1 rounded-full uppercase">Primary</span>}
                        <span className="text-xl leading-none">{sport.emoji}</span>
                        <span className="text-[10px] font-label font-semibold uppercase tracking-wide leading-tight text-center">{sport.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-4 text-[10px] text-text-muted font-mono mb-5">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt inline-block" />Primary sport (tap first)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt/20 border border-volt/40 inline-block" />Interested (up to 4)</span>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button fullWidth size="lg" disabled={!primarySport} onClick={() => setStep(3)} icon={<ChevronRight size={16} />}>
                    Continue ({interestedSports.length + (primarySport ? 1 : 0)} selected)
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 3 — PROFILE PHOTO
            ══════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(2)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <h2 className="font-display text-[28px] text-white mb-1 tracking-widest">PROFILE PHOTO</h2>
                <p className="text-text-secondary font-label text-sm mb-6">Upload your avatar — first impressions matter ⚡</p>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => !isUploading && fileRef.current?.click()}
                  className="relative border-2 border-dashed border-volt/25 hover:border-volt/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 mb-5 bg-elevated/50 group"
                >
                  {isUploading && (
                    <>
                      <motion.div className="absolute left-0 right-0 h-0.5 bg-volt shadow-[0_0_12px_#CCFF00] z-20"
                        animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                      <div className="absolute inset-0 bg-volt/5 z-10 flex flex-col items-center justify-center">
                        <span className="font-mono text-volt text-xs font-bold tracking-widest">UPLOADING…</span>
                        <span className="font-mono text-volt text-3xl font-bold mt-1">{uploadProgress}%</span>
                        <div className="mt-3 w-32 h-1 bg-border rounded-full overflow-hidden">
                          <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-volt rounded-full" />
                        </div>
                      </div>
                    </>
                  )}

                  {photoPreview && !isUploading ? (
                    <div className="flex items-center gap-5 w-full">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-volt shadow-[0_0_16px_rgba(204,255,0,0.35)] flex-shrink-0">
                        <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-label text-sm font-bold text-white uppercase tracking-wider">Photo Ready</p>
                        <p className="font-mono text-[10px] text-volt uppercase tracking-widest mt-0.5">Identity Synced ✓</p>
                        {photoFile && <p className="text-xs text-text-secondary mt-1">{photoFile.name}</p>}
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); setPhotoPreview(null); setPhotoFile(null); }}
                        className="text-xs text-text-muted hover:text-red-400 font-label transition-colors">Remove</button>
                    </div>
                  ) : !isUploading ? (
                    <div className="flex flex-col items-center gap-3 text-center py-4">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-16 h-16 rounded-full bg-volt/10 border border-volt/20 flex items-center justify-center text-volt group-hover:bg-volt/20 transition-all"
                      >
                        <Camera size={26} />
                      </motion.div>
                      <div>
                        <p className="font-label text-sm font-bold text-white uppercase tracking-wider">Upload Photo</p>
                        <p className="text-xs text-text-secondary mt-1">JPG, PNG or WebP · Max 10MB</p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>

                <p className="text-center text-xs text-text-muted font-mono mb-5">Photo is optional — you can add one later</p>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(4)}>Skip</Button>
                  <Button fullWidth size="lg" onClick={() => setStep(4)} disabled={isUploading} icon={<ChevronRight size={16} />}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 4 — NEARBY PLAYERS
            ══════════════════════════════════ */}
            {step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(3)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-display text-[28px] text-white tracking-widest">NEARBY</h2>
                    <p className="text-text-secondary font-label text-sm">
                      Athletes close to <span className="text-volt">{location || 'you'}</span>
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setFollowed(NEARBY_ATHLETES.map(a => a.name))}
                    className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-volt/30 text-volt hover:bg-volt/10 transition-all font-bold uppercase tracking-wider"
                  >
                    ⚡ Follow All
                  </motion.button>
                </div>

                <div className="space-y-2.5 mb-6">
                  {NEARBY_ATHLETES.map(ath => {
                    const isFollowing = followed.includes(ath.name);
                    return (
                      <motion.div key={ath.name} layout
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden
                          ${isFollowing ? 'border-volt/30 bg-volt/5' : 'border-border-muted bg-elevated'}`}
                      >
                        {isFollowing && (
                          <motion.div initial={{ opacity: 1, scale: 0.95 }} animate={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}
                            className="absolute inset-0 border border-volt rounded-xl pointer-events-none" />
                        )}
                        <img src={ath.img} alt={ath.name} className="w-11 h-11 rounded-full object-cover border border-border flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-label text-sm font-semibold text-white truncate">{ath.name}</p>
                          <p className="text-xs text-text-secondary truncate">{ath.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-text-muted font-mono hidden sm:flex items-center gap-1">
                            <MapPin size={9} /> {ath.distance}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setFollowed(prev =>
                              prev.includes(ath.name) ? prev.filter(n => n !== ath.name) : [...prev, ath.name]
                            )}
                            className={`text-xs font-label px-3 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1
                              ${isFollowing ? 'bg-volt/10 text-volt border border-volt/30' : 'bg-volt text-black'}`}
                          >
                            {isFollowing ? (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                                <Check size={11} strokeWidth={3} /> Following
                              </motion.span>
                            ) : (
                              <span className="flex items-center gap-1"><Users size={11} /> Follow</span>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <Button
                  fullWidth size="lg"
                  loading={isLoading}
                  disabled={isLoading}
                  onClick={handleCompleteOnboarding}
                  icon={<Zap size={16} fill="currentColor" />}
                >
                  {isLoading ? 'Setting up profile…' : 'Enter SPORTiX ⚡'}
                </Button>
                <p className="text-center text-xs text-text-muted font-mono mt-3">You can follow more athletes after joining</p>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
