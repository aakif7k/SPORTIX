import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Dumbbell, Briefcase, Award, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';

const ROLES: { id: UserRole; icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'athlete', icon: Dumbbell, title: 'Athlete', desc: 'Compete, get discovered, build your legacy' },
  { id: 'recruiter', icon: Briefcase, title: 'Recruiter', desc: 'Scout elite talent across 20+ sports' },
  { id: 'coach', icon: Award, title: 'Coach', desc: 'Manage athletes, track performance' },
  { id: 'organizer', icon: CalendarDays, title: 'Organizer', desc: 'Create & manage world-class events' },
];

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    await signup(email, password, name, selectedRole);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(204,255,0,0.04) 0%, transparent 60%)' }} />
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-volt rounded-xl flex items-center justify-center shadow-glow-volt"><Zap size={22} className="text-black" fill="black" /></div>
            <span className="font-display text-3xl text-volt tracking-widest">SPORTIX</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-8 border border-volt/10">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-3xl text-white mb-1 tracking-wide">JOIN SPORTIX</h1>
                <p className="text-text-secondary font-label text-sm mb-6">Choose your role to get started</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ROLES.map(({ id, icon: Icon, title, desc }) => (
                    <motion.button
                      key={id} type="button"
                      whileHover={{ scale: 1.02, borderColor: 'rgba(204,255,0,0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${selectedRole === id ? 'border-volt bg-volt/10 shadow-glow-volt-sm' : 'border-border-muted bg-elevated hover:border-volt/30'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${selectedRole === id ? 'bg-volt text-black' : 'bg-surface text-text-secondary'}`}>
                        <Icon size={16} />
                      </div>
                      <p className={`font-label text-sm font-semibold ${selectedRole === id ? 'text-volt' : 'text-white'}`}>{title}</p>
                      <p className="font-label text-xs text-text-secondary mt-0.5">{desc}</p>
                    </motion.button>
                  ))}
                </div>
                <Button fullWidth disabled={!selectedRole} onClick={() => setStep(2)} size="lg">
                  Continue →
                </Button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep(1)} className="text-xs text-text-secondary hover:text-volt font-label mb-4 flex items-center gap-1">← Back</button>
                <h1 className="font-display text-3xl text-white mb-1 tracking-wide">CREATE ACCOUNT</h1>
                <p className="text-text-secondary font-label text-sm mb-6">
                  Joining as{' '}
                  <span className="text-volt capitalize">{selectedRole}</span>
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Marcus Thielemann" required />
                  <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="athlete@example.com" required />
                  <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required />
                  <Button type="submit" fullWidth loading={isLoading} size="lg" icon={<Zap size={16} fill="black" />}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-center text-sm text-text-secondary font-label mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-volt hover:underline font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
