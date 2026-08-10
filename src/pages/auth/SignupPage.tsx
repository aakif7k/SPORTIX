import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, UserCircle2, AtSign, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { registerUser, loginWithGoogle, getAuthErrorMessage } from '@/lib/authService';
import { useAuth } from '@/context/AuthContext';
import { MissingFieldsModal } from '../../components/ui/MissingFieldsModal';
import toast from 'react-hot-toast';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const missing: string[] = [];
    if (!fullName.trim()) missing.push('Full Name');
    if (!email.trim()) missing.push('Email Address');
    if (!password.trim()) missing.push('Password');
    if (!confirmPassword.trim()) missing.push('Confirm Password');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const generatedUsername = username.trim()
        ? username.toLowerCase().trim()
        : fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

      await registerUser({
        fullName: fullName.trim(),
        username: generatedUsername,
        email: email.trim(),
        password,
        role: 'athlete',
        sport: '',
        sports: [],
        experienceLevel: 'amateur',
        location: '',
      });

      try {
        await refreshUser();
      } catch {}

      toast.success("Account created! Let's set up your PlayerDNA ⚡");
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      loginWithGoogle();
    } catch (err) {
      setError('Google sign-in is currently unavailable.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid-sm opacity-20 pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.12) 0%, transparent 70%)' }} 
      />

      <div className="w-full max-w-md relative z-10 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-[#101010]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-80" />

          {/* Header */}
          <div className="text-center mb-8">
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
              Join the Next-Gen Sports Intelligence Community
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 font-mono"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                Full Name <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="Alex Morgan"
                  required
                />
                <UserCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Username (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">Username <span className="text-text-muted font-normal">(Optional)</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="alex_morgan"
                />
                <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="athlete@sportix.io"
                  required
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="Min. 8 characters"
                  required
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">
                Confirm Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="Re-enter password"
                  required
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#CCFF00] text-black font-mono font-bold text-sm rounded-2xl hover:bg-[#b8e600] transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] flex items-center justify-center gap-2 uppercase tracking-wider mt-6 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
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
            Google
          </button>

          {/* Login Link */}
          <p className="text-center text-xs font-mono text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#CCFF00] font-bold hover:underline">
              Log In
            </Link>
          </p>
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
