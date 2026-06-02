import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, Pin, BarChart2,
  Megaphone, Trash2, Bell, X
} from 'lucide-react';


// ─── Mock Discussion Data ─────────────────────────────────────────────────────
interface DiscussionMessage {
  id: string;
  sender: string;
  senderId: string;
  avatar: string;
  content: string;
  type: 'text' | 'poll' | 'announcement' | 'media';
  timestamp: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  pinned?: boolean;
  pollData?: { question: string; options: { text: string; votes: number; voted: boolean }[] };
  isAdmin?: boolean;
}

const INITIAL_MESSAGES: DiscussionMessage[] = [
  {
    id: 'm1', sender: 'Event Admin', senderId: 'admin', avatar: '', type: 'announcement',
    content: 'Welcome to the official discussion group for this event! Rules: be respectful, no spam, and coordinate effectively.',
    timestamp: '2 hours ago', reactions: [], pinned: true, isAdmin: true
  },
  {
    id: 'm2', sender: 'Marcus Reid', senderId: 'u1', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
    type: 'text', content: 'Who else is joining as solo? Looking for a squad to team up with.',
    timestamp: '1h 45m ago', reactions: [{ emoji: '⚡', count: 4, reacted: false }, { emoji: '✅', count: 2, reacted: false }]
  },
  {
    id: 'm3', sender: 'Priya Nair', senderId: 'u3', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
    type: 'poll', content: '',
    pollData: {
      question: 'What time works best for warm-up?',
      options: [
        { text: '30 mins before', votes: 8, voted: false },
        { text: '1 hour before', votes: 5, voted: false },
        { text: 'No warm-up needed', votes: 2, voted: false },
      ]
    },
    timestamp: '1h 20m ago', reactions: []
  },
  {
    id: 'm4', sender: 'Zaid Al-Hassan', senderId: 'u2', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
    type: 'text', content: 'Iron Pulse FC is registered! We are ready. Good luck to all teams.',
    timestamp: '58m ago', reactions: [{ emoji: '🔥', count: 7, reacted: false }]
  },
  {
    id: 'm5', sender: 'Event Admin', senderId: 'admin', avatar: '', type: 'announcement',
    content: 'Reminder: Gates open 2 hours before the first match. Bring your SPORTiX ID for verification.',
    timestamp: '30m ago', reactions: [], isAdmin: true
  },
  {
    id: 'm6', sender: 'Aisha Mensah', senderId: 'u5', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80',
    type: 'text', content: 'Can someone share the event parking details? Joining with a full crew.',
    timestamp: '15m ago', reactions: [{ emoji: '✅', count: 1, reacted: false }]
  },
];

