import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, MapPin, Camera, Check, Search, X, Info,
  Users, ChevronRight, UserCircle2, AtSign,
  Dumbbell, Briefcase, Award, CalendarDays,
  LocateFixed, Loader, Sparkles, ShieldCheck
} from 'lucide-react';
import { GLOBAL_SPORTS } from '../../services/mockData';
import { getSportRolesSync } from '../../services/sportsRoleService';
import { Button } from '../../components/ui/Button';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { ensureUserProfile, sanitizeExperienceLevel } from '@/services/profileService';
import { getUserProfile, checkUsernameAvailable } from '@/lib/authService';
import { uploadProfilePicture } from '@/services/storageService';
import { MissingFieldsModal } from '../../components/ui/MissingFieldsModal';
import { DateOfBirthPicker } from '../../components/ui/DateOfBirthPicker';
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

const STEP_LABELS = ['Role', 'Identity', 'Details', 'Sports', 'Photo', 'Connect'];
const TOTAL_STEPS = 6;

// ─── Reverse-geocode coords → "City, Country" via OSM Nominatim ──────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  const addr = data.address || {};
  const city =
    addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
  const country = addr.country || '';
  return [city, country].filter(Boolean).join(', ');
}

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

  const { user: currentUser, refreshUser } = useAuth();

  /* Step: 0 to 5 */
  const [step, setStep] = useState(0);

  /* Step 0 – Role */
  const [role, setRole] = useState<UserRole>('athlete');

  /* Step 1 – Identity (Full Name & Username) */
  const [fullName,  setFullName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername,  setCheckingUsername]  = useState(false);

  /* Step 2 – Details */
  const [dateOfBirth,  setDateOfBirth]  = useState('');
  const [location,     setLocation]     = useState('');
  const [level,        setLevel]        = useState('');
  const [bio,          setBio]          = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'denied'>('idle');
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  /* Step 3 – Sports */
  const [primarySport,     setPrimarySport]     = useState('');
  const [interestedSports, setInterestedSports] = useState<string[]>([]);
  const [sportSearch,      setSportSearch]      = useState('');

  /* Step 4 – Photo */
  const [photoFile,      setPhotoFile]      = useState<File | null>(null);
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);

  /* Step 5 – Nearby */
  const [followed, setFollowed] = useState<string[]>([]);

  /* Global */
  const [isLoading, setIsLoading] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  /* ── Username Debounced Availability Check ── */
  useEffect(() => {
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkUsernameAvailable(cleanUser);
        setUsernameAvailable(isAvail);
      } catch {
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  /* ── Automated Silent Geolocation ── */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (loc) {
            setLocation(loc);
            setLocationStatus('success');
          } else {
            setLocation(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
            setLocationStatus('success');
          }
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setLocationStatus('success');
        }
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 8000, maximumAge: 3_600_000 }
    );
  }, []);

  /* Automatically trigger location detect when arriving at Step 2 */
  useEffect(() => {
    if (step === 2 && locationStatus === 'idle' && (!location || location === 'New York, USA')) {
      detectLocation();
    }
  }, [step, location, locationStatus, detectLocation]);

  /* ── Pre-populate from existing profile or auth user ── */
  useEffect(() => {
    if (currentUser) {
      const defaultName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : '') || 'Athlete';
      setFullName(prev => prev || defaultName);

      const defaultUser = (currentUser.name || currentUser.email?.split('@')[0] || 'athlete')
        .toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 18);
      setUsername(prev => prev || defaultUser);

      setLevel(prev => prev || 'amateur');
      setPrimarySport(prev => prev || 'football');

      getUserProfile(currentUser.id).then(profile => {
        if (!profile) return;
        if (profile.full_name)          setFullName(profile.full_name);
        if (profile.username)           setUsername(profile.username);
        if (profile.role)               setRole(profile.role as UserRole);
        if (profile.location)           setLocation(profile.location);
        if (profile.bio)                setBio(profile.bio);
        if (profile.date_of_birth)      setDateOfBirth(profile.date_of_birth);
        if (profile.sports?.length) {
          setPrimarySport(profile.sports[0]);
          setInterestedSports(profile.sports.slice(1));
        } else if (profile.sport) {
          setPrimarySport(profile.sport);
        }
        if (profile.experience_level)   setLevel(profile.experience_level);
        if (profile.avatar_url)         setPhotoPreview(profile.avatar_url);
      });
    }
  }, [currentUser]);

  /* ── Photo Upload ── */
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setPhotoFile(file);
    setIsUploading(true);
    setUploadProgress(15);

    const reader = new FileReader();
    reader.onload = ev => { setPhotoPreview(ev.target?.result as string); };
    reader.readAsDataURL(file);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + 15));
    }, 100);

    try {
      const uploadRes = await uploadProfilePicture(currentUser.id, file);
      clearInterval(interval);
      setUploadProgress(100);
      if (uploadRes?.fileUrl) {
        setPhotoPreview(uploadRes.fileUrl);
        try { await refreshUser(); } catch {}
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error('[OnboardingPage] Avatar upload error:', err);
    } finally {
      setIsUploading(false);
    }
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

    const finalFullName = fullName.trim() || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : '') || 'Athlete';
    const finalUsername = (username.trim() || (currentUser as any).username || finalFullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 18)).toLowerCase().trim();

    // Validate mandatory profile fields
    const missing: string[] = [];
    if (!finalFullName) missing.push('Full Name');
    if (!finalUsername) missing.push('Username / Handle');
    if (!primarySport) missing.push('Primary Sport');
    if (!dateOfBirth) missing.push('Date of Birth');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingModal(true);
      return;
    }

    // Age validation check (min 13 years old)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 13) {
        toast.error('You must be at least 13 years old to join SPORTiX.');
        setStep(2);
        return;
      }
    }

    setIsLoading(true);

    let uploadedUrl = photoPreview || null;

    if (photoFile) {
      try {
        const uploadRes = await uploadProfilePicture(currentUser.id, photoFile);
        if (uploadRes) {
          uploadedUrl = uploadRes.fileUrl;
        }
      } catch (uploadErr: any) {
        console.warn('[OnboardingPage] Photo upload failed (non-fatal):', uploadErr?.message);
      }
    }

    try {
      // Ensure the profile document exists before updating it
      await ensureUserProfile({
        $id: currentUser.id,
        email: currentUser.email || '',
        name: finalFullName,
      });

      const sanitizedLevel = sanitizeExperienceLevel(level);

      const profilePayload: Record<string, any> = {
        role,
        full_name: finalFullName,
        username: finalUsername,
        location: location.trim(),
        bio: bio.trim(),
        date_of_birth: dateOfBirth || null,
        sport: primarySport,
        sports: [primarySport, ...interestedSports].filter(Boolean),
        experience_level: sanitizedLevel,
        avatar_url: uploadedUrl,
        is_onboarding_complete: true,
      };

      // Save complete profile to Appwrite with fallback retry
      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          currentUser.id,
          profilePayload,
        );
      } catch (writeErr: any) {
        if (writeErr?.message?.includes('date_of_birth') || writeErr?.message?.includes('Unknown attribute')) {
          console.warn('[AUTH TRACE] Retrying update without date_of_birth...');
          delete profilePayload.date_of_birth;
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            currentUser.id,
            profilePayload,
          );
        } else {
          throw writeErr;
        }
      }

      console.log('[AUTH TRACE] Onboarding write SUCCESS — is_onboarding_complete=true');
      try { await refreshUser(); } catch {}

      toast.success('Profile set up! Welcome to SPORTiX ⚡');
      navigate('/app/feed', { replace: true });

    } catch (err: any) {
      console.error('[AUTH TRACE] Onboarding write FAILED:', err?.message, err);
      toast.error(
        err?.message || 'Could not save your profile. Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const levelOptions = ROLE_LEVEL_LABELS[role];

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(204,255,0,0.07) 0%, transparent 60%)' }} />

      <div className="w-full max-w-2xl relative z-10 py-8">
        {/* Top Header with Logo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-volt rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-black" fill="currentColor" />
            </div>
            <span className="font-display text-2xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <div className="text-xs font-mono text-text-muted">
            PlayerDNA Setup
          </div>
        </motion.div>

        {/* Progress bar */}
        <StepBar current={step} />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-volt/10 overflow-hidden"
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
                  Continue to Identity
                </Button>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 1 — IDENTITY (FULL NAME & USERNAME WITH LIVE AVAILABILITY CHECK)
            ══════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(0)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-[28px] text-white tracking-widest">PLAYER IDENTITY</h2>
                  <span className="text-[10px] font-mono text-volt uppercase tracking-wider px-2.5 py-1 rounded-full bg-volt/10 border border-volt/20 flex items-center gap-1">
                    <ShieldCheck size={11} /> Step 2 of 6
                  </span>
                </div>
                <p className="text-text-secondary font-label text-sm mb-6">Choose your display name and claim your unique player handle</p>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Full Name <span className="text-volt">*</span>
                    </label>
                    <div className="relative">
                      <UserCircle2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-[#141416] text-sm text-white placeholder-text-muted outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Username with Live Debounced Availability Check */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Username / Handle <span className="text-volt">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-text-muted">Unique across SPORTiX</span>
                    </div>

                    <div className="relative">
                      <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="alex_morgan"
                        maxLength={24}
                        className={`w-full pl-11 pr-32 py-3 rounded-2xl border bg-[#141416] text-sm text-white placeholder-text-muted outline-none transition-all font-mono ${
                          usernameAvailable === true
                            ? 'border-volt focus:ring-1 focus:ring-volt'
                            : usernameAvailable === false
                            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-white/10 focus:border-volt focus:ring-1 focus:ring-volt'
                        }`}
                        required
                      />

                      {/* Live feedback badge */}
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                        {checkingUsername ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface text-text-muted text-[10px] font-mono">
                            <Loader size={12} className="animate-spin text-volt" />
                            <span>Checking…</span>
                          </div>
                        ) : usernameAvailable === true ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-volt/10 text-volt border border-volt/30 text-[10px] font-mono font-bold uppercase tracking-wide"
                          >
                            <Check size={11} strokeWidth={3} />
                            Available
                          </motion.div>
                        ) : usernameAvailable === false ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold uppercase tracking-wide"
                          >
                            <X size={11} strokeWidth={3} />
                            Taken
                          </motion.div>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-text-muted pl-1">
                      Allowed characters: lowercase letters, numbers, and underscores (min 3 chars).
                    </p>
                  </div>

                  {/* Micro ID Card Pass Live Preview */}
                  {fullName.trim() && username.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-[#101012] border border-volt/20 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-volt/5 blur-2xl pointer-events-none rounded-full" />
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">
                        <span className="flex items-center gap-1 text-volt">
                          <Zap size={11} fill="currentColor" /> SPORTIX ID PASS
                        </span>
                        <span className="capitalize">{role}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-volt/10 border border-volt/30 flex items-center justify-center text-volt font-bold text-sm">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-white">{fullName}</p>
                          <p className="font-mono text-xs text-volt">@{username}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                  <Button
                    fullWidth size="lg"
                    disabled={fullName.trim().length < 2 || username.length < 3 || usernameAvailable === false || checkingUsername}
                    onClick={() => setStep(2)}
                    icon={<ChevronRight size={16} />}
                  >
                    Continue to Details
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 2 — DETAILS (DATE OF BIRTH PICKER + AUTO-LOCATION + LEVEL + BIO)
            ══════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(1)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-[28px] text-white tracking-widest">YOUR DETAILS</h2>
                  <span className="text-[10px] font-mono text-volt uppercase tracking-wider px-2.5 py-1 rounded-full bg-volt/10 border border-volt/20 flex items-center gap-1">
                    <Sparkles size={11} /> Step 3 of 6
                  </span>
                </div>
                <p className="text-text-secondary font-label text-sm mb-6">Select your birth date, location, and athletic experience</p>

                <div className="space-y-6">
                  {/* ── MINIMALIST SIMPLE DATE OF BIRTH PICKER ── */}
                  <div className="space-y-2">
                    <DateOfBirthPicker
                      value={dateOfBirth}
                      onChange={setDateOfBirth}
                    />
                  </div>

                  {/* ── LOCATION WITH SILENT AUTO-GEOLOCATION ── */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <label className="text-xs font-label font-medium text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={13} className="text-volt" />
                        Location
                      </label>
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
                      <MapPin size={15} className={`absolute left-3.5 pointer-events-none z-10 ${locationStatus === 'detecting' ? 'text-volt animate-pulse' : 'text-text-muted'}`} />
                      <input
                        type="text"
                        value={location}
                        onChange={e => { setLocation(e.target.value); setLocationStatus('idle'); }}
                        placeholder="City, Country (e.g. Madrid, Spain)"
                        className="w-full pl-10 pr-28 py-3 rounded-2xl border border-border bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locationStatus === 'detecting'}
                        className="absolute right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-volt/10 hover:bg-volt/20 text-volt text-[11px] font-mono font-bold uppercase tracking-wider transition-all border border-volt/20 disabled:opacity-50"
                      >
                        {locationStatus === 'detecting' ? (
                          <>
                            <Loader size={12} className="animate-spin text-volt" />
                            Detecting
                          </>
                        ) : (
                          <>
                            <LocateFixed size={12} />
                            Auto-Detect
                          </>
                        )}
                      </button>
                    </div>
                    {locationStatus === 'detecting' && (
                      <p className="text-[11px] font-mono text-volt/70 mt-1.5 flex items-center gap-1">
                        <Zap size={11} /> Auto-detecting coordinates via GPS…
                      </p>
                    )}
                  </div>

                  {/* ── PLAYER / EXPERIENCE LEVEL ── */}
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2.5">
                      {role === 'athlete' ? 'Player Level' : role === 'coach' ? 'Coaching Level' : role === 'recruiter' ? 'Scouting Level' : 'Event Scale'}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {levelOptions.map(opt => {
                        const sel = level === opt.id;
                        return (
                          <motion.button
                            key={opt.id} type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setLevel(opt.id)}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all
                              ${sel ? 'border-volt bg-volt/10 shadow-[0_0_15px_rgba(204,255,0,0.12)]' : 'border-border-muted bg-elevated hover:border-volt/25'}`}
                          >
                            <div>
                              <p className={`font-label text-xs font-bold ${sel ? 'text-volt' : 'text-white'}`}>{opt.label}</p>
                              <p className="text-[11px] text-text-secondary mt-0.5">{opt.desc}</p>
                            </div>
                            <SkillBars level={opt.id} selected={sel} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── BIO ── */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-label font-medium text-text-secondary uppercase tracking-widest">
                        Bio / Headline <span className="normal-case text-text-muted">(optional)</span>
                      </label>
                      <span className="text-[11px] font-mono text-text-muted">{bio.length}/200</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      maxLength={200}
                      placeholder="Tell the SPORTiX network about your athletic journey, position, or specialty…"
                      rows={2}
                      className="w-full bg-elevated border border-border rounded-2xl font-mono text-sm text-text-primary placeholder-text-muted px-4 py-3 resize-none outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button
                    fullWidth size="lg"
                    disabled={!dateOfBirth}
                    onClick={() => setStep(3)}
                    icon={<ChevronRight size={16} />}
                  >
                    Continue to Sports
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 3 — SPORTS
            ══════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(2)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
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

                {primarySport && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-volt/5 border border-volt/20 mb-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold text-volt uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} /> Tactical Roles ({primarySport})
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">SPORTiX Dataset</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getSportRolesSync(primarySport).map((r, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono text-white/90 font-medium shadow-sm"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4 text-[10px] text-text-muted font-mono mb-5">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt inline-block" />Primary sport (tap first)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-volt/20 border border-volt/40 inline-block" />Interested (up to 4)</span>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                  <Button fullWidth size="lg" disabled={!primarySport} onClick={() => setStep(4)} icon={<ChevronRight size={16} />}>
                    Continue ({interestedSports.length + (primarySport ? 1 : 0)} selected)
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 4 — PROFILE PHOTO
            ══════════════════════════════════ */}
            {step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(3)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
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
                  <Button variant="ghost" onClick={() => setStep(5)}>Skip</Button>
                  <Button fullWidth size="lg" onClick={() => setStep(5)} disabled={isUploading} icon={<ChevronRight size={16} />}>
                    Continue to Connect
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════
                STEP 5 — NEARBY PLAYERS & COMPLETE
            ══════════════════════════════════ */}
            {step === 5 && (
              <motion.div key="s5"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                className="p-6 sm:p-8"
              >
                <button onClick={() => setStep(4)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1 transition-colors">← Back</button>
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

      <MissingFieldsModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        missingFields={missingFields}
      />
    </div>
  );
};
