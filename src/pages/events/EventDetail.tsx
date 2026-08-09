import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, MapPin, Users, Zap, Bell, BellOff,
  Trophy, Activity, Clock, Star, ArrowRight, ArrowLeft, UserPlus,
  BarChart3, CheckCircle2, Swords, Timer,
  Hash, Share2, Settings
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { getEventParticipants, leaveEvent, type DbEventParticipant } from '../../services/eventService';
import { client, DATABASE_ID, COLLECTIONS } from '../../lib/appwrite';
import toast from 'react-hot-toast';
import { SPORT_CATEGORIES } from '../../services/mockData';
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
    const step = Math.ceil((to || 0) / (duration / 16)) || 1;
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

import { getEventReadiness, type EventReadinessData } from '../../services/eventReadinessService';

// ─── Event Detail ─────────────────────────────────────────────────────────────
export const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, loadEvent } = useEventStore();
  const { user } = useAuthStore();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 80]);
  const heroOpacity = useTransform(scrollY, [0, 250], [1, 0]);

  const [reminder, setReminder]         = useState(false);
  const [bracket, setBracket]           = useState<BracketRound[]>([]);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab]       = useState<'overview' | 'schedule' | 'participants' | 'bracket'>('overview');
  const [shared, setShared]             = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [readiness, setReadiness]       = useState<EventReadinessData | null>(null);

  // Appwrite event_participants (Source of Truth)
  const [dbParticipants, setDbParticipants] = useState<DbEventParticipant[]>([]);

  const fetchParticipants = async (eventId: string) => {
    const records = await getEventParticipants(eventId);
    setDbParticipants(records);
  };

  const fetchReadiness = async (eventId: string) => {
    const data = await getEventReadiness(eventId);
    setReadiness(data);
  };

  // ── Realtime & initial load ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoadingEvent(true);
    loadEvent(id).finally(() => setLoadingEvent(false));
    fetchParticipants(id);
    fetchReadiness(id);

    // Appwrite Realtime subscription for event_participants
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.EVENT_PARTICIPANTS}.documents`;
    const unsubscribe = client.subscribe(channel, (response: any) => {
      if (response.payload && response.payload.event_id === id) {
        fetchParticipants(id);
        loadEvent(id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const rawEvent = events.find(e => e.id === id);
  const currentUserId = user?.id || user?.uid || '';

  // ── SOURCE OF TRUTH CALCULATIONS (from event_participants) ────────────────
  const filledSlots = dbParticipants.length;
  const maxSlots    = rawEvent?.maxParticipants || 10;
  const pctFull     = maxSlots > 0 ? Math.min(100, Math.round((filledSlots / maxSlots) * 100)) : 0;

  // Unique Teams Joined (count unique non-null team_id or team/crew/squad entries)
  const teamSet = new Set(
    dbParticipants
      .filter(p => p.team_id || p.entry_type === 'team' || p.entry_type === 'crew' || p.entry_type === 'squad')
      .map(p => p.team_id || p.$id)
  );
  const teamsJoined = teamSet.size;

  // Solo Players (count solo entries or entries without team_id)
  const soloPlayers = dbParticipants.filter(
    p => p.entry_type === 'solo' || (!p.team_id && p.entry_type !== 'team' && p.entry_type !== 'crew' && p.entry_type !== 'squad')
  ).length;

  // Open Slots
  const openSlots = Math.max(0, maxSlots - filledSlots);

  // Joined Status from Appwrite
  const isJoined = dbParticipants.some(p => p.user_id === currentUserId);
  const isOrganizer = rawEvent?.organizerId === currentUserId;

  const effectiveEvent = rawEvent
    ? {
        ...rawEvent,
        participants: dbParticipants.map(p => p.user_id),
      }
    : null;

  const sportData = SPORT_CATEGORIES.find(s => s.id === effectiveEvent?.sport);

  useEffect(() => {
    if (effectiveEvent) {
      const b = generateBracket(
        dbParticipants.length > 0
          ? dbParticipants.map(p => p.user_id)
          : ['P1','P2','P3','P4','P5','P6','P7','P8']
      );
      setBracket(b);
    }
  }, [effectiveEvent?.id, dbParticipants.length]);

  const handleToggleJoin = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to join events.');
      return;
    }
    if (isJoined) {
      if (id) {
        const res = await leaveEvent(id, currentUserId);
        if (res.success) {
          toast.success(res.message);
          fetchParticipants(id);
          loadEvent(id);
        } else {
          toast.error(res.message);
        }
      }
    } else {
      setJoinModalOpen(true);
    }
  };

  if (loadingEvent && !rawEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted font-mono text-xs uppercase">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!effectiveEvent) return null;
  const event = effectiveEvent;

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

        <div className="absolute inset-0 rounded-[28px] overflow-hidden z-[1]">
          <ParticleField />
        </div>

        <div className="absolute inset-0 z-[2] rounded-[28px]" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)'
        }} />
        <div className="absolute inset-0 z-[3] pointer-events-none rounded-[28px]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)'
        }} />

        {/* Hero Content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-[4] p-6 md:p-8 flex flex-col justify-between min-h-[300px]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/app/events')}
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all mr-1"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <ArrowLeft size={16} color="white" />
              </motion.button>

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

              {readiness && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
                  className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5"
                  style={{
                    background: readiness.is_autosquad_ready ? 'rgba(204,255,0,0.25)' : 'rgba(249,115,22,0.25)',
                    border: `1px solid ${readiness.is_autosquad_ready ? 'rgba(204,255,0,0.5)' : 'rgba(249,115,22,0.5)'}`,
                    color: readiness.is_autosquad_ready ? '#CCFF00' : '#fb923c'
                  }}>
                  <span>{readiness.is_autosquad_ready ? '⚡ AUTOSQUAD READY' : `🔒 AUTOSQUAD LOCKED (${readiness.eligible_count}/10)`}</span>
                </motion.div>
              )}
            </div>
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
                {dbParticipants.slice(0, 5).map((p, i) => (
                  <img key={p.$id || i}
                    src={`https://i.pravatar.cc/150?u=${p.user_id}`}
                    alt="Participant"
                    className="w-7 h-7 rounded-full border-2 object-cover"
                    style={{ borderColor: 'var(--bg-surface)', zIndex: 5 - i }} />
                ))}
              <span className="font-mono text-[10px] text-white/70">
                <strong className="text-white">{filledSlots}</strong>/{maxSlots} registered
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
          { label: 'Athletes',   value: filledSlots,      suffix: `/${maxSlots}`, icon: <Users size={14} />,    accent: 'var(--accent)' },
          { label: 'Prize Pool', value: event.prizePool || 'TBD',  suffix: '',                          icon: <Trophy size={14} />,   accent: '#FFD700',       raw: true },
          { label: 'Skill',      value: event.skillLevel,           suffix: '',                          icon: <Star size={14} />,     accent: '#00D4FF',       raw: true },
          { label: 'Capacity',   value: pctFull,                    suffix: '%',                         icon: <BarChart3 size={14} />,accent: pctFull > 80 ? '#FF6B35' : 'var(--accent)' },
        ].map((item, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -3 }}
            className="premium-card hud-corners rounded-[20px] p-4 text-center cursor-default relative overflow-hidden">
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
            {[25, 50, 75].map(tick => (
              <div key={tick} className="absolute top-0 bottom-0 w-px" style={{ left: `${tick}%`, background: 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Teams Joined', val: teamsJoined },
              { label: 'Solo Players', val: soloPlayers },
              { label: 'Open Slots',  val: openSlots },
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
          THREE ACTION CARDS
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
              onClick={handleToggleJoin}
              className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group transition-all"
              style={{
                background: isJoined
                  ? 'linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(136,255,0,0.04) 100%)'
                  : 'linear-gradient(135deg, #CCFF00 0%, #88FF00 100%)',
                border: isJoined ? '1px solid rgba(204,255,0,0.3)' : 'none',
                boxShadow: isJoined ? 'none' : '0 8px 32px rgba(204,255,0,0.35)',
              }}
            >
              {!isJoined && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
              )}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm opacity-40"
                style={{ borderColor: isJoined ? 'var(--accent)' : 'rgba(0,0,0,0.3)' }} />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 rounded-br-sm opacity-40"
                style={{ borderColor: isJoined ? 'var(--accent)' : 'rgba(0,0,0,0.3)' }} />

              <div className={`w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center ${isJoined ? '' : 'bg-black/15'}`}
                style={isJoined ? { background: 'var(--accent-surface)', color: 'var(--accent-text)' } : {}}>
                {isJoined
                  ? <CheckCircle2 size={20} style={{ color: 'var(--accent-text)' }} />
                  : <Zap size={20} className="text-black" />
                }
              </div>
              <div className={`font-display text-[17px] tracking-wide leading-tight ${isJoined ? '' : 'text-black'}`}
                style={isJoined ? { color: 'var(--accent-text)' } : {}}>
                {isJoined ? 'JOINED ✓' : 'JOIN EVENT'}
              </div>
              <div className={`font-mono text-[9px] mt-1 ${isJoined ? '' : 'text-black/65'}`}
                style={isJoined ? { color: 'var(--text-muted)' } : {}}>
                {isJoined ? 'Registration confirmed (Click to leave)' : 'AI AutoSquad ready'}
              </div>
              {!isJoined && (
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
            className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group transition-all premium-card"
            style={{ minHeight: 150 }}
          >
            <div className="w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}>
              <Users size={20} />
            </div>
            <div className="font-display text-[17px] tracking-wide leading-tight" style={{ color: 'var(--text-primary)' }}>
              JOIN WITH CREW
            </div>
            <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Manage your crew
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
            </div>
          </motion.button>
        </motion.div>

        {/* ── AI SQUAD LAB ── */}
        <motion.div variants={fadeUp}>
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/pulse/matchmaking`)}
            className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group transition-all premium-card"
            style={{ minHeight: 150 }}
          >
            <div className="w-10 h-10 rounded-[14px] mb-4 flex items-center justify-center"
              style={{ background: 'rgba(191,95,255,0.15)', color: '#BF5FFF' }}>
              <Zap size={20} />
            </div>
            <div className="font-display text-[17px] tracking-wide leading-tight" style={{ color: 'var(--text-primary)' }}>
              AUTOSQUAD LAB
            </div>
            <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Matchmaking engine
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }} />
            </div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          TABS NAV & CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex gap-2 p-1 rounded-2xl bg-surface border border-border-muted overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl font-mono text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              style={activeTab === tab.id ? { color: 'var(--volt-text)' } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW ───────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {/* Description card */}
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-6 space-y-3">
                <h3 className="font-display text-[16px] tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                  About Event
                </h3>
                <p className="font-mono text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {event.description || 'No description provided for this clash event.'}
                </p>
              </motion.div>

              {/* Live activity feed */}
              <motion.div variants={fadeUp} className="premium-card rounded-[22px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="font-display text-[15px] tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                      Live Activity
                    </h3>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Real-time
                  </span>
                </div>

                <div className="space-y-3">
                  {LIVE_ACTIVITIES.map(a => (
                    <motion.div key={a.id} whileHover={{ x: 4 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
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
            <motion.div key="schedule" variants={stagger} initial="hidden" animate="visible" className="space-y-3">
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
                  <div className="flex flex-col items-center justify-center w-16 flex-shrink-0 pl-2">
                    <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {match.time.split(' ')[1]}
                    </span>
                    <span className="font-display text-[18px] leading-none" style={{ color: 'var(--accent-text)' }}>
                      {match.time.split(' ')[0]}
                    </span>
                  </div>
                  <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />
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

          {/* ─── PARTICIPANTS / ATHLETES ──────────────────────────── */}
          {activeTab === 'participants' && (
            <motion.div key="participants" variants={stagger} initial="hidden" animate="visible" className="space-y-4">
              <motion.div variants={fadeUp} className="flex items-center justify-between">
                <h2 className="font-display text-[18px] tracking-wider uppercase flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}>
                  <Users size={14} style={{ color: 'var(--accent-text)' }} />
                  Athletes ({filledSlots})
                </h2>
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {openSlots} slots open
                </span>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dbParticipants.map((p, i) => (
                  <motion.div key={p.$id || i} variants={fadeUp}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="flex items-center gap-3 rounded-[18px] p-3.5 cursor-default premium-card relative overflow-hidden">
                    <div className="absolute top-2.5 right-3 font-mono text-[9px] font-bold"
                      style={{ color: 'var(--text-muted)' }}>#{i + 1}</div>
                    <div className="relative flex-shrink-0">
                      <Avatar src={`https://i.pravatar.cc/150?u=${p.user_id}`} name="Athlete" sport={event.sport} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[12px] font-bold block truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.user_id === currentUserId ? 'You (Athlete)' : `Athlete (${p.entry_type})`}
                      </span>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>{event.sport} · {p.status}</span>
                    </div>
                    <BadgeIcon level={25} size={18} animate={false} glow={false} />
                  </motion.div>
                ))}
                {Array.from({ length: Math.min(4, openSlots) }).map((_, i) => (
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
            <motion.div key="bracket" variants={stagger} initial="hidden" animate="visible" className="space-y-4">
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
        </AnimatePresence>
      </div>

      {/* Join Modal */}
      {joinModalOpen && (
        <EventJoinModal
          isOpen={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onJoined={() => {
            setJoinModalOpen(false);
            if (id) {
              fetchParticipants(id);
              loadEvent(id);
            }
          }}
          event={event}
        />
      )}
    </div>
  );
};
