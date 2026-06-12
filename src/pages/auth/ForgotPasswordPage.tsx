import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword, getAuthErrorMessage } from '@/lib/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(204,255,0,0.04) 0%, transparent 60%)' }} />
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-glow-volt">
              <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-3xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <p className="font-label text-text-secondary text-sm mt-2">Mission Control for Elite Athletes</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border border-volt/10">
          
          {sent ? (
            <div className="text-center space-y-4 font-mono">
              <h1 className="font-display text-2xl text-white tracking-wide">CHECK YOUR EMAIL</h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                We sent a password reset link to <strong className="text-volt">{email}</strong>. Please check your inbox (and spam folder) to reset your password.
              </p>
              <div className="pt-4">
                <Button fullWidth onClick={() => navigate('/login')} size="md" icon={<ArrowLeft size={14} />}>
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-white mb-1 tracking-wide">RESET PASSWORD</h1>
              <p className="text-text-secondary font-label text-sm mb-6">Enter your email to receive a reset link</p>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  icon={<Mail size={15} />}
                  required
                />

                <Button type="submit" fullWidth loading={isLoading} size="lg" icon={<Zap size={16} fill="black" />}>
                  {isLoading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="text-center text-sm text-text-secondary font-label mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-volt hover:underline font-medium">Sign In</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
