import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, Image as ImageIcon, Smile, Search, Plus, ChevronLeft, 
  Phone, Video, MoreVertical, Paperclip, CheckCheck, Sparkles
} from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, CURRENT_USER } from '../../services/mockData';
import type { Message } from '../../types';
import { Avatar } from '../../components/ui/Avatar';

const timeStr = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts).getTime()) / 60000;
  if (d < 60) return `${Math.floor(d)}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  return `${Math.floor(d / 1440)}d`;
};

export const MessagesPage: React.FC = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(MOCK_CONVERSATIONS[0]?.id || null);
  // Only the locally composed messages are stored, keyed by conversation. The
  // rendered thread is derived below, so switching conversations no longer needs
  // an effect to copy the base thread into state
  // (react-hooks/set-state-in-effect).
  const [sentByConv, setSentByConv] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'squad'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const endRef = useRef<HTMLDivElement>(null);

  const activeConv = MOCK_CONVERSATIONS.find(c => c.id === activeConvId);

  const messages: Message[] = activeConvId
    ? [...(MOCK_MESSAGES[activeConvId] || []), ...(sentByConv[activeConvId] || [])]
    : [];

  // Scrolling is a real DOM side effect, so it stays in an effect — but it no
  // longer sets state, and the timeout is now cleared on change/unmount.
  useEffect(() => {
    if (!activeConvId) return;
    const timer = setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: 'smooth' }),
      100
    );
    return () => clearTimeout(timer);
  }, [activeConvId]);

  const openConv = (id: string) => {
    setActiveConvId(id);
    setMobileView('chat');
  };

  const handleSendMessage = () => {
    if (!input.trim() || !activeConvId) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConvId,
      senderId: CURRENT_USER.id,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    setSentByConv(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setInput('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const filteredConversations = MOCK_CONVERSATIONS.filter(c => {
    const partnerName = c.participantDetails[0]?.name || '';
    const eventName = c.eventName || '';
    const matchesSearch = partnerName.toLowerCase().includes(searchQ.toLowerCase()) || eventName.toLowerCase().includes(searchQ.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterTab === 'squad') return c.isEventChat;
    if (filterTab === 'direct') return !c.isEventChat;
    return true;
  });

  const partner = activeConv?.participantDetails[0];
  const chatTitle = activeConv?.isEventChat ? activeConv.eventName : partner?.name;

  return (
    <div className="w-full h-[calc(100vh-120px)] flex overflow-hidden rounded-3xl border border-border-muted/80 bg-[#080808]/90 backdrop-blur-xl shadow-2xl">
      
      {/* ── LEFT: CONVERSATION LIST SIDEBAR ────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border-muted/60 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-border-muted/60 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              HUDDLE MESSAGES
            </h1>
            <button className="w-8 h-8 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold flex items-center justify-center transition-all shadow-[0_0_12px_rgba(204,255,0,0.3)]">
              <Plus size={16} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search athletes or squads..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#CCFF00]/40 font-mono transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'All' },
              { id: 'direct', label: 'Direct' },
              { id: 'squad', label: 'Squads' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase transition-all ${
                  filterTab === tab.id
                    ? 'bg-[#CCFF00] text-black shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {filteredConversations.map(conv => {
            const p = conv.participantDetails[0];
            const isActive = activeConvId === conv.id;
            const isSquad = conv.isEventChat;

            return (
              <motion.div
                key={conv.id}
                whileHover={{ x: 2 }}
                onClick={() => openConv(conv.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                  isActive 
                    ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 shadow-glow-volt-sm' 
                    : 'hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={p?.avatar} name={p?.name || 'Athlete'} isOnline={p?.isOnline} size="md" />
                  {isSquad && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-[#00D4FF] text-black text-[8px] font-mono font-bold uppercase">
                      Squad
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-[#CCFF00]' : 'text-white'}`}>
                      {isSquad ? conv.eventName : p?.name}
                    </p>
                    <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                      {conv.lastMessage ? timeAgo(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-text-secondary truncate">
                    {conv.lastMessage?.content}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#CCFF00] text-black text-[10px] font-mono font-bold flex items-center justify-center shadow-[0_0_8px_rgba(204,255,0,0.5)]">
                    {conv.unreadCount}
                  </span>
                )}
              </motion.div>
            );
          })}
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

                <Avatar src={partner?.avatar} name={partner?.name || 'Athlete'} isOnline={partner?.isOnline} size="sm" />

                <div>
                  <h2 className="font-sans font-bold text-sm text-white">{chatTitle}</h2>
                  <p className="font-mono text-[10px] text-text-muted flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${partner?.isOnline ? 'bg-[#CCFF00] animate-pulse' : 'bg-text-muted'}`} />
                    {partner?.isOnline ? 'Active Now' : 'Offline'}
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
              {messages.map(msg => {
                const isOwn = msg.senderId === CURRENT_USER.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isOwn && (
                      <img 
                        src={partner?.avatar || 'https://i.pravatar.cc/100?img=33'} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10" 
                      />
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
                        <span>{timeStr(msg.timestamp)}</span>
                        {isOwn && <CheckCheck size={12} className="text-black/80" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
                  className="p-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex-shrink-0"
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
