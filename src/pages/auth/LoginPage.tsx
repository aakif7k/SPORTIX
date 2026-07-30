import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, AlertTriangle, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [noAccount, setNoAccount]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setNoAccount(false);
    try {
      await login(email, password);
      toast.success('Welcome back to SPORTiX! ⚡');
      navigate('/app/feed');
    } catch (err: any) {
      const raw: string = err?.message || '';
      const isNotFound =
        raw.toLowerCase().includes('user_not_found') ||
        raw.toLowerCase().includes('invalid credentials') ||
        (raw.toLowerCase().includes('not found') &&
         (raw.toLowerCase().includes('user') || raw.toLowerCase().includes('account')));
      if (isNotFound) {
        setNoAccount(true);
      } else {
        setError(err.message || 'Login failed. Check your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { loginWithGoogle } = await import('@/lib/authService');
      loginWithGoogle();
    } catch {
      setError('Google sign-in unavailable');
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Grids & Orbs */}
      <div className="absolute inset-0 bg-grid-sm opacity-20 pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.12) 0%, transparent 70%)' }} 
      />
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(204,255,0,0.06) 0%, transparent 70%)' }} 
      />

      {/* Floating Glass Accent Orbs */}
      <motion.div
        animate={{ y: [-15, 15, -15], scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 left-12 w-72 h-72 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.15) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [15, -15, 15], scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-12 right-12 w-96 h-96 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Main Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-[#101010]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Top Subtle Border Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-80" />

          {/* Header & Logo */}
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
              Elite Sports Intelligence & Performance Platform
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="athlete@sportix.io"
                  autoComplete="email"
                  required
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-text-secondary uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-mono text-[#CCFF00] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#181818] border border-white/10 rounded-2xl focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] text-white text-sm outline-none transition-all placeholder:text-text-muted font-mono"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Account Not Found Alert */}
            {noAccount && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase">
                  <AlertTriangle size={16} />
                  <span>No Account Found</span>
                </div>
                <p className="text-xs text-red-200">
                  No registered profile found for this email address. Please sign up to create your account.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="w-full mt-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  Go to Sign Up <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* General Error Alert */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-xs font-mono">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(204,255,0,0.3)] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Zap size={18} className="fill-black" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6 gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google Sign-in Button */}
          <motion.button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-[#181818] hover:bg-[#222222] border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-white text-xs font-mono font-bold uppercase tracking-wider group-hover:text-[#CCFF00] transition-colors">
              Continue with Google
            </span>
          </motion.button>

          {/* Footer Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs font-mono text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#CCFF00] font-bold hover:underline ml-1">
                Sign Up for SPORTiX
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-text-muted">
          <ShieldCheck size={14} className="text-[#CCFF00]" />
          <span className="text-[10px] font-mono tracking-widest uppercase">
            Secured by Appwrite Cloud Authentication
          </span>
        </div>
      </div>
    </div>
  );
};