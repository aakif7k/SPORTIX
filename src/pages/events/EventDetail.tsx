import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Zap, MessageCircle, Bell, BellOff, ChevronRight, Trophy } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES, MOCK_USERS } from '../../services/mockData';
import { generateBracket } from '../../services/aiService';
import type { BracketRound } from '../../types';
import { SportBadge, AIBadge, LiveIndicator } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Toggle } from '../../components/ui/index';

// ─── BRACKET TREE ──────────────────────────────────────────────────────────
const BracketView: React.FC<{ rounds: BracketRound[] }> = ({ rounds }) => (
  <div className="overflow-x-auto">
    <div className="flex gap-8 min-w-max p-4">
      {rounds.map(round => (
        <div key={round.round} className="flex flex-col gap-4">
          <p className="stat-label text-center mb-2">{round.name}</p>
          <div className="flex flex-col gap-6 justify-around h-full">
            {round.matches.map(match => (
              <div key={match.id} className="glass rounded-lg p-3 w-40 border border-border-muted">
                {[match.team1, match.team2].map((team, i) => (
                  <div key={i} className={`flex items-center gap-2 py-1.5 ${i === 0 ? 'border-b border-border-muted' : ''}`}>
                    <div className="w-5 h-5 rounded bg-elevated flex items-center justify-center text-[9px] font-mono text-text-secondary">{i + 1}</div>
                    <span className="font-mono text-xs text-white truncate">{team?.slice(0, 12) || 'TBD'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── EVENT DETAIL ──────────────────────────────────────────────────────────
export const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events } = useEventStore();
  const [reminder, setReminder] = useState(false);
  const [bracket, setBracket] = useState<BracketRound[]>([]);
  const [joined, setJoined] = useState(false);

  const event = events.find(e => e.id === id) || events[0];
  const sportData = SPORT_CATEGORIES.find(s => s.id === event?.sport);

  useEffect(() => {
    if (event) {
      const b = generateBracket(event.participants.length > 0 ? event.participants : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
      setBracket(b);
    }
  }, [event?.id]);

  if (!event) return null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="h-52 relative">
          {event.bannerImage && <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
        </div>
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="flex items-start gap-3 mb-3">
            <SportBadge sport={event.sport} />
            {event.status === 'live' && <LiveIndicator />}
            {event.aiTeamAvailable && <AIBadge />}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide leading-tight">{event.title.toUpperCase()}</h1>
          <div className="flex items-center gap-5 mt-3 text-sm text-text-secondary font-label">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(event.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {event.venue}, {event.location}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Button
          variant={joined ? 'ghost' : 'primary'}
          onClick={() => setJoined(j => !j)}
          icon={joined ? <Users size={15} /> : <Zap size={15} fill="black" />}
        >
          {joined ? 'Joined ✓' : 'Join Event'}
        </Button>
        {event.aiTeamAvailable && (
          <Button variant="ghost" onClick={() => navigate(`/app/events/${event.id}/ai-team`)} icon={<Zap size={15} className="text-volt" />}>
            AI Team Builder
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/app/messages')} icon={<MessageCircle size={15} />}>Team Chat</Button>
        <div className="flex items-center gap-2 ml-auto">
          <Toggle checked={reminder} onChange={setReminder} label="Reminders" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'PARTICIPANTS', value: `${event.participants.length}/${event.maxParticipants}` },
          { label: 'PRIZE POOL', value: event.prizePool || 'TBD' },
          { label: 'SKILL LEVEL', value: event.skillLevel },
        ].map(item => (
          <div key={item.label} className="telemetry-card rounded-xl p-4 text-center">
            <div className="font-mono text-lg font-bold text-volt capitalize">{item.value}</div>
            <div className="stat-label mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-display text-xl text-white mb-3 tracking-wide">ABOUT</h2>
        <p className="font-label text-sm text-text-secondary leading-relaxed">{event.description}</p>
      </div>

      {/* Rules */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-display text-xl text-white mb-3 tracking-wide">RULES</h2>
        <ul className="space-y-2">
          {event.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-label text-text-secondary">
              <span className="font-mono text-volt text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Participants */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-display text-xl text-white mb-4 tracking-wide">PARTICIPANTS ({event.participants.length})</h2>
        <div className="flex flex-wrap gap-3">
          {MOCK_USERS.slice(0, event.participants.length || 3).map(athlete => (
            <div key={athlete.id} className="flex items-center gap-2 bg-elevated rounded-lg px-3 py-2 border border-border-muted">
              <Avatar src={athlete.avatar} name={athlete.name} sport={athlete.sport} size="xs" />
              <span className="font-label text-xs text-white">{athlete.name.split(' ')[0]}</span>
            </div>
          ))}
          {event.maxParticipants - event.participants.length > 0 && (
            <div className="flex items-center gap-2 bg-elevated rounded-lg px-3 py-2 border border-dashed border-border-muted text-text-muted text-xs font-mono">
              +{event.maxParticipants - event.participants.length} open spots
            </div>
          )}
        </div>
      </div>

      {/* Bracket */}
      {bracket.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h2 className="font-display text-xl text-white mb-4 tracking-wide flex items-center gap-2">
            <Trophy size={16} className="text-volt" /> TOURNAMENT BRACKET
          </h2>
          <BracketView rounds={bracket} />
        </div>
      )}
    </div>
  );
};
