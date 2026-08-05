import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Dumbbell, Briefcase, Award, CalendarDays, Globe, Check, X,
  MapPin, Info, Camera, Search, ChevronRight, Eye, EyeOff, Users,
  Mail, Lock, UserCircle2, AtSign
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';
import {
  registerUser,
  loginWithGoogle,
  getAuthErrorMessage,
} from '@/lib/authService';
import { GLOBAL_SPORTS } from '@/constants/sports';
import toast from 'react-hot-toast';

/* ─── Constants ─────────────────────────────────────────────────────── */

const ROLES: { id: UserRole; icon: any; title: string; desc: string; color: string }[] = [
  { id: 'athlete',   icon: Dumbbell,    title: 'Athlete',    desc: 'Compete, get discovered, build your legacy', color: 'from-volt/20 to-volt/5' },
  { id: 'recruiter', icon: Briefcase,   title: 'Recruiter',  desc: 'Scout elite talent across 20+ sports',       color: 'from-blue-400/20 to-blue-400/5' },
  { id: 'coach',     icon: Award,       title: 'Coach',      desc: 'Manage athletes, track performance',         color: 'from-orange-400/20 to-orange-400/5' },
  { id: 'organizer', icon: CalendarDays,title: 'Organizer',  desc: 'Create & manage world-class events',         color: 'from-purple-400/20 to-purple-400/5' },
];

const ROLE_LEVEL_LABELS: Record<UserRole, { id: string; label: string; desc: string }[]> = {
  athlete: [
    { id: 'amateur',      label: 'Amateur',       desc: 'Recreational / weekend warrior' },
    { id: 'semi-pro',     label: 'Semi-Pro',      desc: 'Competitive, part-time career' },
    { id: 'professional', label: 'Professional',  desc: 'Full-time competitive athlete' },
    { id: 'elite',        label: 'Elite',         desc: 'National / International level' },
  ],
  recruiter: [
    { id: 'junior',       label: 'Junior Scout',  desc: 'Learning the scouting craft' },
    { id: 'regional',     label: 'Regional Scout',desc: 'Covers local & national talent' },
    { id: 'senior',       label: 'Senior Scout',  desc: 'Multi-sport, professional network' },
    { id: 'elite',        label: 'Elite Director',desc: 'Global talent acquisition' },
  ],
  coach: [
    { id: 'grassroots',   label: 'Grassroots',    desc: 'Youth / community coaching' },
    { id: 'club',         label: 'Club Level',    desc: 'Competitive club / academy' },
    { id: 'professional', label: 'Professional',  desc: 'Pro league or national team' },
    { id: 'elite',        label: 'Elite Head Coach', desc: 'Champions League / World Cup' },
  ],
  organizer: [
    { id: 'local',        label: 'Local Events',  desc: 'Community / city-level events' },
    { id: 'regional',     label: 'Regional',      desc: 'State / multi-city competitions' },
    { id: 'national',     label: 'National',      desc: 'Country-wide championships' },
    { id: 'international',label: 'International', desc: 'Global tournaments & leagues' },
  ],
};

const STEP_COUNT = 6;

const NEARBY_ATHLETES = [
  { name: 'Marcus Thielemann', role: 'Football • Pro',     img: 'https://i.pravatar.cc/100?img=11', distance: '1.2 km' },
  { name: 'Priya Krishnamurthy', role: 'Tennis • Elite',   img: 'https://i.pravatar.cc/100?img=47', distance: '2.4 km' },
  { name: 'Isabela Moraes',    role: 'Swimming • Olympic', img: 'https://i.pravatar.cc/100?img=9',  distance: '3.1 km' },
  { name: 'Yuki Tanaka',       role: 'MMA • Pro',          img: 'https://i.pravatar.cc/100?img=18', distance: '4.7 km' },
  { name: 'Aleksei Volkov',    role: 'Weightlifting • Pro',img: 'https://i.pravatar.cc/100?img=52', distance: '5.3 km' },
];


/* ─── Sub-components ─────────────────────────────────────────────────── */

const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-1.5 justify-center mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{
          width: i === current ? '24px' : '6px',
          opacity: i < current ? 0.5 : 1,
        }}
        style={{
          backgroundColor: i <= current ? 'var(--accent)' : 'var(--border)',
        }}
        transition={{ duration: 0.3 }}
        className="h-1.5 rounded-full"
      />
    ))}
  </div>
);

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
              boxShadow: selected && filled ? '0 0 8px var(--accent-glow)' : 'none',
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

