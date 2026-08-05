import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Send, Pin, Megaphone, Bell,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEvent, useEventParticipants } from '@/hooks/useEvents';
import { useEventDiscussion } from '@/hooks/useCrew';


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
  isAdmin?: boolean;
}


// ─── Message Bubble ───────────────────────────────────────────────────────────
/**
 * A message in the thread.
 *
 * Reactions, pinning and deleting were removed with the local state that backed
 * them: the messages collection has no columns for any of the three, so every one
 * of those controls changed only what this one browser tab displayed.
 */
const MessageBubble: React.FC<{
  msg: DiscussionMessage;
  isMe: boolean;
}> = ({ msg, isMe }) => {

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

        </div>
      </motion.div>
    );
  }

  // The poll branch was removed with the poll composer: messages has no poll
  // columns, so a rendered poll could only ever have come from local state, and
  // its vote buttons changed nothing. Squad chat has real polls.

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
          </div>


        </div>


        <span className={`font-mono text-[8px] text-text-muted mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>{msg.timestamp}</span>
      </div>
    </motion.div>
  );
};

// ─── Discussion Page ──────────────────────────────────────────────────────────
export const EventDiscussion: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || '';

  // The thread is the event's own conversation, delivered live. This page kept its
  // messages in component state, so a message vanished on navigation and no other
  // entrant ever saw it.
  const {
    messages: apiMessages, loading, error, refresh, sendMessage, sending,
  } = useEventDiscussion(id);
  // "48 live" was a hardcoded number. The entrant count is real.
  const { participants } = useEventParticipants(id);

  const messages: DiscussionMessage[] = apiMessages.map(m => ({
    id: m.$id,
    sender: m.sender?.full_name || 'Athlete',
    senderId: m.sender_id,
    avatar: m.sender?.avatar_url ?? '',
    type: 'text',
    content: m.content,
    timestamp: new Date(m.created_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    }),
    // Reactions, pinning and polls have no columns on the messages collection, so
    // they are gone rather than kept as page-local illusions that nobody else saw.
    reactions: [],
  }));

  const { event } = useEvent(id);
  // "isAdmin" was hardcoded true "for demo", so every entrant saw moderator
  // controls. The organizer is the real thing.
  const isAdmin = Boolean(event && currentUserId && event.organizer_id === currentUserId);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    try {
      await sendMessage(content);
    } catch {
      // Restored so nothing typed is lost; the hook reported the reason.
      setInput(content);
    }
  };





  // Nothing can be pinned without a column for it.
  const pinnedMessages: DiscussionMessage[] = [];

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
              <span className="font-mono text-[9px] text-text-muted">
                {participants.length} entrant{participants.length === 1 ? '' : 's'}
              </span>
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
        {loading ? (
          <div className="space-y-3 p-2" aria-busy="true" aria-label="Loading the discussion">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-14 rounded-[14px] bg-elevated animate-shimmer" />
            ))}
          </div>
        ) : error ? (
          <div className="m-2 p-5 rounded-[14px] bg-elevated border border-border-muted text-center space-y-2">
            <p className="font-mono text-[11px] text-text-primary font-bold uppercase">
              Discussion did not load
            </p>
            <p className="font-mono text-[10px] text-text-muted">{error.message}</p>
            <button onClick={() => refresh()}
              className="px-3 py-1.5 rounded-[8px] bg-volt text-volt-text font-mono text-[9px] font-bold uppercase">
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="m-2 p-6 rounded-[14px] bg-elevated border border-border-muted text-center space-y-1.5">
            <p className="font-mono text-[11px] text-text-primary font-bold uppercase">
              Nothing said yet
            </p>
            <p className="font-mono text-[10px] text-text-muted">
              Everyone entered in this event sees what you post here.
            </p>
          </div>
        ) : messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* The poll creator was removed with the state behind it: the messages
          collection has no poll columns, so a "posted" poll existed only in this
          tab. Squad chat has real polls (squad_messages.poll_data). */}

      {/* Input Bar */}
      <div className="flex-shrink-0 px-2 pb-3">
        <div className="flex items-center gap-2 rounded-[16px] px-3 py-2 border border-border-muted bg-elevated shadow-sm">
          {/* The poll and announcement buttons are gone: the poll had no columns
              to live in, and the announcement pushed a canned "New announcement
              from admin." into local state. Organizer announcements go out as
              notifications from the Manage screen, which reaches everyone. */}
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
