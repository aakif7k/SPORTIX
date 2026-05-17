import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, ArrowRight, ChevronDown, Users, Calendar, Brain, Trophy, TrendingUp, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// ─── PARTICLE CANVAS ───────────────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize();
    window.addEventListener('resize', setSize);
    const VOLT = '#CCFF00';
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.6 + 0.1,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = VOLT;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      // draw connections
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = VOLT;
            ctx.globalAlpha = (1 - dist / 100) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', setSize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// ─── BENTO FEATURES ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Users, title: 'Elite Networking', desc: 'Connect with 50,000+ professional athletes, coaches, and recruiters across 20+ sports worldwide.', size: 'md', accent: '#CCFF00' },
  { icon: Brain, title: 'AI Team Builder', desc: 'Gemini-powered AI analyzes hundreds of athletes to build the perfect team for any event.', size: 'lg', accent: '#CCFF00' },
  { icon: Calendar, title: 'Event Management', desc: 'Create, manage, and coordinate tournaments with AI-generated brackets and real-time scheduling.', size: 'md', accent: '#FF3B00' },
  { icon: TrendingUp, title: 'Performance Analytics', desc: 'Live telemetry dashboards for tracking your athletic metrics with radar charts and trend analysis.', size: 'sm', accent: '#a855f7' },
  { icon: Trophy, title: 'Achievement System', desc: 'Earn rare badges and track your career milestones across competitions.', size: 'sm', accent: '#f97316' },
  { icon: Shield, title: 'Recruiter Access', desc: 'Get discovered by top-tier clubs, agencies, and scouts with your verified athlete profile.', size: 'md', accent: '#06b6d4' },
];

const STATS_DATA = [
  { value: '50K+', label: 'Athletes' }, { value: '120+', label: 'Countries' },
  { value: '8.2K', label: 'Events Hosted' }, { value: '94%', label: 'Match Accuracy' },
];

// ─── LANDING PAGE ─────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(8,8,8,0)', 'rgba(8,8,8,0.9)']);
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);

  return (
    <div className="min-h-screen bg-base text-white overflow-x-hidden">
      {/* Sticky Transparent Nav */}
      <motion.nav style={{ backgroundColor: navBg }} className="fixed top-0 inset-x-0 z-50 backdrop-blur-sm border-b border-transparent transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-volt rounded-lg flex items-center justify-center"><Zap size={16} className="text-black" fill="black" /></div>
            <span className="font-display text-2xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-label text-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Platform</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Join SportiX</Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden scanline-overlay noise-overlay">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-base/20 via-base/60 to-base pointer-events-none" />
        <motion.div style={{ y: heroY }} className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-volt/20 text-volt text-xs font-label font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-volt animate-blink-dot" /> NOW IN OPEN BETA — 50,000+ ATHLETES
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
            className="font-display text-[clamp(4rem,12vw,9rem)] leading-none text-white mb-6 tracking-tight"
          >
            BUILT FOR<br />
            <span className="text-volt" style={{ textShadow: '0 0 60px rgba(204,255,0,0.3)' }}>ATHLETES</span><br />
            WHO <span className="relative">
              DOMINATE
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-volt rounded-full origin-left"
                style={{ boxShadow: '0 0 15px rgba(204,255,0,0.6)' }}
              />
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
            className="font-label text-lg text-text-secondary max-w-2xl mx-auto mb-10"
          >
            The next-generation sports platform where elite athletes network, AI builds your perfect team, and every event feels like mission control.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" onClick={() => navigate('/signup')} icon={<Zap size={18} fill="black" />}>
              Join SportiX — It's Free
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/login')} icon={<ArrowRight size={18} />}>
              Explore Platform
            </Button>
          </motion.div>
        </motion.div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary">
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="py-12 bg-surface border-y border-border-muted">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS_DATA.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="font-display text-5xl text-volt" style={{ textShadow: '0 0 30px rgba(204,255,0,0.2)' }}>{stat.value}</div>
              <div className="stat-label mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="font-display text-6xl md:text-8xl text-white mb-4 tracking-tight">
            MISSION <span className="text-volt">CONTROL</span><br />FOR ELITE SPORTS
          </h2>
          <p className="text-text-secondary font-label text-lg max-w-xl mx-auto">Every tool you need. Precision-engineered. AI-enhanced.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: `0 0 30px ${f.accent}20` }}
              className={`glass rounded-2xl p-6 border border-border-muted hover:border-opacity-40 transition-all duration-300 ${i === 1 ? 'md:row-span-2' : ''}`}
              style={{ '--accent': f.accent } as React.CSSProperties}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}>
                <f.icon size={20} style={{ color: f.accent }} />
              </div>
              <h3 className="font-display text-2xl text-white mb-2 tracking-wide">{f.title}</h3>
              <p className="font-label text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              {i === 1 && (
                <div className="mt-6 p-4 bg-base/80 rounded-xl border border-volt/10 font-mono text-xs text-volt space-y-1">
                  <div>&gt; Scanning 847 athletes...</div>
                  <div>&gt; Running position-fit algorithm...</div>
                  <div>&gt; Compatibility: 94%</div>
                  <div className="text-white">&gt; <span className="animate-pulse">Team assembled ✓</span></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-volt/3 pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 className="font-display text-6xl md:text-8xl text-white mb-6">YOUR NEXT<br /><span className="text-volt">LEVEL</span> AWAITS</h2>
          <p className="text-text-secondary font-label text-lg mb-10 max-w-lg mx-auto">Join 50,000+ athletes already training smarter, competing harder, and connecting deeper.</p>
          <Button size="lg" onClick={() => navigate('/signup')} icon={<Zap size={20} fill="black" />}>
            Start For Free — No Credit Card
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-muted py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-volt rounded flex items-center justify-center"><Zap size={12} className="text-black" fill="black" /></div>
            <span className="font-display text-lg text-volt tracking-widest">SPORTIX</span>
          </div>
          <p className="font-mono text-xs text-text-muted">© 2025 SportiX Platform. Built for athletes who dominate.</p>
        </div>
      </footer>
    </div>
  );
};
