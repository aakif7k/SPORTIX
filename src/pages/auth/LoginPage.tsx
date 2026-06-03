import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/app/feed');
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative">
      <div className="absolute inset-0 bg-gradient-radial from-volt/3 via-transparent to-transparent pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(204,255,0,0.04) 0%, transparent 60%)' }} />
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <motion.div whileHover={{ rotate: 5, scale: 1.05 }} className="w-10 h-10 rounded-xl overflow-hidden shadow-glow-volt">
              <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
            </motion.div>
            <span className="font-display text-3xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <p className="font-label text-text-secondary text-sm mt-2">Mission Control for Elite Athletes</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border border-volt/10">
          <h1 className="font-display text-3xl text-white mb-1 tracking-wide">SIGN IN</h1>
          <p className="text-text-secondary font-label text-sm mb-6">Access your performance dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="athlete@example.com" icon={<Mail size={15} />} required
            />
            <Input
              label="Password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              icon={<Lock size={15} />}
              rightIcon={<button type="button" onClick={() => setShowPassword(s => !s)} className="hover:text-volt transition-colors">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
              required
            />
            {error && <p className="text-xs text-hot font-label bg-hot/10 border border-hot/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-text-secondary hover:text-volt font-label transition-colors">Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth loading={isLoading} size="lg" icon={<Zap size={16} fill="black" />}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border-muted" />
              <span className="text-xs text-text-muted font-mono">OR</span>
              <div className="flex-1 h-px bg-border-muted" />
            </div>

            <Button
              type="button" variant="ghost" fullWidth size="md" icon={<Globe size={16} />}
              onClick={async () => { await login('demo@sportix.io', 'demo'); navigate('/app/feed'); }}
            >
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary font-label mt-6">
            No account?{' '}
            <Link to="/signup" className="text-volt hover:underline font-medium">Join SportiX</Link>
          </p>
        </motion.div>

        <p className="text-center text-xs text-text-muted font-mono mt-6">
          &gt; Demo: click "Continue with Google" to skip auth
        </p>
      </div>
    </div>
  );
};
