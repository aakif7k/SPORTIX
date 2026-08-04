import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Image as ImageIcon, Smile, Search, Plus, ChevronLeft,
  Phone, Video, MoreVertical, Paperclip, CheckCheck, Sparkles, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useConversations, useConversationFilter, useThread, useOpenConversation,
  useMarkReadOnView,
} from '@/hooks/useMessages';
import { api } from '@/lib/api';
import type { ApiParticipant } from '@/types/api.types';
import { Avatar } from '../../components/ui/Avatar';

const timeStr = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts).getTime()) / 60000;
  if (d < 60) return `${Math.floor(d)}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  return `${Math.floor(d / 1440)}d`;
};

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { conversations, loading, error, refresh } = useConversations();
  const { filtered, search, setSearch, tab, setTab } = useConversationFilter(conversations);
  const { openConversation, opening } = useOpenConversation();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [composing, setComposing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.$id === activeConvId) ?? null;
  const {
    messages, loading: threadLoading, error: threadError, refresh: refreshThread,
    sendMessage, sending, markRead,
  } = useThread(activeConvId ?? undefined);

  // Opening a thread, and every message that lands while it is open, moves the
  // read marker — which is what the server derives unread counts from.
  useMarkReadOnView(activeConvId ?? undefined, markRead, messages[messages.length - 1]?.$id);

  // Scrolling is a real DOM side effect, so it stays in an effect — but it no
  // longer sets state, and the timeout is now cleared on change/unmount.
  useEffect(() => {
    if (!activeConvId) return;
    const timer = setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: 'smooth' }),
      100
    );
    return () => clearTimeout(timer);
  }, [activeConvId, messages.length]);

  const openConv = (id: string) => {
    setActiveConvId(id);
    setMobileView('chat');
  };

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || !activeConvId || sending) return;
    // Cleared up front so the box feels immediate, and restored if the send
    // fails — losing what someone typed is worse than a stale input.
    setInput('');
    try {
      await sendMessage({ content });
    } catch {
      setInput(content);
    }
  };

  const startConversation = async (participant: ApiParticipant) => {
    try {
      const conversation = await openConversation(participant.user_id);
      setComposing(false);
      setSearch('');
      openConv(conversation.$id);
    } catch {
      // useOpenConversation has already surfaced the reason.
    }
  };

  const partner = activeConv?.participants?.[0];
  const chatTitle = activeConv?.is_event_chat ? activeConv.event_name : partner?.full_name;
  // There is no presence service, so rather than show a hardcoded status this
  // reports the thread's own last activity, which is real.
  const lastActivity = activeConv?.last_message_at;

  return (
    <div className="w-full h-[calc(100vh-120px)] flex overflow-hidden rounded-3xl border border-border-muted/80 bg-[#080808]/90 backdrop-blur-xl shadow-2xl">

      {/* ── LEFT: CONVERSATION LIST SIDEBAR ────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border-muted/60 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>

        {/* Header & Search */}
        <div className="p-4 border-b border-border-muted/60 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              {composing ? 'NEW MESSAGE' : 'HUDDLE MESSAGES'}
            </h1>
            <button
              onClick={() => { setComposing(!composing); setSearch(''); }}
              aria-label={composing ? 'Cancel new message' : 'Start a new conversation'}
              className="w-8 h-8 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold flex items-center justify-center transition-all shadow-[0_0_12px_rgba(204,255,0,0.3)]"
            >
              {composing ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={composing ? 'Search athletes by name or handle...' : 'Search athletes or squads...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#CCFF00]/40 font-mono transition-all"
            />
          </div>

          {/* Category Filters */}
          {!composing && (
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-white/5">
              {[
                { id: 'all', label: 'All' },
                { id: 'direct', label: 'Direct' },
                { id: 'squad', label: 'Squads' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as 'all' | 'direct' | 'squad')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase transition-all ${
                    tab === t.id
                      ? 'bg-[#CCFF00] text-black shadow-sm'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {composing ? (
            <PeoplePicker
              query={search}
              busy={opening}
              excludeUserId={currentUserId}
              onPick={startConversation}
            />
          ) : loading ? (
            <div aria-busy="true" aria-label="Loading conversations" className="space-y-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-transparent">
                  <div className="w-10 h-10 rounded-full bg-[#141414] animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-[#141414] animate-shimmer" />
                    <div className="h-2 w-2/3 rounded bg-[#141414] animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="m-2 p-5 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wide">Messages did not load</p>
              <p className="text-[11px] font-mono text-text-muted">{error.message}</p>
              <button
                onClick={() => refresh()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CCFF00] text-black text-[10px] font-mono font-bold uppercase hover:bg-[#b8e600] transition-colors"
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="m-2 p-6 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-2">
              <p className="text-xs font-bold text-white uppercase tracking-wide">
                {conversations.length === 0 ? 'No conversations yet' : 'Nothing matches'}
              </p>
              <p className="text-[11px] font-mono text-text-muted">
                {conversations.length === 0
                  ? 'Tap + to message an athlete directly.'
                  : 'Try a different name or switch tabs.'}
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const p = conv.participants?.[0];
              const isActive = activeConvId === conv.$id;
              const isSquad = conv.is_event_chat;

              return (
                <motion.div
                  key={conv.$id}
                  whileHover={{ x: 2 }}
                  onClick={() => openConv(conv.$id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 shadow-glow-volt-sm'
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={p?.avatar_url ?? undefined} name={p?.full_name || 'Athlete'} size="md" />
                    {isSquad && (
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-[#00D4FF] text-black text-[8px] font-mono font-bold uppercase">
                        Squad
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-[#CCFF00]' : 'text-white'}`}>
                        {isSquad ? conv.event_name : p?.full_name}
                      </p>
                      <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-text-secondary truncate">
                      {conv.last_message ?? 'No messages yet'}
                    </p>
                  </div>

                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#CCFF00] text-black text-[10px] font-mono font-bold flex items-center justify-center shadow-[0_0_8px_rgba(204,255,0,0.5)]">
                      {conv.unread_count}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

      </div>

      {/* ── RIGHT: ACTIVE CHAT PANEL ───────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#0A0A0A] ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-border-muted/60 flex items-center justify-between bg-surface/40 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden text-text-secondary hover:text-white p-1 rounded-xl hover:bg-white/10"
                >
                  <ChevronLeft size={20} />
                </button>

                <Avatar src={partner?.avatar_url ?? undefined} name={partner?.full_name || 'Athlete'} size="sm" />

                <div>
                  <h2 className="font-sans font-bold text-sm text-white">{chatTitle}</h2>
                  <p className="font-mono text-[10px] text-text-muted flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lastActivity ? 'bg-[#CCFF00]' : 'bg-text-muted'}`} />
                    {lastActivity ? `Last message ${timeAgo(lastActivity)} ago` : 'No messages yet'}
                  </p>
                </div>
              </div>

              {/* Call & Action Buttons */}
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                  <Phone size={16} />
                </button>
                <button className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                  <Video size={16} />
                </button>
                <button className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
              {threadLoading ? (
                <div aria-busy="true" aria-label="Loading messages" className="space-y-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="h-12 rounded-2xl bg-[#141414] animate-shimmer"
                        style={{ width: `${45 + (i % 3) * 12}%` }}
                      />
                    </div>
                  ))}
                </div>
              ) : threadError ? (
                <div className="mx-auto max-w-sm p-6 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-3">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">This thread did not load</p>
                  <p className="text-[11px] font-mono text-text-muted">{threadError.message}</p>
                  <button
                    onClick={() => refreshThread()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CCFF00] text-black text-[10px] font-mono font-bold uppercase hover:bg-[#b8e600] transition-colors"
                  >
                    <RefreshCw size={11} /> Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="mx-auto max-w-sm p-6 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">No messages yet</p>
                  <p className="text-[11px] font-mono text-text-muted">
                    Say something to {partner?.full_name || 'this athlete'} — they will see it live.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender_id === currentUserId;
                  const avatar = isOwn
                    ? undefined
                    : msg.sender?.avatar_url ?? partner?.avatar_url ?? undefined;
                  return (
                    <motion.div
                      key={msg.$id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isOwn && (
                        <div className="flex-shrink-0">
                          <Avatar
                            src={avatar}
                            name={msg.sender?.full_name || partner?.full_name || 'Athlete'}
                            size="sm"
                          />
                        </div>
                      )}

                      <div className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 rounded-2xl ${
                        isOwn
                          ? 'bg-[#CCFF00] text-black rounded-tr-xs font-semibold shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                          : 'bg-[#141414] border border-white/10 text-white rounded-tl-xs'
                      }`}>
                        <p className="text-xs font-sans leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] font-mono ${
                          isOwn ? 'text-black/70' : 'text-text-muted'
                        }`}>
                          <span>{timeStr(msg.created_at)}</span>
                          {isOwn && <CheckCheck size={12} className="text-black/80" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-border-muted/60 bg-surface/40 backdrop-blur">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                  <Paperclip size={18} />
                </button>
                <button className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                  <ImageIcon size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Type a message or squad prompt..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#CCFF00]/40 font-mono transition-all"
                />

                <button className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                  <Smile size={18} />
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendMessage}
                  disabled={sending || !input.trim()}
                  className="p-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
              <Sparkles size={28} />
            </div>
            <h3 className="font-sans font-bold text-base text-white uppercase tracking-wider">Select a Conversation</h3>
            <p className="font-mono text-xs text-text-muted max-w-xs">
              Chat with squad teammates, coordinate upcoming ClashHub tournaments, or message athletes directly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

/**
 * People search for starting a thread. Without this the DM feature is
 * unreachable: the + button had no behaviour, and a conversation only exists
 * once someone picks who to open it with.
 */
const PeoplePicker: React.FC<{
  query: string;
  busy: boolean;
  excludeUserId?: string;
  onPick: (participant: ApiParticipant) => void;
}> = ({ query, busy, excludeUserId, onPick }) => {
  const [results, setResults] = useState<ApiParticipant[]>([]);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');

  // "Too short to search" is derivable from the query, so it is computed here
  // rather than stored — writing it into state from the effect would set state
  // synchronously on every keystroke below the threshold.
  const needle = query.trim();
  const tooShort = needle.length < 2;

  useEffect(() => {
    if (tooShort) return;

    const controller = new AbortController();
    // Debounced, so typing a name is one request per pause rather than one per
    // keystroke, and the in-flight request is aborted when the query moves on.
    const timer = setTimeout(() => {
      setState('loading');
      api.get<{ data: { users?: Array<Record<string, unknown>> } }>(
        `/api/search/?type=users&q=${encodeURIComponent(needle)}`,
        { signal: controller.signal },
      ).then(res => {
        const users = (res.data?.users ?? [])
          .map(u => ({
            user_id: String(u.$id ?? ''),
            full_name: String(u.full_name ?? ''),
            username: String(u.username ?? ''),
            avatar_url: (u.avatar_url as string | null) ?? null,
            sport: String(u.sport ?? ''),
          }))
          .filter(u => u.user_id && u.user_id !== excludeUserId);
        setResults(users);
        setState('ready');
      }).catch(() => {
        if (!controller.signal.aborted) {
          setResults([]);
          setState('error');
        }
      });
    }, 300);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [needle, tooShort, excludeUserId]);

  if (tooShort) {
    return (
      <div className="m-2 p-6 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-2">
        <p className="text-xs font-bold text-white uppercase tracking-wide">Find an athlete</p>
        <p className="text-[11px] font-mono text-text-muted">
          Type at least two characters of a name or handle.
        </p>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div aria-busy="true" aria-label="Searching athletes" className="space-y-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-[#141414] animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-[#141414] animate-shimmer" />
              <div className="h-2 w-1/4 rounded bg-[#141414] animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="m-2 p-5 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-2">
        <p className="text-xs font-bold text-white uppercase tracking-wide">Search failed</p>
        <p className="text-[11px] font-mono text-text-muted">Check your connection and type again.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="m-2 p-6 rounded-2xl bg-[#141414] border border-border-muted text-center space-y-2">
        <p className="text-xs font-bold text-white uppercase tracking-wide">No athletes found</p>
        <p className="text-[11px] font-mono text-text-muted">Try a different name or handle.</p>
      </div>
    );
  }

  return (
    <>
      {results.map(person => (
        <motion.div
          key={person.user_id}
          whileHover={{ x: 2 }}
          onClick={() => !busy && onPick(person)}
          className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent transition-all ${
            busy ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-white/5'
          }`}
        >
          <Avatar src={person.avatar_url ?? undefined} name={person.full_name || 'Athlete'} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{person.full_name}</p>
            <p className="text-[11px] font-mono text-text-muted truncate">
              @{person.username}{person.sport ? ` · ${person.sport}` : ''}
            </p>
          </div>
        </motion.div>
      ))}
    </>
  );
};
