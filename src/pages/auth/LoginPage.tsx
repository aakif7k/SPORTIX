import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { loginUser, loginWithGoogle, getAuthErrorMessage } from '@/lib/authService';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginUser(email, password);
      toast.success('Welcome back to SPORTiX! ⚡');
      navigate('/home');
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Supabase OAuth redirects — no need to navigate manually
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-sm opacity-30 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.08) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(204,255,0,0.04) 0%, transparent 70%)' }} />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [10, -10, 10], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.04) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="w-11 h-11 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
            </motion.div>
            <span className="font-display text-4xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <p className="text-text-muted font-mono text-xs mt-2 tracking-widest uppercase">Mission Control for Elite Athletes</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative">
          {/* Glow border effect */}
          <div className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(204,255,0,0.15) 0%, transparent 50%, rgba(204,255,0,0.08) 100%)' }} />

          <div className="relative glass rounded-2xl p-8 border border-white/5 backdrop-blur-xl">
            <div className="mb-6">
              <h1 className="font-display text-4xl text-white tracking-widest mb-1">SIGN IN</h1>
              <p className="text-text-secondary font-mono text-xs tracking-wider">ACCESS YOUR PERFORMANCE DASHBOARD</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">Email Address</label>
                <div className="relative group">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-volt transition-colors" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="athlete@example.com" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-elevated border border-border text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-volt transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-elevated border border-border text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)] transition-all font-mono"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-volt transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 font-mono bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2">
                  ⚠ {error}
                </motion.p>
              )}

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-[11px] text-text-muted hover:text-volt font-mono transition-colors tracking-wider">
                  FORGOT PASSWORD?
                </Link>
              </div>

              {/* Submit */}
              <Button type="submit" fullWidth loading={isLoading} disabled={isLoading || googleLoading} size="lg"
                icon={<Zap size={16} fill="currentColor" />}>
                {isLoading ? 'Authenticating…' : 'Sign In'}
              </Button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border-muted" />
                <span className="text-[10px] text-text-muted font-mono tracking-widest">OR</span>
                <div className="flex-1 h-px bg-border-muted" />
              </div>

              {/* Google */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={isLoading || googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-elevated hover:border-volt/30 hover:bg-elevated/80 transition-all font-label text-sm text-text-primary font-medium disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-volt border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </motion.button>
            </form>

            <p className="text-center text-sm text-text-secondary font-label mt-6">
              No account?{' '}
              <Link to="/signup" className="text-volt hover:underline font-semibold">Join SPORTiX</Link>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-text-muted font-mono mt-6 tracking-widest">
          SECURED BY SUPABASE AUTH
        </p>
      </div>
    </div>
  );
};