export const SignupPage: React.FC = () => {
  const navigate   = useNavigate();
  const fileRef    = useRef<HTMLInputElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  /* Global step state */
  const [step, setStep] = useState(0); // 0-5

  /* Step 0 – Role */
  const [role, setRole] = useState<UserRole | null>(null);

  /* Step 1 – Basic Details */
  const [fullName,  setFullName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [location,  setLocation]  = useState('');
  const [level,     setLevel]     = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);


  /* Step 2 – Auth */
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [authMode,        setAuthMode]        = useState<'email' | 'google'>('email');

  /* Step 3 – Sports */
  const [primarySport,     setPrimarySport]     = useState('');
  const [interestedSports, setInterestedSports] = useState<string[]>([]);
  const [sportSearch,      setSportSearch]      = useState('');

  /* Step 4 – Profile Photo */
  const [photoFile,     setPhotoFile]     = useState<File | null>(null);
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,   setIsUploading]   = useState(false);

  /* Step 5 – Nearby Players */
  const [followed, setFollowed] = useState<string[]>([]);

  /* Global */
  const [isLoading, setIsLoading] = useState(false);


  /* ── Browser GPS ── */
  const handleGPS = () => {
    if (isLocating) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city    = data.address?.city || data.address?.town || data.address?.village || '';
          const country = data.address?.country || '';
          setLocation(`${city}${city && country ? ', ' : ''}${country}` || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
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

  /* ── Sport toggle (interested) ── */
  const toggleInterested = (id: string) => {
    if (id === primarySport) return;
    setInterestedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  /* ── Photo upload ── */
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

  /* ── Visible sports (search) ── */
  const visibleSports = React.useMemo(() => {
    if (sportSearch.trim()) {
      return GLOBAL_SPORTS.filter(s => s.label.toLowerCase().includes(sportSearch.toLowerCase()));
    }
    return GLOBAL_SPORTS.slice(0, 12);
  }, [sportSearch]);

  /* ── Step validation ── */
  const canContinue = useCallback((): boolean => {
    switch (step) {
      case 0: return !!role;
      case 1: return !!fullName.trim() && username.length >= 3 && !!location.trim() && !!level;
      case 2: return authMode === 'google' || (!!email && !!password && password === confirmPassword && password.length >= 6);
      case 3: return !!primarySport;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  }, [step, role, fullName, username, location, level, authMode, email, password, confirmPassword, primarySport]);

  /* ── Google signup ── */
  const handleGoogleSignup = () => {
    // createOAuth2Session is a browser redirect — not a promise.
    // Appwrite will redirect back to /auth/callback on success.
    loginWithGoogle();
  };

  /* ── Final submit ── */
  const handleSubmit = async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      await registerUser({
        fullName,
        username,
        email,
        password,
        role,
        sport: primarySport,
        sports: [primarySport, ...interestedSports].filter(Boolean),
        experienceLevel: level,
        location,
      });
      toast.success('Account created! Welcome to SPORTiX ⚡');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Next handler ── */
  const handleNext = async () => {
    if (step === 2 && authMode === 'google') {
      handleGoogleSignup();
      return;
    }
    if (step < STEP_COUNT - 1) {
      setStep(s => s + 1);
    } else {
      await handleSubmit();
    }
  };


  const levelOptions = role ? ROLE_LEVEL_LABELS[role] : ROLE_LEVEL_LABELS['athlete'];

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.07) 0%, transparent 65%)' }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(204,255,0,0.04) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-lg relative z-10 py-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-glow-volt flex-shrink-0">
            <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-3xl text-volt tracking-widest">SPORTIX</span>
        </motion.div>

        {/* Step dots */}
        <StepDots current={step} total={STEP_COUNT} />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl border border-volt/10 overflow-hidden"
        >
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════
                STEP 0 — CHOOSE ROLE
            ══════════════════════════════════ */}
            {step === 0 && (
              <motion.div key="step0"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <h1 className="font-display text-3xl text-white tracking-wide mb-1">JOIN SPORTIX</h1>
                <p className="text-text-secondary font-label text-sm mb-6">Choose your role to get started</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ROLES.map(({ id, icon: Icon, title, desc, color }) => (
                    <motion.button
                      key={id} type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setRole(id)}
                      className={`relative p-4 rounded-xl border text-left transition-all duration-200 overflow-hidden
                        ${role === id
                          ? 'border-volt bg-volt/10 shadow-[0_0_20px_rgba(204,255,0,0.12)]'
                          : 'border-border-muted bg-elevated hover:border-volt/30'}`}
                    >
                      {role === id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`absolute inset-0 bg-gradient-to-br ${color} pointer-events-none`}
                        />
                      )}
                      <div className="relative z-10">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all
                          ${role === id ? 'bg-volt text-black shadow-glow-volt-sm' : 'bg-surface text-text-secondary'}`}>
                          <Icon size={17} />
                        </div>
                        <p className={`font-label text-sm font-bold transition-colors ${role === id ? 'text-volt' : 'text-white'}`}>{title}</p>
                        <p className="font-label text-xs text-text-secondary mt-0.5 leading-snug">{desc}</p>
                      </div>
                      {role === id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-volt flex items-center justify-center">
                          <Check size={11} className="text-black" strokeWidth={3} />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <Button fullWidth size="lg" disabled={!role} onClick={() => setStep(1)}
                  icon={<ChevronRight size={16} />}>
                  Continue
                </Button>

                <p className="text-center text-sm text-text-secondary font-label mt-5">
                  Already have an account?{' '}
                  <Link to="/login" className="text-volt hover:underline font-medium">Sign In</Link>
                </p>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 1 — BASIC DETAILS
            ══════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <button onClick={() => setStep(0)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">
                  ← Back
                </button>
                <h1 className="font-display text-3xl text-white tracking-wide mb-1">YOUR PROFILE</h1>
                <p className="text-text-secondary font-label text-sm mb-6">
                  Joining as <span className="text-volt capitalize font-semibold">{role}</span>
                </p>

                <div className="space-y-4">
                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Marcus Thielemann"
                    icon={<UserCircle2 size={15} />}
                    required
                  />

                  {/* Username */}
                  <Input
                    label="Username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                    placeholder="marcus_thiel"
                    icon={<AtSign size={15} />}
                    required
                  />

                  {/* Location */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-label font-medium text-text-secondary uppercase tracking-widest">
                        Location
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLocationInfo(v => !v)}
                        className="text-text-muted hover:text-volt transition-colors"
                        title="Why we need your location"
                      >
                        <Info size={13} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showLocationInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          className="mb-3 px-3.5 py-2.5 rounded-xl bg-volt/8 border border-volt/20 text-xs text-text-secondary font-label leading-relaxed"
                        >
                          <span className="text-volt font-semibold">⚡ Why location?</span>
                          <br />
                          We use your location to surface <span className="text-white">nearby players</span>,{' '}
                          <span className="text-white">local events</span>, and{' '}
                          <span className="text-white">training partners</span> in your area.
                          Your exact coordinates are never shared publicly.
                          <button
                            type="button"
                            onClick={() => setShowLocationInfo(false)}
                            className="ml-2 text-text-muted hover:text-volt transition-colors"
                          >
                            <X size={12} className="inline" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none z-10">
                        <MapPin size={15} className={isLocating ? 'text-volt animate-pulse' : 'text-text-secondary'} />
                      </div>
                      <input
                        type="text"
                        value={isLocating ? 'Locating…' : location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="Berlin, Germany"
                        disabled={isLocating}
                        className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleGPS}
                        disabled={isLocating}
                        className="absolute right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-volt/10 hover:bg-volt/20 text-volt text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-volt/20"
                      >
                        {isLocating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 border-2 border-volt border-t-transparent rounded-full" />
                        ) : (
                          <MapPin size={11} />
                        )}
                        {isLocating ? 'Locating' : 'Use GPS'}
                      </button>
                    </div>
                  </div>

                  {/* Level / Status */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2.5">
                      {role === 'athlete' ? 'Player Level' : role === 'coach' ? 'Coaching Level' : role === 'recruiter' ? 'Scouting Level' : 'Event Scale'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {levelOptions.map(opt => {
                        const sel = level === opt.id;
                        return (
                          <motion.button
                            key={opt.id}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setLevel(opt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all
                              ${sel
                                ? 'border-volt bg-volt/10 shadow-[0_0_12px_rgba(204,255,0,0.1)]'
                                : 'border-border-muted bg-elevated hover:border-volt/25'}`}
                          >
                            <div>
                              <p className={`font-label text-xs font-bold transition-colors ${sel ? 'text-volt' : 'text-white'}`}>{opt.label}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{opt.desc}</p>
                            </div>
                            <SkillBars level={opt.id} selected={sel} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    fullWidth size="lg"
                    disabled={!canContinue()}
                    onClick={() => setStep(2)}
                    icon={<ChevronRight size={16} />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 2 — AUTH METHOD
            ══════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <button onClick={() => setStep(1)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">
                  ← Back
                </button>
                <h1 className="font-display text-3xl text-white tracking-wide mb-1">CREATE ACCOUNT</h1>
                <p className="text-text-secondary font-label text-sm mb-6">Secure your SPORTiX identity</p>

                {/* Auth toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-elevated border border-border-muted mb-6">
                  {(['email', 'google'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAuthMode(mode)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-label font-semibold transition-all ${
                        authMode === mode
                          ? 'bg-volt text-black shadow-glow-volt-sm'
                          : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      {mode === 'email' ? (
                        <span className="flex items-center justify-center gap-2"><Mail size={14} /> Email</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2"><Globe size={14} /> Google</span>
                      )}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {authMode === 'email' ? (
                    <motion.div key="email-form"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <Input
                        label="Email Address" type="email"
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="athlete@example.com"
                        icon={<Mail size={15} />} required
                      />
                      <Input
                        label="Password" type={showPass ? 'text' : 'password'}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        icon={<Lock size={15} />}
                        rightIcon={
                          <button type="button" onClick={() => setShowPass(v => !v)} className="hover:text-volt transition-colors">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        }
                        required
                      />
                      <Input
                        label="Confirm Password" type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        icon={<Lock size={15} />}
                        rightIcon={
                          <button type="button" onClick={() => setShowConfirm(v => !v)} className="hover:text-volt transition-colors">
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        }
                        required
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-400 font-label">Passwords do not match.</p>
                      )}
                      <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs text-text-muted hover:text-volt font-label transition-colors">
                          Forgot password?
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="google-form"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="py-4"
                    >
                      <div className="flex flex-col items-center gap-4 py-6 rounded-xl border border-border-muted bg-elevated">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border-muted flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-7 h-7">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-white font-label font-semibold">Continue with Google</p>
                          <p className="text-xs text-text-secondary mt-1">Quick & secure — no password needed</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6">
                  <Button
                    fullWidth size="lg"
                    loading={isLoading && authMode === 'google'}
                    disabled={isLoading || !canContinue()}
                    onClick={handleNext}
                    icon={authMode === 'google' ? <Globe size={16} /> : <ChevronRight size={16} />}
                  >
                    {authMode === 'google' ? 'Sign up with Google' : 'Continue'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 3 — SPORTS
            ══════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <button onClick={() => setStep(2)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">
                  ← Back
                </button>
                <h1 className="font-display text-3xl text-white tracking-wide mb-1">YOUR SPORTS</h1>
                <p className="text-text-secondary font-label text-sm mb-5">Primary sport + up to 4 you're interested in</p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search sports…"
                    value={sportSearch}
                    onChange={e => setSportSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                  />
                  {sportSearch && (
                    <button onClick={() => setSportSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-0.5 mb-5">
                  {visibleSports.map(sport => {
                    const isPrimary   = primarySport === sport.id;
                    const isInterested = interestedSports.includes(sport.id);
                    return (
                      <motion.button
                        key={sport.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (!primarySport) {
                            setPrimarySport(sport.id);
                          } else if (isPrimary) {
                            setPrimarySport('');
                          } else {
                            toggleInterested(sport.id);
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200
                          ${isPrimary
                            ? 'border-volt bg-volt text-black shadow-glow-volt-sm'
                            : isInterested
                              ? 'border-volt/50 bg-volt/10 text-volt'
                              : 'border-border-muted bg-elevated text-text-secondary hover:border-volt/30 hover:text-text-primary'}`}
                      >
                        {isPrimary && (
                          <span className="absolute top-1 right-1 text-[7px] font-bold bg-black/20 px-1 rounded-full uppercase tracking-wider">Primary</span>
                        )}
                        <span className="text-xl leading-none">{sport.emoji}</span>
                        <span className="text-[10px] font-label font-semibold uppercase tracking-wide leading-tight text-center">{sport.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-[10px] text-text-muted font-mono mb-5">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt inline-block" />Primary sport (tap first)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt/20 border border-volt/40 inline-block" />Interested (up to 4)</span>
                </div>

                <Button
                  fullWidth size="lg"
                  disabled={!primarySport}
                  onClick={() => setStep(4)}
                  icon={<ChevronRight size={16} />}
                >
                  Continue ({interestedSports.length + (primarySport ? 1 : 0)} selected)
                </Button>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 4 — PROFILE PHOTO
            ══════════════════════════════════ */}
            {step === 4 && (
              <motion.div key="step4"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <button onClick={() => setStep(3)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">
                  ← Back
                </button>
                <h1 className="font-display text-3xl text-white tracking-wide mb-1">PROFILE PHOTO</h1>
                <p className="text-text-secondary font-label text-sm mb-6">Upload your avatar — first impressions matter ⚡</p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {/* Upload area */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => !isUploading && fileRef.current?.click()}
                  className="relative border-2 border-dashed border-volt/25 hover:border-volt/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 mb-5 bg-elevated/50 group"
                >
                  {isUploading && (
                    <>
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-volt shadow-[0_0_12px_#CCFF00] z-20"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 bg-volt/5 z-10 flex flex-col items-center justify-center">
                        <span className="font-mono text-volt text-xs font-bold tracking-widest">UPLOADING…</span>
                        <span className="font-mono text-volt text-3xl font-bold mt-1">{uploadProgress}%</span>
                        <div className="mt-3 w-32 h-1 bg-border rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-volt rounded-full"
                          />
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
                        <p className="text-xs text-text-secondary mt-1">{photoFile?.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setPhotoPreview(null); setPhotoFile(null); }}
                        className="text-xs text-text-muted hover:text-red-400 font-label transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : !isUploading ? (
                    <div className="flex flex-col items-center gap-3 text-center py-4">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
                  <Button variant="ghost" onClick={() => setStep(5)}>
                    Skip for now
                  </Button>
                  <Button
                    fullWidth size="lg"
                    onClick={() => setStep(5)}
                    disabled={isUploading}
                    icon={<ChevronRight size={16} />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 5 — NEARBY PLAYERS
            ══════════════════════════════════ */}
            {step === 5 && (
              <motion.div key="step5"
                initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
                className="p-8"
              >
                <button onClick={() => setStep(4)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">
                  ← Back
                </button>

                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h1 className="font-display text-3xl text-white tracking-wide">NEARBY</h1>
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
                  {NEARBY_ATHLETES.map((ath) => {
                    const isFollowing = followed.includes(ath.name);
                    return (
                      <motion.div
                        key={ath.name}
                        layout
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden
                          ${isFollowing ? 'border-volt/30 bg-volt/5' : 'border-border-muted bg-elevated'}`}
                      >
                        {isFollowing && (
                          <motion.div
                            initial={{ opacity: 1, scale: 0.95 }}
                            animate={{ opacity: 0, scale: 1.04 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0 border border-volt rounded-xl pointer-events-none"
                          />
                        )}
                        <img src={ath.img} alt={ath.name} className="w-11 h-11 rounded-full object-cover border border-border flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-label text-sm font-semibold text-white truncate">{ath.name}</p>
                          <p className="text-xs text-text-secondary truncate">{ath.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                            <MapPin size={9} /> {ath.distance}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setFollowed(prev =>
                              prev.includes(ath.name) ? prev.filter(n => n !== ath.name) : [...prev, ath.name]
                            )}
                            className={`text-xs font-label px-3 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1
                              ${isFollowing
                                ? 'bg-volt/10 text-volt border border-volt/30'
                                : 'bg-volt text-black'}`}
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
                  onClick={handleSubmit}
                  icon={<Zap size={16} fill="currentColor" />}
                >
                  {isLoading ? 'Creating Account…' : 'Enter SPORTiX ⚡'}
                </Button>

                <p className="text-center text-xs text-text-muted font-mono mt-3">
                  You can follow more athletes after joining
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
