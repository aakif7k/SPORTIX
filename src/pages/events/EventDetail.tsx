import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, MapPin, Users, Zap, MessageSquare, Bell, BellOff,
  Trophy, Activity, Cpu, Clock, Star, ArrowRight, UserPlus,
  Shield, BarChart3, CheckCircle2, Swords, Timer,
  Hash, Share2, Settings
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { SPORT_CATEGORIES, MOCK_USERS } from '../../services/mockData';
import { generateBracket } from '../../services/aiService';
import type { BracketRound } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import { EventJoinModal } from './EventJoinModal';

// ─── Particle canvas background ──────────────────────────────────────────────
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const isLight = document.documentElement.classList.contains('light');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        size: Math.random() * 1.5 + 0.5,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(45,122,31,${p.alpha * 0.5})`
          : `rgba(204,255,0,${p.alpha})`;
        ctx.fill();
      });
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight
              ? `rgba(45,122,31,${(1 - dist / 80) * 0.12})`
              : `rgba(204,255,0,${(1 - dist / 80) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// ─── Animated count-up number ────────────────────────────────────────────────
const CountUp: React.FC<{ to: number; suffix?: string; duration?: number }> = ({ to, suffix = '', duration = 1200 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [to, duration]);
  return <>{val}{suffix}</>;
};

// ─── Bracket view ────────────────────────────────────────────────────────────
const BracketView: React.FC<{ rounds: BracketRound[] }> = ({ rounds }) => (
  <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
    <div className="flex gap-6 min-w-max p-3">
      {rounds.map(round => (
        <div key={round.round} className="flex flex-col gap-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-center mb-1"
            style={{ color: 'var(--text-muted)' }}>{round.name}</p>
          <div className="flex flex-col gap-5 justify-around h-full">
            {round.matches.map(match => (
              <motion.div key={match.id} whileHover={{ scale: 1.03 }}
                className="rounded-2xl p-3 w-44 cursor-default premium-card">
                {[match.team1, match.team2].map((team, i) => (
                  <div key={i} className={`flex items-center gap-2 py-1.5 ${i === 0 ? 'border-b' : ''}`}
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-mono font-bold"
                      style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)' }}>{i + 1}</div>
                    <span className="font-mono text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {team?.slice(0, 12) || 'TBD'}
                    </span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Mock data ────────────────────────────────────────────────────────────────
const LIVE_ACTIVITIES = [
  { id: 1, user: 'Marcus Reid',   action: 'joined via AI AutoSquad', time: '2m',  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',  color: '#CCFF00' },
  { id: 2, user: 'Priya Nair',    action: 'joined with Iron Pulse FC', time: '5m', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',   color: '#00D4FF' },
  { id: 3, user: 'Devon Clarke',  action: 'opened a discussion', time: '12m',      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',   color: '#BF5FFF' },
  { id: 4, user: 'Aisha Mensah',  action: 'joined with crew', time: '18m',         avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80',   color: '#FF6B35' },
  { id: 5, user: 'Zaid Al-Hassan','action': 'registered a team', time: '31m',      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',   color: '#CCFF00' },
];

const MATCH_SCHEDULE = [
  { id: 'm1', label: 'Opening Match', time: '10:00 AM', teams: ['Team Alpha', 'Beta Squad'], status: 'upcoming' },
  { id: 'm2', label: 'Group Stage A', time: '12:30 PM', teams: ['Iron Pulse FC', 'Neon Falcons'], status: 'upcoming' },
  { id: 'm3', label: 'Group Stage B', time: '02:00 PM', teams: ['Red Wolves', 'Cyber Strikers'], status: 'upcoming' },
  { id: 'm4', label: 'Semifinals',    time: '04:30 PM', teams: ['TBD', 'TBD'], status: 'tbd' },
  { id: 'm5', label: 'Grand Final',   time: '06:00 PM', teams: ['TBD', 'TBD'], status: 'tbd' },
];

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as any } } };

// ─── Event Detail ─────────────────────────────────────────────────────────────
export const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events } = useEventStore();
  const { user } = useAuthStore();
  const { nearbyRadius } = useAISettingsStore();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);
  const heroOpacity = useTransform(scrollY, [0, 250], [1, 0]);

  const [reminder, setReminder]       = useState(false);
  const [bracket, setBracket]         = useState<BracketRound[]>([]);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joined, setJoined]           = useState(false);
  const [activeTab, setActiveTab]     = useState<'overview' | 'schedule' | 'participants' | 'bracket'>('overview');
  const [shared, setShared]           = useState(false);

  const event    = events.find(e => e.id === id) || events[0];
  const isOrganizer = event?.organizerId === (user?.id || 'cu1');
  const sportData = SPORT_CATEGORIES.find(s => s.id === event?.sport);
  const pctFull  = event ? Math.round((event.participants.length / event.maxParticipants) * 100) : 0;

  useEffect(() => {
    if (event) {
      const b = generateBracket(event.participants.length > 0
        ? event.participants
        : ['P1','P2','P3','P4','P5','P6','P7','P8']);
      setBracket(b);
    }
  }, [event?.id]);

  if (!event) return null;

  const TABS = [
    { id: 'overview',     label: 'Overview',      icon: <Hash size={11} /> },
    { id: 'schedule',     label: 'Schedule',       icon: <Timer size={11} /> },
    { id: 'participants', label: 'Athletes',        icon: <Users size={11} /> },
    { id: 'bracket',     label: 'Bracket',         icon: <Trophy size={11} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-28" style={{ color: 'var(--text-primary)' }}>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION — cinematic parallax banner
      ══════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative rounded-[28px] overflow-hidden mb-6" style={{ minHeight: 300 }}>
        {/* Parallax image */}
        <motion.div className="absolute inset-0 rounded-[28px]" style={{ y: heroY, willChange: 'transform' }}>
          {event.bannerImage
            ? <img src={event.bannerImage} alt={event.title}
                className="w-full h-full object-cover rounded-[28px]"
                style={{ 
                  minHeight: 300, 
                  objectPosition: event.bannerAlignment === 'top' 
                    ? 'center 20%' 
                    : event.bannerAlignment === 'bottom' 
                    ? 'center 80%' 
                    : 'center 50%' 
                }} />
            : <div className="w-full h-full min-h-[300px] rounded-[28px]"
                style={{ background: 'linear-gradient(135deg, var(--volt-dim) 0%, var(--bg-elevated) 60%, var(--bg-base) 100%)' }} />
          }
        </motion.div>

        {/* Particle field */}
        <div className="absolute inset-0 rounded-[28px] overflow-hidden z-[1]">
          <ParticleField />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[2] rounded-[28px]" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)'
        }} />
        {/* Scanline texture */}
        <div className="absolute inset-0 z-[3] pointer-events-none rounded-[28px]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)'
        }} />

        {/* Hero Content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-[4] p-6 md:p-8 flex flex-col justify-between min-h-[300px]">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sport tag */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold backdrop-blur-md"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}>
                <span className="text-[14px]">{sportData?.emoji}</span>
                {event.sport.toUpperCase()}
              </motion.div>
              {event.status === 'live' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold backdrop-blur-md"
                  style={{ background: 'rgba(255,59,0,0.35)', border: '1px solid rgba(255,59,0,0.5)', color: '#fff' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE NOW
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold backdrop-blur-md"
                style={{ background: 'rgba(204,255,0,0.2)', border: '1px solid rgba(204,255,0,0.4)', color: '#CCFF00' }}>
                AI POWERED
              </motion.div>
            </div>
            {/* Action buttons top-right */}
            <div className="flex items-center gap-2">
              {isOrganizer && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/app/events/${event.id}/manage`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold backdrop-blur-md transition-all hover:opacity-90"
                  style={{ background: 'rgba(204,255,0,0.2)', border: '1px solid rgba(204,255,0,0.4)', color: '#CCFF00' }}>
                  <Settings size={12} />
                  MANAGE CLASH
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                style={{ background: shared ? 'rgba(204,255,0,0.3)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {shared ? <CheckCircle2 size={15} color="#CCFF00" /> : <Share2 size={15} color="white" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setReminder(r => !r)}
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                style={{
                  background: reminder ? 'rgba(204,255,0,0.25)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${reminder ? 'rgba(204,255,0,0.5)' : 'rgba(255,255,255,0.2)'}`
                }}>
                {reminder ? <Bell size={15} color="#CCFF00" /> : <BellOff size={15} color="white" />}
              </motion.button>
            </div>
          </div>

          {/* Title + meta */}
          <div className="mt-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="font-display text-[38px] md:text-[52px] leading-none tracking-wide text-white uppercase mb-3"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
              {event.title}
            </motion.h1>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/80 backdrop-blur-sm">
                <Calendar size={12} className="opacity-70" />
                {new Date(event.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/80">
                <MapPin size={12} className="opacity-70" />
                {event.venue}, {event.location}
              </span>
            </motion.div>

            {/* Participant avatars row */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="flex items-center gap-3 mt-4">
              <div className="flex -space-x-2">
                {MOCK_USERS.slice(0, 5).map((u, i) => (
                  <img key={u.id} src={u.avatar} alt={u.name}
                    className="w-7 h-7 rounded-full border-2 object-cover"
                    style={{ borderColor: 'var(--bg-surface)', zIndex: 5 - i }} />
                ))}
              </div>
              <span className="font-mono text-[10px] text-white/70">
                <strong className="text-white">{event.participants.length}</strong>/{event.maxParticipants} registered
              </span>
              <span className="ml-auto font-mono text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: pctFull > 80 ? 'rgba(255,59,0,0.4)' : 'rgba(204,255,0,0.25)', color: pctFull > 80 ? '#FF6B35' : '#CCFF00' }}>
                {pctFull}% FULL
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STAT ORBS ROW
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Athletes',   value: event.participants.length, suffix: `/${event.maxParticipants}`, icon: <Users size={14} />,    accent: 'var(--accent)' },
          { label: 'Prize Pool', value: event.prizePool || 'TBD',  suffix: '',                          icon: <Trophy size={14} />,   accent: '#FFD700',       raw: true },
          { label: 'Skill',      value: event.skillLevel,           suffix: '',                          icon: <Star size={14} />,     accent: '#00D4FF',       raw: true },
          { label: 'Capacity',   value: pctFull,                    suffix: '%',                         icon: <BarChart3 size={14} />,accent: pctFull > 80 ? '#FF6B35' : 'var(--accent)' },
        ].map((item, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -3 }}
            className="premium-card hud-corners rounded-[20px] p-4 text-center cursor-default relative overflow-hidden">
            {/* Glow accent top line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }} />
            <div className="flex justify-center mb-2" style={{ color: item.accent }}>{item.icon}</div>
            <div className="font-display text-[18px] md:text-[22px] leading-none capitalize" style={{ color: item.accent }}>
              {item.raw ? item.value : <CountUp to={item.value as number} suffix={item.suffix} />}
            </div>
            <div className="font-mono text-[8px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          TEAM READINESS METER — full-width immersive bar
      ══════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="premium-card neon-border rounded-[22px] p-5 mb-6 relative overflow-hidden">
        {/* Background pulse glow */}
        <div className="absolute inset-0 pointer-events-none rounded-[22px]" style={{
          background: 'radial-gradient(ellipse 60% 80% at 20% 50%, var(--accent-surface) 0%, transparent 70%)'
        }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>
                <Activity size={14} style={{ color: 'var(--accent-text)' }} />
              </motion.div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>
                Event Readiness Matrix
              </span>
            </div>
            <div className="font-display text-[26px] leading-none" style={{ color: 'var(--accent-text)' }}>
              <CountUp to={pctFull} suffix="%" />
            </div>
          </div>

          {/* Multi-segment progress bar */}
          <div className="relative h-3 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pctFull}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, var(--accent) 0%, #88FF00 60%, #CCFF00 100%)`, boxShadow: '0 0 12px var(--accent-glow)' }} />
            {/* Tick marks */}
            {[25, 50, 75].map(tick => (
              <div key={tick} className="absolute top-0 bottom-0 w-px" style={{ left: `${tick}%`, background: 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Teams',       val: Math.round(event.participants.length / 2) },
              { label: 'Solo Players', val: event.participants.length % 3 },
              { label: 'Open Slots',  val: event.maxParticipants - event.participants.length },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-[20px] leading-none" style={{ color: 'var(--text-primary)' }}>
                  <CountUp to={s.val} />
                </div>
                <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          THREE ACTION CARDS — ultra-premium interaction
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* ── JOIN / MANAGE EVENT ── */}
        <motion.div variants={fadeUp}>
          {isOrganizer ? (
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/app/events/${event.id}/manage`)}
              className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group transition-all"
              style={{
                background: 'linear-gradient(135deg, #CCFF00 0%, #88FF00 100%)',
                boxShadow: '0 8px 32px rgba(204,255,0,0.35)',
                minHeight: 150
              }}
            >
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm opacity-40"
                style={{ borderColor: 'rgba(0,0,0,0.3)' }} />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 rounded-br-sm opacity-40"
                style={{ borderColor: 'rgba(0,0,0,0.3)' }} />

              <div className="w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center bg-black/15">
                <Settings size={20} className="text-black" />
              </div>
              <div className="font-display text-[17px] tracking-wide leading-tight text-black">
                MANAGE CLASH
              </div>
              <div className="font-mono text-[9px] mt-1 text-black/65">
                Dashboard & Settings
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1">
                <ArrowRight size={14} className="text-black/60 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => joined ? null : setJoinModalOpen(true)}
              className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group transition-all"
              style={{
                background: joined
                  ? 'linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(136,255,0,0.04) 100%)'
                  : 'linear-gradient(135deg, #CCFF00 0%, #88FF00 100%)',
                border: joined ? '1px solid rgba(204,255,0,0.3)' : 'none',
                boxShadow: joined ? 'none' : '0 8px 32px rgba(204,255,0,0.35)',
              }}
            >
              {/* Animated shimmer for non-joined */}
              {!joined && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
              )}
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm opacity-40"
                style={{ borderColor: joined ? 'var(--accent)' : 'rgba(0,0,0,0.3)' }} />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 rounded-br-sm opacity-40"
                style={{ borderColor: joined ? 'var(--accent)' : 'rgba(0,0,0,0.3)' }} />

              <div className={`w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center ${joined ? '' : 'bg-black/15'}`}
                style={joined ? { background: 'var(--accent-surface)', color: 'var(--accent-text)' } : {}}>
                {joined
                  ? <CheckCircle2 size={20} style={{ color: 'var(--accent-text)' }} />
                  : <Zap size={20} className="text-black" />
                }
              </div>
              <div className={`font-display text-[17px] tracking-wide leading-tight ${joined ? '' : 'text-black'}`}
                style={joined ? { color: 'var(--accent-text)' } : {}}>
                {joined ? 'JOINED ✓' : 'JOIN EVENT'}
              </div>
              <div className={`font-mono text-[9px] mt-1 ${joined ? '' : 'text-black/65'}`}
                style={joined ? { color: 'var(--text-muted)' } : {}}>
                {joined ? 'Registration confirmed' : 'AI AutoSquad ready'}
              </div>
              {!joined && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <ArrowRight size={14} className="text-black/60 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* ── JOIN WITH CREW ── */}
        <motion.div variants={fadeUp}>
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/app/events/${event.id}/crew`)}
            className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group premium-card"
            style={{ minHeight: 150 }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px]"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(0,212,255,0.08), transparent)' }} />
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l opacity-25"
              style={{ borderColor: '#00D4FF' }} />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r opacity-25"
              style={{ borderColor: '#00D4FF' }} />

            <div className="w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Users size={20} style={{ color: '#00D4FF' }} />
            </div>
            <div className="font-display text-[17px] tracking-wide" style={{ color: 'var(--text-primary)' }}>JOIN WITH CREW</div>
            <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>Manage your crew</div>
            <div className="absolute bottom-4 right-4">
              <ArrowRight size={14} style={{ color: '#00D4FF' }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </motion.div>

        {/* ── DISCUSSION ── */}
        <motion.div variants={fadeUp}>
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/app/events/${event.id}/discussion`)}
            className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group premium-card"
            style={{ minHeight: 150 }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px]"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(191,95,255,0.08), transparent)' }} />
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l opacity-25"
              style={{ borderColor: '#BF5FFF' }} />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r opacity-25"
              style={{ borderColor: '#BF5FFF' }} />

            {/* Live pulse dot */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#BF5FFF' }} />
              <span className="font-mono text-[8px]" style={{ color: '#BF5FFF' }}>48 LIVE</span>
            </div>

            <div className="w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center"
              style={{ background: 'rgba(191,95,255,0.12)', border: '1px solid rgba(191,95,255,0.2)' }}>
              <MessageSquare size={20} style={{ color: '#BF5FFF' }} />
            </div>
            <div className="font-display text-[17px] tracking-wide" style={{ color: 'var(--text-primary)' }}>DISCUSSION</div>
            <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>Global event chat</div>
            <div className="absolute bottom-4 right-4">
              <ArrowRight size={14} style={{ color: '#BF5FFF' }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          AI RECOMMENDATION WIDGET — glowing terminal card
      ══════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="premium-card rounded-[22px] p-5 mb-6 relative overflow-hidden group">
        {/* Ambient glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)' }} />
        <div className="relative flex items-start gap-4">
          <motion.div animate={{ boxShadow: ['0 0 12px var(--accent-glow)', '0 0 24px var(--accent-glow)', '0 0 12px var(--accent-glow)'] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-surface)', border: '1px solid var(--accent-border)' }}>
            <Cpu size={22} style={{ color: 'var(--accent-text)' }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-[15px] tracking-wide" style={{ color: 'var(--text-primary)' }}>
                AI SQUAD RECOMMENDATION
              </span>
              <span className="chip-volt text-[8px]">GEMINI</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              3 athletes matching your profile found within {nearbyRadius} km for{' '}
              <span style={{ color: 'var(--accent-text)' }}>{event.sport}</span>.
              AI chemistry score: <span style={{ color: 'var(--accent-text)' }}>91%</span>
            </p>
            {/* Blinking cursor effect */}
            <div className="flex items-center gap-1 mt-2">
              <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>Scanning nearby athletes</span>
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-1.5 h-3 rounded-sm" style={{ background: 'var(--accent)' }} />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] font-mono text-[10px] font-bold flex-shrink-0 transition-all"
            style={{ background: 'var(--accent)', color: 'var(--volt-text)', boxShadow: '0 4px 16px var(--accent-glow)' }}>
            Build <ArrowRight size={11} />
          </motion.button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          STICKY TABS — pill style navigation
      ══════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 py-3 -mx-4 px-4 md:-mx-0 md:px-0 mb-5"
        style={{
          background: 'var(--bg-base)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)'
        }}>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-label font-semibold flex-shrink-0 transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--volt-text)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 2px 12px var(--accent-glow)' : 'none',
              }}>
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute inset-0 rounded-full" style={{ zIndex: -1 }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB PANELS
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}>

          {/* ─── OVERVIEW ─────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

              {/* About */}
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)' }} />
                <h2 className="font-display text-[18px] tracking-wider uppercase mb-3 flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}>
                  <Hash size={14} style={{ color: 'var(--accent-text)' }} /> About
                </h2>
                <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
              </motion.div>

              {/* Rules */}
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }} />
                <h2 className="font-display text-[18px] tracking-wider uppercase mb-4 flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}>
                  <Shield size={14} style={{ color: '#00D4FF' }} /> Rules
                </h2>
                <ul className="space-y-3">
                  {event.rules.map((rule, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold text-[12px] flex-shrink-0 tabular-nums mt-0.5"
                        style={{ color: 'var(--accent-text)' }}>{String(i + 1).padStart(2, '0')}</span>
                      {rule}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Live Activity Feed */}
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(191,95,255,0.4), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <motion.span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }}
                    animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
                  <h2 className="font-display text-[18px] tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                    Live Activity
                  </h2>
                  <span className="font-mono text-[9px] ml-auto px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                    REAL TIME
                  </span>
                </div>
                <div className="space-y-3">
                  {LIVE_ACTIVITIES.map((a, i) => (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-[14px] transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="relative flex-shrink-0">
                        <img src={a.avatar} alt={a.user} className="w-8 h-8 rounded-full object-cover" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border"
                          style={{ background: a.color, borderColor: 'var(--bg-elevated)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{a.user} </span>
                        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.action}</span>
                      </div>
                      <span className="font-mono text-[9px] flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={8} />{a.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── SCHEDULE ─────────────────────────────────────── */}
          {activeTab === 'schedule' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
                <Timer size={14} style={{ color: 'var(--accent-text)' }} />
                <h2 className="font-display text-[18px] tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                  Match Schedule
                </h2>
              </motion.div>
              {MATCH_SCHEDULE.map((match) => (
                <motion.div key={match.id} variants={fadeUp}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-[18px] p-4 relative overflow-hidden transition-all cursor-default"
                  style={{
                    background: match.status === 'tbd' ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    border: `1px solid ${match.status === 'tbd' ? 'var(--border)' : 'var(--accent-border)'}`,
                  }}>
                  {match.status !== 'tbd' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[18px]"
                      style={{ background: 'linear-gradient(180deg, var(--accent), #88FF00)' }} />
                  )}
                  {/* Time block */}
                  <div className="flex flex-col items-center justify-center w-16 flex-shrink-0 pl-2">
                    <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {match.time.split(' ')[1]}
                    </span>
                    <span className="font-display text-[18px] leading-none" style={{ color: 'var(--accent-text)' }}>
                      {match.time.split(' ')[0]}
                    </span>
                  </div>
                  <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />
                  {/* Match info */}
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[9px] uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {match.label}
                    </span>
                    <div className="font-display text-[14px] flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {match.teams[0]}
                      <Swords size={11} style={{ color: 'var(--text-muted)' }} />
                      {match.teams[1]}
                    </div>
                  </div>
                  {/* Status pill */}
                  <span className="px-2.5 py-1 rounded-full font-mono text-[8px] font-bold flex-shrink-0"
                    style={{
                      background: match.status === 'tbd' ? 'var(--bg-elevated)' : 'var(--accent-surface)',
                      border: `1px solid ${match.status === 'tbd' ? 'var(--border)' : 'var(--accent-border)'}`,
                      color: match.status === 'tbd' ? 'var(--text-muted)' : 'var(--accent-text)',
                    }}>
                    {match.status === 'tbd' ? 'TBD' : 'SET'}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ─── PARTICIPANTS ──────────────────────────────────── */}
          {activeTab === 'participants' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              <motion.div variants={fadeUp} className="flex items-center justify-between">
                <h2 className="font-display text-[18px] tracking-wider uppercase flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}>
                  <Users size={14} style={{ color: 'var(--accent-text)' }} />
                  Athletes ({event.participants.length})
                </h2>
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {event.maxParticipants - event.participants.length} slots open
                </span>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_USERS.slice(0, event.participants.length || 4).map((athlete, i) => (
                  <motion.div key={athlete.id} variants={fadeUp}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="flex items-center gap-3 rounded-[18px] p-3.5 cursor-default premium-card relative overflow-hidden">
                    {/* Rank badge */}
                    <div className="absolute top-2.5 right-3 font-mono text-[9px] font-bold"
                      style={{ color: 'var(--text-muted)' }}>#{i + 1}</div>
                    <div className="relative flex-shrink-0">
                      <Avatar src={athlete.avatar} name={athlete.name} sport={athlete.sport} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[12px] font-bold block truncate" style={{ color: 'var(--text-primary)' }}>{athlete.name}</span>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>{athlete.sport} · Level {athlete.level || 25}</span>
                    </div>
                    <BadgeIcon level={athlete.level || 25} size={18} animate={false} />
                  </motion.div>
                ))}
                {/* Open slot placeholders */}
                {Array.from({ length: Math.min(2, event.maxParticipants - event.participants.length) }).map((_, i) => (
                  <motion.div key={`slot${i}`} variants={fadeUp}
                    className="flex items-center justify-center rounded-[18px] p-3.5 font-mono text-[10px]"
                    style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)', minHeight: 72 }}>
                    <UserPlus size={14} className="mr-2 opacity-50" />
                    Open slot
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── BRACKET ──────────────────────────────────────── */}
          {activeTab === 'bracket' && bracket.length > 0 && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              <motion.div variants={fadeUp} className="flex items-center gap-2">
                <Trophy size={14} style={{ color: '#FFD700' }} />
                <h2 className="font-display text-[18px] tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                  Tournament Bracket
                </h2>
              </motion.div>
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,213,74,0.5), transparent)' }} />
                <BracketView rounds={bracket} />
              </motion.div>
            </motion.div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          FLOATING ACTION BUTTONS
      ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 180 }}
        className="fixed bottom-24 right-4 md:right-6 flex flex-col gap-3 z-40">
        {/* Discussion FAB */}
        <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
          onClick={() => navigate(`/app/events/${event.id}/discussion`)}
          className="w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}
          title="Discussion Group">
          <MessageSquare size={18} style={{ color: 'var(--volt-text)' }} />
          {/* Notification dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 font-mono text-[7px] text-white flex items-center justify-center"
            style={{ borderColor: 'var(--bg-base)' }}>3</span>
        </motion.button>
        {/* Crew FAB */}
        <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
          onClick={() => navigate(`/app/events/${event.id}/crew`)}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          title="Join With Crew">
          <UserPlus size={18} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          JOIN MODAL
      ══════════════════════════════════════════════════════ */}
      <EventJoinModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoined={() => { setJoined(true); setJoinModalOpen(false); }}
        event={event}
      />
    </div>
  );
};
