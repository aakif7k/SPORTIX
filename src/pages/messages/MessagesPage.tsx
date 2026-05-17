import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Smile, Search, Plus, ChevronLeft } from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_USERS, CURRENT_USER } from '../../services/mockData';
import type { Conversation, Message } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';

const timeStr = (ts: string) => new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts).getTime()) / 60000;
  if (d < 60) return `${Math.floor(d)}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  return `${Math.floor(d / 1440)}d`;
};

const ConversationItem: React.FC<{ conv: Conversation; active: boolean; onClick: () => void }> = ({ conv, active, onClick }) => {
  const partner = conv.participantDetails[0];
  return (
    <motion.div whileHover={{ x: 2 }} onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-volt/10 border border-volt/20' : 'hover:bg-white/3 border border-transparent'} ${conv.isEventChat ? 'border-l-2 border-l-hot/50' : ''}`}>
      <Avatar src={partner.avatar} name={partner.name} isOnline={partner.isOnline} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-label text-sm font-semibold text-white truncate">
            {conv.isEventChat ? conv.eventName : partner.name}
          </p>
          <span className="text-[10px] font-mono text-text-muted flex-shrink-0">{conv.lastMessage ? timeAgo(conv.lastMessage.timestamp) : ''}</span>
        </div>
        <p className="text-xs font-label text-text-secondary truncate">{conv.lastMessage?.content}</p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-volt text-black text-[9px] font-bold flex items-center justify-center">{conv.unreadCount}</span>
      )}
    </motion.div>
  );
};

const ChatBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    {!isOwn && (
      <div className="w-7 h-7 rounded-full bg-elevated border border-border-muted flex-shrink-0 overflow-hidden">
        <img src={`https://i.pravatar.cc/28?img=${message.senderId.charCodeAt(1)}`} alt="" className="w-full h-full object-cover" />
      </div>
    )}
    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-volt text-black rounded-tr-sm shadow-glow-volt-sm' : 'glass border border-border-muted text-white rounded-tl-sm'}`}>
      <p className={`text-sm font-label leading-relaxed ${isOwn ? 'text-black' : ''}`}>{message.content}</p>
      <p className={`text-[10px] font-mono mt-1 ${isOwn ? 'text-black/60 text-right' : 'text-text-muted'}`}>{timeStr(message.timestamp)}</p>
    </div>
  </motion.div>
);

export const MessagesPage: React.FC = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const endRef = useRef<HTMLDivElement>(null);

  const activeConv = MOCK_CONVERSATIONS.find(c => c.id === activeConvId);

  useEffect(() => {
    if (activeConvId) {
      setMessages(MOCK_MESSAGES[activeConvId] || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeConvId]);

  const openConv = (id: string) => { setActiveConvId(id); setMobileView('chat'); };

  const sendMessage = () => {
    if (!input.trim() || !activeConvId) return;
    const msg: Message = {
      id: `msg_${Date.now()}`, conversationId: activeConvId, senderId: CURRENT_USER.id,
      content: input.trim(), timestamp: new Date().toISOString(), read: true,
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.participantDetails[0].name.toLowerCase().includes(searchQ.toLowerCase()) ||
    (c.eventName || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  const partnerName = activeConv?.isEventChat ? activeConv.eventName : activeConv?.participantDetails[0].name;

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-border-muted glass -mx-4 -mt-4">
      {/* Left: Conversation List */}
      <div className={`w-full md:w-72 flex-shrink-0 border-r border-border-muted flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-border-muted">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-white tracking-wide">HUDDLE</h2>
            <button className="w-8 h-8 rounded-lg bg-volt text-black flex items-center justify-center hover:shadow-glow-volt-sm transition-all"><Plus size={16} /></button>
          </div>
          <Input placeholder="Search conversations..." value={searchQ} onChange={e => setSearchQ(e.target.value)} icon={<Search size={14} />} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(conv => (
            <ConversationItem key={conv.id} conv={conv} active={activeConvId === conv.id} onClick={() => openConv(conv.id)} />
          ))}
        </div>
      </div>

      {/* Right: Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border-muted">
              <button onClick={() => setMobileView('list')} className="md:hidden text-text-secondary hover:text-volt"><ChevronLeft size={18} /></button>
              <Avatar src={activeConv.participantDetails[0].avatar} name={activeConv.participantDetails[0].name} isOnline={activeConv.participantDetails[0].isOnline} size="sm" />
              <div>
                <p className="font-label text-sm font-semibold text-white">{partnerName}</p>
                <p className="text-[10px] font-mono text-text-secondary">{activeConv.participantDetails[0].isOnline ? '🟢 Active now' : 'Offline'}</p>
              </div>
              {activeConv.isEventChat && <span className="ml-auto text-xs px-2 py-1 rounded border border-hot/30 text-hot font-label">Event Chat</span>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === CURRENT_USER.id} />
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border-muted flex gap-2">
              <button className="p-2 rounded-lg text-text-secondary hover:text-volt hover:bg-volt/10 transition-all"><Image size={18} /></button>
              <button className="p-2 rounded-lg text-text-secondary hover:text-volt hover:bg-volt/10 transition-all"><Smile size={18} /></button>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..." className="flex-1 bg-elevated border border-border-muted rounded-xl px-4 py-2 font-mono text-sm text-white placeholder-text-muted outline-none focus:border-volt/50 transition-all"
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-volt flex items-center justify-center disabled:opacity-40 hover:shadow-glow-volt-sm transition-all">
                <Send size={16} className="text-black" />
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-4">
                <Send size={28} className="text-volt" />
              </div>
              <h3 className="font-display text-2xl text-white mb-2">OPEN A HUDDLE</h3>
              <p className="text-text-secondary font-label text-sm">Choose a conversation from the left to start huddling</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