const REACTIONS = ['⚡', '🔥', '✅', '👍', '🏆', '💪'];

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  msg: DiscussionMessage;
  isMe: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onReact: (msgId: string, emoji: string) => void;
}> = ({ msg, isMe, isAdmin, onDelete, onPin, onReact }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (msg.type === 'announcement') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="my-3 mx-2">
        <div className="rounded-[14px] p-4 border flex items-start gap-3 bg-warning-dim border-warning/20">
          {msg.pinned && <Pin size={12} className="text-warning flex-shrink-0 mt-0.5" />}
          <Megaphone size={13} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] text-warning font-bold uppercase mb-1">ANNOUNCEMENT</div>
            <p className="font-mono text-[11px] text-text-primary leading-relaxed font-bold">{msg.content}</p>
            <span className="font-mono text-[8px] text-text-muted mt-1 block">{msg.timestamp}</span>
          </div>
          {isAdmin && (
            <button onClick={() => onDelete(msg.id)} className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (msg.type === 'poll' && msg.pollData) {
    const total = msg.pollData.options.reduce((s, o) => s + o.votes, 0);
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="my-3 mx-2">
        <div className="rounded-[16px] p-4 border border-plasma/20 bg-plasma-dim shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <img src={msg.avatar} alt={msg.sender} className="w-6 h-6 rounded-full object-cover border border-border-muted" />
            <span className="font-mono text-[10px] text-plasma font-bold">{msg.sender}</span>
            <BarChart2 size={11} className="text-plasma" />
          </div>
          <p className="font-mono text-[12px] text-text-primary mb-3 font-bold">{msg.pollData.question}</p>
          <div className="space-y-2">
            {msg.pollData.options.map((opt, i) => {
              const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
              return (
                <div key={i} className="rounded-[10px] overflow-hidden border border-border-muted relative cursor-pointer hover:border-plasma/40 bg-surface transition-all">
                  <div className="absolute inset-0 rounded-[10px] bg-plasma/10" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="font-mono text-[10px] text-text-primary">{opt.text}</span>
                    <span className="font-mono text-[9px] text-plasma font-bold">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <span className="font-mono text-[8px] text-text-muted mt-2 block">{total} votes · {msg.timestamp}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 my-2 ${isMe ? 'flex-row-reverse' : ''}`}>

      {!isMe && (
        <img src={msg.avatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 border border-border-muted" />
      )}

      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMe && (
          <span className="font-mono text-[9px] text-text-muted mb-1 ml-1">{msg.sender}</span>
        )}

        <div className="relative group">
          <div className={`rounded-[16px] px-4 py-3 ${isMe
            ? 'rounded-br-[4px]'
            : 'rounded-bl-[4px]'
          }`}
            style={{
              background: isMe ? 'var(--volt)' : 'var(--bg-elevated)',
              border: isMe ? 'none' : '1px solid var(--border)'
            }}>
            <p className={`font-mono text-[11px] leading-relaxed ${isMe ? 'text-volt-text font-bold' : 'text-text-primary'}`}>{msg.content}</p>
          </div>

          {/* Hover actions */}
          <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button onClick={() => setShowReactionPicker(r => !r)}
              className="w-6 h-6 rounded-full bg-elevated border border-border-muted flex items-center justify-center text-text-muted hover:text-text-primary text-[11px] font-bold">+</button>
            <button onClick={() => onPin(msg.id)}
              className="w-6 h-6 rounded-full bg-elevated border border-border-muted flex items-center justify-center text-text-muted hover:text-volt">
              <Pin size={10} />
            </button>
            {(isMe || isAdmin) && (
              <button onClick={() => onDelete(msg.id)}
                className="w-6 h-6 rounded-full bg-elevated border border-border-muted flex items-center justify-center text-text-muted hover:text-red-400">
                <Trash2 size={10} />
              </button>
            )}
          </div>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-full mb-2 left-0 flex gap-1 p-2 rounded-xl z-10 shadow-xl bg-surface border border-border-muted">
                {REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowReactionPicker(false); }}
                    className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
            {msg.reactions.map((r, i) => (
              <button key={i} onClick={() => onReact(msg.id, r.emoji)}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] transition-all"
                style={{
                  background: r.reacted ? 'var(--volt-dim)' : 'var(--bg-elevated)',
                  border: r.reacted ? '1px solid var(--volt)' : '1px solid var(--border)'
                }}>
                {r.emoji} <span className="font-mono text-[9px] text-text-primary">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <span className={`font-mono text-[8px] text-text-muted mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>{msg.timestamp}</span>
      </div>
    </motion.div>
  );
};

// ─── Discussion Page ──────────────────────────────────────────────────────────
export const EventDiscussion: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();


  const [messages, setMessages] = useState<DiscussionMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isAdmin] = useState(true); // current user is admin for demo
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [liveCount] = useState(48);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: DiscussionMessage = {
      id: `m${Date.now()}`,
      sender: 'You',
      senderId: 'u6',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80',
      type: 'text',
      content: input.trim(),
      timestamp: 'just now',
      reactions: [],
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleDelete = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handlePin = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r).filter(r => r.count > 0) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, reacted: true }] };
    }));
  };

  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    const msg: DiscussionMessage = {
      id: `poll${Date.now()}`,
      sender: 'You',
      senderId: 'u6',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80',
      type: 'poll',
      content: '',
      pollData: {
        question: pollQuestion,
        options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: 0, voted: false })),
      },
      timestamp: 'just now',
      reactions: [],
    };
    setMessages(prev => [...prev, msg]);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollCreator(false);
  };

  const pinnedMessages = messages.filter(m => m.pinned);

  return (
    <div className="max-w-2xl mx-auto flex flex-col text-text-primary" style={{ height: 'calc(100vh - 80px)' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 flex items-center justify-between py-3 px-1 border-b border-border-muted">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/app/events/${id}`)}
            className="w-8 h-8 rounded-full bg-elevated border border-border-muted flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-[17px] text-text-primary tracking-wider leading-none">DISCUSSION GROUP</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse" />
              <span className="font-mono text-[9px] text-text-muted">{liveCount} participants online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full font-mono text-[8px] text-warning border border-warning/30 bg-warning-dim font-bold">MOD</span>
          )}
          <button className="w-8 h-8 rounded-full bg-elevated border border-border-muted flex items-center justify-center text-text-secondary hover:text-text-primary">
            <Bell size={13} />
          </button>
        </div>
      </motion.div>

      {/* Pinned messages strip */}
      {pinnedMessages.length > 0 && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-warning/10 bg-warning-dim rounded-lg my-1 mx-2 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Pin size={10} className="text-warning flex-shrink-0" />
            <p className="font-mono text-[10px] text-warning truncate font-bold">{pinnedMessages[pinnedMessages.length - 1].content}</p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-1 py-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === 'u6'}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            onPin={handlePin}
            onReact={handleReact}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Poll Creator */}
      <AnimatePresence>
        {showPollCreator && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex-shrink-0 mx-2 mb-2 rounded-[16px] p-4 border border-plasma/25 bg-plasma-dim">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] text-plasma font-bold">CREATE POLL</span>
              <button onClick={() => setShowPollCreator(false)} className="text-text-muted hover:text-text-primary"><X size={13} /></button>
            </div>
            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Poll question..."
              className="w-full px-3 py-2 rounded-[10px] bg-surface border border-border-muted text-text-primary font-mono text-[11px] outline-none focus:border-plasma mb-2" />
            {pollOptions.map((opt, i) => (
              <input key={i} value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`Option ${i + 1}`}
                className="w-full px-3 py-2 rounded-[10px] bg-surface border border-border-muted text-text-primary font-mono text-[11px] outline-none focus:border-plasma mb-1.5" />
            ))}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setPollOptions(prev => [...prev, ''])}
                className="font-mono text-[10px] text-plasma hover:underline font-bold">+ Add option</button>
              <button onClick={handleCreatePoll}
                className="ml-auto px-4 py-1.5 rounded-[8px] bg-plasma font-mono text-[10px] font-bold"
                style={{ color: '#ffffff' }}>
                Post Poll
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="flex-shrink-0 px-2 pb-3">
        <div className="flex items-center gap-2 rounded-[16px] px-3 py-2 border border-border-muted bg-elevated shadow-sm">
          {/* Quick actions */}
          <button onClick={() => setShowPollCreator(p => !p)}
            className="w-7 h-7 rounded-full bg-plasma/10 flex items-center justify-center text-plasma hover:scale-110 transition-all flex-shrink-0 border border-plasma/20">
            <BarChart2 size={13} />
          </button>
          {isAdmin && (
            <button onClick={() => {
              const ann: DiscussionMessage = {
                id: `ann${Date.now()}`,
                sender: 'Event Admin', senderId: 'admin', avatar: '',
                type: 'announcement', content: 'New announcement from admin.', timestamp: 'just now',
                reactions: [], isAdmin: true
              };
              setMessages(prev => [...prev, ann]);
            }}
              className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center text-warning hover:scale-110 transition-all flex-shrink-0 border border-warning/20">
              <Megaphone size={13} />
            </button>
          )}

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message the group..."
            className="flex-1 bg-transparent outline-none font-mono text-[12px] text-text-primary placeholder-text-muted"
          />

          {/* Send */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() ? 'var(--volt)' : 'var(--bg-surface)',
              color: input.trim() ? 'var(--volt-text)' : 'var(--text-muted)',
              border: input.trim() ? 'none' : '1px solid var(--border)'
            }}>
            <Send size={14} />
          </motion.button>
        </div>
        {isAdmin && (
          <p className="font-mono text-[8px] text-text-muted text-center mt-1.5">Moderator — you can delete messages and pin announcements</p>
        )}
      </div>
    </div>
  );
};
