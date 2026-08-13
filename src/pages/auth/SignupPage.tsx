import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  ArrowRight, ArrowLeft, MapPin, Trophy, FileText,
  CheckCircle2, LocateFixed, Loader,
} from 'lucide-react';
import { registerUser, loginWithGoogle, getAuthErrorMessage } from '@/lib/authService';
import { useAuth } from '@/context/AuthContext';
import { DateOfBirthPicker } from '../../components/ui/DateOfBirthPicker';
import toast from 'react-hot-toast';

// ─── Experience levels matching Appwrite enum ─────────────────────────────────
const PLAYER_LEVELS = [
  { value: 'beginner',  label: 'Beginner',  desc: 'Just starting out'      },
  { value: 'amateur',   label: 'Amateur',   desc: 'Plays recreationally'    },
  { value: 'semi_pro',  label: 'Semi-Pro',  desc: 'Competitive player'      },
  { value: 'pro',       label: 'Pro',       desc: 'Professional athlete'    },
  { value: 'elite',     label: 'Elite',     desc: 'Top-tier competitor'     },
];

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

// ─── Silently try browser geolocation (no blocking modal) ────────────────────
function useAutoLocation(onResult: (loc: string) => void) {
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'detecting' | 'success' | 'denied'
  >('idle');

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (loc) {
            onResult(loc);
            setLocationStatus('success');
          } else {
            setLocationStatus('denied');
          }
        } catch {
          setLocationStatus('denied');
        }
      },
      () => setLocationStatus('denied'),
      { timeout: 8000, maximumAge: 3_600_000 },
    );
  }, [onResult]);

  return { locationStatus, detect };
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {[1, 2].map((s) => (
        <motion.div
          key={s}
          animate={{
            width:      s === step ? 24 : 8,
            background: s <= step ? '#CCFF00' : '#2A2A2A',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ height: 8, borderRadius: 999 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [dateOfBirth,  setDateOfBirth]  = useState('');
  const [location,     setLocation]     = useState('');
  const [playerLevel,  setPlayerLevel]  = useState('amateur');
  const [bio,          setBio]          = useState('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [step,        setStep]        = useState<1 | 2>(1);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  // ── Auto-location hook ────────────────────────────────────────────────────
  const { locationStatus, detect: detectLocation } = useAutoLocation(setLocation);

  // Trigger geolocation silently when user arrives at step 2
  useEffect(() => {
    if (step === 2 && locationStatus === 'idle') {
      detectLocation();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1 → Step 2 validation ────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim())    { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setStep(2);
  };

  // ── Final submit (Step 2) ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dateOfBirth) { setError('Please enter your date of birth.'); return; }

    // Age check — must be at least 13
    const dob = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 13) { setError('You must be at least 13 years old to join SPORTiX.'); return; }

    setIsLoading(true);
    try {
      // Auto-generate username from full name + 3-digit random
      const generatedUsername =
        fullName.toLowerCase().replace(/[^a-z0-9]/g, '') +
        Math.floor(100 + Math.random() * 900);

      await registerUser({
        fullName:        fullName.trim(),
        username:        generatedUsername,
        email:           email.trim().toLowerCase(),
        password,
        role:            'athlete',
        sport:           'Multi-Sport',
        sports:          [],
        experienceLevel: playerLevel,
        location:        location.trim(),
        bio:             bio.trim(),
        dateOfBirth:     dateOfBirth,
      });

      try { await refreshUser(); } catch { /* non-critical */ }

      toast.success("Account created! Let's set up your PlayerDNA ⚡");
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try { loginWithGoogle(); } catch { setError('Google sign-in is currently unavailable.'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-sm opacity-20 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.12) 0%, transparent 70%)' }}
      />

      <div className={`w-full ${step === 2 ? 'max-w-xl' : 'max-w-md'} transition-all duration-300 relative z-10 py-6`}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-[#101010]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-80" />

          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 group mb-2">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 text-black bg-[#CCFF00] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)]"
              >
                <Zap size={24} className="fill-black" />
              </motion.div>
              <h1 className="font-display text-4xl font-black text-white tracking-widest">
                SPORT<span className="text-[#CCFF00]">iX</span>
              </h1>
            </Link>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest">
              {step === 1 ? 'Create your account' : 'Your details'}
            </p>
          </div>

          {/* Step dots */}
          <StepDots step={step} />

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 font-mono overflow-hidden"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STEP 1: Account Setup ─────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
                onSubmit={handleStep1}
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                    Full Name <span className="text-[#CCFF00] font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                    Email Address <span className="text-[#CCFF00] font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                      placeholder="athlete@sportix.io"
                      autoComplete="email"
                      required
                    />
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                    Password <span className="text-[#CCFF00] font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full pl-11 pr-11 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map(i => {
                        const score = [
                          password.length >= 8,
                          /[A-Z]/.test(password),
                          /[0-9]/.test(password),
                          /[^a-zA-Z0-9]/.test(password),
                        ].filter(Boolean).length;
                        return (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: i <= score
                                ? score <= 1 ? '#F87171'
                                : score <= 2 ? '#FBBF24'
                                : '#CCFF00'
                                : '#2A2A2A',
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                    Confirm Password <span className="text-[#CCFF00] font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      className="w-full pl-11 pr-11 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                    />
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(c => !c)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {/* Match indicator */}
                    {confirmPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-11 top-1/2 -translate-y-1/2 mr-2"
                      >
                        {password === confirmPassword
                          ? <CheckCircle2 size={16} className="text-[#CCFF00]" />
                          : <AlertCircle size={16} className="text-red-400" />
                        }
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Next button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-3.5 bg-[#CCFF00] text-black font-mono font-bold text-sm rounded-2xl hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] flex items-center justify-center gap-2 uppercase tracking-wider mt-2"
                >
                  Continue
                  <ArrowRight size={18} />
                </motion.button>

                {/* Divider */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-4 bg-[#101010] text-[11px] font-mono text-text-muted uppercase">
                    Or continue with
                  </span>
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full py-3 bg-[#181818] border border-white/10 hover:border-white/20 rounded-2xl text-white font-mono text-xs font-semibold flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-1.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Login link */}
                <p className="text-center text-xs font-mono text-text-muted mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#CCFF00] font-bold hover:underline">
                    Log In
                  </Link>
                </p>
              </motion.form>
            )}

            {/* ── STEP 2: YOUR DETAILS ──────────────────────────────────────── */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                onSubmit={handleSubmit}
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-white transition-colors mb-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {/* Date of Birth — Minimalist Simple Selector */}
                <div className="space-y-1.5">
                  <DateOfBirthPicker
                    value={dateOfBirth}
                    onChange={v => { setDateOfBirth(v); setError(''); }}
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#CCFF00]" />
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full pl-4 pr-12 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                    />
                    {/* Auto-location button */}
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locationStatus === 'detecting'}
                      title={locationStatus === 'denied' ? 'Permission denied — type manually' : 'Detect my location'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-text-muted hover:text-[#CCFF00] transition-colors disabled:opacity-40"
                    >
                      {locationStatus === 'detecting' ? (
                        <Loader size={16} className="animate-spin text-[#CCFF00]" />
                      ) : locationStatus === 'success' ? (
                        <CheckCircle2 size={16} className="text-[#CCFF00]" />
                      ) : (
                        <LocateFixed size={16} />
                      )}
                    </button>
                  </div>
                  {locationStatus === 'detecting' && (
                    <p className="text-[11px] font-mono text-[#CCFF00]/70 mt-1">Detecting your location…</p>
                  )}
                  {locationStatus === 'denied' && !location && (
                    <p className="text-[11px] font-mono text-text-muted mt-1">Location unavailable — type it manually</p>
                  )}
                </div>

                {/* Player Level */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={13} className="text-[#CCFF00]" />
                    Player Level
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PLAYER_LEVELS.map((lvl) => (
                      <motion.button
                        key={lvl.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlayerLevel(lvl.value)}
                        className="relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl border transition-all text-center"
                        style={{
                          background:   playerLevel === lvl.value ? 'rgba(204,255,0,0.1)' : '#181818',
                          borderColor:  playerLevel === lvl.value ? '#CCFF00'             : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-[10px] font-mono font-bold text-white leading-none">
                          {lvl.label}
                        </span>
                        {playerLevel === lvl.value && (
                          <motion.div
                            layoutId="levelIndicator"
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#CCFF00] rounded-full"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[11px] font-mono text-text-muted">
                    {PLAYER_LEVELS.find(l => l.value === playerLevel)?.desc}
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-[#CCFF00]" />
                    Bio <span className="text-text-muted font-normal ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    maxLength={200}
                    placeholder="Tell the SPORTiX community about yourself…"
                    className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono resize-none"
                  />
                  <p className="text-right text-[11px] font-mono text-text-muted">{bio.length}/200</p>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#CCFF00] text-black font-mono font-bold text-sm rounded-2xl hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Creating Account…</>
                  ) : (
                    <><Zap size={18} className="fill-black" /> Create My Account</>
                  )}
                </motion.button>

                <p className="text-center text-[11px] font-mono text-text-muted mt-3">
                  By joining you agree to SPORTiX's{' '}
                  <span className="text-[#CCFF00]/70 cursor-pointer hover:text-[#CCFF00]">Terms</span> and{' '}
                  <span className="text-[#CCFF00]/70 cursor-pointer hover:text-[#CCFF00]">Privacy Policy</span>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
