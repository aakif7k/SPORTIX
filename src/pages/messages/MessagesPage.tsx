import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, Image as ImageIcon, Smile, Search, Plus, ChevronLeft, 
  MoreVertical, Paperclip, CheckCheck, Sparkles, UserX
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getCurrentUser } from '../../lib/authService';
import { client, DATABASE_ID, COLLECTIONS } from '../../lib/appwrite';
import { 
  getUserConversations, 
  getConversationMessages, 
  sendMessage, 
  getOrCreateConversation, 
  markConversationAsRead,
  type ConversationSummary, 
  type DbMessage 
} from '../../services/messageService';
import { getProfile, profileToUserShape, searchProfiles, type ProfileSummary } from '../../services/profileService';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const timeStr = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts).getTime()) / 60000;
  if (d < 60) return `${Math.floor(d)}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  return `${Math.floor(d / 1440)}d`;
};

export const MessagesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);

  const [effectiveUserId, setEffectiveUserId] = useState<string>(authUser?.id || '');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSummary[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authUser?.id) {
      setEffectiveUserId(authUser.id);
    } else {
      getCurrentUser().then(u => {
        if (u?.id) setEffectiveUserId(u.id);
      });
    }
  }, [authUser?.id]);

  const currentUserId = effectiveUserId;

  // ── Load conversations from Appwrite ──────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    const convs = await getUserConversations(currentUserId);
    setConversations(convs);
    setLoadingConvs(false);
    return convs;
  }, [currentUserId]);

  // Handle URL target user navigation (e.g., /app/messages?user=xyz or state.userId)
  useEffect(() => {
    if (!currentUserId) return;

    const queryParams = new URLSearchParams(location.search);
    const targetUserId = queryParams.get('user') || (location.state as any)?.userId;

    loadConversations().then(async (convs) => {
      if (targetUserId) {
        const targetProf = await getProfile(targetUserId);
        const convId = await getOrCreateConversation(currentUserId, targetUserId);
        if (convId) {
          const userShape = targetProf ? profileToUserShape(targetProf) : null;
          const syntheticConv: ConversationSummary = {
            id: convId,
            partner: {
              id: targetProf?.id || targetUserId,
              name: targetProf?.full_name || targetProf?.username || 'Athlete',
              username: targetProf?.username || 'athlete',
              avatar: userShape?.avatar || `https://i.pravatar.cc/150?u=${targetUserId}`,
              isOnline: true,
            },
            lastMessage: undefined,
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
          };

          setConversations(prev => {
            const exists = prev.some(c => c.id === convId);
            return exists ? prev.map(c => c.id === convId ? { ...c, partner: syntheticConv.partner } : c) : [syntheticConv, ...prev];
          });
          setActiveConvId(convId);
          setMobileView('chat');
        }
      } else if (convs && convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
      }
    });
  }, [currentUserId, location.search, location.state]);

  // Load active conversation messages & mark as read
  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await getConversationMessages(convId);
    setMessages(msgs);
    if (currentUserId) {
      await markConversationAsRead(convId, currentUserId);
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
      );
    }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [currentUserId]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // Appwrite Realtime Subscriptions for Messages and Conversations
  useEffect(() => {
    if (!currentUserId) return;

    const msgsChannel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`;
    const convsChannel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.CONVERSATIONS}.documents`;

    const unsubscribe = client.subscribe([msgsChannel, convsChannel], (response: any) => {
      loadConversations();
      if (activeConvId && response.payload && response.payload.conversation_id === activeConvId) {
        loadMessages(activeConvId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId, activeConvId, loadConversations, loadMessages]);

  // User search debounce in sidebar
  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      const results = await searchProfiles(searchQ);
      setSearchResults(results.filter(p => p.id !== currentUserId));
      setSearchingUsers(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQ, currentUserId]);

  const openConv = (convId: string) => {
    setActiveConvId(convId);
    setMobileView('chat');
  };

  const handleStartChatWithUser = async (targetUser: ProfileSummary | string) => {
    if (!currentUserId) return;
    const targetId = typeof targetUser === 'string' ? targetUser : targetUser.id;
    const targetProf = typeof targetUser === 'string' ? await getProfile(targetId) : targetUser;

    const convId = await getOrCreateConversation(currentUserId, targetId);
    if (convId) {
      const avatarUrl = (targetProf as any)?.profile_image_url || (targetProf as any)?.avatar_url || (targetProf as any)?.avatar || `https://i.pravatar.cc/150?u=${targetId}`;
      const syntheticConv: ConversationSummary = {
        id: convId,
        partner: {
          id: (targetProf as any)?.id || targetId,
          name: (targetProf as any)?.full_name || (targetProf as any)?.username || 'Athlete',
          username: (targetProf as any)?.username || 'athlete',
          avatar: avatarUrl,
          isOnline: true,
        },
        lastMessage: undefined,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setConversations(prev => {
        const exists = prev.some(c => c.id === convId);
        return exists ? prev.map(c => c.id === convId ? { ...c, partner: syntheticConv.partner } : c) : [syntheticConv, ...prev];
      });

      setSearchQ('');
      setSearchResults([]);
      setActiveConvId(convId);
      setMobileView('chat');
    } else {
      toast.error('Could not start conversation with athlete.');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConvId || !currentUserId) return;
    const text = input.trim();
    setInput('');

    // Optimistic UI insert
    const tempMsg: DbMessage = {
      $id: `temp_${Date.now()}`,
      conversation_id: activeConvId,
      sender_id: currentUserId,
      message: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    const sent = await sendMessage(activeConvId, currentUserId, text);
    if (sent) {
      setMessages(prev => prev.map(m => m.$id === tempMsg.$id ? sent : m));
      loadConversations();
    } else {
      toast.error('Failed to send message.');
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const partner = activeConv?.partner;

  return (
    <div className="w-full h-[calc(100vh-120px)] flex overflow-hidden rounded-3xl border border-border-muted bg-surface backdrop-blur-xl shadow-2xl">
      
      {/* ── LEFT: CONVERSATION LIST SIDEBAR ────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border-muted flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-border-muted space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
              HUDDLE MESSAGES
            </h1>
            <button
              onClick={() => navigate('/app/discover')}
              className="w-8 h-8 rounded-xl bg-accent hover:bg-accent/90 text-volt-text font-bold flex items-center justify-center transition-all shadow-md"
              title="Discover Athletes"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search real athletes to chat..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono transition-all"
            />
          </div>
        </div>

        {/* User Search Dropdown Overlay */}
        {searchQ.trim() !== '' && (
          <div className="p-2 border-b border-border-muted bg-elevated shadow-xl space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
            <div className="px-2 py-1 text-[10px] text-text-muted uppercase font-bold">Search Results ({searchResults.length})</div>
            {searchingUsers && <div className="px-2 py-2 text-text-muted">Searching Appwrite...</div>}
            {!searchingUsers && searchResults.length === 0 && (
              <div className="px-2 py-2 text-text-muted">No athletes found.</div>
            )}
            {searchResults.map(user => (
              <div
                key={user.id}
                onClick={() => handleStartChatWithUser(user)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface cursor-pointer transition-all border border-transparent hover:border-border-muted"
              >
                <img src={user.profile_image_url || user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="w-8 h-8 rounded-full object-cover border border-border-muted" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate">{user.full_name || user.username}</p>
                  <p className="text-[10px] text-accent font-semibold">@{user.username || 'athlete'} · {user.sport}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {loadingConvs && (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="font-mono text-xs text-text-muted">Loading chats...</span>
            </div>
          )}

          {!loadingConvs && conversations.length === 0 && searchQ === '' && (
            <div className="flex flex-col items-center justify-center py-12 text-center p-4 space-y-3">
              <UserX size={36} className="text-text-muted opacity-50" />
              <p className="font-sans font-bold text-sm text-text-primary">No conversations yet.</p>
              <p className="font-mono text-xs text-text-muted">
                Search athletes above or explore Discover to start chatting!
              </p>
              <button
                onClick={() => navigate('/app/discover')}
                className="px-4 py-2 rounded-xl bg-accent text-volt-text font-mono font-bold text-xs uppercase shadow-md"
              >
                Discover Athletes
              </button>
            </div>
          )}

          {!loadingConvs && conversations.map(conv => {
            const p = conv.partner;
            const isActive = activeConvId === conv.id;

            return (
              <motion.div
                key={conv.id}
                whileHover={{ x: 2 }}
                onClick={() => openConv(conv.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                  isActive 
                    ? 'bg-accent/15 border-accent/40 shadow-sm' 
                    : 'hover:bg-elevated/50 border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={p.avatar} name={p.name || 'Athlete'} isOnline={p.isOnline} size="md" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-accent font-black' : 'text-text-primary'}`}>
                      {p.name}
                    </p>
                    <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                      {conv.lastMessage ? timeAgo(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-text-secondary truncate">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-volt-text text-[10px] font-mono font-bold flex items-center justify-center shadow-md">
                    {conv.unreadCount}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* ── RIGHT: ACTIVE CHAT PANEL ───────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-surface/50 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConv && partner ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-border-muted flex items-center justify-between bg-surface/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView('list')} 
                  className="md:hidden text-text-secondary hover:text-text-primary p-1 rounded-xl hover:bg-elevated"
                >
                  <ChevronLeft size={20} />
                </button>

                <Avatar src={partner.avatar} name={partner.name || 'Athlete'} isOnline={partner.isOnline} size="sm" />

                <div>
                  <h2 className="font-sans font-bold text-sm text-text-primary">{partner.name}</h2>
                  <p className="font-mono text-[10px] text-text-muted flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${partner.isOnline ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
                    {partner.isOnline ? 'Active Now' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
              {messages.map(msg => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <motion.div
                    key={msg.$id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isOwn && (
                      <img 
                        src={partner.avatar || 'https://i.pravatar.cc/100?img=33'} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border-muted" 
                      />
                    )}

                    <div className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-accent text-volt-text rounded-tr-xs font-semibold shadow-md' 
                        : 'bg-elevated border border-border-muted text-text-primary rounded-tl-xs'
                    }`}>
                      <p className="text-xs font-sans leading-relaxed">{msg.message}</p>
                      <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] font-mono ${
                        isOwn ? 'opacity-80' : 'text-text-muted'
                      }`}>
                        <span>{timeStr(msg.created_at)}</span>
                        {isOwn && <CheckCheck size={12} className="opacity-90" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-border-muted bg-surface/80 backdrop-blur">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                  <Paperclip size={18} />
                </button>
                <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                  <ImageIcon size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono transition-all"
                />

                <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated transition-colors">
                  <Smile size={18} />
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendMessage}
                  className="p-2.5 rounded-xl bg-accent hover:bg-accent/90 text-volt-text font-bold transition-all shadow-md flex-shrink-0"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles size={28} />
            </div>
            <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Select a Conversation</h3>
            <p className="font-mono text-xs text-text-muted max-w-xs">
              Chat with squad teammates, coordinate upcoming tournament clashes, or message athletes directly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
